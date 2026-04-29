import { createServiceClient } from '@/lib/supabase/service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Users, Calendar, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

async function getTenants() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('tenants')
    .select(`
      id,
      name,
      slug,
      is_active,
      created_at
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching tenants:', error)
    return []
  }
  return (data as any[]) || []
}

async function getTenantStats() {
  const supabase = createServiceClient()

  const [tenantsRes, staffRes, bookingsRes] = await Promise.all([
    supabase.from('tenants').select('id, is_active', { count: 'exact' }),
    supabase.from('staff').select('id', { count: 'exact' }),
    supabase.from('bookings').select('id', { count: 'exact' }).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
  ])

  return {
    total: tenantsRes.count || 0,
    active: (tenantsRes.data as any[])?.filter((t: any) => t.is_active !== false).length || 0,
    totalStaff: staffRes.count || 0,
    bookingsThisWeek: bookingsRes.count || 0,
  }
}

export default async function TenantsPage() {
  const [tenants, stats] = await Promise.all([getTenants(), getTenantStats()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
        <p className="text-muted-foreground">Gestión de barberías y negocios activos</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { title: 'Total Tenants', value: stats.total, icon: Building2, desc: 'Registrados en la plataforma' },
          { title: 'Activos', value: stats.active, icon: Building2, desc: 'Con cuenta activa' },
          { title: 'Empleados', value: stats.totalStaff, icon: Users, desc: 'Staff total en plataforma' },
          { title: 'Reservas 7d', value: stats.bookingsThisWeek, icon: Calendar, desc: 'Esta semana' },
        ].map(kpi => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">{kpi.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Tenants ({tenants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-12 gap-3 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
              <div className="col-span-3">Negocio</div>
              <div className="col-span-3">Contacto</div>
              <div className="col-span-2">Ubicación</div>
              <div className="col-span-2">Plan</div>
              <div className="col-span-2">Alta</div>
            </div>

            {tenants.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No hay tenants registrados</p>
            ) : (
              tenants.map(tenant => (
                <div
                  key={tenant.id}
                  className="grid grid-cols-12 gap-3 px-3 py-3 rounded-lg hover:bg-secondary/30 transition-colors items-center"
                >
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                        {tenant.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{tenant.name || '—'}</p>
                        <p className="text-xs text-muted-foreground">/{tenant.slug || tenant.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-3 text-sm text-muted-foreground">
                    <p className="truncate">/{tenant.slug || tenant.id.slice(0, 8)}</p>
                  </div>

                  <div className="col-span-2 text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">—</span>
                  </div>

                  <div className="col-span-2">
                    <Badge variant={tenant.is_active !== false ? 'default' : 'secondary'}>
                      {tenant.is_active !== false ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>

                  <div className="col-span-2 text-xs text-muted-foreground">
                    {tenant.created_at
                      ? format(new Date(tenant.created_at), 'd MMM yyyy', { locale: es })
                      : '—'}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
