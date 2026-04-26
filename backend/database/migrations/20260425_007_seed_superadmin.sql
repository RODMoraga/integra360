-- =====================================================================================
-- Integra360 - Superadmin Bootstrap Seed
-- Version: 20260425_007
-- Scope: Create default company + superadmin user/role + global full-access grants
-- Notes:
--   - Idempotent (safe to run multiple times)
--   - Superadmin role receives all current permissions
--   - Future permissions are auto-granted to SUPERADMIN roles by trigger
-- =====================================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ---------------------------------------------------------------------
-- 1) Core inserts (company, role, user, permissions)
-- ---------------------------------------------------------------------

START TRANSACTION;

-- Default company for administrative bootstrap
INSERT INTO companies (
  code,
  legal_name,
  trade_name,
  tax_id,
  industry_type,
  email,
  timezone,
  currency_code,
  is_active
) VALUES (
  'INTEGRA360_MAIN',
  'Integra360 Chile SpA',
  'Integra360',
  '76000000-0',
  'SOFTWARE',
  'superadmin@integra360.cl',
  'America/Santiago',
  'CLP',
  1
)
ON DUPLICATE KEY UPDATE
  legal_name = VALUES(legal_name),
  trade_name = VALUES(trade_name),
  industry_type = VALUES(industry_type),
  email = VALUES(email),
  timezone = VALUES(timezone),
  currency_code = VALUES(currency_code),
  is_active = VALUES(is_active),
  deleted_at = NULL,
  updated_at = CURRENT_TIMESTAMP;

SET @company_id = (
  SELECT id
    FROM companies
   WHERE code = 'INTEGRA360_MAIN'
   LIMIT 1
);

-- SUPERADMIN role (company-scoped role with unrestricted access)
INSERT INTO roles (
  company_id,
  code,
  name,
  description,
  is_system,
  created_by
) VALUES (
  @company_id,
  'SUPERADMIN',
  'Super Administrador',
  'Acceso completo a todos los modulos actuales y futuros del dashboard',
  1,
  NULL
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  is_system = VALUES(is_system),
  deleted_at = NULL,
  updated_at = CURRENT_TIMESTAMP;

SET @superadmin_role_id = (
  SELECT id
    FROM roles
   WHERE company_id = @company_id
     AND code = 'SUPERADMIN'
   LIMIT 1
);

-- Explicit dashboard permissions (current/future dashboard scope)
INSERT INTO permissions (code, name, module_name, description)
VALUES
  ('dashboard.view', 'Ver dashboard', 'dashboard', 'Permite visualizar paneles y metricas'),
  ('dashboard.manage', 'Administrar dashboard', 'dashboard', 'Permite configurar widgets, paneles y vistas'),
  ('dashboard.*', 'Acceso total dashboard', 'dashboard', 'Permite acceso total a cualquier modulo del dashboard')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  module_name = VALUES(module_name),
  description = VALUES(description),
  updated_at = CURRENT_TIMESTAMP;

-- Superadmin user
INSERT INTO users (
  company_id,
  full_name,
  email,
  password_hash,
  is_active,
  created_by
) VALUES (
  @company_id,
  'Super Administrador Integra360',
  'superadmin@integra360.cl',
  '$2a$12$umZ5ATJKR/bqhxQsidZRzu6H5cCvj97ZLe22QnBjgsfh98mGRUWOG',
  1,
  NULL
)
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  password_hash = VALUES(password_hash),
  is_active = VALUES(is_active),
  deleted_at = NULL,
  updated_at = CURRENT_TIMESTAMP;

SET @superadmin_user_id = (
  SELECT id
    FROM users
   WHERE company_id = @company_id
     AND email = 'superadmin@integra360.cl'
   LIMIT 1
);

-- Link user to SUPERADMIN role
INSERT INTO user_roles (user_id, role_id, assigned_by)
VALUES (@superadmin_user_id, @superadmin_role_id, @superadmin_user_id)
ON DUPLICATE KEY UPDATE
  assigned_at = CURRENT_TIMESTAMP,
  assigned_by = VALUES(assigned_by);

-- Grant ALL current permissions to SUPERADMIN role
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT @superadmin_role_id, p.id, @superadmin_user_id
  FROM permissions p
ON DUPLICATE KEY UPDATE
  granted_at = CURRENT_TIMESTAMP,
  granted_by = VALUES(granted_by);

COMMIT;

-- ---------------------------------------------------------------------
-- 2) Auto-grant future permissions to SUPERADMIN roles
-- ---------------------------------------------------------------------

DELIMITER $$

DROP TRIGGER IF EXISTS trg_permissions_ai_grant_superadmin $$
CREATE TRIGGER trg_permissions_ai_grant_superadmin
AFTER INSERT ON permissions
FOR EACH ROW
BEGIN
  INSERT INTO role_permissions (role_id, permission_id, granted_by)
  SELECT r.id, NEW.id, NULL
    FROM roles r
   WHERE r.code = 'SUPERADMIN'
     AND r.deleted_at IS NULL
  ON DUPLICATE KEY UPDATE
    granted_at = CURRENT_TIMESTAMP;
END $$

DELIMITER ;

-- Optional verification:
-- SELECT c.code, u.email, r.code AS role_code
--   FROM users u
--   JOIN companies c ON c.id = u.company_id
--   JOIN user_roles ur ON ur.user_id = u.id
--   JOIN roles r ON r.id = ur.role_id
--  WHERE u.email = 'superadmin@integra360.cl';
