import { createServiceClient } from '@/lib/supabase/service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

async function getImpersonations() {
  const supabase = createServiceClient()
  const { data, error } = await (supabase as any)
    .from?.('impersonations')
    ?.select?.('id,tenant_id,tenant_name,admin_user_id,reason,is_active,started_at,ended_at')
    ?.order?.('started_at', { ascending: false })
    ?.limit?.(100)

  if (error) return []
  return (data || []) as any[]
}

export default async function ImpersonationsPage() {
  const items = await getImpersonations()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Impersonación</h1>
        <p className="text-muted-foreground">Sesiones de suplantación (trazabilidad y control)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos o no se pudo leer `impersonations`.</p>
          ) : (
            items.map((i) => (
              <div key={i.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{i.tenant_name || i.tenant_id}</p>
                    <p className="text-xs text-muted-foreground">
                      {i.started_at ? formatDistanceToNow(new Date(i.started_at), { addSuffix: true, locale: es }) : '—'}
                      {i.reason ? ` · ${i.reason}` : ''}
                    </p>
                  </div>
                  <Badge variant={i.is_active ? 'default' : 'secondary'} className="text-xs">
                    {i.is_active ? 'Activa' : 'Finalizada'}
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

