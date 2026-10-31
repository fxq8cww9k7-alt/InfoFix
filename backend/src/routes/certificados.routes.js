/**
 * @file certificados.routes.js
 * @description Lista de certificados emitidos con búsqueda y filtro de garantía.
 * @task P14 (Act. 11)
 * @author María Fernanda González Rodríguez
 */
const express = require('express');
const { listarCertificados } = require('../services/certificado.service');
const { texto } = require('../middleware/validar');

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

module.exports = router;
