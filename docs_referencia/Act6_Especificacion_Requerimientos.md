Universidad de Guadalajara

Centro Universitario de Ciencias Exactas e Ingenierías


Especificación de Requerimientos

InfoFIX


InfoPapus:

Razón Ramos Mauricio

González Rodríguez María Fernanda

Hernández Martínez Yahúm Adair      

Guzmán Gasca Marco Yahir

Aguilar Nuñez Leonardo Atos

# **Historial de Revisiones**


| **Fecha** | **Revisión** | **Descripción** | **Autor** |
| --- | --- | --- | --- |
| 26/09/2026 | 1.0 | Introducción | Razón Ramos Mauricio |
| 27/09/2026 | 1.0 | Descripción General | Razón Ramos Mauricio González Rodríguez María Fernanda Hernández Martínez Yahúm Adair       Guzmán Gasca Marco Yahir Aguilar Nuñez Leonardo Atos |
| 27/09/2026 | 1.0 | Requisitos específicos | Razón Ramos Mauricio González Rodríguez María Fernanda Hernández Martínez Yahúm Adair       Guzmán Gasca Marco Yahir Aguilar Nuñez Leonardo Atos |
| 27/09/2026 | 1.0 | Requisitos funcionales | Razón Ramos Mauricio González Rodríguez María Fernanda Hernández Martínez Yahúm Adair       Guzmán Gasca Marco Yahir Aguilar Nuñez Leonardo Atos |
| 27/09/2026 | 1.0 | Requisitos no funcionales | Razón Ramos Mauricio González Rodríguez María Fernanda Hernández Martínez Yahúm Adair       Guzmán Gasca Marco Yahir Aguilar Nuñez Leonardo Atos |
| 27/09/2026 | 1.0 | Otros Requisitos | Razón Ramos Mauricio González Rodríguez María Fernanda Hernández Martínez Yahúm Adair       Guzmán Gasca Marco Yahir Aguilar Nuñez Leonardo Atos |


Documento validado por las partes en fecha: 27/09/2026



| Por el cliente | Por la empresa suministradora |
| --- | --- |
|  |  |
| Fdo. InfoPapus | Fdo. Morales Ramírez Thelma Isabel UDG Development |























## Contenido










1. **Introducción**

El presente documento tiene como propósito definir y presentar de forma ordenada los requisitos y especificaciones (funcionales y no funcionales) que debe proveer el software InfoFIX al término de su construcción.

Este documento es una Especificación de Requerimientos de Software (ERS), que se ha estructurado basado en las directrices emitidas por el estándar IEEE Práctica Recomendada para Especificaciones de Requisitos de Software ANSI/IEEE 830,1998. El documento podrá ser consultado por el cliente, los usuarios finales y el equipo de desarrollo, para dar seguimiento al avance del proyecto y verificar el cumplimiento de los requerimientos.

    1. **Propósito**

Todos en su mayoría hemos vivido la experiencia de dejar algún dispositivo en un servicio técnico de reparaciones, donde normalmente recibimos una nota de papel o nota de servicio con nada más que información del registro en su base de datos. Pero muchas veces no se nos proporciona información inmediata sobre el estatus del servicio, piezas que requiera, garantías, etc; y cuando se presentan inconvenientes días o semanas después del servicio brindado, puede ser difícil llevar un registro claro y continuar con el servicio.

El desarrollo de InfoFIX nace para resolver ese problema de confianza y de practicidad. Es una plataforma web que registra cada reparación paso a paso (recepción, diagnóstico, reparación, pruebas y entrega) incluyendo fotografías de evidencia, piezas y garantía, y al terminar genera un certificado digital con un código QR. Cualquier persona puede escanear el QR y comprobar, sin crear cuenta, que la información es auténtica y no fue modificada.

Pretendemos que el proyecto sea relevante para los talleres pequeños y medianos, los cuales suelen llevar su control en libretas, hojas de cálculo o bases de datos pequeñas, y WhatsApp, ofreciéndoles la opción de llevar un registro más robusto, seguro y verificable, el cual les dará una ventaja en el mercado donde transmitirán profesionalismo, transparencia y una vía de comunicación clara a sus clientes, reduciendo conflictos y malentendidos con ellos.



    1. **Alcance**
        1. *El sistema incluirá (alcance principal):*

El sistema contempla como funciones esenciales el inicio de sesión exclusivo para el personal del taller, registro de clientes y dispositivos en la base de datos, creación de órdenes de reparación con su estado inicial, línea del tiempo informativa con el estatus del servicio, registro de piezas cambiadas (si aplica) y estados de garantía, creación de la página de consulta de estatus para el cliente (acceso por QR o URL), notificaciones de cotizaciones y avisos, generación de certificado digital al entregar el equipo (QR), para comprobar la identidad del registro, y dashboard básico para el taller con información sobre reparaciones activas, terminadas y garantías vigentes.

        1. *El sistema no incluirá (fuera de alcance):*

Debido al tiempo con el que contamos para el desarrollo del proyecto (ocho semanas), el proyecto se limitará a desarrollo web, es decir, no habrá aplicaciones móviles nativas (Android/ iOS), tampoco se incluirán funciones financieras como cobros de servicios y cotizaciones o facturación, funciones específicas del taller como control de inventario de piezas, proveedores, compras, etc., también quedarán excluidas debido a que el enfoque principal actual del proyecto será el registro de folios de servicio y comunicación con el cliente.

    1. **Personal Involucrado**

| Nombre | María Fernanda González Rodríguez |
| --- | --- |
| Rol | Desarrollador backend |
| Responsabilidades | Diseñar e implementar la API REST, la lógica de estados de la reparación y el código QR. |
| Contacto | kipandi7@gmail.com |


| Nombre | Leonardo Atos Aguilar Nuñez |
| --- | --- |
| Rol | Líder de proyecto |
| Responsabilidades | Coordinar tareas y entregas, mantener actualizada esta ERS, organizar el tablero de tareas y preparar la demostración final. |
| Contacto | leonardo.aguilar4226@alumnos.udg.mx |


| Nombre | Guzmán Gasca Marco Yahir |
| --- | --- |
| Rol | Testing y programación orientada a fallos |
| Responsabilidades | Encargado de testear correctamente el código para encontrar fallos en lógica, flujos, buffers y vulnerabilidades, así mismo, se encargará de evitar que sucedan fallos dentro del código. |
| Contacto | marco.guzman7477@alumnos.udg.mx |


| Nombre | Yahúm Adair Hernández Martínez |
| --- | --- |
| Rol | Desarrollador frontend. UI/UX. Documentación |
| Responsabilidades | Diseñar interfaces. Construir la página pública de verificación y consulta de historial y la vista del imprimible. Construir las pantallas del panel del taller (login, dashboard) |
| Contacto | 05hmyahum@gmail.com |


| Nombre | Mauricio Razon Ramos |
| --- | --- |
| Rol | Base de datos y pruebas (QA) |
| Responsabilidades | Diseñar el modelo de datos en SQL, cargar datos de prueba, escribir los casos de prueba. |
| Contacto | mauriciorazon10@gmail.com |


    1. **Definiciones, acrónimos y abreviaturas**
- **Orden de reparación:** registro de una reparación de un dispositivo, identificada por un folio único.
- **Folio:** identificador legible de la orden, con formato RP-AAAA-NNNN (p. ej. RP-2026-0001).
- **Certificado digital:** documento generado por el sistema al entregar el equipo que resume la reparación y es verificable mediante QR.
- **IMEI:** International Mobile Equipment Identity; número de 15 dígitos que identifica a un teléfono celular.
- **Token:** código aleatorio (UUID) que identifica un certificado en la URL pública sin revelar datos internos.
- **UUID:** identificador único universal de 128 bits generado aleatoriamente.
- **API REST:** interfaz de programación basada en HTTP mediante la cual el frontend se comunica con el backend.
- **JSON:** formato de texto para intercambiar datos entre frontend y backend.
- **JWT:** JSON Web Token; credencial firmada que identifica a un usuario con sesión iniciada.
- **bcrypt:** algoritmo para almacenar contraseñas de forma segura mediante un hash con sal.
- **Dashboard:** pantalla de resumen con indicadores del taller.
- **RF:** Requisito Funcional.
- **RNF:** Requisito no funcional.
- **CU:** Caso de Uso.






    1. **Referencias**

| **Referencia** | **Título** | **Ruta** | **Fecha** | **Autor** |
| --- | --- | --- | --- | --- |
| ISBN 0-7381-0332- 2 | IEEE Recommended Practice for Software Requirements Specifications | https://ieeexplore.ieee.org/document/720574 | 25/Junio/1998 | Software Engineering Standards Committee of the IEEE Computer Society |

1. **Descripción general**
    1. **Perspectiva del producto**

El desarrollo de InfoFix se llevará a cabo de manera independiente, ya que no dependerá de algún sistema mayor de talleres, dándole un enfoque en el desarrollo web para la accesibilidad de los usuarios en la implementación de interfaces claras y amigables. La practicidad en los métodos de acceso, además de responder de manera responsiva en los dispositivos móviles.

El sistema tiene dos puntos clave de entrada: el panel interno, donde el personal del taller registra y da seguimiento a las reparaciones, y la página pública de verificación, que abre el cliente al escanear el QR del certificado.

    1. **Funcionalidad del producto**

El diagrama siguiente muestra los dos actores del sistema y los casos de uso del proyecto. La tabla siguiente resume cada uno:


- CU-01 Iniciar sesión (Personal del taller): Accede al panel interno con correo y contraseña.
- CU-02 Registrar cliente y dispositivo (Personal del taller): Captura los datos del cliente y del equipo (marca, modelo, IMEI o serie).
- CU-03 Crear orden y registrar estado inicial (Personal del taller): Genera la orden con folio y guarda la falla, accesorios y fotos de cómo llegó el equipo.
- CU-04 Actualizar estado de la reparación (Personal del taller): Avanza la orden por Diagnóstico, Reparación, Pruebas y Entregado, dejando una nota en la línea de tiempo.
- CU-05 Subir evidencias antes / después (Personal del taller): Sube fotografías que documentan el antes y el después.
- CU-06 Registrar pieza y garantía (Personal del taller): Anota la pieza cambiada y los días y condiciones de la garantía.
- CU-07 Generar certificado y QR (Personal del taller): Al entregar, el sistema genera el QR.
- CU-08 Consultar dashboard y buscar órdenes (Personal del taller): Ve el resumen del taller y encuentra órdenes por folio, cliente o IMEI/SN.
- CU-09 Verificar reparación (Cliente / Público): Escanea el QR y ve si el certificado es íntegro, junto con el resumen y la garantía.
    1. **Características de los usuarios**

| Tipo de usuario | Personal del taller (técnico o encargado) |
| --- | --- |
| Formación | Educación media superior o técnica en reparación de dispositivos electrónicos. |
| Habilidades | Gestión en sistemas de información |
| Actividades | Registro de clientes Registro de dispositivos y órdenes Actualizar estados, generar e imprimir el certificado con QR Consulta del dashboard. |


| Tipo de usuario | Cliente / Público verificador |
| --- | --- |
| Formación | Cualquier nivel educativo. |
| Habilidades | (Ninguna necesaria) |
| Actividades | Consultar la página pública del certificado Comprobar que la reparación es auténtica y revisar la vigencia de su garantía. |

    1. **Restricciones**
- Tiempo: El proyecto debe estar terminado y demostrable en aproximadamente dos meses (8–9 semanas).
- Plataforma: Solo aplicación web responsiva; no se desarrollarán apps nativas.
- Tecnologías: Base de datos relacional SQL; backend como API(, frontend web (p. ej. React o HTML/CSS/JS). La elección final debe ser una que al menos dos integrantes ya conozcan.
- Seguridad: Se usarán únicamente librerías estándar y probadas; el equipo no implementará algoritmos criptográficos propios.
- Metodología: Desarrollo iterativo por sprints de 2 semanas, con control de versiones en Git y un tablero de tareas compartido.
    1. **Suposiciones y dependencias**

#### 	Suposiciones

- Se asume que el taller cuenta con conexión a Internet estable y con al menos un celular o computadora con cámara.
- Se asume que el personal del taller tiene conocimientos básicos de uso de celular y navegador web.
- Se asume que el cliente tiene un celular capaz de leer códigos QR con la cámara.
- Se asume que los datos que captura el personal (por ejemplo, el tipo de pieza) son verdaderos.

#### 	Dependencias

- El sistema implementado al 100% requerirá un uso de una web hosting(para la validación del funcionamiento antes del despliegue se usará la pc propia)
- Depende de librerías de terceros de código abierto para generar QR, cifrar contraseñas y manejar tokens de sesión.
- Depende de que los navegadores modernos (Chrome, Safari, Firefox, Edge) sigan soportando las funciones web utilizadas.
    1. **Evolución previsible del sistema**

Entendemos que, por parte del desarrollo de InfoFix como un proyecto con un proceso de desarrollo a corto plazo, el desarrollo de muchas funciones se verá comprometido; por eso entendemos que la escalabilidad de este producto es bastante grande.

Tenemos en cuenta varios puntos que a futuro nos gustaría desarrollar e implementar en el software, entendemos que estos cambios dependen del mantenimiento y actualizaciones constantes.

        - **Firma digital o anclaje externo del hash:** para que ni siquiera alguien con acceso total al servidor pueda alterar un qr sin ser detectado.
        - **Roles y permisos:** separar administrador y técnico, y permitir correcciones controladas de certificados con versiones.
1. **Requisitos específicos**

En este apartado se detallan las especificaciones técnicas indispensables para esta versión InfoFix, estructuradas adecuadamente para orientar las etapas de arquitectura, implementación y validación por parte del equipo. La secuencia funcional abarca el ciclo completo de: Recepción de Dispositivo -> Estado Inicial (con Evidencias) -> Diagnóstico -> Cotización -> Reparación -> Pruebas -> Finalización de Servicio -> Notificación -> Entrega -> Seguimiento de Garantía.

    1. **Requisitos comunes de las interfaces**
        1. **Interfaces de usuario**

El sistema se construirá como un entorno web responsivo compuesto por dos accesos independientes: la administración interna privada reservada al personal técnico previa autenticación y el portal público de comprobación accesible libremente. Se dará prioridad a la usabilidad fluida para asegurar una adopción ágil sin requerir capacitaciones complejas.

    - **Colores:** tonos neutros y fríos (idealmente blanco y azul marino), tonalidad gris para acciones principales, indicador verde para estados válidos o vigentes y rojo para inconsistencias o garantías expiradas.
    - **Tipografía:** tipografía redonda, alineada y legible, del estilo poppins, rubik o nunito; con tamaño de 12-14 pts para textos y 20-40 pts para títulos.
    - **Estados de la orden:** distintivos visuales mediante etiquetas correspondientes a cada etapa (Recibido, Diagnóstico, Reparación, Pruebas y Entregado).
    - **Botones principales:** controles directos para operaciones clave como “Nueva orden”, “Avanzar estado”, “Subir foto”, “Agregar pieza”, “Guardar garantía”,  e “Imprimir Nota de Servicio (QR)”, “Notificar”.
    - **Retroalimentación:** notificaciones visuales inmediatas al concretar modificaciones y cambios de estatus, para asegurar que el cliente tenga la información correcta.
    - **Diseño:** utilización de marcos de trabajo UI consolidados (tales como Bootstrap o Tailwind) para acelerar la maquetación y asegurar la adaptabilidad al navegador.

**Módulos de la interfaz:**

    - **Inicio de sesión:** pantalla de acceso mediante credenciales de correo electrónico y contraseña.
    - **Dashboard:** resumen general con métricas principales (servicios en proceso, en espera, concluidos, garantías activas), barra de búsqueda, listado general, panel de clientes.
    - **Nueva orden:** formulario de alta para la captura de datos del usuario, especificaciones del equipo e incidencias reportadas con fotografías iniciales.
    - **Detalle de la orden:** seguimiento cronológico, galería fotográfica comparativa, componentes sustituidos, términos de garantía y actualización de fases.
    - **Certificado:** visualización del documento de entrega con código QR para impresión o exportación digital.
    - **Verificación pública:** portal abierto para consulta, expediente del equipo, historial de atención, componentes y evidencia gráfica.


        1. **Interfaces de hardware**

La infraestructura física requerida por la aplicación web se clasifica en los recursos del entorno de servidor y las estaciones de usuario:

    - **Servidor:** instancia en la nube basado en sistema Linux, habilitado para la capa backend y motor SQL con una capacidad mínima de 1 GB para almacenamiento multimedia.
    - **Equipos de desarrollo:** estaciones de trabajo del equipo de programación (Windows, macOS o Linux) provistas con al menos 8 GB de memoria RAM.
    - **Equipo del taller:** dispositivos informáticos o terminales móviles equipados con navegador web contemporáneo e interconexión a la red.
    - **Cámara:** sensor fotográfico integrado en dispositivos móviles o cámaras web fijas destinadas a la digitalización del estado físico de los equipos.
    - **Cliente final:** dispositivo móvil con lector de códigos QR incorporado, prescindiendo del despliegue de aplicaciones externas.
    - **Impresora:** periférico de impresión para entregar al cliente la nota de servicio que incluiría el QR para la revisión del estatus en tiempo real.
        1. **Interfaces de software**

El sistema interactúa con los siguientes componentes de software (*pudiendo adaptarse las librerías específicas según el criterio final del equipo*):

    - **Base de datos:** gestor relacional SQL.
    - **Backend:** servicios web bajo arquitectura REST (implementados sobre plataformas como Node.js y Express).
    - **Frontend:** interfaz de usuario web desarrollada mediante frameworks modernos (React o HTML/CSS/JS respaldado por Bootstrap).
    - **Contraseñas:** módulo de encriptación bcrypt para el resguardo de accesos.
    - **Sesiones:** gestión de tokens de autenticación JSON Web Token (jsonwebtoken).
    - **Código QR:** componentes dedicados a la generación de código bidimensional (como qrcode).
    - **Subida de fotos:** manejadores de peticiones de entrada para la persistencia multimedia local o remota.
    - **Control de versiones:** plataforma de gestión de código distribuido mediante Git y almacenamiento en GitHub, o en casos especiales, utilizar una extensión de Visual Studio Code para trabajo en paralelo.
        1. **Interfaces de comunicación**
    - **Frontend y backend:** protocolos seguros HTTPS. 
    - **Carga de fotografías:** transferencia de medios utilizando solicitudes codificadas sobre HTTPS.
    - **Autenticación:** encabezado seguro Authorization respaldado por tokens JWT en las solicitudes de administración.
    - **Código QR a página pública:** enlace estructurado apuntando a la dirección pública..
    1. **Requisitos funcionales**

Las especificaciones funcionales se clasifican bajo la nomenclatura RF. El nivel de prioridad asignado establece: Alta = indispensable para la liberación inicial; Media = sujeta a disponibilidad de tiempo en las fases finales; Baja = ejecutable en caso de holgura. Las funcionalidades se encuentran acotadas para permitir su desarrollo efectivo por un equipo de 5 integrantes en un periodo de 2 meses.


#### **RF-01 Inicio de sesión del personal del taller**

| **Campo** | **Detalle** |
| --- | --- |
| **Número de requisito** | RF-01 |
| **Nombre del requisito** | Inicio de sesión del personal del taller |
| **Tipo** | ☑ Requisito funcional   ☐ Restricción |
| **Fuente del requisito** | Cliente (taller) |
| **Prioridad del requisito** | ☑ Alta / Esencial   ☐ Media / Deseado   ☐ Baja / Opcional |
| **Descripción del requisito** | El sistema deberá permitir al personal del taller iniciar sesión mediante su correo electrónico y contraseña registrados, autenticando su identidad para conceder acceso a las funciones operativas del panel interno. |
| **Detalles adicionales** | Disparador: El personal del taller intenta acceder a cualquier módulo interno o abre la dirección web de acceso al sistema desde su navegador. Captura de datos: El usuario ingresa su correo electrónico registrado y su contraseña de acceso en el formulario. Validación: El sistema comprueba que ambos campos contengan texto y que el correo electrónico cumpla con una estructura sintáctica estándar. Procesamiento: El sistema contrasta las credenciales contra el registro de usuarios autorizados del taller y valida la correspondencia de la contraseña para generar la sesión activa de trabajo. Almacenamiento: Registra el inicio de sesión y establece la vigencia temporal de la sesión del usuario. Resultado esperado: El sistema autoriza el ingreso, habilita el acceso a las funciones de administración y redirige al usuario a la vista principal del Dashboard. Manejo de errores: Si el correo o la contraseña no coinciden con los registros, el sistema muestra el mensaje: "Correo o contraseña incorrectos", manteniendo limpios los campos para un nuevo intento sin revelar cuál de los dos datos fue el erróneo. Si se intenta ingresar a una sección interna sin sesión activa o con la sesión vencida, el sistema bloquea la vista y redirige automáticamente a la pantalla de inicio de sesión. |


#### **RF-02 Registro de clientes**

| **Campo** | **Detalle** |
| --- | --- |
| **Número de requisito** | RF-02 |
| **Nombre del requisito** | Registro de clientes |
| **Tipo** | ☑ Requisito funcional   ☐ Restricción |
| **Fuente del requisito** | Cliente (taller) |
| **Prioridad del requisito** | ☑ Alta / Esencial   ☐ Media / Deseado   ☐ Baja / Opcional |
| **Descripción del requisito** | El sistema deberá permitir al personal del taller registrar los datos generales de contacto de un nuevo cliente que entrega un equipo para reparación, así como buscar y reutilizar la información de clientes previamente registrados. |
| **Detalles adicionales** | Disparador: El personal del taller inicia la recepción de un servicio técnico o ingresa al módulo de clientes. Captura de datos: Nombre completo, número de teléfono (10 dígitos), correo electrónico (opcional) y confirmación de aceptación del aviso de privacidad. Validación: El sistema comprueba que el nombre completo no esté vacío, que el número de teléfono contenga exactamente 10 dígitos numéricos, que el correo electrónico (si se ingresa) tenga un formato válido y que la casilla del aviso de privacidad esté marcada obligatoriamente. Procesamiento: El sistema consulta si el número de teléfono ya pertenece a un cliente existente. Si existe, muestra los datos para su selección inmediata; si es un cliente nuevo, prepara el alta del nuevo registro asociándolo a la fecha y hora actual. Almacenamiento: Almacena los datos del cliente (nombre, teléfono, correo y fecha de registro) en el catálogo general de clientes. Resultado esperado: El cliente queda registrado o seleccionado en pantalla, habilitando la vinculación de su dispositivo y la creación de su orden de reparación. Manejo de errores: Si falta algún dato obligatorio, si el teléfono no tiene 10 dígitos o si no se acepta el aviso de privacidad, el sistema resalta los campos incorrectos con un mensaje específico (p. ej., "El número de teléfono debe contener exactamente 10 dígitos") y no permite continuar hasta corregir la información. |


#### **RF-03 Registro de dispositivos**

| **Campo** | **Detalle** |
| --- | --- |
| **Número de requisito** | RF-03 |
| **Nombre del requisito** | Registro de dispositivos |
| **Tipo** | ☑ Requisito funcional   ☐ Restricción |
| **Fuente del requisito** | Cliente (taller) |
| **Prioridad del requisito** | ☑ Alta / Esencial   ☐ Media / Deseado   ☐ Baja / Opcional |
| **Descripción del requisito** | El sistema deberá permitir al personal del taller registrar las especificaciones de un dispositivo que ingresa a reparación, asociándolo obligatoriamente a un cliente registrado y utilizando su IMEI o número de serie como identificador único. |
| **Detalles adicionales** | Disparador: El personal del taller atiende la recepción de un equipo, habiendo seleccionado o registrado previamente al cliente correspondiente. Captura de datos: Tipo de dispositivo (celular, tablet, laptop u otro), marca, modelo, color, número de IMEI o número de serie, y selección del cliente propietario. Validación: El sistema verifica que todos los campos requeridos estén completos. Si el tipo de dispositivo es "celular", valida obligatoriamente que el IMEI contenga exactamente 15 dígitos numéricos; para otros tipos de dispositivo, valida que el número de serie contenga entre 4 y 30 caracteres alfanuméricos. Procesamiento: El sistema consulta si el IMEI o número de serie ya existe en la base de datos. Si el dispositivo ya había ingresado previamente al taller, recupera sus datos y su historial para asociarle una nueva orden; si no existe, crea el registro del dispositivo vinculado al cliente indicado. Almacenamiento: Almacena el dispositivo con su tipo, marca, modelo, color, identificador único (IMEI o serie) y su asociación al identificador del cliente. Resultado esperado: El sistema confirma el alta o selección del equipo y lo deja listo para la apertura de una orden de reparación. Manejo de errores: Si el IMEI no tiene exactamente 15 dígitos o contiene caracteres no numéricos, el sistema muestra: "El IMEI debe contener exactamente 15 dígitos numéricos". Si faltan campos obligatorios, el sistema bloquea el guardado e indica al usuario los datos faltantes. |


#### **RF-04 Creación de orden de reparación**

| **Campo** | **Detalle** |
| --- | --- |
| **Número de requisito** | RF-04 |
| **Nombre del requisito** | Creación de orden de reparación |
| **Tipo** | ☑ Requisito funcional   ☐ Restricción |
| **Fuente del requisito** | Cliente (taller) |
| **Prioridad del requisito** | ☑ Alta / Esencial   ☐ Media / Deseado   ☐ Baja / Opcional |
| **Descripción del requisito** | El sistema deberá permitir al personal del taller aperturar formalmente una orden de servicio técnico para un dispositivo registrado, generando automáticamente un número de folio institucional consecutivo e iniciando la trazabilidad de la reparación. |
| **Detalles adicionales** | Disparador: El personal del taller confirma el ingreso del dispositivo registrado para iniciar formalmente el servicio. Captura de datos: Selección del dispositivo a ingresar y asignación automática del usuario en sesión como responsable de la recepción. Validación: El sistema valida que el dispositivo seleccionado exista, pertenezca a un cliente válido y no cuente con otra orden de reparación activa en curso. Procesamiento: El sistema genera de forma automática un folio legible institucional con formato RP-AAAA-NNNN (donde RP es el identificador del sistema, AAAA el año en curso y NNNN un consecutivo anual de 4 dígitos, p. ej. RP-2026-0001). Asigna a la orden el estado inicial Recibido, fecha y hora actual del servidor, y crea el primer evento en la línea de tiempo. Almacenamiento: Guarda la orden de reparación con su folio único, identificador del dispositivo, fecha de recepción, estado Recibido y el usuario responsable. Resultado esperado: El sistema despliega la pantalla de la orden creada mostrando el folio asignado, los datos del equipo y del cliente, y permite continuar con el registro del estado inicial y fallas. Manejo de errores: Si el dispositivo ya cuenta con una orden abierta en proceso, el sistema impide la creación y muestra el mensaje: "El dispositivo ya cuenta con una orden activa en proceso (Folio: \[Folio\_Existente\])". Si ocurre una falla al generar el consecutivo, la operación se revierte y se notifica al usuario para reintentar. |


#### **RF-05 Registro del estado inicial**

| **Campo** | **Detalle** |
| --- | --- |
| **Número de requisito** | RF-05 |
| **Nombre del requisito** | Registro del estado inicial |
| **Tipo** | ☑ Requisito funcional   ☐ Restricción |
| **Fuente del requisito** | Cliente (taller) / Usuario final |
| **Prioridad del requisito** | ☑ Alta / Esencial   ☐ Media / Deseado   ☐ Baja / Opcional |
| **Descripción del requisito** | Al aperturar la orden, el sistema deberá permitir al personal del taller registrar la falla reportada por el cliente, las condiciones físicas de recepción, los accesorios entregados y al menos una fotografía de evidencia del estado en que llegó el equipo. |
| **Detalles adicionales** | Disparador: El personal del taller se encuentra en el formulario de creación o detalle inicial de una orden con estado Recibido. Captura de datos: Descripción de la falla reportada por el cliente, descripción textual de las condiciones físicas del equipo (detalles de carcasa, pantalla, golpes o rayones), selección de accesorios recibidos mediante casillas (cargador, funda, tarjeta SIM, memoria SD, ninguno u otros) y selección de mínimo un archivo fotográfico de recepción. Validación: El sistema comprueba que la descripción de la falla contenga texto, que se especifique la condición física y que se haya adjuntado al menos una fotografía válida (formatos JPG o PNG). Procesamiento: El sistema vincula la información diagnóstica inicial a la orden de reparación y clasifica los archivos fotográficos cargados bajo la categoría de recepción (etapa antes). Almacenamiento: Se actualiza la orden de reparación con los campos de falla, condición inicial y accesorios, y se guardan los archivos fotográficos asociados a la orden. Resultado esperado: El estado inicial queda asentado de manera permanente en la orden, visible en el detalle del servicio y listo para ser integrado en el certificado final de entrega. Manejo de errores: Si el usuario intenta guardar sin ingresar la descripción de la falla o sin adjuntar al menos una fotografía de recepción, el sistema muestra: "Debe describir la falla reportada y adjuntar al menos una fotografía del estado inicial del dispositivo". Una vez que la orden avanza a la etapa de Diagnóstico, el estado inicial queda bloqueado para edición. |


#### **RF-06 Línea de tiempo y cambio de estado**

| **Campo** | **Detalle** |
| --- | --- |
| **Número de requisito** | RF-06 |
| **Nombre del requisito** | Línea de tiempo y cambio de estado |
| **Tipo** | ☑ Requisito funcional   ☐ Restricción |
| **Fuente del requisito** | Cliente (taller) |
| **Prioridad del requisito** | ☑ Alta / Esencial   ☐ Media / Deseado   ☐ Baja / Opcional |
| **Descripción del requisito** | El sistema deberá registrar y controlar el avance progresivo de la orden de reparación a través de una secuencia estricta de estados, registrando en una línea de tiempo cada transición con su fecha, hora, usuario responsable y una nota descriptiva obligatoria. |
| **Detalles adicionales** | Disparador: El personal del taller presiona la acción de "Avanzar estado" en la vista de detalle de la orden de reparación. Captura de datos: Selección del siguiente estado y redacción obligatoria de una nota explicativa del progreso técnico (por ejemplo, diagnóstico técnico, reparaciones ejecutadas o pruebas concluidas). Validación: El sistema verifica que la nota explicativa contenga al menos 5 caracteres y que la transición solicitada cumpla con la secuencia estrictamente lineal y no regresiva: Recibido -> Diagnóstico -> Reparación -> Pruebas -> Entregado. No se permite saltar etapas ni retroceder a estados previos. Procesamiento: El sistema actualiza el estado general de la orden al nuevo estado correspondiente, captura la fecha y hora del sistema, y crea un nuevo evento inmutable en el historial cronológico. Si el estado a registrar es Entregado, el sistema detona las validaciones para la emisión del certificado digital. Almacenamiento: Registra un nuevo evento cronológico asociado a la orden con el estado alcanzado, la nota técnica, la fecha/hora y el identificador del personal del taller en sesión. Resultado esperado: La interfaz actualiza el indicador visual de la etapa actual de la orden y agrega el nuevo hito a la línea de tiempo visible en pantalla. Manejo de errores: Si el campo de nota técnica está vacío, el sistema indica: "Debe ingresar una nota descriptiva para cambiar el estado". Si se intenta forzar una transición fuera de la secuencia autorizada, el sistema rechaza la operación informando que el flujo debe seguir la secuencia establecida. |


#### **RF-07 Carga de evidencias fotográficas**

| **Campo** | **Detalle** |
| --- | --- |
| **Número de requisito** | RF-07 |
| **Nombre del requisito** | Carga de evidencias fotográficas |
| **Tipo** | ☑ Requisito funcional   ☐ Restricción |
| **Fuente del requisito** | Cliente (taller) / Usuario final |
| **Prioridad del requisito** | ☑ Alta / Esencial   ☐ Media / Deseado   ☐ Baja / Opcional |
| **Descripción del requisito** | El sistema deberá permitir al personal del taller subir y visualizar fotografías que documenten el estado físico del dispositivo tanto en la recepción inicial como al finalizar el trabajo técnico, clasificándolas como evidencias de «antes» o «después». |
| **Detalles adicionales** | Disparador: El personal del taller pulsa la opción de "Subir fotografía" desde el formulario inicial o desde la galería de evidencias en el detalle de la orden. Captura de datos: Selección del archivo de imagen desde el explorador del dispositivo o cámara, y selección de la clasificación correspondiente (antes o después). Validación: El sistema valida que el archivo seleccionado tenga extensión de imagen permitida (JPG, JPEG o PNG). Procesamiento: El sistema procesa el archivo de imagen, optimiza su almacenamiento y lo asocia a la orden de reparación correspondiente con su etiqueta de etapa y fecha de carga. Almacenamiento: Guarda la referencia y ubicación del archivo fotográfico, vinculado al identificador de la orden, la etapa correspondiente (antes o después) y la fecha de carga. Resultado esperado: La fotografía aparece de forma inmediata en la galería visual de la orden, clasificada en la sección correspondiente (antes o después). Manejo de errores: Si el archivo no es una imagen permitida o excede los 5 MB, el sistema emite el mensaje: "Formato no válido o tamaño excedido ( JPG o PNG)". Si ya se alcanzó el límite de 5 fotos en la etapa seleccionada, el sistema indica: "Límite de 5 fotografías alcanzado para esta etapa". Si la orden ya se encuentra en estado Entregado, no se permite eliminar ni sustituir fotografías. |


#### **RF-08 Registro de piezas reemplazadas**

| **Campo** | **Detalle** |
| --- | --- |
| **Número de requisito** | RF-08 |
| **Nombre del requisito** | Registro de piezas reemplazadas |
| **Tipo** | ☑ Requisito funcional   ☐ Restricción |
| **Fuente del requisito** | Cliente (taller) |
| **Prioridad del requisito** | ☑ Alta / Esencial   ☐ Media / Deseado   ☐ Baja / Opcional |
| **Descripción del requisito** | El sistema deberá permitir al personal del taller registrar los componentes o refacciones sustituidos durante el proceso de reparación, detallando su nombre, tipo y número de serie cuando aplique. |
| **Detalles adicionales** | Disparador: El personal del taller pulsa el botón "Agregar pieza" en la sección de refacciones dentro del detalle de una orden en etapa de Diagnóstico o Reparación. Captura de datos: Nombre de la refacción o componente (p. ej., "Batería", "Módulo de pantalla"), tipo o categoría de la pieza (seleccionable entre: Original, Compatible o Reacondicionada), y número de serie o lote de la refacción (campo opcional). Validación: El sistema verifica que el nombre de la pieza no esté vacío y que se haya seleccionado un tipo de pieza válido dentro de las opciones establecidas. Procesamiento: El sistema asocia la refacción a la orden de servicio en curso y actualiza el listado de componentes sustituidos. Almacenamiento: Registra la pieza con su nombre, tipo, número de serie (si fue ingresado) y vínculo a la orden de reparación. Resultado esperado: La refacción queda listada en la tabla de piezas de la orden, mostrando su tipo y descripción, para ser incorporada posteriormente al certificado digital. Manejo de errores: Si el nombre de la pieza está vacío o no se seleccionó el tipo, el sistema marca el campo correspondiente y muestra: "El nombre y tipo de la refacción son obligatorios". En órdenes con estado Entregado queda bloqueada la adición, edición o eliminación de piezas. |


#### **RF-09 Registro de garantía**

| **Campo** | **Detalle** |
| --- | --- |
| **Número de requisito** | RF-09 |
| **Nombre del requisito** | Registro de garantía |
| **Tipo** | ☑ Requisito funcional   ☐ Restricción |
| **Fuente del requisito** | Cliente (taller) |
| **Prioridad del requisito** | ☑ Alta / Esencial   ☐ Media / Deseado   ☐ Baja / Opcional |
| **Descripción del requisito** | El sistema deberá permitir al personal del taller registrar las condiciones y el periodo de garantía ofrecido sobre la reparación, calculando automáticamente su fecha límite de vigencia a partir del momento de la entrega del equipo. |
| **Detalles adicionales** | Disparador: El personal del taller ingresa al apartado de garantía en el detalle de la orden antes de marcarla como entregada. Captura de datos: Duración de la garantía expresada en número de días naturales (p. ej., 30, 60, 90 días) y descripción textual detallada de la cobertura (indicando qué fallas cubre, exclusiones por humedad o caídas y términos aplicables). Validación: El sistema comprueba que la duración sea un valor numérico entero mayor o igual a cero y que la descripción de la cobertura no esté vacía. Procesamiento: El sistema registra los términos de la garantía. Cuando la orden pasa al estado Entregado, el sistema toma la fecha y hora de entrega como fecha de inicio y calcula la fecha de vencimiento (fecha\_fin = fecha\_entrega + días de garantía). Asimismo, evalúa la vigencia en tiempo real comparando la fecha actual contra la fecha de vencimiento. Almacenamiento: Almacena los días de cobertura, la descripción de términos, la fecha de inicio calculada y la fecha de vencimiento vinculadas a la orden. Resultado esperado: El sistema muestra el periodo de garantía en la orden y el indicador de estado correspondiente (Vigente si la fecha actual es menor o igual a la de vencimiento, o Vencida si ha sido superada). Manejo de errores: Si el personal del taller intenta avanzar la orden a estado Entregado sin haber registrado previamente la garantía, el sistema bloquea el cambio de estado y muestra el mensaje: "Debe registrar los términos y días de garantía antes de finalizar y entregar la orden". |


#### **RF-10 Generación del certificado digital**

| **Campo** | **Detalle** |
| --- | --- |
| **Número de requisito** | RF-10 |
| **Nombre del requisito** | Generación del certificado digital |
| **Tipo** | ☑ Requisito funcional   ☐ Restricción |
| **Fuente del requisito** | Cliente (taller) |
| **Prioridad del requisito** | ☑ Alta / Esencial   ☐ Media / Deseado   ☐ Baja / Opcional |
| **Descripción del requisito** | El sistema deberá generar automáticamente un certificado digital consolidado al marcar la orden como entregada, recopilando el historial completo de la reparación, datos del equipo, piezas, garantía y generando un identificador único para su consulta pública imprimible. |
| **Detalles adicionales** | Disparador: El personal del taller confirma el cambio de estado de la orden a Entregado. Captura de datos: El sistema toma de forma automática la información recopilada en la orden: folio, datos del cliente y dispositivo, falla y condición inicial, historial de la línea de tiempo, piezas reemplazadas, garantía y fotografías de antes y después. Validación: El sistema verifica el cumplimiento estricto de los requisitos de cierre: (a) contar con al menos una fotografía de recepción ("antes"), (b) contar con al menos una fotografía de entrega terminada ("después"), (c) tener registrada la garantía con sus días y términos, y (d) haber transitado por las fases de Diagnóstico, Reparación y Pruebas. Procesamiento: El sistema genera un identificador único alfanumérico global (token UUID) no secuencial para la consulta pública, fija la fecha y hora de emisión del certificado, bloquea la orden para evitar modificaciones futuras y habilita la vista de certificado digital imprimible. Almacenamiento: Almacena el registro del certificado con su token identificador, fecha y hora de emisión, asociado a la orden de reparación. Resultado esperado: El sistema muestra el certificado digital con su formato formal de entrega listo para imprimir o guardar como PDF desde el navegador web, integrando el código QR generado para la validación del cliente. Manejo de errores: Si la orden no cumple con todos los requisitos previos (por ejemplo, falta la foto de entrega o no se registró garantía), el sistema detiene la emisión del certificado, no cambia el estado a Entregado y muestra una lista puntual de los elementos pendientes por completar. |


#### **RF-11 Generación del código QR**

| **Campo** | **Detalle** |
| --- | --- |
| **Número de requisito** | RF-11 |
| **Nombre del requisito** | Generación del código QR |
| **Tipo** | ☑ Requisito funcional   ☐ Restricción |
| **Fuente del requisito** | Cliente (taller) / Usuario final |
| **Prioridad del requisito** | ☑ Alta / Esencial   ☐ Media / Deseado   ☐ Baja / Opcional |
| **Descripción del requisito** | El sistema deberá generar automáticamente una imagen de código QR bidimensional vinculada a la dirección web pública de verificación del certificado, incrustándola en la vista imprimible para permitir su escaneo |
| **Detalles adicionales** | Disparador: Se emite el certificado digital tras concretarse la entrega de la orden de reparación (RF-10). Captura de datos: El sistema utiliza el token único asignado al certificado digital y la dirección web base del dominio del sistema. Validación: El sistema comprueba que el token del certificado exista, sea válido y corresponda a una orden efectivamente finalizada en estado Entregado. Procesamiento: El sistema construye la URL de acceso público con la estructura https://<dominio>/verificar/<token> y genera a partir de ella la matriz gráfica del código QR en formato de imagen de alta resolución. Almacenamiento: El enlace queda asociado permanentemente al certificado digital para permitir su renderizado dinámico en pantalla y en la versión de impresión. Resultado esperado: El código QR se presenta visible en la esquina superior del certificado digital y en la nota física imprimible, permitiendo que cualquier persona que lo escanee sea dirigida inmediatamente a la página de verificación. Manejo de errores: Si ocurre una anomalía al generar la imagen gráfica del código QR, el sistema reintenta la renderización de la imagen a partir de la URL guardada sin afectar los datos de la orden ni del certificado. |


#### **RF-12 Página pública de verificación**

| **Campo** | **Detalle** |
| --- | --- |
| **Número de requisito** | RF-12 |
| **Nombre del requisito** | Página pública de verificación |
| **Tipo** | ☑ Requisito funcional   ☐ Restricción |
| **Fuente del requisito** | Usuario final |
| **Prioridad del requisito** | ☑ Alta / Esencial   ☐ Media / Deseado   ☐ Baja / Opcional |
| **Descripción del requisito** | El sistema deberá disponer de una página web pública accesible sin inicio de sesión que, al escanear el código QR o acceder al enlace del certificado, muestre el resumen fidedigno de la reparación, la vigencia de la garantía y proteja los datos personales del cliente. |
| **Detalles adicionales** | Disparador: Un cliente o cualquier usuario escanea el código QR de un certificado con su celular o introduce directamente la URL con el token correspondiente en un navegador. Captura de datos: El parámetro de identificación (token) presente en la dirección web solicitada. Validación: El sistema valida que el token recibido exista en el registro de certificados emitidos y que corresponda a una orden válida. Procesamiento: El sistema recupera los datos asociados a la reparación: folio, marca y modelo del equipo, tipo de dispositivo, fecha de recepción y entrega, fallas reportadas, piezas sustituidas, fotografías comparativas de antes y después, y términos de la garantía. Por privacidad del cliente, el sistema enmascara el IMEI mostrando únicamente los últimos 4 dígitos (p. ej., \*\*\*\*\*\*\*\*\*\*\*1234) y omite totalmente el nombre, teléfono y correo del cliente. Además, calcula y muestra si la garantía se encuentra actualmente Vigente o Vencida. Almacenamiento: Este requerimiento opera en modo de solo lectura; no realiza modificaciones ni escrituras en la base de datos. Resultado esperado: El usuario visualiza una pantalla limpia y responsiva que certifica la autenticidad del servicio técnico brindado por el taller, detallando los trabajos realizados, las evidencias fotográficas y el estado de la garantía. Manejo de errores: Si el token no existe en el sistema o es incorrecto, la página muestra un aviso claro: "Certificado no encontrado. Verifique que el enlace o código QR corresponda a un certificado emitido por el taller". |


#### **RF-13 Dashboard básico**

| **Campo** | **Detalle** |
| --- | --- |
| **Número de requisito** | RF-13 |
| **Nombre del requisito** | Dashboard básico |
| **Tipo** | ☑ Requisito funcional   ☐ Restricción |
| **Fuente del requisito** | Cliente (taller) |
| **Prioridad del requisito** | ☑ Alta / Esencial   ☐ Media / Deseado   ☐ Baja / Opcional |
| **Descripción del requisito** | El sistema deberá presentar al personal del taller, inmediatamente después de iniciar sesión, un tablero de control con los principales indicadores operativos y una lista de las órdenes de reparación activas. |
| **Detalles adicionales** | Disparador: El personal del taller inicia sesión exitosamente o hace clic en la opción "Dashboard" del menú de navegación. Captura de datos: Identificador del taller y sesión activa del personal. Validación: El sistema valida que el usuario posea una sesión de trabajo activa y autorizada. Procesamiento: El sistema calcula en tiempo real tres indicadores cuantitativos: (a) número de reparaciones activas (órdenes en estado Recibido, Diagnóstico, Reparación o Pruebas), (b) número de reparaciones terminadas (órdenes en estado Entregado), y (c) número de órdenes con garantía actualmente vigente. Asimismo, recopila el listado de órdenes activas ordenadas cronológicamente de la más reciente a la más antigua. Almacenamiento: Consulta de solo lectura que consolida la información existente en la base de datos. Resultado esperado: La pantalla presenta tarjetas visuales con los contadores numéricos y una tabla resumen de órdenes en curso mostrando folio, cliente, dispositivo, estado actual, fecha de recepción y un botón para abrir el detalle de cada orden. Manejo de errores: Si no existen registros en el sistema, los contadores muestran el valor numérico 0 y la tabla muestra el mensaje: "No hay órdenes de reparación activas registradas". Si la sesión expiró mientras se visualizaba el tablero, cualquier interacción redirige a la pantalla de login. |


#### **RF-14 Búsqueda de órdenes**

| **Campo** | **Detalle** |
| --- | --- |
| **Número de requisito** | RF-14 |
| **Nombre del requisito** | Búsqueda de órdenes |
| **Tipo** | ☑ Requisito funcional   ☐ Restricción |
| **Fuente del requisito** | Cliente (taller) |
| **Prioridad del requisito** | ☐ Alta / Esencial   ☑ Media / Deseado   ☐ Baja / Opcional |
| **Descripción del requisito** | El sistema deberá permitir al personal del taller buscar y filtrar órdenes de reparación rápidamente a partir del folio, nombre del cliente, número de teléfono o IMEI/serie del equipo. |
| **Detalles adicionales** | Disparador: El personal del taller introduce texto en la barra de búsqueda ubicada en el panel principal o listado de órdenes. Captura de datos: Cadena de texto de búsqueda introducida por el usuario. Validación: El sistema valida que el término de búsqueda contenga al menos 3 caracteres antes de ejecutar la consulta para evitar saturación de resultados imprecisos. Procesamiento: El sistema busca coincidencias parciales o exactas (sin distinguir mayúsculas de minúsculas) en los campos de folio, nombre del cliente, teléfono registrado, número de serie o IMEI del dispositivo. Almacenamiento: Operación de solo consulta de datos. Resultado esperado: La interfaz actualiza la tabla de resultados mostrando únicamente las órdenes que coinciden con el criterio ingresado, desplegando su folio, nombre del cliente, equipo, estado y fecha de ingreso, permitiendo hacer clic para abrir su expediente completo. Manejo de errores: Si la búsqueda no arroja coincidencias, el sistema muestra el mensaje: "No se encontraron órdenes de reparación que coincidan con el criterio ingresado", ofreciendo un botón para limpiar el filtro y volver a ver la lista general. |


#### **RF-15 Historial del dispositivo**

| **Campo** | **Detalle** |
| --- | --- |
| **Número de requisito** | RF-15 |
| **Nombre del requisito** | Historial del dispositivo |
| **Tipo** | ☑ Requisito funcional   ☐ Restricción |
| **Fuente del requisito** | Análisis del problema |
| **Prioridad del requisito** | ☐ Alta / Esencial   ☐ Media / Deseado   ☑ Baja / Opcional |
| **Descripción del requisito** | El sistema deberá recopilar y mostrar el historial acumulado de todas las reparaciones certificadas que ha tenido un mismo dispositivo a lo largo del tiempo, identificándose mediante su IMEI o número de serie. |
| **Detalles adicionales** | Disparador: El personal del taller consulta el expediente de un dispositivo en el panel interno, o un cliente visualiza la sección de historial en la página pública del certificado. Captura de datos: Número de IMEI o número de serie del dispositivo seleccionado. Validación: El sistema valida que el identificador del equipo (IMEI o serie) exista en el registro histórico del sistema. Procesamiento: El sistema busca todas las órdenes de servicio en estado Entregado asociadas a dicho IMEI o serie, ordenándose de forma descendente por fecha de entrega. En el panel interno del taller se presenta el desglose completo de folios y fallas previas; en la página pública se muestra un contador con la leyenda de cuántas reparaciones certificadas acumula el equipo. Almacenamiento: Consulta consolidada de solo lectura a partir de las relaciones históricas entre dispositivos y órdenes de servicio. Resultado esperado: En el panel interno, el personal del taller ve el listado cronológico de reparaciones anteriores con enlaces a sus órdenes pasadas; en la página pública, el cliente ve el historial con el número total de servicios certificados registrados en el taller para ese dispositivo. Manejo de errores: Si el dispositivo no cuenta con reparaciones previas concluidas, el sistema muestra la leyenda: "Primera reparación certificada registrada para este equipo". |


    1. **Requisitos no funcionales**
        1. **Requisitos de rendimiento**

**RNF-01**: El sistema debe funcionar correctamente con al menos 5 usuarios del taller y 10 consultas públicas al mismo tiempo.

        1. **Seguridad**

**RNF-01:** El sitio desplegado debe usar HTTPS (normalmente lo proporciona el hosting).

**RNF-02:** La página pública no muestra teléfono ni correo del cliente y enmascara el IMEI; el token de la URL es un UUID aleatorio.

**RNF-02:** Las contraseñas de la base de datos y la clave del JWT se guardan en variables de entorno y nunca se suben a GitHub.

        1. **Fiabilidad**

**RNF-01:** Si falla cualquier paso al generar el certificado, no debe quedar un certificado a medias (se guarda todo junto o nada, usando una transacción de base de datos).

        1.  **Disponibilidad**

**RNF-01**: El sistema debe estar desplegado y accesible por Internet al menos durante la última semana del proyecto y el día de la demostración.

        1. **Mantenibilidad**

**RNF-01:** El código se guarda en un repositorio de GitHub; cada integrante trabaja en su propia rama y se une a la rama principal con pull request revisado por otro compañero.

**RNF-02:** El mantenimiento durante el proyecto lo realiza el propio equipo de desarrollo.

        1. **Portabilidad**

**RNF-01:** El sistema debe funcionar en las versiones actuales de Chrome, Safari, Firefox y Edge, en computadora y celular (Android e iOS), sin instalar aplicaciones.

1. **Otros requisitos**

**Legales:** El sistema sólo documenta la garantía que ofrece el taller; la responsabilidad de cumplirla conforme a la Ley Federal de Protección al Consumidor es del taller. 


