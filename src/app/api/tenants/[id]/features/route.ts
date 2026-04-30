import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { validatePlatformAdmin, logAudit } from '@/lib/auth/platform'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await validatePlatformAdmin(request)
  if (error || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createServiceClient()
  const { data, error: rpcErr } = await (supabase as any).rpc('admin_list_org_feature_overrides', { p_org_id: id })
  if (rpcErr) {
    return NextResponse.json({ success: false, error: rpcErr.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, overrides: data || [] })
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
    const feature_key = String(body?.feature_key || '').trim()
    const enabled = !!body?.enabled
    const quota_limit = body?.quota_limit ?? null
    const reason = body?.reason ? String(body.reason) : null
    const expires_at = body?.expires_at ? String(body.expires_at) : null

    if (!feature_key) {
      return NextResponse.json({ success: false, error: 'Missing feature_key' }, { status: 400 })
    }

    const { data, error: rpcErr } = await (supabase as any).rpc('admin_upsert_org_feature_override', {
      p_org_id: id,
      p_feature_key: feature_key,
      p_enabled: enabled,
      p_quota_limit: quota_limit,
      p_reason: reason,
      p_expires_at: expires_at,
    })

    if (rpcErr) {
      return NextResponse.json(
        {
          success: false,
          error: rpcErr.message || 'RPC error. Ejecuta la migración 003 de features en Supabase.',
        },
        { status: 500 },
      )
    }

    await logAudit({
      userId: user.id,
      action: 'tenant_feature_override_upsert',
      resourceType: 'tenant',
      resourceId: id,
      description: `Override feature ${feature_key}: ${enabled ? 'ON' : 'OFF'}`,
      metadata: { feature_key, enabled, result: data },
      severity: 'warning',
    })

    return NextResponse.json({ success: true, override: data })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await validatePlatformAdmin(request)
  if (error || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createServiceClient()

  try {
    const body = await request.json()
    const feature_key = String(body?.feature_key || '').trim()
    if (!feature_key) {
      return NextResponse.json({ success: false, error: 'Missing feature_key' }, { status: 400 })
    }

    const { error: rpcErr } = await (supabase as any).rpc('admin_delete_org_feature_override', {
      p_org_id: id,
      p_feature_key: feature_key,
    })
    if (rpcErr) {
      return NextResponse.json({ success: false, error: rpcErr.message }, { status: 500 })
    }

    await logAudit({
      userId: user.id,
      action: 'tenant_feature_override_delete',
      resourceType: 'tenant',
      resourceId: id,
      description: `Override eliminado: ${feature_key}`,
      metadata: { feature_key },
      severity: 'warning',
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Internal error' }, { status: 500 })
  }
}

