# InfoFIX — Backend (API REST)

Node.js + Express + SQLite (`node:sqlite`, sin dependencias nativas que compilar).
Implementa los requisitos del ERS (RF-01 a RF-15) y las pantallas del diseño de interfaz (Act. 11, P1–P20).

## Cómo correrlo

Requiere **Node.js 22.13 o superior**.

```bash
cd backend
npm install
cp .env.example .env      # en Windows: copy .env.example .env
npm run seed              # crea el usuario admin de desarrollo (ver SEED_ADMIN_* en .env)
npm run dev               # http://localhost:3000, se reinicia al guardar cambios
npm test                  # pruebas de punta a punta (BD en memoria)
```

## Base de datos

- La BD oficial es tarea de **T02/T03** y vive en `database/schema.sql`.
- Mientras ese archivo no exista, el backend usa `src/db/schema.provisional.sql`, que documenta
  las tablas y columnas que la API espera. Si el esquema oficial cambia nombres de columnas,
  hay que ajustar las consultas en `src/services/` y `src/routes/`.
- El archivo `.sqlite` se crea solo al arrancar (ruta en `DB_PATH`) y no se sube al repo.
  Si el esquema cambia (p. ej. se agrega una columna), borra tu `.sqlite` local y corre `npm run seed` otra vez.

## Cuentas del personal

- `npm run seed` crea el primer administrador con los datos `SEED_ADMIN_*` de `.env`.
- **Registro (P2):** cualquier persona del taller puede crear su cuenta con el **código del taller**
  (`CODIGO_TALLER` en `.env`); entra con rol `tecnico`. Sin código configurado, el registro queda deshabilitado.
- **Administración:** un admin puede crear, editar, cambiar contraseña, cambiar rol o desactivar cuentas en `/api/usuarios`.
- **Recuperar contraseña (P3):** enlace por correo de un solo uso que caduca en 30 minutos.
- Desactivar una cuenta o cambiarle la contraseña aplica de inmediato: las sesiones abiertas dejan de funcionar.

## Correos

Se usan para recuperar contraseña (P3) y avisos al cliente (P10). Con `SMTP_HOST` vacío
(desarrollo) el correo **se imprime en la consola del servidor**, ahí aparece el enlace de recuperación.
Para la demo se puede configurar una cuenta SMTP real (p. ej. Gmail con contraseña de aplicación).

## Estructura

```
src/
├── server.js            # Arranca el servidor
├── app.js               # Express, CORS, montaje de rutas (2.1)
├── config.js            # Variables de entorno
├── db/conexion.js       # Conexión SQLite y transacciones (2.5)
├── middleware/
│   ├── auth.js          # Verificación JWT y roles (2.2)
│   ├── validar.js       # Validación de formato y campos obligatorios (3.1, 3.2, 3.5)
│   └── subida.js        # Fotos JPG/PNG máx. 5 MB, revisa la firma real del archivo (3.3)
├── services/
│   ├── ordenes.service.js         # Folios, máquina de estados, fotos, piezas, garantía, bitácora (2.3, 3.4)
│   ├── certificado.service.js     # Certificado, UUID, QR, estatus y verificación pública (2.4)
│   ├── avisos.service.js          # Avisos al cliente por estatus y correo (P10)
│   └── notificaciones.service.js  # Notificaciones del panel (P5)
├── routes/              # Endpoints
└── utils/
    ├── errores.js       # HttpError y respuesta de errores
    └── correo.js        # Envío de correos (o consola en desarrollo)
```

## Convenciones de la API

- Todas las rutas empiezan con `/api`. Respuestas en JSON.
- Rutas privadas: header `Authorization: Bearer <token>` (el token dura 8 h).
- Errores: `{ "error": "mensaje para el usuario", ...extra }`
  - `400` validación. Trae `campos: [{ campo, mensaje }]` o `pendientes: [...]`.
  - `401` sin sesión, sesión vencida, contraseña cambiada o cuenta desactivada → mandar al login.
  - `403` sin permiso (rol) o código del taller incorrecto.
  - `404` no existe · `409` conflicto (duplicado, orden activa, orden bloqueada).
- Fotos: se sirven en `/uploads/antes/<archivo>` y `/uploads/despues/<archivo>` (la API regresa la URL).
- Fechas en ISO 8601 (UTC).

## Endpoints

### Públicos (sin sesión)

| Método | Ruta | Pantalla | Descripción |
| :-- | :-- | :-- | :-- |
| GET | `/api/salud` | | Verifica que el servidor esté arriba |
| POST | `/api/auth/login` | P1 | `{ email, password }` → `{ token, usuario }` |
| POST | `/api/auth/registro` | P2 | `{ nombre, email, password, confirmar_password, codigo_taller }`. Contraseña ≥ 8 caracteres con 1 número |
| POST | `/api/auth/recuperar` | P3 | `{ email }`. Siempre responde lo mismo (no revela si el correo existe) |
| POST | `/api/auth/restablecer` | P3 | `{ token, password, confirmar_password }`. Enlace vencido o usado: `400` con `codigo: "ENLACE_CADUCADO"` |
| GET | `/api/estatus/:token` | P15 | Avance de la reparación (QR de la nota de servicio): paso n de 5, notas por etapa, fotos de recepción, avisos y contacto del taller. Sin datos del cliente |
| GET | `/api/verificar/:token` | P16 | Certificado público: IMEI enmascarado, días restantes de garantía, sin datos del cliente (RF-12) |

### Privados (requieren token)

**Cuenta y administración**

| Método | Ruta | Pantalla | Descripción |
| :-- | :-- | :-- | :-- |
| GET | `/api/auth/me` | | Usuario en sesión |
| GET | `/api/usuarios` | | **Solo admin.** Lista del personal |
| POST | `/api/usuarios` | | **Solo admin.** `{ nombre, email, password, rol? }` |
| GET | `/api/usuarios/:id` | | **Solo admin.** Un usuario |
| PATCH | `/api/usuarios/:id` | | **Solo admin.** `{ nombre?, rol?, activo?, password? }`. Un admin no puede desactivarse ni quitarse el rol a sí mismo |

**Panel**

| Método | Ruta | Pantalla | Descripción |
| :-- | :-- | :-- | :-- |
| GET | `/api/dashboard?estado=` | P4 | Indicadores (activas, en pruebas, terminadas, garantías vigentes), `por_etapa` para la gráfica y órdenes activas (filtrables por etapa) |
| GET | `/api/notificaciones?no_leidas=true&categoria=` | P5 | Notificaciones + contador `no_leidas`. `categoria`: ordenes, garantias, cuentas |
| POST | `/api/notificaciones/leer` | P5 | `{ ids? }`. Sin `ids` marca todas como leídas |

**Clientes y dispositivos**

| Método | Ruta | Pantalla | Descripción |
| :-- | :-- | :-- | :-- |
| GET | `/api/clientes?telefono=` | P6 | Un cliente por teléfono (para reutilizarlo) |
| GET | `/api/clientes?q=&orden=nombre\|reciente` | P18 | Lista con número de órdenes y última visita |
| GET | `/api/clientes/:id` | P18 | Ficha: resumen, equipos y órdenes recientes |
| POST | `/api/clientes` | P6 | `{ nombre_completo, telefono, email?, aviso_privacidad: true }`. Teléfono existente: `409` con `cliente` |
| PATCH | `/api/clientes/:id` | P18 | `{ nombre_completo?, telefono?, email? }` |
| GET | `/api/dispositivos?imei_o_serie=` | P6 | Un dispositivo por IMEI/serie |
| GET | `/api/dispositivos?q=&tipo=` | P19 | Lista con propietario, reparaciones certificadas y orden activa |
| POST | `/api/dispositivos` | P6 | `{ cliente_id, tipo, marca, modelo, color?, imei_o_serie, contrasena_equipo? }`. Existente: `409` con `dispositivo` |
| PATCH | `/api/dispositivos/:id` | P18 | Edita el equipo. Con certificados emitidos solo cambian color y contraseña |
| GET | `/api/dispositivos/:id/historial` | P20 | Reparaciones con piezas y garantía, orden activa y primera visita (RF-15) |

**Órdenes**

| Método | Ruta | Pantalla | Descripción |
| :-- | :-- | :-- | :-- |
| GET | `/api/ordenes?q=&estado=&desde=&hasta=&tecnico=&pagina=&por_pagina=` | P17 | Búsqueda (mín. 3 caracteres), filtros, `paginacion` y `resumen` (RF-14) |
| POST | `/api/ordenes` | P6 | **multipart/form-data**: `dispositivo_id`, `falla_reportada`, `condicion_fisica`, `accesorios` (JSON o separado por comas), `fotos` (1–5) |
| GET | `/api/ordenes/:id` | P7 | Expediente: cliente, equipo, técnico, línea de tiempo, fotos, piezas, garantía, `pendientes_entrega`, `url_estatus` |
| PATCH | `/api/ordenes/:id/estado-inicial` | P7 | Corrige falla, condición o accesorios (solo en Recibido) |
| PATCH | `/api/ordenes/:id/estado` | P11 | `{ estado, nota }`: solo el siguiente estado, nota ≥ 5 caracteres. Al pasar a `Entregado` regresa también `certificado` con `qr` |
| POST | `/api/ordenes/:id/evidencias` | P9 | **multipart**: `tipo` (`antes`/`despues`), `fotos`. Máx. 5 por etapa; "antes" solo en Recibido |
| POST | `/api/ordenes/:id/refacciones` | P8 | `{ nombre, tipo, numero_serie? }`. Solo en Diagnóstico/Reparación |
| PUT | `/api/ordenes/:id/refacciones/:refaccionId` | P8 | Editar pieza |
| DELETE | `/api/ordenes/:id/refacciones/:refaccionId` | P8 | Eliminar pieza |
| PUT | `/api/ordenes/:id/garantia` | P7 | `{ dias_garantia, terminos_garantia }` |
| GET | `/api/ordenes/:id/nota-servicio` | P12 | Datos para imprimir la nota de recepción + `estatus.qr` (QR a la página de estatus) |
| GET | `/api/ordenes/:id/certificado` | P13 | Datos para imprimir el certificado + `qr` (PNG en data URL) |
| GET | `/api/ordenes/:id/avisos` | P10 | Avisos enviados y `tipos` disponibles |
| GET | `/api/ordenes/:id/avisos/vista-previa?tipo=&adicional=` | P10 | Mensaje tal como lo verá el cliente |
| POST | `/api/ordenes/:id/avisos` | P10 | `{ tipo, en_estatus?: true, por_correo?: false, adicional? }`. `tipo`: actualizacion_estado, requiere_autorizacion, listo_para_recoger |

**Certificados**

| Método | Ruta | Pantalla | Descripción |
| :-- | :-- | :-- | :-- |
| GET | `/api/certificados?q=&garantia=vigente\|vencida` | P14 | Certificados emitidos, `total` y `vigentes` |

### Reglas de negocio que aplica el servidor

- Estados: `Recibido → Diagnóstico → Reparación → Pruebas → Entregado`, sin saltos ni retrocesos.
- Folio `RP-AAAA-NNNN`, consecutivo por año, generado dentro de una transacción.
- Un dispositivo no puede tener dos órdenes activas.
- Cada acción sobre la orden (estado, pieza, foto, garantía, aviso) queda en la línea de tiempo (`historial[].tipo`).
- Para pasar a **Entregado** se necesita: ≥1 foto antes, ≥1 foto después, garantía registrada y haber pasado
  por Diagnóstico, Reparación y Pruebas. Si falta algo, responde `400` con la lista `pendientes`.
- Al entregar: se calcula `garantia_fin = fecha_entrega + dias_garantia`, se emite el certificado con
  token UUID v4 y la orden queda **bloqueada** (no se pueden cambiar fotos, piezas ni garantía).
- Notificaciones automáticas: orden sin avanzar de etapa en `DIAS_ORDEN_DETENIDA` días y garantía que vence
  en los próximos `DIAS_AVISO_GARANTIA` días. Se generan al consultar `/api/notificaciones`.

### Rutas que debe tener el frontend

Los QR y los correos apuntan a páginas del **frontend** (`PUBLIC_BASE_URL`), que a su vez llaman a la API:

| Página del frontend | Llama a |
| :-- | :-- |
| `/estatus/:token` | `GET /api/estatus/:token` |
| `/verificar/:token` | `GET /api/verificar/:token` |
| `/restablecer?token=...` | `POST /api/auth/restablecer` |
