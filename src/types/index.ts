// Re-export all database types
export * from './database'

// ============================================================================
// EXTENDED UI TYPES
// ============================================================================

export interface SessionWithUser {
  user: {
    id: string
    email: string
    full_name: string
    avatar_url: string | null
    roles: string[]
    permissions: string[]
    mfa_enabled: boolean
  }
  session: {
    id: string
    expires_at: string
  }
}

export interface ImpersonationContext {
  is_impersonating: boolean
  admin_user_id?: string
  admin_email?: string
  tenant_id?: string
  tenant_name?: string
  impersonation_id?: string
  started_at?: string
  expires_at?: string
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface LoginFormData {
  email: string
  password: string
}

export interface MfaSetupData {
  secret: string
  qr_code_url: string
  backup_codes: string[]
}

export interface MfaVerifyData {
  code: string
}

export interface TenantFormData {
  name: string
  slug: string
  email: string
  phone?: string
  country: string
  timezone: string
  plan: string
}

export interface BookingFilterData {
  tenant_id?: string
  status?: string
  channel?: string
  date_from?: string
  date_to?: string
  search?: string
}

export interface TicketFormData {
  tenant_id: string
  subject: string
  description: string
  priority: string
  booking_id?: string
  user_id?: string
}
