# ACTIVIDAD: ARQUITECTURA DE SOFTWARE — InfoFIX
**Equipo:** InfoPapus  
**Materia:** Ingeniería de Software — CUCEI (UDG)  
**Asesora:** Mtra. Thelma Isabel Morales Ramírez  
**Fecha:** Octubre 2026  

---

## 📌 RESUMEN RÁPIDO PARA EL EQUIPO (INFO EN CORTO)

Muchachos, esta actividad es el **plano arquitectónico del sistema InfoFIX**. La maestra Thelma nos pide definir cómo se divide el sistema en bloques grandes, qué partes pequeñas tiene cada bloque, cómo se comunican entre sí y justificar por qué usamos esta arquitectura.

Para que cuadre 100% con los documentos que ya entregamos (ERS IEEE 830, los 15 Requisitos Funcionales y el WBS de las 28 tareas), el sistema queda modelado en una **Arquitectura en Tres Capas (Cliente-Servidor desacoplado con API REST)**:

- **Yahúm (Frontend):** Se encarga de la Capa de Presentación (React/Tailwind) con las pantallas de login, registro de clientes/celulares, tablero, hoja imprimible y la web pública móvil.
- **Fer (Backend):** Se encarga de la Capa de Lógica y Control (Node.js/Express) con los controladores, seguridad JWT, máquina de estados lineal y lógica de garantías.
- **Mauricio (BD):** Se encarga de la Capa de Persistencia (SQL) con las transacciones ACID, llaves foráneas y unicidad (IMEI y Folio).
- **Marco (QA):** Revisa que ningún componente quede aislado y que el flujo cumpla las restricciones (fotos <= 5MB, notas >= 5 letras, IMEI de 15 dígitos).
- **Leonardo (DevOps/PM):** Integra los bloques, rutas y despliegue del monorepo.

---

## PASO 1 Y 2: BLOQUES PRINCIPALES Y SUBCOMPONENTES (2 a 5 por bloque)

| Bloque Principal | Subcomponentes (2–5) | Función Breve | Requisito ERS |
| :--- | :--- | :--- | :--- |
| **1. Capa de Presentación (Frontend SPA)** | **1.1 Módulo de Acceso y Sesión** | Pantalla de login y protección de rutas privadas con token JWT. | RF-01 |
| | **1.2 Módulo de Recepción y Catálogos** | Registro de clientes, validación de IMEI (15 dígitos) y alta de orden con folio `RP-AAAA-NNNN`. | RF-02, RF-03, RF-04 |
| | **1.3 Tablero y Línea de Tiempo** | Dashboard de métricas y visualización del avance cronológico del servicio. | RF-06, RF-13, RF-14 |
| | **1.4 Certificado Imprimible** | Vista formateada para imprimir entrega con sello digital y código QR. | RF-10, RF-11 |
| | **1.5 Portal Público QR** | Vista móvil accesible por token UUID sin login para consultar garantía y fotos. | RF-12, RF-15 |
| **2. Capa de Lógica de Negocio (API REST)** | **2.1 Controlador de Seguridad** | Autenticación con `bcrypt` (hash) y generación/validación de JWT (8h). | RF-01 |
| | **2.2 Motor de Máquina de Estados** | Control estricto del flujo: *Recibido -> Diagnóstico -> Reparación -> Pruebas -> Entregado* con nota técnica >= 5 caracteres. | RF-06 |
| | **2.3 Gestor de Órdenes y Garantías** | Registro de refacciones y cálculo automático de vigencia en días naturales. | RF-08, RF-09 |
| | **2.4 Controlador de Consulta Pública** | Filtro de privacidad: enmascara IMEI (`***********1234`) y oculta datos personales del cliente. | RF-12 |
| **3. Servicios Multimedia y Criptografía** | **3.1 Middleware Multer (Evidencias)** | Valida fotos JPG/PNG, máx 5 MB, con límite de 5 fotos "antes" y 5 "después". | RF-05, RF-07 |
| | **3.2 Generador Criptográfico UUID v4** | Crea el identificador único e inviolable de 128 bits para el certificado. | RF-10 |
| | **3.3 Motor Renderizador QR** | Convierte la URL pública de consulta en imagen bidimensional Base64. | RF-11 |
| **4. Capa de Persistencia y Datos (RDBMS)** | **4.1 Gestor Transaccional ACID** | Garantiza operaciones seguras e indivisibles (`BEGIN`, `COMMIT`, `ROLLBACK`). | Sección 3.1 ERS |
| | **4.2 Base de Datos Relacional SQL** | Tablas con llaves primarias/foráneas, índices y restricciones `UNIQUE` y `NOT NULL`. | RF-02 a RF-10 |
| | **4.3 Almacén Físico de Imágenes** | Directorios de disco local particionados (`/uploads/antes` y `/uploads/despues`). | RF-07 |

---

## PASO 3 Y 4: FLUJO DE INFORMACIÓN Y COMUNICACIÓN

### Flujo simplificado:
```
[Frontend (Técnico / Cliente)]
         ↕ (HTTPS / JSON con JWT o multipart/form-data)
[API REST Backend (Lógica de Negocio y Seguridad)]
         ↕ (Llamada interna a servicios)
[Servicios de Soporte (Multer + UUID v4 + Generador QR)]
         ↕ (Pool de Conexiones SQL / Escritura en Disco)
[Base de Datos Relacional + Carpeta /uploads]
```

### Canales de Comunicación:
1. **Frontend <--> Backend:** Comunicación bidireccional mediante peticiones HTTP/HTTPS (REST). Los datos viajan en JSON. Para subir fotos se usa `multipart/form-data`.
2. **Backend <--> Servicios Soporte:** Comunicación interna para procesar imágenes, generar el token UUID v4 y crear la imagen QR.
3. **Backend <--> Base de Datos:** Comunicación bidireccional mediante consultas SQL con transacciones ACID para asegurar que no se creen registros a medias.
4. **Backend <--> Disco (/uploads):** Almacenamiento físico de imágenes, guardando en la BD solo la ruta relativa.

---

## PASO 5: REVISIÓN DE INTEGRIDAD
- **Propósito claro:** Cada bloque tiene una sola responsabilidad definida.
- **Sin componentes aislados:** Las fotos van del formulario a Multer, de Multer al disco y su ruta a la BD. El cierre de orden detona el UUID, el UUID genera el QR y el QR lleva a la web pública.
- **100% Coherente:** Cumple los 15 RF del ERS sin inventar funciones extra.

---

## PASO 6: PATRÓN DE ARQUITECTURA Y JUSTIFICACIÓN (Para el reporte)

- **Patrón de Arquitectura:** Arquitectura en Tres Capas (*Three-Tier Architecture*) basada en el modelo desacoplado **Cliente-Servidor (SPA + API REST)**.
- **Tecnología Utilizada:**
  - *Presentación:* React + Vite + Tailwind CSS.
  - *Lógica y API:* Node.js + Express.js + Librerías `bcrypt`, `jsonwebtoken`, `multer`, `qrcode`.
  - *Persistencia:* RDBMS Relacional SQL + Almacén de archivos en disco.

### Justificación por Ejes Clave (Formato Thelma):
1. **Modularidad y Organización:** Separa estrictamente la interfaz, la lógica de validación y la base de datos. Permite que el equipo (Frontend, Backend, BD) trabaje en paralelo sin afectar el código de los demás.
2. **Flexibilidad y Adaptabilidad:** Como el backend es una API REST independiente, puede atender tanto la computadora del técnico en el taller como el celular del cliente que escanea el código QR sin tocar la base de datos.
3. **Comunicación Eficiente:** La comunicación usa JSON ligero y peticiones asíncronas. Las fotos no se guardan dentro de la base de datos (lo que alentaría las consultas), sino en disco local, guardando solo la ruta en SQL.
4. **Mantenimiento y Escalabilidad:** Si el taller crece y aumentan los clientes, se puede optimizar o mover el backend o el almacenamiento de imágenes sin tener que reprogramar el frontend.
5. **Seguridad e Integración Web:** El portal público no toca la base de datos directamente; pasa por un filtro de la API que enmascara el IMEI (solo 4 dígitos) y oculta los datos personales del cliente cumpliendo el aviso de privacidad.

---

## PASO 7: DOCUMENTACIÓN DETALLADA (TABLA FINAL)

| Bloque / Subcomponente | Función Detallada | Comunicación con Otros Bloques |
| :--- | :--- | :--- |
| **1.1 Módulo Acceso (Frontend)** | Formulario de login del personal; almacena token JWT y redirige ante credenciales inválidas. | Envía credenciales al **Controlador Auth (2.1)** y recibe token. |
| **1.2 Recepción y Catálogos** | Formulario para registrar cliente, validar IMEI (15 dígitos) y crear orden con folio `RP-AAAA-NNNN`. | Envía datos a **Gestor de Órdenes (2.3)** y fotos a **Multer (3.1)**. |
| **1.3 Tablero y Línea de Tiempo** | Muestra contadores de órdenes y la línea de tiempo con los estados y notas técnicas. | Solicita datos a **Máquina de Estados (2.2)** y **Gestor de Órdenes (2.3)**. |
| **1.4 Certificado Imprimible** | Hoja formateada para impresión física/PDF con datos del equipo, refacciones, garantía y QR. | Recibe la imagen QR generada de **Motor QR (3.3)** y datos finales de la orden. |
| **1.5 Portal Público QR** | Página móvil que muestra fotos y garantía sin necesidad de contraseña. | Consulta por GET a **Controlador Público (2.4)** usando el token UUID. |
| **2.1 Controlador Auth** | Comprueba correo y contraseña con `bcrypt.compare()` y genera JWT con vigencia de 8 horas. | Lee usuarios de la **BD (4.2)** y responde al **Frontend (1.1)**. |
| **2.2 Motor Máquina de Estados** | Obliga a seguir la secuencia *Recibido -> Diagnóstico -> Reparación -> Pruebas -> Entregado* con nota >= 5 letras. | Recibe peticiones de **Tablero (1.3)**, invoca a **UUID (3.2)** y guarda en **BD (4.1)**. |
| **2.3 Gestor de Órdenes y Garantías** | Registra refacciones y calcula fecha límite de garantía (`fecha_fin = entrega + días`). | Recibe de **Recepción (1.2)** y persiste en **BD (4.2)**. |
| **2.4 Controlador Público** | Busca orden por UUID, enmascara IMEI (`***********1234`) y oculta datos personales. | Lee de la **BD (4.2)** y envía JSON limpio a **Portal Público (1.5)**. |
| **3.1 Middleware Multer** | Filtra JPG/PNG, tamaño <= 5MB y cuota de máx 5 fotos antes y 5 después. | Recibe archivos de **Frontend (1.2)** y guarda en **Almacén Físico (4.3)**. |
| **3.2 Generador UUID v4** | Crea token único e impredecible al momento de marcar la orden como "Entregado". | Invocado por **Máquina de Estados (2.2)**; alimenta a **Motor QR (3.3)** y a la BD. |
| **3.3 Motor Renderizador QR** | Convierte la URL del certificado en código QR gráfico (Base64) listo para mostrar. | Recibe URL con UUID de **3.2** y entrega imagen a **Certificado (1.4)**. |
| **4.1 Gestor Transaccional ACID** | Ejecuta bloques `BEGIN/COMMIT/ROLLBACK` para evitar registros incompletos o corruptos. | Invocado por los controladores backend (2.1, 2.2, 2.3). |
| **4.2 Base de Datos SQL** | Tablas normalizadas con llaves foráneas y reglas de unicidad en IMEI y Folio. | Responde a las consultas del backend mediante conexión SQL. |
| **4.3 Almacén Físico (/uploads)** | Carpetas del servidor donde viven los archivos JPG/PNG reales. | Recibe archivos de **Multer (3.1)** y sirve imágenes estáticas al frontend. |
