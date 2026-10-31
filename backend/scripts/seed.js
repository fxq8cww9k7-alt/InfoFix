/**
 * @file seed.js
 * @description Crea (o actualiza) el usuario administrador de desarrollo definido en .env.
 *              Uso: `npm run seed`
 * @task T05
 * @author María Fernanda González Rodríguez
 */
const bcrypt = require('bcryptjs');
const { db } = require('../src/db/conexion');

const RONDAS_BCRYPT = 10; // RF-01: mínimo 10 rondas

const nombre = process.env.SEED_ADMIN_NOMBRE || 'Administrador';
const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;

if (!email || !password) {
  console.error('Define SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD en backend/.env');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, RONDAS_BCRYPT);
db.prepare(
  `INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, 'admin')
   ON CONFLICT(email) DO UPDATE SET nombre = excluded.nombre, password_hash = excluded.password_hash`,
).run(nombre, email, hash);

console.log(`Usuario listo: ${email}`);
