# Integra360 Boilerplate

Arquitectura base para sistema web modular con:

- Backend: Node.js + Express + TypeScript + Prisma + MySQL 8
- Frontend: Vue 3 + Vite + Pinia + Tailwind + Bootstrap 5
- Seguridad: JWT, Helmet, CORS, Rate Limiting, password hash con bcrypt
- UI: SweetAlert2 + Chart.js
- Infra: Docker Compose (mysql, backend, frontend)

## Estructura

- `backend/` - Servidor Express con Prisma ORM
- `frontend/` - Aplicación Vue 3 + Vite
- `docker-compose.yml` - Orquestación de servicios
- `docs/` - Documentación detallada

## Requisitos

- Node.js 22+
- MySQL 8+ (local o Docker)
- Docker Desktop (opcional, para orquestación)

## Inicio rapido local

### 1) Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

Backend disponible en `http://localhost:3000`.

### 2) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend disponible en `http://localhost:5173`.

## 📋 Configuración de Variables de Entorno

Las variables de entorno definen la configuración por ambiente (desarrollo, staging, producción).

### Documentación Disponible

- **Quick Reference** (`docs/ENV_QUICK_REFERENCE.md`): Tabla rápida de todas las variables
- **Guía Exhaustiva** (`docs/ENV_CONFIGURATION.md`): Documentación completa con ejemplos de setup
- **Backend** (`backend/.env.example`): Comentarios detallados de cada variable
- **Frontend** (`frontend/.env.example`): Variables VITE_ documentadas

### Setup Rápido (Desarrollo Local)

```bash
# Backend
cd backend
cp .env.example .env
# La configuración por defecto funciona para localhost

# Frontend
cd frontend
cp .env.example .env
# Generalmente no requiere cambios
```

### Credenciales MySQL por Defecto

```bash
# Usuario: root
# Contraseña: MySQL#2024$
# Host: localhost
# Puerto: 3306
# Base de datos: integra360

# Variable en .env:
DATABASE_URL="mysql://root:MySQL#2024$@localhost:3306/integra360"
```

### Variables Críticas a Cambiar en Producción

```bash
# Secretos (deben ser fuertes y únicos)
JWT_ACCESS_SECRET=          # openssl rand -hex 32
JWT_REFRESH_SECRET=         # openssl rand -hex 32
APP_KEY=                    # openssl rand -hex 32

# Credenciales
DATABASE_URL=               # Usar RDS o servidor remoto seguro
MAIL_PASSWORD=              # Token/contraseña de servicio mail

# Security
SWAGGER_PASSWORD=           # Contraseña fuerte si Swagger habilitado
CORS_ORIGIN=               # Tu dominio de producción

# Ambiente
NODE_ENV=production
DEBUG=false
SWAGGER_ENABLED=false      # Deshabilitar documentación en prod
```

### Regional (Chile)

El proyecto está configurado para Chile con:
- Zona horaria: `America/Santiago`
- Moneda: `CLP` (Peso Chileno)
- Formato de fecha: `DD/MM/YYYY`
- Separador decimal: `,` (coma)
- Separador de miles: `.` (punto)

## Inicio con Docker

```bash
docker compose up --build
```

## Endpoints base

- `GET /api/v1/health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/users/me` (requiere bearer token)

## Documentacion API

- Swagger UI: `http://localhost:3000/api-docs`
- OpenAPI JSON: `http://localhost:3000/api-docs.json`

### Seguridad de Swagger

- En `development`, Swagger queda habilitado por defecto.
- En `production`, Swagger queda deshabilitado por defecto.
- Para habilitarlo en `production`, define:
	- `SWAGGER_ENABLED=true`
	- `SWAGGER_USERNAME=<usuario>`
	- `SWAGGER_PASSWORD=<password>`
- Si `SWAGGER_ENABLED=true` en `production` sin credenciales, la app no inicia.

## Mejoras recomendadas siguientes

1. Agregar Swagger/OpenAPI.
2. Implementar refresh token rotation persistente.
3. Integrar RBAC por modulo.
4. Incorporar pruebas unitarias/integracion en CI.
5. Crear modulos de negocio (`product`, `inventory`, `sales`).
