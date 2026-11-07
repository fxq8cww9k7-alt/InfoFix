/**
 * @file telefono.test.js
 * @description Pruebas del teléfono del cliente (RF-02): el backend quita espacios y guiones antes
 *              de validar y guardar, y sigue rechazando cualquier otro carácter o una longitud distinta de 10.
 *              Uso: `node --test tests/*.test.js`
 * @task T09 (apoyo a QA T08)
 * @author María Fernanda González Rodríguez
 */
const { test, before } = require('node:test');
const assert = require('node:assert/strict');

// Cada archivo de pruebas corre en su propio proceso y con su propia BD en memoria,
// así que estos clientes no chocan con los de flujo.test.js ni cuentas.test.js
process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'secreto-de-pruebas';

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const { db } = require('../src/db/conexion');

const MENSAJE = 'El número de teléfono debe contener exactamente 10 dígitos';

let token;
const auth = () => ({ Authorization: `Bearer ${token}` });

const registrar = (datos) =>
  request(app)
    .post('/api/clientes')
    .set(auth())
    .send({ nombre_completo: 'Cliente de Prueba', aviso_privacidad: true, ...datos });

// Lo que quedó guardado de verdad en la BD, sin pasar por la API
const telefonoEnBd = (id) => db.prepare('SELECT telefono FROM clientes WHERE id = ?').get(id).telefono;

before(async () => {
  db.prepare("INSERT INTO usuarios (nombre, email, password_hash) VALUES ('Técnico', 'tel@infofix.test', ?)").run(
    bcrypt.hashSync('Clave123!', 10),
  );
  const login = await request(app).post('/api/auth/login').send({ email: 'tel@infofix.test', password: 'Clave123!' });
  assert.equal(login.status, 200);
  token = login.body.token;
});

test('registro con espacios guarda el teléfono limpio', async () => {
  const res = await registrar({ nombre_completo: 'Ana Espacios', telefono: '33 1234 5678' });
  assert.equal(res.status, 201);
  assert.equal(res.body.cliente.telefono, '3312345678');
  assert.equal(telefonoEnBd(res.body.cliente.id), '3312345678');
});

test('registro con guiones guarda el teléfono limpio', async () => {
  const res = await registrar({ nombre_completo: 'Beto Guiones', telefono: '33-8765-4321' });
  assert.equal(res.status, 201);
  assert.equal(res.body.cliente.telefono, '3387654321');
  assert.equal(telefonoEnBd(res.body.cliente.id), '3387654321');
});

test('registro con espacios y guiones mezclados (y espacios en los extremos) también se limpia', async () => {
  const res = await registrar({ nombre_completo: 'Caro Mezcla', telefono: ' 33 1111-2222 ' });
  assert.equal(res.status, 201);
  assert.equal(telefonoEnBd(res.body.cliente.id), '3311112222');
});

test('búsqueda por teléfono con espacios encuentra al cliente', async () => {
  const res = await request(app).get('/api/clientes').query({ telefono: '33 1234 5678' }).set(auth());
  assert.equal(res.status, 200);
  assert.equal(res.body.cliente.nombre_completo, 'Ana Espacios');

  const conGuiones = await request(app).get('/api/clientes').query({ telefono: '33-1234-5678' }).set(auth());
  assert.equal(conGuiones.status, 200);
  assert.equal(conGuiones.body.cliente.id, res.body.cliente.id);
});

test('registro duplicado con otro formato da 409 y regresa el cliente existente', async () => {
  const res = await registrar({ nombre_completo: 'Ana Repetida', telefono: '33-1234-5678' });
  assert.equal(res.status, 409);
  assert.equal(res.body.error, 'Ya existe un cliente con ese teléfono');
  assert.equal(res.body.cliente.telefono, '3312345678');

  const sinFormato = await registrar({ nombre_completo: 'Ana Repetida', telefono: '3312345678' });
  assert.equal(sinFormato.status, 409);
});

test('se rechazan letras, longitudes distintas de 10 y símbolos que no son espacio ni guion', async () => {
  const malos = ['33123456ab', '331234567', '+523312345678', '(33)12345678', '33.1234.5678', '33 1234 567', '', '  -  '];
  for (const telefono of malos) {
    const res = await registrar({ telefono });
    assert.equal(res.status, 400, `"${telefono}" debió rechazarse`);
    assert.equal(res.body.error, MENSAJE);
    assert.equal(res.body.campos[0].campo, 'telefono');
  }
  // Ninguno de esos intentos llegó a la BD
  const raros = db.prepare("SELECT COUNT(*) AS n FROM clientes WHERE telefono GLOB '*[^0-9]*'").get().n;
  assert.equal(raros, 0);
});

test('edición (PATCH) con espacios y guiones guarda el teléfono limpio', async () => {
  const nuevo = await registrar({ nombre_completo: 'Dani Edita', telefono: '3399990000' });
  assert.equal(nuevo.status, 201);
  const id = nuevo.body.cliente.id;

  const res = await request(app).patch(`/api/clientes/${id}`).set(auth()).send({ telefono: '33 5555-6666' });
  assert.equal(res.status, 200);
  assert.equal(res.body.cliente.telefono, '3355556666');
  assert.equal(telefonoEnBd(id), '3355556666');

  // Mandar el mismo teléfono propio con otro formato no cuenta como duplicado
  const mismo = await request(app).patch(`/api/clientes/${id}`).set(auth()).send({ telefono: '33-5555-6666' });
  assert.equal(mismo.status, 200);
  assert.equal(telefonoEnBd(id), '3355556666');
});

test('edición (PATCH) contra el teléfono de otro cliente con otro formato da 409', async () => {
  const id = db.prepare("SELECT id FROM clientes WHERE nombre_completo = 'Dani Edita'").get().id;
  const res = await request(app).patch(`/api/clientes/${id}`).set(auth()).send({ telefono: '33 1234-5678' });
  assert.equal(res.status, 409);
  assert.equal(res.body.error, 'Ya existe otro cliente con ese teléfono');
  assert.equal(telefonoEnBd(id), '3355556666');
});

test('edición (PATCH) rechaza teléfonos inválidos y sin teléfono no lo cambia', async () => {
  const id = db.prepare("SELECT id FROM clientes WHERE nombre_completo = 'Dani Edita'").get().id;
  for (const telefono of ['33123456ab', '331234567', '+523312345678']) {
    const res = await request(app).patch(`/api/clientes/${id}`).set(auth()).send({ telefono });
    assert.equal(res.status, 400, `"${telefono}" debió rechazarse`);
    assert.equal(res.body.error, MENSAJE);
  }
  const soloNombre = await request(app).patch(`/api/clientes/${id}`).set(auth()).send({ nombre_completo: 'Dani Editado' });
  assert.equal(soloNombre.status, 200);
  assert.equal(telefonoEnBd(id), '3355556666');
});
