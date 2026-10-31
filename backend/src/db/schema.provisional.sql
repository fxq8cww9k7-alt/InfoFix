-- ==============================================================================
-- InfoFIX - Esquema de base de datos (SQLite)
-- Esquema PROVISIONAL del backend para poder desarrollar y probar la API.
-- La BD oficial es tarea de Mauricio (T02/T03, database/schema.sql); en cuanto exista,
-- el backend la usa en lugar de este archivo. Sirve como referencia de lo que la API necesita.
-- El backend ejecuta este script al arrancar; todas las sentencias son idempotentes.
-- ==============================================================================

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuarios (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre          TEXT    NOT NULL,
  email           TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash   TEXT    NOT NULL,
  rol             TEXT    NOT NULL DEFAULT 'tecnico' CHECK (rol IN ('admin', 'tecnico')),
  activo          INTEGER NOT NULL DEFAULT 1,       -- 0 = cuenta desactivada, no puede iniciar sesión
  version_sesion  INTEGER NOT NULL DEFAULT 0,       -- se incrementa para invalidar los JWT ya emitidos (P3)
  fecha_registro  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS clientes (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre_completo   TEXT    NOT NULL,
  telefono          TEXT    NOT NULL UNIQUE CHECK (length(telefono) = 10),
  email             TEXT,
  aviso_privacidad  INTEGER NOT NULL CHECK (aviso_privacidad = 1),
  fecha_registro    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS dispositivos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id      INTEGER NOT NULL REFERENCES clientes(id),
  tipo            TEXT    NOT NULL CHECK (tipo IN ('celular', 'tablet', 'laptop', 'otro')),
  marca           TEXT    NOT NULL,
  modelo          TEXT    NOT NULL,
  color           TEXT,
  imei_o_serie    TEXT    NOT NULL UNIQUE,
  contrasena_equipo TEXT,                           -- PIN/patrón opcional del equipo (P6); nunca se publica
  fecha_registro  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Consecutivo anual para folios RP-AAAA-NNNN (RF-04)
CREATE TABLE IF NOT EXISTS folios_consecutivos (
  anio    INTEGER PRIMARY KEY,
  ultimo  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ordenes (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  folio              TEXT    NOT NULL UNIQUE,
  token_estatus      TEXT    NOT NULL UNIQUE,       -- UUID de la página pública de estatus (P12, P15)
  dispositivo_id     INTEGER NOT NULL REFERENCES dispositivos(id),
  usuario_id         INTEGER NOT NULL REFERENCES usuarios(id),
  estado             TEXT    NOT NULL DEFAULT 'Recibido'
                     CHECK (estado IN ('Recibido', 'Diagnóstico', 'Reparación', 'Pruebas', 'Entregado')),
  falla_reportada    TEXT    NOT NULL,
  condicion_fisica   TEXT    NOT NULL,
  accesorios         TEXT    NOT NULL DEFAULT '[]',   -- arreglo JSON de strings
  fecha_recepcion    TEXT    NOT NULL,
  fecha_entrega      TEXT,
  dias_garantia      INTEGER CHECK (dias_garantia >= 0),
  terminos_garantia  TEXT,
  garantia_fin       TEXT,
  bloqueada          INTEGER NOT NULL DEFAULT 0      -- 1 al emitir certificado (RF-10)
);

-- Línea de tiempo inmutable (RF-06). `tipo` = 'estado' son los cambios de etapa; los demás
-- tipos registran acciones sobre la orden (piezas, fotos, garantía, avisos) para la bitácora (P7)
CREATE TABLE IF NOT EXISTS historial_estados (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id    INTEGER NOT NULL REFERENCES ordenes(id),
  tipo        TEXT    NOT NULL DEFAULT 'estado'
              CHECK (tipo IN ('estado', 'pieza', 'foto', 'garantia', 'aviso', 'edicion')),
  estado      TEXT    NOT NULL,                    -- etapa de la orden en ese momento
  nota        TEXT    NOT NULL,
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id),
  fecha       TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS evidencias (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id      INTEGER NOT NULL REFERENCES ordenes(id),
  tipo          TEXT    NOT NULL CHECK (tipo IN ('antes', 'despues')),
  ruta_archivo  TEXT    NOT NULL,
  fecha_subida  TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS refacciones (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id      INTEGER NOT NULL REFERENCES ordenes(id),
  nombre        TEXT    NOT NULL,
  tipo          TEXT    NOT NULL CHECK (tipo IN ('original', 'compatible', 'reacondicionada')),
  numero_serie  TEXT
);

CREATE TABLE IF NOT EXISTS certificados (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id       INTEGER NOT NULL UNIQUE REFERENCES ordenes(id),
  token_uuid     TEXT    NOT NULL UNIQUE,
  url_publica    TEXT    NOT NULL,
  fecha_emision  TEXT    NOT NULL
);

-- Enlaces de recuperación de contraseña: un solo uso, 30 minutos (P3). Se guarda solo el hash del token
CREATE TABLE IF NOT EXISTS recuperaciones (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id),
  token_hash  TEXT    NOT NULL UNIQUE,
  expira      TEXT    NOT NULL,
  usado       INTEGER NOT NULL DEFAULT 0,
  fecha       TEXT    NOT NULL
);

-- Avisos enviados al cliente (P10); los que van a la página de estatus se muestran en P15
CREATE TABLE IF NOT EXISTS avisos_cliente (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id       INTEGER NOT NULL REFERENCES ordenes(id),
  tipo           TEXT    NOT NULL,
  mensaje        TEXT    NOT NULL,
  en_estatus     INTEGER NOT NULL DEFAULT 1,
  por_correo     INTEGER NOT NULL DEFAULT 0,
  estado_correo  TEXT    NOT NULL DEFAULT 'no_aplica' CHECK (estado_correo IN ('enviado', 'fallido', 'no_aplica')),
  usuario_id     INTEGER NOT NULL REFERENCES usuarios(id),
  fecha          TEXT    NOT NULL
);

-- Notificaciones del panel (P5). `clave` evita duplicar avisos automáticos (p. ej. la misma orden detenida)
CREATE TABLE IF NOT EXISTS notificaciones (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  categoria   TEXT    NOT NULL CHECK (categoria IN ('ordenes', 'garantias', 'cuentas')),
  tipo        TEXT    NOT NULL,
  mensaje     TEXT    NOT NULL,
  orden_id    INTEGER REFERENCES ordenes(id),
  cliente_id  INTEGER REFERENCES clientes(id),
  clave       TEXT    UNIQUE,
  fecha       TEXT    NOT NULL
);

-- Estado de lectura por usuario
CREATE TABLE IF NOT EXISTS notificaciones_leidas (
  notificacion_id  INTEGER NOT NULL REFERENCES notificaciones(id),
  usuario_id       INTEGER NOT NULL REFERENCES usuarios(id),
  PRIMARY KEY (notificacion_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_ordenes_dispositivo ON ordenes(dispositivo_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado      ON ordenes(estado);
CREATE INDEX IF NOT EXISTS idx_historial_orden     ON historial_estados(orden_id);
CREATE INDEX IF NOT EXISTS idx_evidencias_orden    ON evidencias(orden_id);
CREATE INDEX IF NOT EXISTS idx_refacciones_orden   ON refacciones(orden_id);
CREATE INDEX IF NOT EXISTS idx_avisos_orden        ON avisos_cliente(orden_id);
