/**
 * @file auth.routes.js
 * @description Login, registro con código del taller y recuperación de contraseña por correo.
 * @task T05 (RF-01; pantallas P1, P2, P3)
 * @author María Fernanda González Rodríguez
 */
const crypto = require('node:crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { db, transaccion } = require('../db/conexion');
const { HttpError } = require('../utils/errores');
const { enviarCorreo } = require('../utils/correo');
const { validar, reglas, texto } = require('../middleware/validar');
const { requiereSesion } = require('../middleware/auth');

const router = express.Router();

const MSG_ENLACE_CADUCADO = 'Enlace caducado o no válido. Solicita uno nuevo para restablecer tu contraseña';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * Compara en tiempo constante para no filtrar el código del taller por diferencias de tiempo.
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function igualSeguro(a, b) {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/**
 * Emite el JWT. `ver` se compara contra `usuarios.version_sesion` en cada petición,
 * así al cambiar la contraseña se invalidan las sesiones abiertas en otros equipos.
 *
 * @param {{id: number, nombre: string, rol: string, version_sesion: number}} usuario
 * @returns {string}
 */
function firmarToken(usuario) {
  return jwt.sign(
    { sub: usuario.id, nombre: usuario.nombre, rol: usuario.rol, ver: usuario.version_sesion },
    config.jwtSecret,
    { expiresIn: config.jwtExpiraEn },
  );
}

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
    .prepare('SELECT id, nombre, email, rol, password_hash, version_sesion FROM usuarios WHERE email = ? AND activo = 1')
    .get(email);
  // Mismo mensaje para correo o contraseña incorrectos: no revelamos cuál falló (RF-01)
  if (!usuario || !(await bcrypt.compare(password, usuario.password_hash))) {
    throw new HttpError(401, 'Correo o contraseña incorrectos');
  }
  const { password_hash, version_sesion, ...publico } = usuario;
  return { token: firmarToken(usuario), usuario: publico };
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

// P2: alta pública de personal; requiere el código del taller (CODIGO_TALLER en .env)
router.post(
  '/registro',
  validar({
    nombre: [reglas.requerido('El nombre completo es obligatorio')],
    email: [reglas.requerido('El correo es obligatorio'), reglas.email('El correo no tiene un formato válido')],
    password: [reglas.password()],
    confirmar_password: [reglas.igualA('password', 'Las contraseñas no coinciden')],
    codigo_taller: [reglas.requerido('El código del taller es obligatorio')],
  }),
  async (req, res) => {
    if (!config.codigoTaller) {
      throw new HttpError(403, 'El registro está deshabilitado. Pide al encargado del taller que cree tu cuenta');
    }
    if (!igualSeguro(texto(req.body.codigo_taller), config.codigoTaller)) {
      throw new HttpError(403, 'El código del taller no es válido', {
        campos: [{ campo: 'codigo_taller', mensaje: 'El código del taller no es válido' }],
      });
    }
    const email = texto(req.body.email).toLowerCase();
    if (db.prepare('SELECT 1 FROM usuarios WHERE email = ?').get(email)) {
      throw new HttpError(409, 'Ya existe una cuenta con ese correo', {
        campos: [{ campo: 'email', mensaje: 'Ya existe una cuenta con ese correo' }],
      });
    }
    const hash = await bcrypt.hash(req.body.password, config.rondasBcrypt);
    const { lastInsertRowid } = db
      .prepare("INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, 'tecnico')")
      .run(texto(req.body.nombre), email, hash);
    const usuario = db.prepare('SELECT id, nombre, email, rol, fecha_registro FROM usuarios WHERE id = ?').get(lastInsertRowid);
    res.status(201).json({ usuario, mensaje: 'Cuenta creada. Ya puedes iniciar sesión' });
  },
);

// P3 paso 1: envía el enlace por correo. Siempre responde igual para no revelar qué correos existen
router.post(
  '/recuperar',
  validar({
    email: [reglas.requerido('El correo es obligatorio'), reglas.email('El correo no tiene un formato válido')],
  }),
  async (req, res) => {
    const usuario = db
      .prepare('SELECT id, nombre, email FROM usuarios WHERE email = ? AND activo = 1')
      .get(texto(req.body.email));
    if (usuario) {
      const token = crypto.randomBytes(32).toString('hex');
      const ahora = new Date();
      const expira = new Date(ahora.getTime() + config.minutosRecuperacion * 60 * 1000);
      transaccion(() => {
        // Solo el enlace más reciente sirve
        db.prepare('UPDATE recuperaciones SET usado = 1 WHERE usuario_id = ? AND usado = 0').run(usuario.id);
        db.prepare('INSERT INTO recuperaciones (usuario_id, token_hash, expira, fecha) VALUES (?, ?, ?, ?)').run(
          usuario.id,
          hashToken(token),
          expira.toISOString(),
          ahora.toISOString(),
        );
      });
      await enviarCorreo({
        para: usuario.email,
        asunto: 'Restablecer tu contraseña de InfoFIX',
        texto:
          `Hola ${usuario.nombre}:\n\nPara restablecer tu contraseña abre este enlace:\n` +
          `${config.publicBaseUrl}/restablecer?token=${token}\n\n` +
          `El enlace caduca en ${config.minutosRecuperacion} minutos y solo se puede usar una vez. ` +
          'Si no lo pediste, ignora este correo.',
      });
    }
    res.json({
      mensaje: `Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña. Caduca en ${config.minutosRecuperacion} minutos.`,
    });
  },
);

// P3 paso 2: guarda la nueva contraseña y cierra las sesiones abiertas en otros equipos
router.post(
  '/restablecer',
  validar({
    token: [reglas.requerido(MSG_ENLACE_CADUCADO)],
    password: [reglas.password()],
    confirmar_password: [reglas.igualA('password', 'Las contraseñas no coinciden')],
  }),
  async (req, res) => {
    const registro = db
      .prepare('SELECT id, usuario_id, expira, usado FROM recuperaciones WHERE token_hash = ?')
      .get(hashToken(texto(req.body.token)));
    if (!registro || registro.usado || new Date(registro.expira) < new Date()) {
      throw new HttpError(400, MSG_ENLACE_CADUCADO, { codigo: 'ENLACE_CADUCADO' });
    }
    const hash = await bcrypt.hash(req.body.password, config.rondasBcrypt);
    transaccion(() => {
      db.prepare('UPDATE recuperaciones SET usado = 1 WHERE id = ?').run(registro.id);
      db.prepare('UPDATE usuarios SET password_hash = ?, version_sesion = version_sesion + 1 WHERE id = ?').run(
        hash,
        registro.usuario_id,
      );
    });
    res.json({ mensaje: 'Contraseña actualizada. Ya puedes iniciar sesión' });
  },
);

router.get('/me', requiereSesion, (req, res) => {
  res.json({ usuario: req.usuario });
});

module.exports = router;
