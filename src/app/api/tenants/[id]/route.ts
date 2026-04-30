import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { validatePlatformAdmin, logAudit } from '@/lib/auth/platform'
import type { Database } from '@/types/supabase'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await validatePlatformAdmin(request)
  if (error || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createServiceClient()
  const { data, error: dbError } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (dbError) return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 })
  if (!data) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true, tenant: data })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await validatePlatformAdmin(request)
  if (error || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createServiceClient()

  try {
    const body = await request.json()
    const update: Database['public']['Tables']['tenants']['Update'] = {}
    for (const key of ['name', 'slug', 'timezone', 'contact_email', 'contact_phone', 'address', 'public_subdomain'] as const) {
      if (key in (body || {})) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        update[key] = body[key]
      }
    }

    const { data, error: dbError } = await supabase
      .from('tenants')
      .update(update)
      .eq('id', id)
      .select('id,name,slug,timezone,contact_email,contact_phone,address,public_subdomain,updated_at')
      .maybeSingle()

    if (dbError || !data) {
      return NextResponse.json({ success: false, error: dbError?.message || 'Update failed' }, { status: 500 })
    }

    await logAudit({
      userId: user.id,
      action: 'tenant_update',
      resourceType: 'tenant',
      resourceId: id,
      description: `Tenant actualizado: ${data.name}`,
      changes: update,
      severity: 'info',
    })

    return NextResponse.json({ success: true, tenant: data })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Internal error' }, { status: 500 })
  }
}

