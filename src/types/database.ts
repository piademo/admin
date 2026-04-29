// ============================================================================
// DATABASE TYPES - Auto-generated from Supabase Schema
// ============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================================================
// PLATFORM ADMIN TYPES
// ============================================================================

export type PlatformUserStatus = 'active' | 'suspended' | 'disabled'

export interface PlatformUser {
  id: string
  auth_user_id: string
  email: string
  full_name: string
  avatar_url: string | null
  
  // MFA
  mfa_enabled: boolean
  mfa_secret: string | null
  mfa_backup_codes: string[] | null
  mfa_configured_at: string | null
  
  // Status
  status: PlatformUserStatus
  last_login_at: string | null
  last_login_ip: string | null
  
  // Timestamps
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface PlatformRole {
  id: string
  name: string
  display_name: string
  description: string | null
  level: number
  created_at: string
  updated_at: string
}

export type RoleName = 'super_admin' | 'admin' | 'support' | 'billing' | 'viewer'

export interface PlatformPermission {
  id: string
  name: string
  display_name: string
  description: string | null
  resource: string
  action: 'read' | 'write' | 'delete' | 'impersonate' | 'export' | 'manage'
  created_at: string
}

export interface UserRole {
  user_id: string
  role_id: string
  created_at: string
  created_by: string | null
}

export interface AdminSession {
  id: string
  user_id: string
  auth_session_id: string
  
  // Device info
  ip_address: string
  user_agent: string | null
  device_type: string | null
  browser: string | null
  os: string | null
  location_country: string | null
  location_city: string | null
  
  // Lifecycle
  started_at: string
  last_activity_at: string
  expires_at: string | null
  ended_at: string | null
  
  // Status
  is_active: boolean
  revoked_at: string | null
  revoked_by: string | null
  revoke_reason: string | null
}

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical'

export interface AuditLog {
  id: string
  
  // Who
  user_id: string | null
  user_email: string
  session_id: string | null
  
  // What
  action: string
  resource_type: string
  resource_id: string | null
  
  // Details
  description: string
  metadata: Json | null
  changes: Json | null
  
  // Context
  ip_address: string
  user_agent: string | null
  
  // Impersonation
  impersonated_tenant_id: string | null
  impersonated_by: string | null
  
  // Timestamp
  created_at: string
  severity: AuditSeverity
}

export interface Impersonation {
  id: string
  
  // Who
  admin_user_id: string
  admin_session_id: string | null
  
  // What
  tenant_id: string
  tenant_name: string
  
  // Why and when
  reason: string
  started_at: string
  ended_at: string | null
  max_duration_minutes: number
  
  // Status
  is_active: boolean
  
  // Context
  ip_address: string
}

export interface RateLimitOverride {
  id: string
  user_id: string | null
  ip_address: string | null
  endpoint_pattern: string
  max_requests: number
  window_seconds: number
  valid_from: string
  valid_until: string | null
  reason: string
  created_by: string
  created_at: string
}

// ============================================================================
// TENANT TYPES (from main platform)
// ============================================================================

export type TenantStatus = 'trial' | 'active' | 'suspended' | 'cancelled' | 'deleted'
export type TenantPlan = 'free' | 'basic' | 'pro' | 'premium' | 'enterprise'

export interface Tenant {
  id: string
  name: string
  slug: string
  email: string
  phone: string | null
  logo_url: string | null
  
  // Plan and billing
  plan: TenantPlan
  billing_state: TenantStatus
  trial_ends_at: string | null
  subscription_id: string | null
  
  // Settings
  timezone: string
  country: string
  locale: string
  
  // Features
  settings: Json
  feature_flags: Json
  
  // Status
  status: TenantStatus
  suspended_reason: string | null
  suspended_at: string | null
  
  // Timestamps
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// ============================================================================
// BOOKING TYPES (from main platform)
// ============================================================================

export type BookingStatus = 'pending' | 'paid' | 'confirmed' | 'cancelled' | 'no_show' | 'completed'
export type BookingChannel = 'web' | 'app' | 'phone' | 'admin' | 'api'

export interface Booking {
  id: string
  tenant_id: string
  
  // Customer
  customer_id: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  
  // Service
  service_id: string
  service_name: string
  staff_id: string
  staff_name: string
  
  // Timing
  starts_at: string
  ends_at: string
  duration_minutes: number
  
  // Status
  status: BookingStatus
  channel: BookingChannel
  
  // Pricing
  service_price_cents: number
  total_amount_cents: number
  currency: string
  
  // Payment
  payment_id: string | null
  payment_intent_id: string | null
  paid_at: string | null
  
  // Notes
  notes: string | null
  admin_notes: string | null
  cancellation_reason: string | null
  
  // Timestamps
  created_at: string
  updated_at: string
  cancelled_at: string | null
  completed_at: string | null
}

// ============================================================================
// SUPPORT TICKET TYPES
// ============================================================================

export type TicketStatus = 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed'
export type TicketPriority = 'P0' | 'P1' | 'P2' | 'P3'
export type TicketChannel = 'email' | 'panel' | 'admin' | 'system' | 'ai'

export interface SupportTicket {
  id: string
  tenant_id: string
  
  // Content
  subject: string
  description: string
  
  // Status
  status: TicketStatus
  priority: TicketPriority
  channel: TicketChannel
  
  // Assignment
  assigned_to: string | null
  created_by: string
  
  // Relations
  booking_id: string | null
  payment_id: string | null
  alert_id: string | null
  user_id: string | null
  
  // SLA
  sla_due_at: string | null
  resolved_at: string | null
  first_response_at: string | null
  
  // Timestamps
  created_at: string
  updated_at: string
}

// ============================================================================
// METRICS & DASHBOARD TYPES
// ============================================================================

export interface DashboardMetrics {
  active_tenants: number
  total_tenants: number
  bookings_today: number
  bookings_7d: number
  bookings_30d: number
  mrr_cents: number
  open_tickets: number
  critical_alerts: number
}

export interface SystemAlert {
  id: string
  type: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  title: string
  message: string
  tenant_id: string | null
  resource_type: string | null
  resource_id: string | null
  acknowledged: boolean
  acknowledged_by: string | null
  acknowledged_at: string | null
  resolved: boolean
  resolved_at: string | null
  created_at: string
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Json
  }
  metadata?: {
    page?: number
    per_page?: number
    total?: number
    has_more?: boolean
  }
}

export interface PaginatedResponse<T> {
  items: T[]
  page: number
  per_page: number
  total: number
  total_pages: number
  has_more: boolean
}
