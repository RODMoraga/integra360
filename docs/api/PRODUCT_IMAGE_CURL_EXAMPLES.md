# Product Images API - Curl End-to-End

## Prerrequisitos

- Backend activo en `http://localhost:3000`
- Base de datos con migraciones aplicadas
- Un producto existente para pruebas (`PRODUCT_ID`)
- Header `x-company-id` valido

## 1) Login y token

### PowerShell

```powershell
$BASE_URL = "http://localhost:3000"
$EMAIL = "john@example.com"
$PASSWORD = "Secret123!"

$loginBody = @{
  email = $EMAIL
  password = $PASSWORD
} | ConvertTo-Json

$login = Invoke-RestMethod -Method Post -Uri "$BASE_URL/api/v1/auth/login" -ContentType "application/json" -Body $loginBody
$TOKEN = $login.accessToken
```

### Bash

```bash
BASE_URL="http://localhost:3000"
EMAIL="john@example.com"
PASSWORD="Secret123!"

TOKEN=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | jq -r '.accessToken')
```

## 2) Variables de prueba

### PowerShell

```powershell
$COMPANY_ID = 1
$PRODUCT_ID = 1
$IMAGE_PATH = "C:/temp/product-image.jpg"
```

### Bash

```bash
COMPANY_ID=1
PRODUCT_ID=1
IMAGE_PATH="/tmp/product-image.jpg"
```

## 3) Subir imagen (multipart)

### PowerShell (curl.exe)

```powershell
$response = curl.exe -s -X POST "$BASE_URL/api/v1/products/$PRODUCT_ID/images" `
  -H "Authorization: Bearer $TOKEN" `
  -H "x-company-id: $COMPANY_ID" `
  -F "image=@$IMAGE_PATH" `
  -F "purpose=GALLERY" `
  -F "altText=Vista lateral del producto" `
  -F "sortOrder=1" `
  -F "isPrimary=false"

$response
$IMAGE_ID = ($response | ConvertFrom-Json).id
```

### Bash

```bash
UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/products/$PRODUCT_ID/images" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-company-id: $COMPANY_ID" \
  -F "image=@$IMAGE_PATH" \
  -F "purpose=GALLERY" \
  -F "altText=Vista lateral del producto" \
  -F "sortOrder=1" \
  -F "isPrimary=false")

echo "$UPLOAD_RESPONSE"
IMAGE_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.id')
```

## 4) Listar galeria del producto

### PowerShell

```powershell
curl.exe -s -X GET "$BASE_URL/api/v1/products/$PRODUCT_ID/images" `
  -H "Authorization: Bearer $TOKEN" `
  -H "x-company-id: $COMPANY_ID"
```

### Bash

```bash
curl -s -X GET "$BASE_URL/api/v1/products/$PRODUCT_ID/images" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-company-id: $COMPANY_ID"
```

## 5) Actualizar metadata de imagen

### PowerShell

```powershell
curl.exe -s -X PATCH "$BASE_URL/api/v1/products/$PRODUCT_ID/images/$IMAGE_ID" `
  -H "Authorization: Bearer $TOKEN" `
  -H "x-company-id: $COMPANY_ID" `
  -H "Content-Type: application/json" `
  -d "{\"purpose\":\"DETAIL\",\"altText\":\"Detalle frontal\",\"sortOrder\":2,\"isActive\":true}"
```

### Bash

```bash
curl -s -X PATCH "$BASE_URL/api/v1/products/$PRODUCT_ID/images/$IMAGE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-company-id: $COMPANY_ID" \
  -H "Content-Type: application/json" \
  -d '{"purpose":"DETAIL","altText":"Detalle frontal","sortOrder":2,"isActive":true}'
```

## 6) Marcar imagen principal

### PowerShell

```powershell
curl.exe -s -X PATCH "$BASE_URL/api/v1/products/$PRODUCT_ID/images/$IMAGE_ID/primary" `
  -H "Authorization: Bearer $TOKEN" `
  -H "x-company-id: $COMPANY_ID"
```

### Bash

```bash
curl -s -X PATCH "$BASE_URL/api/v1/products/$PRODUCT_ID/images/$IMAGE_ID/primary" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-company-id: $COMPANY_ID"
```

## 7) Eliminar imagen

### PowerShell

```powershell
curl.exe -s -X DELETE "$BASE_URL/api/v1/products/$PRODUCT_ID/images/$IMAGE_ID" `
  -H "Authorization: Bearer $TOKEN" `
  -H "x-company-id: $COMPANY_ID"
```

### Bash

```bash
curl -s -X DELETE "$BASE_URL/api/v1/products/$PRODUCT_ID/images/$IMAGE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-company-id: $COMPANY_ID"
```

## Notas

- Si el login falla, revisa que el usuario exista o crea uno via `POST /api/v1/auth/register`.
- El endpoint de subida solo acepta archivos de tipo `image/*` y maximo 5MB.
- Si cambias de tenant, actualiza `x-company-id` para evitar errores de acceso/relacion.
