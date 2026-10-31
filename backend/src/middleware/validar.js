/**
 * @file validar.js
 * @description Capa de validación (bloque 3): formato, campos obligatorios y respuesta 400
 *              indicando qué campo falló y por qué.
 * @task T09, T10, T12, T13, T17
 * @author María Fernanda González Rodríguez
 */
const { HttpError } = require('../utils/errores');

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const texto = (v) => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '');

/**
 * Reglas reutilizables. Cada una recibe el valor y regresa un mensaje de error o null.
 */
const reglas = {
  requerido: (mensaje) => (v) => (texto(v) ? null : mensaje),
  minimo: (n, mensaje) => (v) => (texto(v).length >= n ? null : mensaje),
  email: (mensaje) => (v) => (RE_EMAIL.test(texto(v)) ? null : mensaje),
  emailOpcional: (mensaje) => (v) => (!texto(v) || RE_EMAIL.test(texto(v)) ? null : mensaje),
  telefono: () => (v) =>
    /^\d{10}$/.test(texto(v)) ? null : 'El número de teléfono debe contener exactamente 10 dígitos',
  enLista: (lista, mensaje) => (v) => (lista.includes(texto(v)) ? null : mensaje),
  enteroNoNegativo: (mensaje) => (v) =>
    Number.isInteger(Number(v)) && Number(v) >= 0 && String(v).trim() !== '' ? null : mensaje,
  verdadero: (mensaje) => (v) => (v === true || v === 'true' || v === 1 || v === '1' ? null : mensaje),
  // P2: mínimo 8 caracteres y al menos un número
  password: () => (v) =>
    typeof v === 'string' && v.length >= 8 && /\d/.test(v)
      ? null
      : 'La contraseña debe tener al menos 8 caracteres y un número',
  igualA: (otroCampo, mensaje) => (v, body) => (v === body[otroCampo] ? null : mensaje),
};

/**
 * Crea un middleware que valida `req.body` contra un esquema `{ campo: [regla, ...] }`.
 * Se reporta solo el primer error de cada campo.
 *
 * @param {Object<string, Function[]>} esquema
 * @returns {import('express').RequestHandler}
 * @throws {HttpError} 400 con `campos: [{ campo, mensaje }]`.
 */
function validar(esquema) {
  return (req, res, next) => {
    const body = req.body || {};
    const campos = [];
    for (const [campo, listaReglas] of Object.entries(esquema)) {
      for (const regla of listaReglas) {
        const mensaje = regla(body[campo], body);
        if (mensaje) {
          campos.push({ campo, mensaje });
          break;
        }
      }
    }
    if (campos.length) {
      throw new HttpError(400, campos[0].mensaje, { campos });
    }
    next();
  };
}

/**
 * Valida el identificador del dispositivo según su tipo (RF-03):
 * celular → IMEI de 15 dígitos; otros → serie alfanumérica de 4 a 30 caracteres.
 */
function imeiOSerie(v, body) {
  const valor = texto(v);
  if (texto(body.tipo) === 'celular') {
    return /^\d{15}$/.test(valor) ? null : 'El IMEI debe contener exactamente 15 dígitos numéricos';
  }
  return /^[A-Za-z0-9-]{4,30}$/.test(valor)
    ? null
    : 'El número de serie debe contener entre 4 y 30 caracteres alfanuméricos';
}

/**
 * Convierte un parámetro de ruta a entero positivo.
 *
 * @param {string} valor
 * @returns {number}
 * @throws {HttpError} 400 si no es un id válido.
 */
function idValido(valor) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Identificador no válido');
  return id;
}

module.exports = { validar, reglas, imeiOSerie, idValido, texto, RE_EMAIL, RE_UUID };
