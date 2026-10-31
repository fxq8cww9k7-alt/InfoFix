/**
 * @file server.js
 * @description Punto de entrada: levanta la API REST en el puerto configurado.
 * @task T04
 * @author María Fernanda González Rodríguez
 */
const config = require('./config');
const app = require('./app');

// 0.0.0.0 para que otros dispositivos de la red (celular de la demo, T26) puedan conectarse
app.listen(config.puerto, '0.0.0.0', () => {
  console.log(`InfoFIX API escuchando en http://localhost:${config.puerto} (${config.entorno})`);
});
