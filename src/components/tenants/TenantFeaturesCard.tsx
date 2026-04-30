'use client'

import { useMemo, useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

type Feature = { key: string; name: string; default_enabled: boolean }
type OverrideRow = {
  feature_key: string
  enabled: boolean
  quota_limit: any
  reason: string | null
  expires_at: string | null
}

export function TenantFeaturesCard({
  tenantId,
  features,
  overrides,
}: {
  tenantId: string
  features: Feature[]
  overrides: OverrideRow[]
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [featureKey, setFeatureKey] = useState<string>('')
  const [enabled, setEnabled] = useState<'true' | 'false'>('true')
  const [reason, setReason] = useState<string>('')
  const [expiresAt, setExpiresAt] = useState<string>('')
  const [quotaJson, setQuotaJson] = useState<string>('{}')

  const overridesByKey = useMemo(() => {
    const map = new Map<string, OverrideRow>()
    overrides.forEach((o) => map.set(o.feature_key, o))
    return map
  }, [overrides])

  const upsert = () => {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      try {
        let quota: any = null
        try {
          quota = quotaJson.trim() ? JSON.parse(quotaJson) : null
        } catch {
          setError('quota_limit no es JSON válido')
          return
        }

        const res = await fetch(`/api/tenants/${tenantId}/features`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            feature_key: featureKey,
            enabled: enabled === 'true',
            reason: reason || null,
            expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
            quota_limit: quota,
          }),
        })
        const json = await res.json()
        if (!res.ok || !json?.success) {
          setError(json?.error || 'No se pudo guardar el override')
          return
        }
        setSuccess('Override guardado')
        window.location.reload()
      } catch (e: any) {
        setError(e?.message || 'Error inesperado')
      }
    })
  }

  const remove = (key: string) => {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tenants/${tenantId}/features`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feature_key: key }),
        })
        const json = await res.json()
        if (!res.ok || !json?.success) {
          setError(json?.error || 'No se pudo borrar el override')
          return
        }
        setSuccess('Override eliminado')
        window.location.reload()
      } catch (e: any) {
        setError(e?.message || 'Error inesperado')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Features (overrides por tenant)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {(error || success) && (
          <Alert variant={error ? 'destructive' : 'default'}>
            <AlertTitle>{error ? 'Error' : 'OK'}</AlertTitle>
            <AlertDescription>{error || success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Los overrides tienen prioridad sobre el plan. Si no ves catálogo/overrides, ejecuta la migración{' '}
            <span className="font-mono text-foreground">003_platform_features_admin_rpc.sql</span>.
          </p>
        </div>

        <div className="rounded-lg border p-4 space-y-4">
          <p className="text-sm font-medium">Crear / actualizar override</p>

          <div className="grid gap-2">
            <Label>feature_key</Label>
            <Input value={featureKey} onChange={(e) => setFeatureKey(e.target.value)} placeholder="Ej. ai_agent" />
            {features.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Catálogo: {features.slice(0, 8).map((f) => f.key).join(', ')}
                {features.length > 8 ? '…' : ''}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>enabled</Label>
            <Input value={enabled} onChange={(e) => setEnabled(e.target.value as any)} placeholder="true | false" />
          </div>

          <div className="grid gap-2">
            <Label>expires_at (opcional)</Label>
            <Input value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} placeholder="2026-12-31" />
          </div>

          <div className="grid gap-2">
            <Label>reason (opcional)</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej. descuento temporal" />
          </div>

          <div className="grid gap-2">
            <Label>quota_limit (JSON opcional)</Label>
            <Textarea value={quotaJson} onChange={(e) => setQuotaJson(e.target.value)} rows={4} />
          </div>

          <Button onClick={upsert} disabled={isPending || !featureKey.trim()}>
            {isPending ? 'Guardando…' : 'Guardar override'}
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Overrides actuales</p>
          {features.length === 0 && overrides.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos.</p>
          ) : (
            <div className="space-y-2">
              {features.map((f) => {
                const o = overridesByKey.get(f.key)
                return (
                  <div key={f.key} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{f.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{f.key}</p>
                      <p className="text-xs text-muted-foreground">
                        Default: {f.default_enabled ? 'ON' : 'OFF'}
                        {o ? ` · Override: ${o.enabled ? 'ON' : 'OFF'}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={o ? (o.enabled ? 'default' : 'secondary') : 'outline'} className="text-xs">
                        {o ? (o.enabled ? 'Override ON' : 'Override OFF') : 'Sin override'}
                      </Badge>
                      {o && (
                        <Button variant="outline" size="sm" onClick={() => remove(f.key)} disabled={isPending}>
                          Quitar
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

