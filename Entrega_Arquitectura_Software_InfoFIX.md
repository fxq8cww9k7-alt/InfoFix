# ACTIVIDAD: ARQUITECTURA DE SOFTWARE — SISTEMA InfoFIX
**Materia:** Ingeniería de Software  
**Institución:** Centro Universitario de Ciencias Exactas e Ingenierías (CUCEI) – Universidad de Guadalajara  
**Asesora / Docente:** Mtra. Thelma Isabel Morales Ramírez  
**Equipo:** InfoPapus  
**Integrantes:**
- Leonardo Atos Aguilar Nuñez (Project Manager / DevOps / Integración)
- María Fernanda González Rodríguez (Lead Backend & Seguridad)
- Yahúm Adair Hernández Martínez (Lead Frontend & UI/UX)
- Mauricio Razón Ramos (Arquitecto de Base de Datos y QA)
- Marco Yahir Guzmán Gasca (Lead QA & Testing de Software)

**Fecha:** Octubre 2026  

---

## CONTEXTO DEL PROYECTO
**InfoFIX** es una plataforma web de trazabilidad operativa, gestión de órdenes de servicio técnico, evidencia fotográfica forense y certificación digital pública mediante códigos QR para talleres de reparación de dispositivos electrónicos (celulares, tablets y laptops). El sistema opera bajo un contrato estricto de 15 Requisitos Funcionales (RF-01 a RF-15) bajo el estándar ANSI/IEEE 830-1998, sin funciones de comercio exterior o inventarios complejos.

---

## PASO 1: IDENTIFICAR LOS BLOQUES PRINCIPALES
El sistema se descompone en **4 bloques arquitectónicos fundamentales**:

1. **Bloque 1: Capa de Presentación (Frontend SPA):** Módulo encargado de la interacción con los usuarios del sistema (técnicos del taller y clientes finales), captura de datos, visualización de interfaces y renderizado responsivo.
2. **Bloque 2: Capa de Lógica de Negocio y Control (API RESTful):** Núcleo de procesamiento del sistema encargado de la orquestación operativa, autenticación, control de estados de reparación, validación de reglas de negocio y sanitización de datos.
3. **Bloque 3: Módulo de Servicios de Soporte (Multimedia y Criptografía):** Conjunto de utilidades transversales especializadas en el manejo de archivos binarios (evidencias fotográficas), generación de identificadores criptográficos únicos (UUID v4) y renderizado de códigos QR.
4. **Bloque 4: Capa de Persistencia y Datos (RDBMS y File Storage):** Subsistema encargado del almacenamiento seguro, estructurado y permanente de los datos del negocio con soporte transaccional ACID, así como el repositorio físico de archivos en disco.

---

## PASO 2: IDENTIFICAR SUBCOMPONENTES DE CADA BLOQUE

| Bloque Principal | Subcomponentes (2–5) | Función Breve | Requisito ERS |
| :--- | :--- | :--- | :--- |
| **B1. Capa de Presentación (Frontend)** | **1.1 Módulo de Acceso y Sesión** | Gestiona el formulario de login y la protección de vistas privadas mediante interceptores JWT. | RF-01 |
| | **1.2 Módulo de Recepción y Catálogos** | Formularios para registro de clientes, validación de IMEI (15 dígitos) y apertura de órdenes (`RP-AAAA-NNNN`). | RF-02, RF-03, RF-04 |
| | **1.3 Tablero y Línea de Tiempo** | Dashboard de indicadores operativos y visualizador cronológico de hitos inmutables de la orden. | RF-06, RF-13, RF-14 |
| | **1.4 Certificado Imprimible** | Vista con estilos de impresión física/PDF (`@media print`) que integra la información de entrega y el código QR. | RF-10, RF-11 |
| | **1.5 Portal Público QR** | Interfaz web móvil de acceso abierto (sin login) para consulta de garantía y evidencias fotográficas. | RF-12, RF-15 |
| **B2. Capa de Lógica de Negocio (Backend API)** | **2.1 Controlador de Seguridad (Auth)** | Autenticación de credenciales con hashing `bcrypt` y firma/verificación de tokens JWT (8h). | RF-01 |
| | **2.2 Motor de Máquina de Estados** | Controla la transición estrictamente lineal: *Recibido -> Diagnóstico -> Reparación -> Pruebas -> Entregado* con nota obligatoria $\ge 5$ caracteres. | RF-06 |
| | **2.3 Gestor de Órdenes y Garantías** | Administración de refacciones sustituidas y cálculo automático de vigencia de garantía (`fecha_fin = fecha_entrega + días`). | RF-08, RF-09 |
| | **2.4 Controlador de Consulta Pública** | Filtro de privacidad: enmascara IMEI (`***********1234`) y purga datos de contacto del cliente. | RF-12 |
| **B3. Servicios Multimedia y Criptografía** | **3.1 Middleware Multer (Evidencias)** | Validación de tipo MIME (JPG/PNG), tamaño máximo de 5 MB y cuota máxima de 5 fotos "antes" y 5 "después". | RF-05, RF-07 |
| | **3.2 Generador Criptográfico UUID v4** | Emisión de tokens de consulta únicos, universales y no correlativos de 128 bits para el certificado. | RF-10 |
| | **3.3 Motor Renderizador QR** | Codificación dinámica de la URL de verificación pública en matrices bidimensionales (PNG Base64). | RF-11 |
| **B4. Capa de Persistencia y Datos** | **4.1 Gestor Transaccional ACID** | Ejecución atómica (`BEGIN`, `COMMIT`, `ROLLBACK`) para garantizar que órdenes, estados y fotos se guarden íntegramente. | Sec. 3.1 ERS |
| | **4.2 Base de Datos Relacional SQL** | Tablas normalizadas (`usuarios`, `clientes`, `dispositivos`, `ordenes`, `evidencias`, `refacciones`, `certificados`) con llaves foráneas e integridad referencial. | RF-02 a RF-10 |
| | **4.3 Almacén Físico de Archivos** | Carpetas del servidor dedicadas al almacenamiento persistente de imágenes clasificadas (`/uploads/antes` y `/uploads/despues`). | RF-07 |

---

## PASO 3 Y PASO 4: DIBUJO DE BLOQUES Y DEFINICIÓN DE COMUNICACIÓN

### Diagrama Arquitectónico de Bloques y Subcomponentes:

```
===================================================================================================
                               CAPA DE PRESENTACIÓN (FRONTEND SPA)
  [1.1 Acceso y Sesión]   [1.2 Recepción/Catálogos]   [1.3 Tablero/Línea de Tiempo]
  [1.4 Certificado Imprimible (@print)]               [1.5 Portal Público QR (Móvil)]
===================================================================================================
       ▲                                        ▲                                  ▲
       │ HTTPS / JSON (JWT)                     │ HTTPS (multipart/form-data)      │ HTTPS / GET
       ▼                                        ▼                                  ▼
===================================================================================================
                         CAPA DE LÓGICA DE NEGOCIO Y CONTROL (API RESTFUL)
  [2.1 Controlador Auth]   [2.2 Máquina de Estados]   [2.3 Gestor Órdenes/Garantías]   [2.4 Controlador Público]
===================================================================================================
            │                                             ▲                                  │
            ▼                                             │                                  ▼
===================================================================================================
                         SERVICIOS DE SOPORTE (MULTIMEDIA Y CRIPTOGRAFÍA)
  [3.1 Middleware Multer]           [3.2 Generador UUID v4]           [3.3 Motor Renderizador QR]
===================================================================================================
            │                                             │                                  │
            ▼ Escritura en Disco                          ▼ Consultas / Transacciones SQL    ▼
===================================================================================================
                           CAPA DE PERSISTENCIA Y DATOS (ALMACENAMIENTO)
  [4.3 Almacén Físico (/uploads)]  <----->  [4.1 Gestor ACID]  <----->  [4.2 Base de Datos SQL Relacional]
===================================================================================================
```

### Definición de Canales de Comunicación (Paso 4):
1. **Presentación <--> Lógica de Negocio (Bidireccional):** Peticiones asíncronas HTTP/HTTPS transportando *payloads* en formato JSON. En módulos protegidos viaja la cabecera `Authorization: Bearer <token_jwt>`. La carga de imágenes utiliza flujos codificados en `multipart/form-data`.
2. **Lógica de Negocio <--> Servicios de Soporte (Interna / Bidireccional):** Comunicación en memoria dentro del runtime del servidor. Multer procesa el flujo de bytes entrante y devuelve el path relativo del archivo; el motor de estados detona la creación del UUID v4 y la generación del código QR.
3. **Lógica de Negocio <--> Capa de Persistencia (Bidireccional):** Conexión persistente mediante *Connection Pool* relacional (SQL), ejecutando consultas estructuradas bajo transacciones atómicas (ACID). Las fotos físicas se escriben en el sistema de archivos del servidor y la base de datos almacena exclusivamente las cadenas de texto con las rutas relativas.

---

## PASO 5: REVISIÓN DE INTEGRIDAD
- **Propósito claro:** Cada bloque cumple una responsabilidad única e intransferible.
- **Sin subcomponentes aislados:** El flujo fotográfico inicia en el formulario (1.2), es filtrado por Multer (3.1), guardado en disco (4.3) y referenciado en SQL (4.2). El cambio a estado "Entregado" genera el UUID (3.2), que genera el QR (3.3), se imprime en el certificado (1.4) y es consultado en el portal público (1.5).
- **Consistencia total:** El diseño satisface los 15 Requisitos Funcionales del ERS sin incurrir en alcance no contratado (*scope creep*).

---

## PASO 6: RELACIÓN CON PATRÓN DE ARQUITECTURA Y TECNOLOGÍA

- **Patrón de Arquitectura:** Arquitectura en Tres Capas (*Three-Tier Architecture*) basada en el modelo desacoplado **Cliente-Servidor (SPA + API REST)**.
- **Tecnología Utilizada:**
  - *Capa de Presentación:* React (Vite) + Tailwind CSS (Single Page Application para escritorio y móvil).
  - *Capa de Negocio y Servicios:* Node.js + Express.js con librerías auxiliares `bcrypt`, `jsonwebtoken`, `multer` y `qrcode`.
  - *Capa de Persistencia:* RDBMS Relacional SQL (PostgreSQL / SQLite3 para demostración local) y sistema de archivos físico local.

### Justificación por Ejes Clave:

1. **Modularidad y Organización:**
   El patrón de tres capas establece fronteras rigurosas entre la interfaz visual, el procesamiento de negocio y el almacenamiento de datos. Esto previene el acoplamiento excesivo y permite que los integrantes del equipo *InfoPapus* desarrollen y prueben sus módulos simultáneamente (Frontend con Yahúm, Backend con María Fernanda, Base de Datos con Mauricio) sin colisiones de dependencias.

2. **Flexibilidad y Adaptabilidad:**
   Al implementar una API RESTful desacoplada, el servidor es agnóstico respecto a la plataforma del cliente. El mismo backend atiende eficientemente la consola administrativa interna del taller ejecutada en un navegador de escritorio y la página pública de verificación escaneada desde cualquier dispositivo móvil mediante el código QR, sin requerir adaptaciones en la base de datos.

3. **Comunicación Eficiente:**
   La interacción entre capas se basa en peticiones HTTP ligeras con intercambio de datos en formato JSON, reduciendo el consumo de ancho de banda. Asimismo, la carga de fotografías forenses se gestiona de forma asíncrona mediante streaming directo a disco con Multer, almacenando en la base de datos únicamente las rutas de los archivos para evitar sobrecargar las consultas transaccionales.

4. **Mantenimiento y Escalabilidad:**
   La separación modular facilita el mantenimiento correctivo y evolutivo. Si el taller experimenta un crecimiento en la cantidad de órdenes de servicio o en el número de consultas simultáneas al portal público, la capa de aplicación o el almacenamiento multimedia pueden escalar independientemente sin necesidad de reescribir la lógica de la base de datos ni los componentes de la interfaz de usuario.

5. **Seguridad e Integración Web:**
   La arquitectura centraliza la seguridad en la capa intermedia: ningún usuario final o cliente tiene conexión directa a la base de datos. El cumplimiento estricto del aviso de privacidad y la protección de datos personales (RF-12) se procesa a nivel de controlador antes de emitir cualquier respuesta a la red pública, enmascarando el IMEI a solo cuatro dígitos y eliminando la información del cliente.

---

## PASO 7: DOCUMENTACIÓN DETALLADA DE BLOQUES Y SUBCOMPONENTES

| Bloque / Subcomponente | Función Detallada | Comunicación con Otros Bloques |
| :--- | :--- | :--- |
| **B1.1 Módulo de Acceso** | Renderiza la pantalla de login, captura usuario/contraseña, almacena el token JWT en memoria y controla la expiración de la sesión. | Envía credenciales al **Controlador Auth (B2.1)** y recibe el token de autorización. |
| **B1.2 Recepción y Catálogos** | Captura datos de clientes, valida longitud de 15 dígitos de IMEI y apertura órdenes con folio `RP-AAAA-NNNN`. | Envía JSON a **Gestor de Órdenes (B2.3)** y envía archivos a **Multer (B3.1)**. |
| **B1.3 Tablero y Línea de Tiempo** | Presenta tarjetas métricas (activas, concluidas, garantías vigentes) y visualiza cronológicamente los estados de la orden. | Solicita métricas a **Gestor de Órdenes (B2.3)** y cambios a **Máquina de Estados (B2.2)**. |
| **B1.4 Certificado Imprimible** | Aplica estilos de hoja física (`@media print`) consolidando resumen técnico, refacciones, póliza de garantía y código QR. | Recibe la imagen QR Base64 del **Motor QR (B3.3)** y datos consolidados de la orden. |
| **B1.5 Portal Público QR** | Página ligera web móvil optimizada que despliega el estatus de garantía y evidencias de antes/después sin login. | Realiza petición GET al **Controlador Público (B2.4)** enviando el token UUID. |
| **B2.1 Controlador Auth** | Valida sintaxis de correo, compara hashes de contraseña mediante `bcrypt.compare()` y emite tokens JWT de 8 horas. | Consulta credenciales en **BD SQL (B4.2)** y responde al **Módulo de Acceso (B1.1)**. |
| **B2.2 Máquina de Estados** | Valida que las transiciones sigan estrictamente la secuencia lineal y exige una nota técnica descriptiva $\ge 5$ caracteres. | Recibe solicitudes del **Tablero (B1.3)**, activa a **UUID (B3.2)** y persiste en **Gestor ACID (B4.1)**. |
| **B2.3 Gestor Órdenes/Garantías** | Registra componentes sustituidos y computa la fecha límite de cobertura en días naturales (`fecha_entrega + días`). | Recibe de **Recepción (B1.2)** y registra transacciones en **BD SQL (B4.2)**. |
| **B2.4 Controlador Público** | Endpoint seguro que busca por UUID v4, enmascara el IMEI (`***********1234`) y purga datos de contacto del cliente. | Consulta la orden en **BD SQL (B4.2)** y entrega el JSON sanitizado a **Portal Público (B1.5)**. |
| **B3.1 Middleware Multer** | Filtra archivos por extensión (JPG/PNG), verifica que pesen $\le 5$ MB y aplica la cuota de 5 fotos antes y 5 después. | Recibe binarios de **Recepción (B1.2)** y escribe los archivos en **Almacén Físico (B4.3)**. |
| **B3.2 Generador UUID v4** | Produce identificadores criptográficamente aleatorios de 128 bits para indexar de manera segura el certificado de salida. | Invocado por **Máquina de Estados (B2.2)**; transfiere el identificador a **Motor QR (B3.3)** y a la BD. |
| **B3.3 Motor Renderizador QR** | Transforma la URL de verificación pública en una imagen bidimensional matriz (Data URL / PNG Base64). | Recibe la URL pública con UUID de **B3.2** y envía el gráfico a **Certificado Imprimible (B1.4)**. |
| **B4.1 Gestor Transaccional ACID** | Coordina la ejecución atómica mediante sentencias `BEGIN`, `COMMIT` y `ROLLBACK` para evitar inconsistencias de datos. | Invocado por los controladores de backend (B2.1, B2.2, B2.3) antes de confirmar cambios. |
| **B4.2 Base de Datos SQL Relacional** | Almacena las tablas de datos asegurando claves foráneas, restricciones de unicidad e integridad referencial. | Provee lectura y escritura estructurada a la capa de lógica mediante conexión relacional. |
| **B4.3 Almacén Físico (/uploads)** | Directorio físico en disco del servidor estructurado en carpetas `/antes` y `/despues` para archivos de imagen. | Recibe archivos binarios de **Multer (B3.1)** y provee acceso estático para renderizado web. |
