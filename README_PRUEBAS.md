# Guía rápida — InfoFIX (`main`)

## 1. Cuenta de prueba

- **URL:** `http://localhost:5173/login`
- **Correo:** `admin@infofix.test`
- **Contraseña:** `Admin123!`
- **Código del taller (si quieres registrar otra cuenta):** `CAMBIA-ESTE-CODIGO` (configurable en `backend/.env` como `CODIGO_TALLER`)

## 2. Levantar el proyecto en local

```bash
# Backend (puerto 3000)
cd backend
npm install
copy .env.example .env
npm run seed
npm run dev

# Frontend (puerto 5173, en otra terminal)
cd frontend
npm install
npm run dev
```

## 3. Cómo hacer push

Para subir `main` al remoto:

```bash
git push origin main
```

Si prefieres probar primero en una rama aparte sin tocar `main` en GitHub:

```bash
git push origin main:refs/heads/main_prueba
```

## 4. Notas para pruebas y despliegue

- **Base de datos SQLite:** Al arrancar el backend por primera vez se crea `database/infofix.sqlite` usando `database/schema.sql`. Si ya tenías un `.sqlite` viejo de versiones anteriores, bórralo y vuelve a correr `npm run seed` en `backend/`.
- **Correos:** Con `SMTP_HOST` vacío en `backend/.env`, los correos de recuperación de contraseña y avisos se imprimen en la consola del backend. Para envío real, configura `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` y `SMTP_FROM`.
- **Verificación:** Ejecuta `npm test` en `backend/` y `npm run build` en `frontend/` después de cualquier cambio.
