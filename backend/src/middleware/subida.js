/**
 * @file subida.js
 * @description Recepción y validación de fotografías (bloque 3.3): solo JPG/PNG de máximo 5 MB.
 *              Los archivos se reciben en memoria y se escriben a disco hasta que la operación
 *              se valida, para no dejar fotos huérfanas cuando una petición se rechaza.
 * @task T15, T16 (RF-05, RF-07)
 * @author María Fernanda González Rodríguez
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const multer = require('multer');
const config = require('../config');
const { HttpError, MSG_FOTO_INVALIDA } = require('../utils/errores');

const recibirFotos = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxArchivoBytes, files: config.maxFotosPorEtapa },
}).array('fotos', config.maxFotosPorEtapa);

/**
 * Detecta el formato real por la firma del archivo; el mimetype lo manda el navegador
 * y se puede falsificar.
 *
 * @param {Buffer} buffer
 * @returns {'jpg'|'png'|null}
 */
function detectarFormato(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  const firmaPng = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buffer.length >= 8 && firmaPng.every((b, i) => buffer[i] === b)) return 'png';
  return null;
}

/**
 * Revisa que todas las fotos recibidas sean JPG/PNG reales.
 *
 * @param {Express.Multer.File[]} archivos
 * @throws {HttpError} 400 si alguna no es imagen permitida.
 */
function validarFotos(archivos) {
  for (const archivo of archivos) {
    if (!detectarFormato(archivo.buffer)) throw new HttpError(400, MSG_FOTO_INVALIDA);
  }
}

/**
 * Escribe las fotos en uploads/<tipo>/ con nombre aleatorio (no adivinable).
 *
 * @param {Express.Multer.File[]} archivos
 * @param {'antes'|'despues'} tipo
 * @returns {string[]} Rutas relativas a uploads/, p. ej. `antes/3f2c...png`.
 */
function guardarFotos(archivos, tipo) {
  const carpeta = path.join(config.uploadsDir, tipo);
  fs.mkdirSync(carpeta, { recursive: true });
  return archivos.map((archivo) => {
    const nombre = `${crypto.randomUUID()}.${detectarFormato(archivo.buffer)}`;
    fs.writeFileSync(path.join(carpeta, nombre), archivo.buffer);
    return `${tipo}/${nombre}`;
  });
}

/**
 * Borra fotos ya escritas cuando la transacción de BD falla después de guardarlas.
 *
 * @param {string[]} rutas - Rutas relativas a uploads/.
 */
function borrarFotos(rutas) {
  for (const ruta of rutas) fs.rmSync(path.join(config.uploadsDir, ruta), { force: true });
}

module.exports = { recibirFotos, validarFotos, guardarFotos, borrarFotos };
