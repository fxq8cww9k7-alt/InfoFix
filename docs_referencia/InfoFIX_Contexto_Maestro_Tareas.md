# InfoFIX - Contexto Maestro Completo del Proyecto

## 1. Identidad, Entorno y Marco Contractual

- **Proyecto:** InfoFIX – Sistema de Trazabilidad, Seguimiento y Verificación de Reparación de Celulares.
- **Equipo (InfoPapus - CUCEI, Universidad de Guadalajara):**
    - **Leonardo Atos Aguilar Nuñez:** Líder de Proyecto / Project Manager (repositorio, control Git, red demo, auditoría y revisión final).
    - **María Fernanda González Rodríguez:** Arquitectura Backend, Seguridad y Lógica del Servidor (APIs REST, bcrypt/JWT, máquina de estados, evidencias y motor QR).
    - **Yahúm Adair Hernández Martínez:** Frontend, UI/UX y Documentación (panel del taller, vistas responsivas, certificados imprimibles y portal público).
    - **Mauricio Razón Ramos:** Diseño de Base de Datos y QA (modelo relacional, scripts SQL, casos de prueba).
    - **Marco Yahir Guzmán Gasca:** Testing y Calidad de Software (pruebas de seguridad, validación de reglas de negocio y flujos).
- **Cliente / Evaluador:** Mtra. Thelma Isabel Morales Ramírez (`thelma.morales3416@academicos.udg.mx`).
- **Modelo Contractual:** Cerrado bajo el estándar **ANSI/IEEE 830-1998 (ERS)**. La calificación evalúa el cumplimiento estricto de todos los requerimientos documentados.


---

## 2. Reglas de Negocio Estrictas e Invariables (ERS IEEE 830)

- **Máquina de estados no regresiva (RF-06):** Secuencia lineal obligatoria `Recibido` $\rightarrow$ `Diagnóstico` $\rightarrow$ `Reparación` $\rightarrow$ `Pruebas` $\rightarrow$ `Entregado`. No se admiten retrocesos ni omisión de etapas.
- **Evidencias fotográficas obligatorias (RF-05 y RF-07):** Mínimo una foto de recepción ("antes") para abrir la orden y mínimo una foto de entrega ("después") para marcarla como `Entregado` (máx. 5 MB por imagen).
- **Generación de folios (RF-04):** Identificador institucional con patrón correlativo `RP-AAAA-NNNN` (ej. `RP-2026-0001`).
- **Garantías y Refacciones (RF-08 y RF-09):** Catálogo de componentes (original, compatible o reacondicionada) y cálculo automático de expiración: $\text{fecha\_fin} = \text{fecha\_entrega} + \text{días\_garantía}$.
- **Privacidad y Consulta Pública (RF-10, RF-11 y RF-12):**
    - Desacoplamiento mediante identificador único **UUID v4** en la URL pública (`https://<dominio>/verificar/<token>`).
    - Embeber código QR en el certificado imprimible (`@media print`).
    - Acceso público sin inicio de sesión, con **enmascaramiento del IMEI** (solo últimos 4 dígitos) y omisión total de datos de contacto (conforme a la LFPDPPP y NOM-174-SCFI-2007).


---

## 3. Planificación, Ruta Crítica y Gestión

- **Horizonte temporal:** 8 semanas (del 05/10/2026 al 27/11/2026; presentación final el 07/12/2026).
- **Desglose de Trabajo (WBS):** 28 actividades técnicas detalladas (T01 a T28).
- **Ruta Crítica:** 16 actividades obligatorias (T02, T03, T04, T05, T09, T10, T12, T13, T15, T16, T20, T21, T23, T24, T27, T28).
    - Duración crítica: **36 días hábiles**.
    - Holgura total: **4 días hábiles de amortiguamiento** (sobre el plazo total de 40 días).
- **Plataforma de gestión:** Tablero en Trello compartido con la docente.
- **Estrategia para demostración:** Despliegue en red local con túnel ngrok o LAN para que la docente escanee el QR desde su propio teléfono celular sin depender de internet externo.


---

## 4. Esquema de Base de Datos Mínimo (SQL Relacional)

- `usuarios`: id, nombre, email, password\_hash (bcrypt), rol, fecha\_registro.
- `clientes`: id, nombre\_completo, telefono (10 dígitos), email, aviso\_privacidad, fecha\_registro.
- `dispositivos`: id, cliente\_id, tipo, marca, modelo, imei\_o\_serie (IMEI 15 dígitos), color.
- `ordenes`: id, folio (`RP-AAAA-NNNN`), token\_uuid, dispositivo\_id, usuario\_id, estado, falla\_reportada, condicion\_fisica, accesorios, fecha\_recepcion, fecha\_entrega, dias\_garantji, terminos\_garantia.
- `evidencias`: id, orden\_id, tipo (`antes`/`después`), ruta\_archivo, fecha\_subida.
- `refacciones`: id, orden\_id, nombre, tipo (`original`/`compatible`/`reacondicionada`), numero\_serie.

