import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Admin Panel Middleware
 * 
 * Protects routes and validates platform admin authentication
 * Separate from tenant user authentication
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get the authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public routes that don't require authentication
  const publicRoutes = ['/login']
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // If user is not signed in and trying to access protected routes
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // If user is signed in
  if (user) {
    // Verify this is a platform admin user (not a tenant user)
    // This check is done via RLS on platform.platform_users table
    const { data: platformUser, error } = await supabase
      .from('platform_users')
      .select('id, status, mfa_enabled')
      .eq('auth_user_id', user.id)
      .eq('status', 'active')
      .single()

    // If not a platform admin or error, log out and redirect to login
    if (error || !platformUser) {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(url)
    }

    // Check MFA requirement
    const mfaVerified = request.cookies.get('mfa_verified')?.value === 'true'
    
    // If MFA is enabled but not verified, redirect to MFA verification
    if (platformUser.mfa_enabled && !mfaVerified && !request.nextUrl.pathname.startsWith('/mfa')) {
      const url = request.nextUrl.clone()
      url.pathname = '/mfa/verify'
      return NextResponse.redirect(url)
    }

    // If user is trying to access login page while authenticated
    if (isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
