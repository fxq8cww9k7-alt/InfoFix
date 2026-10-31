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
process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
process.env.UPLOADS_DIR = uploadsTmp;
process.env.JWT_SECRET = 'secreto-de-pruebas';
process.env.PUBLIC_BASE_URL = 'http://localhost:5173';

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const { db } = require('../src/db/conexion');
const { bandejaPruebas } = require('../src/utils/correo');

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

  // Nota de servicio con QR a la página de estatus (P12)
  const nota = await request(app).get(`/api/ordenes/${orden.id}/nota-servicio`).set(auth());
  assert.equal(nota.status, 200);
  assert.match(nota.body.estatus.qr, /^data:image\/png;base64,/);
  const tokenEstatus = nota.body.estatus.url_estatus.split('/').pop();
  assert.equal(nota.body.estatus.url_estatus, `http://localhost:5173/estatus/${tokenEstatus}`);

  // Página pública de estatus sin datos del cliente (P15)
  const estatus = await request(app).get(`/api/estatus/${tokenEstatus}`);
  assert.equal(estatus.status, 200);
  assert.equal(estatus.body.estatus.paso, 1);
  assert.equal(estatus.body.estatus.dispositivo.imei_o_serie, '***********5678');
  assert.ok(!JSON.stringify(estatus.body).includes('Ana López'));

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

  // Después de Recibido ya no se aceptan fotos "antes" (P9)
  const antesTarde = await request(app)
    .post(`/api/ordenes/${orden.id}/evidencias`)
    .set(auth())
    .field('tipo', 'antes')
    .attach('fotos', PNG, { filename: 'antes2.png', contentType: 'image/png' });
  assert.equal(antesTarde.status, 409);

  // Aviso al cliente por estatus y correo (P10)
  const previa = await request(app).get(`/api/ordenes/${orden.id}/avisos/vista-previa?tipo=requiere_autorizacion`).set(auth());
  assert.match(previa.body.vista_previa.mensaje, /requiere tu autorización/);
  const aviso = await request(app)
    .post(`/api/ordenes/${orden.id}/avisos`)
    .set(auth())
    .send({ tipo: 'requiere_autorizacion', en_estatus: true, por_correo: true });
  assert.equal(aviso.status, 201);
  assert.equal(aviso.body.estado_correo, 'enviado');
  assert.equal(bandejaPruebas.at(-1).para, 'ana@correo.test');
  const estatusConAviso = await request(app).get(`/api/estatus/${tokenEstatus}`);
  assert.equal(estatusConAviso.body.estatus.avisos.length, 1);
  assert.equal(estatusConAviso.body.estatus.paso, 2);

  const pieza = await request(app)
    .post(`/api/ordenes/${orden.id}/refacciones`)
    .set(auth())
    .send({ nombre: 'Batería', tipo: 'original', numero_serie: 'BAT-001' });
  assert.equal(pieza.status, 201);

  // Editar pieza y que quede en la bitácora (P7, P8)
  const piezaId = pieza.body.orden.refacciones[0].id;
  const editada = await request(app)
    .put(`/api/ordenes/${orden.id}/refacciones/${piezaId}`)
    .set(auth())
    .send({ nombre: 'Batería 5000 mAh', tipo: 'original' });
  assert.equal(editada.body.orden.refacciones[0].nombre, 'Batería 5000 mAh');
  assert.ok(editada.body.orden.historial.some((h) => h.tipo === 'pieza' && h.nota.includes('editó')));

  assert.equal((await avanzar('Reparación', 'Cambio de batería')).status, 200);
  assert.equal((await avanzar('Pruebas', 'Pruebas de carga OK')).status, 200);

  // Sin foto "después" ni garantía, la entrega se bloquea con la lista de pendientes (RF-10)
  const bloqueada = await avanzar('Entregado', 'Entrega al cliente');
  assert.equal(bloqueada.status, 400);
  assert.equal(bloqueada.body.pendientes.length, 2);
  const detalle = await request(app).get(`/api/ordenes/${orden.id}`).set(auth());
  assert.equal(detalle.body.orden.pendientes_entrega.length, 2);

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
  assert.deepEqual(dash.body.indicadores, { activas: 0, en_pruebas: 0, terminadas: 1, garantias_vigentes: 1 });
  assert.equal(dash.body.por_etapa.length, 4);

  assert.equal((await request(app).get('/api/ordenes?q=ab').set(auth())).status, 400);
  const busqueda = await request(app).get('/api/ordenes?q=ana').set(auth());
  assert.equal(busqueda.body.ordenes.length, 1);
  assert.equal(busqueda.body.ordenes[0].tecnico, 'Técnico');
  assert.equal(busqueda.body.paginacion.total, 1);
  const hoy = new Date().toISOString().slice(0, 10);
  const porFecha = await request(app).get(`/api/ordenes?desde=${hoy}&hasta=${hoy}`).set(auth());
  assert.equal(porFecha.body.ordenes.length, 1);
  const otroDia = await request(app).get('/api/ordenes?desde=2000-01-01&hasta=2000-01-02').set(auth());
  assert.equal(otroDia.body.ordenes.length, 0);

  // Certificados emitidos (P14)
  const emitidos = await request(app).get('/api/certificados?garantia=vigente').set(auth());
  assert.equal(emitidos.body.total, 1);
  assert.equal(emitidos.body.certificados[0].token_uuid, token_uuid);

  // Listas de clientes y dispositivos (P18, P19)
  const clientes = await request(app).get('/api/clientes?q=López').set(auth());
  assert.equal(clientes.body.clientes[0].num_ordenes, 1);
  const ficha = await request(app).get(`/api/clientes/${clienteId}`).set(auth());
  assert.equal(ficha.body.resumen.garantias_vigentes, 1);
  const dispositivos = await request(app).get('/api/dispositivos?tipo=celular').set(auth());
  assert.equal(dispositivos.body.dispositivos[0].reparaciones_certificadas, 1);

  // Con certificado emitido ya no se puede cambiar el IMEI, pero sí el color
  const cambioImei = await request(app).patch(`/api/dispositivos/${dispositivoId}`).set(auth()).send({ imei_o_serie: '111111111111111' });
  assert.equal(cambioImei.status, 409);
  const cambioColor = await request(app).patch(`/api/dispositivos/${dispositivoId}`).set(auth()).send({ color: 'Azul' });
  assert.equal(cambioColor.body.dispositivo.color, 'Azul');

  // Historial del dispositivo (RF-15, P20)
  const historial = await request(app).get(`/api/dispositivos/${dispositivoId}/historial`).set(auth());
  assert.equal(historial.body.reparaciones.length, 1);
  assert.equal(historial.body.reparaciones[0].refacciones.length, 1);
  assert.equal(historial.body.resumen.orden_activa, null);

  // Notificaciones: certificado emitido y aviso enviado (P5)
  const notis = await request(app).get('/api/notificaciones').set(auth());
  const tipos = notis.body.notificaciones.map((n) => n.tipo);
  assert.ok(tipos.includes('certificado_emitido') && tipos.includes('aviso_enviado'));
  assert.equal(notis.body.no_leidas, notis.body.notificaciones.length);
  const leidas = await request(app).post('/api/notificaciones/leer').set(auth()).send({});
  assert.equal(leidas.body.no_leidas, 0);
});
