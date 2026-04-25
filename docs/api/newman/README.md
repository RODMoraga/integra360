# Newman - Product Images CI/CD

## Archivos

- Coleccion Newman: `docs/api/newman/product-images.newman_collection.json`
- Entorno Postman: `docs/api/product-images.postman_environment.json`
- Workflow GitHub Actions: `.github/workflows/api-product-images-newman.yml`

## Ejecutar local

```bash
npx newman run docs/api/newman/product-images.newman_collection.json \
  -e docs/api/product-images.postman_environment.json \
  --env-var baseUrl=http://localhost:3000 \
  --env-var email=john@example.com \
  --env-var password=Secret123! \
  --env-var companyId=1 \
  --env-var productId=1 \
  --env-var imagePath="C:/temp/product-image.jpg"
```

## Ejecutar en PowerShell

```powershell
npx newman run docs/api/newman/product-images.newman_collection.json `
  -e docs/api/product-images.postman_environment.json `
  --env-var baseUrl=http://localhost:3000 `
  --env-var email=john@example.com `
  --env-var password=Secret123! `
  --env-var companyId=1 `
  --env-var productId=1 `
  --env-var imagePath=C:/temp/product-image.jpg
```

## Ejemplo GitHub Actions (job)

```yaml
api-product-images:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    - uses: actions/setup-node@v4
      with:
        node-version: 20

    - name: Install Newman
      run: npm i -g newman

    - name: Run Product Images API tests
      run: |
        newman run docs/api/newman/product-images.newman_collection.json \
          -e docs/api/product-images.postman_environment.json \
          --env-var baseUrl=${{ secrets.API_BASE_URL }} \
          --env-var email=${{ secrets.API_USER_EMAIL }} \
          --env-var password=${{ secrets.API_USER_PASSWORD }} \
          --env-var companyId=${{ secrets.API_COMPANY_ID }} \
          --env-var productId=${{ secrets.API_PRODUCT_ID }} \
          --env-var imagePath=/tmp/product-image.jpg
```

## Nota importante para CI

- El archivo indicado en `imagePath` debe existir en el runner antes de ejecutar Newman.
- Si el entorno de CI no tiene una imagen de prueba, agrega un paso previo para descargar/copiar una imagen de fixture.
- El workflow incluido en el repositorio ya crea una imagen temporal y resuelve `companyId/productId` automaticamente.
