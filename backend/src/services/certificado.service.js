/**
 * @file certificado.service.js
 * @description Certificado digital y código QR (bloque 2.4): requisitos de cierre, token UUID v4,
 *              QR de la URL pública y vista pública con datos enmascarados.
 * @task T20, T21, T23 (RF-10, RF-11, RF-12, RF-15)
 * @author María Fernanda González Rodríguez
 */
const crypto = require('node:crypto');
const QRCode = require('qrcode');
const config = require('../config');
const { db } = require('../db/conexion');
const { HttpError } = require('../utils/errores');

const urlEvidencia = (ruta) => `/uploads/${ruta}`;

const contarEvidencias = (ordenId, tipo) =>
  db.prepare('SELECT COUNT(*) AS n FROM evidencias WHERE orden_id = ? AND tipo = ?').get(ordenId, tipo).n;

/**
 * Estado de la garantía en tiempo real (RF-09).
 *
 * @param {Object} orden - Fila de `ordenes`.
 * @returns {Object|null} null si aún no se registra la garantía.
 */
function resumenGarantia(orden) {
  if (orden.dias_garantia === null) return null;
  let estado = 'Pendiente de entrega';
  if (orden.garantia_fin) estado = new Date() <= new Date(orden.garantia_fin) ? 'Vigente' : 'Vencida';
  return {
    dias: orden.dias_garantia,
    terminos: orden.terminos_garantia,
    inicio: orden.fecha_entrega,
    fin: orden.garantia_fin,
    estado,
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
    db.prepare('SELECT estado FROM historial_estados WHERE orden_id = ?').all(orden.id).map((h) => h.estado),
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
 * Datos del certificado imprimible + QR (PNG en data URL). El QR se genera a partir de la
 * URL guardada, así que si falla se puede volver a pedir sin tocar la orden (RF-11).
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
  const qr = await QRCode.toDataURL(certificado.url_publica, { errorCorrectionLevel: 'M', width: 512, margin: 2 });
  return { ...certificado, qr };
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

/**
 * Vista pública de solo lectura. Omite nombre, teléfono y correo del cliente (LFPDPPP).
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
  if (!fila) {
    throw new HttpError(
      404,
      'Certificado no encontrado. Verifique que el enlace o código QR corresponda a un certificado emitido por el taller',
    );
  }
  const evidencias = db
    .prepare('SELECT tipo, ruta_archivo FROM evidencias WHERE orden_id = ? ORDER BY id')
    .all(fila.id)
    .map((e) => ({ tipo: e.tipo, url: urlEvidencia(e.ruta_archivo) }));
  const reparaciones = db
    .prepare("SELECT COUNT(*) AS n FROM ordenes WHERE dispositivo_id = ? AND estado = 'Entregado'")
    .get(fila.dispositivo_id).n;

  return {
    folio: fila.folio,
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
    // Solo etapa y fecha: las notas internas del taller no se publican
    linea_tiempo: db
      .prepare('SELECT estado, fecha FROM historial_estados WHERE orden_id = ? ORDER BY id')
      .all(fila.id),
    evidencias: {
      antes: evidencias.filter((e) => e.tipo === 'antes').map((e) => e.url),
      despues: evidencias.filter((e) => e.tipo === 'despues').map((e) => e.url),
    },
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

module.exports = {
  contarEvidencias,
  resumenGarantia,
  urlEvidencia,
  requisitosPendientes,
  emitir,
  certificadoConQr,
  enmascarar,
  vistaPublica,
};
