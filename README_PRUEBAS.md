# Guía rápida — InfoFIX

## 1. Levantar el proyecto en local

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

## 2. Cuenta de prueba

Al correr `npm run seed` con el `.env` de ejemplo se crea esta cuenta:

- **URL:** `http://localhost:5173/login`
- **Correo:** `tecnico@infofix.test`
- **Contraseña:** `Tecnico123!`
- **Código del taller (para registrar nuevas cuentas):** `CAMBIA-ESTE-CODIGO`

*(Los correos de recuperación y avisos se imprimen en la consola del backend mientras `SMTP_HOST` esté vacío en `backend/.env`).*

## 3. Cómo hacer push a `main`

```bash
git push origin main
```

Si quieres probar primero en una rama aparte en GitHub sin tocar `main`:

```bash
git push origin main:refs/heads/main_prueba
```
