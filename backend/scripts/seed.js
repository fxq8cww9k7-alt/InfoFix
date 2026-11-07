/**
 * @file seed.js
 * @description Crea (o actualiza) el usuario del taller para desarrollo definido en .env.
 *              Es un usuario normal del personal (en esta versión no hay administrador).
 *              Uso: `npm run seed`
 * @task T05
 * @author María Fernanda González Rodríguez
 */
const bcrypt = require('bcryptjs');
const config = require('../src/config');
const { db } = require('../src/db/conexion');

const nombre = process.env.SEED_USUARIO_NOMBRE || 'Técnico de pruebas';
const email = process.env.SEED_USUARIO_EMAIL;
const password = process.env.SEED_USUARIO_PASSWORD;

if (!email || !password) {
  console.error('Define SEED_USUARIO_EMAIL y SEED_USUARIO_PASSWORD en backend/.env');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, config.rondasBcrypt);
// Si el correo ya existe, se actualizan nombre y contraseña y se reactiva la cuenta
db.prepare(
  `INSERT INTO usuarios (nombre, email, password_hash) VALUES (?, ?, ?)
   ON CONFLICT(email) DO UPDATE SET nombre = excluded.nombre, password_hash = excluded.password_hash,
                                    activo = 1`,
).run(nombre, email, hash);

console.log(`Usuario listo: ${email}`);
