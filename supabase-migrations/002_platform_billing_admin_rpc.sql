-- ============================================================================
-- BOOKFAST ADMIN PANEL - BILLING / PLANS RPC (PUBLIC)
-- Migration 002: RPCs en public para gestionar platform.* sin exponer schemas
-- ============================================================================

-- Nota:
-- - Supabase PostgREST solo permite consultar schemas "expuestos".
-- - Si NO expones `platform`, supabase-js no puede hacer .schema('platform').
-- - Solución: funciones en `public` (SECURITY DEFINER) que operen sobre `platform.*`.

-- Listar planes disponibles
CREATE OR REPLACE FUNCTION public.admin_list_plans()
RETURNS TABLE (
  id uuid,
  key text,
  name text,
  price_monthly_cents int,
  active boolean
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, platform
AS $$
  SELECT p.id, p.key, p.name, p.price_monthly_cents, p.active
  FROM platform.plans p
  ORDER BY p.price_monthly_cents ASC NULLS LAST, p.key ASC;
$$;

-- Obtener plan actual (si existe)
CREATE OR REPLACE FUNCTION public.admin_get_org_plan(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, platform
AS $$
DECLARE
  v_plan_id uuid;
  v_billing_state text;
  v_renew_at timestamptz;
  v_plan_key text;
  v_plan_name text;
BEGIN
  SELECT plan_id, billing_state, renew_at
  INTO v_plan_id, v_billing_state, v_renew_at
  FROM platform.org_plans
  WHERE org_id = p_org_id;

  IF v_plan_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT key, name
  INTO v_plan_key, v_plan_name
  FROM platform.plans
  WHERE id = v_plan_id;

  RETURN jsonb_build_object(
    'plan_key', v_plan_key,
    'plan_name', v_plan_name,
    'billing_state', v_billing_state,
    'renew_at', v_renew_at
  );
END;
$$;

-- Asignar / cambiar plan
CREATE OR REPLACE FUNCTION public.admin_set_org_plan(
  p_org_id uuid,
  p_plan_key text,
  p_billing_state text DEFAULT 'active'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path = public, platform
AS $$
DECLARE
  v_plan_id uuid;
  v_plan_name text;
BEGIN
  SELECT id, name
  INTO v_plan_id, v_plan_name
  FROM platform.plans
  WHERE key = p_plan_key
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'Plan not found: %', p_plan_key
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  INSERT INTO platform.org_plans (org_id, plan_id, billing_state, created_at, updated_at)
  VALUES (p_org_id, v_plan_id, p_billing_state, now(), now())
  ON CONFLICT (org_id) DO UPDATE
    SET plan_id = excluded.plan_id,
        billing_state = excluded.billing_state,
        updated_at = now();

  RETURN jsonb_build_object(
    'org_id', p_org_id,
    'plan_key', p_plan_key,
    'plan_name', v_plan_name,
    'billing_state', p_billing_state
  );
END;
$$;

-- Grants: permitir a service_role ejecutar (admin server-side)
GRANT EXECUTE ON FUNCTION public.admin_list_plans() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_org_plan(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_org_plan(uuid, text, text) TO service_role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

