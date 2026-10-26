# 🛠️ InfoFIX — Plataforma de Trazabilidad, Órdenes y Certificación QR

> **Sistema Web de Gestión de Servicio Técnico, Evidencia Fotográfica Forense y Validación Pública con Código QR para Dispositivos Electrónicos.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Standard](https://img.shields.io/badge/Standard-ANSI%2FIEEE%20830--1998-blue.svg)](file:///docs_referencia/Act6_Especificacion_Requerimientos.md)
[![Team](https://img.shields.io/badge/Team-InfoPapus%20CUCEI-navy.svg)](#-equipo-y-gobernanza-infopapus)
[![Git Flow](https://img.shields.io/badge/Branch-develop%20%7C%20main-green.svg)](#-estrategia-de-ramas-y-flujo-git)

---

## 📌 Contexto y Propósito

En los talleres tradicionales de reparación de celulares y computadoras, los clientes suelen recibir una simple nota de papel sin trazabilidad del estado real del equipo, sin fotos del estado en que se recibió ni claridad sobre piezas reemplazadas o términos de garantía.

**InfoFIX** resuelve esta problemática de desconfianza mediante una plataforma web que:
1. Registra cada orden de servicio con un folio único e inalterable (`RP-AAAA-NNNN`).
2. Implementa una **máquina de estados estricta e inmutable**:
   $$\text{Recibido} \longrightarrow \text{Diagnóstico} \longrightarrow \text{Reparación} \longrightarrow \text{Pruebas} \longrightarrow \text{Entregado}$$
3. Registra **evidencia fotográfica forense** obligatoria de recepción ("antes") y entrega ("después").
4. Genera al entregar el equipo un **Certificado Digital con Código QR** respaldado por un token criptográfico no secuencial **UUID v4**, permitiendo a cualquier cliente o comprador escanear el QR y verificar en tiempo real la autenticidad de la reparación, vigencia de su garantía y piezas sustituidas sin necesidad de crear cuenta ni exponer datos privados.

---

## 🚀 Características Principales del Sistema

* **🔒 Seguridad y Control de Acceso (RF-01):** Autenticación para técnicos y administradores con contraseñas encriptadas mediante `bcrypt` ($\ge 10$ rondas) y sesiones protegidas con tokens JWT de 8 horas.
* **📱 Registro Unificado de Clientes y Dispositivos (RF-02, RF-03, RF-04):** Validación rigurosa de IMEI de 15 dígitos numéricos únicos y folios anuales correlativos.
* **📸 Evidencia Fotográfica Forense (RF-05, RF-07):** Recepción de fotografías antes y después mediante `multer` con límite estricto de **5 imágenes por fase**, tamaño máximo de **5 MB** y validación MIME (`image/jpeg`, `image/png`).
* **⏱️ Trazabilidad y Línea del Tiempo (RF-06):** Avance de estados strictly secuencial con notas técnicas descriptivas obligatorias ($\ge 5$ caracteres).
* **🧾 Refacciones y Cálculo de Garantía (RF-08, RF-09):** Catálogo de componentes sustituidos y cálculo automático de vigencia:
  $$\text{fecha\_fin} = \text{fecha\_entrega} + \text{días\_garantía}$$
* **🔏 Certificación Criptográfica y Código QR (RF-10, RF-11):** Emisión de identificador único de 128 bits (`crypto.randomUUID()`) y renderizado de código QR vectorial / Base64.
* **🌐 Consulta Pública Segura (RF-12):** Endpoint abierto de verificación con enmascaramiento de privacidad de IMEI (`***********1234`) y anonimización de datos sensibles del cliente.
* **📊 Tablero Operativo y Reportes (RF-13, RF-14, RF-15):** Dashboard de indicadores en tiempo real (equipos en proceso, listos, entregados y garantías activas/vencidas) e impresión física/PDF del certificado (`@media print`).

---

## 📁 Arquitectura y Estructura del Monorepo

El repositorio sigue una arquitectura modular en monorepo para facilitar el desarrollo coordinado entre backend, frontend y base de datos:

```text
InfoFix/
├── .github/
│   └── pull_request_template.md        # Plantilla oficial de Pull Request con checklist
├── database/
│   ├── schema.sql                      # Scripts DDL (Tablas, llaves foráneas, checks, índices)
│   └── seed.sql                        # Semilla de datos para pruebas y demo técnica
├── backend/
│   ├── .env.example                    # Plantilla de variables de entorno (PORT, JWT, DB, etc.)
│   ├── uploads/
│   │   ├── antes/                      # Evidencias fotográficas de recepción (RF-05)
│   │   └── despues/                    # Evidencias fotográficas de entrega (RF-07)
│   └── src/
│       ├── config/                     # Conexión a BD y variables de entorno
│       ├── controllers/                # Controladores REST por módulo
│       ├── middlewares/                # Auth JWT, Multer, validador de estados
│       ├── routes/                     # Definición de rutas públicas y protegidas
│       ├── utils/                      # Generador QR, UUID v4, enmascaramiento
│       └── server.js                   # Punto de entrada HTTP de la API Express
├── frontend/
│   ├── public/                         # Assets estáticos, logos e íconos
│   └── src/                            # Componentes, vistas (SPA), estilos (Tailwind/CSS)
├── docs_referencia/                    # Documentos IEEE 830, WBS y blueprint de diseño
├── CONTRIBUTING.md                     # Cláusulas de desarrollo, flujo de Git y estándar de código
├── .gitignore                          # Exclusiones de Git (node_modules, .env, fotos reales)
└── README.md                           # Documentación central del proyecto
```

---

## 🌿 Estrategia de Ramas y Flujo Git

Para asegurar la estabilidad del proyecto y evitar sobrescrituras accidentales, seguimos un modelo simplificado de **Git Flow**:

1. **`main` (Producción / Evaluación):** Solo contiene entregas estables y etiquetadas (*releases*). **Nadie hace commits directos a `main`**.
2. **`develop` (Integración):** Rama principal de trabajo colaborativo. Todos los Pull Requests de características se fusionan aquí.
3. **`feature/Txx-nombre-tarea`:** Cada ingeniero crea una rama por tarea técnica asignada en el WBS:
   * Ejemplo: `feature/T02-schema-database`, `feature/T05-login-jwt`, `feature/T11-vistas-clientes`.

### Flujo de Trabajo para el Equipo:
```bash
# 1. Posicionarse en develop y actualizar
git checkout develop
git pull origin develop

# 2. Crear tu rama con el número de tarea
git checkout -b feature/T05-login-jwt

# 3. Realizar cambios, añadir y confirmar con mensaje descriptivo
git add .
git commit -m "feat(auth): implementar inicio de sesion y JWT (T05)"

# 4. Subir la rama a GitHub
git push -u origin feature/T05-login-jwt

# 5. Abrir Pull Request hacia develop en GitHub
```

---

## 📝 Cláusulas y Estándar de Código (Heredado de DD)

*Para más detalles, consulta el documento completo [CONTRIBUTING.md](file:///C:/Users/atosa/Documents/InfoFix/CONTRIBUTING.md).*

Todo archivo y función nueva en el proyecto debe respetar tres reglas indispensables:

### 1. Cabecera Informativa en Cada Archivo
```javascript
/**
 * @file ordenes.controller.js
 * @description Gestión de apertura y actualización de órdenes de servicio técnico.
 * @task T12, T13 (RF-04, RF-06)
 * @author María Fernanda González Rodríguez
 */
```

### 2. Documentación JSDoc en Cada Función
```javascript
/**
 * Transiciona el estado de una orden validando la secuencia lógica y nota obligatoria.
 * 
 * @param {number} ordenId - ID numérico de la orden a actualizar.
 * @param {string} nuevoEstado - Estado destino ('Diagnóstico', 'Reparación', 'Pruebas', 'Entregado').
 * @param {string} notaTecnica - Explicación técnica del cambio (mínimo 5 caracteres).
 * @returns {Promise<Object>} Orden actualizada con su nuevo hito en el historial.
 * @throws {Error} Si el estado destino no es el sucesor inmediato o falta la nota.
 */
```

### 3. Comentarios Internos Relevantes
* **No comentar código obvio** (como asignaciones o incrementos elementales).
* **Comentar decisiones críticas:** transacciones atómicas `BEGIN/COMMIT/ROLLBACK`, enmascaramiento criptográfico, redondeos de fechas de garantía y validaciones binarias de Multer.

---

## 👥 Equipo y Gobernanza (InfoPapus)

| Ingeniero | Rol Oficial | Responsabilidad Principal |
| :--- | :--- | :--- |
| **Leonardo Atos Aguilar Nuñez** | Project Manager & DevOps | Arquitectura de ramas, `.gitignore`, PRs, túnel de demo y auditoría de datos (T01, T26, T28). |
| **Mauricio Razón Ramos** | Arquitecto de Base de Datos y QA | Diagrama DER, scripts DDL `schema.sql`, integridad referencial y `seed.sql` (T02, T03). |
| **María Fernanda González Rodríguez** | Lead Backend & Seguridad | API REST Express, Auth JWT/bcrypt, Multer, UUID v4, QR y lógica de negocio (T04, T05, T09, T10, T12, T13, T15-T17, T20, T21, T23). |
| **Yahúm Adair Hernández Martínez** | Lead Frontend & UI/UX | Maquetación responsiva, login, dashboard, detalle de orden, portal móvil QR e impresión (T06, T07, T11, T14, T18, T22, T24, T25). |
| **Marco Yahir Guzmán Gasca** | Lead QA & Testing a Fallos | Matriz de pruebas orientada a fallos, validación de estados y verificación contra el ERS IEEE 830 (T08, T19, T27). |

---

## 🛠️ Requisitos e Instalación

### Requisitos Previos:
* [Node.js](https://nodejs.org/) v18+ (LTS recomendado)
* [Git](https://git-scm.com/)

### Puesta en Marcha Local:
```bash
# 1. Clonar el repositorio
git clone https://github.com/fxq8cww9k7-alt/InfoFix.git
cd InfoFix

# 2. Configurar variables de entorno del Backend
cd backend
copy .env.example .env

# 3. Instalar dependencias e iniciar (cuando estén implementados los módulos)
npm install
npm run dev
```

---

## 📄 Contrato de Requerimientos y Documentos del Proyecto
* 📘 [Especificación de Requerimientos de Software (ERS ANSI/IEEE 830-1998)](file:///docs_referencia/Act6_Especificacion_Requerimientos.md)
* 📋 [Planificación de Proyecto y WBS de 28 Tareas](file:///docs_referencia/Actividad_7_Planificacion_InfoFIX.md)
* 📐 [Blueprint Técnico Maestro de Arquitectura](file:///InfoFIX_Blueprint_Tecnico_Maestro.md)
* 🏛️ [Entrega de Arquitectura de Software](file:///Entrega_Arquitectura_Software_InfoFIX.md)
