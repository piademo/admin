import { createServiceClient } from '@/lib/supabase/service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

async function getFeatures() {
  const supabase = createServiceClient()
  try {
    const { data } = await (supabase as any).rpc('admin_list_features')
    return (data || []) as any[]
  } catch {
    return []
  }
}

export default async function FeaturesPage() {
  const features = await getFeatures()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Features</h1>
        <p className="text-muted-foreground">Catálogo de módulos/funcionalidades para planes y overrides</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {features.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No se pudieron cargar features. Ejecuta la migración `003_platform_features_admin_rpc.sql` en Supabase.
            </p>
          ) : (
            features.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{f.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{f.key}</p>
                </div>
                <Badge variant={f.default_enabled ? 'default' : 'secondary'} className="text-xs">
                  {f.default_enabled ? 'Default ON' : 'Default OFF'}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

