/**
 * @file config.js
 * @description Carga y centraliza las variables de entorno del backend.
 * @task T04
 * @author María Fernanda González Rodríguez
 */
const fs = require('node:fs');
const path = require('node:path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

const RAIZ_BACKEND = path.join(__dirname, '..');

/**
 * Resuelve rutas relativas contra la carpeta backend/ (no contra el cwd),
 * para que `npm start` funcione igual desde cualquier carpeta.
 *
 * @param {string} ruta - Ruta absoluta, relativa o ':memory:'.
 * @returns {string}
 */
function resolverRuta(ruta) {
  if (ruta === ':memory:' || path.isAbsolute(ruta)) return ruta;
  return path.join(RAIZ_BACKEND, ruta);
}

/**
 * Usa el esquema oficial de BD (database/schema.sql, T02/T03) si ya existe;
 * mientras tanto, el esquema provisional del backend.
 *
 * @returns {string} Ruta absoluta del .sql a ejecutar al arrancar.
 */
function elegirEsquema() {
  const oficial = path.join(RAIZ_BACKEND, '..', 'database', 'schema.sql');
  if (fs.existsSync(oficial)) return oficial;
  return path.join(RAIZ_BACKEND, 'src', 'db', 'schema.provisional.sql');
}

const config = {
  puerto: Number(process.env.PORT) || 3000,
  entorno: process.env.NODE_ENV || 'development',
  dbPath: resolverRuta(process.env.DB_PATH || '../database/infofix.sqlite'),
  schemaPath: elegirEsquema(),
  uploadsDir: resolverRuta(process.env.UPLOADS_DIR || 'uploads'),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiraEn: process.env.JWT_EXPIRES_IN || '8h',
  rondasBcrypt: 10, // RF-01: mínimo 10 rondas
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || 'http://localhost:5173').replace(/\/+$/, ''),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  maxArchivoBytes: Number(process.env.MAX_FILE_SIZE_BYTES) || 5 * 1024 * 1024,
  maxFotosPorEtapa: Number(process.env.MAX_PHOTOS_PER_STAGE) || 5,
  // Sin código configurado el registro público (P2) queda deshabilitado
  codigoTaller: process.env.CODIGO_TALLER || '',
  minutosRecuperacion: 30,
  // Datos del taller que se muestran en la nota de servicio y en la página de estatus (P12, P15)
  taller: {
    nombre: process.env.TALLER_NOMBRE || 'InfoFIX',
    telefono: process.env.TALLER_TELEFONO || '',
    direccion: process.env.TALLER_DIRECCION || '',
    email: process.env.TALLER_EMAIL || '',
  },
  // Sin SMTP_HOST los correos se imprimen en la consola (modo desarrollo)
  smtp: {
    host: process.env.SMTP_HOST || '',
    puerto: Number(process.env.SMTP_PORT) || 587,
    usuario: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASS || '',
    remitente: process.env.SMTP_FROM || 'InfoFIX <no-responder@infofix.test>',
  },
  // Reglas de notificaciones automáticas (P5)
  diasOrdenDetenida: Number(process.env.DIAS_ORDEN_DETENIDA) || 3,
  diasAvisoGarantia: Number(process.env.DIAS_AVISO_GARANTIA) || 7,
};

if (!config.jwtSecret) {
  throw new Error('Falta JWT_SECRET en backend/.env (copia .env.example como .env)');
}

module.exports = config;
