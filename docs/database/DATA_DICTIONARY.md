# Diccionario de Datos - Integra360

## Convenciones generales

- PK: BIGINT UNSIGNED AUTO_INCREMENT.
- Multi-tenant: company_id en entidades de negocio.
- Auditoría base: created_at, updated_at, deleted_at, created_by.
- Monetary fields: DECIMAL(18,4).
- Estados operativos: ENUM para validación a nivel motor.

## Módulo: Empresas y Seguridad

### companies
- Propósito: aislamiento multiempresa y configuración tributaria/base.
- Campos clave: code, tax_id, timezone, currency_code.
- Índices clave: uk_companies_code, uk_companies_tax_id.

### users
- Propósito: usuarios por empresa.
- Campos clave: company_id, email, password_hash, is_active.
- Restricción: email único por empresa (uk_users_company_email).

### roles / permissions / user_roles / role_permissions
- Propósito: RBAC desacoplado por empresa.
- Regla: roles son tenant-scoped, permisos son globales por código.

### user_sessions
- Propósito: trazabilidad de inicio/cierre por dispositivo y terminal.
- Campos clave: login_at, logout_at, is_active, terminal_id.

## Módulo: Geografía

### regions / cities / communes
- Propósito: normalización geográfica jerárquica reutilizable.
- Relación: regions 1:N cities, cities 1:N communes.

## Módulo: Comercial

### customers / customer_contacts
- Propósito: maestro de clientes + contactos múltiples.
- Campos clave: tax_id, legal_name, payment_terms_days, credit_limit.

### suppliers / supplier_contacts
- Propósito: maestro de proveedores + contactos múltiples.
- Campos clave: tax_id, legal_name, payment_terms_days.

## Módulo: Catálogo

### categories / subcategories
- Propósito: clasificación jerárquica de productos.

### brands / models
- Propósito: taxonomía de marca/modelo desacoplada.

### units_of_measure / unit_conversions
- Propósito: unidad base y conversiones normalizadas.
- Regla: conversiones por company_id para flexibilidad rubro.

### products / product_variants
- Propósito: producto base + variantes comercializables.
- Campos clave: sku, barcode, cost_price, sale_price, attributes_json.

## Módulo: Inventario y Logística

### warehouses
- Propósito: bodegas/locales por empresa.

### inventory
- Propósito: saldo consolidado por bodega y variante.
- Campo derivado: quantity_available = quantity_on_hand - quantity_reserved.
- Clave única: company_id + warehouse_id + product_variant_id.

### inventory_movement_types
- Propósito: catálogo de tipos con dirección IN/OUT/TRANSFER.

### inventory_movements
- Propósito: bitácora transaccional de entradas/salidas/traslados.
- Campos clave: movement_type_id, warehouse_id, related_warehouse_id, source_document_*.

## Módulo: Documentos

### document_types
- Propósito: tipología documental configurable.

### document_sequences
- Propósito: correlativos por empresa, tipo y año.

### documents / document_details
- Propósito: cabecera y detalle de documentos comerciales.
- Regla: estado DRAFT/CONFIRMED/CANCELLED.
- Clave única: company_id + document_type_id + sequence_number.

## Módulo: POS y Caja

### pos_terminals / cash_registers
- Propósito: dispositivos y cajas por local.

### cash_openings / cash_closings
- Propósito: apertura/cierre con cuadratura.

### sales / sale_details / sale_payments
- Propósito: venta POS, detalle e imputación por método de pago.

### payment_methods
- Propósito: efectivo, tarjeta, transferencia, etc.

### cash_movements
- Propósito: ingresos/egresos de caja fuera de detalle de ventas.

## Módulo: Auditoría

### audit_logs
- Propósito: trazabilidad de cambios críticos (insert/update/delete).
- Datos de evidencia: old_data/new_data JSON, changed_by, changed_at.

## Índices recomendados (resumen)

- Operacional por tenant: company_id + estado/fecha.
- Transaccional: company_id + movement_date/sold_at/document_date.
- Búsqueda catálogo: company_id + code/name/sku/barcode.
- Auditoría: company_id + table_name + changed_at.

## Scripts relacionados

- [backend/database/migrations/20260425_001_multi_tenant_schema.sql](../../backend/database/migrations/20260425_001_multi_tenant_schema.sql)
- [backend/database/migrations/20260425_002_business_logic.sql](../../backend/database/migrations/20260425_002_business_logic.sql)
- [backend/database/migrations/20260425_003_performance_strategy.sql](../../backend/database/migrations/20260425_003_performance_strategy.sql)
