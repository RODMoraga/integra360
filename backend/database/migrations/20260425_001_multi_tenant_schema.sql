-- =====================================================================================
-- Integra360 - Multi-tenant Core Schema (MySQL 8+)
-- Version: 20260425_001
-- Scope: Core relational model for multi-company and multi-industry operations
-- =====================================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ---------------------------------------------------------------------
-- 1) ADMINISTRACION / SEGURIDAD
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS companies (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL,
  legal_name VARCHAR(180) NOT NULL,
  trade_name VARCHAR(180) NULL,
  tax_id VARCHAR(30) NOT NULL,
  industry_type VARCHAR(60) NULL,
  email VARCHAR(160) NULL,
  phone VARCHAR(40) NULL,
  address_line VARCHAR(220) NULL,
  commune_id BIGINT UNSIGNED NULL,
  timezone VARCHAR(80) NOT NULL DEFAULT 'America/Santiago',
  currency_code CHAR(3) NOT NULL DEFAULT 'CLP',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  created_by BIGINT UNSIGNED NULL,
  UNIQUE KEY uk_companies_code (code),
  UNIQUE KEY uk_companies_tax_id (tax_id),
  KEY idx_companies_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(160) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  created_by BIGINT UNSIGNED NULL,
  UNIQUE KEY uk_users_company_email (company_id, email),
  KEY idx_users_company_active (company_id, is_active),
  CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS roles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  is_system TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  created_by BIGINT UNSIGNED NULL,
  UNIQUE KEY uk_roles_company_code (company_id, code),
  KEY idx_roles_company (company_id),
  CONSTRAINT fk_roles_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS permissions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(120) NOT NULL,
  module_name VARCHAR(80) NOT NULL,
  description VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_permissions_code (code),
  KEY idx_permissions_module (module_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  granted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  granted_by BIGINT UNSIGNED NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id),
  CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id BIGINT UNSIGNED NOT NULL,
  role_id BIGINT UNSIGNED NOT NULL,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  assigned_by BIGINT UNSIGNED NULL,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  terminal_id BIGINT UNSIGNED NULL,
  device_fingerprint VARCHAR(180) NULL,
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(255) NULL,
  login_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  logout_at DATETIME NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_user_sessions_company_user_active (company_id, user_id, is_active),
  KEY idx_user_sessions_login (login_at),
  CONSTRAINT fk_user_sessions_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2) GEOGRAFIA
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS regions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  country_code CHAR(2) NOT NULL DEFAULT 'CL',
  code VARCHAR(20) NOT NULL,
  name VARCHAR(120) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_regions_country_code (country_code, code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cities (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  region_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(120) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_cities_region_code (region_id, code),
  KEY idx_cities_region (region_id),
  CONSTRAINT fk_cities_region FOREIGN KEY (region_id) REFERENCES regions(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS communes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  city_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(120) NOT NULL,
  postal_code VARCHAR(20) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_communes_city_code (city_id, code),
  KEY idx_communes_city (city_id),
  CONSTRAINT fk_communes_city FOREIGN KEY (city_id) REFERENCES cities(id)
) ENGINE=InnoDB;

ALTER TABLE companies
  ADD CONSTRAINT fk_companies_commune FOREIGN KEY (commune_id) REFERENCES communes(id);

-- ---------------------------------------------------------------------
-- 3) CLIENTES / PROVEEDORES
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS customers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(40) NOT NULL,
  tax_id VARCHAR(30) NULL,
  legal_name VARCHAR(180) NOT NULL,
  business_activity VARCHAR(120) NULL,
  email VARCHAR(160) NULL,
  phone VARCHAR(40) NULL,
  address_line VARCHAR(220) NULL,
  commune_id BIGINT UNSIGNED NULL,
  payment_terms_days SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  credit_limit DECIMAL(18,4) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  created_by BIGINT UNSIGNED NULL,
  UNIQUE KEY uk_customers_company_code (company_id, code),
  KEY idx_customers_company_tax (company_id, tax_id),
  KEY idx_customers_company_name (company_id, legal_name),
  CONSTRAINT fk_customers_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_customers_commune FOREIGN KEY (commune_id) REFERENCES communes(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS customer_contacts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL,
  full_name VARCHAR(140) NOT NULL,
  email VARCHAR(160) NULL,
  phone VARCHAR(40) NULL,
  role_name VARCHAR(80) NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  KEY idx_customer_contacts_company_customer (company_id, customer_id),
  CONSTRAINT fk_customer_contacts_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_customer_contacts_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS suppliers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(40) NOT NULL,
  tax_id VARCHAR(30) NULL,
  legal_name VARCHAR(180) NOT NULL,
  business_activity VARCHAR(120) NULL,
  email VARCHAR(160) NULL,
  phone VARCHAR(40) NULL,
  address_line VARCHAR(220) NULL,
  commune_id BIGINT UNSIGNED NULL,
  payment_terms_days SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  created_by BIGINT UNSIGNED NULL,
  UNIQUE KEY uk_suppliers_company_code (company_id, code),
  KEY idx_suppliers_company_tax (company_id, tax_id),
  KEY idx_suppliers_company_name (company_id, legal_name),
  CONSTRAINT fk_suppliers_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_suppliers_commune FOREIGN KEY (commune_id) REFERENCES communes(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS supplier_contacts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  supplier_id BIGINT UNSIGNED NOT NULL,
  full_name VARCHAR(140) NOT NULL,
  email VARCHAR(160) NULL,
  phone VARCHAR(40) NULL,
  role_name VARCHAR(80) NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  KEY idx_supplier_contacts_company_supplier (company_id, supplier_id),
  CONSTRAINT fk_supplier_contacts_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_supplier_contacts_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4) CATALOGO PRODUCTOS
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY uk_categories_company_code (company_id, code),
  KEY idx_categories_company_name (company_id, name),
  CONSTRAINT fk_categories_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subcategories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY uk_subcategories_company_code (company_id, code),
  KEY idx_subcategories_category (category_id),
  CONSTRAINT fk_subcategories_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_subcategories_category FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS brands (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(120) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY uk_brands_company_code (company_id, code),
  KEY idx_brands_company_name (company_id, name),
  CONSTRAINT fk_brands_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS models (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  brand_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(120) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY uk_models_company_code (company_id, code),
  KEY idx_models_brand (brand_id),
  CONSTRAINT fk_models_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_models_brand FOREIGN KEY (brand_id) REFERENCES brands(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS units_of_measure (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(80) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  unit_type VARCHAR(40) NOT NULL,
  is_base_unit TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY uk_uom_company_code (company_id, code),
  KEY idx_uom_company_type (company_id, unit_type),
  CONSTRAINT fk_uom_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS unit_conversions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  from_unit_id BIGINT UNSIGNED NOT NULL,
  to_unit_id BIGINT UNSIGNED NOT NULL,
  factor DECIMAL(18,8) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_unit_conversions_pair (company_id, from_unit_id, to_unit_id),
  CONSTRAINT fk_unit_conversions_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_unit_conversions_from_uom FOREIGN KEY (from_unit_id) REFERENCES units_of_measure(id),
  CONSTRAINT fk_unit_conversions_to_uom FOREIGN KEY (to_unit_id) REFERENCES units_of_measure(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  sku VARCHAR(60) NOT NULL,
  barcode VARCHAR(80) NULL,
  name VARCHAR(180) NOT NULL,
  description TEXT NULL,
  category_id BIGINT UNSIGNED NULL,
  subcategory_id BIGINT UNSIGNED NULL,
  brand_id BIGINT UNSIGNED NULL,
  model_id BIGINT UNSIGNED NULL,
  base_uom_id BIGINT UNSIGNED NOT NULL,
  tax_rate DECIMAL(8,4) NOT NULL DEFAULT 0,
  is_service TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  created_by BIGINT UNSIGNED NULL,
  UNIQUE KEY uk_products_company_sku (company_id, sku),
  UNIQUE KEY uk_products_company_barcode (company_id, barcode),
  KEY idx_products_company_name (company_id, name),
  CONSTRAINT fk_products_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT fk_products_subcategory FOREIGN KEY (subcategory_id) REFERENCES subcategories(id),
  CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id),
  CONSTRAINT fk_products_model FOREIGN KEY (model_id) REFERENCES models(id),
  CONSTRAINT fk_products_base_uom FOREIGN KEY (base_uom_id) REFERENCES units_of_measure(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product_variants (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  variant_code VARCHAR(60) NOT NULL,
  name VARCHAR(180) NOT NULL,
  attributes_json JSON NULL,
  sku VARCHAR(60) NULL,
  barcode VARCHAR(80) NULL,
  cost_price DECIMAL(18,4) NOT NULL DEFAULT 0,
  sale_price DECIMAL(18,4) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY uk_product_variants_company_code (company_id, variant_code),
  UNIQUE KEY uk_product_variants_company_sku (company_id, sku),
  UNIQUE KEY uk_product_variants_company_barcode (company_id, barcode),
  KEY idx_product_variants_product (product_id),
  CONSTRAINT fk_product_variants_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_product_variants_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5) INVENTARIO / LOGISTICA
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS warehouses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(140) NOT NULL,
  address_line VARCHAR(220) NULL,
  commune_id BIGINT UNSIGNED NULL,
  is_main TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY uk_warehouses_company_code (company_id, code),
  KEY idx_warehouses_company_active (company_id, is_active),
  CONSTRAINT fk_warehouses_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_warehouses_commune FOREIGN KEY (commune_id) REFERENCES communes(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inventory (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  warehouse_id BIGINT UNSIGNED NOT NULL,
  product_variant_id BIGINT UNSIGNED NOT NULL,
  quantity_on_hand DECIMAL(18,4) NOT NULL DEFAULT 0,
  quantity_reserved DECIMAL(18,4) NOT NULL DEFAULT 0,
  quantity_available DECIMAL(18,4) AS (quantity_on_hand - quantity_reserved) STORED,
  min_stock DECIMAL(18,4) NOT NULL DEFAULT 0,
  max_stock DECIMAL(18,4) NULL,
  reorder_point DECIMAL(18,4) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_inventory_scope (company_id, warehouse_id, product_variant_id),
  KEY idx_inventory_company_variant (company_id, product_variant_id),
  KEY idx_inventory_company_warehouse (company_id, warehouse_id),
  CONSTRAINT fk_inventory_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_inventory_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  CONSTRAINT fk_inventory_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inventory_movement_types (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL,
  name VARCHAR(120) NOT NULL,
  direction ENUM('IN','OUT','TRANSFER') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_inventory_movement_types_code (code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inventory_movements (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  movement_type_id BIGINT UNSIGNED NOT NULL,
  warehouse_id BIGINT UNSIGNED NOT NULL,
  related_warehouse_id BIGINT UNSIGNED NULL,
  product_variant_id BIGINT UNSIGNED NOT NULL,
  quantity DECIMAL(18,4) NOT NULL,
  unit_cost DECIMAL(18,4) NULL,
  movement_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reason VARCHAR(255) NULL,
  source_document_type VARCHAR(40) NULL,
  source_document_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT UNSIGNED NULL,
  KEY idx_inventory_movements_company_date (company_id, movement_date),
  KEY idx_inventory_movements_company_variant (company_id, product_variant_id),
  KEY idx_inventory_movements_company_warehouse (company_id, warehouse_id),
  CONSTRAINT fk_inventory_movements_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_inventory_movements_type FOREIGN KEY (movement_type_id) REFERENCES inventory_movement_types(id),
  CONSTRAINT fk_inventory_movements_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  CONSTRAINT fk_inventory_movements_related_warehouse FOREIGN KEY (related_warehouse_id) REFERENCES warehouses(id),
  CONSTRAINT fk_inventory_movements_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6) DOCUMENTOS COMERCIALES
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS document_types (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL,
  name VARCHAR(120) NOT NULL,
  counterpart_scope ENUM('CUSTOMER','SUPPLIER','NONE') NOT NULL DEFAULT 'NONE',
  affects_inventory TINYINT(1) NOT NULL DEFAULT 0,
  affects_accounting TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_document_types_code (code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS document_sequences (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  document_type_id BIGINT UNSIGNED NOT NULL,
  year_num SMALLINT UNSIGNED NOT NULL,
  next_number BIGINT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_document_sequences_scope (company_id, document_type_id, year_num),
  CONSTRAINT fk_document_sequences_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_document_sequences_type FOREIGN KEY (document_type_id) REFERENCES document_types(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS documents (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  document_type_id BIGINT UNSIGNED NOT NULL,
  sequence_number BIGINT UNSIGNED NOT NULL,
  document_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  warehouse_id BIGINT UNSIGNED NULL,
  customer_id BIGINT UNSIGNED NULL,
  supplier_id BIGINT UNSIGNED NULL,
  status ENUM('DRAFT','CONFIRMED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  subtotal DECIMAL(18,4) NOT NULL DEFAULT 0,
  tax_total DECIMAL(18,4) NOT NULL DEFAULT 0,
  discount_total DECIMAL(18,4) NOT NULL DEFAULT 0,
  total DECIMAL(18,4) NOT NULL DEFAULT 0,
  notes VARCHAR(255) NULL,
  confirmed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  created_by BIGINT UNSIGNED NULL,
  UNIQUE KEY uk_documents_scope_number (company_id, document_type_id, sequence_number),
  KEY idx_documents_company_date (company_id, document_date),
  KEY idx_documents_company_status (company_id, status),
  CONSTRAINT fk_documents_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_documents_type FOREIGN KEY (document_type_id) REFERENCES document_types(id),
  CONSTRAINT fk_documents_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  CONSTRAINT fk_documents_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_documents_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS document_details (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  document_id BIGINT UNSIGNED NOT NULL,
  line_number INT UNSIGNED NOT NULL,
  product_variant_id BIGINT UNSIGNED NOT NULL,
  warehouse_id BIGINT UNSIGNED NULL,
  quantity DECIMAL(18,4) NOT NULL,
  unit_price DECIMAL(18,4) NOT NULL,
  discount_amount DECIMAL(18,4) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(18,4) NOT NULL DEFAULT 0,
  line_total DECIMAL(18,4) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_document_details_line (document_id, line_number),
  KEY idx_document_details_company_variant (company_id, product_variant_id),
  CONSTRAINT fk_document_details_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_document_details_document FOREIGN KEY (document_id) REFERENCES documents(id),
  CONSTRAINT fk_document_details_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id),
  CONSTRAINT fk_document_details_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7) POS / CAJA
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pos_terminals (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  warehouse_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(120) NOT NULL,
  device_name VARCHAR(120) NULL,
  serial_number VARCHAR(120) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY uk_pos_terminals_company_code (company_id, code),
  KEY idx_pos_terminals_company_warehouse (company_id, warehouse_id),
  CONSTRAINT fk_pos_terminals_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_pos_terminals_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cash_registers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  terminal_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(120) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY uk_cash_registers_company_code (company_id, code),
  KEY idx_cash_registers_company_terminal (company_id, terminal_id),
  CONSTRAINT fk_cash_registers_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_cash_registers_terminal FOREIGN KEY (terminal_id) REFERENCES pos_terminals(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cash_openings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  cash_register_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  opened_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  opening_amount DECIMAL(18,4) NOT NULL,
  note VARCHAR(255) NULL,
  status ENUM('OPEN','CLOSED') NOT NULL DEFAULT 'OPEN',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_cash_openings_company_register_status (company_id, cash_register_id, status),
  CONSTRAINT fk_cash_openings_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_cash_openings_register FOREIGN KEY (cash_register_id) REFERENCES cash_registers(id),
  CONSTRAINT fk_cash_openings_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cash_closings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  cash_opening_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  closed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expected_amount DECIMAL(18,4) NOT NULL,
  counted_amount DECIMAL(18,4) NOT NULL,
  difference_amount DECIMAL(18,4) NOT NULL,
  note VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_cash_closings_company_opening (company_id, cash_opening_id),
  CONSTRAINT fk_cash_closings_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_cash_closings_opening FOREIGN KEY (cash_opening_id) REFERENCES cash_openings(id),
  CONSTRAINT fk_cash_closings_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment_methods (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(30) NOT NULL,
  name VARCHAR(80) NOT NULL,
  requires_reference TINYINT(1) NOT NULL DEFAULT 0,
  is_cash TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_payment_methods_company_code (company_id, code),
  CONSTRAINT fk_payment_methods_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sales (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  cash_opening_id BIGINT UNSIGNED NOT NULL,
  terminal_id BIGINT UNSIGNED NOT NULL,
  customer_id BIGINT UNSIGNED NULL,
  document_id BIGINT UNSIGNED NULL,
  sold_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('PENDING','CONFIRMED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  subtotal DECIMAL(18,4) NOT NULL DEFAULT 0,
  tax_total DECIMAL(18,4) NOT NULL DEFAULT 0,
  discount_total DECIMAL(18,4) NOT NULL DEFAULT 0,
  total DECIMAL(18,4) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  created_by BIGINT UNSIGNED NULL,
  KEY idx_sales_company_date (company_id, sold_at),
  KEY idx_sales_company_status (company_id, status),
  CONSTRAINT fk_sales_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_sales_opening FOREIGN KEY (cash_opening_id) REFERENCES cash_openings(id),
  CONSTRAINT fk_sales_terminal FOREIGN KEY (terminal_id) REFERENCES pos_terminals(id),
  CONSTRAINT fk_sales_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_sales_document FOREIGN KEY (document_id) REFERENCES documents(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sale_details (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  sale_id BIGINT UNSIGNED NOT NULL,
  line_number INT UNSIGNED NOT NULL,
  warehouse_id BIGINT UNSIGNED NOT NULL,
  product_variant_id BIGINT UNSIGNED NOT NULL,
  quantity DECIMAL(18,4) NOT NULL,
  unit_price DECIMAL(18,4) NOT NULL,
  discount_amount DECIMAL(18,4) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(18,4) NOT NULL DEFAULT 0,
  line_total DECIMAL(18,4) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_sale_details_line (sale_id, line_number),
  KEY idx_sale_details_company_variant (company_id, product_variant_id),
  CONSTRAINT fk_sale_details_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_sale_details_sale FOREIGN KEY (sale_id) REFERENCES sales(id),
  CONSTRAINT fk_sale_details_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  CONSTRAINT fk_sale_details_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sale_payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  sale_id BIGINT UNSIGNED NOT NULL,
  payment_method_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(18,4) NOT NULL,
  reference_code VARCHAR(120) NULL,
  paid_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_sale_payments_company_sale (company_id, sale_id),
  CONSTRAINT fk_sale_payments_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_sale_payments_sale FOREIGN KEY (sale_id) REFERENCES sales(id),
  CONSTRAINT fk_sale_payments_method FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cash_movements (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  cash_opening_id BIGINT UNSIGNED NOT NULL,
  movement_type ENUM('IN','OUT') NOT NULL,
  amount DECIMAL(18,4) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  reference_type VARCHAR(40) NULL,
  reference_id BIGINT UNSIGNED NULL,
  moved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_cash_movements_company_opening (company_id, cash_opening_id),
  KEY idx_cash_movements_company_date (company_id, moved_at),
  CONSTRAINT fk_cash_movements_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_cash_movements_opening FOREIGN KEY (cash_opening_id) REFERENCES cash_openings(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 8) AUDITORIA
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NULL,
  table_name VARCHAR(120) NOT NULL,
  row_pk VARCHAR(120) NOT NULL,
  action_type ENUM('INSERT','UPDATE','DELETE') NOT NULL,
  changed_by BIGINT UNSIGNED NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  old_data JSON NULL,
  new_data JSON NULL,
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(255) NULL,
  KEY idx_audit_logs_company_table_date (company_id, table_name, changed_at),
  KEY idx_audit_logs_table_pk (table_name, row_pk),
  KEY idx_audit_logs_changed_by (changed_by)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 9) DATOS MAESTROS INICIALES
-- ---------------------------------------------------------------------

INSERT INTO inventory_movement_types (code, name, direction)
VALUES
  ('PURCHASE', 'Compra', 'IN'),
  ('SALE', 'Venta', 'OUT'),
  ('ADJUST_IN', 'Ajuste Entrada', 'IN'),
  ('ADJUST_OUT', 'Ajuste Salida', 'OUT'),
  ('TRANSFER_OUT', 'Traslado Salida', 'TRANSFER'),
  ('TRANSFER_IN', 'Traslado Entrada', 'TRANSFER')
ON DUPLICATE KEY UPDATE name = VALUES(name), direction = VALUES(direction);

INSERT INTO document_types (code, name, counterpart_scope, affects_inventory, affects_accounting)
VALUES
  ('INVOICE', 'Factura', 'CUSTOMER', 1, 1),
  ('PURCHASE_ORDER', 'Orden de Compra', 'SUPPLIER', 0, 0),
  ('DELIVERY_NOTE', 'Guia de Despacho', 'CUSTOMER', 1, 1),
  ('SALES_NOTE', 'Nota de Venta', 'CUSTOMER', 1, 1),
  ('SUPPLIER_INVOICE', 'Factura Proveedor', 'SUPPLIER', 1, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);
