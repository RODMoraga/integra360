-- =====================================================================================
-- Integra360 - Business Logic (MySQL 8+)
-- Version: 20260425_002
-- Scope: Functions, procedures, and triggers for consistency and automation
-- =====================================================================================

DELIMITER $$

-- ---------------------------------------------------------------------
-- 1) FUNCIONES
-- ---------------------------------------------------------------------

DROP FUNCTION IF EXISTS fn_stock_available $$
CREATE FUNCTION fn_stock_available(
  p_company_id BIGINT UNSIGNED,
  p_product_variant_id BIGINT UNSIGNED,
  p_warehouse_id BIGINT UNSIGNED
) RETURNS DECIMAL(18,4)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE v_available DECIMAL(18,4) DEFAULT 0;

  SELECT COALESCE(i.quantity_on_hand - i.quantity_reserved, 0)
    INTO v_available
    FROM inventory i
   WHERE i.company_id = p_company_id
     AND i.product_variant_id = p_product_variant_id
     AND i.warehouse_id = p_warehouse_id
   LIMIT 1;

  RETURN COALESCE(v_available, 0);
END $$

DROP FUNCTION IF EXISTS fn_convert_unit $$
CREATE FUNCTION fn_convert_unit(
  p_company_id BIGINT UNSIGNED,
  p_from_unit_id BIGINT UNSIGNED,
  p_to_unit_id BIGINT UNSIGNED,
  p_quantity DECIMAL(18,8)
) RETURNS DECIMAL(18,8)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE v_factor DECIMAL(18,8);

  IF p_from_unit_id = p_to_unit_id THEN
    RETURN p_quantity;
  END IF;

  SELECT uc.factor
    INTO v_factor
    FROM unit_conversions uc
   WHERE uc.company_id = p_company_id
     AND uc.from_unit_id = p_from_unit_id
     AND uc.to_unit_id = p_to_unit_id
   LIMIT 1;

  IF v_factor IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'No unit conversion configured for given units/company';
  END IF;

  RETURN p_quantity * v_factor;
END $$

-- ---------------------------------------------------------------------
-- 2) PROCEDIMIENTOS
-- ---------------------------------------------------------------------

DROP PROCEDURE IF EXISTS sp_next_document_number $$
CREATE PROCEDURE sp_next_document_number(
  IN p_company_id BIGINT UNSIGNED,
  IN p_document_type_id BIGINT UNSIGNED,
  IN p_year SMALLINT UNSIGNED,
  OUT p_next_number BIGINT UNSIGNED
)
BEGIN
  DECLARE v_exists BIGINT;

  SELECT COUNT(*) INTO v_exists
    FROM document_sequences ds
   WHERE ds.company_id = p_company_id
     AND ds.document_type_id = p_document_type_id
     AND ds.year_num = p_year
   FOR UPDATE;

  IF v_exists = 0 THEN
    INSERT INTO document_sequences (company_id, document_type_id, year_num, next_number)
    VALUES (p_company_id, p_document_type_id, p_year, 2);
    SET p_next_number = 1;
  ELSE
    SELECT next_number INTO p_next_number
      FROM document_sequences
     WHERE company_id = p_company_id
       AND document_type_id = p_document_type_id
       AND year_num = p_year
     FOR UPDATE;

    UPDATE document_sequences
       SET next_number = next_number + 1
     WHERE company_id = p_company_id
       AND document_type_id = p_document_type_id
       AND year_num = p_year;
  END IF;
END $$

DROP PROCEDURE IF EXISTS sp_close_cash_opening $$
CREATE PROCEDURE sp_close_cash_opening(
  IN p_company_id BIGINT UNSIGNED,
  IN p_cash_opening_id BIGINT UNSIGNED,
  IN p_user_id BIGINT UNSIGNED,
  IN p_counted_amount DECIMAL(18,4),
  IN p_note VARCHAR(255)
)
BEGIN
  DECLARE v_status VARCHAR(20);
  DECLARE v_opening_amount DECIMAL(18,4);
  DECLARE v_sales_total DECIMAL(18,4);
  DECLARE v_cash_in DECIMAL(18,4);
  DECLARE v_cash_out DECIMAL(18,4);
  DECLARE v_expected DECIMAL(18,4);
  DECLARE v_diff DECIMAL(18,4);

  SELECT co.status, co.opening_amount
    INTO v_status, v_opening_amount
    FROM cash_openings co
   WHERE co.id = p_cash_opening_id
     AND co.company_id = p_company_id
   LIMIT 1;

  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Cash opening not found for company';
  END IF;

  IF v_status <> 'OPEN' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Cash opening is not in OPEN state';
  END IF;

  SELECT COALESCE(SUM(s.total), 0)
    INTO v_sales_total
    FROM sales s
   WHERE s.company_id = p_company_id
     AND s.cash_opening_id = p_cash_opening_id
     AND s.status = 'CONFIRMED';

  SELECT COALESCE(SUM(cm.amount), 0)
    INTO v_cash_in
    FROM cash_movements cm
   WHERE cm.company_id = p_company_id
     AND cm.cash_opening_id = p_cash_opening_id
     AND cm.movement_type = 'IN';

  SELECT COALESCE(SUM(cm.amount), 0)
    INTO v_cash_out
    FROM cash_movements cm
   WHERE cm.company_id = p_company_id
     AND cm.cash_opening_id = p_cash_opening_id
     AND cm.movement_type = 'OUT';

  SET v_expected = v_opening_amount + v_sales_total + v_cash_in - v_cash_out;
  SET v_diff = p_counted_amount - v_expected;

  INSERT INTO cash_closings (
    company_id,
    cash_opening_id,
    user_id,
    expected_amount,
    counted_amount,
    difference_amount,
    note
  ) VALUES (
    p_company_id,
    p_cash_opening_id,
    p_user_id,
    v_expected,
    p_counted_amount,
    v_diff,
    p_note
  );

  UPDATE cash_openings
     SET status = 'CLOSED',
         updated_at = CURRENT_TIMESTAMP
   WHERE id = p_cash_opening_id
     AND company_id = p_company_id;
END $$

-- ---------------------------------------------------------------------
-- 3) TRIGGERS INVENTARIO
-- ---------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_inventory_movements_bi $$
CREATE TRIGGER trg_inventory_movements_bi
BEFORE INSERT ON inventory_movements
FOR EACH ROW
BEGIN
  DECLARE v_direction VARCHAR(20);
  DECLARE v_available DECIMAL(18,4);

  IF NEW.quantity <= 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Movement quantity must be greater than zero';
  END IF;

  SELECT imt.direction INTO v_direction
    FROM inventory_movement_types imt
   WHERE imt.id = NEW.movement_type_id
   LIMIT 1;

  IF v_direction IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Invalid movement_type_id';
  END IF;

  IF v_direction = 'OUT' THEN
    SET v_available = fn_stock_available(NEW.company_id, NEW.product_variant_id, NEW.warehouse_id);
    IF v_available < NEW.quantity THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Insufficient stock for OUT movement';
    END IF;
  END IF;
END $$

DROP TRIGGER IF EXISTS trg_inventory_movements_ai $$
CREATE TRIGGER trg_inventory_movements_ai
AFTER INSERT ON inventory_movements
FOR EACH ROW
BEGIN
  DECLARE v_direction VARCHAR(20);

  SELECT imt.direction INTO v_direction
    FROM inventory_movement_types imt
   WHERE imt.id = NEW.movement_type_id
   LIMIT 1;

  INSERT INTO inventory (
    company_id,
    warehouse_id,
    product_variant_id,
    quantity_on_hand,
    quantity_reserved
  ) VALUES (
    NEW.company_id,
    NEW.warehouse_id,
    NEW.product_variant_id,
    0,
    0
  )
  ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

  IF v_direction = 'IN' OR v_direction = 'TRANSFER' THEN
    UPDATE inventory
       SET quantity_on_hand = quantity_on_hand + NEW.quantity,
           updated_at = CURRENT_TIMESTAMP
     WHERE company_id = NEW.company_id
       AND warehouse_id = NEW.warehouse_id
       AND product_variant_id = NEW.product_variant_id;
  ELSEIF v_direction = 'OUT' THEN
    UPDATE inventory
       SET quantity_on_hand = quantity_on_hand - NEW.quantity,
           updated_at = CURRENT_TIMESTAMP
     WHERE company_id = NEW.company_id
       AND warehouse_id = NEW.warehouse_id
       AND product_variant_id = NEW.product_variant_id;
  END IF;

  IF v_direction = 'TRANSFER' AND NEW.related_warehouse_id IS NOT NULL THEN
    INSERT INTO inventory (
      company_id,
      warehouse_id,
      product_variant_id,
      quantity_on_hand,
      quantity_reserved
    ) VALUES (
      NEW.company_id,
      NEW.related_warehouse_id,
      NEW.product_variant_id,
      0,
      0
    )
    ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

    UPDATE inventory
       SET quantity_on_hand = quantity_on_hand + NEW.quantity,
           updated_at = CURRENT_TIMESTAMP
     WHERE company_id = NEW.company_id
       AND warehouse_id = NEW.related_warehouse_id
       AND product_variant_id = NEW.product_variant_id;
  END IF;
END $$

-- ---------------------------------------------------------------------
-- 4) TRIGGERS VENTA/CAJA
-- ---------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_sales_bu $$
CREATE TRIGGER trg_sales_bu
BEFORE UPDATE ON sales
FOR EACH ROW
BEGIN
  IF OLD.status = 'CANCELLED' AND NEW.status <> 'CANCELLED' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Cancelled sale cannot be reopened';
  END IF;
END $$

DROP TRIGGER IF EXISTS trg_cash_closings_bi $$
CREATE TRIGGER trg_cash_closings_bi
BEFORE INSERT ON cash_closings
FOR EACH ROW
BEGIN
  DECLARE v_status VARCHAR(20);

  SELECT co.status INTO v_status
    FROM cash_openings co
   WHERE co.id = NEW.cash_opening_id
     AND co.company_id = NEW.company_id
   LIMIT 1;

  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Cash opening not found';
  END IF;

  IF v_status <> 'OPEN' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Cash opening already closed';
  END IF;
END $$

-- ---------------------------------------------------------------------
-- 5) AUDITORIA AUTOMATICA (TABLAS CRITICAS)
-- ---------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_documents_au $$
CREATE TRIGGER trg_documents_au
AFTER UPDATE ON documents
FOR EACH ROW
BEGIN
  INSERT INTO audit_logs (
    company_id,
    table_name,
    row_pk,
    action_type,
    changed_by,
    old_data,
    new_data
  ) VALUES (
    NEW.company_id,
    'documents',
    CAST(NEW.id AS CHAR),
    'UPDATE',
    NEW.created_by,
    JSON_OBJECT(
      'status', OLD.status,
      'total', OLD.total,
      'updated_at', OLD.updated_at
    ),
    JSON_OBJECT(
      'status', NEW.status,
      'total', NEW.total,
      'updated_at', NEW.updated_at
    )
  );
END $$

DROP TRIGGER IF EXISTS trg_inventory_movements_ai_audit $$
CREATE TRIGGER trg_inventory_movements_ai_audit
AFTER INSERT ON inventory_movements
FOR EACH ROW
BEGIN
  INSERT INTO audit_logs (
    company_id,
    table_name,
    row_pk,
    action_type,
    changed_by,
    new_data
  ) VALUES (
    NEW.company_id,
    'inventory_movements',
    CAST(NEW.id AS CHAR),
    'INSERT',
    NEW.created_by,
    JSON_OBJECT(
      'movement_type_id', NEW.movement_type_id,
      'warehouse_id', NEW.warehouse_id,
      'product_variant_id', NEW.product_variant_id,
      'quantity', NEW.quantity,
      'movement_date', NEW.movement_date
    )
  );
END $$

DELIMITER ;
