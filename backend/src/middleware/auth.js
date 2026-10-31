/**
 * @file auth.js
 * @description Middleware de seguridad (bloque 2.2): verifica el JWT en las rutas privadas.
 * @task T05 (RF-01)
 * @author María Fernanda González Rodríguez
 */
const jwt = require('jsonwebtoken');
const config = require('../config');
const { HttpError } = require('../utils/errores');

/**
 * Exige header `Authorization: Bearer <token>` válido y deja el usuario en `req.usuario`.
 *
 * @throws {HttpError} 401 si falta el token, es inválido o ya expiró.
 */
function requiereSesion(req, res, next) {
  const [esquema, token] = (req.headers.authorization || '').split(' ');
  if (esquema !== 'Bearer' || !token) {
    throw new HttpError(401, 'Sesión no válida o expirada. Inicia sesión nuevamente');
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.usuario = { id: payload.sub, nombre: payload.nombre, rol: payload.rol };
  } catch {
    throw new HttpError(401, 'Sesión no válida o expirada. Inicia sesión nuevamente');
  }
  next();
}

module.exports = { requiereSesion };
