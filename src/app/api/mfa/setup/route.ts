import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentPlatformUser } from '@/lib/auth/platform'
import { generateMfaSecret, verifyTotpCode, enableMfa } from '@/lib/auth/mfa'

/**
 * POST /api/mfa/setup
 * Generate MFA secret and QR code
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get platform user
    const platformUser = await getCurrentPlatformUser()
    
    if (!platformUser) {
      return NextResponse.json(
        { error: 'Platform user not found' },
        { status: 404 }
      )
    }

    // Check if MFA is already enabled
    if (platformUser.mfa_enabled) {
      return NextResponse.json(
        { error: 'MFA is already enabled' },
        { status: 400 }
      )
    }

    // Generate MFA secret and codes
    const { secret, qrCodeUrl, backupCodes } = await generateMfaSecret(
      platformUser.email,
      platformUser.full_name
    )

    // Store secret in session (temporary)
    // In production, you might want to use encrypted session storage
    
    return NextResponse.json({
      success: true,
      data: {
        secret,
        qrCodeUrl,
        backupCodes,
      },
    })

  } catch (error) {
    console.error('MFA setup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/mfa/setup
 * Verify and enable MFA
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { secret, code, backupCodes } = body

    if (!secret || !code || !backupCodes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Get platform user
    const platformUser = await getCurrentPlatformUser()
    
    if (!platformUser) {
      return NextResponse.json(
        { error: 'Platform user not found' },
        { status: 404 }
      )
    }

    // Verify TOTP code
    const isValid = verifyTotpCode(secret, code)
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Enable MFA
    await enableMfa(platformUser.id, secret, backupCodes)

    return NextResponse.json({
      success: true,
      message: 'MFA enabled successfully',
    })

  } catch (error) {
    console.error('MFA enable error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
