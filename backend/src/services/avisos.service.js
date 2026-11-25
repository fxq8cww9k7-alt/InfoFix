/**
 * @file avisos.service.js
 * @description Avisos al cliente (P10): arma el mensaje con los datos de la orden, lo publica en la
 *              página de estatus y/o lo envía por correo; registra el envío y, si el correo no se
 *              entrega, genera la notificación "Correo no entregado".
 * @task P10 (Act. 11)
 * @author María Fernanda González Rodríguez
 */
const config = require('../config');
const { db, transaccion } = require('../db/conexion');
const { HttpError } = require('../utils/errores');
const { enviarCorreo } = require('../utils/correo');
const { urlEstatus } = require('./certificado.service');
const notificaciones = require('./notificaciones.service');
const { registrarEvento } = require('./ordenes.service');

const TIPOS_AVISO = {
  actualizacion_estado: {
    asunto: 'Actualización de tu reparación',
    texto: (o) => `Tu equipo ${o.marca} ${o.modelo} (folio ${o.folio}) ahora se encuentra en la etapa: ${o.estado}.`,
  },
  requiere_autorizacion: {
    asunto: 'Tu reparación requiere autorización',
    texto: (o) =>
      `Tu equipo ${o.marca} ${o.modelo} (folio ${o.folio}) requiere tu autorización para continuar con la reparación. ` +
      `Por favor comunícate con el taller${config.taller.telefono ? ` al ${config.taller.telefono}` : ''}.`,
  },
  listo_para_recoger: {
    asunto: 'Tu equipo está listo',
    texto: (o) =>
      `Tu equipo ${o.marca} ${o.modelo} (folio ${o.folio}) está listo para recogerse en ${config.taller.nombre}` +
      `${config.taller.direccion ? `, ${config.taller.direccion}` : ''}.`,
  },
};

/**
 * Datos de la orden que necesita el mensaje.
 *
 * @param {number} ordenId
 * @returns {Object}
 * @throws {HttpError} 404 si la orden no existe.
 */
function datosOrden(ordenId) {
  const orden = db
    .prepare(
      `SELECT o.id, o.folio, o.estado, o.token_estatus, d.marca, d.modelo,
              c.id AS cliente_id, c.nombre_completo, c.email
         FROM ordenes o
         JOIN dispositivos d ON d.id = o.dispositivo_id
         JOIN clientes c ON c.id = d.cliente_id
        WHERE o.id = ?`,
    )
    .get(ordenId);
  if (!orden) throw new HttpError(404, 'Orden no encontrada');
  return orden;
}

/**
 * Arma el mensaje tal como lo verá el cliente (vista previa del modal P10).
 *
 * @param {number} ordenId
 * @param {string} tipo - Clave de `TIPOS_AVISO`.
 * @param {string} [adicional] - Texto libre que el técnico agrega al final.
 * @returns {{tipo: string, asunto: string, mensaje: string, cliente: Object, folio: string, url_estatus: string}}
 * @throws {HttpError} 400 si el tipo no existe.
 */
function vistaPrevia(ordenId, tipo, adicional) {
  const plantilla = TIPOS_AVISO[tipo];
  if (!plantilla) {
    throw new HttpError(400, `El tipo de aviso debe ser uno de: ${Object.keys(TIPOS_AVISO).join(', ')}`);
  }
  const orden = datosOrden(ordenId);
  const mensaje = [plantilla.texto(orden), adicional?.trim()].filter(Boolean).join(' ');
  return {
    tipo,
    asunto: `${plantilla.asunto} · ${orden.folio}`,
    mensaje,
    folio: orden.folio,
    cliente: { id: orden.cliente_id, nombre_completo: orden.nombre_completo, email: orden.email },
    url_estatus: urlEstatus(orden.token_estatus),
  };
}

/**
 * Publica el aviso en la página de estatus y/o lo envía por correo.
 *
 * @param {number} ordenId
 * @param {{tipo: string, enEstatus: boolean, porCorreo: boolean, adicional?: string}} opciones
 * @param {number} usuarioId
 * @returns {Promise<{aviso: Object, estado_correo: 'enviado'|'fallido'|'no_aplica'}>}
 * @throws {HttpError} 400 si no se eligió ningún canal.
 */
async function enviar(ordenId, { tipo, enEstatus, porCorreo, adicional }, usuarioId) {
  if (!enEstatus && !porCorreo) {
    throw new HttpError(400, 'Elige al menos un canal: página de estatus o correo');
  }
  const previa = vistaPrevia(ordenId, tipo, adicional);

  let estadoCorreo = 'no_aplica';
  if (porCorreo) {
    const enviado =
      Boolean(previa.cliente.email) &&
      (await enviarCorreo({
        para: previa.cliente.email,
        asunto: previa.asunto,
        texto: `Hola ${previa.cliente.nombre_completo}:\n\n${previa.mensaje}\n\nConsulta el avance de tu reparación en:\n${previa.url_estatus}\n\n${config.taller.nombre}`,
      }));
    estadoCorreo = enviado ? 'enviado' : 'fallido';
  }

  const id = transaccion(() => {
    const fecha = new Date().toISOString();
    const { lastInsertRowid } = db
      .prepare(
        `INSERT INTO avisos_cliente (orden_id, tipo, mensaje, en_estatus, por_correo, estado_correo, usuario_id, fecha)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(ordenId, tipo, previa.mensaje, Number(enEstatus), Number(porCorreo), estadoCorreo, usuarioId, fecha);
    const canales = [enEstatus && 'página de estatus', porCorreo && 'correo'].filter(Boolean).join(' y ');
    registrarEvento(ordenId, 'aviso', `Aviso al cliente por ${canales}: ${previa.mensaje}`, usuarioId);
    notificaciones.crear({
      categoria: 'ordenes',
      tipo: 'aviso_enviado',
      mensaje: `Se envió un aviso al cliente de la orden ${previa.folio}`,
      ordenId,
    });
    if (estadoCorreo === 'fallido') {
      notificaciones.crear({
        categoria: 'cuentas',
        tipo: 'correo_no_entregado',
        mensaje: previa.cliente.email
          ? `No se pudo entregar el correo a ${previa.cliente.nombre_completo} (${previa.cliente.email}), orden ${previa.folio}`
          : `${previa.cliente.nombre_completo} no tiene correo registrado; el aviso de la orden ${previa.folio} no se envió por correo`,
        ordenId,
        clienteId: previa.cliente.id,
      });
    }
    return lastInsertRowid;
  });

  const aviso = db
    .prepare('SELECT id, tipo, mensaje, en_estatus, por_correo, estado_correo, fecha FROM avisos_cliente WHERE id = ?')
    .get(id);
  return { aviso: { ...aviso, en_estatus: Boolean(aviso.en_estatus), por_correo: Boolean(aviso.por_correo) }, estado_correo: estadoCorreo };
}

/**
 * Avisos enviados para una orden, del más reciente al más antiguo.
 *
 * @param {number} ordenId
 * @returns {Object[]}
 */
function listar(ordenId) {
  datosOrden(ordenId);
  return db
    .prepare(
      `SELECT a.id, a.tipo, a.mensaje, a.en_estatus, a.por_correo, a.estado_correo, a.fecha, u.nombre AS usuario
         FROM avisos_cliente a JOIN usuarios u ON u.id = a.usuario_id
        WHERE a.orden_id = ? ORDER BY a.id DESC`,
    )
    .all(ordenId)
    .map((a) => ({ ...a, en_estatus: Boolean(a.en_estatus), por_correo: Boolean(a.por_correo) }));
}

module.exports = { TIPOS_AVISO, vistaPrevia, enviar, listar };
