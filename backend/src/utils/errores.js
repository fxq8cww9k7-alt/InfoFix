/**
 * @file errores.js
 * @description Error HTTP del dominio y middleware que lo convierte en respuesta JSON (bloque 3.5).
 * @task T04
 * @author María Fernanda González Rodríguez
 */
const multer = require('multer');

const MSG_FOTO_INVALIDA = 'Formato no válido o tamaño excedido (máximo 5 MB en formato JPG o PNG)';

/** Error con código HTTP; `extra` se agrega tal cual al cuerpo de la respuesta. */
class HttpError extends Error {
  /**
   * @param {number} status - Código HTTP (400, 401, 404, 409...).
   * @param {string} mensaje - Mensaje para mostrar al usuario.
   * @param {Object} [extra] - Datos adicionales (p. ej. `campos` o `pendientes`).
   */
  constructor(status, mensaje, extra = {}) {
    super(mensaje);
    this.status = status;
    this.extra = extra;
  }
}

/**
 * Middleware final de Express. Formato de respuesta: `{ error, ...extra }`.
 */
// eslint-disable-next-line no-unused-vars
function manejadorErrores(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, ...err.extra });
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: MSG_FOTO_INVALIDA });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es JSON válido' });
  }
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

module.exports = { HttpError, manejadorErrores, MSG_FOTO_INVALIDA };
