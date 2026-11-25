/**
 * @file dispositivos.test.js
 * @description Pruebas de la edición de dispositivos (opción B: un equipo con certificado ya no se
 *              modifica) y del IMEI enmascarado en el certificado imprimible (P13).
 *              Uso: `node --test tests/*.test.js`
 * @task T10, T21 (RF-03, RF-12; pantallas P7, P12, P13, P18)
 * @author María Fernanda González Rodríguez
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const uploadsTmp = fs.mkdtempSync(path.join(os.tmpdir(), 'infofix-test-'));
process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
process.env.UPLOADS_DIR = uploadsTmp;
process.env.JWT_SECRET = 'secreto-de-pruebas';
process.env.PUBLIC_BASE_URL = 'http://localhost:5173';

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const { db } = require('../src/db/conexion');

// PNG de 1x1 píxel
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);
const MSG_CERTIFICADO = 'Este equipo ya tiene un certificado emitido, por eso sus datos ya no se pueden modificar';
const IMEI_FINAL = '490154203237518';

let token;
const auth = () => ({ Authorization: `Bearer ${token}` });

// Datos que se comparten entre las pruebas (corren en orden)
let clienteId;
let dispositivoId;
let ordenId;

const editar = (body) => request(app).patch(`/api/dispositivos/${dispositivoId}`).set(auth()).send(body);

before(async () => {
  db.prepare("INSERT INTO usuarios (nombre, email, password_hash) VALUES ('Técnico', 'tecnico@infofix.test', ?)").run(
    bcrypt.hashSync('Clave123!', 10),
  );
  const login = await request(app).post('/api/auth/login').send({ email: 'tecnico@infofix.test', password: 'Clave123!' });
  token = login.body.token;

  const cliente = await request(app)
    .post('/api/clientes')
    .set(auth())
    .send({ nombre_completo: 'Ana López', telefono: '3312345678', email: 'ana@correo.test', aviso_privacidad: true });
  clienteId = cliente.body.cliente.id;

  const dispositivo = await request(app)
    .post('/api/dispositivos')
    .set(auth())
    .send({ cliente_id: clienteId, tipo: 'celular', marca: 'Samsung', modelo: 'A54', color: 'Negro', imei_o_serie: '356789012345678' });
  dispositivoId = dispositivo.body.dispositivo.id;
});

after(() => fs.rmSync(uploadsTmp, { recursive: true, force: true }));

test('sin certificado se pueden editar marca, IMEI, color y contraseña', async () => {
  const marca = await editar({ marca: 'Motorola' });
  assert.equal(marca.status, 200);
  assert.equal(marca.body.dispositivo.marca, 'Motorola');

  const imei = await editar({ imei_o_serie: IMEI_FINAL });
  assert.equal(imei.status, 200);
  assert.equal(imei.body.dispositivo.imei_o_serie, IMEI_FINAL);

  const color = await editar({ color: 'Azul', contrasena_equipo: '1234' });
  assert.equal(color.status, 200);
  assert.equal(color.body.dispositivo.color, 'Azul');
  assert.equal(color.body.dispositivo.contrasena_equipo, '1234');
});

test('sin certificado se siguen aplicando las demás reglas (RF-03, IMEI duplicado, 404)', async () => {
  const imeiMalo = await editar({ imei_o_serie: '123' });
  assert.equal(imeiMalo.status, 400);
  assert.equal(imeiMalo.body.campos[0].campo, 'imei_o_serie');

  const sinMarca = await editar({ marca: '' });
  assert.equal(sinMarca.status, 400);

  const otro = await request(app)
    .post('/api/dispositivos')
    .set(auth())
    .send({ cliente_id: clienteId, tipo: 'celular', marca: 'Apple', modelo: 'iPhone 13', imei_o_serie: '111111111111111' });
  assert.equal(otro.status, 201);
  const duplicado = await editar({ imei_o_serie: '111111111111111' });
  assert.equal(duplicado.status, 409);
  assert.equal(duplicado.body.error, 'Ya existe otro dispositivo con ese IMEI o número de serie');

  const noExiste = await request(app).patch('/api/dispositivos/9999').set(auth()).send({ color: 'Rojo' });
  assert.equal(noExiste.status, 404);
});

test('se lleva una orden del equipo hasta Entregado y se emite su certificado', async () => {
  const creada = await request(app)
    .post('/api/ordenes')
    .set(auth())
    .field('dispositivo_id', dispositivoId)
    .field('falla_reportada', 'No enciende')
    .field('condicion_fisica', 'Rayón en la esquina')
    .attach('fotos', PNG, { filename: 'antes.png', contentType: 'image/png' });
  assert.equal(creada.status, 201);
  ordenId = creada.body.orden.id;

  const avanzar = (estado, nota) => request(app).patch(`/api/ordenes/${ordenId}/estado`).set(auth()).send({ estado, nota });
  assert.equal((await avanzar('Diagnóstico', 'Placa dañada')).status, 200);
  assert.equal((await avanzar('Reparación', 'Cambio de batería')).status, 200);
  assert.equal((await avanzar('Pruebas', 'Pruebas de carga OK')).status, 200);

  const despues = await request(app)
    .post(`/api/ordenes/${ordenId}/evidencias`)
    .set(auth())
    .field('tipo', 'despues')
    .attach('fotos', PNG, { filename: 'despues.png', contentType: 'image/png' });
  assert.equal(despues.status, 201);
  const garantia = await request(app)
    .put(`/api/ordenes/${ordenId}/garantia`)
    .set(auth())
    .send({ dias_garantia: 90, terminos_garantia: 'Cubre fallas de la batería instalada.' });
  assert.equal(garantia.status, 200);

  const entregada = await avanzar('Entregado', 'Entrega al cliente');
  assert.equal(entregada.status, 200);
  assert.ok(entregada.body.certificado.token_uuid);
});

test('con certificado ya no se puede modificar nada del equipo (409)', async () => {
  for (const body of [
    { color: 'Rojo' },
    { contrasena_equipo: '9999' },
    { marca: 'Xiaomi' },
    { imei_o_serie: '222222222222222' },
    // Aunque los datos sean iguales o el body venga vacío, también se rechaza
    { color: 'Azul' },
    {},
  ]) {
    const res = await editar(body);
    assert.equal(res.status, 409, `PATCH con ${JSON.stringify(body)}`);
    assert.equal(res.body.error, MSG_CERTIFICADO);
  }

  // Ni siquiera se valida: un IMEI mal formado también da 409 y no 400
  const imeiMalo = await editar({ imei_o_serie: '123' });
  assert.equal(imeiMalo.status, 409);

  // Los datos se quedan como estaban
  const fila = db.prepare('SELECT marca, color, contrasena_equipo, imei_o_serie FROM dispositivos WHERE id = ?').get(dispositivoId);
  assert.deepEqual({ ...fila }, { marca: 'Motorola', color: 'Azul', contrasena_equipo: '1234', imei_o_serie: IMEI_FINAL });
});

test('el certificado imprimible (P13) trae el IMEI enmascarado', async () => {
  const res = await request(app).get(`/api/ordenes/${ordenId}/certificado`).set(auth());
  assert.equal(res.status, 200);
  const imei = res.body.orden.dispositivo.imei_o_serie;
  assert.equal(imei.length, IMEI_FINAL.length);
  assert.equal(imei.slice(-4), IMEI_FINAL.slice(-4));
  assert.match(imei.slice(0, -4), /^\*+$/);
  assert.equal(imei, '***********7518');
  // El IMEI completo no aparece en ninguna parte de la respuesta
  assert.ok(!JSON.stringify(res.body).includes(IMEI_FINAL));
  assert.match(res.body.certificado.qr, /^data:image\/png;base64,/);
});

test('el certificado imprimible (P13) no trae datos del cliente ni la contraseña del equipo', async () => {
  const res = await request(app).get(`/api/ordenes/${ordenId}/certificado`).set(auth());
  assert.equal(res.status, 200);
  assert.equal(res.body.orden.cliente, undefined);
  assert.equal(res.body.orden.dispositivo.cliente_id, undefined);
  assert.equal(res.body.orden.dispositivo.contrasena_equipo, undefined);
  // Ni el nombre, ni el teléfono, ni el correo, ni el PIN aparecen en ninguna parte de la respuesta
  const texto = JSON.stringify(res.body);
  for (const dato of ['Ana López', '3312345678', 'ana@correo.test']) assert.ok(!texto.includes(dato), dato);
  assert.ok(!/"contrasena_equipo"/.test(texto));
  // Lo que se le hizo al equipo sí viene
  assert.ok(res.body.orden.folio);
  assert.ok(Array.isArray(res.body.orden.refacciones));
  assert.ok(res.body.orden.garantia);

  // La nota de servicio (P12) sí sigue con los datos del cliente
  const nota = await request(app).get(`/api/ordenes/${ordenId}/nota-servicio`).set(auth());
  assert.equal(nota.body.orden.cliente.nombre_completo, 'Ana López');
});

test('la nota de servicio (P12) no trae la contraseña del equipo, pero el expediente (P7) sí', async () => {
  const nota = await request(app).get(`/api/ordenes/${ordenId}/nota-servicio`).set(auth());
  assert.equal(nota.status, 200);
  assert.equal(nota.body.orden.dispositivo.contrasena_equipo, undefined);
  assert.ok(!/"contrasena_equipo"/.test(JSON.stringify(nota.body)));
  // Lo demás de la nota sigue igual
  assert.equal(nota.body.orden.dispositivo.imei_o_serie, IMEI_FINAL);
  assert.match(nota.body.estatus.qr, /^data:image\/png;base64,/);

  // El técnico sigue viendo el PIN en el expediente
  const expediente = await request(app).get(`/api/ordenes/${ordenId}`).set(auth());
  assert.equal(expediente.body.orden.dispositivo.contrasena_equipo, '1234');
});

test('el expediente (P7) y la nota de servicio (P12) siguen con el IMEI completo', async () => {
  // Se pide primero el certificado para comprobar que enmascararlo no afecta a las otras rutas
  await request(app).get(`/api/ordenes/${ordenId}/certificado`).set(auth());

  const expediente = await request(app).get(`/api/ordenes/${ordenId}`).set(auth());
  assert.equal(expediente.status, 200);
  assert.equal(expediente.body.orden.dispositivo.imei_o_serie, IMEI_FINAL);

  const nota = await request(app).get(`/api/ordenes/${ordenId}/nota-servicio`).set(auth());
  assert.equal(nota.status, 200);
  assert.equal(nota.body.orden.dispositivo.imei_o_serie, IMEI_FINAL);
});
