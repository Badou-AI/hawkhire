import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
            path: '/',
            sameSite: 'lax'
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
            path: '/',
            maxAge: 0,
            sameSite: 'lax'
          })
        },
      },
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: false // Disable auto refresh to prevent excessive requests
      }
    }
  )

  try {
    // Only check session for protected routes
    if (
      request.nextUrl.pathname.startsWith('/(protected)') ||
      request.nextUrl.pathname.startsWith('/api/v1')
    ) {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        // API requests return 401
        if (request.nextUrl.pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        // Other routes redirect to sign-in
        const redirectUrl = new URL('/sign-in', request.url)
        redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }
    }

    return response

  } catch (error) {
    // On auth error, clear session and redirect to sign-in
    response.cookies.set({
      name: 'sb-auth-token',
      value: '',
      maxAge: 0,
      path: '/',
      sameSite: 'lax'
    })
    
    const redirectUrl = new URL('/sign-in', request.url)
    redirectUrl.searchParams.set('error', 'auth')
    return NextResponse.redirect(redirectUrl)
  }
}

export const config = {
  matcher: [
    '/(protected)/:path*',
    '/api/v1/:path*',
    '/sign-in',
    '/sign-up',
    '/auth/callback',
  ],
} 