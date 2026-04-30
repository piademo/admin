-- ============================================================================
-- BOOKFAST ADMIN PANEL - FEATURES / OVERRIDES RPC (PUBLIC)
-- Migration 003: RPCs en public para gestionar features y overrides por org
-- ============================================================================

-- Listar catálogo de features
CREATE OR REPLACE FUNCTION public.admin_list_features()
RETURNS TABLE (
  id uuid,
  key text,
  name text,
  default_enabled boolean
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, platform
AS $$
  SELECT f.id, f.key, f.name, f.default_enabled
  FROM platform.features f
  ORDER BY f.key ASC;
$$;

-- Listar overrides activos de una org
CREATE OR REPLACE FUNCTION public.admin_list_org_feature_overrides(p_org_id uuid)
RETURNS TABLE (
  id uuid,
  org_id uuid,
  feature_key text,
  enabled boolean,
  quota_limit jsonb,
  reason text,
  expires_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, platform
AS $$
  SELECT o.id, o.org_id, o.feature_key, o.enabled, o.quota_limit, o.reason, o.expires_at, o.created_at
  FROM platform.org_feature_overrides o
  WHERE o.org_id = p_org_id
  ORDER BY o.created_at DESC;
$$;

-- Crear/actualizar override
CREATE OR REPLACE FUNCTION public.admin_upsert_org_feature_override(
  p_org_id uuid,
  p_feature_key text,
  p_enabled boolean,
  p_quota_limit jsonb DEFAULT NULL,
  p_reason text DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path = public, platform
AS $$
DECLARE
  v_exists boolean;
BEGIN
  -- Validar que el feature existe
  SELECT EXISTS (SELECT 1 FROM platform.features f WHERE f.key = p_feature_key) INTO v_exists;
  IF NOT v_exists THEN
    RAISE EXCEPTION 'Feature not found: %', p_feature_key
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  INSERT INTO platform.org_feature_overrides (
    org_id, feature_key, enabled, quota_limit, reason, expires_at, created_at
  )
  VALUES (
    p_org_id, p_feature_key, p_enabled, COALESCE(p_quota_limit, '{}'::jsonb), p_reason, p_expires_at, now()
  )
  ON CONFLICT (org_id, feature_key) DO UPDATE
    SET enabled = excluded.enabled,
        quota_limit = excluded.quota_limit,
        reason = excluded.reason,
        expires_at = excluded.expires_at,
        created_at = platform.org_feature_overrides.created_at;

  RETURN jsonb_build_object(
    'org_id', p_org_id,
    'feature_key', p_feature_key,
    'enabled', p_enabled,
    'quota_limit', COALESCE(p_quota_limit, '{}'::jsonb),
    'reason', p_reason,
    'expires_at', p_expires_at
  );
END;
$$;

-- Borrar override
CREATE OR REPLACE FUNCTION public.admin_delete_org_feature_override(
  p_org_id uuid,
  p_feature_key text
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
VOLATILE
SET search_path = public, platform
AS $$
  DELETE FROM platform.org_feature_overrides
  WHERE org_id = p_org_id AND feature_key = p_feature_key;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_features() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_org_feature_overrides(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_upsert_org_feature_override(uuid, text, boolean, jsonb, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_org_feature_override(uuid, text) TO service_role;

