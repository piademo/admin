'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export type TenantDetailData = {
  tenant: {
    id: string
    name: string
    slug: string
    timezone: string
    contact_email: string | null
    contact_phone: string | null
    address: string | null
    portal_url: string | null
    public_subdomain: string | null
    stripe_onboarding_status: string | null
    stripe_charges_enabled: boolean | null
    stripe_payouts_enabled: boolean | null
    created_at: string | null
    updated_at: string | null
  }
  orgPlan: null | {
    plan_key: string | null
    plan_name: string | null
    billing_state: string | null
    renew_at: string | null
  }
}

export function TenantDetailPanel({ data }: { data: TenantDetailData }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [tenant, setTenant] = useState(() => ({ ...data.tenant }))
  const [planKey, setPlanKey] = useState(data.orgPlan?.plan_key || 'free')
  const [billingState, setBillingState] = useState(data.orgPlan?.billing_state || 'active')

  const stripeBadge = useMemo(() => {
    if (tenant.stripe_charges_enabled) return { label: 'Cobros OK', variant: 'default' as const }
    return { label: tenant.stripe_onboarding_status || 'pending', variant: 'secondary' as const }
  }, [tenant.stripe_charges_enabled, tenant.stripe_onboarding_status])

  const saveTenant = () => {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tenants/${tenant.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: tenant.name,
            slug: tenant.slug,
            timezone: tenant.timezone,
            contact_email: tenant.contact_email,
            contact_phone: tenant.contact_phone,
            address: tenant.address,
            public_subdomain: tenant.public_subdomain,
          }),
        })
        const json = await res.json()
        if (!res.ok || !json?.success) {
          setError(json?.error || 'No se pudo guardar el tenant')
          return
        }
        setSuccess('Cambios guardados')
        router.refresh()
      } catch (e: any) {
        setError(e?.message || 'Error inesperado')
      }
    })
  }

  const savePlan = () => {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tenants/${tenant.id}/plan`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan_key: planKey,
            billing_state: billingState,
          }),
        })
        const json = await res.json()
        if (!res.ok || !json?.success) {
          setError(json?.error || 'No se pudo actualizar el plan')
          return
        }
        setSuccess('Plan actualizado')
        router.refresh()
      } catch (e: any) {
        setError(e?.message || 'Error inesperado')
      }
    })
  }

  return (
    <div className="space-y-6">
      {(error || success) && (
        <Alert variant={error ? 'destructive' : 'default'}>
          <AlertTitle>{error ? 'Error' : 'OK'}</AlertTitle>
          <AlertDescription>{error || success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Tenant</CardTitle>
            <Badge variant={stripeBadge.variant} className="text-xs">
              Stripe: {stripeBadge.label}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Nombre</Label>
              <Input value={tenant.name} onChange={(e) => setTenant((t) => ({ ...t, name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Slug</Label>
              <Input value={tenant.slug} onChange={(e) => setTenant((t) => ({ ...t, slug: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Zona horaria</Label>
              <Input value={tenant.timezone} onChange={(e) => setTenant((t) => ({ ...t, timezone: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Email contacto</Label>
              <Input
                value={tenant.contact_email || ''}
                onChange={(e) => setTenant((t) => ({ ...t, contact_email: e.target.value || null }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Teléfono contacto</Label>
              <Input
                value={tenant.contact_phone || ''}
                onChange={(e) => setTenant((t) => ({ ...t, contact_phone: e.target.value || null }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Dirección</Label>
              <Input
                value={tenant.address || ''}
                onChange={(e) => setTenant((t) => ({ ...t, address: e.target.value || null }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Subdominio público</Label>
              <Input
                value={tenant.public_subdomain || ''}
                onChange={(e) => setTenant((t) => ({ ...t, public_subdomain: e.target.value || null }))}
              />
            </div>
            <Button onClick={saveTenant} disabled={isPending}>
              {isPending ? 'Guardando…' : 'Guardar'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suscripción</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Plan (key)</Label>
              <Input value={planKey} onChange={(e) => setPlanKey(e.target.value)} placeholder="free | pro | enterprise" />
            </div>
            <div className="grid gap-2">
              <Label>Billing state</Label>
              <Input value={billingState} onChange={(e) => setBillingState(e.target.value)} placeholder="active | trial | suspended | cancelled" />
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                Actual: <span className="text-foreground font-medium">{data.orgPlan?.plan_name || data.orgPlan?.plan_key || '—'}</span>
              </p>
              <p>
                Renovación: <span className="font-mono text-foreground">{data.orgPlan?.renew_at || '—'}</span>
              </p>
            </div>

            <Button onClick={savePlan} disabled={isPending}>
              {isPending ? 'Actualizando…' : 'Actualizar plan'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

