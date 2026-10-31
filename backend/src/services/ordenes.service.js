/**
 * @file ordenes.service.js
 * @description Gestión de órdenes (bloque 2.3): folios, máquina de estados, evidencias,
 *              refacciones, garantía, dashboard y búsqueda.
 * @task T12, T13, T15, T16, T17 (RF-04 a RF-09, RF-13, RF-14)
 * @author María Fernanda González Rodríguez
 */
const config = require('../config');
const { db, transaccion } = require('../db/conexion');
const { HttpError } = require('../utils/errores');
const certificados = require('./certificado.service');

const ESTADOS = ['Recibido', 'Diagnóstico', 'Reparación', 'Pruebas', 'Entregado'];
const TIPOS_REFACCION = ['original', 'compatible', 'reacondicionada'];

const ahora = () => new Date().toISOString();

/**
 * Normaliza accesorios: acepta arreglo, JSON (multipart manda texto) o lista separada por comas.
 *
 * @param {string|string[]|undefined} valor
 * @returns {string[]}
 */
function normalizarAccesorios(valor) {
  if (Array.isArray(valor)) return valor.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof valor !== 'string' || !valor.trim()) return [];
  try {
    const lista = JSON.parse(valor);
    if (Array.isArray(lista)) return normalizarAccesorios(lista);
  } catch {
    // no era JSON: se toma como lista separada por comas
  }
  return valor.split(',').map((s) => s.trim()).filter(Boolean);
}

/**
 * Genera el siguiente folio RP-AAAA-NNNN. Debe llamarse dentro de una transacción
 * para que dos recepciones simultáneas no obtengan el mismo consecutivo (RF-04).
 *
 * @param {number} anio
 * @returns {string} p. ej. `RP-2026-0001`.
 */
function siguienteFolio(anio) {
  db.prepare(
    `INSERT INTO folios_consecutivos (anio, ultimo) VALUES (?, 1)
     ON CONFLICT(anio) DO UPDATE SET ultimo = ultimo + 1`,
  ).run(anio);
  const { ultimo } = db.prepare('SELECT ultimo FROM folios_consecutivos WHERE anio = ?').get(anio);
  return `RP-${anio}-${String(ultimo).padStart(4, '0')}`;
}

/**
 * Busca la orden o lanza 404.
 *
 * @param {number} id
 * @returns {Object} Fila de `ordenes`.
 * @throws {HttpError} 404 si no existe.
 */
function obtenerFila(id) {
  const orden = db.prepare('SELECT * FROM ordenes WHERE id = ?').get(id);
  if (!orden) throw new HttpError(404, 'Orden no encontrada');
  return orden;
}

/** @throws {HttpError} 409 si la orden ya fue entregada (certificado emitido). */
function exigirNoBloqueada(orden) {
  if (orden.bloqueada) throw new HttpError(409, 'La orden ya fue entregada y no se puede modificar');
}

const { contarEvidencias } = certificados;

/**
 * Abre una orden con folio, estado Recibido, estado inicial y fotos "antes" (RF-04, RF-05).
 *
 * @param {Object} datos
 * @param {number} datos.dispositivoId
 * @param {number} datos.usuarioId - Usuario en sesión (responsable de la recepción).
 * @param {string} datos.fallaReportada
 * @param {string} datos.condicionFisica
 * @param {string[]} datos.accesorios
 * @param {string[]} datos.rutasFotos - Fotos "antes" ya guardadas en disco.
 * @returns {Object} Detalle completo de la orden creada.
 * @throws {HttpError} 404 si el dispositivo no existe; 409 si ya tiene una orden activa.
 */
function crearOrden({ dispositivoId, usuarioId, fallaReportada, condicionFisica, accesorios, rutasFotos }) {
  if (!db.prepare('SELECT 1 FROM dispositivos WHERE id = ?').get(dispositivoId)) {
    throw new HttpError(404, 'El dispositivo indicado no existe');
  }
  const activa = db
    .prepare("SELECT folio FROM ordenes WHERE dispositivo_id = ? AND estado <> 'Entregado'")
    .get(dispositivoId);
  if (activa) {
    throw new HttpError(409, `El dispositivo ya cuenta con una orden activa en proceso (Folio: ${activa.folio})`, {
      folio: activa.folio,
    });
  }

  const id = transaccion(() => {
    const fecha = ahora();
    const folio = siguienteFolio(new Date(fecha).getFullYear());
    const { lastInsertRowid } = db
      .prepare(
        `INSERT INTO ordenes (folio, dispositivo_id, usuario_id, estado, falla_reportada, condicion_fisica,
                              accesorios, fecha_recepcion)
         VALUES (?, ?, ?, 'Recibido', ?, ?, ?, ?)`,
      )
      .run(folio, dispositivoId, usuarioId, fallaReportada, condicionFisica, JSON.stringify(accesorios), fecha);
    db.prepare('INSERT INTO historial_estados (orden_id, estado, nota, usuario_id, fecha) VALUES (?, ?, ?, ?, ?)').run(
      lastInsertRowid,
      'Recibido',
      'Recepción del equipo',
      usuarioId,
      fecha,
    );
    insertarEvidencias(lastInsertRowid, 'antes', rutasFotos, fecha);
    return lastInsertRowid;
  });
  return obtenerDetalle(id);
}

function insertarEvidencias(ordenId, tipo, rutas, fecha = ahora()) {
  const stmt = db.prepare('INSERT INTO evidencias (orden_id, tipo, ruta_archivo, fecha_subida) VALUES (?, ?, ?, ?)');
  for (const ruta of rutas) stmt.run(ordenId, tipo, ruta, fecha);
}

/**
 * Corrige falla, condición física o accesorios; solo mientras la orden está en Recibido (RF-05).
 *
 * @param {number} id
 * @param {{fallaReportada?: string, condicionFisica?: string, accesorios?: string[]}} cambios
 * @returns {Object} Detalle actualizado.
 * @throws {HttpError} 409 si la orden ya pasó a Diagnóstico.
 */
function actualizarEstadoInicial(id, { fallaReportada, condicionFisica, accesorios }) {
  const orden = obtenerFila(id);
  if (orden.estado !== 'Recibido') {
    throw new HttpError(409, 'El estado inicial queda bloqueado una vez que la orden pasa a Diagnóstico');
  }
  db.prepare(
    `UPDATE ordenes SET falla_reportada = COALESCE(?, falla_reportada),
                        condicion_fisica = COALESCE(?, condicion_fisica),
                        accesorios = COALESCE(?, accesorios)
      WHERE id = ?`,
  ).run(fallaReportada || null, condicionFisica || null, accesorios ? JSON.stringify(accesorios) : null, id);
  return obtenerDetalle(id);
}

/**
 * Avanza la orden exactamente un estado (RF-06). Al llegar a Entregado emite el certificado (RF-10).
 *
 * @param {number} id
 * @param {string} nuevoEstado
 * @param {string} nota - Nota técnica (mín. 5 caracteres, validada en la ruta).
 * @param {number} usuarioId
 * @returns {Object} Detalle actualizado (incluye `certificado` si se entregó).
 * @throws {HttpError} 400 si la transición no es la siguiente en la secuencia o faltan requisitos de cierre.
 */
function avanzarEstado(id, nuevoEstado, nota, usuarioId) {
  const orden = obtenerFila(id);
  exigirNoBloqueada(orden);
  const siguiente = ESTADOS[ESTADOS.indexOf(orden.estado) + 1];
  if (nuevoEstado !== siguiente) {
    throw new HttpError(
      400,
      `Transición no permitida: de ${orden.estado} solo se puede avanzar a ${siguiente}. ` +
        'El flujo debe seguir la secuencia Recibido → Diagnóstico → Reparación → Pruebas → Entregado',
      { estado_actual: orden.estado, estado_siguiente: siguiente },
    );
  }

  if (nuevoEstado === 'Entregado') {
    const pendientes = certificados.requisitosPendientes(orden);
    if (pendientes.length) {
      throw new HttpError(400, 'La orden no cumple los requisitos para entregarse', { pendientes });
    }
  }

  transaccion(() => {
    const fecha = ahora();
    db.prepare('INSERT INTO historial_estados (orden_id, estado, nota, usuario_id, fecha) VALUES (?, ?, ?, ?, ?)').run(
      id,
      nuevoEstado,
      nota,
      usuarioId,
      fecha,
    );
    if (nuevoEstado === 'Entregado') {
      // RF-09: la garantía corre a partir de la entrega
      const fin = new Date(fecha);
      fin.setUTCDate(fin.getUTCDate() + orden.dias_garantia);
      db.prepare(
        "UPDATE ordenes SET estado = 'Entregado', fecha_entrega = ?, garantia_fin = ?, bloqueada = 1 WHERE id = ?",
      ).run(fecha, fin.toISOString(), id);
      certificados.emitir(id, fecha);
    } else {
      db.prepare('UPDATE ordenes SET estado = ? WHERE id = ?').run(nuevoEstado, id);
    }
  });
  return obtenerDetalle(id);
}

/**
 * Agrega fotos "antes" o "después" respetando el límite por etapa (RF-07).
 *
 * @param {number} id
 * @param {'antes'|'despues'} tipo
 * @param {number} cantidad - Número de fotos que se quieren subir (para validar antes de escribir).
 * @returns {(rutas: string[]) => Object} Función que registra las rutas ya guardadas y regresa el detalle.
 * @throws {HttpError} 409 si la orden está entregada; 400 si se rebasa el límite.
 */
function prepararEvidencias(id, tipo, cantidad) {
  const orden = obtenerFila(id);
  exigirNoBloqueada(orden);
  if (contarEvidencias(id, tipo) + cantidad > config.maxFotosPorEtapa) {
    throw new HttpError(400, `Límite de ${config.maxFotosPorEtapa} fotografías alcanzado para esta etapa`);
  }
  return (rutas) => {
    insertarEvidencias(id, tipo, rutas);
    return obtenerDetalle(id);
  };
}

/**
 * Registra una refacción; solo en Diagnóstico o Reparación (RF-08).
 *
 * @param {number} id
 * @param {{nombre: string, tipo: string, numeroSerie?: string}} pieza
 * @returns {Object} Detalle actualizado.
 * @throws {HttpError} 409 si la orden no está en Diagnóstico/Reparación.
 */
function agregarRefaccion(id, { nombre, tipo, numeroSerie }) {
  const orden = obtenerFila(id);
  exigirNoBloqueada(orden);
  if (!['Diagnóstico', 'Reparación'].includes(orden.estado)) {
    throw new HttpError(409, 'Solo se pueden registrar piezas en las etapas de Diagnóstico o Reparación');
  }
  db.prepare('INSERT INTO refacciones (orden_id, nombre, tipo, numero_serie) VALUES (?, ?, ?, ?)').run(
    id,
    nombre,
    tipo,
    numeroSerie || null,
  );
  return obtenerDetalle(id);
}

/**
 * Elimina una refacción mientras la orden no esté entregada (RF-08).
 *
 * @param {number} id
 * @param {number} refaccionId
 * @returns {Object} Detalle actualizado.
 * @throws {HttpError} 404 si la pieza no pertenece a la orden.
 */
function eliminarRefaccion(id, refaccionId) {
  exigirNoBloqueada(obtenerFila(id));
  const { changes } = db.prepare('DELETE FROM refacciones WHERE id = ? AND orden_id = ?').run(refaccionId, id);
  if (!changes) throw new HttpError(404, 'Refacción no encontrada en esta orden');
  return obtenerDetalle(id);
}

/**
 * Registra o reemplaza días y términos de garantía antes de la entrega (RF-09).
 *
 * @param {number} id
 * @param {number} dias
 * @param {string} terminos
 * @returns {Object} Detalle actualizado.
 */
function registrarGarantia(id, dias, terminos) {
  exigirNoBloqueada(obtenerFila(id));
  db.prepare('UPDATE ordenes SET dias_garantia = ?, terminos_garantia = ? WHERE id = ?').run(dias, terminos, id);
  return obtenerDetalle(id);
}

const { resumenGarantia, urlEvidencia } = certificados;

/**
 * Expediente completo de la orden para el panel interno.
 *
 * @param {number} id
 * @returns {Object}
 */
function obtenerDetalle(id) {
  const orden = obtenerFila(id);
  const dispositivo = db
    .prepare('SELECT id, cliente_id, tipo, marca, modelo, color, imei_o_serie FROM dispositivos WHERE id = ?')
    .get(orden.dispositivo_id);
  const cliente = db
    .prepare('SELECT id, nombre_completo, telefono, email FROM clientes WHERE id = ?')
    .get(dispositivo.cliente_id);
  const historial = db
    .prepare(
      `SELECT h.estado, h.nota, h.fecha, u.nombre AS usuario
         FROM historial_estados h JOIN usuarios u ON u.id = h.usuario_id
        WHERE h.orden_id = ? ORDER BY h.id`,
    )
    .all(id);
  const evidencias = db
    .prepare('SELECT id, tipo, ruta_archivo, fecha_subida FROM evidencias WHERE orden_id = ? ORDER BY id')
    .all(id)
    .map(({ ruta_archivo, ...e }) => ({ ...e, url: urlEvidencia(ruta_archivo) }));
  const refacciones = db
    .prepare('SELECT id, nombre, tipo, numero_serie FROM refacciones WHERE orden_id = ? ORDER BY id')
    .all(id);
  const certificado = db
    .prepare('SELECT token_uuid, url_publica, fecha_emision FROM certificados WHERE orden_id = ?')
    .get(id);

  return {
    id: orden.id,
    folio: orden.folio,
    estado: orden.estado,
    estado_siguiente: ESTADOS[ESTADOS.indexOf(orden.estado) + 1] || null,
    bloqueada: Boolean(orden.bloqueada),
    falla_reportada: orden.falla_reportada,
    condicion_fisica: orden.condicion_fisica,
    accesorios: JSON.parse(orden.accesorios),
    fecha_recepcion: orden.fecha_recepcion,
    fecha_entrega: orden.fecha_entrega,
    garantia: resumenGarantia(orden),
    cliente,
    dispositivo,
    historial,
    evidencias: {
      antes: evidencias.filter((e) => e.tipo === 'antes'),
      despues: evidencias.filter((e) => e.tipo === 'despues'),
    },
    refacciones,
    certificado: certificado || null,
  };
}

const SELECT_LISTADO = `
  SELECT o.id, o.folio, o.estado, o.fecha_recepcion, o.fecha_entrega,
         c.nombre_completo AS cliente, c.telefono,
         d.tipo, d.marca, d.modelo, d.imei_o_serie
    FROM ordenes o
    JOIN dispositivos d ON d.id = o.dispositivo_id
    JOIN clientes c ON c.id = d.cliente_id`;

/**
 * Indicadores y órdenes activas para el dashboard (RF-13).
 *
 * @returns {Object}
 */
function dashboard() {
  const contar = (sql, ...p) => db.prepare(sql).get(...p).n;
  const activas = db
    .prepare(`${SELECT_LISTADO} WHERE o.estado <> 'Entregado' ORDER BY o.fecha_recepcion DESC, o.id DESC`)
    .all();
  return {
    indicadores: {
      activas: activas.length,
      terminadas: contar("SELECT COUNT(*) AS n FROM ordenes WHERE estado = 'Entregado'"),
      garantias_vigentes: contar(
        "SELECT COUNT(*) AS n FROM ordenes WHERE estado = 'Entregado' AND garantia_fin >= ?",
        ahora(),
      ),
    },
    ordenes_activas: activas,
    mensaje: activas.length ? null : 'No hay órdenes de reparación activas registradas',
  };
}

/**
 * Lista órdenes; con `q` (mín. 3 caracteres) busca por folio, cliente, teléfono o IMEI (RF-14).
 *
 * @param {{q?: string, estado?: string}} filtros
 * @returns {Object[]}
 * @throws {HttpError} 400 si `q` tiene menos de 3 caracteres o el estado no existe.
 */
function listar({ q, estado }) {
  const condiciones = [];
  const params = [];
  if (q !== undefined) {
    if (q.length < 3) throw new HttpError(400, 'El término de búsqueda debe tener al menos 3 caracteres');
    // LIKE de SQLite ya ignora mayúsculas/minúsculas
    condiciones.push('(o.folio LIKE ? OR c.nombre_completo LIKE ? OR c.telefono LIKE ? OR d.imei_o_serie LIKE ?)');
    params.push(...Array(4).fill(`%${q}%`));
  }
  if (estado) {
    if (!ESTADOS.includes(estado)) throw new HttpError(400, 'Estado no válido');
    condiciones.push('o.estado = ?');
    params.push(estado);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  return db.prepare(`${SELECT_LISTADO} ${where} ORDER BY o.fecha_recepcion DESC, o.id DESC`).all(...params);
}

module.exports = {
  ESTADOS,
  TIPOS_REFACCION,
  normalizarAccesorios,
  crearOrden,
  actualizarEstadoInicial,
  avanzarEstado,
  prepararEvidencias,
  agregarRefaccion,
  eliminarRefaccion,
  registrarGarantia,
  obtenerDetalle,
  dashboard,
  listar,
};
