-- ============================================================================
-- BOOKFAST ADMIN PANEL - SECURITY & AUTHENTICATION
-- Migration 001: Platform Admin Security Foundation
-- ============================================================================

-- Create platform schema
CREATE SCHEMA IF NOT EXISTS platform;

-- ============================================================================
-- 1. PLATFORM USERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS platform.platform_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  mfa_secret TEXT,
  mfa_backup_codes TEXT[],
  mfa_configured_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'disabled')),
  last_login_at TIMESTAMPTZ,
  last_login_ip INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES platform.platform_users(id)
);

CREATE INDEX IF NOT EXISTS idx_platform_users_email ON platform.platform_users(email);
CREATE INDEX IF NOT EXISTS idx_platform_users_auth_user_id ON platform.platform_users(auth_user_id);

-- ============================================================================
-- 2. ROLES AND PERMISSIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS platform.platform_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  level INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO platform.platform_roles (name, display_name, description, level) VALUES
  ('super_admin', 'Super Administrator', 'Full system access', 1),
  ('admin', 'Administrator', 'Full access except admin management', 2),
  ('support', 'Support Agent', 'Support and customer service', 3),
  ('billing', 'Billing Manager', 'Billing and payments only', 4),
  ('viewer', 'Read-only Viewer', 'View-only access', 5)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS platform.platform_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO platform.platform_permissions (name, display_name, description, resource, action) VALUES
  ('tenants.read', 'View Tenants', 'Can view tenants', 'tenants', 'read'),
  ('tenants.write', 'Manage Tenants', 'Can edit tenants', 'tenants', 'write'),
  ('tenants.delete', 'Delete Tenants', 'Can delete tenants', 'tenants', 'delete'),
  ('admin.manage', 'Manage Admins', 'Can manage admins', 'admin', 'manage')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS platform.role_permissions (
  role_id UUID NOT NULL REFERENCES platform.platform_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES platform.platform_permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS platform.user_roles (
  user_id UUID NOT NULL REFERENCES platform.platform_users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES platform.platform_roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES platform.platform_users(id),
  PRIMARY KEY (user_id, role_id)
);

-- ============================================================================
-- 3. ADMIN SESSIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS platform.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES platform.platform_users(id) ON DELETE CASCADE,
  auth_session_id TEXT NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- ============================================================================
-- 4. AUDIT LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS platform.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES platform.platform_users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  description TEXT NOT NULL,
  metadata JSONB,
  ip_address INET NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  severity TEXT DEFAULT 'info'
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON platform.audit_logs(created_at DESC);

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION platform.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_platform_users_updated_at ON platform.platform_users;
CREATE TRIGGER update_platform_users_updated_at
    BEFORE UPDATE ON platform.platform_users
    FOR EACH ROW
    EXECUTE FUNCTION platform.update_updated_at_column();

-- is_platform_admin function
CREATE OR REPLACE FUNCTION platform.is_platform_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM platform.platform_users AS pu
  WHERE pu.auth_user_id = p_user_id
  AND pu.status = 'active';
  RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE platform.platform_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.platform_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.platform_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS platform_users_select ON platform.platform_users;
DROP POLICY IF EXISTS platform_roles_select ON platform.platform_roles;
DROP POLICY IF EXISTS platform_permissions_select ON platform.platform_permissions;
DROP POLICY IF EXISTS role_permissions_select ON platform.role_permissions;
DROP POLICY IF EXISTS user_roles_select ON platform.user_roles;
DROP POLICY IF EXISTS admin_sessions_select ON platform.admin_sessions;
DROP POLICY IF EXISTS audit_logs_select ON platform.audit_logs;

CREATE POLICY platform_users_select ON platform.platform_users
  FOR SELECT USING (platform.is_platform_admin(auth.uid()));

CREATE POLICY platform_roles_select ON platform.platform_roles
  FOR SELECT USING (platform.is_platform_admin(auth.uid()));

CREATE POLICY platform_permissions_select ON platform.platform_permissions
  FOR SELECT USING (platform.is_platform_admin(auth.uid()));

CREATE POLICY role_permissions_select ON platform.role_permissions
  FOR SELECT USING (platform.is_platform_admin(auth.uid()));

CREATE POLICY user_roles_select ON platform.user_roles
  FOR SELECT USING (platform.is_platform_admin(auth.uid()));

CREATE POLICY admin_sessions_select ON platform.admin_sessions
  FOR SELECT USING (platform.is_platform_admin(auth.uid()));

CREATE POLICY audit_logs_select ON platform.audit_logs
  FOR SELECT USING (platform.is_platform_admin(auth.uid()));

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
