import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { validatePlatformAdmin, logAudit } from '@/lib/auth/platform'

export async function GET(request: Request) {
  const { user, error } = await validatePlatformAdmin(request)
  if (error || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const url = new URL(request.url)
  const q = url.searchParams.get('q')?.trim() || null
  const limit = Math.min(Number(url.searchParams.get('limit') || 50), 200)

  let query = supabase
    .from('tenants')
    .select('id,name,slug,timezone,public_subdomain,created_at,stripe_onboarding_status,stripe_charges_enabled')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (q) {
    // basic fuzzy search across name/slug (ilike)
    query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`)
  }

  const { data, error: dbError } = await query
  if (dbError) {
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ success: true, tenants: data || [] })
}

export async function POST(request: Request) {
  const { user, error } = await validatePlatformAdmin(request)
  if (error || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  try {
    const body = await request.json()
    const name = String(body?.name || '').trim()
    const slug = String(body?.slug || '').trim()
    const timezone = String(body?.timezone || 'Europe/Madrid').trim()
    const contact_email = body?.contact_email ? String(body.contact_email).trim() : null
    const public_subdomain = body?.public_subdomain ? String(body.public_subdomain).trim() : null
    const plan_key = body?.plan_key ? String(body.plan_key).trim() : null

    if (!name || !slug) {
      return NextResponse.json({ success: false, error: 'Missing required fields: name, slug' }, { status: 400 })
    }

    const { data: tenant, error: insertError } = await supabase
      .from('tenants')
      .insert({
        name,
        slug,
        timezone,
        contact_email,
        public_subdomain,
      } as any)
      .select('id,name,slug,timezone,created_at')
      .single()

    if (insertError || !tenant) {
      return NextResponse.json({ success: false, error: insertError?.message || 'Insert failed' }, { status: 500 })
    }

    // Ensure tenant_settings exists (best-effort)
    await supabase.from('tenant_settings').insert({ tenant_id: tenant.id } as any)

    // Assign plan (best-effort; only if platform schema exists)
    if (plan_key) {
      try {
        await (supabase as any).rpc('admin_set_org_plan', {
          p_org_id: tenant.id,
          p_plan_key: plan_key,
          p_billing_state: 'active',
        })
      } catch {
        // ignore
      }
    }

    await logAudit({
      userId: user.id,
      action: 'tenant_create',
      resourceType: 'tenant',
      resourceId: tenant.id,
      description: `Tenant creado: ${tenant.name}`,
      metadata: { slug: tenant.slug, timezone: tenant.timezone, plan_key },
      severity: 'info',
    })

    return NextResponse.json({ success: true, tenant }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Internal error' }, { status: 500 })
  }
}

