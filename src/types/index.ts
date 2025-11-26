// Platform User (Admin)
export interface PlatformUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'support'
  avatar_url?: string
  created_at: string
  updated_at: string
}

// Tenant
export interface Tenant {
  id: string
  name: string
  domain: string
  logo_url?: string
  status: 'active' | 'inactive' | 'suspended'
  plan: 'free' | 'basic' | 'premium' | 'enterprise'
  mrr: number
  created_at: string
  updated_at: string
}

// Booking
export interface Booking {
  id: string
  tenant_id: string
  customer_name: string
  customer_email: string
  service_name: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  date: string
  time: string
  total_amount: number
  created_at: string
  updated_at: string
}

// Ticket
export interface Ticket {
  id: string
  tenant_id: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to?: string
  created_by: string
  created_at: string
  updated_at: string
}

// Metrics
export interface DashboardMetrics {
  active_tenants: number
  bookings_today: number
  open_tickets: number
  mrr: number
}
