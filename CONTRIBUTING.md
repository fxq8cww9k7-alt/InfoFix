# Reglas del equipo — InfoFIX

Guía rápida para que todos trabajemos sin pisarnos el código.

---

## Ramas

No se hacen commits directos en `main`. Punto.

- **`main`** → Código listo para entregar a la maestra. Solo se actualiza desde `develop`.
- **`develop`** → Rama de integración. Aquí se juntan los avances de todos.
- **`feature/Txx-nombre`** → Tu rama personal para trabajar una tarea.

### Flujo diario

```bash
# Actualizar develop
git checkout develop
git pull origin develop

# Crear tu rama
git checkout -b feature/T05-login-jwt

# Trabajar, guardar cambios
git add .
git commit -m "feat(auth): crear endpoint de login con JWT (T05)"

# Subir tu rama
git push -u origin feature/T05-login-jwt

# Abrir Pull Request en GitHub hacia develop
```

---

## Commits

Formato: `tipo(módulo): descripción breve (Txx)`

Tipos:
- `feat` → Funcionalidad nueva
- `fix` → Corrección de bug
- `docs` → Solo documentación
- `test` → Pruebas
- `chore` → Configuración, dependencias, limpieza

Ejemplos:
```
feat(auth): crear endpoint de login con JWT (T05)
fix(db): corregir llave foránea en tabla ordenes (T03)
docs: actualizar README con instrucciones de instalación
test(auth): agregar prueba de credenciales erróneas (T08)
```

---

## Documentación del código

### 1. Cabecera del archivo
Arriba de cada archivo nuevo, un comentario con qué hace y quién lo hizo:

```javascript
/**
 * @file auth.controller.js
 * @description Login y emisión de JWT para el personal del taller.
 * @task T05 (RF-01)
 * @author María Fernanda González Rodríguez
 */
```

### 2. Funciones documentadas
Cada función lleva un bloque con qué recibe, qué devuelve y qué errores puede dar:

```javascript
/**
 * Valida credenciales del técnico y genera un token JWT (8h).
 *
 * @param {string} email - Correo del técnico.
 * @param {string} password - Contraseña en texto plano.
 * @returns {Promise<{token: string, usuario: Object}>}
 * @throws {Error} 401 si las credenciales son inválidas.
 */
async function autenticarUsuario(email, password) {
  // ...
}
```

### 3. Comentarios internos
- No comentar lo obvio (`// suma 1` → no).
- Sí comentar decisiones técnicas o reglas del negocio:
  ```javascript
  // Enmascaramos el IMEI para la vista pública (solo últimos 4 dígitos)
  const imeiPublico = imei.slice(-4).padStart(15, '*');
  ```

---

## Checklist antes de abrir tu Pull Request

- [ ] Mi código corre sin errores localmente.
- [ ] Puse cabecera al archivo y documenté las funciones.
- [ ] No subí archivos `.env`, contraseñas ni `node_modules`.
- [ ] Mi commit sigue el formato acordado.
- [ ] Probé que no rompí lo que ya estaba funcionando.

---

## Cosas que NO van en el repo

El `.gitignore` ya se encarga, pero para que lo sepan:
- `node_modules/` → Se descarga con `npm install`.
- `.env` → Cada quien crea el suyo copiando `.env.example`.
- Fotos de prueba pesadas.
- Bases de datos locales (`.db`, `.sqlite`).
