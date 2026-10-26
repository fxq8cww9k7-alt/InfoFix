# InfoFIX - Contexto y Documentación Maestra del Proyecto

## 1. Identificación y Marco General

- **Título del proyecto:** InfoFIX – Sistema de Seguimiento y Verificación de Reparación de Celulares.
- **Equipo de desarrollo:** InfoPapus.
- **Integrantes y Roles:**
    - **Leonardo Atos Aguilar Nuñez** (Líder de Proyecto / Project Manager)
    - **María Fernanda González Rodríguez** (Arquitectura Backend, Seguridad y Lógica de Servidor)
    - **Yahúm Adair Hernández Martínez** (Diseño Frontend, UI/UX y Portal Público)
    - **Mauricio Razón Ramos** (Diseño de Base de Datos SQL y QA)
    - **Marco Yahir Guzmán Gasca** (Testing, Calidad de Software y Validación de Fallos)
- **Asesor:** Mtra. Thelma Isabel Morales Ramírez ([thelma.morales3416@academicos.udg.mx](mailto:thelma.morales3416@academicos.udg.mx))
- **Institución:** CUCEI, Universidad de Guadalajara.
- **Fecha:** Octubre - Diciembre de 2026.


---

## 2. Antecedentes, Problemática y Propuesta de Solución

En el sector de soporte técnico de dispositivos electrónicos (smartphones, tablets, laptops), los talleres independientes operan de manera empírica mediante notas de papel, libretas y WhatsApp. Esto genera:


- **Asimetría de información:** El cliente no sabe el estatus real de su equipo.
- **Disputas por daños previos:** Ausencia de evidencia fotográfica inicial de rayones o golpes.
- **Opacidad en refacciones:** Desconocimiento sobre si las piezas instaladas son originales, genéricas o reacondicionadas.
- **Garantías informales:** Términos ambiguos propensos a disputas.


**InfoFIX** resuelve esto mediante un sistema web de dos pilares:


1. **Panel Operativo Interno (Taller):** Recepción de equipos, registro de folios institucionales, línea de tiempo estricta, subida obligatoria de fotos de entrada y salida, inventario de refacciones y cálculo automático de garantías.
1. **Portal Público de Verificación (Cliente):** Acceso anónimo mediante código QR y token UUID v4. Muestra el estado del equipo, vigencia de la garantía y comparativa fotográfica antes/después, protegiendo los datos personales (enmascaramiento de IMEI a los últimos 4 dígitos y omisión de contactos según la LFPDPPP).


---

## 3. Requisitos Funcionales y Reglas de Negocio (ERS IEEE 830)

El proyecto se rige bajo un contrato cerrado con la ERS (IEEE 830):


- **RF-01 (Autenticación):** Acceso para personal técnico mediante JWT (expiración de 8 horas) y contraseñas cifradas con bcrypt (mínimo 10 rondas).
- **RF-02 y RF-03 (Catálogos):** Registro de clientes (teléfono exacto de 10 dígitos) y dispositivos vinculados por IMEI (15 dígitos) o número de serie.
- **RF-04 (Folios):** Generación automática correlativa bajo el patrón `RP-AAAA-NNNN` (ej. `RP-2026-0001`).
- **RF-05 y RF-07 (Evidencias):** Mínimo 1 fotografía de recepción ("antes") obligatoria para abrir la orden y 1 fotografía de salida ("después") obligatoria para poder transicionar al estado "Entregado".
- **RF-06 (Máquina de Estados):** Flujo lineal, irreversible y no regresivo: $$\text{Recibido} \rightarrow \text{Diagnóstico} \rightarrow \text{Reparación} \rightarrow \text{Pruebas} \rightarrow \text{Entregado}$$ Cualquier intento de salto o retroceso es rechazado por el sistema.
- **RF-08 y RF-09 (Refacciones y Garantías):** Catálogo de piezas sustituidas y cálculo automatizado de la fecha de vencimiento de la garantía ($\text{fecha\_entrega} + \text{días\_garantía}$).
- **RF-10, RF-11, RF-12 (Certificados y Consulta QR):** Generación de token UUID v4 inmutable, renderizado de matriz QR y portal público web responsivo con privacidad estricta.
- **RF-13, RF-14, RF-15 (Dashboard y Búsqueda):** Panel con contadores operativos, buscador predictivo por folio/IMEI/cliente y expediente histórico del dispositivo.


---

## 4. Planificación, WBS y Ruta Crítica

- **Horizonte temporal:** 8 semanas (40 días hábiles de lunes a viernes, octubre–noviembre de 2026).
- **Desglose de tareas (WBS):** 28 tareas atómicas (T01 a T28) distribuidas equitativamente entre los 5 integrantes.
- **Ruta Crítica (16 tareas clave sin holgura):** $$\text{T02} \rightarrow \text{T03} \rightarrow \text{T04} \rightarrow \text{T05} \rightarrow \text{T09} \rightarrow \text{T10} \rightarrow \text{T12} \rightarrow \text{T13} \rightarrow \text{T15} \rightarrow \text{T16} \rightarrow \text{T20} \rightarrow \text{T21} \rightarrow \text{T23} \rightarrow \text{T24} \rightarrow \text{T27} \rightarrow \text{T28}$$
- **Duración de la Ruta Crítica:** 36 días hábiles.
- **Holgura Total del Proyecto:** 4 días hábiles de amortiguamiento final antes de la presentación y entrega del 07/12/2026.
- **Plataforma de Gestión:** Trello (`InfoFIX - Gestión de Proyecto`) compartido con la profesora (`thelma.morales3416@academicos.udg.mx`).


---

## 5. Master Prompt Técnico para Inicializar en Entornos de IA (Antigravity / Repositorio)

Actúa como Arquitecto de Software Senior y Lead Engineer. Inicializa y estructura el proyecto "InfoFIX" bajo los siguientes lineamientos estrictos de la ERS IEEE 830:


1. REGLAS DE NEGOCIO INVIOLABLES:


- Máquina de estados estricta (RECIBIDO -> DIAGNÓSTICO -> REPARACIÓN -> PRUEBAS -> ENTREGADO), sin saltos ni retrocesos.


- Evidencias fotográficas obligatorias: mínimo 1 foto de entrada para abrir la orden y 1 foto de salida obligatoria para marcar como ENTREGADO.


- Folio institucional correlativo: RP-YYYY-NNNN.


- Privacidad LFPDPPP: Endpoint público con token UUID v4, enmascaramiento de IMEI (\*\*\*\*\*\*\*\*\*\*\*1234) y sin datos de contacto del cliente.


2. ESQUEMA DE BASE DE RELACIONAL (SQL):


- usuarios (id, nombre, email, password\_hash, rol)


- clientes (id, nombre\_completo, telefono, email)


- dispositivos (id, cliente\_id, marca, modelo, imei\_o\_serie)


- ordenes (id, folio, uuid\_publico, dispositivo\_id, estado, falla\_reportada, accesorios, fecha\_ingreso, fecha\_entrega, dias\_garantia)


- evidencias (id, orden\_id, tipo \['RECEPCION', 'ENTREGA'\], url\_archivo)


- refacciones (id, orden\_id, nombre\_pieza, tipo \['ORIGINAL', 'GENERICA'\], costo)

