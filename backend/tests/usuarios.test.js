/**
 * @file usuarios.test.js
 * @description Pruebas de gestión de usuarios: permisos por rol, alta, edición y desactivación.
 *              Uso: `npm test`
 * @task T05 (apoyo a QA T08)
 * @author María Fernanda González Rodríguez
 */
const { test, before } = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'secreto-de-pruebas';

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const { db } = require('../src/db/conexion');

const login = async (email, password) =>
  request(app).post('/api/auth/login').send({ email, password });

let admin;
const comoAdmin = () => ({ Authorization: `Bearer ${admin}` });

before(async () => {
  db.prepare("INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ('Admin', 'admin@infofix.test', ?, 'admin')").run(
    bcrypt.hashSync('Admin123!', 10),
  );
  admin = (await login('admin@infofix.test', 'Admin123!')).body.token;
});

test('el administrador da de alta un técnico que puede iniciar sesión', async () => {
  const corta = await request(app)
    .post('/api/usuarios')
    .set(comoAdmin())
    .send({ nombre: 'Luis', email: 'luis@infofix.test', password: '123' });
  assert.equal(corta.status, 400);
  assert.equal(corta.body.campos[0].campo, 'password');

  const creado = await request(app)
    .post('/api/usuarios')
    .set(comoAdmin())
    .send({ nombre: 'Luis', email: 'Luis@InfoFix.test', password: 'Tecnico123' });
  assert.equal(creado.status, 201);
  assert.equal(creado.body.usuario.rol, 'tecnico');
  assert.equal(creado.body.usuario.email, 'luis@infofix.test');
  assert.equal(creado.body.usuario.password_hash, undefined);

  const duplicado = await request(app)
    .post('/api/usuarios')
    .set(comoAdmin())
    .send({ nombre: 'Otro', email: 'luis@infofix.test', password: 'Tecnico123' });
  assert.equal(duplicado.status, 409);

  assert.equal((await login('luis@infofix.test', 'Tecnico123')).status, 200);
});

test('un técnico no puede gestionar usuarios', async () => {
  const tecnico = (await login('luis@infofix.test', 'Tecnico123')).body.token;
  const res = await request(app).get('/api/usuarios').set({ Authorization: `Bearer ${tecnico}` });
  assert.equal(res.status, 403);
});

test('cambiar contraseña y desactivar cuenta surten efecto de inmediato', async () => {
  const { id } = db.prepare("SELECT id FROM usuarios WHERE email = 'luis@infofix.test'").get();
  const tecnico = (await login('luis@infofix.test', 'Tecnico123')).body.token;

  const cambio = await request(app).patch(`/api/usuarios/${id}`).set(comoAdmin()).send({ password: 'NuevaClave9' });
  assert.equal(cambio.status, 200);
  assert.equal((await login('luis@infofix.test', 'Tecnico123')).status, 401);
  assert.equal((await login('luis@infofix.test', 'NuevaClave9')).status, 200);

  const baja = await request(app).patch(`/api/usuarios/${id}`).set(comoAdmin()).send({ activo: false });
  assert.equal(baja.body.usuario.activo, false);

  // El token que ya tenía deja de servir y ya no puede volver a entrar
  const conTokenViejo = await request(app).get('/api/dashboard').set({ Authorization: `Bearer ${tecnico}` });
  assert.equal(conTokenViejo.status, 401);
  assert.equal((await login('luis@infofix.test', 'NuevaClave9')).status, 401);
});

test('el administrador no puede desactivarse ni quitarse el rol a sí mismo', async () => {
  const { id } = db.prepare("SELECT id FROM usuarios WHERE email = 'admin@infofix.test'").get();
  const res = await request(app).patch(`/api/usuarios/${id}`).set(comoAdmin()).send({ activo: false });
  assert.equal(res.status, 409);
  const rol = await request(app).patch(`/api/usuarios/${id}`).set(comoAdmin()).send({ rol: 'tecnico' });
  assert.equal(rol.status, 409);
});
