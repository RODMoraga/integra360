# Guía de Configuración de Variables de Entorno - Integra360

Documentación exhaustiva sobre la configuración y uso de variables de entorno en el proyecto Integra360.

---

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Estructura de Archivos](#estructura-de-archivos)
3. [Variables por Ambiente](#variables-por-ambiente)
4. [Guía de Configuración por Ambiente](#guía-de-configuración-por-ambiente)
5. [Variables Críticas de Seguridad](#variables-críticas-de-seguridad)
6. [Integración Regional (Chile)](#integración-regional-chile)
7. [Validación y Testing](#validación-y-testing)
8. [Troubleshooting](#troubleshooting)

---

## Introducción

Las variables de entorno permiten que la aplicación se comporte diferente en cada ambiente sin cambiar código. Integra360 utiliza:

- **Backend (.env)**: Node.js/Express con Prisma ORM
- **Frontend (.env)**: Vue 3 + Vite (variables prefijadas con `VITE_`)

### Principios Clave

1. ✅ **Nunca versionar `.env`**: Usar `.env.example` como referencia
2. ✅ **Diferentes valores por ambiente**: desarrollo ≠ staging ≠ producción
3. ✅ **Documentar cada variable**: Incluir propósito, valores válidos, ejemplos
4. ✅ **Validación de startup**: La aplicación no inicia si faltan variables requeridas
5. ✅ **Secretos seguros**: Usar gestores de secretos en producción

---

## Estructura de Archivos

```
integra360/
├── backend/
│   ├── .env.example          ← Plantilla documentada (versionar)
│   ├── .env                  ← Valores actuales (NO versionar)
│   ├── .env.local            ← Overrides locales (NO versionar)
│   ├── src/config/env.ts     ← Validación y exposición de variables
│   └── prisma/
│       └── .env              ← Variables específicas de Prisma
│
├── frontend/
│   ├── .env.example          ← Plantilla documentada (versionar)
│   ├── .env                  ← Valores actuales (NO versionar)
│   ├── .env.local            ← Overrides locales (NO versionar)
│   └── vite.config.js        ← Acceso a VITE_* variables
│
└── docs/
    └── ENV_CONFIGURATION.md  ← Este archivo
```

### .gitignore - Qué Excluir

```gitignore
# Variables de entorno - NUNCA versionar
.env
.env.local
.env.*.local
.env.prod.local
.env.staging.local

# Prisma
.env.prisma

# Logs con información sensible
logs/
*.log
```

---

## Variables por Ambiente

### Desarrollo (Development)

**Características:**
- Conexión a BD local
- Swagger habilitado
- Logs verbosos (DEBUG)
- CORS permisivo
- Secretos débiles (OK porque es local)
- Sin rate limiting restrictivo

**Backend `backend/.env`:**
```bash
NODE_ENV=development
PORT=3000
DATABASE_URL="mysql://root:MySQL#2024$@localhost:3306/integra360"
DB_LOG_LEVEL=query
JWT_ACCESS_SECRET=dev_secret_only_local_safe
SWAGGER_ENABLED=true
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
```

**Frontend `frontend/.env`:**
```bash
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_API_TIMEOUT=30000
VITE_ENABLE_CHARTS=true
VITE_SENTRY_ENVIRONMENT=development
VITE_SOURCEMAP=true
```

### Staging (Pre-Producción)

**Características:**
- BD remota (RDS/Cloud MySQL)
- Swagger habilitado pero con autenticación
- Logs en formato JSON
- CORS restringido a dominio staging
- Secretos fuertes
- Rate limiting moderado
- Similar a producción para testing

**Backend `backend/.env.staging`:**
```bash
NODE_ENV=staging
PORT=8080
DATABASE_URL="mysql://admin:STRONG_PASSWORD@db-staging.amazonaws.com:3306/integra360_staging"
DB_LOG_LEVEL=warn
JWT_ACCESS_SECRET=staging_secret_use_strong_random_32_chars
JWT_REFRESH_SECRET=staging_refresh_secret_use_strong_random_32_chars
SWAGGER_ENABLED=true
SWAGGER_USERNAME=docs
SWAGGER_PASSWORD=staging_password_change_regularly
LOG_LEVEL=info
LOG_FORMAT=json
CORS_ORIGIN=https://staging.integra360.com,https://app-staging.integra360.com
RATE_LIMIT_MAX_REQUESTS=200
TZ=America/Santiago
CURRENCY=CLP
```

**Frontend `frontend/.env.staging`:**
```bash
VITE_API_BASE_URL=https://api-staging.integra360.com/api/v1
VITE_API_TIMEOUT=30000
VITE_APP_TITLE=Integra360 (Staging)
VITE_SENTRY_ENVIRONMENT=staging
VITE_SOURCEMAP=false
VITE_ENABLE_DARK_MODE=false
```

### Producción (Production)

**Características:**
- BD remota con replicación/backup
- Swagger deshabilitado (seguridad)
- Logs JSON a sistema centralizado (ELK, CloudWatch)
- CORS muy restrictivo
- Secretos rotados regularmente
- Rate limiting estricto
- Health checks habilitados

**Backend `backend/.env` (producción):**
```bash
NODE_ENV=production
PORT=8080
DATABASE_URL="mysql://produser:ULTRA_SECURE_PASSWORD@integra360-prod.cn2xxx.us-east-1.rds.amazonaws.com:3306/integra360"
DB_LOG_LEVEL=error
JWT_ACCESS_SECRET=prod_access_secret_use_vault_or_secrets_manager
JWT_REFRESH_SECRET=prod_refresh_secret_use_vault_or_secrets_manager
JWT_ACCESS_EXPIRES_IN=30m
SWAGGER_ENABLED=false
LOG_LEVEL=warn
LOG_FORMAT=json
LOG_FILE=/var/log/integra360/app.log
CORS_ORIGIN=https://integra360.com,https://www.integra360.com
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
TZ=America/Santiago
CURRENCY=CLP
CACHE_DRIVER=redis
CACHE_REDIS_URL=redis://:PASSWORD@integra360-cache.xxxx.ng.0001.use1.cache.amazonaws.com:6379/0
SESSION_DRIVER=redis
SESSION_COOKIE_SECURE=true
SENTRY_DSN=https://xxxxx@sentry.io/yyyy
SENTRY_ENVIRONMENT=production
DEBUG=false
```

**Frontend `frontend/.env` (producción):**
```bash
VITE_API_BASE_URL=https://api.integra360.com/api/v1
VITE_APP_TITLE=Integra360
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_DSN=https://xxxxx@sentry.io/yyyy
VITE_SOURCEMAP=false
VITE_ENABLE_DARK_MODE=false
VITE_GOOGLE_ANALYTICS_ID=G-XXXXX
```

---

## Guía de Configuración por Ambiente

### 1️⃣ Configurar Desarrollo Local

```bash
# Backend
cd backend
cp .env.example .env
# Editar .env con valores locales

# Frontend
cd frontend
cp .env.example .env
# Editar .env si es necesario
```

**backend/.env mínimo para desarrollo:**
```bash
NODE_ENV=development
PORT=3000
DATABASE_URL="mysql://root:MySQL#2024$@localhost:3306/integra360"
JWT_ACCESS_SECRET=dev_local_secret_only
JWT_REFRESH_SECRET=dev_local_refresh_only
CORS_ORIGIN=http://localhost:5173
SWAGGER_ENABLED=true
LOG_LEVEL=debug
TZ=America/Santiago
CURRENCY=CLP
```

### 2️⃣ Migrar a Base de Datos Real

Si necesitas cambiar de MySQL local a remota:

```bash
# Paso 1: Generar URL de conexión
# Formato: mysql://user:pass@host:port/database

# Paso 2: Actualizar en .env
DATABASE_URL="mysql://admin:PASSWORD@rds-endpoint:3306/integra360"

# Paso 3: Ejecutar migraciones Prisma
npm run prisma:migrate

# Paso 4: Seed datos iniciales (opcional)
npm run prisma:seed
```

### 3️⃣ Habilitar Logging a Archivo

```bash
# backend/.env
LOG_FILE=logs/app.log
LOG_FORMAT=json

# Crear directorio logs
mkdir -p logs

# El archivo se creará automáticamente en el primer log
```

### 4️⃣ Configurar Redis para Cache/Sessions

```bash
# Paso 1: Instalar Redis localmente o usar Docker
docker run -d -p 6379:6379 redis:latest

# Paso 2: Actualizar .env
CACHE_DRIVER=redis
CACHE_REDIS_URL=redis://localhost:6379/0
SESSION_DRIVER=redis
SESSION_REDIS_URL=redis://localhost:6379/1
QUEUE_DRIVER=redis
QUEUE_REDIS_URL=redis://localhost:6379/2

# Nota: Cada driver usa DB diferente (0, 1, 2) para no colisionar
```

### 5️⃣ Configurar Email (Mailtrap para Desarrollo)

```bash
# Paso 1: Crear cuenta en https://mailtrap.io
# Paso 2: Obtener credenciales SMTP

MAIL_DRIVER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=587
MAIL_USERNAME=your_mailtrap_inbox_id
MAIL_PASSWORD=your_mailtrap_token
MAIL_FROM_ADDRESS=noreply@integra360.local
MAIL_FROM_NAME=Integra360 Dev
MAIL_ENCRYPTION=tls
```

### 6️⃣ Configurar Sentry para Rastreo de Errores

```bash
# Paso 1: Crear proyecto en https://sentry.io
# Paso 2: Copiar DSN

# Backend
SENTRY_DSN=https://xxxx@sentry.io/yyyy
SENTRY_ENVIRONMENT=development

# Frontend
VITE_SENTRY_DSN=https://xxxx@sentry.io/zzzz
VITE_SENTRY_ENVIRONMENT=development
```

---

## Variables Críticas de Seguridad

### 🔐 Secretos que Deben Cambiar en Producción

| Variable | Desarrollo | Producción | Rotación |
|----------|-----------|-----------|----------|
| `JWT_ACCESS_SECRET` | Débil, simple | 32+ chars aleatorios | Cada 90 días |
| `JWT_REFRESH_SECRET` | Débil, simple | 32+ chars aleatorios | Cada 180 días |
| `APP_KEY` | No crítico | Base64 aleatorio 32+ chars | Cada 90 días |
| `SWAGGER_PASSWORD` | Opcional | Contraseña fuerte | Cada 60 días |
| `MAIL_PASSWORD` | Token Mailtrap | Token/API key producción | Cada 90 días |
| `STRIPE_SECRET_KEY` | sk_test_* | sk_live_* | Automático por Stripe |
| `AWS_SECRET_ACCESS_KEY` | Puede ser débil | Clave verdadera con permisos limitados | Cada 90 días |
| `DATABASE_URL` | localhost, user débil | Host remoto, usuario limitado | Cada 180 días |

### Generar Secretos Seguros

**En Linux/Mac:**
```bash
# OpenSSL
openssl rand -hex 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**En PowerShell (Windows):**
```powershell
$bytes = [byte[]]::new(32)
$rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
$rng.GetBytes($bytes)
[Convert]::ToHexString($bytes)
```

### Gestión de Secretos en Producción

**Opción 1: AWS Secrets Manager**
```bash
# Obtener secret programáticamente en producción
const secret = await getSecretValue('integra360-prod-secrets')
DATABASE_URL = secret.database_url
JWT_ACCESS_SECRET = secret.jwt_access_secret
```

**Opción 2: HashiCorp Vault**
```bash
# Acceso mediante Vault CLI
vault read secret/data/integra360/prod
```

**Opción 3: Environment Variables (Recomendado para Docker/K8s)**
```yaml
# docker-compose.yml
services:
  backend:
    environment:
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      DATABASE_URL: ${DATABASE_URL}
```

```bash
# Deployment con secretos
export JWT_ACCESS_SECRET=$(openssl rand -hex 32)
export DATABASE_URL="mysql://admin:PASSWORD@rds:3306/integra360"
docker-compose up -d
```

---

## Integración Regional (Chile)

Integra360 está optimizado para el mercado chileno con las siguientes configuraciones:

### Zona Horaria

```bash
# America/Santiago es la zona horaria de Chile
TZ=America/Santiago

# Afecta:
# - Timestamps en logs
# - Fechas en base de datos
# - Cálculos de scheduling
# - APIs de fecha/hora
```

### Moneda (Peso Chileno)

```bash
# Variables de moneda
CURRENCY=CLP                    # Código ISO
CURRENCY_SYMBOL=$               # Símbolo para UI
NUMBER_THOUSANDS_SEPARATOR=.    # Punto para miles
NUMBER_DECIMAL_SEPARATOR=,      # Coma para decimales

# Ejemplos de formato:
# 1.500,00 CLP (con símbolo $)
# Precio: $ 1.500,00
```

### Formato de Fechas

```bash
# Estándar latinoamericano
DATE_FORMAT=DD/MM/YYYY
TIME_FORMAT=HH:mm:ss

# Ejemplos:
# 25/04/2026 14:30:00
# 01/01/2026 00:00:00
```

### Validación de RUT (Rut Chileno)

Para inputs que requieran RUT chileno:

```javascript
// Utilidad para validar RUT chileno (agregar a proyecto)
function validateRUT(rut) {
  // Formato: XX.XXX.XXX-K donde K es dígito o letra
  const rutRegex = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/
  return rutRegex.test(rut)
}

// Ejemplo: 12.345.678-9 ✓
```

---

## Validación y Testing

### Validación de Startup

El archivo `backend/src/config/env.ts` valida todas las variables:

```typescript
// Las variables requeridas causarán error si faltan:
// ✓ NODE_ENV, PORT, DATABASE_URL
// ✓ JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
// ✓ CORS_ORIGIN

// Si faltan:
// ❌ Error: Missing required environment variable NODE_ENV
// ❌ Server won't start
```

### Testing de Configuración

```bash
# Backend
cd backend

# Verificar validación sin iniciar servidor
npm run build

# Si la compilación TypeScript pasa, las variables son válidas

# Frontend
cd frontend
npm run build

# El build fallará si variables VITE_ requeridas faltan
```

### Verificar Variables en Runtime

**Backend:**
```bash
# Ver todas las variables cargadas (en desarrollo)
npm run dev
# Buscar en logs: "Environment loaded: NODE_ENV=development, PORT=3000..."

# Frontend:
# Abrir DevTools → Console
console.log(import.meta.env.VITE_API_BASE_URL)
```

---

## Troubleshooting

### Error: ECONNREFUSED 127.0.0.1:3306

**Problema:** MySQL no está corriendo

**Soluciones:**
```bash
# Opción 1: Iniciar MySQL local
sudo systemctl start mysql
# o (Mac)
brew services start mysql-server

# Opción 2: Usar Docker
docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=MySQL#2024$ mysql:8

# Opción 3: Usar docker-compose
docker-compose up -d mysql
```

### Error: DATABASE_URL is invalid

**Problema:** Formato incorrecto de conexión

**Correcciones:**
```bash
# ❌ Incorrecto
DATABASE_URL=mysql://root:password@localhost/integra360

# ✅ Correcto (con puerto)
DATABASE_URL="mysql://root:password@localhost:3306/integra360"

# ✅ Con caracteres especiales (URL-encoded)
# Si password tiene $, @, etc., URL-encodearlo
# Ejemplo: password=p@ssw0rd$
# Encoded: p%40ssw0rd%24
DATABASE_URL="mysql://root:p%40ssw0rd%24@localhost:3306/integra360"
```

### Error: CORS policy blocked

**Problema:** CORS_ORIGIN no coincide con frontend URL

**Solución:**
```bash
# Si frontend corre en http://localhost:5174
# Backend debe tener:
CORS_ORIGIN=http://localhost:5173,http://localhost:5174

# Múltiples orígenes: separar con coma, SIN espacios
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,https://integra360.com
```

### Error: 401 Unauthorized en Swagger

**Problema:** Swagger requiere autenticación en producción

**Solución:**
```bash
# En desarrollo (NODE_ENV=development)
SWAGGER_ENABLED=true
# No pide contraseña

# En producción (NODE_ENV=production)
SWAGGER_ENABLED=true
SWAGGER_USERNAME=docs
SWAGGER_PASSWORD=secure_password_here
# Inicia con Basic Auth
```

### Frontend no conecta a API

**Checklist:**
1. ¿Coincide `VITE_API_BASE_URL` con URL real del backend?
2. ¿Backend corre en puerto correcto?
3. ¿CORS está habilitado correctamente?
4. ¿Token JWT es válido?

```bash
# Verificar conectividad
curl -i http://localhost:3000/api/v1/health
# Debe devolver 200 OK
```

### Variables no se cargan en Frontend

**Problema:** Variables sin prefijo `VITE_` se ignoran

**Solución:**
```bash
# ❌ Incorrecto
API_BASE_URL=http://localhost:3000

# ✅ Correcto
VITE_API_BASE_URL=http://localhost:3000

# Vite solo expone variables VITE_*
```

### Base de datos requiere contraseña pero no la pide

**Problema:** DATABASE_URL tiene credenciales inválidas

**Solución:**
```bash
# Verificar credenciales
mysql -u root -p
# Enterle password

# Si funciona, actualizar DATABASE_URL:
DATABASE_URL="mysql://root:PASSWORD_CORRECTO@localhost:3306/integra360"

# Recrear prisma client
npm run prisma:generate
```

---

## Checklist de Deployment

### Antes de Staging

- [ ] Todas las variables requeridas están definidas
- [ ] Secretos son fuertes (32+ caracteres)
- [ ] `NODE_ENV=staging` está configurado
- [ ] `SWAGGER_ENABLED=true` con autenticación
- [ ] `DEBUG=false`
- [ ] Logs en formato JSON
- [ ] Base de datos staging aprovisionada
- [ ] Credenciales DB diferentes a producción
- [ ] CORS_ORIGIN apunta a dominio staging
- [ ] Mail funciona (Mailtrap o similar)

### Antes de Producción

- [ ] **CRÍTICO**: Cambiar todos los secretos
- [ ] `NODE_ENV=production` está configurado
- [ ] `SWAGGER_ENABLED=false` o protegido
- [ ] `DEBUG=false`
- [ ] `SESSION_COOKIE_SECURE=true`
- [ ] Base de datos con replicación/backup
- [ ] Redis para cache y sessions
- [ ] CORS_ORIGIN muy restrictivo
- [ ] Rate limiting habilitado y apropiado
- [ ] Logs enviados a sistema centralizado (ELK, CloudWatch)
- [ ] Sentry configurado para rastreo de errores
- [ ] Health checks configurados
- [ ] Backup automático de BD
- [ ] Plan de rotación de secretos cada 90 días

---

## Contacto y Soporte

Para dudas sobre variables de entorno:
1. Revisar esta guía primero
2. Buscar en `.env.example` comentarios detallados
3. Revisar logs del servidor (`LOG_FILE`)
4. Contactar al equipo DevOps

**Última actualización:** Abril 2026  
**Versión:** 1.0
