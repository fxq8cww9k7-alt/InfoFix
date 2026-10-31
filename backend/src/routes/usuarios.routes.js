/**
 * @file usuarios.routes.js
 * @description Gestión de cuentas del personal del taller (solo administradores):
 *              alta de técnicos, listado, edición, cambio de contraseña y desactivación.
 * @task T05 (RF-01)
 * @author María Fernanda González Rodríguez
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const config = require('../config');
const { db } = require('../db/conexion');
const { HttpError } = require('../utils/errores');
const { validar, reglas, idValido, texto } = require('../middleware/validar');

const router = express.Router();

const ROLES = ['admin', 'tecnico'];
const COLUMNAS = 'id, nombre, email, rol, activo, fecha_registro';

/**
 * Lee un usuario para responder (sin hash) o lanza 404.
 *
 * @param {number} id
 * @returns {Object}
 * @throws {HttpError} 404 si no existe.
 */
function obtenerUsuario(id) {
  const usuario = db.prepare(`SELECT ${COLUMNAS} FROM usuarios WHERE id = ?`).get(id);
  if (!usuario) throw new HttpError(404, 'Usuario no encontrado');
  return { ...usuario, activo: Boolean(usuario.activo) };
}

router.get('/', (req, res) => {
  const usuarios = db
    .prepare(`SELECT ${COLUMNAS} FROM usuarios ORDER BY nombre`)
    .all()
    .map((u) => ({ ...u, activo: Boolean(u.activo) }));
  res.json({ usuarios });
});

router.post(
  '/',
  validar({
    nombre: [reglas.requerido('El nombre es obligatorio')],
    email: [reglas.requerido('El correo es obligatorio'), reglas.email('El correo no tiene un formato válido')],
    password: [reglas.password()],
    rol: [(v) => (v === undefined || ROLES.includes(v) ? null : 'El rol debe ser admin o tecnico')],
  }),
  async (req, res) => {
    const email = texto(req.body.email).toLowerCase();
    if (db.prepare('SELECT 1 FROM usuarios WHERE email = ?').get(email)) {
      throw new HttpError(409, 'Ya existe un usuario con ese correo', {
        campos: [{ campo: 'email', mensaje: 'Ya existe un usuario con ese correo' }],
      });
    }
    const hash = await bcrypt.hash(req.body.password, config.rondasBcrypt);
    const { lastInsertRowid } = db
      .prepare('INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)')
      .run(texto(req.body.nombre), email, hash, req.body.rol || 'tecnico');
    res.status(201).json({ usuario: obtenerUsuario(lastInsertRowid) });
  },
);

router.get('/:id', (req, res) => {
  res.json({ usuario: obtenerUsuario(idValido(req.params.id)) });
});

// Todos los campos son opcionales: { nombre?, rol?, activo?, password? }
router.patch(
  '/:id',
  validar({
    nombre: [(v) => (v === undefined || texto(v) ? null : 'El nombre no puede quedar vacío')],
    rol: [(v) => (v === undefined || ROLES.includes(v) ? null : 'El rol debe ser admin o tecnico')],
    activo: [(v) => (v === undefined || typeof v === 'boolean' ? null : 'activo debe ser true o false')],
    password: [(v, body) => (v === undefined ? null : reglas.password()(v, body))],
  }),
  async (req, res) => {
    const id = idValido(req.params.id);
    obtenerUsuario(id);
    const { nombre, rol, activo, password } = req.body;

    // Evita que un administrador se quede fuera del sistema por error
    if (id === req.usuario.id && (activo === false || (rol && rol !== 'admin'))) {
      throw new HttpError(409, 'No puedes desactivar tu propia cuenta ni quitarte el rol de administrador');
    }

    const hash = password === undefined ? null : await bcrypt.hash(password, config.rondasBcrypt);
    // Un cambio de contraseña cierra las sesiones abiertas de ese usuario
    db.prepare(
      `UPDATE usuarios SET nombre = COALESCE(?, nombre),
                           rol = COALESCE(?, rol),
                           activo = COALESCE(?, activo),
                           password_hash = COALESCE(?, password_hash),
                           version_sesion = version_sesion + (? IS NOT NULL)
        WHERE id = ?`,
    ).run(
      nombre === undefined ? null : texto(nombre),
      rol ?? null,
      activo === undefined ? null : Number(activo),
      hash,
      hash,
      id,
    );
    res.json({ usuario: obtenerUsuario(id) });
  },
);

module.exports = router;
