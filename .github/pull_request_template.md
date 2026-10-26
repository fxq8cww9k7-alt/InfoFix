<!-- ============================================================================== -->
<!-- InfoFIX - Plantilla Oficial de Pull Request (InfoPapus)                         -->
<!-- ============================================================================== -->

## 📌 1. Descripción del Cambio
*Describe de forma concisa y clara qué problema resuelve o qué funcionalidad agrega este Pull Request:*

<!-- Ejemplo: Se implementó el middleware de autenticación con JWT y validación de expiración de 8h según RF-01. -->

---

## 🎯 2. Tarea WBS y Requisitos ERS Relacionados
* **ID de Tarea (WBS):** `T__` (ej. T04, T05, T12...)
* **Requisito(s) ERS ANSI/IEEE 830:** `RF-__` (ej. RF-01, RF-06...)
* **Responsable:** <!-- @usuario -->

---

## 📋 3. Checklist de Calidad y Cláusulas del Código (Estándar DD & InfoPapus)
Marca con una `[x]` las cláusulas cumplidas antes de solicitar la revisión:

- [ ] **Cabecera de Módulo:** Todo archivo nuevo o modificado incluye su bloque superior con la descripción del módulo y autoría.
- [ ] **Documentación de Funciones (JSDoc):** Cada función contiene su descripción clara, `@param`, `@returns` y `@throws` (especificando tipos y propósitos).
- [ ] **Comentarios Limpios:** Se evitaron comentarios obvios; se usaron comentarios `//` o `/* */` únicamente para explicar decisiones de negocio o tecnicismos complejos (transacciones ACID, criptografía, hashing, restricciones MIME).
- [ ] **Contrato ERS Intacto:** No se agregaron funciones fuera de alcance (*scope creep*) y se respetaron los nombres exactos de campos y estados del sistema.
- [ ] **Pruebas Locales:** Se validó localmente que el código compila/ejecuta sin errores y no rompe módulos dependientes.
- [ ] **Sensibilidad de Datos:** No se incluyeron contraseñas, secretos, llaves `.pem` ni archivos `.env` en los commits.

---

## 🧪 4. Pruebas Realizadas y Evidencias
*Muestra cómo probaste tu cambio (capturas de pantalla, respuesta en Postman, logs de consola, o comandos ejecutados):*

```text
<!-- Pega aquí la salida de la terminal o descripción del flujo probado -->
```

---

## 🔍 5. Notas Adicionales para el Revisor
<!-- ¿Requiere migraciones de BD? ¿Nuevas dependencias en package.json? Anótalo aquí. -->
