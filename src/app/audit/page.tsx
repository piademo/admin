import { createServiceClient } from '@/lib/supabase/service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

async function getAuditLogs() {
  const supabase = createServiceClient()
  const { data, error } = await (supabase as any)
    .from?.('audit_logs')
    ?.select?.('id,action,resource_type,resource_id,description,severity,created_at,user_email')
    ?.order?.('created_at', { ascending: false })
    ?.limit?.(100)

  if (error) return []
  return (data || []) as any[]
}

export default async function AuditPage() {
  const logs = await getAuditLogs()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Auditoría</h1>
        <p className="text-muted-foreground">Últimos eventos registrados en `platform.audit_logs`</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Eventos recientes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin eventos o no se pudo leer `audit_logs`.</p>
          ) : (
            logs.map((l) => (
              <div key={l.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{l.description}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono">{l.action}</span> · {l.user_email || '—'} ·{' '}
                      {l.created_at ? formatDistanceToNow(new Date(l.created_at), { addSuffix: true, locale: es }) : '—'}
                    </p>
                  </div>
                  <Badge variant={l.severity === 'critical' || l.severity === 'error' ? 'destructive' : 'secondary'} className="text-xs">
                    {l.severity || 'info'}
                  </Badge>
                </div>
                {(l.resource_type || l.resource_id) && (
                  <p className="mt-2 text-xs text-muted-foreground font-mono">
                    {l.resource_type || '—'} {l.resource_id ? `· ${l.resource_id}` : ''}
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

