/**
 * @file ordenes.routes.js
 * @description Rutas de órdenes de reparación: apertura, estados, fotos, piezas, garantía,
 *              nota de servicio, certificado y avisos al cliente.
 * @task T12, T13, T15, T16, T17, T20, T21 (RF-04 a RF-11, RF-14; pantallas P6–P13, P17)
 * @author María Fernanda González Rodríguez
 */
const express = require('express');
const config = require('../config');
const ordenes = require('../services/ordenes.service');
const certificados = require('../services/certificado.service');
const avisos = require('../services/avisos.service');
const { HttpError } = require('../utils/errores');
const { validar, reglas, idValido, texto } = require('../middleware/validar');
const { recibirFotos, validarFotos, guardarFotos, borrarFotos } = require('../middleware/subida');

const router = express.Router();

/**
 * Guarda las fotos en disco y ejecuta `registrar`; si la BD falla, borra las fotos escritas.
 *
 * @param {Express.Multer.File[]} archivos
 * @param {'antes'|'despues'} tipo
 * @param {(rutas: string[]) => Object} registrar
 * @returns {Object} Lo que regrese `registrar`.
 */
function guardarYRegistrar(archivos, tipo, registrar) {
  const rutas = guardarFotos(archivos, tipo);
  try {
    return registrar(rutas);
  } catch (err) {
    borrarFotos(rutas);
    throw err;
  }
}

/** Entero positivo opcional de la query string (paginación, ids de filtro). */
function enteroOpcional(valor, nombre) {
  if (valor === undefined || valor === '') return undefined;
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, `El parámetro "${nombre}" debe ser un entero positivo`);
  return n;
}

const validarPieza = validar({
  nombre: [reglas.requerido('El nombre y tipo de la refacción son obligatorios')],
  tipo: [reglas.enLista(ordenes.TIPOS_REFACCION, 'El nombre y tipo de la refacción son obligatorios')],
});

const datosPieza = (body) => ({
  nombre: texto(body.nombre),
  tipo: texto(body.tipo),
  numeroSerie: texto(body.numero_serie),
});

// GET /api/ordenes?q=&estado=&desde=&hasta=&tecnico=&pagina=&por_pagina=
router.get('/', (req, res) => {
  const resultado = ordenes.listar({
    q: req.query.q === undefined ? undefined : texto(req.query.q),
    estado: texto(req.query.estado) || undefined,
    desde: texto(req.query.desde) || undefined,
    hasta: texto(req.query.hasta) || undefined,
    tecnico: enteroOpcional(req.query.tecnico, 'tecnico'),
    pagina: enteroOpcional(req.query.pagina, 'pagina'),
    porPagina: enteroOpcional(req.query.por_pagina, 'por_pagina'),
  });
  res.json({
    ...resultado,
    mensaje: resultado.ordenes.length
      ? null
      : 'No se encontraron órdenes de reparación que coincidan con el criterio ingresado',
  });
});

// RF-04 + RF-05: multipart/form-data con campos de texto y `fotos` (1 a 5, etapa "antes")
router.post(
  '/',
  recibirFotos,
  validar({
    dispositivo_id: [reglas.requerido('Selecciona el dispositivo a ingresar')],
    falla_reportada: [reglas.requerido('Debe describir la falla reportada y adjuntar al menos una fotografía del estado inicial del dispositivo')],
    condicion_fisica: [reglas.requerido('Debe describir la condición física del equipo')],
  }),
  (req, res) => {
    const archivos = req.files || [];
    if (!archivos.length) {
      throw new HttpError(400, 'Debe describir la falla reportada y adjuntar al menos una fotografía del estado inicial del dispositivo', {
        campos: [{ campo: 'fotos', mensaje: 'Adjunta al menos una fotografía de recepción' }],
      });
    }
    validarFotos(archivos);
    const datos = {
      dispositivoId: idValido(req.body.dispositivo_id),
      usuarioId: req.usuario.id,
      fallaReportada: texto(req.body.falla_reportada),
      condicionFisica: texto(req.body.condicion_fisica),
      accesorios: ordenes.normalizarAccesorios(req.body.accesorios),
    };
    const orden = guardarYRegistrar(archivos, 'antes', (rutasFotos) => ordenes.crearOrden({ ...datos, rutasFotos }));
    res.status(201).json({ orden });
  },
);

router.get('/:id', (req, res) => {
  res.json({ orden: ordenes.obtenerDetalle(idValido(req.params.id)) });
});

router.patch('/:id/estado-inicial', (req, res) => {
  const orden = ordenes.actualizarEstadoInicial(
    idValido(req.params.id),
    {
      fallaReportada: texto(req.body.falla_reportada),
      condicionFisica: texto(req.body.condicion_fisica),
      accesorios: req.body.accesorios === undefined ? undefined : ordenes.normalizarAccesorios(req.body.accesorios),
    },
    req.usuario.id,
  );
  res.json({ orden });
});

router.patch(
  '/:id/estado',
  validar({
    estado: [reglas.enLista(ordenes.ESTADOS, 'Estado no válido')],
    nota: [
      reglas.requerido('Debe ingresar una nota descriptiva para cambiar el estado'),
      reglas.minimo(5, 'La nota descriptiva debe tener al menos 5 caracteres'),
    ],
  }),
  async (req, res) => {
    const id = idValido(req.params.id);
    const orden = ordenes.avanzarEstado(id, texto(req.body.estado), texto(req.body.nota), req.usuario.id);
    // Al entregar regresamos de una vez el QR para imprimir el certificado
    const certificado = orden.estado === 'Entregado' ? await certificados.certificadoConQr(id) : undefined;
    res.json({ orden, certificado });
  },
);

// RF-07: multipart/form-data con `tipo` (antes|despues) y `fotos` (hasta 5 por etapa)
router.post('/:id/evidencias', recibirFotos, (req, res) => {
  const tipo = texto(req.body.tipo);
  if (!['antes', 'despues'].includes(tipo)) {
    throw new HttpError(400, 'Indica si la fotografía es de la etapa "antes" o "despues"', {
      campos: [{ campo: 'tipo', mensaje: 'Debe ser "antes" o "despues"' }],
    });
  }
  const archivos = req.files || [];
  if (!archivos.length) throw new HttpError(400, 'Selecciona al menos una fotografía');
  validarFotos(archivos);
  const registrar = ordenes.prepararEvidencias(idValido(req.params.id), tipo, archivos.length, req.usuario.id);
  res.status(201).json({ orden: guardarYRegistrar(archivos, tipo, registrar) });
});

router.post('/:id/refacciones', validarPieza, (req, res) => {
  const orden = ordenes.agregarRefaccion(idValido(req.params.id), datosPieza(req.body), req.usuario.id);
  res.status(201).json({ orden });
});

router.put('/:id/refacciones/:refaccionId', validarPieza, (req, res) => {
  const orden = ordenes.editarRefaccion(
    idValido(req.params.id),
    idValido(req.params.refaccionId),
    datosPieza(req.body),
    req.usuario.id,
  );
  res.json({ orden });
});

router.delete('/:id/refacciones/:refaccionId', (req, res) => {
  const orden = ordenes.eliminarRefaccion(idValido(req.params.id), idValido(req.params.refaccionId), req.usuario.id);
  res.json({ orden });
});

router.put(
  '/:id/garantia',
  validar({
    dias_garantia: [reglas.enteroNoNegativo('Los días de garantía deben ser un número entero mayor o igual a cero')],
    terminos_garantia: [reglas.requerido('La descripción de la cobertura de la garantía es obligatoria')],
  }),
  (req, res) => {
    const orden = ordenes.registrarGarantia(
      idValido(req.params.id),
      Number(req.body.dias_garantia),
      texto(req.body.terminos_garantia),
      req.usuario.id,
    );
    res.json({ orden });
  },
);

// P12: nota de servicio imprimible con QR a la página de estatus
router.get('/:id/nota-servicio', async (req, res) => {
  const orden = ordenes.obtenerDetalle(idValido(req.params.id));
  res.json({ orden, taller: config.taller, estatus: await certificados.qrEstatus(orden.url_estatus) });
});

router.get('/:id/certificado', async (req, res) => {
  const id = idValido(req.params.id);
  res.json({ orden: ordenes.obtenerDetalle(id), certificado: await certificados.certificadoConQr(id) });
});

// P10: avisos al cliente
router.get('/:id/avisos', (req, res) => {
  res.json({ avisos: avisos.listar(idValido(req.params.id)), tipos: Object.keys(avisos.TIPOS_AVISO) });
});

router.get('/:id/avisos/vista-previa', (req, res) => {
  res.json({ vista_previa: avisos.vistaPrevia(idValido(req.params.id), texto(req.query.tipo), texto(req.query.adicional)) });
});

router.post(
  '/:id/avisos',
  validar({
    tipo: [reglas.enLista(Object.keys(avisos.TIPOS_AVISO), 'Selecciona un tipo de aviso válido')],
  }),
  async (req, res) => {
    const resultado = await avisos.enviar(
      idValido(req.params.id),
      {
        tipo: texto(req.body.tipo),
        enEstatus: req.body.en_estatus !== false,
        porCorreo: req.body.por_correo === true,
        adicional: texto(req.body.adicional),
      },
      req.usuario.id,
    );
    res.status(201).json(resultado);
  },
);

module.exports = router;
