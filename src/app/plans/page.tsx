import { createServiceClient } from '@/lib/supabase/service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

async function getPlans() {
  const supabase = createServiceClient()
  try {
    const { data } = await (supabase as any).rpc('admin_list_plans')
    return (data || []) as any[]
  } catch {
    return []
  }
}

export default async function PlansPage() {
  const plans = await getPlans()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Planes</h1>
        <p className="text-muted-foreground">Planes disponibles para asignación a tenants (vía `platform.org_plans`)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No se pudieron cargar planes (¿existe `platform.plans`?).</p>
          ) : (
            plans.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{p.key}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-muted-foreground">
                    {typeof p.price_monthly_cents === 'number' ? `${(p.price_monthly_cents / 100).toFixed(0)}€/mes` : '—'}
                  </span>
                  <Badge variant={p.active ? 'default' : 'secondary'} className="text-xs">
                    {p.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

