# ENV Variables - Quick Reference Guide

Guía rápida de referencia de variables de entorno para Integra360.

---

## 🚀 Quick Setup

### Primer Setup (Primera Vez)

```bash
# Backend
cd backend
cp .env.example .env
# Editar .env si es necesario

# Frontend
cd frontend
cp .env.example .env
# Generalmente no requiere cambios

# Base de datos
npm run prisma:migrate
npm run prisma:seed
```

### Iniciar Proyecto

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev

# Frontend: http://localhost:5173
# Backend: http://localhost:3000
# Swagger: http://localhost:3000/api-docs
```

---

## 📋 Backend Variables (.env)

### Esenciales (Requeridas)

| Variable | Desarrollo | Producción | Notas |
|----------|-----------|-----------|-------|
| `NODE_ENV` | `development` | `production` | development, staging, production |
| `PORT` | `3000` | `8080` | Puerto de escucha |
| `DATABASE_URL` | `mysql://root:MySQL#2024$@localhost:3306/integra360` | `mysql://prod_user:STRONG_PASS@rds-endpoint:3306/integra360` | Incluir puerto 3306 |
| `JWT_ACCESS_SECRET` | Débil, dev-only | Aleatorio 32+ chars | Ver: `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | Débil, dev-only | Aleatorio 32+ chars | Diferente a ACCESS |
| `CORS_ORIGIN` | `http://localhost:5173` | `https://integra360.com` | Frontend URL |

### Seguridad

| Variable | Valor |
|----------|-------|
| `JWT_ACCESS_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `APP_KEY` | Aleatorio base64 32+ chars |
| `RATE_LIMIT_WINDOW` | `15` (minutos) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` |
| `SWAGGER_ENABLED` | `true` (dev) / `false` (prod) |
| `SWAGGER_USERNAME` | `docs` (si Swagger enabled en prod) |
| `SWAGGER_PASSWORD` | Contraseña fuerte |

### Logging

| Variable | Desarrollo | Producción |
|----------|-----------|-----------|
| `LOG_LEVEL` | `debug` | `warn` o `error` |
| `LOG_FORMAT` | `pretty` | `json` |
| `LOG_FILE` | Opcional | `/var/log/integra360/app.log` |
| `DB_LOG_LEVEL` | `query` | `error` |

### Regional (Chile)

| Variable | Valor |
|----------|-------|
| `TZ` | `America/Santiago` |
| `LOCALE` | `es-CL` |
| `CURRENCY` | `CLP` |
| `CURRENCY_SYMBOL` | `$` |
| `DATE_FORMAT` | `DD/MM/YYYY` |
| `TIME_FORMAT` | `HH:mm:ss` |
| `NUMBER_DECIMAL_SEPARATOR` | `,` |
| `NUMBER_THOUSANDS_SEPARATOR` | `.` |

### Cache & Session (Opcional)

| Variable | Desarrollo | Producción |
|----------|-----------|-----------|
| `CACHE_DRIVER` | `memory` | `redis` |
| `CACHE_REDIS_URL` | Omitir | `redis://localhost:6379/0` |
| `SESSION_DRIVER` | `memory` | `redis` |
| `SESSION_REDIS_URL` | Omitir | `redis://localhost:6379/1` |
| `QUEUE_DRIVER` | `memory` | `redis` |
| `QUEUE_REDIS_URL` | Omitir | `redis://localhost:6379/2` |

### Email

| Variable | Ejemplo |
|----------|---------|
| `MAIL_DRIVER` | `smtp` |
| `MAIL_HOST` | `smtp.mailtrap.io` (dev) / `smtp.gmail.com` (prod) |
| `MAIL_PORT` | `587` |
| `MAIL_USERNAME` | Tu usuario |
| `MAIL_PASSWORD` | Token/contraseña |
| `MAIL_FROM_ADDRESS` | `noreply@integra360.com` |
| `MAIL_ENCRYPTION` | `tls` |

### Servicios Externos

| Variable | Descripción |
|----------|-------------|
| `SENTRY_DSN` | Rastreo de errores |
| `SENTRY_ENVIRONMENT` | development, staging, production |
| `STRIPE_SECRET_KEY` | sk_test_* (dev) / sk_live_* (prod) |

---

## 🎨 Frontend Variables (.env)

### Esenciales

| Variable | Desarrollo | Producción |
|----------|-----------|-----------|
| `VITE_API_BASE_URL` | `http://localhost:3000/api/v1` | `https://api.integra360.com/api/v1` |
| `VITE_APP_NAME` | `Integra360` | `Integra360` |
| `VITE_APP_TITLE` | `Integra360 - Sistema` | `Integra360` |

### Regional

| Variable | Valor |
|----------|-------|
| `VITE_LOCALE` | `es-CL` |
| `VITE_TIMEZONE` | `America/Santiago` |
| `VITE_CURRENCY` | `CLP` |
| `VITE_CURRENCY_SYMBOL` | `$` |
| `VITE_DATE_FORMAT` | `DD/MM/YYYY` |
| `VITE_TIME_FORMAT` | `HH:mm:ss` |

### Features

| Variable | Desarrollo | Notas |
|----------|-----------|-------|
| `VITE_ENABLE_CHARTS` | `true` | Chart.js |
| `VITE_ENABLE_EXPORT_PDF` | `true` | Descargas PDF |
| `VITE_ENABLE_EXPORT_EXCEL` | `true` | Descargas Excel |
| `VITE_ENABLE_DARK_MODE` | `false` | No implementado aún |
| `VITE_ENABLE_NOTIFICATIONS` | `true` | SweetAlert2 |

### Debugging

| Variable | Desarrollo | Producción |
|----------|-----------|-----------|
| `VITE_SOURCEMAP` | `true` | `false` |
| `VITE_SENTRY_ENVIRONMENT` | `development` | `production` |
| `VITE_SENTRY_DSN` | Opcional | Sentry project URL |

---

## 🔐 Cambiar Secretos (Producción)

### Generar Secretos Nuevos

**Linux/Mac:**
```bash
openssl rand -hex 32
```

**PowerShell (Windows):**
```powershell
$bytes = [byte[]]::new(32)
$rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
$rng.GetBytes($bytes)
[Convert]::ToHexString($bytes)
```

### Variables a Cambiar en Producción

```bash
# Antes de subir a producción:
JWT_ACCESS_SECRET=<genera_con_openssl>
JWT_REFRESH_SECRET=<genera_con_openssl>
APP_KEY=<genera_con_openssl>
SWAGGER_PASSWORD=<contraseña_fuerte>
DATABASE_URL=<credenciales_prod>
MAIL_PASSWORD=<credenciales_prod>
```

---

## 🐛 Common Issues & Solutions

| Problema | Causa | Solución |
|----------|-------|----------|
| ECONNREFUSED:3306 | MySQL no corre | `sudo systemctl start mysql` o Docker |
| CORS policy blocked | CORS_ORIGIN incorrecto | Actualizar CORS_ORIGIN con URL frontend |
| 401 en Swagger prod | Falta autenticación | Agregar SWAGGER_USERNAME y PASSWORD |
| Variables VITE no carguen | Sin prefijo VITE_ | Cambiar a VITE_VARIABLE_NAME |
| DATABASE_URL invalid | Formato incorrecto | Incluir puerto: `mysql://user:pass@host:3306/db` |
| Token inválido | Secreto cambió | Limpiar localStorage y login nuevamente |

---

## 📚 Archivos de Referencia

- **Backend**: `backend/.env.example` (documentación completa)
- **Frontend**: `frontend/.env.example` (documentación completa)
- **Guía Exhaustiva**: `docs/ENV_CONFIGURATION.md`
- **Validación**: `backend/src/config/env.ts`

---

## 🚀 Deployment Checklist

### Staging
- [ ] NODE_ENV=staging
- [ ] Secretos fuertes
- [ ] SWAGGER_ENABLED=true
- [ ] BD staging
- [ ] CORS_ORIGIN=https://staging.integra360.com

### Producción
- [ ] NODE_ENV=production
- [ ] Secretos muy fuertes
- [ ] SWAGGER_ENABLED=false
- [ ] BD con replicación
- [ ] Redis habilitado
- [ ] CORS_ORIGIN restringido
- [ ] Logs a sistema centralizado
- [ ] Sentry configurado

---

## 📞 Contacto

Para dudas, revisar primero:
1. `.env.example` comentarios
2. `docs/ENV_CONFIGURATION.md` guía exhaustiva
3. `backend/src/config/env.ts` validaciones
