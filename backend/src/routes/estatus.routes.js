/**
 * @file estatus.routes.js
 * @description Consulta pública del avance de una reparación con el QR de la nota de servicio (sin sesión).
 * @task P15 (Act. 11)
 * @author María Fernanda González Rodríguez
 */
const express = require('express');
const { vistaEstatus } = require('../services/certificado.service');
const { HttpError } = require('../utils/errores');
const { RE_UUID } = require('../middleware/validar');

const router = express.Router();

router.get('/:token', (req, res) => {
  if (!RE_UUID.test(req.params.token)) {
    throw new HttpError(404, 'Orden no encontrada. Verifique que el código QR corresponda a su nota de servicio');
  }
  res.json({ estatus: vistaEstatus(req.params.token.toLowerCase()) });
});

module.exports = router;
