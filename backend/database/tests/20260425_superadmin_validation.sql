-- =====================================================================================
-- Integra360 - Superadmin Quick Validation
-- Scope: Validate bootstrap migration 20260425_007_seed_superadmin.sql
-- Usage:
--   1) Run migration 20260425_007_seed_superadmin.sql first
--   2) Execute this script in the same database
-- =====================================================================================

SET @target_company_code = 'INTEGRA360_MAIN';
SET @target_email = 'superadmin@integra360.cl';
SET @target_role_code = 'SUPERADMIN';

-- ---------------------------------------------------------------------
-- 1) Company exists and active
-- ---------------------------------------------------------------------
SELECT
  'CHECK_COMPANY' AS check_name,
  c.id AS company_id,
  c.code,
  c.legal_name,
  c.is_active,
  CASE WHEN c.id IS NOT NULL AND c.is_active = 1 THEN 'OK' ELSE 'FAIL' END AS status
FROM companies c
WHERE c.code = @target_company_code;

-- ---------------------------------------------------------------------
-- 2) Superadmin user exists and active
-- ---------------------------------------------------------------------
SELECT
  'CHECK_USER' AS check_name,
  u.id AS user_id,
  u.company_id,
  u.email,
  u.is_active,
  CASE
    WHEN u.id IS NOT NULL
     AND u.email = @target_email
     AND u.is_active = 1
    THEN 'OK'
    ELSE 'FAIL'
  END AS status
FROM users u
JOIN companies c ON c.id = u.company_id
WHERE c.code = @target_company_code
  AND u.email = @target_email;

-- ---------------------------------------------------------------------
-- 3) SUPERADMIN role exists in target company
-- ---------------------------------------------------------------------
SELECT
  'CHECK_ROLE' AS check_name,
  r.id AS role_id,
  r.company_id,
  r.code,
  r.name,
  r.is_system,
  CASE
    WHEN r.id IS NOT NULL
     AND r.code = @target_role_code
     AND r.is_system = 1
    THEN 'OK'
    ELSE 'FAIL'
  END AS status
FROM roles r
JOIN companies c ON c.id = r.company_id
WHERE c.code = @target_company_code
  AND r.code = @target_role_code;

-- ---------------------------------------------------------------------
-- 4) User-role linkage exists
-- ---------------------------------------------------------------------
SELECT
  'CHECK_USER_ROLE_LINK' AS check_name,
  u.id AS user_id,
  r.id AS role_id,
  ur.assigned_at,
  CASE WHEN ur.user_id IS NOT NULL THEN 'OK' ELSE 'FAIL' END AS status
FROM companies c
JOIN users u
  ON u.company_id = c.id
 AND u.email = @target_email
JOIN roles r
  ON r.company_id = c.id
 AND r.code = @target_role_code
LEFT JOIN user_roles ur
  ON ur.user_id = u.id
 AND ur.role_id = r.id
WHERE c.code = @target_company_code;

-- ---------------------------------------------------------------------
-- 5) Superadmin role has ALL permissions (missing must be 0)
-- ---------------------------------------------------------------------
SELECT
  'CHECK_ALL_PERMISSION_GRANTS' AS check_name,
  COUNT(*) AS total_permissions,
  SUM(CASE WHEN rp.permission_id IS NULL THEN 1 ELSE 0 END) AS missing_permissions,
  CASE WHEN SUM(CASE WHEN rp.permission_id IS NULL THEN 1 ELSE 0 END) = 0 THEN 'OK' ELSE 'FAIL' END AS status
FROM companies c
JOIN roles r
  ON r.company_id = c.id
 AND r.code = @target_role_code
CROSS JOIN permissions p
LEFT JOIN role_permissions rp
  ON rp.role_id = r.id
 AND rp.permission_id = p.id
WHERE c.code = @target_company_code;

-- ---------------------------------------------------------------------
-- 6) List missing permissions (should return 0 rows)
-- ---------------------------------------------------------------------
SELECT
  'CHECK_MISSING_PERMISSION_DETAILS' AS check_name,
  p.id AS permission_id,
  p.code AS permission_code,
  p.module_name
FROM companies c
JOIN roles r
  ON r.company_id = c.id
 AND r.code = @target_role_code
CROSS JOIN permissions p
LEFT JOIN role_permissions rp
  ON rp.role_id = r.id
 AND rp.permission_id = p.id
WHERE c.code = @target_company_code
  AND rp.permission_id IS NULL
ORDER BY p.code;

-- ---------------------------------------------------------------------
-- 7) Trigger for future auto-grant exists
-- ---------------------------------------------------------------------
SELECT
  'CHECK_TRIGGER_EXISTS' AS check_name,
  t.TRIGGER_NAME,
  t.EVENT_MANIPULATION,
  t.EVENT_OBJECT_TABLE,
  CASE WHEN t.TRIGGER_NAME IS NOT NULL THEN 'OK' ELSE 'FAIL' END AS status
FROM information_schema.TRIGGERS t
WHERE t.TRIGGER_SCHEMA = DATABASE()
  AND t.TRIGGER_NAME = 'trg_permissions_ai_grant_superadmin';

-- ---------------------------------------------------------------------
-- 8) Dashboard permission presence
-- ---------------------------------------------------------------------
SELECT
  'CHECK_DASHBOARD_PERMISSIONS' AS check_name,
  COUNT(*) AS dashboard_permissions_found,
  CASE WHEN COUNT(*) >= 3 THEN 'OK' ELSE 'WARN' END AS status
FROM permissions p
WHERE p.code IN ('dashboard.view', 'dashboard.manage', 'dashboard.*');

-- ---------------------------------------------------------------------
-- 9) Single summary row
-- ---------------------------------------------------------------------
SELECT
  'SUMMARY' AS check_name,
  c.code AS company_code,
  u.email AS superadmin_email,
  r.code AS role_code,
  (
    SELECT COUNT(*)
    FROM permissions p
  ) AS total_permissions,
  (
    SELECT COUNT(*)
    FROM role_permissions rp
    WHERE rp.role_id = r.id
  ) AS role_granted_permissions,
  CASE
    WHEN (
      SELECT COUNT(*)
      FROM role_permissions rp
      WHERE rp.role_id = r.id
    ) >= (
      SELECT COUNT(*)
      FROM permissions p
    ) THEN 'OK'
    ELSE 'FAIL'
  END AS status
FROM companies c
JOIN users u
  ON u.company_id = c.id
 AND u.email = @target_email
JOIN roles r
  ON r.company_id = c.id
 AND r.code = @target_role_code
WHERE c.code = @target_company_code;
