# ESPECIFICACIÓN DE INGENIERÍA Y ARQUITECTURA DE SISTEMA: InfoFIX

**Documento Maestro para Agentes de Desarrollo e Ingeniería de Software (Google Antigravity / Cursor / Claude Code) Versión:** 3.0 (Blueprint Técnico Exhaustivo) **Estándar Contractual:** ANSI/IEEE 830-1998 (Especificación de Requerimientos de Software - ERS) **Equipo:** InfoPapus — CUCEI, Universidad de Guadalajara (Octubre - Diciembre 2026)


---

## 1. DIRECTIVA PARA EL AGENTE DE IA (SYSTEM PROMPT DE ARQUITECTURA)

Actúa como un **Principal Software Architect & Lead Full-Stack Engineer**. Tu objetivo es construir, estructurar, validar y desplegar el sistema **InfoFIX**: una plataforma web de trazabilidad operativa, gestión de órdenes de servicio, evidencia fotográfica forense y verificación pública mediante certificados digitales con códigos QR para talleres de reparación de dispositivos electrónicos (celulares, tablets, laptops).


**REGLA DE ORO CONTRACTUAL:** Este proyecto es evaluado bajo un contrato académico estricto (ERS IEEE 830) por la Mtra. Thelma Isabel Morales Ramírez (`thelma.morales3416@academicos.udg.mx`). **NINGUNA regla de negocio, mensaje de error literal, restricción de validación o estado del flujo puede ser omitido, alterado o simplificado.** Tampoco debes agregar alcance extra (*scope creep*) como pasarelas de pago, cobros, cotizaciones financieras o inventario general de almacén.


---

## 2. GOBERNANZA DEL EQUIPO Y RESPONSABILIDADES (WBS)

El proyecto consta de 28 tareas técnicas distribuidas en 8 semanas (05/10/2026 al 27/11/2026, presentación final el 07/12/2026) entre 5 ingenieros:


1. **Leonardo Atos Aguilar Nuñez (Project Manager / DevOps / Integración):** Gestión de GitHub (`main` y `develop`), reglas de protección de ramas, plantillas de PR, `.gitignore`, red de demostración local/túnel (`ngrok`/LAN) y auditoría final de datos de prueba (T01, T26, T28).
1. **Mauricio Razón Ramos (Arquitecto de Base de Datos y QA):** Diseño del Diagrama Entidad-Relación (DER), scripts DDL SQL con restricciones de integridad, llaves foráneas, unicidad (`IMEI`, `Folio`, `UUID`) y semillas de datos (T02, T03).
1. **María Fernanda González Rodríguez (Lead Backend & Seguridad):** Configuración del servidor API REST, autenticación JWT + bcrypt, CRUD de clientes/dispositivos/órdenes, máquina de estados estricta, carga de archivos multimedia (`antes`/`después`), cálculo de garantías, generador UUID v4, motor QR y endpoint público seguro (T04, T05, T09, T10, T12, T13, T15, T16, T17, T20, T21, T23).
1. **Yahúm Adair Hernández Martínez (Lead Frontend & UI/UX):** Maquetación responsiva, pantalla de Login, vistas de Clientes y Equipos, Tablero visual (Dashboard), vista de Detalle de Orden con línea de tiempo, Certificado Imprimible (`@media print`) y Portal Público móvil QR (T06, T07, T11, T14, T18, T22, T24, T25).
1. **Marco Yahir Guzmán Gasca (Lead QA & Testing Orientado a Fallos):** Pruebas de acceso/seguridad, pruebas del flujo de la máquina de estados, inyección de datos inválidos, límites de archivos y validación 100% contra el ERS (T08, T19, T27).


---

## 3. ARQUITECTURA TECNOLÓGICA Y ESTRUCTURA DEL MONOREPO

### 3.1. Stack Tecnológico Definido

- **Backend:** Node.js + Express.js (JavaScript ES6+ o TypeScript).
- **Base de Datos:** Relacional SQL (PostgreSQL / MySQL / SQLite3 para portabilidad en demo local) con soporte estricto de transacciones ACID (`BEGIN`, `COMMIT`, `ROLLBACK`) y `FOREIGN KEY` activadas.
- **Seguridad y Criptografía:**
    - `bcrypt` o `bcryptjs` (mínimo 10 rondas de *salting*) para hashes de contraseñas.
    - `jsonwebtoken` (JWT) para sesiones del personal del taller (expiración recomendada: 8h), enviado vía header `Authorization: Bearer <token>`.
    - `crypto.randomUUID()` (UUID v4 estándar de 128 bits) para los tokens públicos de verificación (inadivinables y no secuenciales).
- **Almacenamiento Multimedia:** `multer` para recepción de archivos `multipart/form-data`. Validación estricta de MIME types (`image/jpeg`, `image/png`) y tamaño máximo de **5 MB (5,242,880 bytes)** por archivo.
- **Generación de QR:** Librería `qrcode` generando Data URLs (Base64 PNG) o SVG de alta resolución apuntando a `https://<dominio>/verificar/<token_uuid>`.
- **Frontend:** React (Vite) o HTML5/JS modular + **Tailwind CSS** o **Bootstrap 5**.
    - **Paleta de Colores (Sección 3.1.1 ERS):** Tonos neutros y fríos (Blanco `#FFFFFF` y Azul Marino `#0F172A` / `#1E3A8A`), Gris (`#475569`) para acciones secundarias, Verde (`#16A34A`) para estados válidos/garantías vigentes, y Rojo (`#DC2626`) para inconsistencias o garantías vencidas.
    - **Tipografía (Sección 3.1.1 ERS):** `Poppins`, `Rubik` o `Nunito` (Google Fonts), textos de `12pt-14pt` y títulos de `20pt-40pt`.

### 3.2. Árbol de Directorios Requerido

infofix/


├── .gitignore                        \# Ignorar node\_modules/, .env, uploads/\* (excepto .gitkeep)


├── README.md                         \# Documentación de instalación, variables .env y scripts


├── database/


│   ├── schema.sql                    \# Script DDL completo (Tablas, Constraints, Índices)


│   └── seed.sql                      \# Datos de prueba para la demostración final (T28)


├── backend/


│   ├── .env.example                  \# PORT, DATABASE\_URL, JWT\_SECRET, PUBLIC\_BASE\_URL


│   ├── package.json


│   ├── uploads/


│   │   ├── antes/                    \# Evidencias de recepción


│   │   └── despues/                  \# Evidencias de salida/entrega


│   └── src/


│       ├── app.js                    \# Configuración de Express, CORS, JSON, carpeta estática /uploads


│       ├── server.js                 \# Punto de entrada HTTP


│       ├── config/


│       │   └── db.js                 \# Pool de conexión SQL y helper de transacciones ACID


│       ├── middlewares/


│       │   ├── auth.middleware.js    \# Verificación de JWT (RF-01)


│       │   ├── upload.middleware.js  \# Multer: filtro JPG/PNG, máx 5MB, límite 5 fotos por etapa (RF-07)


│       │   └── error.middleware.js   \# Manejador centralizado de errores HTTP


│       ├── utils/


│       │   ├── folio.generator.js    \# Generador RP-AAAA-NNNN (RF-04)


│       │   ├── imei.masker.js        \# Enmascarador \*\*\*\*\*\*\*\*\*\*\*1234 (RF-12)


│       │   └── qr.generator.js       \# Generador QR Base64 desde URL pública (RF-11)


│       ├── controllers/


│       │   ├── auth.controller.js


│       │   ├── clientes.controller.js


│       │   ├── dispositivos.controller.js


│       │   ├── ordenes.controller.js


│       │   ├── evidencias.controller.js


│       │   ├── refacciones.controller.js


│       │   ├── dashboard.controller.js


│       │   └── public.controller.js


│       └── routes/


│           ├── auth.routes.js


│           ├── clientes.routes.js


│           ├── dispositivos.routes.js


│           ├── ordenes.routes.js


│           ├── dashboard.routes.js


│           └── public.routes.js


└── frontend/


    ├── package.json


    ├── index.html                    \# Incluye Google Fonts (Poppins/Rubik/Nunito)


    └── src/


        ├── main.jsx


        ├── App.jsx                   \# Rutas privadas (/login, /dashboard, /ordenes/:id) y pública (/verificar/:token)


        ├── services/


        │   └── api.js                \# Cliente HTTP con interceptor JWT y redirección en 401


        ├── context/


        │   └── AuthContext.jsx       \# Estado de sesión del técnico


        ├── components/


        │   ├── Navbar.jsx


        │   ├── StatusBadge.jsx       \# Etiquetas: Recibido, Diagnóstico, Reparación, Pruebas, Entregado


        │   ├── Timeline.jsx          \# Historial cronológico inmutable (RF-06)


        │   ├── PhotoGallery.jsx      \# Galería comparativa Antes vs Después (RF-07)


        │   ├── PartsTable.jsx        \# Tabla de refacciones (RF-08)


        │   └── PrintableCert.jsx     \# Vista de certificado con @media print y QR (RF-10, RF-11)


        └── pages/


            ├── LoginPage.jsx         \# (RF-01)


            ├── DashboardPage.jsx     \# Contadores, buscador y tabla de activas (RF-13, RF-14)


            ├── NewOrderPage.jsx      \# Flujo Cliente -> Dispositivo -> Orden + Foto inicial (RF-02 a RF-05)


            ├── OrderDetailPage.jsx   \# Gestión integral de la orden (RF-06 a RF-11, RF-15)


            └── PublicVerifyPage.jsx  \# Portal público sin login con IMEI oculto (RF-12, RF-15)


---

## 4. ESQUEMA DE BASE DE DATOS RELACIONAL (DDL SQL EXACTO)

El agente de base de datos debe implementar las siguientes tablas garantizando integridad referencial y soporte transaccional:


-- 1. Tabla de Usuarios del Taller (RF-01)


CREATE TABLE usuarios (


    id SERIAL PRIMARY KEY,


    nombre VARCHAR(120) NOT NULL,


    correo VARCHAR(150) NOT NULL UNIQUE,


    password\_hash VARCHAR(255) NOT NULL,


    rol VARCHAR(50) DEFAULT 'TECNICO' NOT NULL,


    activo BOOLEAN DEFAULT TRUE NOT NULL,


    fecha\_registro TIMESTAMP DEFAULT CURRENT\_TIMESTAMP NOT NULL


);


-- 2. Tabla de Clientes (RF-02)


CREATE TABLE clientes (


    id SERIAL PRIMARY KEY,


    nombre\_completo VARCHAR(150) NOT NULL,


    telefono CHAR(10) NOT NULL UNIQUE CHECK (telefono \~ '^\[0-9\]{10}$'),


    correo VARCHAR(150),


    aviso\_privacidad\_aceptado BOOLEAN NOT NULL DEFAULT FALSE CHECK (aviso\_privacidad\_aceptado = TRUE),


    fecha\_registro TIMESTAMP DEFAULT CURRENT\_TIMESTAMP NOT NULL


);


-- 3. Tabla de Dispositivos (RF-03, RF-15)


CREATE TABLE dispositivos (


    id SERIAL PRIMARY KEY,


    cliente\_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,


    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('celular', 'tablet', 'laptop', 'otro')),


    marca VARCHAR(80) NOT NULL,


    modelo VARCHAR(100) NOT NULL,


    color VARCHAR(50) NOT NULL,


    imei\_o\_serie VARCHAR(30) NOT NULL UNIQUE,


    fecha\_registro TIMESTAMP DEFAULT CURRENT\_TIMESTAMP NOT NULL


    -- Nota de validación en Backend:


    -- Si tipo = 'celular', imei\_o\_serie DEBE ser exactamente 15 dígitos numéricos (^\[0-9\]{15}$).


    -- Si tipo != 'celular', imei\_o\_serie DEBE tener entre 4 y 30 caracteres alfanuméricos.


);


-- 4. Tabla de Órdenes de Reparación (RF-04, RF-05, RF-06, RF-09)


CREATE TABLE ordenes (


    id SERIAL PRIMARY KEY,


    folio VARCHAR(15) NOT NULL UNIQUE, -- Formato estricto: RP-AAAA-NNNN (ej. RP-2026-0001)


    dispositivo\_id INTEGER NOT NULL REFERENCES dispositivos(id) ON DELETE RESTRICT,


    usuario\_recepcion\_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,


    estado VARCHAR(20) NOT NULL DEFAULT 'Recibido'


        CHECK (estado IN ('Recibido', 'Diagnóstico', 'Reparación', 'Pruebas', 'Entregado')),


    falla\_reportada TEXT NOT NULL,


    condicion\_fisica TEXT NOT NULL,


    accesorios JSONB NOT NULL DEFAULT '\[\]', -- Ej: \["cargador", "funda", "SIM", "SD", "ninguno", "otros"\]


    estado\_inicial\_bloqueado BOOLEAN NOT NULL DEFAULT FALSE, -- Se vuelve TRUE al pasar a 'Diagnóstico'


    dias\_garantia INTEGER CHECK (dias\_garantia >= 0),


    terminos\_garantia TEXT,


    fecha\_recepcion TIMESTAMP DEFAULT CURRENT\_TIMESTAMP NOT NULL,


    fecha\_inicio\_garantia TIMESTAMP,


    fecha\_vencimiento\_garantia TIMESTAMP,


    fecha\_entrega TIMESTAMP


);


-- 5. Tabla de Historial / Línea de Tiempo de Estados (RF-06)


CREATE TABLE historial\_estados (


    id SERIAL PRIMARY KEY,


    orden\_id INTEGER NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,


    estado\_anterior VARCHAR(20),


    estado\_nuevo VARCHAR(20) NOT NULL


        CHECK (estado\_nuevo IN ('Recibido', 'Diagnóstico', 'Reparación', 'Pruebas', 'Entregado')),


    nota\_tecnica TEXT NOT NULL CHECK (LENGTH(TRIM(nota\_tecnica)) >= 5),


    usuario\_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,


    fecha\_transicion TIMESTAMP DEFAULT CURRENT\_TIMESTAMP NOT NULL


);


-- 6. Tabla de Evidencias Fotográficas (RF-05, RF-07)


CREATE TABLE evidencias (


    id SERIAL PRIMARY KEY,


    orden\_id INTEGER NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,


    etapa VARCHAR(15) NOT NULL CHECK (etapa IN ('antes', 'despues')),


    ruta\_archivo VARCHAR(500) NOT NULL,


    nombre\_original VARCHAR(255) NOT NULL,


    mime\_type VARCHAR(50) NOT NULL CHECK (mime\_type IN ('image/jpeg', 'image/png')),


    tamano\_bytes INTEGER NOT NULL CHECK (tamano\_bytes <= 5242880), -- Máx 5 MB


    fecha\_carga TIMESTAMP DEFAULT CURRENT\_TIMESTAMP NOT NULL


);


-- 7. Tabla de Piezas / Refacciones Reemplazadas (RF-08)


CREATE TABLE refacciones (


    id SERIAL PRIMARY KEY,


    orden\_id INTEGER NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,


    nombre VARCHAR(150) NOT NULL,


    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('Original', 'Compatible', 'Reacondicionada')),


    numero\_serie VARCHAR(100), -- Opcional


    fecha\_registro TIMESTAMP DEFAULT CURRENT\_TIMESTAMP NOT NULL


);


-- 8. Tabla de Certificados Digitales y QR (RF-10, RF-11, RF-12)


CREATE TABLE certificados (


    id SERIAL PRIMARY KEY,


    orden\_id INTEGER NOT NULL UNIQUE REFERENCES ordenes(id) ON DELETE RESTRICT,


    token\_uuid UUID NOT NULL UNIQUE, -- Generado con UUID v4


    url\_publica VARCHAR(500) NOT NULL,


    qr\_data\_url TEXT NOT NULL, -- Imagen QR en Base64 para renderizado inmediato e impresión


    fecha\_emision TIMESTAMP DEFAULT CURRENT\_TIMESTAMP NOT NULL


);


-- Índices para búsqueda rápida (RF-14, RF-15)


CREATE INDEX idx\_ordenes\_folio ON ordenes(folio);


CREATE INDEX idx\_ordenes\_estado ON ordenes(estado);


CREATE INDEX idx\_clientes\_telefono ON clientes(telefono);


CREATE INDEX idx\_clientes\_nombre ON clientes(nombre\_completo);


CREATE INDEX idx\_dispositivos\_imei ON dispositivos(imei\_o\_serie);


CREATE INDEX idx\_certificados\_token ON certificados(token\_uuid);


---

## 5. ESPECIFICACIÓN EXHAUSTIVA DE REQUISITOS FUNCIONALES (RF-01 A RF-15)

Cada endpoint y pantalla que programes **DEBE** implementar las validaciones y devolver exactamente los mensajes de error definidos a continuación:

### RF-01: Inicio de sesión del personal del taller

- **Endpoint:** `POST /api/auth/login`
- **Entrada:** `{ correo, password }`
- **Validación:** Ambos campos obligatorios; `correo` con estructura sintáctica estándar de email.
- **Lógica:** Verificar existencia del usuario y comparar `password` con `bcrypt.compare()`. Si es válido, firmar token JWT con `{ id, nombre, correo, rol }`.
- **Resultado esperado:** HTTP 200 con token JWT y redirección en frontend a `/dashboard`.
- **Manejo de errores exacto:**
    - Si el correo o contraseña no coinciden: **HTTP 401** con el mensaje exacto: `"Correo o contraseña incorrectos"` (manteniendo limpios los campos sin revelar cuál de los dos falló).
    - Si un usuario sin sesión activa o con token vencido intenta acceder a cualquier ruta privada: **HTTP 401/403** y redirección inmediata a `/login`.

### RF-02: Registro y reutilización de clientes

- **Endpoints:** `POST /api/clientes`, `GET /api/clientes/buscar?telefono=...`
- **Entrada:** `{ nombre_completo, telefono, correo (opcional), aviso_privacidad_aceptado }`
- **Validaciones:**
    1. `nombre_completo` no vacío.
    1. `telefono` debe contener **exactamente 10 dígitos numéricos** (`^[0-9]{10}$`).
    1. `correo` (si se ingresa) debe tener formato de email válido.
    1. `aviso_privacidad_aceptado` debe ser `true` obligatoriamente.
- **Lógica:** Antes de crear, consultar si el `telefono` ya existe. Si existe, retornar los datos del cliente existente para seleccionarlo de inmediato; si no, insertar nuevo registro.
- **Manejo de errores exacto:** Si falta algún dato obligatorio, el teléfono no tiene 10 dígitos o no se marca el aviso de privacidad, rechazar con **HTTP 400** y mensaje específico (ej. `"El número de teléfono debe contener exactamente 10 dígitos"`).

### RF-03: Registro y recuperación de dispositivos

- **Endpoints:** `POST /api/dispositivos`, `GET /api/dispositivos/buscar?imei_o_serie=...`
- **Entrada:** `{ cliente_id, tipo, marca, modelo, color, imei_o_serie }`
- **Validaciones:**
    - `tipo` en `['celular', 'tablet', 'laptop', 'otro']`.
    - Si `tipo === 'celular'`: validar obligatoriamente que `imei_o_serie` tenga **exactamente 15 dígitos numéricos** (`^[0-9]{15}$`).
    - Si `tipo !== 'celular'`: validar que `imei_o_serie` tenga **entre 4 y 30 caracteres alfanuméricos** (`^[a-zA-Z0-9-]{4,30}$`).
- **Lógica:** Consultar si `imei_o_serie` ya existe en la BD. Si ya existe, recuperar sus datos y su historial (RF-15) para asociarle una nueva orden; si no existe, crearlo vinculado a `cliente_id`.
- **Manejo de errores exacto:** Si es celular y el IMEI no cumple: **HTTP 400** con el mensaje exacto: `"El IMEI debe contener exactamente 15 dígitos numéricos"`.

### RF-04 y RF-05: Creación de orden de reparación y registro del estado inicial

- **Endpoint:** `POST /api/ordenes` (recibe `multipart/form-data` para crear la orden junto con su estado inicial y al menos 1 foto de entrada en una sola transacción, o en paso atómico inmediato).
- **Entrada:** `dispositivo_id`, `falla_reportada`, `condicion_fisica`, `accesorios` (array/JSON: cargador, funda, tarjeta SIM, memoria SD, ninguno u otros), y `fotos_antes` (mínimo 1 imagen JPG/PNG).
- **Validaciones previas:**
    1. Verificar que el `dispositivo_id` exista y pertenezca a un cliente válido.
    1. Verificar que el dispositivo **NO tenga otra orden activa en curso** (es decir, una orden cuyo estado sea `'Recibido'`, `'Diagnóstico'`, `'Reparación'` o `'Pruebas'`).
    1. Comprobar que `falla_reportada` y `condicion_fisica` contengan texto y que exista **al menos 1 fotografía válida** de etapa `'antes'`.
- **Generación de Folio Institucional:** Generar automáticamente el folio con formato `RP-AAAA-NNNN` (donde `AAAA` es el año en curso, ej. `2026`, y `NNNN` el consecutivo anual con *zero-padding* a 4 dígitos: `RP-2026-0001`, `RP-2026-0002`, etc.).
- **Procesamiento:** Crear la orden en estado `'Recibido'`, registrar el primer evento en `historial_estados` y guardar las fotos bajo la etapa `'antes'`.
- **Manejo de errores exacto:**
    - Si el dispositivo ya tiene una orden activa: **HTTP 409/400** con el mensaje exacto: `"El dispositivo ya cuenta con una orden activa en proceso (Folio: [Folio_Existente])"`.
    - Si falta la falla reportada o la foto inicial: **HTTP 400** con el mensaje exacto: `"Debe describir la falla reportada y adjuntar al menos una fotografía del estado inicial del dispositivo"`.
    - **Regla de inmutabilidad inicial:** Una vez que la orden avanza al estado `'Diagnóstico'`, los datos del estado inicial (`falla_reportada`, `condicion_fisica`, `accesorios` y fotos `'antes'`) quedan **bloqueados para edición** (`estado_inicial_bloqueado = true`).

### RF-06: Línea de tiempo y máquina de estados estricta

- **Endpoint:** `PATCH /api/ordenes/:id/estado`
- **Entrada:** `{ nuevo_estado, nota_tecnica }`
- **Secuencia Lineal Inviolable:** `Recibido` $\rightarrow$ `Diagnóstico` $\rightarrow$ `Reparación` $\rightarrow$ `Pruebas` $\rightarrow$ `Entregado`
- **Mapa de Transiciones Permitidas:**
    - De `'Recibido'` $\rightarrow$ solo puede pasar a `'Diagnóstico'`.
    - De `'Diagnóstico'` $\rightarrow$ solo puede pasar a `'Reparación'`.
    - De `'Reparación'` $\rightarrow$ solo puede pasar a `'Pruebas'`.
    - De `'Pruebas'` $\rightarrow$ solo puede pasar a `'Entregado'` (sujeto a las validaciones de cierre de RF-09 y RF-10).
    - De `'Entregado'` $\rightarrow$ **Estado terminal inmutable** (no permite ninguna transición).
- **Validación de Nota Técnica:** `nota_tecnica` es obligatoria y debe tener **al menos 5 caracteres**.
- **Manejo de errores exacto:**
    - Si la nota está vacía o tiene menos de 5 caracteres: **HTTP 400** con el mensaje exacto: `"Debe ingresar una nota descriptiva para cambiar el estado"`.
    - Si se intenta saltar una etapa o retroceder a un estado anterior: **HTTP 400** rechazando la operación e informando que el flujo debe seguir la secuencia establecida.

### RF-07: Carga de evidencias fotográficas (Antes y Después)

- **Endpoint:** `POST /api/ordenes/:id/evidencias`
- **Entrada:** Archivo `foto` (`multipart/form-data`) y campo `etapa` (`'antes'` o `'despues'`).
- **Validaciones estrictas:**
    1. Extensión y MIME type permitidos únicamente: **JPG, JPEG o PNG** (`image/jpeg`, `image/png`).
    1. Tamaño máximo por archivo: **5 MB (5,242,880 bytes)**.
    1. Límite de cantidad: Máximo **5 fotografías para la etapa `'antes'`** y máximo **5 fotografías para la etapa `'despues'`** por orden.
    1. Si la orden está en estado `'Entregado'`, **bloquear** cualquier subida, eliminación o sustitución de fotografías.
    1. Si la orden ya pasó de `'Recibido'` (está en `'Diagnóstico'` o superior), no permitir alterar fotos de la etapa `'antes'`.
- **Manejo de errores exacto:**
    - Formato inválido o mayor a 5 MB: **HTTP 400** con el mensaje exacto: `"Formato no válido o tamaño excedido (JPG o PNG)"`.
    - Más de 5 fotos en la misma etapa: **HTTP 400** con el mensaje exacto: `"Límite de 5 fotografías alcanzado para esta etapa"`.

### RF-08: Registro de piezas reemplazadas

- **Endpoint:** `POST /api/ordenes/:id/refacciones` (y `DELETE /api/ordenes/:id/refacciones/:piezaId` antes de entregarse).
- **Disponibilidad:** Habilitado cuando la orden está en etapa de `'Diagnóstico'`, `'Reparación'` o `'Pruebas'`. **Totalmente bloqueado** cuando el estado es `'Entregado'`.
- **Entrada:** `{ nombre, tipo, numero_serie (opcional) }`
- **Validaciones:** `nombre` no vacío; `tipo` debe ser estrictamente uno de: `'Original'`, `'Compatible'` o `'Reacondicionada'`.
- **Manejo de errores exacto:** Si falta nombre o tipo: **HTTP 400** con el mensaje exacto: `"El nombre y tipo de la refacción son obligatorios"`.

### RF-09: Registro y cálculo de garantía

- **Endpoint:** `PUT /api/ordenes/:id/garantia`
- **Entrada:** `{ dias_garantia, terminos_garantia }`
- **Validaciones:** `dias_garantia` debe ser un número entero $\ge 0$ (ej. 0, 30, 60, 90); `terminos_garantia` no puede estar vacío.
- **Cálculo de vigencia al entregar:** Cuando la orden pasa al estado `'Entregado'`, el sistema toma la fecha/hora exacta del servidor como `fecha_inicio_garantia` (`fecha_entrega`) y calcula: $$\text{fecha\_vencimiento\_garantia} = \text{fecha\_entrega} + \text{dias\_garantia (en días naturales)}$$
- **Evaluación en tiempo real:** En cualquier consulta posterior, si `fecha_actual <= fecha_vencimiento_garantia`, el estado de la garantía es **`Vigente`** (indicador verde); si `fecha_actual > fecha_vencimiento_garantia` (o si `dias_garantia === 0`), es **`Vencida`** (indicador rojo).
- **Manejo de errores exacto:** Si el técnico intenta pasar la orden a `'Entregado'` sin haber guardado previamente los días y términos de garantía: **HTTP 400** con el mensaje exacto: `"Debe registrar los términos y días de garantía antes de finalizar y entregar la orden"`.

### RF-10 y RF-11: Generación transaccional del Certificado Digital y Código QR

- **Disparador:** Se ejecuta automáticamente dentro de una **transacción ACID de base de datos (`BEGIN ... COMMIT`)** cuando el técnico solicita cambiar el estado de `'Pruebas'` a `'Entregado'` (`PATCH /api/ordenes/:id/estado`).
- **Checklist de Validación de Cierre (Los 4 requisitos obligatorios):**
    1. La orden cuenta con al menos **1 fotografía de recepción (`'antes'`)**.
    1. La orden cuenta con al menos **1 fotografía de entrega (`'despues'`)**.
    1. La orden tiene registrados los **días y términos de garantía** (`dias_garantia IS NOT NULL` y `terminos_garantia != ''`).
    1. La orden ha transitado por las fases de `'Diagnóstico'`, `'Reparación'` y `'Pruebas'` (se encuentra actualmente en `'Pruebas'`).
- **Procesamiento Transaccional (RNF-01 Fiabilidad):**
    1. Si falla cualquiera de las 4 validaciones, devolver **HTTP 400** con la lista puntual de los elementos pendientes y **NO** cambiar el estado a `'Entregado'`.
    1. Generar `token_uuid = crypto.randomUUID()`.
    1. Construir la URL pública: `${PUBLIC_BASE_URL}/verificar/${token_uuid}`.
    1. Generar la matriz gráfica del código QR en alta resolución (`qrcode.toDataURL(url_publica, { errorCorrectionLevel: 'H', width: 300 })`).
    1. Actualizar `ordenes` (`estado = 'Entregado'`, `fecha_entrega = NOW()`, `fecha_inicio_garantia = NOW()`, `fecha_vencimiento_garantia = NOW() + dias_garantia`).
    1. Insertar el evento final en `historial_estados`.
    1. Insertar el certificado en la tabla `certificados`.
    1. Hacer `COMMIT`. Si ocurre cualquier error en los pasos 2 al 7, ejecutar `ROLLBACK` para que jamás exista una orden entregada sin certificado ni un certificado a medias.
- **Vista Imprimible:** El frontend debe ofrecer una vista limpia de certificado formal con estilos `@media print` que oculten botones de navegación y muestren el código QR en la esquina superior junto con el resumen completo de la orden, lista para imprimir o guardar como PDF.

### RF-12: Página pública de verificación (Privacidad por Diseño - LFPDPPP)

- **Endpoint Público (Sin JWT):** `GET /api/public/verificar/:token`
- **Ruta Frontend:** `/verificar/:token`
- **Validación:** Verificar que `:token` tenga formato UUID y exista en la tabla `certificados` asociado a una orden en estado `'Entregado'`.
- **Reglas de Privacidad Inviolables (RNF-02 Seguridad):**
    1. **PROHIBIDO** enviar en el JSON de respuesta o mostrar en pantalla el `nombre_completo`, `telefono` o `correo` del cliente.
    1. **ENMASCARAMIENTO DE IMEI/SERIE:** El backend debe transformar `imei_o_serie` antes de enviarlo al cliente público, mostrando **únicamente los últimos 4 caracteres** precedidos por asteriscos (ej. `"***********1234"`).
- **Datos que SÍ devuelve y muestra la página pública:**
    - Folio de la orden (`RP-AAAA-NNNN`), fecha de recepción y fecha de entrega.
    - Tipo de dispositivo, marca, modelo, color e IMEI/serie enmascarado (`***********1234`).
    - Falla reportada y condición física inicial.
    - Línea de tiempo de estados con sus fechas y notas técnicas.
    - Tabla de piezas/refacciones sustituidas (nombre, tipo, serie).
    - Galería fotográfica comparativa (`antes` y `después`).
    - Términos de la garantía, fecha de vencimiento e indicador visual dinámico: **`Vigente`** (verde) o **`Vencida`** (rojo).
    - Contador histórico de reparaciones certificadas de ese dispositivo (RF-15).
- **Manejo de errores exacto:** Si el token no existe o es inválido: **HTTP 404** y la página muestra el aviso claro: `"Certificado no encontrado. Verifique que el enlace o código QR corresponda a un certificado emitido por el taller"`.

### RF-13: Dashboard básico del taller

- **Endpoint:** `GET /api/dashboard` (Protegido con JWT)
- **Procesamiento en tiempo real:**
    1. **Contador 1 - Reparaciones Activas:** Total de órdenes en estado `'Recibido'`, `'Diagnóstico'`, `'Reparación'` o `'Pruebas'`.
    1. **Contador 2 - Reparaciones Terminadas:** Total de órdenes en estado `'Entregado'`.
    1. **Contador 3 - Garantías Vigentes:** Total de órdenes en estado `'Entregado'` donde `fecha_vencimiento_garantia >= NOW()`.
    1. **Tabla de Órdenes Activas:** Listado de órdenes en curso ordenadas cronológicamente de la más reciente a la más antigua (`ORDER BY fecha_recepcion DESC`), mostrando: `folio`, `nombre_completo` del cliente, `marca + modelo` del dispositivo, `estado` actual, `fecha_recepcion` y botón `"Ver detalle"`.
- **Manejo de errores exacto:** Si no hay registros, los 3 contadores muestran `0` y la tabla muestra el mensaje exacto: `"No hay órdenes de reparación activas registradas"`.

### RF-14: Búsqueda y filtrado de órdenes

- **Endpoint:** `GET /api/ordenes/buscar?q=<termino>` (Protegido con JWT)
- **Validación:** El término de búsqueda `q` debe contener **al menos 3 caracteres** (`q.trim().length >= 3`) antes de ejecutar la consulta.
- **Lógica:** Búsqueda insensible a mayúsculas/minúsculas (`ILIKE '%termino%'` o `LOWER() LIKE`) que busque coincidencias parciales o exactas en:
    1. `ordenes.folio`
    1. `clientes.nombre_completo`
    1. `clientes.telefono`
    1. `dispositivos.imei_o_serie`
- **Manejo de errores exacto:** Si no hay coincidencias, mostrar el mensaje exacto: `"No se encontraron órdenes de reparación que coincidan con el criterio ingresado"` junto con un botón para limpiar el filtro.

### RF-15: Historial acumulado del dispositivo

- **Endpoints:** Incluido en `GET /api/dispositivos/:id/historial` (interno) y en `GET /api/public/verificar/:token` (público).
- **Lógica:** Buscar todas las órdenes en estado `'Entregado'` asociadas al mismo `imei_o_serie` del dispositivo, ordenadas por `fecha_entrega DESC`.
- **Diferenciación de vistas:**
    - **En el Panel Interno del Taller:** Mostrar el listado cronológico completo de reparaciones anteriores con sus folios, fechas de entrega, fallas previas y enlaces directos para abrir cada expediente pasado.
    - **En la Página Pública (QR):** Mostrar únicamente un contador e indicador de confianza con el número total de servicios certificados registrados en el taller para ese equipo.
- **Manejo de errores / caso base exacto:** Si el equipo no tiene reparaciones previas entregadas (o es la primera vez), mostrar la leyenda exacta: `"Primera reparación certificada registrada para este equipo"`.


---

## 6. REQUISITOS NO FUNCIONALES (RNF) Y SEGURIDAD

1. **Rendimiento (RNF-3.3.1):** Soportar sin degradación al menos 5 usuarios concurrentes del taller y 10 consultas públicas simultáneas.
1. **Seguridad (RNF-3.3.2):**
    - Uso de HTTPS en despliegue o túnel seguro (`ngrok` HTTPS) para la demostración.
    - Todas las credenciales (`DATABASE_URL`, `JWT_SECRET`) deben leerse desde variables de entorno (`.env`) y jamás subirse al repositorio.
    - Protección contra SQL Injection mediante consultas parametrizadas (*Prepared Statements*).
1. **Fiabilidad (RNF-3.3.3):** Generación atómica del certificado y cierre de orden mediante transacciones de base de datos.
1. **Portabilidad (RNF-3.3.6):** Interfaz 100% responsiva compatible con Chrome, Safari, Firefox y Edge tanto en escritorio como en Android e iOS sin instalar apps nativas.


---

## 7. PLAN DE EJECUCIÓN PASO A PASO PARA EL AGENTE (ORDEN DE CONSTRUCCIÓN)

Cuando inicies la construcción del proyecto en el workspace, ejecuta las tareas respetando la **Ruta Crítica** del proyecto:


1. **Fase 1 (Base y Datos - T01 a T04):** Inicializar monorepo, `.gitignore`, crear `database/schema.sql`, configurar conexión a base de datos y servidor Express base.
1. **Fase 2 (Autenticación - T05 a T08):** Implementar login con `bcrypt` y `jsonwebtoken`, middleware de protección JWT y pantalla `LoginPage.jsx`.
1. **Fase 3 (Núcleo Operativo - T09 a T14):** Implementar APIs y pantallas de Clientes (validación 10 dígitos + aviso privacidad), Dispositivos (validación IMEI 15 dígitos), Apertura de Órdenes (`RP-AAAA-NNNN` + bloqueo de orden duplicada activa), Máquina de Estados lineal (`Recibido -> Diagnóstico -> Reparación -> Pruebas -> Entregado`) y `DashboardPage.jsx`.
1. **Fase 4 (Evidencias, Refacciones y Garantías - T15 a T19):** Configurar `multer` para fotos `antes` y `despues` (máx 5MB, máx 5 fotos por etapa), CRUD de refacciones (`Original`, `Compatible`, `Reacondicionada`), registro/cálculo de garantía y vista `OrderDetailPage.jsx`.
1. **Fase 5 (Certificado Digital, QR y Portal Público - T20 a T25):** Programar el cierre transaccional de la orden, generación de `UUID v4`, creación de código QR, vista imprimible (`PrintableCert.jsx`), endpoint público con enmascaramiento de IMEI (`***********1234`), `PublicVerifyPage.jsx` y buscador global (`RF-14`).
1. **Fase 6 (Semillas y Pruebas E2E - T26 a T28):** Crear script `database/seed.sql` con usuarios técnicos de prueba, clientes, dispositivos y órdenes en distintos estados (incluyendo órdenes entregadas con QR funcional) para la demostración final ante la docente.

