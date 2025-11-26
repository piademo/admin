import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { verifyTotpCode, verifyBackupCode } from '@/lib/auth/mfa'
import { logAudit } from '@/lib/auth/platform'

/**
 * POST /api/mfa/verify
 * Verify MFA code during login
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { code, isBackupCode = false } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      )
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get platform user with MFA secret
    const serviceClient = createServiceClient()
    const { data: platformUser, error: userError } = await serviceClient
      .from('platform_users')
      .select('id, email, mfa_enabled, mfa_secret')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !platformUser) {
      return NextResponse.json(
        { error: 'Platform user not found' },
        { status: 404 }
      )
    }

    // Type assertion for platformUser
    const userData = platformUser as { id: string; email: string; mfa_enabled: boolean; mfa_secret: string }

    if (!userData.mfa_enabled || !userData.mfa_secret) {
      return NextResponse.json(
        { error: 'MFA is not enabled' },
        { status: 400 }
      )
    }

    let isValid = false

    // Verify code
    if (isBackupCode) {
      // Verify backup code
      isValid = await verifyBackupCode(userData.id, code)
    } else {
      // Verify TOTP code
      isValid = verifyTotpCode(userData.mfa_secret, code)
    }

    if (!isValid) {
      // Log failed attempt
      await logAudit({
        userId: userData.id,
        action: 'mfa_verify_failed',
        resourceType: 'auth',
        description: `Failed MFA verification attempt${isBackupCode ? ' (backup code)' : ''}`,
        severity: 'warning',
      })

      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Log successful verification
    await logAudit({
      userId: userData.id,
      action: 'mfa_verify_success',
      resourceType: 'auth',
      description: `Successful MFA verification${isBackupCode ? ' (backup code)' : ''}`,
      severity: 'info',
    })

    // Create response with MFA verified cookie
    const response = NextResponse.json({
      success: true,
      message: 'MFA verified successfully',
    })

    // Set MFA verified cookie (expires in 30 days)
    response.cookies.set('mfa_verified', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    return response

  } catch (error) {
    console.error('MFA verify error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
