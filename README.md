# InfoFIX

Sistema web para talleres de reparación de celulares, tablets y laptops.  
Registra órdenes de servicio, evidencia fotográfica y genera certificados con QR verificable.

**Equipo InfoPapus** — Ingeniería de Software, CUCEI (Oct-Dic 2026)

---

## ¿Qué hace InfoFIX?

- Login para el personal del taller (JWT + bcrypt).
- Registro de clientes y dispositivos (validación de IMEI).
- Órdenes de reparación con estados: Recibido → Diagnóstico → Reparación → Pruebas → Entregado.
- Fotos de evidencia al recibir y al entregar (máx 5 por fase, 5 MB c/u).
- Registro de piezas cambiadas y cálculo de garantía.
- Certificado digital con código QR que cualquiera puede escanear para verificar la reparación.
- Dashboard con resumen de reparaciones activas, terminadas y garantías.

---

## Estructura del proyecto

```
InfoFix/
├── backend/          # API en Node.js + Express
│   ├── src/          # Código fuente del servidor
│   ├── uploads/      # Fotos de evidencia (antes/ y despues/)
│   └── .env.example  # Variables de entorno (copiar como .env)
├── frontend/         # Interfaz web (React o HTML + Tailwind)
├── database/         # Scripts SQL (schema.sql y seed.sql)
├── docs_referencia/  # Documentos del proyecto (ERS, planificación, etc.)
├── CONTRIBUTING.md   # Reglas del equipo y flujo de Git
└── .gitignore        # Archivos que Git ignora
```

---

## Cómo empezar

```bash
# 1. Clonar y entrar al proyecto
git clone https://github.com/fxq8cww9k7-alt/InfoFix.git
cd InfoFix

# 2. Moverse a la rama de desarrollo
git checkout develop
git pull origin develop

# 3. Crear tu rama de trabajo (ejemplo: tarea T05)
git checkout -b feature/T05-login-jwt

# 4. Cuando termines, subir tu rama
git push -u origin feature/T05-login-jwt

# 5. Abrir Pull Request hacia develop en GitHub
```

Para las reglas de código y commits, revisa [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Equipo

| Nombre | Rol | Tareas |
| :--- | :--- | :--- |
| Leonardo Atos Aguilar Nuñez | PM / DevOps | T01, T26, T28 |
| Mauricio Razón Ramos | Base de Datos / QA | T02, T03 |
| María Fernanda González Rodríguez | Backend / Seguridad | T04, T05, T09, T10, T12, T13, T15-T17, T20, T21, T23 |
| Yahúm Adair Hernández Martínez | Frontend / UI | T06, T07, T11, T14, T18, T22, T24, T25 |
| Marco Yahir Guzmán Gasca | QA / Testing | T08, T19, T27 |

---

## Stack

- **Backend:** Node.js + Express
- **Base de Datos:** SQLite (desarrollo) / PostgreSQL (producción)
- **Frontend:** React (Vite) + Tailwind CSS
- **Seguridad:** bcrypt, JWT, UUID v4
- **QR:** librería `qrcode`
