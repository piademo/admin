import { createServiceClient } from '@/lib/supabase/service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, TrendingUp, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

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

async function getBookingStats() {
  const supabase = createServiceClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [todayRes, weekRes, cancelledRes, noShowRes] = await Promise.all([
    supabase.from('bookings').select('id', { count: 'exact' })
      .gte('starts_at', today.toISOString())
      .lt('starts_at', tomorrow.toISOString()),
    supabase.from('bookings').select('id', { count: 'exact' })
      .gte('starts_at', sevenDaysAgo.toISOString()),
    supabase.from('bookings').select('id', { count: 'exact' })
      .eq('status', 'cancelled')
      .gte('created_at', sevenDaysAgo.toISOString()),
    supabase.from('bookings').select('id', { count: 'exact' })
      .eq('status', 'no_show')
      .gte('created_at', sevenDaysAgo.toISOString()),
  ])

  return {
    today: todayRes.count || 0,
    week: weekRes.count || 0,
    cancelled: cancelledRes.count || 0,
    noShow: noShowRes.count || 0,
  }
}

async function getRecentBookings() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      starts_at,
      ends_at,
      status,
      tenant_id,
      customer:customers(name, email),
      service:services(name, price_cents),
      staff:staff(name)
    `)
    .order('starts_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching bookings:', error)
    return []
  }
  return data || []
}

export default async function BookingsPage() {
  const [stats, bookings] = await Promise.all([getBookingStats(), getRecentBookings()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reservas</h1>
        <p className="text-muted-foreground">Todas las reservas de la plataforma en tiempo real</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { title: 'Hoy', value: stats.today, icon: Calendar, desc: 'Reservas programadas para hoy' },
          { title: 'Últimos 7 días', value: stats.week, icon: TrendingUp, desc: 'Volumen de reservas reciente' },
          { title: 'Canceladas 7d', value: stats.cancelled, icon: XCircle, desc: 'Cancelaciones esta semana' },
          { title: 'No-shows 7d', value: stats.noShow, icon: Clock, desc: 'No presentados esta semana' },
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

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reservas recientes ({bookings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="grid grid-cols-12 gap-3 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
              <div className="col-span-2">Fecha</div>
              <div className="col-span-3">Cliente</div>
              <div className="col-span-2">Servicio</div>
              <div className="col-span-2">Staff</div>
              <div className="col-span-1">Importe</div>
              <div className="col-span-2">Estado</div>
            </div>

            {bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No hay reservas</p>
            ) : (
              bookings.map(booking => {
                const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer
                const service = Array.isArray(booking.service) ? booking.service[0] : booking.service
                const staff = Array.isArray(booking.staff) ? booking.staff[0] : booking.staff

                return (
                  <div
                    key={booking.id}
                    className="grid grid-cols-12 gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/30 transition-colors items-center"
                  >
                    <div className="col-span-2 text-xs text-muted-foreground">
                      <p>{format(new Date(booking.starts_at), 'd MMM', { locale: es })}</p>
                      <p>{format(new Date(booking.starts_at), 'HH:mm')}</p>
                    </div>
                    <div className="col-span-3 text-sm">
                      <p className="font-medium truncate">{customer?.name || 'Sin cliente'}</p>
                      <p className="text-xs text-muted-foreground truncate">{customer?.email || ''}</p>
                    </div>
                    <div className="col-span-2 text-sm truncate text-muted-foreground">
                      {service?.name || '—'}
                    </div>
                    <div className="col-span-2 text-sm truncate text-muted-foreground">
                      {staff?.name || '—'}
                    </div>
                    <div className="col-span-1 text-sm font-mono">
                      {service?.price_cents ? `${(service.price_cents / 100).toFixed(0)}€` : '—'}
                    </div>
                    <div className="col-span-2">
                      <Badge variant={STATUS_VARIANT[booking.status] || 'secondary'} className="text-xs">
                        {STATUS_LABELS[booking.status] || booking.status}
                      </Badge>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
