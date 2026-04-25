-- =====================================================================================
-- Integra360 - Seed Base Catalogs
-- Version: 20260425_004
-- Scope: Roles, permissions, units, payment methods, and document types by company
-- =====================================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_seed_base_catalogs $$
CREATE PROCEDURE sp_seed_base_catalogs(
  IN p_company_id BIGINT UNSIGNED,
  IN p_created_by BIGINT UNSIGNED
)
BEGIN
  -- ---------------------------
  -- Roles
  -- ---------------------------
  INSERT INTO roles (company_id, code, name, description, is_system, created_by)
  VALUES
    (p_company_id, 'ADMIN', 'Administrador', 'Acceso total al sistema', 1, p_created_by),
    (p_company_id, 'MANAGER', 'Encargado', 'Gestion comercial e inventario', 1, p_created_by),
    (p_company_id, 'CASHIER', 'Cajero', 'Operacion de punto de venta', 1, p_created_by),
    (p_company_id, 'WAREHOUSE', 'Bodega', 'Operacion logistica de inventario', 1, p_created_by)
  ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    updated_at = CURRENT_TIMESTAMP;

  -- ---------------------------
  -- Permissions (global)
  -- ---------------------------
  INSERT INTO permissions (code, name, module_name, description)
  VALUES
    ('users.read', 'Ver usuarios', 'security', 'Consulta de usuarios'),
    ('users.write', 'Gestionar usuarios', 'security', 'Crear/editar/desactivar usuarios'),
    ('roles.manage', 'Gestionar roles', 'security', 'Asignacion de roles y permisos'),

    ('catalog.read', 'Ver catalogo', 'catalog', 'Consulta productos y maestros'),
    ('catalog.write', 'Gestionar catalogo', 'catalog', 'Crear/editar productos y variantes'),

    ('inventory.read', 'Ver inventario', 'inventory', 'Consulta stock y movimientos'),
    ('inventory.write', 'Gestionar inventario', 'inventory', 'Ajustes, ingresos, traslados'),

    ('documents.read', 'Ver documentos', 'documents', 'Consulta documentos comerciales'),
    ('documents.write', 'Gestionar documentos', 'documents', 'Crear/confirmar/cancelar documentos'),

    ('pos.open', 'Abrir caja', 'pos', 'Apertura de caja'),
    ('pos.sell', 'Registrar venta', 'pos', 'Operacion de venta POS'),
    ('pos.close', 'Cerrar caja', 'pos', 'Cierre y cuadratura de caja'),

    ('reports.read', 'Ver reportes', 'reports', 'Consulta reportes operacionales')
  ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    module_name = VALUES(module_name),
    description = VALUES(description),
    updated_at = CURRENT_TIMESTAMP;

  -- ---------------------------
  -- Role-Permission mapping
  -- ---------------------------
  SET @role_admin = (SELECT id FROM roles WHERE company_id = p_company_id AND code = 'ADMIN' LIMIT 1);
  SET @role_manager = (SELECT id FROM roles WHERE company_id = p_company_id AND code = 'MANAGER' LIMIT 1);
  SET @role_cashier = (SELECT id FROM roles WHERE company_id = p_company_id AND code = 'CASHIER' LIMIT 1);
  SET @role_warehouse = (SELECT id FROM roles WHERE company_id = p_company_id AND code = 'WAREHOUSE' LIMIT 1);

  -- ADMIN = all permissions
  INSERT INTO role_permissions (role_id, permission_id, granted_by)
  SELECT @role_admin, p.id, p_created_by
    FROM permissions p
  ON DUPLICATE KEY UPDATE granted_at = CURRENT_TIMESTAMP;

  -- MANAGER = catalog/inventory/documents/reports + users.read
  INSERT INTO role_permissions (role_id, permission_id, granted_by)
  SELECT @role_manager, p.id, p_created_by
    FROM permissions p
   WHERE p.code IN (
     'users.read',
     'catalog.read', 'catalog.write',
     'inventory.read', 'inventory.write',
     'documents.read', 'documents.write',
     'reports.read'
   )
  ON DUPLICATE KEY UPDATE granted_at = CURRENT_TIMESTAMP;

  -- CASHIER = POS + catalog.read + inventory.read
  INSERT INTO role_permissions (role_id, permission_id, granted_by)
  SELECT @role_cashier, p.id, p_created_by
    FROM permissions p
   WHERE p.code IN (
     'catalog.read',
     'inventory.read',
     'pos.open', 'pos.sell', 'pos.close'
   )
  ON DUPLICATE KEY UPDATE granted_at = CURRENT_TIMESTAMP;

  -- WAREHOUSE = inventory + documents.read
  INSERT INTO role_permissions (role_id, permission_id, granted_by)
  SELECT @role_warehouse, p.id, p_created_by
    FROM permissions p
   WHERE p.code IN (
     'inventory.read', 'inventory.write',
     'documents.read'
   )
  ON DUPLICATE KEY UPDATE granted_at = CURRENT_TIMESTAMP;

  -- ---------------------------
  -- Units of measure
  -- ---------------------------
  INSERT INTO units_of_measure (company_id, code, name, symbol, unit_type, is_base_unit)
  VALUES
    (p_company_id, 'UN', 'Unidad', 'un', 'COUNT', 1),
    (p_company_id, 'CJ', 'Caja', 'cj', 'COUNT', 0),
    (p_company_id, 'KG', 'Kilogramo', 'kg', 'WEIGHT', 1),
    (p_company_id, 'G', 'Gramo', 'g', 'WEIGHT', 0),
    (p_company_id, 'L', 'Litro', 'l', 'VOLUME', 1),
    (p_company_id, 'ML', 'Mililitro', 'ml', 'VOLUME', 0),
    (p_company_id, 'M', 'Metro', 'm', 'LENGTH', 1),
    (p_company_id, 'CM', 'Centimetro', 'cm', 'LENGTH', 0)
  ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    symbol = VALUES(symbol),
    unit_type = VALUES(unit_type),
    updated_at = CURRENT_TIMESTAMP;

  SET @u_un = (SELECT id FROM units_of_measure WHERE company_id = p_company_id AND code = 'UN' LIMIT 1);
  SET @u_cj = (SELECT id FROM units_of_measure WHERE company_id = p_company_id AND code = 'CJ' LIMIT 1);
  SET @u_kg = (SELECT id FROM units_of_measure WHERE company_id = p_company_id AND code = 'KG' LIMIT 1);
  SET @u_g = (SELECT id FROM units_of_measure WHERE company_id = p_company_id AND code = 'G' LIMIT 1);
  SET @u_l = (SELECT id FROM units_of_measure WHERE company_id = p_company_id AND code = 'L' LIMIT 1);
  SET @u_ml = (SELECT id FROM units_of_measure WHERE company_id = p_company_id AND code = 'ML' LIMIT 1);
  SET @u_m = (SELECT id FROM units_of_measure WHERE company_id = p_company_id AND code = 'M' LIMIT 1);
  SET @u_cm = (SELECT id FROM units_of_measure WHERE company_id = p_company_id AND code = 'CM' LIMIT 1);

  INSERT INTO unit_conversions (company_id, from_unit_id, to_unit_id, factor)
  VALUES
    (p_company_id, @u_cj, @u_un, 12.00000000),
    (p_company_id, @u_un, @u_cj, 0.08333333),
    (p_company_id, @u_kg, @u_g, 1000.00000000),
    (p_company_id, @u_g, @u_kg, 0.00100000),
    (p_company_id, @u_l, @u_ml, 1000.00000000),
    (p_company_id, @u_ml, @u_l, 0.00100000),
    (p_company_id, @u_m, @u_cm, 100.00000000),
    (p_company_id, @u_cm, @u_m, 0.01000000)
  ON DUPLICATE KEY UPDATE factor = VALUES(factor), updated_at = CURRENT_TIMESTAMP;

  -- ---------------------------
  -- Payment methods
  -- ---------------------------
  INSERT INTO payment_methods (company_id, code, name, requires_reference, is_cash, is_active)
  VALUES
    (p_company_id, 'CASH', 'Efectivo', 0, 1, 1),
    (p_company_id, 'DEBIT_CARD', 'Tarjeta Debito', 1, 0, 1),
    (p_company_id, 'CREDIT_CARD', 'Tarjeta Credito', 1, 0, 1),
    (p_company_id, 'TRANSFER', 'Transferencia', 1, 0, 1),
    (p_company_id, 'MOBILE_PAY', 'Pago Movil', 1, 0, 1)
  ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    requires_reference = VALUES(requires_reference),
    is_cash = VALUES(is_cash),
    is_active = VALUES(is_active),
    updated_at = CURRENT_TIMESTAMP;

  -- ---------------------------
  -- Document types (global)
  -- ---------------------------
  INSERT INTO document_types (code, name, counterpart_scope, affects_inventory, affects_accounting)
  VALUES
    ('INVOICE', 'Factura', 'CUSTOMER', 1, 1),
    ('SALES_NOTE', 'Nota de Venta', 'CUSTOMER', 1, 1),
    ('DELIVERY_NOTE', 'Guia de Despacho', 'CUSTOMER', 1, 1),
    ('PURCHASE_ORDER', 'Orden de Compra', 'SUPPLIER', 0, 0),
    ('SUPPLIER_INVOICE', 'Factura Proveedor', 'SUPPLIER', 1, 1),
    ('CREDIT_NOTE', 'Nota de Credito', 'CUSTOMER', 1, 1)
  ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    counterpart_scope = VALUES(counterpart_scope),
    affects_inventory = VALUES(affects_inventory),
    affects_accounting = VALUES(affects_accounting);

END $$

DELIMITER ;

-- Example execution:
-- CALL sp_seed_base_catalogs(1, 1);
