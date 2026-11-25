/**
 * @file correo.js
 * @description Envío de correos (recuperación de contraseña P3 y avisos al cliente P10).
 *              Sin SMTP configurado, el correo se imprime en la consola para poder probar en local.
 * @task P3, P10 (Act. 11)
 * @author María Fernanda González Rodríguez
 */
const nodemailer = require('nodemailer');
const config = require('../config');

const transporte = config.smtp.host
  ? nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.puerto,
      secure: config.smtp.puerto === 465,
      auth: config.smtp.usuario ? { user: config.smtp.usuario, pass: config.smtp.password } : undefined,
    })
  : null;

// En pruebas (NODE_ENV=test) los correos se acumulan aquí para poder revisarlos
const bandejaPruebas = [];

/**
 * Envía un correo de texto plano. Nunca lanza: regresa si se pudo enviar.
 *
 * @param {{para: string, asunto: string, texto: string}} correo
 * @returns {Promise<boolean>} true si se envió (o se imprimió en consola en modo desarrollo).
 */
async function enviarCorreo({ para, asunto, texto }) {
  if (!transporte) {
    if (config.entorno === 'test') bandejaPruebas.push({ para, asunto, texto });
    else console.log(`\n--- Correo (modo desarrollo, sin SMTP) ---\nPara: ${para}\nAsunto: ${asunto}\n\n${texto}\n---\n`);
    return true;
  }
  try {
    await transporte.sendMail({ from: config.smtp.remitente, to: para, subject: asunto, text: texto });
    return true;
  } catch (err) {
    console.error(`No se pudo enviar el correo a ${para}:`, err.message);
    return false;
  }
}

module.exports = { enviarCorreo, bandejaPruebas };
