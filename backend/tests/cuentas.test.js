/**
 * @file cuentas.test.js
 * @description Pruebas de registro con código del taller (P2), recuperación de contraseña (P3)
 *              y notificaciones automáticas (P5).
 *              Uso: `npm test`
 * @task T05 (apoyo a QA T08)
 * @author María Fernanda González Rodríguez
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'secreto-de-pruebas';
process.env.CODIGO_TALLER = 'TALLER-2026';

const request = require('supertest');
const app = require('../src/app');
const { db } = require('../src/db/conexion');
const { bandejaPruebas } = require('../src/utils/correo');

const registro = (datos) =>
  request(app)
    .post('/api/auth/registro')
    .send({ nombre: 'Rosa Pérez', email: 'rosa@infofix.test', password: 'Clave1234', confirmar_password: 'Clave1234', codigo_taller: 'TALLER-2026', ...datos });
const login = (email, password) => request(app).post('/api/auth/login').send({ email, password });

test('registro: valida código del taller, contraseña y confirmación', async () => {
  const sinNumero = await registro({ password: 'sinnumero', confirmar_password: 'sinnumero' });
  assert.equal(sinNumero.status, 400);
  assert.equal(sinNumero.body.campos[0].campo, 'password');

  const distintas = await registro({ confirmar_password: 'Otra12345' });
  assert.equal(distintas.status, 400);
  assert.equal(distintas.body.error, 'Las contraseñas no coinciden');

  const codigoMalo = await registro({ codigo_taller: 'ADIVINO' });
  assert.equal(codigoMalo.status, 403);

  const ok = await registro();
  assert.equal(ok.status, 201);
  assert.equal(ok.body.usuario.rol, 'tecnico');

  assert.equal((await registro()).status, 409);
  assert.equal((await login('rosa@infofix.test', 'Clave1234')).status, 200);
});

test('recuperar contraseña: enlace de un solo uso que cierra las sesiones abiertas', async () => {
  const tokenViejo = (await login('rosa@infofix.test', 'Clave1234')).body.token;

  // Un correo no registrado recibe la misma respuesta y no se envía nada
  const antes = bandejaPruebas.length;
  const desconocido = await request(app).post('/api/auth/recuperar').send({ email: 'nadie@infofix.test' });
  assert.equal(desconocido.status, 200);
  assert.equal(bandejaPruebas.length, antes);

  const pedir = await request(app).post('/api/auth/recuperar').send({ email: 'rosa@infofix.test' });
  assert.equal(pedir.body.mensaje, desconocido.body.mensaje);
  const correo = bandejaPruebas.at(-1);
  assert.equal(correo.para, 'rosa@infofix.test');
  const token = correo.texto.match(/token=([a-f0-9]+)/)[1];

  const restablecer = (t) =>
    request(app).post('/api/auth/restablecer').send({ token: t, password: 'NuevaClave7', confirmar_password: 'NuevaClave7' });

  assert.equal((await restablecer(token)).status, 200);
  assert.equal((await login('rosa@infofix.test', 'Clave1234')).status, 401);
  assert.equal((await login('rosa@infofix.test', 'NuevaClave7')).status, 200);

  // La sesión que estaba abierta deja de servir
  const conViejo = await request(app).get('/api/auth/me').set({ Authorization: `Bearer ${tokenViejo}` });
  assert.equal(conViejo.status, 401);

  // El enlace ya no sirve una segunda vez
  const reuso = await restablecer(token);
  assert.equal(reuso.status, 400);
  assert.equal(reuso.body.codigo, 'ENLACE_CADUCADO');
});

test('recuperar contraseña: el enlace caduca a los 30 minutos', async () => {
  await request(app).post('/api/auth/recuperar').send({ email: 'rosa@infofix.test' });
  const token = bandejaPruebas.at(-1).texto.match(/token=([a-f0-9]+)/)[1];
  db.prepare("UPDATE recuperaciones SET expira = '2000-01-01T00:00:00.000Z' WHERE usado = 0").run();
  const res = await request(app)
    .post('/api/auth/restablecer')
    .send({ token, password: 'OtraClave8', confirmar_password: 'OtraClave8' });
  assert.equal(res.body.codigo, 'ENLACE_CADUCADO');
});

test('notificaciones automáticas: orden detenida y garantía por vencer', async () => {
  const { token } = (await login('rosa@infofix.test', 'NuevaClave7')).body;
  const auth = { Authorization: `Bearer ${token}` };
  const usuarioId = db.prepare("SELECT id FROM usuarios WHERE email = 'rosa@infofix.test'").get().id;

  // Datos armados directo en la BD para simular el paso del tiempo
  const cliente = db.prepare("INSERT INTO clientes (nombre_completo, telefono, aviso_privacidad) VALUES ('Leo', '3300000000', 1)").run().lastInsertRowid;
  const disp = db
    .prepare("INSERT INTO dispositivos (cliente_id, tipo, marca, modelo, imei_o_serie) VALUES (?, 'laptop', 'HP', 'X', 'SERIE01')")
    .run(cliente).lastInsertRowid;
  const disp2 = db
    .prepare("INSERT INTO dispositivos (cliente_id, tipo, marca, modelo, imei_o_serie) VALUES (?, 'laptop', 'HP', 'Y', 'SERIE02')")
    .run(cliente).lastInsertRowid;
  const hace5dias = new Date(Date.now() - 5 * 864e5).toISOString();
  const detenida = db
    .prepare(
      `INSERT INTO ordenes (folio, token_estatus, dispositivo_id, usuario_id, estado, falla_reportada, condicion_fisica, fecha_recepcion)
       VALUES ('RP-2026-0901', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', ?, ?, 'Diagnóstico', 'x', 'x', ?)`,
    )
    .run(disp, usuarioId, hace5dias).lastInsertRowid;
  db.prepare("INSERT INTO historial_estados (orden_id, tipo, estado, nota, usuario_id, fecha) VALUES (?, 'estado', 'Diagnóstico', 'x', ?, ?)").run(
    detenida,
    usuarioId,
    hace5dias,
  );
  db.prepare(
    `INSERT INTO ordenes (folio, token_estatus, dispositivo_id, usuario_id, estado, falla_reportada, condicion_fisica,
                          fecha_recepcion, fecha_entrega, dias_garantia, terminos_garantia, garantia_fin, bloqueada)
     VALUES ('RP-2026-0902', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', ?, ?, 'Entregado', 'x', 'x', ?, ?, 30, 't', ?, 1)`,
  ).run(disp2, usuarioId, hace5dias, hace5dias, new Date(Date.now() + 2 * 864e5).toISOString());

  const res = await request(app).get('/api/notificaciones').set(auth);
  const tipos = res.body.notificaciones.map((n) => n.tipo);
  assert.ok(tipos.includes('orden_detenida'));
  assert.ok(tipos.includes('garantia_por_vencer'));

  // No se duplican al volver a consultar
  const otraVez = await request(app).get('/api/notificaciones').set(auth);
  assert.equal(otraVez.body.notificaciones.length, res.body.notificaciones.length);

  const soloGarantias = await request(app).get('/api/notificaciones?categoria=garantias').set(auth);
  assert.ok(soloGarantias.body.notificaciones.every((n) => n.categoria === 'garantias'));
});
