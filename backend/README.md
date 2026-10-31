# InfoFIX — Backend (API REST)

Node.js + Express + SQLite (`node:sqlite`, sin dependencias nativas que compilar).

## Cómo correrlo

Requiere **Node.js 22.13 o superior**.

```bash
cd backend
npm install
cp .env.example .env      # en Windows: copy .env.example .env
npm run seed              # crea el usuario admin de desarrollo (ver SEED_ADMIN_* en .env)
npm run dev               # http://localhost:3000, se reinicia al guardar cambios
npm test                  # prueba de punta a punta del flujo completo (BD en memoria)
```

## Base de datos

- La BD oficial es tarea de **T02/T03** y vive en `database/schema.sql`.
- Mientras ese archivo no exista, el backend usa `src/db/schema.provisional.sql`, que documenta
  las tablas y columnas que la API espera. Si el esquema oficial cambia nombres de columnas,
  hay que ajustar las consultas en `src/services/` y `src/routes/`.
- El archivo `.sqlite` se crea solo al arrancar (ruta en `DB_PATH`) y no se sube al repo.

## Estructura

```
src/
├── server.js            # Arranca el servidor
├── app.js               # Express, CORS, montaje de rutas (2.1)
├── config.js            # Variables de entorno
├── db/conexion.js       # Conexión SQLite y transacciones (2.5)
├── middleware/
│   ├── auth.js          # Verificación JWT (2.2)
│   ├── validar.js       # Validación de formato y campos obligatorios (3.1, 3.2, 3.5)
│   └── subida.js        # Fotos JPG/PNG máx. 5 MB, revisa la firma real del archivo (3.3)
├── services/
│   ├── ordenes.service.js     # Folios, máquina de estados, fotos, piezas, garantía (2.3, 3.4)
│   └── certificado.service.js # Certificado, UUID, QR y vista pública (2.4)
├── routes/              # Endpoints
└── utils/errores.js     # HttpError y respuesta de errores
```

## Convenciones de la API

- Todas las rutas empiezan con `/api`. Respuestas en JSON.
- Rutas privadas: header `Authorization: Bearer <token>` (el token dura 8 h).
- Errores: `{ "error": "mensaje para el usuario", ...extra }`
  - `400` validación. Trae `campos: [{ campo, mensaje }]` o `pendientes: [...]`.
  - `401` sin sesión o sesión vencida → mandar al login.
  - `404` no existe · `409` conflicto (duplicado, orden activa, orden bloqueada).
- Fotos: se sirven en `/uploads/antes/<archivo>` y `/uploads/despues/<archivo>` (la API regresa la URL).

## Endpoints

### Públicos

| Método | Ruta | Descripción |
| :-- | :-- | :-- |
| GET | `/api/salud` | Verifica que el servidor esté arriba |
| POST | `/api/auth/login` | `{ email, password }` → `{ token, usuario }` (RF-01) |
| GET | `/api/verificar/:token` | Certificado público: IMEI enmascarado, sin datos del cliente (RF-12) |

### Privados (requieren token)

| Método | Ruta | Descripción |
| :-- | :-- | :-- |
| GET | `/api/auth/me` | Usuario en sesión |
| GET | `/api/dashboard` | Indicadores + órdenes activas (RF-13) |
| GET | `/api/clientes?telefono=` | Busca cliente por teléfono |
| GET | `/api/clientes/:id` | Cliente con sus dispositivos |
| POST | `/api/clientes` | `{ nombre_completo, telefono, email?, aviso_privacidad: true }` (RF-02). Si el teléfono ya existe: `409` con `cliente` |
| GET | `/api/dispositivos?imei_o_serie=` | Busca dispositivo |
| POST | `/api/dispositivos` | `{ cliente_id, tipo, marca, modelo, color?, imei_o_serie }` (RF-03). `tipo`: celular, tablet, laptop u otro. Si ya existe: `409` con `dispositivo` |
| GET | `/api/dispositivos/:id/historial` | Reparaciones entregadas del equipo (RF-15) |
| GET | `/api/ordenes?q=&estado=` | Lista/búsqueda por folio, cliente, teléfono o IMEI (mín. 3 caracteres) (RF-14) |
| POST | `/api/ordenes` | **multipart/form-data**: `dispositivo_id`, `falla_reportada`, `condicion_fisica`, `accesorios` (JSON o separado por comas), `fotos` (1–5) (RF-04, RF-05) |
| GET | `/api/ordenes/:id` | Expediente completo: cliente, equipo, historial, fotos, piezas, garantía, certificado |
| PATCH | `/api/ordenes/:id/estado-inicial` | Corrige falla, condición o accesorios (solo en Recibido) |
| PATCH | `/api/ordenes/:id/estado` | `{ estado, nota }`: solo el siguiente estado, nota ≥ 5 caracteres (RF-06). Al pasar a `Entregado` regresa también `certificado` con `qr` |
| POST | `/api/ordenes/:id/evidencias` | **multipart**: `tipo` (`antes`/`despues`), `fotos` (máx. 5 por etapa) (RF-07) |
| POST | `/api/ordenes/:id/refacciones` | `{ nombre, tipo, numero_serie? }`; `tipo`: original, compatible o reacondicionada. Solo en Diagnóstico/Reparación (RF-08) |
| DELETE | `/api/ordenes/:id/refacciones/:refaccionId` | Quita una pieza (antes de entregar) |
| PUT | `/api/ordenes/:id/garantia` | `{ dias_garantia, terminos_garantia }` (RF-09) |
| GET | `/api/ordenes/:id/certificado` | Datos para imprimir + `qr` (PNG en data URL) (RF-10, RF-11) |

### Reglas de negocio que aplica el servidor

- Estados: `Recibido → Diagnóstico → Reparación → Pruebas → Entregado`, sin saltos ni retrocesos.
- Folio `RP-AAAA-NNNN`, consecutivo por año, generado dentro de una transacción.
- Un dispositivo no puede tener dos órdenes activas.
- Para pasar a **Entregado** se necesita: ≥1 foto antes, ≥1 foto después, garantía registrada y haber pasado
  por Diagnóstico, Reparación y Pruebas. Si falta algo, responde `400` con la lista `pendientes`.
- Al entregar: se calcula `garantia_fin = fecha_entrega + dias_garantia`, se emite el certificado con
  token UUID v4 y la orden queda **bloqueada** (no se pueden cambiar fotos, piezas ni garantía).
- El QR apunta a `PUBLIC_BASE_URL/verificar/<token>`, es decir, a la **página del frontend**,
  que debe llamar a `GET /api/verificar/:token` para obtener los datos.
