/**
 * @file clientes.routes.js
 * @description Registro, búsqueda, ficha y edición de clientes.
 * @task T09 (RF-02; pantalla P18)
 * @author María Fernanda González Rodríguez
 */
const express = require('express');
const { db } = require('../db/conexion');
const { HttpError } = require('../utils/errores');
const { validar, reglas, idValido, texto } = require('../middleware/validar');

const router = express.Router();

const COLUMNAS = 'id, nombre_completo, telefono, email, fecha_registro';
const ORDENES_LISTA = { nombre: 'c.nombre_completo COLLATE NOCASE ASC', reciente: 'ultima_visita DESC' };

const buscarPorTelefono = (telefono) => db.prepare(`SELECT ${COLUMNAS} FROM clientes WHERE telefono = ?`).get(telefono);

/**
 * GET /api/clientes?telefono=3312345678 → un cliente (para reutilizarlo al recibir un equipo)
 * GET /api/clientes?q=&orden=nombre|reciente → lista con número de órdenes y última visita (P18)
 */
router.get('/', (req, res) => {
  const telefono = texto(req.query.telefono);
  if (telefono) {
    const cliente = buscarPorTelefono(telefono);
    if (!cliente) throw new HttpError(404, 'No existe un cliente con ese teléfono');
    return res.json({ cliente });
  }

  const q = texto(req.query.q);
  const orden = ORDENES_LISTA[texto(req.query.orden) || 'nombre'];
  if (!orden) throw new HttpError(400, 'El orden debe ser nombre o reciente');
  const clientes = db
    .prepare(
      `SELECT c.id, c.nombre_completo, c.telefono, c.email, c.fecha_registro,
              COUNT(o.id) AS num_ordenes, MAX(o.fecha_recepcion) AS ultima_visita
         FROM clientes c
         LEFT JOIN dispositivos d ON d.cliente_id = c.id
         LEFT JOIN ordenes o ON o.dispositivo_id = d.id
        ${q ? 'WHERE c.nombre_completo LIKE :q OR c.telefono LIKE :q OR c.email LIKE :q' : ''}
        GROUP BY c.id
        ORDER BY ${orden}`,
    )
    .all(q ? { q: `%${q}%` } : {});
  res.json({ clientes, total: clientes.length });
});

// Ficha del cliente: contacto, indicadores, equipos y órdenes recientes (P18)
router.get('/:id', (req, res) => {
  const cliente = db.prepare(`SELECT ${COLUMNAS} FROM clientes WHERE id = ?`).get(idValido(req.params.id));
  if (!cliente) throw new HttpError(404, 'Cliente no encontrado');
  const dispositivos = db
    .prepare('SELECT id, tipo, marca, modelo, color, imei_o_serie FROM dispositivos WHERE cliente_id = ? ORDER BY id')
    .all(cliente.id);
  const ordenes = db
    .prepare(
      `SELECT o.id, o.folio, o.estado, o.fecha_recepcion, o.fecha_entrega, o.garantia_fin,
              d.marca, d.modelo
         FROM ordenes o JOIN dispositivos d ON d.id = o.dispositivo_id
        WHERE d.cliente_id = ?
        ORDER BY o.fecha_recepcion DESC, o.id DESC`,
    )
    .all(cliente.id);
  const ahora = new Date().toISOString();
  res.json({
    cliente,
    resumen: {
      ordenes: ordenes.length,
      activas: ordenes.filter((o) => o.estado !== 'Entregado').length,
      garantias_vigentes: ordenes.filter((o) => o.garantia_fin && o.garantia_fin >= ahora).length,
    },
    dispositivos,
    ordenes_recientes: ordenes.slice(0, 10),
  });
});

router.post(
  '/',
  validar({
    nombre_completo: [reglas.requerido('El nombre completo es obligatorio')],
    telefono: [reglas.telefono()],
    email: [reglas.emailOpcional('El correo no tiene un formato válido')],
    aviso_privacidad: [reglas.verdadero('Debe aceptarse el aviso de privacidad')],
  }),
  (req, res) => {
    const telefono = texto(req.body.telefono);
    const existente = buscarPorTelefono(telefono);
    // Si el teléfono ya está registrado regresamos el cliente para que el frontend lo seleccione
    if (existente) {
      throw new HttpError(409, 'Ya existe un cliente con ese teléfono', { cliente: existente });
    }
    const { lastInsertRowid } = db
      .prepare('INSERT INTO clientes (nombre_completo, telefono, email, aviso_privacidad) VALUES (?, ?, ?, 1)')
      .run(texto(req.body.nombre_completo), telefono, texto(req.body.email) || null);
    const cliente = db.prepare(`SELECT ${COLUMNAS} FROM clientes WHERE id = ?`).get(lastInsertRowid);
    res.status(201).json({ cliente });
  },
);

// Edición de contacto (P18). Campos opcionales; un correo vacío ("") lo borra
router.patch(
  '/:id',
  validar({
    nombre_completo: [(v) => (v === undefined || texto(v) ? null : 'El nombre completo no puede quedar vacío')],
    telefono: [(v, body) => (v === undefined ? null : reglas.telefono()(v, body))],
    email: [reglas.emailOpcional('El correo no tiene un formato válido')],
  }),
  (req, res) => {
    const id = idValido(req.params.id);
    if (!db.prepare('SELECT 1 FROM clientes WHERE id = ?').get(id)) throw new HttpError(404, 'Cliente no encontrado');
    const { nombre_completo: nombre, telefono, email } = req.body;
    if (telefono !== undefined) {
      const otro = buscarPorTelefono(texto(telefono));
      if (otro && otro.id !== id) throw new HttpError(409, 'Ya existe otro cliente con ese teléfono');
    }
    db.prepare(
      `UPDATE clientes SET nombre_completo = COALESCE(?, nombre_completo),
                           telefono = COALESCE(?, telefono),
                           email = CASE WHEN ? THEN ? ELSE email END
        WHERE id = ?`,
    ).run(
      nombre === undefined ? null : texto(nombre),
      telefono === undefined ? null : texto(telefono),
      Number(email !== undefined),
      texto(email) || null,
      id,
    );
    res.json({ cliente: db.prepare(`SELECT ${COLUMNAS} FROM clientes WHERE id = ?`).get(id) });
  },
);

module.exports = router;
