/**
 * @file flujo.test.js
 * @description Prueba de punta a punta del flujo de reparación sobre una BD en memoria:
 *              login → cliente → dispositivo → orden → estados → garantía → entrega → QR → consulta pública.
 *              Uso: `npm test`
 * @task T19 (apoyo a QA)
 * @author María Fernanda González Rodríguez
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const uploadsTmp = fs.mkdtempSync(path.join(os.tmpdir(), 'infofix-test-'));
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

let token;
const auth = () => ({ Authorization: `Bearer ${token}` });

before(() => {
  db.prepare("INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ('Técnico', 'tecnico@infofix.test', ?, 'tecnico')").run(
    bcrypt.hashSync('Clave123!', 10),
  );
});

after(() => fs.rmSync(uploadsTmp, { recursive: true, force: true }));

test('login rechaza credenciales incorrectas sin decir cuál falló', async () => {
  const res = await request(app).post('/api/auth/login').send({ email: 'tecnico@infofix.test', password: 'mal' });
  assert.equal(res.status, 401);
  assert.equal(res.body.error, 'Correo o contraseña incorrectos');
});

test('rutas privadas exigen sesión', async () => {
  const res = await request(app).get('/api/dashboard');
  assert.equal(res.status, 401);
});

test('flujo completo de reparación hasta el certificado público', async () => {
  const login = await request(app).post('/api/auth/login').send({ email: 'tecnico@infofix.test', password: 'Clave123!' });
  assert.equal(login.status, 200);
  token = login.body.token;

  // Validación de teléfono (RF-02)
  const telMalo = await request(app)
    .post('/api/clientes')
    .set(auth())
    .send({ nombre_completo: 'Ana López', telefono: '12345', aviso_privacidad: true });
  assert.equal(telMalo.status, 400);
  assert.equal(telMalo.body.campos[0].campo, 'telefono');

  const cliente = await request(app)
    .post('/api/clientes')
    .set(auth())
    .send({ nombre_completo: 'Ana López', telefono: '3312345678', email: 'ana@correo.test', aviso_privacidad: true });
  assert.equal(cliente.status, 201);
  const clienteId = cliente.body.cliente.id;

  // IMEI de 15 dígitos para celulares (RF-03)
  const imeiMalo = await request(app)
    .post('/api/dispositivos')
    .set(auth())
    .send({ cliente_id: clienteId, tipo: 'celular', marca: 'Samsung', modelo: 'A54', imei_o_serie: '123' });
  assert.equal(imeiMalo.status, 400);

  const dispositivo = await request(app)
    .post('/api/dispositivos')
    .set(auth())
    .send({ cliente_id: clienteId, tipo: 'celular', marca: 'Samsung', modelo: 'A54', color: 'Negro', imei_o_serie: '356789012345678' });
  assert.equal(dispositivo.status, 201);
  const dispositivoId = dispositivo.body.dispositivo.id;

  // Sin foto de recepción no se abre la orden (RF-05)
  const sinFoto = await request(app)
    .post('/api/ordenes')
    .set(auth())
    .field('dispositivo_id', dispositivoId)
    .field('falla_reportada', 'No enciende')
    .field('condicion_fisica', 'Rayón en la esquina');
  assert.equal(sinFoto.status, 400);

  // Una foto falsa (texto con extensión .png) se rechaza
  const fotoFalsa = await request(app)
    .post('/api/ordenes')
    .set(auth())
    .field('dispositivo_id', dispositivoId)
    .field('falla_reportada', 'No enciende')
    .field('condicion_fisica', 'Rayón en la esquina')
    .attach('fotos', Buffer.from('no soy imagen'), { filename: 'x.png', contentType: 'image/png' });
  assert.equal(fotoFalsa.status, 400);

  const creada = await request(app)
    .post('/api/ordenes')
    .set(auth())
    .field('dispositivo_id', dispositivoId)
    .field('falla_reportada', 'No enciende')
    .field('condicion_fisica', 'Rayón en la esquina')
    .field('accesorios', JSON.stringify(['cargador', 'funda']))
    .attach('fotos', PNG, { filename: 'antes.png', contentType: 'image/png' });
  assert.equal(creada.status, 201);
  const orden = creada.body.orden;
  assert.match(orden.folio, new RegExp(`^RP-${new Date().getFullYear()}-0001$`));
  assert.equal(orden.estado, 'Recibido');
  assert.deepEqual(orden.accesorios, ['cargador', 'funda']);

  // Un dispositivo no puede tener dos órdenes activas (RF-04)
  const duplicada = await request(app)
    .post('/api/ordenes')
    .set(auth())
    .field('dispositivo_id', dispositivoId)
    .field('falla_reportada', 'Otra')
    .field('condicion_fisica', 'Igual')
    .attach('fotos', PNG, { filename: 'antes.png', contentType: 'image/png' });
  assert.equal(duplicada.status, 409);
  assert.equal(duplicada.body.folio, orden.folio);

  const avanzar = (estado, nota = 'Avance registrado') =>
    request(app).patch(`/api/ordenes/${orden.id}/estado`).set(auth()).send({ estado, nota });

  // No se pueden saltar etapas ni dejar la nota vacía (RF-06)
  assert.equal((await avanzar('Reparación')).status, 400);
  assert.equal((await avanzar('Diagnóstico', '')).status, 400);
  assert.equal((await avanzar('Diagnóstico', 'Placa dañada')).status, 200);

  const pieza = await request(app)
    .post(`/api/ordenes/${orden.id}/refacciones`)
    .set(auth())
    .send({ nombre: 'Batería', tipo: 'original', numero_serie: 'BAT-001' });
  assert.equal(pieza.status, 201);

  assert.equal((await avanzar('Reparación', 'Cambio de batería')).status, 200);
  assert.equal((await avanzar('Pruebas', 'Pruebas de carga OK')).status, 200);

  // Sin foto "después" ni garantía, la entrega se bloquea con la lista de pendientes (RF-10)
  const bloqueada = await avanzar('Entregado', 'Entrega al cliente');
  assert.equal(bloqueada.status, 400);
  assert.equal(bloqueada.body.pendientes.length, 2);

  const despues = await request(app)
    .post(`/api/ordenes/${orden.id}/evidencias`)
    .set(auth())
    .field('tipo', 'despues')
    .attach('fotos', PNG, { filename: 'despues.png', contentType: 'image/png' });
  assert.equal(despues.status, 201);

  const garantia = await request(app)
    .put(`/api/ordenes/${orden.id}/garantia`)
    .set(auth())
    .send({ dias_garantia: 90, terminos_garantia: 'Cubre fallas de la batería instalada. No cubre humedad.' });
  assert.equal(garantia.status, 200);

  const entregada = await avanzar('Entregado', 'Entrega al cliente');
  assert.equal(entregada.status, 200);
  assert.equal(entregada.body.orden.estado, 'Entregado');
  assert.equal(entregada.body.orden.garantia.estado, 'Vigente');
  assert.match(entregada.body.certificado.qr, /^data:image\/png;base64,/);
  const { token_uuid, url_publica } = entregada.body.certificado;
  assert.equal(url_publica, `http://localhost:5173/verificar/${token_uuid}`);

  // La orden queda bloqueada
  const tarde = await request(app)
    .post(`/api/ordenes/${orden.id}/refacciones`)
    .set(auth())
    .send({ nombre: 'Pantalla', tipo: 'compatible' });
  assert.equal(tarde.status, 409);

  // Consulta pública sin sesión, con IMEI enmascarado y sin datos del cliente (RF-12)
  const publica = await request(app).get(`/api/verificar/${token_uuid}`);
  assert.equal(publica.status, 200);
  const cert = publica.body.certificado;
  assert.equal(cert.dispositivo.imei_o_serie, '***********5678');
  const texto = JSON.stringify(cert);
  assert.ok(!texto.includes('Ana López') && !texto.includes('3312345678') && !texto.includes('ana@correo.test'));
  assert.equal(cert.evidencias.antes.length, 1);
  assert.equal(cert.evidencias.despues.length, 1);

  const foto = await request(app).get(cert.evidencias.antes[0]);
  assert.equal(foto.status, 200);

  const noExiste = await request(app).get('/api/verificar/00000000-0000-4000-8000-000000000000');
  assert.equal(noExiste.status, 404);

  // Dashboard y búsqueda (RF-13, RF-14)
  const dash = await request(app).get('/api/dashboard').set(auth());
  assert.deepEqual(dash.body.indicadores, { activas: 0, terminadas: 1, garantias_vigentes: 1 });

  assert.equal((await request(app).get('/api/ordenes?q=ab').set(auth())).status, 400);
  const busqueda = await request(app).get('/api/ordenes?q=ana').set(auth());
  assert.equal(busqueda.body.ordenes.length, 1);

  // Historial del dispositivo (RF-15)
  const historial = await request(app).get(`/api/dispositivos/${dispositivoId}/historial`).set(auth());
  assert.equal(historial.body.reparaciones.length, 1);
});
