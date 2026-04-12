import { createServiceClient } from '@/lib/supabase/service'
import { Building2, Calendar, LifeBuoy, TrendingUp, Users, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MfaSetupBanner } from '@/components/mfa/MfaSetupBanner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

async function getDashboardData() {
  const supabase = createServiceClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)

  const [
    activeTenants,
    bookingsToday,
    revenue30d,
    totalCustomers,
    recentTenants,
    recentBookings,
  ] = await Promise.all([
    supabase.from('tenants').select('id', { count: 'exact' }).neq('active', false),
    supabase.from('bookings').select('id', { count: 'exact' })
      .gte('starts_at', today.toISOString())
      .lt('starts_at', tomorrow.toISOString()),
    supabase.from('bookings')
      .select('services(price_cents)')
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo.toISOString()),
    supabase.from('customers').select('id', { count: 'exact' }),
    supabase.from('tenants')
      .select('id, name, slug, email, city, country, active, plan, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('bookings')
      .select(`
        id,
        starts_at,
        status,
        tenant_id,
        customer:customers(name),
        service:services(name, price_cents)
      `)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  // Revenue calculation
  let revenueTotal = 0
  if (revenue30d.data) {
    revenueTotal = revenue30d.data.reduce((sum: number, b: any) => {
      const service = Array.isArray(b.services) ? b.services[0] : b.services
      return sum + (service?.price_cents || 0)
    }, 0)
  }

  return {
    activeTenants: activeTenants.count || 0,
    bookingsToday: bookingsToday.count || 0,
    revenue30d: revenueTotal,
    totalCustomers: totalCustomers.count || 0,
    recentTenants: recentTenants.data || [],
    recentBookings: recentBookings.data || [],
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

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  hold: 'secondary',
  pending: 'outline',
  paid: 'default',
  completed: 'default',
  cancelled: 'destructive',
  no_show: 'destructive',
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  const metrics = [
    {
      title: 'Tenants Activos',
      value: data.activeTenants.toString(),
      icon: Building2,
      description: 'Negocios con cuenta activa',
    },
    {
      title: 'Reservas Hoy',
      value: data.bookingsToday.toString(),
      icon: Calendar,
      description: 'Programadas para hoy',
    },
    {
      title: 'Clientes Total',
      value: data.totalCustomers.toLocaleString('es'),
      icon: Users,
      description: 'Usuarios registrados en la plataforma',
    },
    {
      title: 'Ingresos 30d',
      value: new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(data.revenue30d / 100),
      icon: DollarSign,
      description: 'Reservas completadas último mes',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen general · {format(new Date(), "d 'de' MMMM yyyy", { locale: es })}
        </p>
      </div>

      {/* MFA Setup Banner */}
      <MfaSetupBanner />

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Tenants */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimos Tenants registrados</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentTenants.length === 0 ? (
              <p className="text-sm text-muted-foreground px-6 py-8 text-center">Sin tenants registrados</p>
            ) : (
              <div className="divide-y">
                {data.recentTenants.map((tenant: any) => (
                  <div key={tenant.id} className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {tenant.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">{tenant.name || '—'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {tenant.city || tenant.country || tenant.email || `/${tenant.slug || tenant.id.slice(0, 8)}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge variant={tenant.active !== false ? 'default' : 'secondary'} className="text-xs">
                        {tenant.active !== false ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {tenant.created_at
                          ? format(new Date(tenant.created_at), 'd MMM', { locale: es })
                          : '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reservas recientes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground px-6 py-8 text-center">Sin reservas recientes</p>
            ) : (
              <div className="divide-y">
                {data.recentBookings.map((booking: any) => {
                  const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer
                  const service = Array.isArray(booking.service) ? booking.service[0] : booking.service
                  return (
                    <div key={booking.id} className="flex items-center justify-between px-6 py-3">
                      <div>
                        <p className="text-sm font-medium leading-none">
                          {customer?.name || 'Cliente sin nombre'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {service?.name || 'Servicio desconocido'} ·{' '}
                          {format(new Date(booking.starts_at), "d MMM, HH:mm", { locale: es })}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Badge variant={STATUS_VARIANT[booking.status] || 'secondary'} className="text-xs">
                          {STATUS_LABELS[booking.status] || booking.status}
                        </Badge>
                        {service?.price_cents && (
                          <p className="text-xs text-muted-foreground mt-1 font-mono">
                            {(service.price_cents / 100).toFixed(0)}€
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
