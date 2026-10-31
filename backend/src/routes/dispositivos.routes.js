/**
 * @file dispositivos.routes.js
 * @description Registro, lista, edición e historial de dispositivos por IMEI/serie.
 * @task T10 (RF-03, RF-15; pantallas P6, P19, P20)
 * @author María Fernanda González Rodríguez
 */
const express = require('express');
const { db } = require('../db/conexion');
const { HttpError } = require('../utils/errores');
const { validar, reglas, imeiOSerie, idValido, texto } = require('../middleware/validar');
const { resumenGarantia } = require('../services/certificado.service');

const router = express.Router();

const TIPOS = ['celular', 'tablet', 'laptop', 'otro'];
const COLUMNAS = 'id, cliente_id, tipo, marca, modelo, color, imei_o_serie, contrasena_equipo, fecha_registro';

const obtener = (id) => db.prepare(`SELECT ${COLUMNAS} FROM dispositivos WHERE id = ?`).get(id);

/**
 * GET /api/dispositivos?imei_o_serie=... → un dispositivo (para reutilizar un equipo que ya vino antes)
 * GET /api/dispositivos?q=&tipo= → lista con propietario, reparaciones certificadas y orden activa (P19)
 */
router.get('/', (req, res) => {
  const imei = texto(req.query.imei_o_serie);
  if (imei) {
    const dispositivo = db.prepare(`SELECT ${COLUMNAS} FROM dispositivos WHERE imei_o_serie = ?`).get(imei);
    if (!dispositivo) throw new HttpError(404, 'No existe un dispositivo con ese IMEI o número de serie');
    return res.json({ dispositivo });
  }

  const q = texto(req.query.q);
  const tipo = texto(req.query.tipo);
  if (tipo && !TIPOS.includes(tipo)) throw new HttpError(400, 'El tipo debe ser celular, tablet, laptop u otro');
  const condiciones = [];
  const params = {};
  if (q) {
    condiciones.push(
      '(d.imei_o_serie LIKE :q OR d.marca LIKE :q OR d.modelo LIKE :q OR c.nombre_completo LIKE :q)',
    );
    params.q = `%${q}%`;
  }
  if (tipo) {
    condiciones.push('d.tipo = :tipo');
    params.tipo = tipo;
  }
  const dispositivos = db
    .prepare(
      `SELECT d.id, d.tipo, d.marca, d.modelo, d.color, d.imei_o_serie,
              c.id AS cliente_id, c.nombre_completo AS propietario,
              (SELECT COUNT(*) FROM ordenes o WHERE o.dispositivo_id = d.id AND o.estado = 'Entregado')
                AS reparaciones_certificadas,
              (SELECT o.folio FROM ordenes o WHERE o.dispositivo_id = d.id AND o.estado <> 'Entregado')
                AS orden_activa
         FROM dispositivos d JOIN clientes c ON c.id = d.cliente_id
        ${condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : ''}
        ORDER BY d.id DESC`,
    )
    .all(params);
  res.json({ dispositivos, total: dispositivos.length });
});

router.post(
  '/',
  validar({
    cliente_id: [reglas.requerido('Selecciona el cliente propietario')],
    tipo: [reglas.enLista(TIPOS, 'El tipo debe ser celular, tablet, laptop u otro')],
    marca: [reglas.requerido('La marca es obligatoria')],
    modelo: [reglas.requerido('El modelo es obligatorio')],
    imei_o_serie: [imeiOSerie],
  }),
  (req, res) => {
    const clienteId = idValido(req.body.cliente_id);
    if (!db.prepare('SELECT 1 FROM clientes WHERE id = ?').get(clienteId)) {
      throw new HttpError(404, 'El cliente indicado no existe');
    }
    const imei = texto(req.body.imei_o_serie);
    const existente = db.prepare(`SELECT ${COLUMNAS} FROM dispositivos WHERE imei_o_serie = ?`).get(imei);
    if (existente) {
      throw new HttpError(409, 'El dispositivo ya está registrado', { dispositivo: existente });
    }
    const { lastInsertRowid } = db
      .prepare(
        `INSERT INTO dispositivos (cliente_id, tipo, marca, modelo, color, imei_o_serie, contrasena_equipo)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        clienteId,
        texto(req.body.tipo),
        texto(req.body.marca),
        texto(req.body.modelo),
        texto(req.body.color) || null,
        imei,
        texto(req.body.contrasena_equipo) || null,
      );
    res.status(201).json({ dispositivo: obtener(lastInsertRowid) });
  },
);

/**
 * Edición del equipo (P18). Si el equipo ya tiene certificados emitidos, sus datos de
 * identificación (tipo, marca, modelo, IMEI) no se pueden cambiar porque aparecen en ellos.
 */
router.patch('/:id', (req, res) => {
  const actual = obtener(idValido(req.params.id));
  if (!actual) throw new HttpError(404, 'Dispositivo no encontrado');
  const body = req.body || {};
  const nuevo = {
    tipo: body.tipo === undefined ? actual.tipo : texto(body.tipo),
    marca: body.marca === undefined ? actual.marca : texto(body.marca),
    modelo: body.modelo === undefined ? actual.modelo : texto(body.modelo),
    color: body.color === undefined ? actual.color : texto(body.color) || null,
    imei_o_serie: body.imei_o_serie === undefined ? actual.imei_o_serie : texto(body.imei_o_serie),
    contrasena_equipo:
      body.contrasena_equipo === undefined ? actual.contrasena_equipo : texto(body.contrasena_equipo) || null,
  };

  // Mismas reglas que al registrar
  validar({
    tipo: [reglas.enLista(TIPOS, 'El tipo debe ser celular, tablet, laptop u otro')],
    marca: [reglas.requerido('La marca es obligatoria')],
    modelo: [reglas.requerido('El modelo es obligatorio')],
    imei_o_serie: [imeiOSerie],
  })({ body: nuevo }, res, () => {});

  const cambiaIdentidad = ['tipo', 'marca', 'modelo', 'imei_o_serie'].some((c) => nuevo[c] !== actual[c]);
  if (cambiaIdentidad) {
    const certificados = db
      .prepare('SELECT COUNT(*) AS n FROM certificados c JOIN ordenes o ON o.id = c.orden_id WHERE o.dispositivo_id = ?')
      .get(actual.id).n;
    if (certificados) {
      throw new HttpError(409, 'El equipo ya tiene certificados emitidos: solo se pueden cambiar el color y la contraseña');
    }
  }
  if (nuevo.imei_o_serie !== actual.imei_o_serie) {
    const otro = db.prepare('SELECT id FROM dispositivos WHERE imei_o_serie = ?').get(nuevo.imei_o_serie);
    if (otro) throw new HttpError(409, 'Ya existe otro dispositivo con ese IMEI o número de serie');
  }

  db.prepare(
    `UPDATE dispositivos SET tipo = ?, marca = ?, modelo = ?, color = ?, imei_o_serie = ?, contrasena_equipo = ?
      WHERE id = ?`,
  ).run(nuevo.tipo, nuevo.marca, nuevo.modelo, nuevo.color, nuevo.imei_o_serie, nuevo.contrasena_equipo, actual.id);
  res.json({ dispositivo: obtener(actual.id) });
});

// RF-15 / P20: expediente del equipo con sus reparaciones, de la más reciente a la más antigua
router.get('/:id/historial', (req, res) => {
  const dispositivo = obtener(idValido(req.params.id));
  if (!dispositivo) throw new HttpError(404, 'Dispositivo no encontrado');
  const propietario = db
    .prepare('SELECT id, nombre_completo, telefono, email FROM clientes WHERE id = ?')
    .get(dispositivo.cliente_id);
  const filas = db
    .prepare('SELECT * FROM ordenes WHERE dispositivo_id = ? ORDER BY fecha_recepcion DESC, id DESC')
    .all(dispositivo.id);
  const piezas = db.prepare('SELECT nombre, tipo, numero_serie FROM refacciones WHERE orden_id = ? ORDER BY id');

  const reparaciones = filas
    .filter((o) => o.estado === 'Entregado')
    .sort((a, b) => b.fecha_entrega.localeCompare(a.fecha_entrega))
    .map((o) => ({
      id: o.id,
      folio: o.folio,
      falla_reportada: o.falla_reportada,
      fecha_recepcion: o.fecha_recepcion,
      fecha_entrega: o.fecha_entrega,
      refacciones: piezas.all(o.id),
      garantia: resumenGarantia(o),
    }));
  const activa = filas.find((o) => o.estado !== 'Entregado');

  res.json({
    dispositivo,
    propietario,
    resumen: {
      reparaciones_certificadas: reparaciones.length,
      orden_activa: activa ? { id: activa.id, folio: activa.folio, estado: activa.estado } : null,
      primera_visita: filas.length ? filas[filas.length - 1].fecha_recepcion : null,
    },
    reparaciones,
    mensaje: reparaciones.length ? null : 'Primera reparación certificada registrada para este equipo',
  });
});

module.exports = router;
