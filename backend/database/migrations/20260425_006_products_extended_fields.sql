-- =====================================================================================
-- Integra360 - Products Extended Fields (MySQL 8+)
-- Version: 20260425_006
-- Scope: Add pricing, dimensions, SEO/eCommerce, stock control, and denormalized
--        image fields to the products table.
-- =====================================================================================

-- ---------------------------------------------------------------------
-- 1) PRICING  (cost_price / sale_price / min_price)
-- ---------------------------------------------------------------------

ALTER TABLE products
  ADD COLUMN cost_price   DECIMAL(18,4) NOT NULL DEFAULT 0    COMMENT 'Purchase/production cost' AFTER tax_rate,
  ADD COLUMN sale_price   DECIMAL(18,4) NOT NULL DEFAULT 0    COMMENT 'Default selling price'    AFTER cost_price,
  ADD COLUMN min_price    DECIMAL(18,4) NULL                   COMMENT 'Minimum allowed sale price (floor price)' AFTER sale_price;

-- ---------------------------------------------------------------------
-- 2) WEIGHT / DIMENSIONS
-- ---------------------------------------------------------------------

ALTER TABLE products
  ADD COLUMN weight       DECIMAL(10,4) NULL                   COMMENT 'Product weight'           AFTER min_price,
  ADD COLUMN weight_unit  VARCHAR(10)   NULL DEFAULT 'kg'      COMMENT 'kg | g | lb | oz'         AFTER weight,
  ADD COLUMN width_cm     DECIMAL(10,4) NULL                   COMMENT 'Width in centimetres'     AFTER weight_unit,
  ADD COLUMN height_cm    DECIMAL(10,4) NULL                   COMMENT 'Height in centimetres'    AFTER width_cm,
  ADD COLUMN depth_cm     DECIMAL(10,4) NULL                   COMMENT 'Depth/length in cm'       AFTER height_cm;

-- ---------------------------------------------------------------------
-- 3) SEO / eCOMMERCE
-- ---------------------------------------------------------------------

ALTER TABLE products
  ADD COLUMN slug             VARCHAR(220) NULL                COMMENT 'URL-friendly identifier (unique per company)' AFTER depth_cm,
  ADD COLUMN meta_title       VARCHAR(160) NULL                COMMENT 'SEO title tag'            AFTER slug,
  ADD COLUMN meta_description VARCHAR(320) NULL                COMMENT 'SEO meta description'     AFTER meta_title,
  ADD COLUMN is_featured      TINYINT(1)   NOT NULL DEFAULT 0  COMMENT '1 = shown in featured sections' AFTER meta_description;

-- Slug must be unique within a company (NULLs excluded automatically in MySQL)
ALTER TABLE products
  ADD UNIQUE KEY uk_products_company_slug (company_id, slug);

ALTER TABLE products
  ADD KEY idx_products_featured (company_id, is_featured);

-- ---------------------------------------------------------------------
-- 4) STOCK CONTROL
-- ---------------------------------------------------------------------

ALTER TABLE products
  ADD COLUMN track_inventory  TINYINT(1)    NOT NULL DEFAULT 1  COMMENT '0 = no stock tracking (services / non-inventory items)' AFTER is_featured,
  ADD COLUMN min_stock        DECIMAL(18,4) NOT NULL DEFAULT 0   COMMENT 'Minimum stock level (alert threshold)' AFTER track_inventory,
  ADD COLUMN reorder_point    DECIMAL(18,4) NULL                 COMMENT 'Quantity that triggers a purchase order' AFTER min_stock;

-- ---------------------------------------------------------------------
-- 5) DENORMALIZED IMAGE CACHE  (populated/maintained by product_images triggers or app layer)
-- ---------------------------------------------------------------------

ALTER TABLE products
  ADD COLUMN thumbnail_url  VARCHAR(500) NULL                  COMMENT 'Public URL of the primary product image (denormalised cache)' AFTER reorder_point,
  ADD COLUMN image_count    SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total active images linked via product_images' AFTER thumbnail_url;

-- ---------------------------------------------------------------------
-- 6) TRIGGER: keep image_count + thumbnail_url in sync
-- ---------------------------------------------------------------------

DELIMITER $$

DROP TRIGGER IF EXISTS trg_product_images_after_insert $$
CREATE TRIGGER trg_product_images_after_insert
AFTER INSERT ON product_images
FOR EACH ROW
BEGIN
  UPDATE products p
  SET
    image_count   = (
      SELECT COUNT(*) FROM product_images pi2
       WHERE pi2.company_id = NEW.company_id
         AND pi2.product_id = NEW.product_id
         AND pi2.is_active  = 1
    ),
    thumbnail_url = (
      SELECT da.public_url
        FROM product_images pi3
        JOIN digital_assets  da ON da.id = pi3.asset_id
       WHERE pi3.company_id = NEW.company_id
         AND pi3.product_id = NEW.product_id
         AND pi3.is_primary = 1
         AND pi3.is_active  = 1
       LIMIT 1
    )
  WHERE p.company_id = NEW.company_id
    AND p.id         = NEW.product_id;
END $$

DROP TRIGGER IF EXISTS trg_product_images_after_update $$
CREATE TRIGGER trg_product_images_after_update
AFTER UPDATE ON product_images
FOR EACH ROW
BEGIN
  UPDATE products p
  SET
    image_count   = (
      SELECT COUNT(*) FROM product_images pi2
       WHERE pi2.company_id = NEW.company_id
         AND pi2.product_id = NEW.product_id
         AND pi2.is_active  = 1
    ),
    thumbnail_url = (
      SELECT da.public_url
        FROM product_images pi3
        JOIN digital_assets  da ON da.id = pi3.asset_id
       WHERE pi3.company_id = NEW.company_id
         AND pi3.product_id = NEW.product_id
         AND pi3.is_primary = 1
         AND pi3.is_active  = 1
       LIMIT 1
    )
  WHERE p.company_id = NEW.company_id
    AND p.id         = NEW.product_id;
END $$

DROP TRIGGER IF EXISTS trg_product_images_after_delete $$
CREATE TRIGGER trg_product_images_after_delete
AFTER DELETE ON product_images
FOR EACH ROW
BEGIN
  UPDATE products p
  SET
    image_count   = (
      SELECT COUNT(*) FROM product_images pi2
       WHERE pi2.company_id = OLD.company_id
         AND pi2.product_id = OLD.product_id
         AND pi2.is_active  = 1
    ),
    thumbnail_url = (
      SELECT da.public_url
        FROM product_images pi3
        JOIN digital_assets  da ON da.id = pi3.asset_id
       WHERE pi3.company_id = OLD.company_id
         AND pi3.product_id = OLD.product_id
         AND pi3.is_primary = 1
         AND pi3.is_active  = 1
       LIMIT 1
    )
  WHERE p.company_id = OLD.company_id
    AND p.id         = OLD.product_id;
END $$

DELIMITER ;
