-- =====================================================================================
-- Integra360 - Product Images Normalized Model (MySQL 8+)
-- Version: 20260425_005
-- Scope: scalable storage + association of one or multiple images per product
-- =====================================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ---------------------------------------------------------------------
-- 1) REPOSITORIO DE RECURSOS GRAFICOS
-- ---------------------------------------------------------------------
-- Almacena metadatos del archivo (ubicacion fisica, hash, dimensiones, etc.).
-- El archivo binario NO se guarda en la tabla para mantener performance y flexibilidad.

CREATE TABLE IF NOT EXISTS digital_assets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  storage_disk VARCHAR(40) NOT NULL DEFAULT 'local',
  storage_key VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NULL,
  public_url VARCHAR(700) NULL,
  mime_type VARCHAR(120) NOT NULL,
  extension VARCHAR(20) NULL,
  size_bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
  width_px INT UNSIGNED NULL,
  height_px INT UNSIGNED NULL,
  sha256_hash CHAR(64) NULL,
  metadata_json JSON NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  created_by BIGINT UNSIGNED NULL,
  UNIQUE KEY uk_digital_assets_company_storage_key (company_id, storage_disk, storage_key),
  UNIQUE KEY uk_digital_assets_company_sha256 (company_id, sha256_hash),
  KEY idx_digital_assets_company_mime (company_id, mime_type),
  KEY idx_digital_assets_company_active (company_id, is_active),
  CONSTRAINT fk_digital_assets_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2) RELACION PRODUCTO <-> IMAGEN
-- ---------------------------------------------------------------------
-- Permite multiples imagenes por producto y define rol/orden de presentacion.

CREATE TABLE IF NOT EXISTS product_images (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  asset_id BIGINT UNSIGNED NOT NULL,
  purpose ENUM('PRIMARY', 'GALLERY', 'THUMBNAIL', 'DETAIL', 'PACKAGING') NOT NULL DEFAULT 'GALLERY',
  alt_text VARCHAR(255) NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  created_by BIGINT UNSIGNED NULL,
  primary_product_id BIGINT UNSIGNED GENERATED ALWAYS AS (
    CASE
      WHEN is_primary = 1 AND deleted_at IS NULL THEN product_id
      ELSE NULL
    END
  ) STORED,
  UNIQUE KEY uk_product_images_company_product_asset (company_id, product_id, asset_id),
  UNIQUE KEY uk_product_images_company_product_sort (company_id, product_id, sort_order),
  UNIQUE KEY uk_product_images_one_primary (company_id, primary_product_id),
  KEY idx_product_images_company_product_active (company_id, product_id, is_active),
  KEY idx_product_images_company_listing (company_id, product_id, is_primary, sort_order),
  KEY idx_product_images_asset (asset_id),
  CONSTRAINT fk_product_images_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_product_images_asset FOREIGN KEY (asset_id) REFERENCES digital_assets(id)
) ENGINE=InnoDB;
