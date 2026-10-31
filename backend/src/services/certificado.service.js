/**
 * @file certificado.service.js
 * @description Certificado digital y código QR (bloque 2.4): requisitos de cierre, token UUID v4,
 *              QR de la URL pública, vista pública del certificado, página pública de estatus
 *              y lista de certificados emitidos.
 * @task T20, T21, T23 (RF-10, RF-11, RF-12, RF-15; pantallas P12–P16)
 * @author María Fernanda González Rodríguez
 */
const crypto = require('node:crypto');
const QRCode = require('qrcode');
const config = require('../config');
const { db } = require('../db/conexion');
const { HttpError } = require('../utils/errores');

const ESTADOS = ['Recibido', 'Diagnóstico', 'Reparación', 'Pruebas', 'Entregado'];
const MSG_NO_ENCONTRADO =
  'Certificado no encontrado. Verifique que el enlace o código QR corresponda a un certificado emitido por el taller';

const urlEvidencia = (ruta) => `/uploads/${ruta}`;
const urlEstatus = (token) => `${config.publicBaseUrl}/estatus/${token}`;

const contarEvidencias = (ordenId, tipo) =>
  db.prepare('SELECT COUNT(*) AS n FROM evidencias WHERE orden_id = ? AND tipo = ?').get(ordenId, tipo).n;

/**
 * Genera el QR (PNG en data URL) de una URL.
 *
 * @param {string} url
 * @returns {Promise<string>}
 */
const generarQr = (url) => QRCode.toDataURL(url, { errorCorrectionLevel: 'M', width: 512, margin: 2 });

/**
 * Estado de la garantía en tiempo real (RF-09).
 *
 * @param {Object} orden - Fila de `ordenes`.
 * @returns {Object|null} null si aún no se registra la garantía.
 */
function resumenGarantia(orden) {
  if (orden.dias_garantia === null) return null;
  let estado = 'Pendiente de entrega';
  let diasRestantes = null;
  if (orden.garantia_fin) {
    const restanteMs = new Date(orden.garantia_fin).getTime() - Date.now();
    estado = restanteMs >= 0 ? 'Vigente' : 'Vencida';
    diasRestantes = Math.max(0, Math.ceil(restanteMs / (24 * 60 * 60 * 1000)));
  }
  return {
    dias: orden.dias_garantia,
    terminos: orden.terminos_garantia,
    inicio: orden.fecha_entrega,
    fin: orden.garantia_fin,
    estado,
    dias_restantes: diasRestantes,
  };
}

/**
 * Lista lo que falta para poder entregar la orden y emitir su certificado (RF-10).
 *
 * @param {Object} orden - Fila de `ordenes`.
 * @returns {string[]} Vacío si cumple todos los requisitos.
 */
function requisitosPendientes(orden) {
  const pendientes = [];
  if (contarEvidencias(orden.id, 'antes') < 1) pendientes.push('Falta al menos una fotografía de recepción (antes)');
  if (contarEvidencias(orden.id, 'despues') < 1) pendientes.push('Falta al menos una fotografía de entrega (después)');
  if (orden.dias_garantia === null || !orden.terminos_garantia) {
    pendientes.push('Debe registrar los términos y días de garantía antes de finalizar y entregar la orden');
  }
  const recorridos = new Set(
    db
      .prepare("SELECT estado FROM historial_estados WHERE orden_id = ? AND tipo = 'estado'")
      .all(orden.id)
      .map((h) => h.estado),
  );
  for (const etapa of ['Diagnóstico', 'Reparación', 'Pruebas']) {
    if (!recorridos.has(etapa)) pendientes.push(`La orden no ha pasado por la etapa de ${etapa}`);
  }
  return pendientes;
}

/**
 * Registra el certificado con un token UUID v4 no secuencial. Se llama dentro de la
 * transacción que marca la orden como Entregado.
 *
 * @param {number} ordenId
 * @param {string} fecha - Fecha de emisión (ISO).
 * @returns {{token_uuid: string, url_publica: string}}
 */
function emitir(ordenId, fecha) {
  const token = crypto.randomUUID();
  const url = `${config.publicBaseUrl}/verificar/${token}`;
  db.prepare('INSERT INTO certificados (orden_id, token_uuid, url_publica, fecha_emision) VALUES (?, ?, ?, ?)').run(
    ordenId,
    token,
    url,
    fecha,
  );
  return { token_uuid: token, url_publica: url };
}

/**
 * Datos del certificado imprimible + QR. El QR se genera a partir de la URL guardada,
 * así que si falla se puede volver a pedir sin tocar la orden (RF-11).
 *
 * @param {number} ordenId
 * @returns {Promise<{token_uuid: string, url_publica: string, fecha_emision: string, qr: string}>}
 * @throws {HttpError} 404 si la orden aún no tiene certificado.
 */
async function certificadoConQr(ordenId) {
  const certificado = db
    .prepare('SELECT token_uuid, url_publica, fecha_emision FROM certificados WHERE orden_id = ?')
    .get(ordenId);
  if (!certificado) throw new HttpError(404, 'La orden aún no tiene certificado (debe estar en estado Entregado)');
  return { ...certificado, qr: await generarQr(certificado.url_publica) };
}

/**
 * QR de la página de estatus para la nota de servicio de recepción (P12).
 *
 * @param {string} url - URL de estatus de la orden (`urlEstatus(token_estatus)`).
 * @returns {Promise<{url_estatus: string, qr: string}>}
 */
async function qrEstatus(url) {
  return { url_estatus: url, qr: await generarQr(url) };
}

/**
 * Enmascara el IMEI/serie dejando solo los últimos 4 caracteres (RF-12).
 *
 * @param {string} valor
 * @returns {string} p. ej. `***********1234`.
 */
function enmascarar(valor) {
  return valor.slice(-4).padStart(valor.length, '*');
}

/** Fotos públicas de la orden agrupadas por etapa. */
function evidenciasPublicas(ordenId) {
  const evidencias = db
    .prepare('SELECT tipo, ruta_archivo FROM evidencias WHERE orden_id = ? ORDER BY id')
    .all(ordenId)
    .map((e) => ({ tipo: e.tipo, url: urlEvidencia(e.ruta_archivo) }));
  return {
    antes: evidencias.filter((e) => e.tipo === 'antes').map((e) => e.url),
    despues: evidencias.filter((e) => e.tipo === 'despues').map((e) => e.url),
  };
}

/**
 * Vista pública del certificado (P16). Omite nombre, teléfono y correo del cliente (LFPDPPP).
 *
 * @param {string} token - UUID del certificado.
 * @returns {Object}
 * @throws {HttpError} 404 si el token no corresponde a un certificado emitido.
 */
function vistaPublica(token) {
  const fila = db
    .prepare(
      `SELECT c.token_uuid, c.fecha_emision, o.*, d.tipo, d.marca, d.modelo, d.imei_o_serie
         FROM certificados c
         JOIN ordenes o ON o.id = c.orden_id
         JOIN dispositivos d ON d.id = o.dispositivo_id
        WHERE c.token_uuid = ? AND o.estado = 'Entregado'`,
    )
    .get(token);
  if (!fila) throw new HttpError(404, MSG_NO_ENCONTRADO);
  const reparaciones = db
    .prepare("SELECT COUNT(*) AS n FROM ordenes WHERE dispositivo_id = ? AND estado = 'Entregado'")
    .get(fila.dispositivo_id).n;

  return {
    autentico: true,
    folio: fila.folio,
    token: fila.token_uuid,
    fecha_emision: fila.fecha_emision,
    dispositivo: {
      tipo: fila.tipo,
      marca: fila.marca,
      modelo: fila.modelo,
      imei_o_serie: enmascarar(fila.imei_o_serie),
    },
    fecha_recepcion: fila.fecha_recepcion,
    fecha_entrega: fila.fecha_entrega,
    falla_reportada: fila.falla_reportada,
    refacciones: db.prepare('SELECT nombre, tipo FROM refacciones WHERE orden_id = ? ORDER BY id').all(fila.id),
    // Solo etapa y fecha: las notas internas del taller no se publican en el certificado
    linea_tiempo: db
      .prepare("SELECT estado, fecha FROM historial_estados WHERE orden_id = ? AND tipo = 'estado' ORDER BY id")
      .all(fila.id),
    evidencias: evidenciasPublicas(fila.id),
    garantia: resumenGarantia(fila),
    historial: {
      reparaciones_certificadas: reparaciones,
      mensaje:
        reparaciones > 1
          ? `Este equipo acumula ${reparaciones} reparaciones certificadas en el taller`
          : 'Primera reparación certificada registrada para este equipo',
    },
  };
}

/**
 * Página pública de estatus que el cliente abre con el QR de la nota de servicio (P15).
 * Muestra el avance con las notas de cada etapa, fotos de recepción, avisos publicados
 * y contacto del taller; nunca datos personales del cliente.
 *
 * @param {string} token - `token_estatus` de la orden.
 * @returns {Object}
 * @throws {HttpError} 404 si el token no corresponde a ninguna orden.
 */
function vistaEstatus(token) {
  const fila = db
    .prepare(
      `SELECT o.*, d.tipo, d.marca, d.modelo, d.imei_o_serie
         FROM ordenes o JOIN dispositivos d ON d.id = o.dispositivo_id
        WHERE o.token_estatus = ?`,
    )
    .get(token);
  if (!fila) {
    throw new HttpError(404, 'Orden no encontrada. Verifique que el código QR corresponda a su nota de servicio');
  }
  const etapas = db
    .prepare("SELECT estado, nota, fecha FROM historial_estados WHERE orden_id = ? AND tipo = 'estado' ORDER BY id")
    .all(fila.id);
  const avisos = db
    .prepare('SELECT mensaje, fecha FROM avisos_cliente WHERE orden_id = ? AND en_estatus = 1 ORDER BY id DESC')
    .all(fila.id);
  const { ultima } = db.prepare('SELECT MAX(fecha) AS ultima FROM historial_estados WHERE orden_id = ?').get(fila.id);
  const certificado = db.prepare('SELECT url_publica FROM certificados WHERE orden_id = ?').get(fila.id);

  return {
    folio: fila.folio,
    estado: fila.estado,
    paso: ESTADOS.indexOf(fila.estado) + 1,
    total_pasos: ESTADOS.length,
    dispositivo: {
      tipo: fila.tipo,
      marca: fila.marca,
      modelo: fila.modelo,
      imei_o_serie: enmascarar(fila.imei_o_serie),
    },
    fecha_recepcion: fila.fecha_recepcion,
    ultima_actualizacion: ultima,
    progreso: ESTADOS.map((estado) => {
      const hito = etapas.find((e) => e.estado === estado);
      return { estado, completado: Boolean(hito), nota: hito?.nota ?? null, fecha: hito?.fecha ?? null };
    }),
    fotos_recepcion: evidenciasPublicas(fila.id).antes,
    avisos,
    url_certificado: certificado?.url_publica ?? null,
    taller: config.taller,
  };
}

/**
 * Lista de certificados emitidos con búsqueda y filtro por garantía (P14).
 *
 * @param {{q?: string, garantia?: 'vigente'|'vencida'}} filtros
 * @returns {{certificados: Object[], total: number, vigentes: number}}
 * @throws {HttpError} 400 si el filtro no es válido o `q` tiene menos de 3 caracteres.
 */
function listarCertificados({ q, garantia }) {
  const params = { ahora: new Date().toISOString() };
  const condiciones = [];
  if (q !== undefined) {
    if (q.length < 3) throw new HttpError(400, 'El término de búsqueda debe tener al menos 3 caracteres');
    condiciones.push(
      '(o.folio LIKE :q OR c.token_uuid LIKE :q OR cl.nombre_completo LIKE :q OR d.imei_o_serie LIKE :q)',
    );
    params.q = `%${q}%`;
  }
  if (garantia === 'vigente') condiciones.push('o.garantia_fin >= :ahora');
  else if (garantia === 'vencida') condiciones.push('o.garantia_fin < :ahora');
  else if (garantia) throw new HttpError(400, 'El filtro de garantía debe ser vigente o vencida');
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const lista = db
    .prepare(
      `SELECT o.id AS orden_id, o.folio, c.token_uuid, c.url_publica, c.fecha_emision,
              d.marca, d.modelo, d.imei_o_serie, cl.nombre_completo AS cliente,
              o.garantia_fin, CASE WHEN o.garantia_fin >= :ahora THEN 'Vigente' ELSE 'Vencida' END AS garantia_estado
         FROM certificados c
         JOIN ordenes o ON o.id = c.orden_id
         JOIN dispositivos d ON d.id = o.dispositivo_id
         JOIN clientes cl ON cl.id = d.cliente_id
         ${where}
        ORDER BY c.fecha_emision DESC`,
    )
    .all(params);
  const totales = db
    .prepare(
      `SELECT COUNT(*) AS total, COALESCE(SUM(o.garantia_fin >= ?), 0) AS vigentes
         FROM certificados c JOIN ordenes o ON o.id = c.orden_id`,
    )
    .get(params.ahora);
  return { certificados: lista, ...totales };
}

module.exports = {
  contarEvidencias,
  resumenGarantia,
  urlEvidencia,
  urlEstatus,
  requisitosPendientes,
  emitir,
  certificadoConQr,
  qrEstatus,
  enmascarar,
  vistaPublica,
  vistaEstatus,
  listarCertificados,
};
