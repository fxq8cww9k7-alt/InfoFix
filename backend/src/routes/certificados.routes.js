/**
 * @file certificados.routes.js
 * @description Lista de certificados emitidos con búsqueda y filtro de garantía.
 * @author María Fernanda González Rodríguez
 */
const express = require('express');
const config = require('../config');
const { listarCertificados, vistaPublica, generarQr } = require('../services/certificado.service');
const { HttpError } = require('../utils/errores');
const { texto, RE_UUID } = require('../middleware/validar');

const router = express.Router();

// GET /api/certificados?q=&garantia=vigente|vencida
router.get('/', (req, res) => {
  res.json(
    listarCertificados({
      q: req.query.q === undefined ? undefined : texto(req.query.q),
      garantia: texto(req.query.garantia) || undefined,
    }),
  );
});

// GET /api/certificados/:token — detalle imprimible del certificado por su token UUID
router.get('/:token', async (req, res) => {
  if (!RE_UUID.test(req.params.token)) {
    throw new HttpError(404, 'Certificado no encontrado');
  }
  const token = req.params.token.toLowerCase();
  const datos = vistaPublica(token);
  const urlPublica = `${config.publicBaseUrl}/verificar/${token}`;
  const qr = await generarQr(urlPublica);
  res.json({
    ...datos,
    url_publica: urlPublica,
    qr,
    taller: config.taller,
  });
});

module.exports = router;
