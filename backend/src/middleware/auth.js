/**
 * @file auth.js
 * @description Middleware de seguridad (bloque 2.2): verifica el JWT en las rutas privadas.
 *              En esta versión no hay roles: todo el personal del taller tiene los mismos permisos.
 * @task T05 (RF-01)
 * @author María Fernanda González Rodríguez
 */
const jwt = require('jsonwebtoken');
const config = require('../config');
const { db } = require('../db/conexion');
const { HttpError } = require('../utils/errores');

const MSG_SESION = 'Sesión no válida o expirada. Inicia sesión nuevamente';

/**
 * Exige header `Authorization: Bearer <token>` válido y deja el usuario en `req.usuario`.
 * El usuario se vuelve a leer de la BD para que una cuenta desactivada o un cambio de
 * contraseña surtan efecto de inmediato, sin esperar a que venza el token.
 *
 * @throws {HttpError} 401 si falta el token, es inválido, expiró o la cuenta está desactivada.
 */
function requiereSesion(req, res, next) {
  const [esquema, token] = (req.headers.authorization || '').split(' ');
  if (esquema !== 'Bearer' || !token) throw new HttpError(401, MSG_SESION);
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new HttpError(401, MSG_SESION);
  }
  const usuario = db
    .prepare('SELECT id, nombre, email, version_sesion FROM usuarios WHERE id = ? AND activo = 1')
    .get(payload.sub);
  // version_sesion cambia al restablecer o cambiar la contraseña: los tokens anteriores dejan de servir
  if (!usuario || usuario.version_sesion !== payload.ver) throw new HttpError(401, MSG_SESION);
  const { version_sesion, ...publico } = usuario;
  req.usuario = publico;
  next();
}

module.exports = { requiereSesion };
