-- =====================================================================================
-- Integra360 - Performance and Scalability Strategy (MySQL 8+)
-- Version: 20260425_003
-- Scope: additional indexes + partitioning templates for high-volume tables
-- =====================================================================================

-- ---------------------------------------------------------------------
-- 1) INDEXES COMPUESTOS ADICIONALES
-- ---------------------------------------------------------------------

CREATE INDEX idx_sales_company_opening_date
  ON sales(company_id, cash_opening_id, sold_at);

CREATE INDEX idx_documents_company_type_date_status
  ON documents(company_id, document_type_id, document_date, status);

CREATE INDEX idx_inventory_movements_company_type_date
  ON inventory_movements(company_id, movement_type_id, movement_date);

CREATE INDEX idx_audit_logs_company_date_action
  ON audit_logs(company_id, changed_at, action_type);

-- ---------------------------------------------------------------------
-- 2) PARTICIONAMIENTO - PLANTILLAS (EJECUTAR SEGUN VOLUMEN REAL)
-- ---------------------------------------------------------------------
-- Nota:
-- - En MySQL, tablas con foreign keys y particionamiento requieren planificacion.
-- - Se recomienda aplicar particionamiento al superar umbrales de datos definidos.
-- - Las tablas candidatas: inventory_movements, sales, audit_logs.

-- Ejemplo referencia para tabla sin FK complejas o en arquitectura ajustada:
-- ALTER TABLE audit_logs
-- PARTITION BY RANGE (YEAR(changed_at)) (
--   PARTITION p2025 VALUES LESS THAN (2026),
--   PARTITION p2026 VALUES LESS THAN (2027),
--   PARTITION pmax VALUES LESS THAN MAXVALUE
-- );

-- ---------------------------------------------------------------------
-- 3) SHARDING LOGICO (ESTRATEGIA RECOMENDADA)
-- ---------------------------------------------------------------------
-- Estrategia sugerida por fase:
-- Fase 1: aislamiento por company_id con indices compuestos (actual).
-- Fase 2: separar companies de alto volumen en instancia dedicada.
-- Fase 3: routing por company_id hash/mod para cluster horizontal.

-- ---------------------------------------------------------------------
-- 4) CONSULTAS DE MONITOREO
-- ---------------------------------------------------------------------

-- Top tablas por crecimiento
-- SELECT table_name, table_rows, data_length, index_length
-- FROM information_schema.tables
-- WHERE table_schema = DATABASE()
-- ORDER BY data_length DESC;

-- Uso de indices por tabla
-- SHOW INDEX FROM sales;
-- SHOW INDEX FROM inventory_movements;

-- Plan de ejecucion recomendado en reportes criticos
-- EXPLAIN FORMAT=JSON
-- SELECT * FROM sales
-- WHERE company_id = 1
--   AND sold_at BETWEEN '2026-01-01' AND '2026-01-31';
