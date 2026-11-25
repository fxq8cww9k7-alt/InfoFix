/**
 * @file notificaciones.routes.js
 * @description Notificaciones del panel (campana de la barra superior y página completa).
 * @task P5 (Act. 11)
 * @author María Fernanda González Rodríguez
 */
const express = require('express');
const notificaciones = require('../services/notificaciones.service');
const { HttpError } = require('../utils/errores');
const { texto } = require('../middleware/validar');

const router = express.Router();

// GET /api/notificaciones?no_leidas=true&categoria=ordenes|garantias|cuentas
router.get('/', (req, res) => {
  const categoria = texto(req.query.categoria) || undefined;
  if (categoria && !notificaciones.CATEGORIAS.includes(categoria)) {
    throw new HttpError(400, 'La categoría debe ser ordenes, garantias o cuentas');
  }
  res.json(
    notificaciones.listar(req.usuario.id, {
      soloNoLeidas: req.query.no_leidas === 'true',
      categoria,
    }),
  );
});

// POST /api/notificaciones/leer  { ids?: number[] }  — sin ids marca todas
router.post('/leer', (req, res) => {
  const { ids } = req.body || {};
  if (ids !== undefined && (!Array.isArray(ids) || !ids.every((id) => Number.isInteger(id) && id > 0))) {
    throw new HttpError(400, 'ids debe ser un arreglo de identificadores');
  }
  notificaciones.marcarLeidas(req.usuario.id, ids);
  res.json(notificaciones.listar(req.usuario.id));
});

module.exports = router;
