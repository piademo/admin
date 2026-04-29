/**
 * Platform Admin Authentication Utilities
 * 
 * Handles authentication specific to platform administrators
 * Isolated from tenant user authentication
 */

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { PlatformUser, PlatformRole, PlatformPermission } from '@/types/database'

/**
 * Get current platform admin user from session
 */
export async function getCurrentPlatformUser(): Promise<PlatformUser | null> {
  const supabase = await createClient()
  
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !authUser) {
    return null
  }
  
  // Get platform user details using service client
  const serviceClient = createServiceClient()
  
  const { data: platformUser, error } = await serviceClient
    .from('platform_users')
    .select('*')
    .eq('auth_user_id', authUser.id)
    .eq('status', 'active')
    .single()
  
  if (error || !platformUser) {
    return null
  }
  
  return platformUser as PlatformUser
}

/**
 * Get platform user roles
 */
export async function getUserRoles(userId: string): Promise<PlatformRole[]> {
  const serviceClient = createServiceClient()
  
  const { data, error } = await serviceClient
    .from('user_roles')
    .select(`
      role:platform_roles(*)
    `)
    .eq('user_id', userId)
  
  if (error || !data) {
    return []
  }

  // data can be typed as 'any' coming from Supabase; normalize here
  const rows: any[] = data as any[]
  return rows.map(item => item.role).filter(Boolean) as PlatformRole[]
}

/**
 * Get platform user permissions
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  const serviceClient = createServiceClient()
  
  const { data, error } = await serviceClient
    .rpc('get_user_permissions', { check_user_id: userId } as any)
  
  if (error || !data) {
    return []
  }

  const rows: any[] = data as any[]
  return rows.map((row: { permission_name: string }) => row.permission_name)
}

/**
 * Check if user has specific permission
 */
export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId)
  return permissions.includes(permission)
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId)
  return permissions.some(p => userPermissions.includes(p))
}

/**
 * Check if user has all of the specified permissions
 */
export async function hasAllPermissions(userId: string, permissions: string[]): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId)
  return permissions.every(p => userPermissions.includes(p))
}

/**
 * Verify platform admin status
 */
export async function verifyPlatformAdmin(authUserId: string): Promise<boolean> {
  const serviceClient = createServiceClient()
  
  const { data, error } = await serviceClient
    .rpc('is_platform_admin', { check_user_id: authUserId } as any)
  
  if (error) {
    return false
  }
  
  return data === true
}

/**
 * Log audit event
 */
export async function logAudit(params: {
  userId: string
  action: string
  resourceType: string
  description: string
  resourceId?: string
  metadata?: Record<string, unknown>
  changes?: Record<string, unknown>
  ipAddress?: string
  severity?: 'info' | 'warning' | 'error' | 'critical'
}): Promise<void> {
  const serviceClient = createServiceClient()
  
  await serviceClient.rpc('log_audit', {
    p_user_id: params.userId,
    p_action: params.action,
    p_resource_type: params.resourceType,
    p_description: params.description,
    p_resource_id: params.resourceId || null,
    p_metadata: params.metadata || null,
    p_changes: params.changes || null,
    p_ip_address: params.ipAddress || null,
    p_severity: params.severity || 'info',
  } as any)
}

/**
 * Get user's active sessions
 */
export async function getUserActiveSessions(userId: string) {
  const serviceClient = createServiceClient()
  
  const { data, error } = await (serviceClient
    .from('admin_sessions') as any)
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('started_at', { ascending: false })

  if (error) {
    throw error
  }

  return data as any[]
}

/**
 * Revoke a specific session
 */
export async function revokeSession(sessionId: string, revokedBy: string, reason: string) {
  const serviceClient = createServiceClient()
  
  const { error } = await (serviceClient
    .from('admin_sessions') as any)
    .update({
      is_active: false,
      ended_at: new Date().toISOString(),
      revoked_at: new Date().toISOString(),
      revoked_by: revokedBy,
      revoke_reason: reason,
    })
    .eq('id', sessionId)
  
  if (error) {
    throw error
  }
  
  // Log audit event
  await logAudit({
    userId: revokedBy,
    action: 'revoke_session',
    resourceType: 'admin_session',
    resourceId: sessionId,
    description: `Session revoked: ${reason}`,
    severity: 'warning',
  })
}

/**
 * Revoke all user sessions except current
 */
export async function revokeAllSessions(userId: string, currentSessionId: string, revokedBy: string) {
  const serviceClient = createServiceClient()
  
  const { error } = await (serviceClient
    .from('admin_sessions') as any)
    .update({
      is_active: false,
      ended_at: new Date().toISOString(),
      revoked_at: new Date().toISOString(),
      revoked_by: revokedBy,
      revoke_reason: 'User requested logout from all devices',
    })
    .eq('user_id', userId)
    .eq('is_active', true)
    .neq('id', currentSessionId)
  
  if (error) {
    throw error
  }
  
  // Log audit event
  await logAudit({
    userId: revokedBy,
    action: 'revoke_all_sessions',
    resourceType: 'admin_session',
    description: 'All user sessions revoked',
    severity: 'warning',
  })
}

/**
 * Start impersonation session
 */
export async function startImpersonation(params: {
  adminUserId: string
  tenantId: string
  tenantName: string
  reason: string
  ipAddress: string
  sessionId?: string
}): Promise<string> {
  const serviceClient = createServiceClient()
  
  // Create impersonation record
  const { data, error } = await (serviceClient
    .from('impersonations') as any)
    .insert({
      admin_user_id: params.adminUserId,
      admin_session_id: params.sessionId,
      tenant_id: params.tenantId,
      tenant_name: params.tenantName,
      reason: params.reason,
      ip_address: params.ipAddress,
      is_active: true,
    })
    .select('id')
    .single()
  
  if (error || !data) {
    throw new Error('Failed to start impersonation')
  }
  
  // Log audit event
  await logAudit({
    userId: params.adminUserId,
    action: 'impersonate_start',
    resourceType: 'tenant',
    resourceId: params.tenantId,
    description: `Started impersonating tenant: ${params.tenantName}`,
    metadata: {
      reason: params.reason,
      impersonation_id: data.id,
    },
    severity: 'warning',
  })
  
  return data.id
}

/**
 * End impersonation session
 */
export async function endImpersonation(impersonationId: string, adminUserId: string) {
  const serviceClient = createServiceClient()
  
  const { error } = await (serviceClient
    .from('impersonations') as any)
    .update({
      is_active: false,
      ended_at: new Date().toISOString(),
    })
    .eq('id', impersonationId)
  
  if (error) {
    throw error
  }
  
  // Log audit event
  await logAudit({
    userId: adminUserId,
    action: 'impersonate_end',
    resourceType: 'impersonation',
    resourceId: impersonationId,
    description: 'Ended impersonation session',
    severity: 'info',
  })
}

/**
 * Get active impersonation for admin user
 */
export async function getActiveImpersonation(adminUserId: string) {
  const serviceClient = createServiceClient()

  const { data, error } = await (serviceClient
    .from('impersonations') as any)
    .select('*')
    .eq('admin_user_id', adminUserId)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return null
  }

  // Check if expired
  const startedAt = new Date(data.started_at)
  const maxDuration = data.max_duration_minutes * 60 * 1000
  const expiresAt = new Date(startedAt.getTime() + maxDuration)

  if (new Date() > expiresAt) {
    // Auto-expire
    await endImpersonation(data.id, adminUserId)
    return null
  }

  return data
}

/**
 * 