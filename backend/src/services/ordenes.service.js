/**
 * @file ordenes.service.js
 * @description Gestión de órdenes (bloque 2.3): folios, máquina de estados, evidencias,
 *              refacciones, garantía, bitácora, dashboard y búsqueda.
 * @task T12, T13, T15, T16, T17, T25 (RF-04 a RF-09, RF-13, RF-14; pantallas P4, P6–P9, P17)
 * @author María Fernanda González Rodríguez
 */
const crypto = require('node:crypto');
const config = require('../config');
const { db, transaccion } = require('../db/conexion');
const { HttpError } = require('../utils/errores');
const certificados = require('./certificado.service');
const notificaciones = require('./notificaciones.service');

const ESTADOS = ['Recibido', 'Diagnóstico', 'Reparación', 'Pruebas', 'Entregado'];
const TIPOS_REFACCION = ['original', 'compatible', 'reacondicionada'];

const ahora = () => new Date().toISOString();

const { contarEvidencias, resumenGarantia, urlEvidencia } = certificados;

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

/**
 * Agrega un registro a la línea de tiempo de la orden (P7: cada acción deja constancia).
 *
 * @param {number} ordenId
 * @param {'estado'|'pieza'|'foto'|'garantia'|'aviso'|'edicion'} tipo
 * @param {string} nota
 * @param {number} usuarioId
 * @param {string} [estado] - Etapa en ese momento; por defecto la actual de la orden.
 * @param {string} [fecha]
 */
function registrarEvento(ordenId, tipo, nota, usuarioId, estado, fecha = ahora()) {
  const etapa = estado || db.prepare('SELECT estado FROM ordenes WHERE id = ?').get(ordenId).estado;
  db.prepare(
    'INSERT INTO historial_estados (orden_id, tipo, estado, nota, usuario_id, fecha) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(ordenId, tipo, etapa, nota, usuarioId, fecha);
}

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
        `INSERT INTO ordenes (folio, token_estatus, dispositivo_id, usuario_id, estado, falla_reportada,
                              condicion_fisica, accesorios, fecha_recepcion)
         VALUES (?, ?, ?, ?, 'Recibido', ?, ?, ?, ?)`,
      )
      .run(folio, crypto.randomUUID(), dispositivoId, usuarioId, fallaReportada, condicionFisica, JSON.stringify(accesorios), fecha);
    registrarEvento(lastInsertRowid, 'estado', 'Recepción del equipo', usuarioId, 'Recibido', fecha);
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
 * @param {number} usuarioId
 * @returns {Object} Detalle actualizado.
 * @throws {HttpError} 409 si la orden ya pasó a Diagnóstico.
 */
function actualizarEstadoInicial(id, { fallaReportada, condicionFisica, accesorios }, usuarioId) {
  const orden = obtenerFila(id);
  if (orden.estado !== 'Recibido') {
    throw new HttpError(409, 'El estado inicial queda bloqueado una vez que la orden pasa a Diagnóstico');
  }
  transaccion(() => {
    db.prepare(
      `UPDATE ordenes SET falla_reportada = COALESCE(?, falla_reportada),
                          condicion_fisica = COALESCE(?, condicion_fisica),
                          accesorios = COALESCE(?, accesorios)
        WHERE id = ?`,
    ).run(fallaReportada || null, condicionFisica || null, accesorios ? JSON.stringify(accesorios) : null, id);
    registrarEvento(id, 'edicion', 'Se corrigió el estado inicial del equipo', usuarioId);
  });
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
    registrarEvento(id, 'estado', nota, usuarioId, nuevoEstado, fecha);
    if (nuevoEstado === 'Entregado') {
      // RF-09: la garantía corre a partir de la entrega
      const fin = new Date(fecha);
      fin.setUTCDate(fin.getUTCDate() + orden.dias_garantia);
      db.prepare(
        "UPDATE ordenes SET estado = 'Entregado', fecha_entrega = ?, garantia_fin = ?, bloqueada = 1 WHERE id = ?",
      ).run(fecha, fin.toISOString(), id);
      certificados.emitir(id, fecha);
      notificaciones.crear({
        categoria: 'ordenes',
        tipo: 'certificado_emitido',
        mensaje: `Se emitió el certificado de la orden ${orden.folio}`,
        ordenId: id,
      });
    } else {
      db.prepare('UPDATE ordenes SET estado = ? WHERE id = ?').run(nuevoEstado, id);
    }
  });
  return obtenerDetalle(id);
}

/**
 * Valida que se puedan agregar fotos a la etapa (RF-07). Las fotos "antes" solo se aceptan
 * mientras la orden está en Recibido (P9: la etapa "Antes" se bloquea después de la recepción).
 *
 * @param {number} id
 * @param {'antes'|'despues'} tipo
 * @param {number} cantidad - Número de fotos que se quieren subir (para validar antes de escribir).
 * @param {number} usuarioId
 * @returns {(rutas: string[]) => Object} Función que registra las rutas ya guardadas y regresa el detalle.
 * @throws {HttpError} 409 si la orden está entregada o la etapa "antes" ya cerró; 400 si se rebasa el límite.
 */
function prepararEvidencias(id, tipo, cantidad, usuarioId) {
  const orden = obtenerFila(id);
  exigirNoBloqueada(orden);
  if (tipo === 'antes' && orden.estado !== 'Recibido') {
    throw new HttpError(409, 'Las fotografías de recepción (antes) solo se pueden subir mientras la orden está en Recibido');
  }
  if (contarEvidencias(id, tipo) + cantidad > config.maxFotosPorEtapa) {
    throw new HttpError(400, `Límite de ${config.maxFotosPorEtapa} fotografías alcanzado para esta etapa`);
  }
  return (rutas) => {
    transaccion(() => {
      insertarEvidencias(id, tipo, rutas);
      const etapa = tipo === 'antes' ? 'recepción (antes)' : 'entrega (después)';
      registrarEvento(id, 'foto', `Se ${rutas.length > 1 ? `subieron ${rutas.length} fotografías` : 'subió 1 fotografía'} de ${etapa}`, usuarioId);
    });
    return obtenerDetalle(id);
  };
}

/**
 * Busca una refacción de la orden o lanza 404.
 *
 * @param {number} ordenId
 * @param {number} refaccionId
 * @returns {Object}
 */
function obtenerRefaccion(ordenId, refaccionId) {
  const pieza = db.prepare('SELECT * FROM refacciones WHERE id = ? AND orden_id = ?').get(refaccionId, ordenId);
  if (!pieza) throw new HttpError(404, 'Refacción no encontrada en esta orden');
  return pieza;
}

/**
 * Registra una refacción; solo en Diagnóstico o Reparación (RF-08).
 *
 * @param {number} id
 * @param {{nombre: string, tipo: string, numeroSerie?: string}} pieza
 * @param {number} usuarioId
 * @returns {Object} Detalle actualizado.
 * @throws {HttpError} 409 si la orden no está en Diagnóstico/Reparación.
 */
function agregarRefaccion(id, { nombre, tipo, numeroSerie }, usuarioId) {
  const orden = obtenerFila(id);
  exigirNoBloqueada(orden);
  if (!['Diagnóstico', 'Reparación'].includes(orden.estado)) {
    throw new HttpError(409, 'Solo se pueden registrar piezas en las etapas de Diagnóstico o Reparación');
  }
  transaccion(() => {
    db.prepare('INSERT INTO refacciones (orden_id, nombre, tipo, numero_serie) VALUES (?, ?, ?, ?)').run(
      id,
      nombre,
      tipo,
      numeroSerie || null,
    );
    registrarEvento(id, 'pieza', `Se agregó la pieza "${nombre}" (${tipo})`, usuarioId);
  });
  return obtenerDetalle(id);
}

/**
 * Edita una refacción mientras la orden no esté entregada (RF-08, P8).
 *
 * @param {number} id
 * @param {number} refaccionId
 * @param {{nombre: string, tipo: string, numeroSerie?: string}} pieza
 * @param {number} usuarioId
 * @returns {Object} Detalle actualizado.
 */
function editarRefaccion(id, refaccionId, { nombre, tipo, numeroSerie }, usuarioId) {
  exigirNoBloqueada(obtenerFila(id));
  obtenerRefaccion(id, refaccionId);
  transaccion(() => {
    db.prepare('UPDATE refacciones SET nombre = ?, tipo = ?, numero_serie = ? WHERE id = ?').run(
      nombre,
      tipo,
      numeroSerie || null,
      refaccionId,
    );
    registrarEvento(id, 'pieza', `Se editó la pieza "${nombre}" (${tipo})`, usuarioId);
  });
  return obtenerDetalle(id);
}

/**
 * Elimina una refacción mientras la orden no esté entregada (RF-08).
 *
 * @param {number} id
 * @param {number} refaccionId
 * @param {number} usuarioId
 * @returns {Object} Detalle actualizado.
 * @throws {HttpError} 404 si la pieza no pertenece a la orden.
 */
function eliminarRefaccion(id, refaccionId, usuarioId) {
  exigirNoBloqueada(obtenerFila(id));
  const pieza = obtenerRefaccion(id, refaccionId);
  transaccion(() => {
    db.prepare('DELETE FROM refacciones WHERE id = ?').run(refaccionId);
    registrarEvento(id, 'pieza', `Se eliminó la pieza "${pieza.nombre}"`, usuarioId);
  });
  return obtenerDetalle(id);
}

/**
 * Registra o reemplaza días y términos de garantía antes de la entrega (RF-09).
 *
 * @param {number} id
 * @param {number} dias
 * @param {string} terminos
 * @param {number} usuarioId
 * @returns {Object} Detalle actualizado.
 */
function registrarGarantia(id, dias, terminos, usuarioId) {
  exigirNoBloqueada(obtenerFila(id));
  transaccion(() => {
    db.prepare('UPDATE ordenes SET dias_garantia = ?, terminos_garantia = ? WHERE id = ?').run(dias, terminos, id);
    registrarEvento(id, 'garantia', `Se registró una garantía de ${dias} días`, usuarioId);
  });
  return obtenerDetalle(id);
}

/**
 * Expediente completo de la orden para el panel interno (P7).
 *
 * @param {number} id
 * @returns {Object}
 */
function obtenerDetalle(id) {
  const orden = obtenerFila(id);
  const dispositivo = db
    .prepare(
      `SELECT id, cliente_id, tipo, marca, modelo, color, imei_o_serie, contrasena_equipo
         FROM dispositivos WHERE id = ?`,
    )
    .get(orden.dispositivo_id);
  const cliente = db
    .prepare('SELECT id, nombre_completo, telefono, email FROM clientes WHERE id = ?')
    .get(dispositivo.cliente_id);
  const historial = db
    .prepare(
      `SELECT h.tipo, h.estado, h.nota, h.fecha, u.nombre AS usuario
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
  const tecnico = db.prepare('SELECT id, nombre FROM usuarios WHERE id = ?').get(orden.usuario_id);
  const { n: reparacionesPrevias } = db
    .prepare("SELECT COUNT(*) AS n FROM ordenes WHERE dispositivo_id = ? AND estado = 'Entregado' AND id <> ?")
    .get(orden.dispositivo_id, id);

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
    tecnico,
    garantia: resumenGarantia(orden),
    url_estatus: certificados.urlEstatus(orden.token_estatus),
    cliente,
    dispositivo: { ...dispositivo, reparaciones_previas: reparacionesPrevias },
    historial,
    evidencias: {
      antes: evidencias.filter((e) => e.tipo === 'antes'),
      despues: evidencias.filter((e) => e.tipo === 'despues'),
    },
    refacciones,
    // Checklist "Para entregar y certificar" (P7, P11); vacío cuando ya se puede entregar
    pendientes_entrega: orden.bloqueada ? [] : certificados.requisitosPendientes(orden),
    certificado: certificado || null,
  };
}

const SELECT_LISTADO = `
  SELECT o.id, o.folio, o.estado, o.fecha_recepcion, o.fecha_entrega, o.garantia_fin,
         CASE WHEN o.garantia_fin IS NULL THEN NULL
              WHEN o.garantia_fin >= :ahora THEN 'Vigente' ELSE 'Vencida' END AS garantia_estado,
         c.id AS cliente_id, c.nombre_completo AS cliente, c.telefono,
         d.id AS dispositivo_id, d.tipo, d.marca, d.modelo, d.imei_o_serie,
         u.id AS tecnico_id, u.nombre AS tecnico
    FROM ordenes o
    JOIN dispositivos d ON d.id = o.dispositivo_id
    JOIN clientes c ON c.id = d.cliente_id
    JOIN usuarios u ON u.id = o.usuario_id`;

/**
 * Indicadores y órdenes activas para el dashboard (RF-13, P4).
 *
 * @param {{estado?: string}} filtros - Filtra la tabla de órdenes activas por etapa.
 * @returns {Object}
 */
function dashboard({ estado } = {}) {
  if (estado && !ESTADOS.slice(0, -1).includes(estado)) throw new HttpError(400, 'Estado no válido');
  const conteos = Object.fromEntries(ESTADOS.map((e) => [e, 0]));
  for (const { estado: e, n } of db.prepare('SELECT estado, COUNT(*) AS n FROM ordenes GROUP BY estado').all()) {
    conteos[e] = n;
  }
  const activas = db
    .prepare(
      `${SELECT_LISTADO} WHERE o.estado <> 'Entregado' ${estado ? 'AND o.estado = :estado' : ''}
       ORDER BY o.fecha_recepcion DESC, o.id DESC`,
    )
    .all(estado ? { ahora: ahora(), estado } : { ahora: ahora() });
  return {
    indicadores: {
      activas: conteos.Recibido + conteos['Diagnóstico'] + conteos['Reparación'] + conteos.Pruebas,
      en_pruebas: conteos.Pruebas,
      terminadas: conteos.Entregado,
      garantias_vigentes: db
        .prepare("SELECT COUNT(*) AS n FROM ordenes WHERE estado = 'Entregado' AND garantia_fin >= ?")
        .get(ahora()).n,
    },
    // Para la gráfica "equipos por etapa"
    por_etapa: ESTADOS.slice(0, -1).map((e) => ({ estado: e, total: conteos[e] })),
    ordenes_activas: activas,
    mensaje: activas.length ? null : 'No hay órdenes de reparación activas registradas',
  };
}

/**
 * Lista órdenes con búsqueda, filtros y paginación (RF-14, P17).
 *
 * @param {Object} filtros
 * @param {string} [filtros.q] - Mín. 3 caracteres; busca en folio, cliente, teléfono o IMEI.
 * @param {string} [filtros.estado]
 * @param {string} [filtros.desde] - Fecha de recepción inicial (AAAA-MM-DD).
 * @param {string} [filtros.hasta] - Fecha de recepción final (AAAA-MM-DD), inclusive.
 * @param {number} [filtros.tecnico] - id del usuario que recibió la orden.
 * @param {number} [filtros.pagina=1]
 * @param {number} [filtros.porPagina=20]
 * @returns {{ordenes: Object[], paginacion: Object, resumen: Object}}
 * @throws {HttpError} 400 si algún filtro no es válido.
 */
function listar({ q, estado, desde, hasta, tecnico, pagina = 1, porPagina = 20 }) {
  const condiciones = [];
  const params = { ahora: ahora() };
  if (q !== undefined) {
    if (q.length < 3) throw new HttpError(400, 'El término de búsqueda debe tener al menos 3 caracteres');
    // LIKE de SQLite ya ignora mayúsculas/minúsculas
    condiciones.push('(o.folio LIKE :q OR c.nombre_completo LIKE :q OR c.telefono LIKE :q OR d.imei_o_serie LIKE :q)');
    params.q = `%${q}%`;
  }
  if (estado) {
    if (!ESTADOS.includes(estado)) throw new HttpError(400, 'Estado no válido');
    condiciones.push('o.estado = :estado');
    params.estado = estado;
  }
  const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/;
  if (desde) {
    if (!RE_FECHA.test(desde)) throw new HttpError(400, 'La fecha "desde" debe tener formato AAAA-MM-DD');
    condiciones.push('o.fecha_recepcion >= :desde');
    params.desde = desde;
  }
  if (hasta) {
    if (!RE_FECHA.test(hasta)) throw new HttpError(400, 'La fecha "hasta" debe tener formato AAAA-MM-DD');
    // Las fechas guardadas son ISO completas: "< día siguiente" incluye todo el día "hasta"
    const siguienteDia = new Date(`${hasta}T00:00:00Z`);
    siguienteDia.setUTCDate(siguienteDia.getUTCDate() + 1);
    condiciones.push('o.fecha_recepcion < :hasta');
    params.hasta = siguienteDia.toISOString();
  }
  if (tecnico) {
    condiciones.push('o.usuario_id = :tecnico');
    params.tecnico = tecnico;
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const porPag = Math.min(Math.max(porPagina, 1), 100);
  const pag = Math.max(pagina, 1);

  const total = db.prepare(`SELECT COUNT(*) AS n FROM (${SELECT_LISTADO} ${where})`).get(params).n;
  const ordenes = db
    .prepare(`${SELECT_LISTADO} ${where} ORDER BY o.fecha_recepcion DESC, o.id DESC LIMIT :limite OFFSET :salto`)
    .all({ ...params, limite: porPag, salto: (pag - 1) * porPag });
  const resumen = db
    .prepare(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(estado <> 'Entregado'), 0) AS activas,
              COALESCE(SUM(estado = 'Entregado'), 0) AS entregadas
         FROM ordenes`,
    )
    .get();

  return {
    ordenes,
    paginacion: { pagina: pag, por_pagina: porPag, total, paginas: Math.ceil(total / porPag) },
    resumen,
  };
}

module.exports = {
  ESTADOS,
  TIPOS_REFACCION,
  normalizarAccesorios,
  registrarEvento,
  crearOrden,
  actualizarEstadoInicial,
  avanzarEstado,
  prepararEvidencias,
  agregarRefaccion,
  editarRefaccion,
  eliminarRefaccion,
  registrarGarantia,
  obtenerDetalle,
  dashboard,
  listar,
};
