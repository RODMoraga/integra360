# Integra360 Boilerplate

Arquitectura base para sistema web modular con:

- Backend: Node.js + Express + TypeScript + Prisma + MySQL 8
- Frontend: Vue 3 + Vite + Pinia + Tailwind + Bootstrap 5
- Seguridad: JWT, Helmet, CORS, Rate Limiting, password hash con bcrypt
- UI: SweetAlert2 + Chart.js
- Infra: Docker Compose (mysql, backend, frontend)

## Estructura

- `backend/`
- `frontend/`
- `docker-compose.yml`

## Requisitos

- Node.js 22+
- Docker Desktop (opcional)

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
