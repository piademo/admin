import { createServiceClient } from '@/lib/supabase/service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Building2 } from 'lucide-react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { es } from 'date-fns/locale'

async function getReportData() {
  const supabase = createServiceClient()

  const today = new Date()
  const sevenDaysAgo = subDays(today, 7)
  const thirtyDaysAgo = subDays(today, 30)

  const [
    totalTenantsRes,
    totalCustomersRes,
    totalBookingsRes,
    bookings7dRes,
    bookings30dRes,
    revenue30dRes,
    topTenantsRes,
    bookingsByStatusRes,
  ] = await Promise.all([
    supabase.from('tenants').select('id', { count: 'exact' }),
    supabase.from('customers').select('id', { count: 'exact' }),
    supabase.from('bookings').select('id', { count: 'exact' }),
    supabase.from('bookings').select('id', { count: 'exact' })
      .gte('created_at', sevenDaysAgo.toISOString()),
    supabase.from('bookings').select('id', { count: 'exact' })
      .gte('created_at', thirtyDaysAgo.toISOString()),
    supabase.from('bookings')
      .select('services(price_cents)')
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo.toISOString()),
    supabase.from('bookings')
      .select('tenant_id')
      .gte('created_at', thirtyDaysAgo.toISOString()),
    supabase.from('bookings')
      .select('status')
      .gte('created_at', thirtyDaysAgo.toISOString()),
  ])

  // Calculate revenue 30d
  let revenue30d = 0
  if (revenue30dRes.data) {
    revenue30d = revenue30dRes.data.reduce((sum: number, b: any) => {
      const service = Array.isArray(b.services) ? b.services[0] : b.services
      return sum + (service?.price_cents || 0)
    }, 0)
  }

  // Count top tenants by bookings
  const tenantBookingCounts: Record<string, number> = {}
  if (topTenantsRes.data) {
    topTenantsRes.data.forEach((b: any) => {
      if (b.tenant_id) {
        tenantBookingCounts[b.tenant_id] = (tenantBookingCounts[b.tenant_id] || 0) + 1
      }
    })
  }
  const topTenantIds = Object.entries(tenantBookingCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ id, count }))

  // Fetch tenant names
  let topTenantsWithNames: Array<{ id: string; name: string; count: number }> = []
  if (topTenantIds.length > 0) {
    const { data: tenantNames } = await supabase
      .from('tenants')
      .select('id, name')
      .in('id', topTenantIds.map(t => t.id))
    topTenantsWithNames = topTenantIds.map(t => ({
      ...t,
      name: tenantNames?.find(n => n.id === t.id)?.name || t.id.slice(0, 8),
    }))
  }

  // Status distribution
  const statusCounts: Record<string, number> = {}
  if (bookingsByStatusRes.data) {
    bookingsByStatusRes.data.forEach((b: any) => {
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1
    })
  }

  return {
    totalTenants: totalTenantsRes.count || 0,
    totalCustomers: totalCustomersRes.count || 0,
    totalBookings: totalBookingsRes.count || 0,
    bookings7d: bookings7dRes.count || 0,
    bookings30d: bookings30dRes.count || 0,
    revenue30d,
    topTenants: topTenantsWithNames,
    statusCounts,
  }
}

const STATUS_LABELS: Record<string, string> = {
  hold: 'En espera',
  pending: 'Pendiente',
  paid: 'Pagado',
  completed: 'Completado',
  cancelled: 'Cancelado',
  no_show: 'No asistió',
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-500',
  paid: 'bg-blue-500',
  pending: 'bg-amber-500',
  cancelled: 'bg-red-500',
  no_show: 'bg-rose-700',
  hold: 'bg-slate-500',
}

export default async function ReportsPage() {
  const data = await getReportData()

  const totalStatusCount = Object.values(data.statusCounts).reduce((a, b) => a + b, 0) || 1
  const maxTenantCount = Math.max(...data.topTenants.map(t => t.count), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
        <p className="text-muted-foreground">
          Métricas clave de la plataforma · {format(new Date(), "d 'de' MMMM yyyy", { locale: es })}
        </p>
      </div>

      {/* Platform KPIs */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[
          { title: 'Tenants', value: data.totalTenants, icon: Building2 },
          { title: 'Clientes', value: data.totalCustomers.toLocaleString('es'), icon: Users },
          { title: 'Reservas total', value: data.totalBookings.toLocaleString('es'), icon: Calendar },
          { title: 'Reservas 7d', value: data.bookings7d, icon: TrendingUp },
          { title: 'Reservas 30d', value: data.bookings30d, icon: BarChart3 },
          {
            title: 'Ingresos 30d',
            value: new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(data.revenue30d / 100),
            icon: DollarSign,
          },
        ].map(kpi => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{kpi.title}</CardTitle>
              <kpi.icon className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Bookings by status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de estados (30d)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.statusCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => {
                const pct = Math.round((count / totalStatusCount) * 100)
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{STATUS_LABELS[status] || status}</span>
                      <span className="font-medium">{count} <span className="text-muted-foreground text-xs">({pct}%)</span></span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${STATUS_COLORS[status] || 'bg-slate-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            {Object.keys(data.statusCounts).length === 0 && (
              <p className="text-sm text-muted-foreground">Sin datos suficientes</p>
            )}
          </CardContent>
        </Card>

        {/* Top tenants */}
        <Card>
          <CardHeader>
            <CardTitle>Top Tenants por reservas (30d)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.topTenants.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos suficientes</p>
            ) : (
              data.topTenants.map((tenant, i) => (
                <div key={tenant.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4">#{i + 1}</span>
                      <span className="font-medium truncate max-w-[180px]">{tenant.name}</span>
                    </div>
                    <span className="font-medium">{tenant.count} reservas</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${Math.round((tenant.count / maxTenantCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick health check */}
      <Card>
        <CardHeader>
          <CardTitle>Salud de la plataforma</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Tasa de completadas',
                value: totalStatusCount > 0
                  ? `${Math.round(((data.statusCounts['completed'] || 0) / totalStatusCount) * 100)}%`
                  : '—',
                ok: ((data.statusCounts['completed'] || 0) / totalStatusCount) > 0.5,
              },
              {
                label: 'Tasa de canceladas',
                value: totalStatusCount > 0
                  ? `${Math.round(((data.statusCounts['cancelled'] || 0) / totalStatusCount) * 100)}%`
                  : '—',
                ok: ((data.statusCounts['cancelled'] || 0) / totalStatusCount) < 0.2,
              },
              {
                label: 'No-shows 30d',
                value: data.statusCounts['no_show'] || 0,
                ok: (data.statusCounts['no_show'] || 0) < 20,
              },
              {
                label: 'Booking/Tenant 30d',
                value: data.totalTenants > 0
                  ? (data.bookings30d / data.totalTenants).toFixed(1)
                  : '—',
                ok: (data.bookings30d / Math.max(data.totalTenants, 1)) > 5,
              },
            ].map(metric => (
              <div
                key={metric.label}
                className={`rounded-lg p-4 border ${metric.ok ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}
              >
                <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                <p className={`text-xl font-bold ${metric.ok ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {metric.value}
                </p>
                <p className={`text-xs mt-1 ${metric.ok ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {metric.ok ? '✓ Saludable' : '⚠ Atención'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
