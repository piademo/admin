import { createServiceClient } from '@/lib/supabase/service'
import { TenantDetailPanel, type TenantDetailData } from '@/components/tenants/TenantDetailPanel'
import { notFound } from 'next/navigation'

async function getTenantDetail(id: string): Promise<TenantDetailData | null> {
  const supabase = createServiceClient()

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id,name,slug,timezone,contact_email,contact_phone,address,portal_url,public_subdomain,stripe_onboarding_status,stripe_charges_enabled,stripe_payouts_enabled,created_at,updated_at')
    .eq('id', id)
    .maybeSingle()

  if (tenantError || !tenant) return null

  // Plan info is stored in platform schema, but we fetch it via public RPC to avoid exposing schemas.
  let orgPlan: TenantDetailData['orgPlan'] = null
  try {
    const { data } = await (supabase as any).rpc('admin_get_org_plan', { p_org_id: id })
    if (data) {
      orgPlan = {
        plan_key: data.plan_key ?? null,
        plan_name: data.plan_name ?? null,
        billing_state: data.billing_state ?? null,
        renew_at: data.renew_at ?? null,
      }
    }
  } catch {
    orgPlan = null
  }

  // Features + overrides (best-effort via RPCs)
  let features: TenantDetailData['features'] = []
  let overrides: TenantDetailData['overrides'] = []
  try {
    const [featuresRes, overridesRes] = await Promise.all([
      (supabase as any).rpc('admin_list_features'),
      (supabase as any).rpc('admin_list_org_feature_overrides', { p_org_id: id }),
    ])
    features = (featuresRes?.data || []) as any
    overrides = (overridesRes?.data || []) as any
  } catch {
    features = []
    overrides = []
  }

  return { tenant: tenant as any, orgPlan, features, overrides }
}

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getTenantDetail(id)
  if (!data) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{data.tenant.name}</h1>
        <p className="text-muted-foreground font-mono">/{data.tenant.slug}</p>
      </div>

      <TenantDetailPanel data={data} />
    </div>
  )
}

