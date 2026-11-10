PRAGMA user_version = 1;
PRAGMA foreign_keys = ON;
-- WAL permite leer mientras otra petición escribe (p. ej. el dashboard mientras se sube una foto)
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 5000;


-- ==============================================================================
-- 1. Personal del taller
CREATE TABLE IF NOT EXISTS usuarios (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre          TEXT    NOT NULL CHECK (length(trim(nombre)) > 0),
  email           TEXT    NOT NULL UNIQUE COLLATE NOCASE CHECK (email LIKE '%_@_%._%'),
  password_hash   TEXT    NOT NULL CHECK (length(password_hash) >= 50),   -- bcrypt: 60 caracteres
  activo          INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),     -- 0 = no puede iniciar sesión
  version_sesion  INTEGER NOT NULL DEFAULT 0 CHECK (version_sesion >= 0),  -- se incrementa para invalidar los JWT ya emitidos
  fecha_registro  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
-- SE BORRO LA COLUMNA DE ROL DONDE SE DEFINIA COMO TECNICO O ADMIN

-- Enlaces de recuperación de contraseña: un solo uso, 30 minutos. Solo se guarda el hash del token
CREATE TABLE IF NOT EXISTS recuperaciones (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash  TEXT    NOT NULL UNIQUE CHECK (length(token_hash) = 64), 
  expira      TEXT    NOT NULL,
  usado       INTEGER NOT NULL DEFAULT 0 CHECK (usado IN (0, 1)),
  fecha       TEXT    NOT NULL
);


-- ==============================================================================
-- 2. Clientes y dispositivos
CREATE TABLE IF NOT EXISTS clientes (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre_completo   TEXT    NOT NULL CHECK (length(trim(nombre_completo)) > 0),
  -- Exactamente 10 dígitos (RF-02)
  telefono          TEXT    NOT NULL UNIQUE
                    CHECK (length(telefono) = 10 AND telefono NOT GLOB '*[^0-9]*'),
  email             TEXT    COLLATE NOCASE CHECK (email IS NULL OR email LIKE '%_@_%._%'),
  -- Sin aceptar el aviso de privacidad no se puede registrar al cliente (LFPDPPP)
  aviso_privacidad  INTEGER NOT NULL CHECK (aviso_privacidad = 1),
  fecha_registro    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS dispositivos (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id         INTEGER NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  tipo               TEXT    NOT NULL CHECK (tipo IN ('celular', 'tablet', 'laptop', 'otro')),
  marca              TEXT    NOT NULL CHECK (length(trim(marca)) > 0),
  modelo             TEXT    NOT NULL CHECK (length(trim(modelo)) > 0),
  color              TEXT,
  imei_o_serie       TEXT    NOT NULL UNIQUE,
  contrasena_equipo  TEXT,                          -- PIN/patrón opcional del equipo (P6); nunca se publica
  fecha_registro     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  -- RF-03: celular → IMEI de 15 dígitos; otros → serie alfanumérica (con guiones) de 4 a 30 caracteres
  CHECK (
    CASE WHEN tipo = 'celular'
         THEN length(imei_o_serie) = 15 AND imei_o_serie NOT GLOB '*[^0-9]*'
         ELSE length(imei_o_serie) BETWEEN 4 AND 30 AND imei_o_serie NOT GLOB '*[^A-Za-z0-9-]*'
    END
  )
);


-- ==============================================================================
-- 3. Órdenes de reparación

-- Para los folios RP-AAAA-NNNN
CREATE TABLE IF NOT EXISTS folios_consecutivos (
  anio    INTEGER PRIMARY KEY CHECK (anio BETWEEN 2000 AND 9999),
  ultimo  INTEGER NOT NULL CHECK (ultimo >= 1)
);

CREATE TABLE IF NOT EXISTS ordenes (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  -- RP-AAAA-NNNN Puede crecer hasta 4 digitos mas si se saturan mas de 999999 ordenes al año
  folio              TEXT    NOT NULL UNIQUE
                     CHECK (folio GLOB 'RP-[0-9][0-9][0-9][0-9]-[0-9][0-9][0-9][0-9]*'
                            AND substr(folio, 9) NOT GLOB '*[^0-9]*'),
  token_estatus      TEXT    NOT NULL UNIQUE CHECK (length(token_estatus) = 36),  -- UUID de la página pública de estatus
  dispositivo_id     INTEGER NOT NULL REFERENCES dispositivos(id) ON DELETE RESTRICT,
  usuario_id         INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,  -- quien recibió el equipo
  estado             TEXT    NOT NULL DEFAULT 'Recibido'
                     CHECK (estado IN ('Recibido', 'Diagnóstico', 'Reparación', 'Pruebas', 'Entregado')),
  falla_reportada    TEXT    NOT NULL CHECK (length(trim(falla_reportada)) > 0),
  condicion_fisica   TEXT    NOT NULL CHECK (length(trim(condicion_fisica)) > 0),
  accesorios         TEXT    NOT NULL DEFAULT '[]'                                  -- arreglo JSON de strings
                     CHECK (json_valid(accesorios) AND json_type(accesorios) = 'array'),
  fecha_recepcion    TEXT    NOT NULL,
  fecha_entrega      TEXT,
  dias_garantia      INTEGER CHECK (dias_garantia >= 0),
  terminos_garantia  TEXT,
  garantia_fin       TEXT,
  bloqueada          INTEGER NOT NULL DEFAULT 0 CHECK (bloqueada IN (0, 1)),       -- 1 al emitir certificado 

  -- Garantía: días y términos se registran juntos 
  CHECK ((dias_garantia IS NULL) = (terminos_garantia IS NULL)),
  -- Solo una orden entregada tiene fecha de entrega y queda bloqueada 
  CHECK ((estado = 'Entregado') = (fecha_entrega IS NOT NULL)),
  CHECK (bloqueada = (estado = 'Entregado')),
  -- No se entrega sin garantía; la vigencia corre desde la entrega 
  CHECK (estado <> 'Entregado' OR (dias_garantia IS NOT NULL AND garantia_fin IS NOT NULL)),
  CHECK (garantia_fin IS NULL OR fecha_entrega IS NOT NULL),
  CHECK (fecha_entrega IS NULL OR fecha_entrega >= fecha_recepcion),
  CHECK (garantia_fin IS NULL OR garantia_fin >= fecha_entrega)
);

-- Línea de tiempo inmutable (RF-06). `tipo` = 'estado' son los cambios de etapa; los demás tipos registran acciones sobre la orden (piezas, fotos, garantía, avisos)
CREATE TABLE IF NOT EXISTS historial_estados (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id    INTEGER NOT NULL REFERENCES ordenes(id) ON DELETE RESTRICT,
  tipo        TEXT    NOT NULL DEFAULT 'estado'
              CHECK (tipo IN ('estado', 'pieza', 'foto', 'garantia', 'aviso', 'edicion')),
  estado      TEXT    NOT NULL                       -- etapa de la orden en ese momento
              CHECK (estado IN ('Recibido', 'Diagnóstico', 'Reparación', 'Pruebas', 'Entregado')),
  nota        TEXT    NOT NULL CHECK (length(trim(nota)) > 0),
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  fecha       TEXT    NOT NULL
);

-- Fotografías antes/después. El archivo vive en backend/uploads/; aquí solo la ruta relativa
CREATE TABLE IF NOT EXISTS evidencias (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id      INTEGER NOT NULL REFERENCES ordenes(id) ON DELETE RESTRICT,
  tipo          TEXT    NOT NULL CHECK (tipo IN ('antes', 'despues')),
  ruta_archivo  TEXT    NOT NULL UNIQUE CHECK (length(trim(ruta_archivo)) > 0),
  fecha_subida  TEXT    NOT NULL
);

-- Piezas usadas en la reparación
CREATE TABLE IF NOT EXISTS refacciones (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id      INTEGER NOT NULL REFERENCES ordenes(id) ON DELETE RESTRICT,
  nombre        TEXT    NOT NULL CHECK (length(trim(nombre)) > 0),
  tipo          TEXT    NOT NULL CHECK (tipo IN ('original', 'compatible', 'reacondicionada')),
  numero_serie  TEXT
);


-- ==============================================================================
-- 4. Certificados
CREATE TABLE IF NOT EXISTS certificados (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id       INTEGER NOT NULL UNIQUE REFERENCES ordenes(id) ON DELETE RESTRICT,  -- un certificado por orden
  token_uuid     TEXT    NOT NULL UNIQUE CHECK (length(token_uuid) = 36),           -- UUID v4, no secuencial
  url_publica    TEXT    NOT NULL CHECK (url_publica LIKE 'http%/verificar/%'),
  fecha_emision  TEXT    NOT NULL
);


-- ==============================================================================
-- 5. Comunicación con el cliente y con el personal 

-- Avisos enviados al cliente
CREATE TABLE IF NOT EXISTS avisos_cliente (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id       INTEGER NOT NULL REFERENCES ordenes(id) ON DELETE RESTRICT,
  tipo           TEXT    NOT NULL
                 CHECK (tipo IN ('actualizacion_estado', 'requiere_autorizacion', 'listo_para_recoger')),
  mensaje        TEXT    NOT NULL CHECK (length(trim(mensaje)) > 0),
  en_estatus     INTEGER NOT NULL DEFAULT 1 CHECK (en_estatus IN (0, 1)),
  por_correo     INTEGER NOT NULL DEFAULT 0 CHECK (por_correo IN (0, 1)),
  estado_correo  TEXT    NOT NULL DEFAULT 'no_aplica' CHECK (estado_correo IN ('enviado', 'fallido', 'no_aplica')),
  usuario_id     INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  fecha          TEXT    NOT NULL,
  -- Al menos un canal, y el estado del correo solo aplica si se mandó por correo
  CHECK (en_estatus = 1 OR por_correo = 1),
  CHECK ((por_correo = 0) = (estado_correo = 'no_aplica'))
);

-- Notificaciones del panel. `clave` evita duplicar avisos automáticos (p. ej. la misma orden detenida)
CREATE TABLE IF NOT EXISTS notificaciones (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  categoria   TEXT    NOT NULL CHECK (categoria IN ('ordenes', 'garantias', 'cuentas')),
  tipo        TEXT    NOT NULL CHECK (tipo IN ('certificado_emitido', 'aviso_enviado', 'correo_no_entregado',
                                               'orden_detenida', 'garantia_por_vencer')),
  mensaje     TEXT    NOT NULL CHECK (length(trim(mensaje)) > 0),
  orden_id    INTEGER REFERENCES ordenes(id) ON DELETE CASCADE,
  cliente_id  INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  clave       TEXT    UNIQUE,
  fecha       TEXT    NOT NULL
);

-- Estado de lectura por usuario
CREATE TABLE IF NOT EXISTS notificaciones_leidas (
  notificacion_id  INTEGER NOT NULL REFERENCES notificaciones(id) ON DELETE CASCADE,
  usuario_id       INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  PRIMARY KEY (notificacion_id, usuario_id)
) WITHOUT ROWID;


-- ==============================================================================
-- 6. Índices (pensados para las consultas de backend/src/services y backend/src/routes)

-- Un dispositivo no puede tener dos órdenes activas a la vez. El backend ya lo revisa, pero el índice lo garantiza aunque lleguen dos recepciones al mismo tiempo
CREATE UNIQUE INDEX IF NOT EXISTS ux_ordenes_activa_por_dispositivo
  ON ordenes(dispositivo_id) WHERE estado <> 'Entregado';

-- Historial del equipo y conteo de reparaciones certificadas
CREATE INDEX IF NOT EXISTS idx_ordenes_dispositivo_estado ON ordenes(dispositivo_id, estado);
-- Dashboard: conteos por etapa 
CREATE INDEX IF NOT EXISTS idx_ordenes_estado             ON ordenes(estado);
-- Listados ordenados por recepción y filtro por rango de fechas 
CREATE INDEX IF NOT EXISTS idx_ordenes_recepcion          ON ordenes(fecha_recepcion DESC, id DESC);
-- Filtro por técnico 
CREATE INDEX IF NOT EXISTS idx_ordenes_usuario            ON ordenes(usuario_id);
-- Garantías vigentes / por vencer 
CREATE INDEX IF NOT EXISTS idx_ordenes_garantia_fin       ON ordenes(garantia_fin) WHERE garantia_fin IS NOT NULL;

-- Equipos de un cliente 
CREATE INDEX IF NOT EXISTS idx_dispositivos_cliente       ON dispositivos(cliente_id);
-- Lista de clientes ordenada por nombre 
CREATE INDEX IF NOT EXISTS idx_clientes_nombre            ON clientes(nombre_completo COLLATE NOCASE);

-- Línea de tiempo y requisitos de entrega 
CREATE INDEX IF NOT EXISTS idx_historial_orden_tipo       ON historial_estados(orden_id, tipo);
-- Fotos por etapa y conteo del límite de 5 
CREATE INDEX IF NOT EXISTS idx_evidencias_orden_tipo      ON evidencias(orden_id, tipo);
CREATE INDEX IF NOT EXISTS idx_refacciones_orden          ON refacciones(orden_id);
CREATE INDEX IF NOT EXISTS idx_avisos_orden               ON avisos_cliente(orden_id);

-- Lista de certificados emitidos 
CREATE INDEX IF NOT EXISTS idx_certificados_emision       ON certificados(fecha_emision DESC);

-- Invalidar enlaces pendientes al pedir uno nuevo 
CREATE INDEX IF NOT EXISTS idx_recuperaciones_pendientes  ON recuperaciones(usuario_id) WHERE usado = 0;

-- Campana de notificaciones: más recientes primero y conteo de no leídas por usuario 
CREATE INDEX IF NOT EXISTS idx_notificaciones_fecha       ON notificaciones(fecha DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leidas_usr  ON notificaciones_leidas(usuario_id, notificacion_id);


-- ==============================================================================
-- 7. Triggers: reglas de negocio que no cabian en un CHECK

-- La orden avanza exactamente una etapa a la vez, sin saltos bruscos entre etapas
CREATE TRIGGER IF NOT EXISTS trg_ordenes_transicion_estado
BEFORE UPDATE OF estado ON ordenes
WHEN NEW.estado IS NOT OLD.estado
 AND NEW.estado IS NOT (CASE OLD.estado
                          WHEN 'Recibido'    THEN 'Diagnóstico'
                          WHEN 'Diagnóstico' THEN 'Reparación'
                          WHEN 'Reparación'  THEN 'Pruebas'
                          WHEN 'Pruebas'     THEN 'Entregado'
                        END)
BEGIN
  SELECT RAISE(ABORT, 'Transición de estado no permitida: la orden debe avanzar UNA etapa a la vez');
END;

-- Folio, token, equipo, responsable y fecha de recepción no cambian después de abrir la orden
CREATE TRIGGER IF NOT EXISTS trg_ordenes_datos_fijos
BEFORE UPDATE OF folio, token_estatus, dispositivo_id, usuario_id, fecha_recepcion ON ordenes
WHEN NEW.folio IS NOT OLD.folio
  OR NEW.token_estatus IS NOT OLD.token_estatus
  OR NEW.dispositivo_id IS NOT OLD.dispositivo_id
  OR NEW.usuario_id IS NOT OLD.usuario_id
  OR NEW.fecha_recepcion IS NOT OLD.fecha_recepcion
BEGIN
  SELECT RAISE(ABORT, 'El folio, token, dispositivo, responsable y fecha de recepción de una orden no se pueden modificar');
END;

-- Una orden entregada (certificada) QUEDARA bloqueada
CREATE TRIGGER IF NOT EXISTS trg_ordenes_bloqueada
BEFORE UPDATE ON ordenes
WHEN OLD.bloqueada = 1
BEGIN
  SELECT RAISE(ABORT, 'La orden ya fue entregada y no se puede modificar');
END;

-- La línea de tiempo es inmutable
CREATE TRIGGER IF NOT EXISTS trg_historial_sin_cambios
BEFORE UPDATE ON historial_estados
BEGIN
  SELECT RAISE(ABORT, 'El historial de la orden es inmutable');
END;

CREATE TRIGGER IF NOT EXISTS trg_historial_sin_borrado
BEFORE DELETE ON historial_estados
BEGIN
  SELECT RAISE(ABORT, 'El historial de la orden es inmutable');
END;

-- Fotos "antes" solo durante la recepción; ninguna foto en una orden entregada
CREATE TRIGGER IF NOT EXISTS trg_evidencias_insertar
BEFORE INSERT ON evidencias
BEGIN
  SELECT RAISE(ABORT, 'La orden ya fue entregada y no se puede modificar')
   WHERE (SELECT bloqueada FROM ordenes WHERE id = NEW.orden_id) = 1;
  SELECT RAISE(ABORT, 'Las fotografías de recepción (antes) solo se pueden subir mientras la orden está en Recibido')
   WHERE NEW.tipo = 'antes' AND (SELECT estado FROM ordenes WHERE id = NEW.orden_id) <> 'Recibido';
END;

-- Las fotos son evidencia: no se editan ni se borran
CREATE TRIGGER IF NOT EXISTS trg_evidencias_sin_cambios
BEFORE UPDATE ON evidencias
BEGIN
  SELECT RAISE(ABORT, 'Las evidencias fotográficas no se pueden modificar');
END;

CREATE TRIGGER IF NOT EXISTS trg_evidencias_sin_borrado
BEFORE DELETE ON evidencias
BEGIN
  SELECT RAISE(ABORT, 'Las evidencias fotográficas no se pueden eliminar');
END;

-- Piezas nuevas solo en Diagnóstico o Reparación; nada cambia en una orden entregada
CREATE TRIGGER IF NOT EXISTS trg_refacciones_insertar
BEFORE INSERT ON refacciones
BEGIN
  SELECT RAISE(ABORT, 'Solo se pueden registrar piezas en las etapas de Diagnóstico o Reparación')
   WHERE (SELECT estado FROM ordenes WHERE id = NEW.orden_id) NOT IN ('Diagnóstico', 'Reparación');
END;

CREATE TRIGGER IF NOT EXISTS trg_refacciones_editar
BEFORE UPDATE ON refacciones
WHEN (SELECT bloqueada FROM ordenes WHERE id = OLD.orden_id) = 1
  OR NEW.orden_id IS NOT OLD.orden_id
BEGIN
  SELECT RAISE(ABORT, 'La orden ya fue entregada y no se puede modificar');
END;

CREATE TRIGGER IF NOT EXISTS trg_refacciones_borrar
BEFORE DELETE ON refacciones
WHEN (SELECT bloqueada FROM ordenes WHERE id = OLD.orden_id) = 1
BEGIN
  SELECT RAISE(ABORT, 'La orden ya fue entregada y no se puede modificar');
END;

-- El certificado solo se emite para una orden entregada y después no cambia
CREATE TRIGGER IF NOT EXISTS trg_certificados_insertar
BEFORE INSERT ON certificados
WHEN (SELECT estado FROM ordenes WHERE id = NEW.orden_id) IS NOT 'Entregado'
BEGIN
  SELECT RAISE(ABORT, 'Solo se puede emitir el certificado de una orden en estado Entregado');
END;

CREATE TRIGGER IF NOT EXISTS trg_certificados_sin_cambios
BEFORE UPDATE ON certificados
BEGIN
  SELECT RAISE(ABORT, 'Un certificado emitido no se puede modificar');
END;

CREATE TRIGGER IF NOT EXISTS trg_certificados_sin_borrado
BEFORE DELETE ON certificados
BEGIN
  SELECT RAISE(ABORT, 'Un certificado emitido no se puede eliminar');
END;

-- Si el equipo ya aparece en un certificado, no se puede modificar NADA de él
DROP TRIGGER IF EXISTS trg_dispositivos_identidad_certificada;
CREATE TRIGGER trg_dispositivos_identidad_certificada
BEFORE UPDATE ON dispositivos
WHEN EXISTS (SELECT 1 FROM certificados c JOIN ordenes o ON o.id = c.orden_id
             WHERE o.dispositivo_id = OLD.id)
BEGIN
  SELECT RAISE(ABORT, 'El equipo ya tiene certificados emitidos: no se puede modificar');
END;
