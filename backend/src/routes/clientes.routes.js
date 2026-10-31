/**
 * @file clientes.routes.js
 * @description Registro y búsqueda de clientes por teléfono.
 * @task T09 (RF-02)
 * @author María Fernanda González Rodríguez
 */
const express = require('express');
const { db } = require('../db/conexion');
const { HttpError } = require('../utils/errores');
const { validar, reglas, idValido, texto } = require('../middleware/validar');

const router = express.Router();

const COLUMNAS = 'id, nombre_completo, telefono, email, fecha_registro';

// GET /api/clientes?telefono=3312345678 → para reutilizar un cliente ya registrado
router.get('/', (req, res) => {
  const telefono = texto(req.query.telefono);
  if (!telefono) throw new HttpError(400, 'Indica el teléfono a buscar');
  const cliente = db.prepare(`SELECT ${COLUMNAS} FROM clientes WHERE telefono = ?`).get(telefono);
  if (!cliente) throw new HttpError(404, 'No existe un cliente con ese teléfono');
  res.json({ cliente });
});

router.get('/:id', (req, res) => {
  const cliente = db.prepare(`SELECT ${COLUMNAS} FROM clientes WHERE id = ?`).get(idValido(req.params.id));
  if (!cliente) throw new HttpError(404, 'Cliente no encontrado');
  const dispositivos = db
    .prepare('SELECT id, tipo, marca, modelo, color, imei_o_serie FROM dispositivos WHERE cliente_id = ?')
    .all(cliente.id);
  res.json({ cliente, dispositivos });
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
    const existente = db.prepare(`SELECT ${COLUMNAS} FROM clientes WHERE telefono = ?`).get(telefono);
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

module.exports = router;
