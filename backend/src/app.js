/**
 * @file app.js
 * @description Aplicación Express (bloque 2.1): middlewares globales y montaje de rutas de la API.
 *              Se exporta sin `listen` para poder usarla en las pruebas.
 * @task T04
 * @author María Fernanda González Rodríguez
 */
const express = require('express');
const cors = require('cors');
const config = require('./config');
const { requiereSesion } = require('./middleware/auth');
const { manejadorErrores, HttpError } = require('./utils/errores');
const ordenes = require('./services/ordenes.service');

const app = express();

app.use(cors({ origin: config.corsOrigin.split(',').map((o) => o.trim()) }));
app.use(express.json({ limit: '100kb' }));

// Fotos de evidencia; los nombres son UUID aleatorios, no se pueden adivinar
app.use('/uploads', express.static(config.uploadsDir, { index: false, dotfiles: 'deny' }));

app.get('/api/salud', (req, res) => res.json({ ok: true }));

// Rutas públicas
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/verificar', require('./routes/verificar.routes'));

// Rutas privadas (requieren JWT)
app.use('/api/clientes', requiereSesion, require('./routes/clientes.routes'));
app.use('/api/dispositivos', requiereSesion, require('./routes/dispositivos.routes'));
app.use('/api/ordenes', requiereSesion, require('./routes/ordenes.routes'));
app.get('/api/dashboard', requiereSesion, (req, res) => res.json(ordenes.dashboard()));

app.use('/api', () => {
  throw new HttpError(404, 'Ruta no encontrada');
});
app.use(manejadorErrores);

module.exports = app;
