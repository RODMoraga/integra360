# Reglas de Negocio Implementadas

## 1) Triggers

### Inventario
- trg_inventory_movements_bi
  - Valida que quantity > 0.
  - Valida existencia de movement_type_id.
  - Si dirección = OUT, valida stock disponible antes de permitir inserción.

- trg_inventory_movements_ai
  - Crea fila en inventory si no existe (upsert lógico).
  - Aplica impacto automático en stock:
    - IN/TRANSFER: suma en bodega origen.
    - OUT: resta en bodega origen.
  - Para TRANSFER con related_warehouse_id, suma stock en bodega destino.

### Ventas y Caja
- trg_sales_bu
  - Evita reabrir ventas canceladas.

- trg_cash_closings_bi
  - Impide cierre de caja si la apertura no existe o no está OPEN.

### Auditoría
- trg_documents_au
  - Registra cambios relevantes de documents en audit_logs.

- trg_inventory_movements_ai_audit
  - Registra inserciones de movimientos de inventario en audit_logs.

## 2) Funciones

- fn_stock_available(company_id, product_variant_id, warehouse_id)
  - Retorna quantity_on_hand - quantity_reserved.
  - Soporta validaciones en tiempo real para operaciones OUT.

- fn_convert_unit(company_id, from_unit_id, to_unit_id, quantity)
  - Convierte cantidades entre unidades por company_id.
  - Lanza excepción si no existe factor de conversión.

## 3) Procedimientos

- sp_next_document_number(company_id, document_type_id, year, OUT next_number)
  - Genera correlativo transaccional por empresa/tipo/año.
  - Evita colisiones usando bloqueo FOR UPDATE.

- sp_close_cash_opening(company_id, cash_opening_id, user_id, counted_amount, note)
  - Calcula expected_amount = apertura + ventas + ingresos - egresos.
  - Inserta cash_closings con diferencia.
  - Cambia estado de cash_openings a CLOSED.

## 4) Soft delete y trazabilidad

- Tablas críticas incluyen deleted_at para retención histórica.
- created_by disponible para trazabilidad de origen.
- audit_logs centraliza evidencia JSON old/new.

## 5) Escalabilidad operativa

- Índices compuestos por tenant y fecha en tablas volumétricas.
- Plantillas de particionamiento en script de performance.
- Estrategia incremental de sharding lógico por company_id.

## 6) Ubicación de scripts

- Modelo: [backend/database/migrations/20260425_001_multi_tenant_schema.sql](../../backend/database/migrations/20260425_001_multi_tenant_schema.sql)
- Lógica: [backend/database/migrations/20260425_002_business_logic.sql](../../backend/database/migrations/20260425_002_business_logic.sql)
- Performance: [backend/database/migrations/20260425_003_performance_strategy.sql](../../backend/database/migrations/20260425_003_performance_strategy.sql)
