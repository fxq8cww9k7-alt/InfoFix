/**
 * @file dispositivos.routes.js
 * @description Registro de dispositivos por IMEI/serie e historial de reparaciones.
 * @task T10 (RF-03, RF-15)
 * @author María Fernanda González Rodríguez
 */
const express = require('express');
const { db } = require('../db/conexion');
const { HttpError } = require('../utils/errores');
const { validar, reglas, imeiOSerie, idValido, texto } = require('../middleware/validar');

const router = express.Router();

const TIPOS = ['celular', 'tablet', 'laptop', 'otro'];
const COLUMNAS = 'id, cliente_id, tipo, marca, modelo, color, imei_o_serie, fecha_registro';

// GET /api/dispositivos?imei_o_serie=... → para reutilizar un equipo que ya vino antes
router.get('/', (req, res) => {
  const imei = texto(req.query.imei_o_serie);
  if (!imei) throw new HttpError(400, 'Indica el IMEI o número de serie a buscar');
  const dispositivo = db.prepare(`SELECT ${COLUMNAS} FROM dispositivos WHERE imei_o_serie = ?`).get(imei);
  if (!dispositivo) throw new HttpError(404, 'No existe un dispositivo con ese IMEI o número de serie');
  res.json({ dispositivo });
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
        'INSERT INTO dispositivos (cliente_id, tipo, marca, modelo, color, imei_o_serie) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(clienteId, texto(req.body.tipo), texto(req.body.marca), texto(req.body.modelo), texto(req.body.color) || null, imei);
    const dispositivo = db.prepare(`SELECT ${COLUMNAS} FROM dispositivos WHERE id = ?`).get(lastInsertRowid);
    res.status(201).json({ dispositivo });
  },
);

// RF-15: reparaciones certificadas (Entregado) del equipo, de la más reciente a la más antigua
router.get('/:id/historial', (req, res) => {
  const dispositivo = db.prepare(`SELECT ${COLUMNAS} FROM dispositivos WHERE id = ?`).get(idValido(req.params.id));
  if (!dispositivo) throw new HttpError(404, 'Dispositivo no encontrado');
  const reparaciones = db
    .prepare(
      `SELECT id, folio, falla_reportada, fecha_recepcion, fecha_entrega
         FROM ordenes WHERE dispositivo_id = ? AND estado = 'Entregado'
        ORDER BY fecha_entrega DESC`,
    )
    .all(dispositivo.id);
  res.json({
    dispositivo,
    reparaciones,
    mensaje: reparaciones.length ? null : 'Primera reparación certificada registrada para este equipo',
  });
});

module.exports = router;
