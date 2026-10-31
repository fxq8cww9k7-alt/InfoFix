/**
 * @file verificar.routes.js
 * @description Consulta pública del certificado por token (sin sesión).
 * @task T23 (RF-12)
 * @author María Fernanda González Rodríguez
 */
const express = require('express');
const { vistaPublica } = require('../services/certificado.service');
const { HttpError } = require('../utils/errores');
const { RE_UUID } = require('../middleware/validar');

const router = express.Router();

router.get('/:token', (req, res) => {
  if (!RE_UUID.test(req.params.token)) {
    throw new HttpError(
      404,
      'Certificado no encontrado. Verifique que el enlace o código QR corresponda a un certificado emitido por el taller',
    );
  }
  res.json({ certificado: vistaPublica(req.params.token.toLowerCase()) });
});

module.exports = router;
