/**
 * @file conexion.js
 * @description Acceso a datos (bloque 2.5): conexión SQLite, creación del esquema y transacciones.
 *              Usa el módulo nativo node:sqlite, así no hay que compilar dependencias en Windows/Mac.
 * @task T04
 * @author María Fernanda González Rodríguez
 */
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const config = require('../config');

if (config.dbPath !== ':memory:') {
  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
}

const db = new DatabaseSync(config.dbPath);
db.exec('PRAGMA foreign_keys = ON;');
db.exec(fs.readFileSync(config.schemaPath, 'utf8'));

/**
 * Ejecuta `fn` dentro de una transacción: si lanza un error se revierte todo
 * (RF-04 folio y RF-10 certificado se guardan completos o no se guardan).
 *
 * @template T
 * @param {() => T} fn - Operaciones síncronas sobre `db`.
 * @returns {T} Lo que regrese `fn`.
 */
function transaccion(fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const resultado = fn();
    db.exec('COMMIT');
    return resultado;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

module.exports = { db, transaccion };
