Actividad 8 - Planificación de Proyectos de Software 

**Título del proyecto:** InfoFIX – Sistema de seguimiento de reparación de celulares.**Integrantes:**


- Leonardo Atos Aguilar Nuñez (Líder de Proyecto / Project Manager)
- María Fernanda González Rodríguez (Arquitectura Backend y Seguridad)
- Yahúm Adair Hernández Martínez (Diseño Frontend y UI/UX)
- Mauricio Razón Ramos (Diseño de Base de Datos y QA)
- Marco Yahir Guzmán Gasca (Testing y Calidad de Software)**Asesor:** Mtra. Thelma Isabel Morales Ramírez (thelma.morales3416@academicos.udg.mx)**Fecha:** Octubre de 2026

# Parte 1: Identificación y Desglose de Tareas

En esta sección se detallan las 28 actividades técnicas necesarias para la construcción, validación y despliegue del sistema InfoFIX


| Tarea / Actividad | Descripción | Responsable |
| --- | --- | --- |
| **T01: Creación del proyecto en GitHub** | Creación del repositorio en GitHub, ramas main y develop, reglas de protección de ramas, plantilla de Pull Request y archivo .gitignore. |  |
| **T02: Diseño de la base de datos** | Modelado del esquema lógico SQL con tablas usuarios, clientes, dispositivos, ordenes, evidencias y refacciones, definiendo llaves primarias y foráneas. |  |
| **T03: Creación de tablas en la base de datos** | Escritura y ejecución de scripts SQL con tipos de datos correctos, llaves foráneas, NOT NULL y restricciones de unicidad (IMEI y Folio). |  |
| **T04: Configuración inicial del servidor** | Configuración inicial del servidor |  |
| **T05: Sistema de inicio de sesión (Login)** | Sistema de inicio de sesión (Login) |  |
| **T06: Estructura base de la página web** | Estructura base de la página web. |  |
| **T07: Pantalla de inicio de sesión** | Pantalla de inicio de sesión |  |
| **T08: Pruebas de acceso al sistema** | Pruebas de acceso al sistema |  |
| **T09: Módulo de registro de clientes** | Módulo de registro de clientes |  |
| **T10: Módulo de registro de dispositivos** | Módulo de registro de dispositivos |  |
| **T11: Pantallas para clientes y celulares** | Pantallas para clientes y celulares |  |
| **T12: Apertura de órdenes de servicio** | Apertura de órdenes de servicio |  |
| **T13: Avance de estados de reparación** | Avance de estados de reparación |  |
| **T14: Tablero visual de reparaciones** | Tablero visual de reparaciones |  |
| **T15: Función de fotos de entrada (Antes)** | Función de fotos de entrada (Antes) |  |
| **T16: Función de fotos de salida (Después)** | Función de fotos de salida (Después) |  |
| **T17: Registro de piezas y cálculo de garantía** | Registro de piezas y cálculo de garantía |  |
| **T18: Pantalla de detalle de la orden** | Pantalla de detalle de la orden |  |
| **T19: Pruebas del flujo de reparación** | Pruebas del flujo de reparación |  |
| **T20: Generador de enlace de consulta** | Generador de enlace de consulta |  |
| **T21: Generación del código QR** | Generación del código QR |  |
| **T22: Hoja de entrega y garantía imprimible** | Hoja de entrega y garantía imprimible |  |
| **T23: Conexión de consulta pública segura** | Conexión de consulta pública segura |  |
| **T24: Página pública para celulares (QR)** | Página pública para celulares (QR) |  |
| **T25: Buscador y panel de resumen** | Buscador y panel de resumen |  |
| **T26: Preparación de red para la demostración** | Preparación de red para la demostración |  |
| **T27: Pruebas finales de todo el sistema** | Pruebas finales de todo el sistema |  |
| **T28: Revisión final y datos de prueba** | Revisión final y datos de prueba |  |

## Parte 2: Dependencias y Secuencia

A continuación se establece el orden de precedencia técnica para la ejecución ordenada del proyecto, identificando las dependencias directas de cada tarea.


| N° | Tarea / Actividad | Depende de |
| --- | --- | --- |
| **T01** | Creación del proyecto en GitHub | — |
| **T02** | Diseño de la base de datos | — |
| **T03** | Creación de tablas en la base de datos | T02 |
| **T04** | Configuración inicial del servidor | T01, T03 |
| **T05** | Sistema de inicio de sesión (Login) | T04 |
| **T06** | Estructura base de la página web | T01 |
| **T07** | Pantalla de inicio de sesión | T05, T06 |
| **T08** | Pruebas de acceso al sistema | T05, T07 |
| **T09** | Módulo de registro de clientes | T05 |
| **T10** | Módulo de registro de dispositivos | T09 |
| **T11** | Pantallas para clientes y celulares | T07, T10 |
| **T12** | Apertura de órdenes de servicio | T10 |
| **T13** | Avance de estados de reparación | T12 |
| **T14** | Tablero visual de reparaciones | T11, T12 |
| **T15** | Función de fotos de entrada (Antes) | T13 |
| **T16** | Función de fotos de salida (Después) | T15 |
| **T17** | Registro de piezas y cálculo de garantía | T13 |
| **T18** | Pantalla de detalle de la orden | T14, T16, T17 |
| **T19** | Pruebas del flujo de reparación | T16, T17, T18 |
| **T20** | Generador de enlace de consulta | T16, T17 |
| **T21** | Generación del código QR | T20 |
| **T22** | Hoja de entrega y garantía imprimible | T21 |
| **T23** | Conexión de consulta pública segura | T20 |
| **T24** | Página pública para celulares (QR) | T23 |
| **T25** | Buscador y panel de resumen | T14, T17 |
| **T26** | Preparación de red para la demostración | T24 |
| **T27** | Pruebas finales de todo el sistema | T24, T25 |
| **T28** | Revisión final y datos de prueba | T26, T27 |

## Parte 3: Estimación de Duración

Estimación de la carga de trabajo expresada en días hábiles continuos por cada tarea individual.


| N° | Tarea | Duración estimada (días/semanas/meses) |
| --- | --- | --- |
| **T01** | Creación del proyecto en GitHub |  |
| **T02** | Diseño de la base de datos |  |
| **T03** | Creación de tablas en la base de datos |  |
| **T04** | Configuración inicial del servidor |  |
| **T05** | Sistema de inicio de sesión (Login) |  |
| **T06** | Estructura base de la página web |  |
| **T07** | Pantalla de inicio de sesión |  |
| **T08** | Pruebas de acceso al sistema |  |
| **T09** | Módulo de registro de clientes |  |
| **T10** | Módulo de registro de dispositivos |  |
| **T11** | Pantallas para clientes y celulares |  |
| **T12** | Apertura de órdenes de servicio |  |
| **T13** | Avance de estados de reparación |  |
| **T14** | Tablero visual de reparaciones |  |
| **T15** | Función de fotos de entrada (Antes) |  |
| **T16** | Función de fotos de salida (Después) |  |
| **T17** | Registro de piezas y cálculo de garantía |  |
| **T18** | Pantalla de detalle de la orden |  |
| **T19** | Pruebas del flujo de reparación |  |
| **T20** | Generador de enlace de consulta |  |
| **T21** | Generación del código QR |  |
| **T22** | Hoja de entrega y garantía imprimible |  |
| **T23** | Conexión de consulta pública segura |  |
| **T24** | Página pública para celulares (QR) |  |
| **T25** | Buscador y panel de resumen |  |
| **T26** | Preparación de red para la demostración |  |
| **T27** | Pruebas finales de todo el sistema |  |
| **T28** | Revisión final y datos de prueba |  |

## Parte 4: Ruta Crítica

### Diagrama de red

Representación visual de la secuencia del proyecto y bifurcaciones paralelas desde el día 1 al día 40:\[INICIO: Día 1\]


├──> T01: Repo Git (1d) ──> T06: Frontend Base (2d)


└──> T02: Diseño DER (3d) \[CRÍTICA\]


        │


      T03: Scripts DDL (2d) \[CRÍTICA\]


        │


      T04: Backend Base (2d) \[CRÍTICA\]


        │


      T05: Auth API / JWT (3d) \[CRÍTICA\]


        ├──> T07: UI Login (3d) ──> T08: QA Auth (2d)


        └──> T09: API Clientes (2d) \[CRÍTICA\]


                │


              T10: API Dispositivos (2d) \[CRÍTICA\]


                ├──> T11: UI Clientes/Eq (4d) ──> T14: UI Tablero (4d)


                └──> T12: API Órdenes (3d) \[CRÍTICA\]


                        │


                      T13: Máquina Estados (3d) \[CRÍTICA\]


                        ├──> T17: Refacciones (2d) ──> T18: UI Detalle (3d) ──> T19: QA Órdenes (2d)


                        └──> T15: API Foto Recepción (3d) \[CRÍTICA\]


                                │


                              T16: API Foto Entrega (2d) \[CRÍTICA\]


                                │


                              T20: Generador UUID (2d) \[CRÍTICA\]


                                │


                              T21: Motor QR (2d) \[CRÍTICA\]


                                ├──> T22: Certificado Print (3d)


                                └──> T23: API Pública (2d) \[CRÍTICA\]


                                        │


                                      T24: Web Pública QR (4d) \[CRÍTICA\]


                                        ├──> T26: Demo ngrok (2d)


                                        └──> T27: QA ERS 100% (3d) \[CRÍTICA\]


                                                │


                                              T28: Auditoría Final y Cierre (2d) \[CRÍTICA\]


                                                │


                                              \[FIN: Día 40\]

### Enlista las tareas/actividades que forman parte de la ruta crítica

Las siguientes 16 tareas determinan la duración mínima del proyecto; cualquier retraso en ellas impactará directamente la fecha de entrega final.


| N° | Tarea |
| --- | --- |
| **T02** | Diseño de la base de datos |
| **T03** | Creación de tablas en la base de datos |
| **T04** | Configuración inicial del servidor |
| **T05** | Sistema de inicio de sesión (Login) |
| **T09** | Módulo de registro de clientes |
| **T10** | Módulo de registro de dispositivos |
| **T12** | Apertura de órdenes de servicio |
| **T13** | Avance de estados de reparación |
| **T15** | Función de fotos de entrada (Antes) |
| **T16** | Función de fotos de salida (Después) |
| **T20** | Generador de enlace de consulta |
| **T21** | Generación del código QR |
| **T23** | Conexión de consulta pública segura |
| **T24** | Página pública para celulares (QR) |
| **T27** | Pruebas finales de todo el sistema |
| **T28** | Revisión final y datos de prueba |


## Parte 5: Cronograma y Recursos

### Calendario de Ejecución por Tareas

Asignación calendarizada contemplando el inicio del proyecto en octubre de 2026.


| N° | Tarea | Responsable | Duración | Fecha inicio | Fecha fin |
| --- | --- | --- | --- | --- | --- |
| **T01** | Creación del proyecto en GitHub |  |  | 05/10/2026 | 05/10/2026 |
| **T02** | Diseño de la base de datos |  |  | 05/10/2026 | 07/10/2026 |
| **T03** | Creación de tablas en la base de datos |  |  | 08/10/2026 | 09/10/2026 |
| **T04** | Configuración inicial del servidor |  |  | 08/10/2026 | 09/10/2026 |
| **T05** | Sistema de inicio de sesión (Login) |  |  | 12/10/2026 | 14/10/2026 |
| **T06** | Estructura base de la página web |  |  | 08/10/2026 | 09/10/2026 |
| **T07** | Pantalla de inicio de sesión |  |  | 13/10/2026 | 15/10/2026 |
| **T08** | Pruebas de acceso al sistema |  |  | 15/10/2026 | 16/10/2026 |
| **T09** | Módulo de registro de clientes |  |  | 19/10/2026 | 20/10/2026 |
| **T10** | Módulo de registro de dispositivos |  |  | 21/10/2026 | 22/10/2026 |
| **T11** | Pantallas para clientes y celulares |  |  | 20/10/2026 | 23/10/2026 |
| **T12** | Apertura de órdenes de servicio |  |  | 26/10/2026 | 28/10/2026 |
| **T13** | Avance de estados de reparación |  |  | 28/10/2026 | 30/10/2026 |
| **T14** | Tablero visual de reparaciones |  |  | 27/10/2026 | 30/10/2026 |
| **T15** | Función de fotos de entrada (Antes) |  |  | 02/11/2026 | 04/11/2026 |
| **T16** | Función de fotos de salida (Después) |  |  | 04/11/2026 | 05/11/2026 |
| **T17** | Registro de piezas y cálculo de garantía |  |  | 05/11/2026 | 06/11/2026 |
| **T18** | Pantalla de detalle de la orden |  |  | 04/11/2026 | 06/11/2026 |
| **T19** | Pruebas del flujo de reparación |  |  | 05/11/2026 | 06/11/2026 |
| **T20** | Generador de enlace de consulta |  |  | 09/11/2026 | 10/11/2026 |
| **T21** | Generación del código QR |  |  | 11/11/2026 | 12/11/2026 |
| **T22** | Hoja de entrega y garantía imprimible |  |  | 11/11/2026 | 13/11/2026 |
| **T23** | Conexión de consulta pública segura |  |  | 16/11/2026 | 17/11/2026 |
| **T24** | Página pública para celulares (QR) |  |  | 17/11/2026 | 20/11/2026 |
| **T25** | Buscador y panel de resumen |  |  | 17/11/2026 | 20/11/2026 |
| **T26** | Preparación de red para la demostración |  |  | 23/11/2026 | 24/11/2026 |
| **T27** | Pruebas finales de todo el sistema |  |  | 23/11/2026 | 25/11/2026 |
| **T28** | Revisión final y datos de prueba |  |  | 26/11/2026 | 27/11/2026 |

### Diagrama de Gantt

Distribución semestral a lo largo de las 8 semanas de desarrollo.


| N° | Tarea | Responsable | Tipo | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **T01** | Creación del proyecto en GitHub |  |  | X |  |  |  |  |  |  |  |
| **T02** | Diseño de la base de datos |  |  | X |  |  |  |  |  |  |  |
| **T03** | Creación de tablas en la base de datos |  |  | X |  |  |  |  |  |  |  |
| **T04** | Configuración inicial del servidor |  |  | X |  |  |  |  |  |  |  |
| **T05** | Sistema de inicio de sesión (Login) |  |  |  | X |  |  |  |  |  |  |
| **T06** | Estructura base de la página web |  |  | X |  |  |  |  |  |  |  |
| **T07** | Pantalla de inicio de sesión |  |  |  | X |  |  |  |  |  |  |
| **T08** | Pruebas de acceso al sistema |  |  |  | X |  |  |  |  |  |  |
| **T09** | Módulo de registro de clientes |  |  |  |  | X |  |  |  |  |  |
| **T10** | Módulo de registro de dispositivos |  |  |  |  | X |  |  |  |  |  |
| **T11** | Pantallas para clientes y celulares |  |  |  |  | X |  |  |  |  |  |
| **T12** | Apertura de órdenes de servicio |  |  |  |  |  | X |  |  |  |  |
| **T13** | Avance de estados de reparación |  |  |  |  |  | X |  |  |  |  |
| **T14** | Tablero visual de reparaciones |  |  |  |  |  | X |  |  |  |  |
| **T15** | Función de fotos de entrada (Antes) |  |  |  |  |  |  | X |  |  |  |
| **T16** | Función de fotos de salida (Después) |  |  |  |  |  |  | X |  |  |  |
| **T17** | Registro de piezas y cálculo de garantía |  |  |  |  |  |  | X |  |  |  |
| **T18** | Pantalla de detalle de la orden |  |  |  |  |  |  | X |  |  |  |
| **T19** | Pruebas del flujo de reparación |  |  |  |  |  |  | X |  |  |  |
| **T20** | Generador de enlace de consulta |  |  |  |  |  |  |  | X |  |  |
| **T21** | Generación del código QR |  |  |  |  |  |  |  | X |  |  |
| **T22** | Certificado Print |  |  |  |  |  |  |  | X |  |  |
| **T23** | Conexión de consulta pública segura |  |  |  |  |  |  |  |  | X |  |
| **T24** | Página pública para celulares (QR) |  |  |  |  |  |  |  |  | X |  |
| **T25** | Buscador y panel de resumen |  |  |  |  |  |  |  |  | X |  |
| **T26** | Preparación de red para la demostración |  |  |  |  |  |  |  |  |  | X |
| **T27** | Pruebas finales de todo el sistema |  |  |  |  |  |  |  |  |  | X |
| **T28** | Revisión final y datos de prueba |  |  |  |  |  |  |  |  |  | X |

## Parte 6: Carga en Plataforma de Gestión

- **Plataforma seleccionada:** Trello
- **Nombre del tablero/proyecto:** 
- **Link o invitación al profesor:** 

### Informe Breve de Gestión


