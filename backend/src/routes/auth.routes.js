/**
 * @file auth.routes.js
 * @description Login del personal del taller y emisión de JWT (8h).
 * @task T05 (RF-01)
 * @author María Fernanda González Rodríguez
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { db } = require('../db/conexion');
const { HttpError } = require('../utils/errores');
const { validar, reglas, texto } = require('../middleware/validar');
const { requiereSesion } = require('../middleware/auth');

const router = express.Router();

/**
 * Valida credenciales del técnico y genera un token JWT.
 *
 * @param {string} email - Correo del técnico.
 * @param {string} password - Contraseña en texto plano.
 * @returns {Promise<{token: string, usuario: Object}>}
 * @throws {HttpError} 401 si las credenciales son inválidas.
 */
async function autenticarUsuario(email, password) {
  const usuario = db
    .prepare('SELECT id, nombre, email, rol, password_hash FROM usuarios WHERE email = ?')
    .get(email);
  // Mismo mensaje para correo o contraseña incorrectos: no revelamos cuál falló (RF-01)
  if (!usuario || !(await bcrypt.compare(password, usuario.password_hash))) {
    throw new HttpError(401, 'Correo o contraseña incorrectos');
  }
  const token = jwt.sign({ sub: usuario.id, nombre: usuario.nombre, rol: usuario.rol }, config.jwtSecret, {
    expiresIn: config.jwtExpiraEn,
  });
  const { password_hash, ...publico } = usuario;
  return { token, usuario: publico };
}

router.post(
  '/login',
  validar({
    email: [reglas.requerido('El correo es obligatorio'), reglas.email('El correo no tiene un formato válido')],
    password: [reglas.requerido('La contraseña es obligatoria')],
  }),
  async (req, res) => {
    res.json(await autenticarUsuario(texto(req.body.email), req.body.password));
  },
);

router.get('/me', requiereSesion, (req, res) => {
  res.json({ usuario: req.usuario });
});

module.exports = router;
