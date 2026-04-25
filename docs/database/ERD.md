# ERD - Modelo Multi-tenant Integra360

## Diagrama entidad-relación (vista lógica)

```mermaid
erDiagram
  COMPANIES ||--o{ USERS : has
  COMPANIES ||--o{ ROLES : has
  USERS ||--o{ USER_ROLES : assigned
  ROLES ||--o{ USER_ROLES : includes
  ROLES ||--o{ ROLE_PERMISSIONS : has
  PERMISSIONS ||--o{ ROLE_PERMISSIONS : grants
  COMPANIES ||--o{ USER_SESSIONS : tracks

  REGIONS ||--o{ CITIES : contains
  CITIES ||--o{ COMMUNES : contains

  COMPANIES ||--o{ CUSTOMERS : owns
  COMPANIES ||--o{ SUPPLIERS : owns
  CUSTOMERS ||--o{ CUSTOMER_CONTACTS : has
  SUPPLIERS ||--o{ SUPPLIER_CONTACTS : has

  COMPANIES ||--o{ CATEGORIES : owns
  CATEGORIES ||--o{ SUBCATEGORIES : contains
  COMPANIES ||--o{ BRANDS : owns
  BRANDS ||--o{ MODELS : contains
  COMPANIES ||--o{ UNITS_OF_MEASURE : defines
  UNITS_OF_MEASURE ||--o{ UNIT_CONVERSIONS : from
  UNITS_OF_MEASURE ||--o{ UNIT_CONVERSIONS : to

  COMPANIES ||--o{ PRODUCTS : owns
  PRODUCTS ||--o{ PRODUCT_VARIANTS : contains
  COMPANIES ||--o{ DIGITAL_ASSETS : owns
  PRODUCTS ||--o{ PRODUCT_IMAGES : has
  DIGITAL_ASSETS ||--o{ PRODUCT_IMAGES : links
  UNITS_OF_MEASURE ||--o{ PRODUCTS : base_uom

  COMPANIES ||--o{ WAREHOUSES : owns
  COMPANIES ||--o{ INVENTORY : controls
  WAREHOUSES ||--o{ INVENTORY : stores
  PRODUCT_VARIANTS ||--o{ INVENTORY : quantified

  INVENTORY_MOVEMENT_TYPES ||--o{ INVENTORY_MOVEMENTS : classifies
  WAREHOUSES ||--o{ INVENTORY_MOVEMENTS : source
  PRODUCT_VARIANTS ||--o{ INVENTORY_MOVEMENTS : affected

  DOCUMENT_TYPES ||--o{ DOCUMENTS : classifies
  COMPANIES ||--o{ DOCUMENTS : owns
  DOCUMENTS ||--o{ DOCUMENT_DETAILS : contains
  PRODUCT_VARIANTS ||--o{ DOCUMENT_DETAILS : references

  COMPANIES ||--o{ POS_TERMINALS : owns
  POS_TERMINALS ||--o{ CASH_REGISTERS : hosts
  CASH_REGISTERS ||--o{ CASH_OPENINGS : opens
  CASH_OPENINGS ||--o{ CASH_CLOSINGS : closes
  CASH_OPENINGS ||--o{ SALES : records
  SALES ||--o{ SALE_DETAILS : contains
  SALES ||--o{ SALE_PAYMENTS : pays
  PAYMENT_METHODS ||--o{ SALE_PAYMENTS : method

  CASH_OPENINGS ||--o{ CASH_MOVEMENTS : tracks
  COMPANIES ||--o{ AUDIT_LOGS : audits
```

## Principios del modelo

- Multiempresa por company_id en entidades de negocio.
- Normalización hasta 3FN en maestros y transaccionales.
- Catálogo desacoplado para múltiples rubros.
- Soft delete con deleted_at en entidades críticas.
- Trazabilidad completa con audit_logs + created_by.

## Referencias de implementación

- Migración modelo: [backend/database/migrations/20260425_001_multi_tenant_schema.sql](../../backend/database/migrations/20260425_001_multi_tenant_schema.sql)
- Lógica de negocio: [backend/database/migrations/20260425_002_business_logic.sql](../../backend/database/migrations/20260425_002_business_logic.sql)
- Estrategia performance: [backend/database/migrations/20260425_003_performance_strategy.sql](../../backend/database/migrations/20260425_003_performance_strategy.sql)
- Extensión imágenes: [backend/database/migrations/20260425_005_product_images.sql](../../backend/database/migrations/20260425_005_product_images.sql)
