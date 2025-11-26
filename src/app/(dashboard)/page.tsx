import { Building2, Calendar, LifeBuoy, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MfaSetupBanner } from '@/components/mfa/MfaSetupBanner'

const metrics = [
  {
    title: 'Tenants Activos',
    value: '24',
    icon: Building2,
    description: 'Total de clientes activos',
  },
  {
    title: 'Reservas Hoy',
    value: '12',
    icon: Calendar,
    description: 'Reservas programadas para hoy',
  },
  {
    title: 'Tickets Abiertos',
    value: '5',
    icon: LifeBuoy,
    description: 'Tickets pendientes de resolución',
  },
  {
    title: 'MRR',
    value: '$12,450',
    icon: DollarSign,
    description: 'Ingresos recurrentes mensuales',
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen general del panel de administración
        </p>
      </div>

      {/* MFA Setup Banner */}
      <MfaSetupBanner />

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

      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No hay actividad reciente para mostrar.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
