# Guía rápida — rama `revisar_orden_chat`

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

## 3. Cómo hacer push sin pisar otras ramas

Si quieres subir esta versión a una rama aparte en GitHub para que la prueben sin tocar `develop` ni `main`:

```bash
git add -A
git commit -m "fix: version integrada revisar_orden_chat"
git push origin HEAD:refs/heads/revisar_orden_chat_prueba
```

Si ya estás seguro de reemplazar `origin/revisar_orden_chat`:

```bash
git push origin revisar_orden_chat
```

## 4. Qué falta / qué revisar antes de pasar a `develop`

- **SQLite local:** Si ya tenías creado `database/infofix.sqlite` antes de agregar `impresora` y `pc_escritorio`, bórralo y corre `npm run seed` en `backend/` para que tome el `CHECK` nuevo de `database/schema.sql`.
- **Correos reales:** Con `SMTP_HOST` vacío en `backend/.env`, los correos de recuperación y avisos salen en la consola del backend. Para enviar correos reales hay que llenar `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` y `SMTP_FROM`.
- **Pruebas:** Correr `npm test` en `backend/` y `npm run build` en `frontend/` después de cualquier cambio.
