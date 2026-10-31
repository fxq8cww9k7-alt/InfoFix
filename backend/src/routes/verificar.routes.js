/**
 * @file verificar.routes.js
 * @description Consulta pública del certificado por token (sin sesión).
 * @task T23 (RF-12)
 * @author María Fernanda González Rodríguez
 */
const express = require('express');
const { vistaPublica } = require('../services/certificado.service');
const { HttpError } = require('../utils/errores');

const router = express.Router();

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
