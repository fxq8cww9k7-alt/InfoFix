/**
 * @file notificaciones.service.js
 * @description Notificaciones del panel (P5): avisos por evento (certificado emitido, aviso enviado,
 *              correo no entregado) y avisos automáticos por reglas (orden detenida, garantía por vencer),
 *              con estado leído/no leído por usuario.
 * @task P5 (Act. 11)
 * @author María Fernanda González Rodríguez
 */
const config = require('../config');
const { db } = require('../db/conexion');

const CATEGORIAS = ['ordenes', 'garantias', 'cuentas'];
const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Registra una notificación. Si trae `clave` y ya existe una con la misma, no se duplica.
 *
 * @param {Object} n
 * @param {'ordenes'|'garantias'|'cuentas'} n.categoria
 * @param {string} n.tipo - p. ej. `certificado_emitido`, `orden_detenida`.
 * @param {string} n.mensaje
 * @param {number} [n.ordenId]
 * @param {number} [n.clienteId]
 * @param {string} [n.clave]
 */
function crear({ categoria, tipo, mensaje, ordenId = null, clienteId = null, clave = null }) {
  db.prepare(
    `INSERT INTO notificaciones (categoria, tipo, mensaje, orden_id, cliente_id, clave, fecha)
     VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(clave) DO NOTHING`,
  ).run(categoria, tipo, mensaje, ordenId, clienteId, clave, new Date().toISOString());
}

/**
 * Revisa las reglas automáticas y crea los avisos que falten. Se ejecuta al consultar
 * las notificaciones, así no hace falta un proceso en segundo plano.
 */
function generarAutomaticas() {
  const ahora = Date.now();

  // Órdenes activas cuya última transición de etapa fue hace más de N días
  const limiteDetenida = new Date(ahora - config.diasOrdenDetenida * DIA_MS).toISOString();
  const detenidas = db
    .prepare(
      `SELECT o.id, o.folio, o.estado, MAX(h.fecha) AS desde
         FROM ordenes o JOIN historial_estados h ON h.orden_id = o.id AND h.tipo = 'estado'
        WHERE o.estado <> 'Entregado'
        GROUP BY o.id HAVING desde < ?`,
    )
    .all(limiteDetenida);
  for (const o of detenidas) {
    const dias = Math.floor((ahora - new Date(o.desde).getTime()) / DIA_MS);
    crear({
      categoria: 'ordenes',
      tipo: 'orden_detenida',
      mensaje: `La orden ${o.folio} lleva ${dias} días en la etapa ${o.estado}`,
      ordenId: o.id,
      clave: `detenida:${o.id}:${o.estado}`,
    });
  }

  // Garantías que vencen dentro de los próximos N días
  const desde = new Date(ahora).toISOString();
  const hasta = new Date(ahora + config.diasAvisoGarantia * DIA_MS).toISOString();
  const porVencer = db
    .prepare(
      `SELECT id, folio, garantia_fin FROM ordenes
        WHERE estado = 'Entregado' AND garantia_fin BETWEEN ? AND ?`,
    )
    .all(desde, hasta);
  for (const o of porVencer) {
    crear({
      categoria: 'garantias',
      tipo: 'garantia_por_vencer',
      mensaje: `La garantía de la orden ${o.folio} vence el ${o.garantia_fin.slice(0, 10)}`,
      ordenId: o.id,
      clave: `garantia:${o.id}`,
    });
  }
}

/**
 * Notificaciones para el usuario, de la más reciente a la más antigua.
 *
 * @param {number} usuarioId
 * @param {{soloNoLeidas?: boolean, categoria?: string, limite?: number}} filtros
 * @returns {{notificaciones: Object[], no_leidas: number}}
 */
function listar(usuarioId, { soloNoLeidas = false, categoria, limite = 50 } = {}) {
  generarAutomaticas();
  const condiciones = [];
  const params = [usuarioId];
  if (soloNoLeidas) condiciones.push('l.usuario_id IS NULL');
  if (categoria) {
    condiciones.push('n.categoria = ?');
    params.push(categoria);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const notificaciones = db
    .prepare(
      `SELECT n.id, n.categoria, n.tipo, n.mensaje, n.orden_id, n.cliente_id, n.fecha,
              o.folio, (l.usuario_id IS NOT NULL) AS leida
         FROM notificaciones n
         LEFT JOIN notificaciones_leidas l ON l.notificacion_id = n.id AND l.usuario_id = ?
         LEFT JOIN ordenes o ON o.id = n.orden_id
         ${where}
        ORDER BY n.fecha DESC, n.id DESC
        LIMIT ?`,
    )
    .all(...params, limite)
    .map((n) => ({ ...n, leida: Boolean(n.leida) }));
  const { n: noLeidas } = db
    .prepare(
      `SELECT COUNT(*) AS n FROM notificaciones
        WHERE id NOT IN (SELECT notificacion_id FROM notificaciones_leidas WHERE usuario_id = ?)`,
    )
    .get(usuarioId);
  return { notificaciones, no_leidas: noLeidas };
}

/**
 * Marca como leídas las notificaciones indicadas, o todas si no se pasan ids.
 *
 * @param {number} usuarioId
 * @param {number[]} [ids]
 */
function marcarLeidas(usuarioId, ids) {
  const filtro = ids?.length ? `WHERE id IN (${ids.map(() => '?').join(',')})` : '';
  db.prepare(
    `INSERT OR IGNORE INTO notificaciones_leidas (notificacion_id, usuario_id)
     SELECT id, ? FROM notificaciones ${filtro}`,
  ).run(usuarioId, ...(ids || []));
}

module.exports = { CATEGORIAS, crear, generarAutomaticas, listar, marcarLeidas };
