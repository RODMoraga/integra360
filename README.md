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

## Capa de Negocio y Modelo de Datos Multi-tenant

Se incorporó un diseño relacional robusto, multiempresa y desacoplado para soportar rubros como botillería, minimarket, lavandería y ferretería.

### Scripts versionados

- Modelo base: `backend/database/migrations/20260425_001_multi_tenant_schema.sql`
- Reglas de negocio (funciones, procedures, triggers): `backend/database/migrations/20260425_002_business_logic.sql`
- Estrategia de performance (índices y plantillas de particionamiento): `backend/database/migrations/20260425_003_performance_strategy.sql`
- Semilla de catálogos base (roles, permisos, UOM, métodos de pago): `backend/database/migrations/20260425_004_seed_base_catalogs.sql`

### Documentación técnica

- ERD: `docs/database/ERD.md`
- Diccionario de datos: `docs/database/DATA_DICTIONARY.md`
- Reglas de negocio: `docs/database/BUSINESS_RULES.md`

### Ejecución sugerida de scripts

```bash
mysql -u root -p integra360 < backend/database/migrations/20260425_001_multi_tenant_schema.sql
mysql -u root -p integra360 < backend/database/migrations/20260425_002_business_logic.sql
mysql -u root -p integra360 < backend/database/migrations/20260425_003_performance_strategy.sql
mysql -u root -p integra360 < backend/database/migrations/20260425_004_seed_base_catalogs.sql

# Sembrar catálogos para una empresa específica
# CALL sp_seed_base_catalogs(<company_id>, <user_id>);

# Prueba E2E compra/venta/cierre caja
mysql -u root -p integra360 < backend/database/tests/20260425_e2e_validation.sql
```

Notas E2E:
- El script crea un tenant temporal por corrida usando prefijo timestamp.
- Por defecto ejecuta `ROLLBACK` al final, por lo que no acumula datos.
- Si necesitas persistir datos para inspección manual, edita `backend/database/tests/20260425_e2e_validation.sql` y cambia `SET @persist_data = 0;` a `1`.

### Script CI-ready (PowerShell)

Ejecuta migraciones + seed + E2E con asserts automáticos. Si algo falla, termina con error.

```powershell
cd backend
.\scripts\run-db-e2e.ps1
```

Opciones útiles:

- `-PersistData`: usa COMMIT en la prueba E2E para dejar datos de inspección.
- `-KeepDatabase`: no recrea la base antes de correr (por defecto sí la recrea para ejecución determinística en CI).

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
