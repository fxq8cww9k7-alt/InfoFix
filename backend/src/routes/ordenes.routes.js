/**
 * @file ordenes.routes.js
 * @description Rutas de órdenes de reparación: apertura, estados, fotos, piezas, garantía y certificado.
 * @task T12, T13, T15, T16, T17, T20, T21 (RF-04 a RF-11, RF-14)
 * @author María Fernanda González Rodríguez
 */
const express = require('express');
const ordenes = require('../services/ordenes.service');
const certificados = require('../services/certificado.service');
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

router.get('/', (req, res) => {
  const q = req.query.q === undefined ? undefined : texto(req.query.q);
  const resultados = ordenes.listar({ q, estado: texto(req.query.estado) || undefined });
  res.json({
    ordenes: resultados,
    mensaje: resultados.length ? null : 'No se encontraron órdenes de reparación que coincidan con el criterio ingresado',
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
  const orden = ordenes.actualizarEstadoInicial(idValido(req.params.id), {
    fallaReportada: texto(req.body.falla_reportada),
    condicionFisica: texto(req.body.condicion_fisica),
    accesorios: req.body.accesorios === undefined ? undefined : ordenes.normalizarAccesorios(req.body.accesorios),
  });
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
  const registrar = ordenes.prepararEvidencias(idValido(req.params.id), tipo, archivos.length);
  res.status(201).json({ orden: guardarYRegistrar(archivos, tipo, registrar) });
});

router.post(
  '/:id/refacciones',
  validar({
    nombre: [reglas.requerido('El nombre y tipo de la refacción son obligatorios')],
    tipo: [reglas.enLista(ordenes.TIPOS_REFACCION, 'El nombre y tipo de la refacción son obligatorios')],
  }),
  (req, res) => {
    const orden = ordenes.agregarRefaccion(idValido(req.params.id), {
      nombre: texto(req.body.nombre),
      tipo: texto(req.body.tipo),
      numeroSerie: texto(req.body.numero_serie),
    });
    res.status(201).json({ orden });
  },
);

router.delete('/:id/refacciones/:refaccionId', (req, res) => {
  res.json({ orden: ordenes.eliminarRefaccion(idValido(req.params.id), idValido(req.params.refaccionId)) });
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
    );
    res.json({ orden });
  },
);

router.get('/:id/certificado', async (req, res) => {
  const id = idValido(req.params.id);
  res.json({ orden: ordenes.obtenerDetalle(id), certificado: await certificados.certificadoConQr(id) });
});

module.exports = router;
