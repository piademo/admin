'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

type FormState = {
  name: string
  slug: string
  timezone: string
  contact_email: string
  public_subdomain: string
  plan_key: string
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/(^-+)|(-+$)/g, '')
}

export function TenantCreateForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<FormState>({
    name: '',
    slug: '',
    timezone: 'Europe/Madrid',
    contact_email: '',
    public_subdomain: '',
    plan_key: 'free',
  })

  const computedSlug = useMemo(() => {
    if (state.slug.trim()) return slugify(state.slug)
    return slugify(state.name)
  }, [state.name, state.slug])

  const submit = () => {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/tenants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: state.name,
            slug: computedSlug,
            timezone: state.timezone,
            contact_email: state.contact_email || null,
            public_subdomain: state.public_subdomain || null,
            plan_key: state.plan_key,
          }),
        })
        const json = await res.json()
        if (!res.ok || !json?.success) {
          setError(json?.error || 'No se pudo crear el tenant')
          return
        }
        router.push(`/tenants/${json.tenant.id}`)
        router.refresh()
      } catch (e: any) {
        setError(e?.message || 'Error inesperado')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alta de tenant</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-2">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            value={state.name}
            onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
            placeholder="Ej. BookFast Demo"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="slug">Slug (URL interna)</Label>
          <Input
            id="slug"
            value={state.slug}
            onChange={(e) => setState((s) => ({ ...s, slug: e.target.value }))}
            placeholder="Ej. bookfast-demo"
          />
          <p className="text-xs text-muted-foreground">
            Se guardará como: <span className="font-mono text-foreground">/{computedSlug || '—'}</span>
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="timezone">Zona horaria</Label>
          <Input
            id="timezone"
            value={state.timezone}
            onChange={(e) => setState((s) => ({ ...s, timezone: e.target.value }))}
            placeholder="Europe/Madrid"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="contact_email">Email de contacto (opcional)</Label>
          <Input
            id="contact_email"
            value={state.contact_email}
            onChange={(e) => setState((s) => ({ ...s, contact_email: e.target.value }))}
            placeholder="contacto@negocio.com"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="public_subdomain">Subdominio público (opcional)</Label>
          <Input
            id="public_subdomain"
            value={state.public_subdomain}
            onChange={(e) => setState((s) => ({ ...s, public_subdomain: e.target.value }))}
            placeholder="negocio.bookfast.es"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="plan_key">Plan (key)</Label>
          <Input
            id="plan_key"
            value={state.plan_key}
            onChange={(e) => setState((s) => ({ ...s, plan_key: e.target.value }))}
            placeholder="free | pro | enterprise"
          />
          <p className="text-xs text-muted-foreground">
            Si existe `platform.plans`, se asignará automáticamente vía `platform.org_plans`.
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={submit} disabled={isPending || !state.name.trim() || !computedSlug}>
            {isPending ? 'Creando…' : 'Crear tenant'}
          </Button>
          <Button variant="outline" onClick={() => router.push('/tenants')} disabled={isPending}>
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

