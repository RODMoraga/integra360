-- =====================================================================================
-- Integra360 - E2E Validation Script (Idempotent + Clean)
-- Scope: Referential integrity + inventory triggers + sale/cash close flow
-- Behavior:
--   - Creates a temporary tenant per run using timestamp prefix
--   - Runs full business scenario
--   - Rolls back by default (no data accumulation)
--   - Can persist data with @persist_data = 1
-- =====================================================================================

SET @persist_data = COALESCE(@persist_data, 0);
SET @run_tag = DATE_FORMAT(UTC_TIMESTAMP(), '%Y%m%d%H%i%s');

SET @region_code = CONCAT('RM_', @run_tag);
SET @city_code = CONCAT('SCL_', @run_tag);
SET @commune_code = CONCAT('COM_', @run_tag);

SET @company_code = CONCAT('E2E_COMP_', @run_tag);
SET @company_tax = CONCAT('76', RIGHT(@run_tag, 8), '-1');
SET @admin_email = CONCAT('admin.e2e+', @run_tag, '@integra360.local');

START TRANSACTION;

-- Seed minimal geography (isolated per run)
INSERT INTO regions (country_code, code, name)
VALUES ('CL', @region_code, CONCAT('Region E2E ', @run_tag));
SET @region_id = LAST_INSERT_ID();

INSERT INTO cities (region_id, code, name)
VALUES (@region_id, @city_code, CONCAT('Ciudad E2E ', @run_tag));
SET @city_id = LAST_INSERT_ID();

INSERT INTO communes (city_id, code, name, postal_code)
VALUES (@city_id, @commune_code, CONCAT('Comuna E2E ', @run_tag), '8320000');
SET @commune_id = LAST_INSERT_ID();

-- Company
INSERT INTO companies (code, legal_name, tax_id, timezone, currency_code, commune_id)
VALUES (@company_code, CONCAT('Empresa E2E ', @run_tag), @company_tax, 'America/Santiago', 'CLP', @commune_id);
SET @company_id = LAST_INSERT_ID();

-- Users / security seeds
INSERT INTO users (company_id, full_name, email, password_hash)
VALUES (@company_id, 'Admin E2E', @admin_email, '$2a$10$seedhash');
SET @user_id = LAST_INSERT_ID();

INSERT INTO roles (company_id, code, name, is_system)
VALUES (@company_id, 'ADMIN', 'Administrador', 1);
SET @role_id = LAST_INSERT_ID();

INSERT INTO user_roles (user_id, role_id)
VALUES (@user_id, @role_id);

-- Product master setup
INSERT INTO units_of_measure (company_id, code, name, symbol, unit_type, is_base_unit)
VALUES
(@company_id, 'UN', 'Unidad', 'un', 'COUNT', 1),
(@company_id, 'CJ', 'Caja', 'cj', 'COUNT', 0);

SET @uom_un = (SELECT id FROM units_of_measure WHERE company_id = @company_id AND code = 'UN' LIMIT 1);
SET @uom_cj = (SELECT id FROM units_of_measure WHERE company_id = @company_id AND code = 'CJ' LIMIT 1);

INSERT INTO unit_conversions (company_id, from_unit_id, to_unit_id, factor)
VALUES
(@company_id, @uom_cj, @uom_un, 12.00000000),
(@company_id, @uom_un, @uom_cj, 0.08333333);

INSERT INTO categories (company_id, code, name)
VALUES (@company_id, 'BEB', 'Bebidas');
SET @category_id = LAST_INSERT_ID();

INSERT INTO brands (company_id, code, name)
VALUES (@company_id, 'GEN', 'Generica');
SET @brand_id = LAST_INSERT_ID();

INSERT INTO models (company_id, brand_id, code, name)
VALUES (@company_id, @brand_id, 'LATA500', 'Lata 500ml');
SET @model_id = LAST_INSERT_ID();

SET @barcode_value = CONCAT('780', @run_tag, '11');

INSERT INTO products (company_id, sku, barcode, name, category_id, brand_id, model_id, base_uom_id, tax_rate)
VALUES (@company_id, 'PROD-CERVEZA', @barcode_value, 'Cerveza Rubia 500ml', @category_id, @brand_id, @model_id, @uom_un, 19.0000);
SET @product_id = LAST_INSERT_ID();

INSERT INTO product_variants (company_id, product_id, variant_code, name, sku, barcode, cost_price, sale_price)
VALUES (@company_id, @product_id, 'PROD-CERVEZA-UN', 'Cerveza Rubia 500ml Unidad', 'SKU-CERVEZA-UN', @barcode_value, 800, 1200);
SET @variant_id = LAST_INSERT_ID();

-- Warehouses and POS
INSERT INTO warehouses (company_id, code, name, commune_id, is_main)
VALUES (@company_id, 'WH-001', 'Bodega Central', @commune_id, 1);
SET @warehouse_id = LAST_INSERT_ID();

INSERT INTO pos_terminals (company_id, warehouse_id, code, name, device_name, is_active)
VALUES (@company_id, @warehouse_id, 'POS-01', 'Caja Principal', 'Terminal-Caja-1', 1);
SET @terminal_id = LAST_INSERT_ID();

INSERT INTO cash_registers (company_id, terminal_id, code, name)
VALUES (@company_id, @terminal_id, 'CR-01', 'Caja Registradora 1');
SET @cash_register_id = LAST_INSERT_ID();

INSERT INTO payment_methods (company_id, code, name, is_cash, is_active)
VALUES
(@company_id, 'CASH', 'Efectivo', 1, 1),
(@company_id, 'CARD', 'Tarjeta', 0, 1);
SET @pm_cash = (SELECT id FROM payment_methods WHERE company_id = @company_id AND code = 'CASH' LIMIT 1);

-- Customer
INSERT INTO customers (company_id, code, tax_id, legal_name, payment_terms_days, credit_limit, is_active)
VALUES (@company_id, 'CLI-001', CONCAT('11', RIGHT(@run_tag, 6), '-1'), 'Cliente Mostrador', 0, 0, 1);
SET @customer_id = LAST_INSERT_ID();

-- OPEN CASH
INSERT INTO cash_openings (company_id, cash_register_id, user_id, opening_amount, status)
VALUES (@company_id, @cash_register_id, @user_id, 50000, 'OPEN');
SET @cash_opening_id = LAST_INSERT_ID();

-- STOCK IN (purchase-like movement)
SET @mt_purchase = (SELECT id FROM inventory_movement_types WHERE code = 'PURCHASE' LIMIT 1);
INSERT INTO inventory_movements (
  company_id,
  movement_type_id,
  warehouse_id,
  product_variant_id,
  quantity,
  unit_cost,
  reason,
  source_document_type,
  created_by
) VALUES (
  @company_id,
  @mt_purchase,
  @warehouse_id,
  @variant_id,
  100,
  800,
  'Ingreso inicial E2E',
  'SUPPLIER_INVOICE',
  @user_id
);

-- SALE CONFIRMED
INSERT INTO sales (
  company_id,
  cash_opening_id,
  terminal_id,
  customer_id,
  sold_at,
  status,
  subtotal,
  tax_total,
  discount_total,
  total,
  created_by
) VALUES (
  @company_id,
  @cash_opening_id,
  @terminal_id,
  @customer_id,
  NOW(),
  'CONFIRMED',
  6000,
  1140,
  0,
  7140,
  @user_id
);
SET @sale_id = LAST_INSERT_ID();

INSERT INTO sale_details (
  company_id,
  sale_id,
  line_number,
  warehouse_id,
  product_variant_id,
  quantity,
  unit_price,
  discount_amount,
  tax_amount,
  line_total
) VALUES (
  @company_id,
  @sale_id,
  1,
  @warehouse_id,
  @variant_id,
  5,
  1200,
  0,
  1140,
  7140
);

-- Stock out movement tied to sale
SET @mt_sale = (SELECT id FROM inventory_movement_types WHERE code = 'SALE' LIMIT 1);
INSERT INTO inventory_movements (
  company_id,
  movement_type_id,
  warehouse_id,
  product_variant_id,
  quantity,
  unit_cost,
  reason,
  source_document_type,
  source_document_id,
  created_by
) VALUES (
  @company_id,
  @mt_sale,
  @warehouse_id,
  @variant_id,
  5,
  800,
  'Salida por venta E2E',
  'SALE',
  @sale_id,
  @user_id
);

-- Payment and cash movements
INSERT INTO sale_payments (company_id, sale_id, payment_method_id, amount)
VALUES (@company_id, @sale_id, @pm_cash, 7140);

INSERT INTO cash_movements (company_id, cash_opening_id, movement_type, amount, reason, reference_type, reference_id, created_by)
VALUES
(@company_id, @cash_opening_id, 'IN', 7140, 'Ingreso por venta E2E', 'SALE', @sale_id, @user_id),
(@company_id, @cash_opening_id, 'OUT', 1000, 'Retiro caja menor', 'ADJUST', NULL, @user_id);

-- Close cash using procedure
CALL sp_close_cash_opening(@company_id, @cash_opening_id, @user_id, 63280, 'Cierre E2E sin diferencia');

-- Validations
SELECT 'CHECK_CONTEXT' AS check_name,
       @run_tag AS run_tag,
       @company_code AS company_code,
       @company_id AS company_id;

SELECT 'CHECK_STOCK_AVAILABLE' AS check_name,
       fn_stock_available(@company_id, @variant_id, @warehouse_id) AS stock_available_expected_95;

SELECT 'CHECK_INVENTORY' AS check_name,
       quantity_on_hand,
       quantity_reserved,
       quantity_available
  FROM inventory
 WHERE company_id = @company_id
   AND warehouse_id = @warehouse_id
   AND product_variant_id = @variant_id;

SELECT 'CHECK_CASH_CLOSING' AS check_name,
       cc.expected_amount,
       cc.counted_amount,
       cc.difference_amount
  FROM cash_closings cc
 WHERE cc.company_id = @company_id
   AND cc.cash_opening_id = @cash_opening_id
 ORDER BY cc.id DESC
 LIMIT 1;

SELECT 'CHECK_AUDIT_MOVEMENTS' AS check_name,
       COUNT(*) AS audit_rows
  FROM audit_logs
 WHERE company_id = @company_id
   AND table_name = 'inventory_movements';

SELECT 'CHECK_REFERENTIAL_COUNTS' AS check_name,
       (SELECT COUNT(*) FROM companies WHERE id = @company_id) AS companies_cnt,
       (SELECT COUNT(*) FROM users WHERE company_id = @company_id) AS users_cnt,
       (SELECT COUNT(*) FROM warehouses WHERE company_id = @company_id) AS warehouses_cnt,
       (SELECT COUNT(*) FROM sales WHERE company_id = @company_id) AS sales_cnt;

-- Transaction cleanup strategy (default ROLLBACK)
SET @tx_action = IF(@persist_data = 1, 'COMMIT', 'ROLLBACK');
SET @tx_sql = @tx_action;
PREPARE stmt_tx FROM @tx_sql;
EXECUTE stmt_tx;
DEALLOCATE PREPARE stmt_tx;

SELECT 'CHECK_CLEANUP' AS check_name,
       @tx_action AS transaction_action,
       (SELECT COUNT(*) FROM companies WHERE code = @company_code) AS company_rows_after_tx;
