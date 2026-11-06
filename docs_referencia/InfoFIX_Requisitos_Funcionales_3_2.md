# InfoFIX – Especificación de Requerimientos de Software

**Equipo InfoPapus** | Universidad de Guadalajara – CUCEI

Actualización de Requisitos Funcionales (Sección 3.2)

## 3.2 Requisitos Funcionales

---A continuación se detallan las especificaciones funcionales de InfoFIX (RF-01 a RF-15), estructuradas bajo el modelo operativo de especificación detallada: indicando claramente qué hará el sistema, quién lo hará, cuándo, con qué datos, qué reglas de validación y almacenamiento aplican, cuál es el resultado esperado y cómo se gestionan los errores y situaciones anormales.

### 3.2.1 RF-01 Inicio de sesión del personal del taller

| **Número de requisito** | **RF-01** |
| --- | --- |
| **Nombre del requisito** | **Inicio de sesión del personal del taller** |
| **Tipo** | \[X\] Requisito funcional     \[ \] Restricción |
| **Fuente del requisito** | Cliente (taller) |
| **Prioridad del requisito** | **Alta / Esencial** |
| **Descripción del requisito** | El sistema deberá permitir al personal del taller iniciar sesión mediante su correo electrónico y contraseña registrados, autenticando su identidad para conceder acceso a las funciones operativas del panel interno. |
| **Detalles adicionales** | **Detalle del funcionamiento:** - **Disparador:** El personal del taller intenta acceder a cualquier módulo interno o abre la dirección web de acceso al sistema desde su navegador. - **Captura de datos:** El usuario ingresa su correo electrónico registrado y su contraseña de acceso en el formulario. - **Validación:** El sistema comprueba que ambos campos contengan texto y que el correo electrónico cumpla con una estructura sintáctica estándar. - **Procesamiento:** El sistema contrasta las credenciales contra el registro de usuarios autorizados del taller y valida la correspondencia de la contraseña para generar la sesión activa de trabajo. - **Almacenamiento:** Registra el inicio de sesión y establece la vigencia temporal de la sesión del usuario. - **Resultado esperado:** El sistema autoriza el ingreso, habilita el acceso a las funciones de administración y redirige al usuario a la vista principal del Dashboard. - **Manejo de errores:** Si el correo o la contraseña no coinciden con los registros, el sistema muestra el mensaje: "Correo o contraseña incorrectos", manteniendo limpios los campos para un nuevo intento sin revelar cuál de los dos datos fue el erróneo. Si se intenta ingresar a una sección interna sin sesión activa o con la sesión vencida, el sistema bloquea la vista y redirige automáticamente a la pantalla de inicio de sesión. |

### 3.2.2 RF-02 Registro de clientes

| **Número de requisito** | **RF-02** |
| --- | --- |
| **Nombre del requisito** | **Registro de clientes** |
| **Tipo** | \[X\] Requisito funcional     \[ \] Restricción |
| **Fuente del requisito** | Cliente (taller) |
| **Prioridad del requisito** | **Alta / Esencial** |
| **Descripción del requisito** | El sistema deberá permitir al personal del taller registrar los datos generales de contacto de un nuevo cliente que entrega un equipo para reparación, así como buscar y reutilizar la información de clientes previamente registrados. |
| **Detalles adicionales** | **Detalle del funcionamiento:** - **Disparador:** El personal del taller inicia la recepción de un servicio técnico o ingresa al módulo de clientes. - **Captura de datos:** Nombre completo, número de teléfono (10 dígitos), correo electrónico (opcional) y confirmación de aceptación del aviso de privacidad. - **Validación:** El sistema comprueba que el nombre completo no esté vacío, que el número de teléfono contenga exactamente 10 dígitos numéricos, que el correo electrónico (si se ingresa) tenga un formato válido y que la casilla del aviso de privacidad esté marcada obligatoriamente. - **Procesamiento:** El sistema consulta si el número de teléfono ya pertenece a un cliente existente. Si existe, muestra los datos para su selección inmediata; si es un cliente nuevo, prepara el alta del nuevo registro asociándolo a la fecha y hora actual. - **Almacenamiento:** Almacena los datos del cliente (nombre, teléfono, correo y fecha de registro) en el catálogo general de clientes. - **Resultado esperado:** El cliente queda registrado o seleccionado en pantalla, habilitando la vinculación de su dispositivo y la creación de su orden de reparación. - **Manejo de errores:** Si falta algún dato obligatorio, si el teléfono no tiene 10 dígitos o si no se acepta el aviso de privacidad, el sistema resalta los campos incorrectos con un mensaje específico (p. ej., "El número de teléfono debe contener exactamente 10 dígitos") y no permite continuar hasta corregir la información. |

### 3.2.3 RF-03 Registro de dispositivos

| **Número de requisito** | **RF-03** |
| --- | --- |
| **Nombre del requisito** | **Registro de dispositivos** |
| **Tipo** | \[X\] Requisito funcional     \[ \] Restricción |
| **Fuente del requisito** | Cliente (taller) |
| **Prioridad del requisito** | **Alta / Esencial** |
| **Descripción del requisito** | El sistema deberá permitir al personal del taller registrar las especificaciones de un dispositivo que ingresa a reparación, asociándolo obligatoriamente a un cliente registrado y utilizando su IMEI o número de serie como identificador único. |
| **Detalles adicionales** | **Detalle del funcionamiento:** - **Disparador:** El personal del taller atiende la recepción de un equipo, habiendo seleccionado o registrado previamente al cliente correspondiente. - **Captura de datos:** Tipo de dispositivo (celular, tablet, laptop u otro), marca, modelo, color, número de IMEI o número de serie, y selección del cliente propietario. - **Validación:** El sistema verifica que todos los campos requeridos estén completos. Si el tipo de dispositivo es "celular", valida obligatoriamente que el IMEI contenga exactamente 15 dígitos numéricos; para otros tipos de dispositivo, valida que el número de serie contenga entre 4 y 30 caracteres alfanuméricos. - **Procesamiento:** El sistema consulta si el IMEI o número de serie ya existe en la base de datos. Si el dispositivo ya había ingresado previamente al taller, recupera sus datos y su historial para asociarle una nueva orden; si no existe, crea el registro del dispositivo vinculado al cliente indicado. - **Almacenamiento:** Almacena el dispositivo con su tipo, marca, modelo, color, identificador único (IMEI o serie) y su asociación al identificador del cliente. - **Resultado esperado:** El sistema confirma el alta o selección del equipo y lo deja listo para la apertura de una orden de reparación. - **Manejo de errores:** Si el IMEI no tiene exactamente 15 dígitos o contiene caracteres no numéricos, el sistema muestra: "El IMEI debe contener exactamente 15 dígitos numéricos". Si faltan campos obligatorios, el sistema bloquea el guardado e indica al usuario los datos faltantes. |

### 3.2.4 RF-04 Creación de orden de reparación

| **Número de requisito** | **RF-04** |
| --- | --- |
| **Nombre del requisito** | **Creación de orden de reparación** |
| **Tipo** | \[X\] Requisito funcional     \[ \] Restricción |
| **Fuente del requisito** | Cliente (taller) |
| **Prioridad del requisito** | **Alta / Esencial** |
| **Descripción del requisito** | El sistema deberá permitir al personal del taller aperturar formalmente una orden de servicio técnico para un dispositivo registrado, generando automáticamente un número de folio institucional consecutivo e iniciando la trazabilidad de la reparación. |
| **Detalles adicionales** | **Detalle del funcionamiento:** - **Disparador:** El personal del taller confirma el ingreso del dispositivo registrado para iniciar formalmente el servicio. - **Captura de datos:** Selección del dispositivo a ingresar y asignación automática del usuario en sesión como responsable de la recepción. - **Validación:** El sistema valida que el dispositivo seleccionado exista, pertenezca a un cliente válido y no cuente con otra orden de reparación activa en curso. - **Procesamiento:** El sistema genera de forma automática un folio legible institucional con formato RP-AAAA-NNNN (donde RP es el identificador del sistema, AAAA el año en curso y NNNN un consecutivo anual de 4 dígitos, p. ej. RP-2026-0001). Asigna a la orden el estado inicial Recibido, fecha y hora actual del servidor, y crea el primer evento en la línea de tiempo. - **Almacenamiento:** Guarda la orden de reparación con su folio único, identificador del dispositivo, fecha de recepción, estado Recibido y el usuario responsable. - **Resultado esperado:** El sistema despliega la pantalla de la orden creada mostrando el folio asignado, los datos del equipo y del cliente, y permite continuar con el registro del estado inicial y fallas. - **Manejo de errores:** Si el dispositivo ya cuenta con una orden abierta en proceso, el sistema impide la creación y muestra el mensaje: "El dispositivo ya cuenta con una orden activa en proceso (Folio: \[Folio\_Existente\])". Si ocurre una falla al generar el consecutivo, la operación se revierte y se notifica al usuario para reintentar. |

### 3.2.5 RF-05 Registro del estado inicial

| **Número de requisito** | **RF-05** |
| --- | --- |
| **Nombre del requisito** | **Registro del estado inicial** |
| **Tipo** | \[X\] Requisito funcional     \[ \] Restricción |
| **Fuente del requisito** | Cliente (taller) / Usuario final |
| **Prioridad del requisito** | **Alta / Esencial** |
| **Descripción del requisito** | Al aperturar la orden, el sistema deberá permitir al personal del taller registrar la falla reportada por el cliente, las condiciones físicas de recepción, los accesorios entregados y al menos una fotografía de evidencia del estado en que llegó el equipo. |
| **Detalles adicionales** | **Detalle del funcionamiento:** - **Disparador:** El personal del taller se encuentra en el formulario de creación o detalle inicial de una orden con estado Recibido. - **Captura de datos:** Descripción de la falla reportada por el cliente, descripción textual de las condiciones físicas del equipo (detalles de carcasa, pantalla, golpes o rayones), selección de accesorios recibidos mediante casillas (cargador, funda, tarjeta SIM, memoria SD, ninguno u otros) y selección de mínimo un archivo fotográfico de recepción. - **Validación:** El sistema comprueba que la descripción de la falla contenga texto, que se especifique la condición física y que se haya adjuntado al menos una fotografía válida (formatos JPG o PNG, máximo 5 MB por archivo). - **Procesamiento:** El sistema vincula la información diagnóstica inicial a la orden de reparación y clasifica los archivos fotográficos cargados bajo la categoría de recepción (etapa antes). - **Almacenamiento:** Se actualiza la orden de reparación con los campos de falla, condición inicial y accesorios, y se guardan los archivos fotográficos asociados a la orden. - **Resultado esperado:** El estado inicial queda asentado de manera permanente en la orden, visible en el detalle del servicio y listo para ser integrado en el certificado final de entrega. - **Manejo de errores:** Si el usuario intenta guardar sin ingresar la descripción de la falla o sin adjuntar al menos una fotografía de recepción, el sistema muestra: "Debe describir la falla reportada y adjuntar al menos una fotografía del estado inicial del dispositivo". Una vez que la orden avanza a la etapa de Diagnóstico, el estado inicial queda bloqueado para edición. |

### 3.2.6 RF-06 Línea de tiempo y cambio de estado

| **Número de requisito** | **RF-06** |
| --- | --- |
| **Nombre del requisito** | **Línea de tiempo y cambio de estado** |
| **Tipo** | \[X\] Requisito funcional     \[ \] Restricción |
| **Fuente del requisito** | Cliente (taller) |
| **Prioridad del requisito** | **Alta / Esencial** |
| **Descripción del requisito** | El sistema deberá registrar y controlar el avance progresivo de la orden de reparación a través de una secuencia estricta de estados, registrando en una línea de tiempo cada transición con su fecha, hora, usuario responsable y una nota descriptiva obligatoria. |
| **Detalles adicionales** | **Detalle del funcionamiento:** - **Disparador:** El personal del taller presiona la acción de "Avanzar estado" en la vista de detalle de la orden de reparación. - **Captura de datos:** Selección del siguiente estado y redacción obligatoria de una nota explicativa del progreso técnico (por ejemplo, diagnóstico técnico, reparaciones ejecutadas o pruebas concluidas). - **Validación:** El sistema verifica que la nota explicativa contenga al menos 5 caracteres y que la transición solicitada cumpla con la secuencia estrictamente lineal y no regresiva: Recibido -> Diagnóstico -> Reparación -> Pruebas -> Entregado. No se permite saltar etapas ni retroceder a estados previos. - **Procesamiento:** El sistema actualiza el estado general de la orden al nuevo estado correspondiente, captura la fecha y hora del sistema, y crea un nuevo evento inmutable en el historial cronológico. Si el estado a registrar es Entregado, el sistema detona las validaciones para la emisión del certificado digital. - **Almacenamiento:** Registra un nuevo evento cronológico asociado a la orden con el estado alcanzado, la nota técnica, la fecha/hora y el identificador del personal del taller en sesión. - **Resultado esperado:** La interfaz actualiza el indicador visual de la etapa actual de la orden y agrega el nuevo hito a la línea de tiempo visible en pantalla. - **Manejo de errores:** Si el campo de nota técnica está vacío, el sistema indica: "Debe ingresar una nota descriptiva para cambiar el estado". Si se intenta forzar una transición fuera de la secuencia autorizada, el sistema rechaza la operación informando que el flujo debe seguir la secuencia establecida. |

### 3.2.7 RF-07 Carga de evidencias fotográficas

| **Número de requisito** | **RF-07** |
| --- | --- |
| **Nombre del requisito** | **Carga de evidencias fotográficas** |
| **Tipo** | \[X\] Requisito funcional     \[ \] Restricción |
| **Fuente del requisito** | Cliente (taller) / Usuario final |
| **Prioridad del requisito** | **Alta / Esencial** |
| **Descripción del requisito** | El sistema deberá permitir al personal del taller subir y visualizar fotografías que documenten el estado físico del dispositivo tanto en la recepción inicial como al finalizar el trabajo técnico, clasificándolas como evidencias de «antes» o «después». |
| **Detalles adicionales** | **Detalle del funcionamiento:** - **Disparador:** El personal del taller pulsa la opción de "Subir fotografía" desde el formulario inicial o desde la galería de evidencias en el detalle de la orden. - **Captura de datos:** Selección del archivo de imagen desde el explorador del dispositivo o cámara, y selección de la clasificación correspondiente (antes o después). - **Validación:** El sistema valida que el archivo seleccionado tenga extensión de imagen permitida (JPG, JPEG o PNG), que su tamaño no supere los 5 MB por archivo, y que no se sobrepase el límite máximo de 5 fotografías para la etapa antes y 5 fotografías para la etapa después. - **Procesamiento:** El sistema procesa el archivo de imagen, optimiza su almacenamiento y lo asocia a la orden de reparación correspondiente con su etiqueta de etapa y fecha de carga. - **Almacenamiento:** Guarda la referencia y ubicación del archivo fotográfico, vinculado al identificador de la orden, la etapa correspondiente (antes o después) y la fecha de carga. - **Resultado esperado:** La fotografía aparece de forma inmediata en la galería visual de la orden, clasificada en la sección correspondiente (antes o después). - **Manejo de errores:** Si el archivo no es una imagen permitida o excede los 5 MB, el sistema emite el mensaje: "Formato no válido o tamaño excedido (máximo 5 MB en formato JPG o PNG)". Si ya se alcanzó el límite de 5 fotos en la etapa seleccionada, el sistema indica: "Límite de 5 fotografías alcanzado para esta etapa". Si la orden ya se encuentra en estado Entregado, no se permite eliminar ni sustituir fotografías. |

### 3.2.8 RF-08 Registro de piezas reemplazadas

| **Número de requisito** | **RF-08** |
| --- | --- |
| **Nombre del requisito** | **Registro de piezas reemplazadas** |
| **Tipo** | \[X\] Requisito funcional     \[ \] Restricción |
| **Fuente del requisito** | Cliente (taller) / Usuario final |
| **Prioridad del requisito** | **Alta / Esencial** |
| **Descripción del requisito** | El sistema deberá permitir al personal del taller registrar los componentes o refacciones sustituidos durante el proceso de reparación, detallando su nombre, tipo y número de serie cuando aplique. |
| **Detalles adicionales** | **Detalle del funcionamiento:** - **Disparador:** El personal del taller pulsa el botón "Agregar pieza" en la sección de refacciones dentro del detalle de una orden en etapa de Diagnóstico o Reparación. - **Captura de datos:** Nombre de la refacción o componente (p. ej., "Batería", "Módulo de pantalla"), tipo o categoría de la pieza (seleccionable entre: Original, Compatible o Reacondicionada), y número de serie o lote de la refacción (campo opcional). - **Validación:** El sistema verifica que el nombre de la pieza no esté vacío y que se haya seleccionado un tipo de pieza válido dentro de las opciones establecidas. - **Procesamiento:** El sistema asocia la refacción a la orden de servicio en curso y actualiza el listado de componentes sustituidos. - **Almacenamiento:** Registra la pieza con su nombre, tipo, número de serie (si fue ingresado) y vínculo a la orden de reparación. - **Resultado esperado:** La refacción queda listada en la tabla de piezas de la orden, mostrando su tipo y descripción, para ser incorporada posteriormente al certificado digital. - **Manejo de errores:** Si el nombre de la pieza está vacío o no se seleccionó el tipo, el sistema marca el campo correspondiente y muestra: "El nombre y tipo de la refacción son obligatorios". En órdenes con estado Entregado queda bloqueada la adición, edición o eliminación de piezas. |

### 3.2.9 RF-09 Registro de garantía

| **Número de requisito** | **RF-09** |
| --- | --- |
| **Nombre del requisito** | **Registro de garantía** |
| **Tipo** | \[X\] Requisito funcional     \[ \] Restricción |
| **Fuente del requisito** | Cliente (taller) |
| **Prioridad del requisito** | **Alta / Esencial** |
| **Descripción del requisito** | El sistema deberá permitir al personal del taller registrar las condiciones y el periodo de garantía ofrecido sobre la reparación, calculando automáticamente su fecha límite de vigencia a partir del momento de la entrega del equipo. |
| **Detalles adicionales** | **Detalle del funcionamiento:** - **Disparador:** El personal del taller ingresa al apartado de garantía en el detalle de la orden antes de marcarla como entregada. - **Captura de datos:** Duración de la garantía expresada en número de días naturales (p. ej., 30, 60, 90 días) y descripción textual detallada de la cobertura (indicando qué fallas cubre, exclusiones por humedad o caídas y términos aplicables). - **Validación:** El sistema comprueba que la duración sea un valor numérico entero mayor o igual a cero y que la descripción de la cobertura no esté vacía. - **Procesamiento:** El sistema registra los términos de la garantía. Cuando la orden pasa al estado Entregado, el sistema toma la fecha y hora de entrega como fecha de inicio y calcula la fecha de vencimiento (fecha\_fin = fecha\_entrega + días de garantía). Asimismo, evalúa la vigencia en tiempo real comparando la fecha actual contra la fecha de vencimiento. - **Almacenamiento:** Almacena los días de cobertura, la descripción de términos, la fecha de inicio calculada y la fecha de vencimiento vinculadas a la orden. - **Resultado esperado:** El sistema muestra el periodo de garantía en la orden y el indicador de estado correspondiente (Vigente si la fecha actual es menor o igual a la de vencimiento, o Vencida si ha sido superada). - **Manejo de errores:** Si el personal del taller intenta avanzar la orden a estado Entregado sin haber registrado previamente la garantía, el sistema bloquea el cambio de estado y muestra el mensaje: "Debe registrar los términos y días de garantía antes de finalizar y entregar la orden". |

### 3.2.10 RF-10 Generación del certificado digital

| **Número de requisito** | **RF-10** |
| --- | --- |
| **Nombre del requisito** | **Generación del certificado digital** |
| **Tipo** | \[X\] Requisito funcional     \[ \] Restricción |
| **Fuente del requisito** | Cliente (taller) |
| **Prioridad del requisito** | **Alta / Esencial** |
| **Descripción del requisito** | El sistema deberá generar automáticamente un certificado digital consolidado al marcar la orden como entregada, recopilando el historial completo de la reparación, datos del equipo, piezas, garantía y generando un identificador único para su consulta pública imprimible. |
| **Detalles adicionales** | **Detalle del funcionamiento:** - **Disparador:** El personal del taller confirma el cambio de estado de la orden a Entregado. - **Captura de datos:** El sistema toma de forma automática la información recopilada en la orden: folio, datos del cliente y dispositivo, falla y condición inicial, historial de la línea de tiempo, piezas reemplazadas, garantía y fotografías de antes y después. - **Validación:** El sistema verifica el cumplimiento estricto de los requisitos de cierre: (a) contar con al menos una fotografía de recepción ("antes"), (b) contar con al menos una fotografía de entrega terminada ("después"), (c) tener registrada la garantía con sus días y términos, y (d) haber transitado por las fases de Diagnóstico, Reparación y Pruebas. - **Procesamiento:** El sistema genera un identificador único alfanumérico global (token UUID) no secuencial para la consulta pública, fija la fecha y hora de emisión del certificado, bloquea la orden para evitar modificaciones futuras y habilita la vista de certificado digital imprimible. - **Almacenamiento:** Almacena el registro del certificado con su token identificador, fecha y hora de emisión, asociado a la orden de reparación. - **Resultado esperado:** El sistema muestra el certificado digital con su formato formal de entrega listo para imprimir o guardar como PDF desde el navegador web, integrando el código QR generado para la validación del cliente. - **Manejo de errores:** Si la orden no cumple con todos los requisitos previos (por ejemplo, falta la foto de entrega o no se registró garantía), el sistema detiene la emisión del certificado, no cambia el estado a Entregado y muestra una lista puntual de los elementos pendientes por completar. |

### 3.2.11 RF-11 Generación del código QR

| **Número de requisito** | **RF-11** |
| --- | --- |
| **Nombre del requisito** | **Generación del código QR** |
| **Tipo** | \[X\] Requisito funcional     \[ \] Restricción |
| **Fuente del requisito** | Cliente (taller) / Usuario final |
| **Prioridad del requisito** | **Alta / Esencial** |
| **Descripción del requisito** | El sistema deberá generar automáticamente una imagen de código QR bidimensional vinculada a la dirección web pública de verificación del certificado, incrustándola en la vista imprimible para permitir su escaneo desde cualquier teléfono celular. |
| **Detalles adicionales** | **Detalle del funcionamiento:** - **Disparador:** Se emite el certificado digital tras concretarse la entrega de la orden de reparación (RF-10). - **Captura de datos:** El sistema utiliza el token único asignado al certificado digital y la dirección web base del dominio del sistema. - **Validación:** El sistema comprueba que el token del certificado exista, sea válido y corresponda a una orden efectivamente finalizada en estado Entregado. - **Procesamiento:** El sistema construye la URL de acceso público con la estructura https://<dominio>/verificar/<token> y genera a partir de ella la matriz gráfica del código QR en formato de imagen de alta resolución. - **Almacenamiento:** El enlace queda asociado permanentemente al certificado digital para permitir su renderizado dinámico en pantalla y en la versión de impresión. - **Resultado esperado:** El código QR se presenta visible en la esquina superior del certificado digital y en la nota física imprimible, permitiendo que cualquier persona que lo escanee sea dirigida inmediatamente a la página de verificación. - **Manejo de errores:** Si ocurre una anomalía al generar la imagen gráfica del código QR, el sistema reintenta la renderización de la imagen a partir de la URL guardada sin afectar los datos de la orden ni del certificado. |

### 3.2.12 RF-12 Página pública de verificación

| **Número de requisito** | **RF-12** |
| --- | --- |
| **Nombre del requisito** | **Página pública de verificación** |
| **Tipo** | \[X\] Requisito funcional     \[ \] Restricción |
| **Fuente del requisito** | Usuario final (Cliente / Público) |
| **Prioridad del requisito** | **Alta / Esencial** |
| **Descripción del requisito** | El sistema deberá disponer de una página web pública accesible sin inicio de sesión que, al escanear el código QR o acceder al enlace del certificado, muestre el resumen fidedigno de la reparación, la vigencia de la garantía y proteja los datos personales del cliente. |
| **Detalles adicionales** | **Detalle del funcionamiento:** - **Disparador:** Un cliente o cualquier usuario escanea el código QR de un certificado con su celular o introduce directamente la URL con el token correspondiente en un navegador. - **Captura de datos:** El parámetro de identificación (token) presente en la dirección web solicitada. - **Validación:** El sistema valida que el token recibido exista en el registro de certificados emitidos y que corresponda a una orden válida. - **Procesamiento:** El sistema recupera los datos asociados a la reparación: folio, marca y modelo del equipo, tipo de dispositivo, fecha de recepción y entrega, fallas reportadas, piezas sustituidas, fotografías comparativas de antes y después, y términos de la garantía. Por privacidad del cliente, el sistema enmascara el IMEI mostrando únicamente los últimos 4 dígitos (p. ej., \*\*\*\*\*\*\*\*\*\*\*1234) y omite totalmente el nombre, teléfono y correo del cliente. Además, calcula y muestra si la garantía se encuentra actualmente Vigente o Vencida. - **Almacenamiento:** Este requerimiento opera en modo de solo lectura; no realiza modificaciones ni escrituras en la base de datos. - **Resultado esperado:** El usuario visualiza una pantalla limpia y responsiva que certifica la autenticidad del servicio técnico brindado por el taller, detallando los trabajos realizados, las evidencias fotográficas y el estado de la garantía. - **Manejo de errores:** Si el token no existe en el sistema o es incorrecto, la página muestra un aviso claro: "Certificado no encontrado. Verifique que el enlace o código QR corresponda a un certificado emitido por el taller". |

### 3.2.13 RF-13 Dashboard básico

| **Número de requisito** | **RF-13** |
| --- | --- |
| **Nombre del requisito** | **Dashboard básico** |
| **Tipo** | \[X\] Requisito funcional     \[ \] Restricción |
| **Fuente del requisito** | Cliente (taller) |
| **Prioridad del requisito** | **Alta / Esencial** |
| **Descripción del requisito** | El sistema deberá presentar al personal del taller, inmediatamente después de iniciar sesión, un tablero de control con los principales indicadores operativos y una lista de las órdenes de reparación activas. |
| **Detalles adicionales** | **Detalle del funcionamiento:** - **Disparador:** El personal del taller inicia sesión exitosamente o hace clic en la opción "Dashboard" del menú de navegación. - **Captura de datos:** Identificador del taller y sesión activa del personal. - **Validación:** El sistema valida que el usuario posea una sesión de trabajo activa y autorizada. - **Procesamiento:** El sistema calcula en tiempo real tres indicadores cuantitativos: (a) número de reparaciones activas (órdenes en estado Recibido, Diagnóstico, Reparación o Pruebas), (b) número de reparaciones terminadas (órdenes en estado Entregado), y (c) número de órdenes con garantía actualmente vigente. Asimismo, recopila el listado de órdenes activas ordenadas cronológicamente de la más reciente a la más antigua. - **Almacenamiento:** Consulta de solo lectura que consolida la información existente en la base de datos. - **Resultado esperado:** La pantalla presenta tarjetas visuales con los contadores numéricos y una tabla resumen de órdenes en curso mostrando folio, cliente, dispositivo, estado actual, fecha de recepción y un botón para abrir el detalle de cada orden. - **Manejo de errores:** Si no existen registros en el sistema, los contadores muestran el valor numérico 0 y la tabla muestra el mensaje: "No hay órdenes de reparación activas registradas". Si la sesión expiró mientras se visualizaba el tablero, cualquier interacción redirige a la pantalla de login. |

### 3.2.14 RF-14 Búsqueda de órdenes

| **Número de requisito** | **RF-14** |
| --- | --- |
| **Nombre del requisito** | **Búsqueda de órdenes** |
| **Tipo** | \[X\] Requisito funcional     \[ \] Restricción |
| **Fuente del requisito** | Cliente (taller) |
| **Prioridad del requisito** | **Media / Deseado** |
| **Descripción del requisito** | El sistema deberá permitir al personal del taller buscar y filtrar órdenes de reparación rápidamente a partir del folio, nombre del cliente, número de teléfono o IMEI/serie del equipo. |
| **Detalles adicionales** | **Detalle del funcionamiento:** - **Disparador:** El personal del taller introduce texto en la barra de búsqueda ubicada en el panel principal o listado de órdenes. - **Captura de datos:** Cadena de texto de búsqueda introducida por el usuario. - **Validación:** El sistema valida que el término de búsqueda contenga al menos 3 caracteres antes de ejecutar la consulta para evitar saturación de resultados imprecisos. - **Procesamiento:** El sistema busca coincidencias parciales o exactas (sin distinguir mayúsculas de minúsculas) en los campos de folio, nombre del cliente, teléfono registrado, número de serie o IMEI del dispositivo. - **Almacenamiento:** Operación de solo consulta de datos. - **Resultado esperado:** La interfaz actualiza la tabla de resultados mostrando únicamente las órdenes que coinciden con el criterio ingresado, desplegando su folio, nombre del cliente, equipo, estado y fecha de ingreso, permitiendo hacer clic para abrir su expediente completo. - **Manejo de errores:** Si la búsqueda no arroja coincidencias, el sistema muestra el mensaje: "No se encontraron órdenes de reparación que coincidan con el criterio ingresado", ofreciendo un botón para limpiar el filtro y volver a ver la lista general. |

### 3.2.15 RF-15 Historial del dispositivo

| **Número de requisito** | **RF-15** |
| --- | --- |
| **Nombre del requisito** | **Historial del dispositivo** |
| **Tipo** | \[X\] Requisito funcional     \[ \] Restricción |
| **Fuente del requisito** | Análisis del problema |
| **Prioridad del requisito** | **Baja / Opcional** |
| **Descripción del requisito** | El sistema deberá recopilar y mostrar el historial acumulado de todas las reparaciones certificadas que ha tenido un mismo dispositivo a lo largo del tiempo, identificándolo mediante su IMEI o número de serie. |
| **Detalles adicionales** | **Detalle del funcionamiento:** - **Disparador:** El personal del taller consulta el expediente de un dispositivo en el panel interno, o un cliente visualiza la sección de historial en la página pública del certificado. - **Captura de datos:** Número de IMEI o número de serie del dispositivo seleccionado. - **Validación:** El sistema valida que el identificador del equipo (IMEI o serie) exista en el registro histórico del sistema. - **Procesamiento:** El sistema busca todas las órdenes de servicio en estado Entregado asociadas a dicho IMEI o serie, ordenándolas de forma descendente por fecha de entrega. En el panel interno del taller se presenta el desglose completo de folios y fallas previas; en la página pública se muestra un contador con la leyenda de cuántas reparaciones certificadas acumula el equipo. - **Almacenamiento:** Consulta consolidada de solo lectura a partir de las relaciones históricas entre dispositivos y órdenes de servicio. - **Resultado esperado:** En el panel interno, el personal del taller ve el listado cronológico de reparaciones anteriores con enlaces a sus órdenes pasadas; en la página pública, el cliente ve el historial con el número total de servicios certificados registrados en el taller para ese dispositivo. - **Manejo de errores:** Si el dispositivo no cuenta con reparaciones previas concluidas, el sistema muestra la leyenda: "Primera reparación certificada registrada para este equipo". |


