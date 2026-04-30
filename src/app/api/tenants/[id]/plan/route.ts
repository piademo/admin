import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { validatePlatformAdmin, logAudit } from '@/lib/auth/platform'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await validatePlatformAdmin(request)
  if (error || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createServiceClient()

  try {
    const body = await request.json()
    const plan_key = String(body?.plan_key || '').trim()
    const billing_state = String(body?.billing_state || '').trim() || 'active'

    if (!plan_key) {
      return NextResponse.json({ success: false, error: 'Missing plan_key' }, { status: 400 })
    }

    const { data: result, error: rpcErr } = await (supabase as any).rpc('admin_set_org_plan', {
      p_org_id: id,
      p_plan_key: plan_key,
      p_billing_state: billing_state,
    })

    if (rpcErr) {
      return NextResponse.json(
        {
          success: false,
          error:
            rpcErr.message ||
            'No se pudo actualizar el plan. Asegúrate de ejecutar la migración 002 (RPCs admin) en Supabase.',
        },
        { status: 500 },
      )
    }

    await logAudit({
      userId: user.id,
      action: 'tenant_plan_update',
      resourceType: 'tenant',
      resourceId: id,
      description: `Plan actualizado: ${plan_key} (${billing_state})`,
      metadata: { plan_key, billing_state, result },
      severity: 'warning',
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Internal error' }, { status: 500 })
  }
}

