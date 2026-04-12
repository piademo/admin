'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LifeBuoy, MessageSquare, CheckCircle, Clock, AlertCircle, Send } from 'lucide-react'

// Ticket types for demo
interface Ticket {
  id: string
  subject: string
  tenant: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  created_at: string
  last_reply: string
  message: string
}

const DEMO_TICKETS: Ticket[] = [
  {
    id: 'TKT-001',
    subject: 'No puedo añadir nuevo barbero',
    tenant: 'Barbería El Maestro',
    status: 'open',
    priority: 'high',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    last_reply: new Date(Date.now() - 3600000).toISOString(),
    message: 'Cuando intento crear un nuevo empleado me da error: "pannel_manage_create_staff_v1 not found"',
  },
  {
    id: 'TKT-002',
    subject: 'El portal de reservas no carga',
    tenant: 'Studio Cuts',
    status: 'in_progress',
    priority: 'urgent',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    last_reply: new Date(Date.now() - 1800000).toISOString(),
    message: 'Mis clientes me dicen que la web de reservas muestra una página en blanco desde ayer.',
  },
  {
    id: 'TKT-003',
    subject: 'Cómo cambiar el horario de un día específico',
    tenant: 'The Barber Shop',
    status: 'resolved',
    priority: 'low',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    last_reply: new Date(Date.now() - 43200000).toISOString(),
    message: '¿Es posible cerrar un día concreto sin cambiar todo el horario semanal?',
  },
  {
    id: 'TKT-004',
    subject: 'Error al procesar pago Stripe',
    tenant: 'Salón Premium',
    status: 'open',
    priority: 'urgent',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    last_reply: new Date(Date.now() - 1800000).toISOString(),
    message: 'Un cliente intenta pagar y el checkout falla con error "payment_intent_unexpected_state".',
  },
]

const STATUS_CONFIG = {
  open: { label: 'Abierto', variant: 'destructive' as const, icon: AlertCircle },
  in_progress: { label: 'En proceso', variant: 'outline' as const, icon: Clock },
  resolved: { label: 'Resuelto', variant: 'default' as const, icon: CheckCircle },
  closed: { label: 'Cerrado', variant: 'secondary' as const, icon: CheckCircle },
}

const PRIORITY_CONFIG = {
  low: { label: 'Baja', color: 'text-slate-400' },
  normal: { label: 'Normal', color: 'text-blue-400' },
  high: { label: 'Alta', color: 'text-amber-400' },
  urgent: { label: 'Urgente', color: 'text-red-400' },
}

export default function SupportPage() {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [reply, setReply] = useState('')
  const [tickets, setTickets] = useState<Ticket[]>(DEMO_TICKETS)
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all')

  const filteredTickets = filter === 'all'
    ? tickets
    : tickets.filter(t => t.status === filter)

  const openCount = tickets.filter(t => t.status === 'open').length
  const urgentCount = tickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved').length

  const handleSendReply = () => {
    if (!reply.trim() || !selectedTicket) return
    setTickets(prev => prev.map(t =>
      t.id === selectedTicket.id
        ? { ...t, status: 'in_progress', last_reply: new Date().toISOString() }
        : t
    ))
    setReply('')
    alert(`Respuesta enviada a ${selectedTicket.tenant}`)
  }

  const handleResolve = (ticket: Ticket) => {
    setTickets(prev => prev.map(t =>
      t.id === ticket.id ? { ...t, status: 'resolved' } : t
    ))
    if (selectedTicket?.id === ticket.id) {
      setSelectedTicket({ ...ticket, status: 'resolved' })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Soporte</h1>
        <p className="text-muted-foreground">Gestión de tickets de soporte de clientes</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { title: 'Tickets Abiertos', value: openCount, icon: LifeBuoy, desc: 'Pendientes de respuesta' },
          { title: 'Urgentes', value: urgentCount, icon: AlertCircle, desc: 'Requieren atención inmediata' },
          { title: 'En proceso', value: tickets.filter(t => t.status === 'in_progress').length, icon: Clock, desc: 'Siendo gestionados' },
          { title: 'Resueltos', value: tickets.filter(t => t.status === 'resolved').length, icon: CheckCircle, desc: 'Últimos 7 días' },
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

      <div className="grid grid-cols-12 gap-6">
        {/* Ticket list */}
        <div className="col-span-12 lg:col-span-5">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tickets</CardTitle>
                <div className="flex gap-1">
                  {(['all', 'open', 'in_progress', 'resolved'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        filter === f
                          ? 'bg-secondary text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {f === 'all' ? 'Todos' : f === 'open' ? 'Abiertos' : f === 'in_progress' ? 'En proceso' : 'Resueltos'}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredTickets.map(ticket => {
                  const statusConf = STATUS_CONFIG[ticket.status]
                  const priorityConf = PRIORITY_CONFIG[ticket.priority]
                  const StatusIcon = statusConf.icon
                  return (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`w-full text-left p-4 hover:bg-secondary/50 transition-colors ${
                        selectedTicket?.id === ticket.id ? 'bg-secondary/70' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{ticket.subject}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{ticket.tenant}</p>
                        </div>
                        <Badge variant={statusConf.variant} className="text-xs flex-shrink-0">
                          {statusConf.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-xs font-medium ${priorityConf.color}`}>
                          {priorityConf.label}
                        </span>
                        <span className="text-xs text-muted-foreground">{ticket.id}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ticket detail */}
        <div className="col-span-12 lg:col-span-7">
          {selectedTicket ? (
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{selectedTicket.subject}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{selectedTicket.tenant} · {selectedTicket.id}</p>
                  </div>
                  <div className="flex gap-2">
                    {selectedTicket.status !== 'resolved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolve(selectedTicket)}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                        Resolver
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Original message */}
                <div className="rounded-lg border p-4 bg-secondary/20">
                  <p className="text-xs text-muted-foreground mb-2">Mensaje original</p>
                  <p className="text-sm">{selectedTicket.message}</p>
                </div>

                {/* Reply area */}
                {selectedTicket.status !== 'resolved' && (
                  <div className="space-y-3">
                    <textarea
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      placeholder="Escribe tu respuesta..."
                      rows={4}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    />
                    <Button
                      size="sm"
                      onClick={handleSendReply}
                      disabled={!reply.trim()}
                    >
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                      Enviar respuesta
                    </Button>
                  </div>
                )}

                {selectedTicket.status === 'resolved' && (
                  <div className="flex items-center gap-2 text-sm text-emerald-600">
                    <CheckCircle className="h-4 w-4" />
                    Este ticket ha sido marcado como resuelto
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-16">
                <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Selecciona un ticket para ver los detalles</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
