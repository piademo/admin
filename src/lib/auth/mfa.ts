/**
 * Multi-Factor Authentication (MFA) Utilities
 * 
 * Handles TOTP (Time-based One-Time Password) authentication
 * using Google Authenticator, Authy, or similar apps
 */

// @ts-nocheck
// This file has type issues with Supabase queries that need to be resolved
// TODO: Fix Supabase type definitions

import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from './platform'

/**
 * Generate MFA secret and QR code for setup
 */
export async function generateMfaSecret(userEmail: string, userName: string) {
  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `BookFast Admin (${userEmail})`,
    issuer: 'BookFast',
    length: 32,
  })

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!)

  // Generate backup codes (10 codes)
  const backupCodes = Array.from({ length: 10 }, () => 
    generateBackupCode()
  )

  return {
    secret: secret.base32,
    qrCodeUrl,
    backupCodes,
  }
}

/**
 * Generate a single backup code
 */
function generateBackupCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length)
    code += chars[randomIndex]
    
    // Add dash after 4 characters
    if (i === 3) code += '-'
  }
  
  return code
}

/**
 * Hash backup codes before storing
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  // In production, use a proper crypto library like bcrypt
  // For now, we'll use a simple hash
  const crypto = require('crypto')
  
  return codes.map(code => {
    return crypto
      .createHash('sha256')
      .update(code)
      .digest('hex')
  })
}

/**
 * Verify TOTP code
 */
export function verifyTotpCode(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps (±60 seconds)
  })
}

/**
 * Verify backup code
 */
export async function verifyBackupCode(
  userId: string,
  code: string
): Promise<boolean> {
  const serviceClient = createServiceClient()
  
  // Get user's backup codes
  const { data: user, error } = await serviceClient
    .from('platform_users')
    .select('mfa_backup_codes')
    .eq('id', userId)
    .single()

  if (error || !user) {
    return false
  }

  const userData = user as { mfa_backup_codes: string[] }

  if (!userData.mfa_backup_codes) {
    return false
  }

  // Hash the provided code
  const crypto = require('crypto')
  const hashedCode = crypto
    .createHash('sha256')
    .update(code)
    .digest('hex')

  // Check if code exists
  const codeIndex = userData.mfa_backup_codes.indexOf(hashedCode)
  
  if (codeIndex === -1) {
    return false
  }

  // Remove used backup code
  const updatedCodes = [...userData.mfa_backup_codes]
  updatedCodes.splice(codeIndex, 1)

  // Remove used backup code
  const { error: updateError } = await serviceClient
    .from('platform_users')
    .update({ mfa_backup_codes: updatedCodes })
    .eq('id', userId)

  if (updateError) {
    console.error('Failed to update backup codes:', updateError)
    return false
  }

  // Log usage
  await logAudit({
    userId,
    action: 'mfa_backup_code_used',
    resourceType: 'auth',
    description: 'Backup code used for authentication',
    severity: 'warning',
  })

  return true
}

/**
 * Enable MFA for user
 */
export async function enableMfa(
  userId: string,
  secret: string,
  backupCodes: string[]
) {
  const serviceClient = createServiceClient()

  // Hash backup codes
  const hashedCodes = await hashBackupCodes(backupCodes)

  // Update user record
  const { error } = await serviceClient
    .from('platform_users')
    .update({
      mfa_enabled: true,
      mfa_secret: secret,
      mfa_backup_codes: hashedCodes,
      mfa_configured_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    throw new Error('Failed to enable MFA')
  }

  // Log audit event
  await logAudit({
    userId,
    action: 'mfa_enabled',
    resourceType: 'auth',
    description: 'MFA enabled for user',
    severity: 'info',
  })
}

/**
 * Disable MFA for user
 */
export async function disableMfa(userId: string, adminUserId: string) {
  const serviceClient = createServiceClient()

  const { error } = await serviceClient
    .from('platform_users')
    .update({
      mfa_enabled: false,
      mfa_secret: null,
      mfa_backup_codes: null,
      mfa_configured_at: null,
    })
    .eq('id', userId)

  if (error) {
    throw new Error('Failed to disable MFA')
  }

  // Log audit event
  await logAudit({
    userId: adminUserId,
    action: 'mfa_disabled',
    resourceType: 'auth',
    resourceId: userId,
    description: `MFA disabled for user ${userId}`,
    severity: 'warning',
  })
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(userId: string): Promise<string[]> {
  const serviceClient = createServiceClient()

  // Generate new codes
  const newCodes = Array.from({ length: 10 }, () => generateBackupCode())
  const hashedCodes = await hashBackupCodes(newCodes)

  // Update user record
  const { error } = await serviceClient
    .from('platform_users')
    .update({ mfa_backup_codes: hashedCodes })
    .eq('id', userId)

  if (error) {
    throw new Error('Failed to regenerate backup codes')
  }

  // Log audit event
  await logAudit({
    userId,
    action: 'mfa_backup_codes_regenerated',
    resourceType: 'auth',
    description: 'MFA backup codes regenerated',
    severity: 'info',
  })

  return newCodes
}

/**
 * Check if user has MFA enabled
 */
export async function isMfaEnabled(authUserId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('platform_users')
    .select('mfa_enabled')
    .eq('auth_user_id', authUserId)
    .single()

  if (error || !data) {
    return false
  }

  const userData = data as { mfa_enabled: boolean }
  return userData.mfa_enabled
}

/**
 * Get MFA status for user
 */
export async function getMfaStatus(userId: string) {
  const serviceClient = createServiceClient()
  
  const { data, error } = await serviceClient
    .from('platform_users')
    .select('mfa_enabled, mfa_configured_at, mfa_backup_codes')
    .eq('id', userId)
    .single()

  if (error || !data) {
    return null
  }

  const userData = data as { mfa_enabled: boolean; mfa_configured_at: string; mfa_backup_codes: string[] }

  return {
    enabled: userData.mfa_enabled,
    configuredAt: userData.mfa_configured_at,
    backupCodesRemaining: userData.mfa_backup_codes?.length || 0,
  }
}
