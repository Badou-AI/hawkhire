import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  console.log('Middleware: Processing request to:', request.nextUrl.pathname)
  
  // Debug: Log all cookies and headers
  const cookieNames = Array.from(request.cookies.getAll()).map(cookie => cookie.name)
  console.log('All cookies:', cookieNames)
  console.log('Authorization header:', request.headers.get('authorization'))
  
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
          const cookie = request.cookies.get(name)
          console.log('Middleware: Getting cookie:', name, cookie?.value ? 'exists' : 'not found')
          return cookie?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          console.log('Middleware: Setting cookie:', name, value ? 'with value' : 'empty')
          response.cookies.set({
            name,
            value,
            ...options,
            path: '/',
            sameSite: 'lax'
          })
        },
        remove(name: string, options: CookieOptions) {
          console.log('Middleware: Removing cookie:', name)
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
        autoRefreshToken: true
      }
    }
  )

  try {
    console.log('Middleware: Getting session')
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Middleware: Session error:', error)
      throw error
    }

    // Protected routes check
    if (!session && (
      request.nextUrl.pathname.startsWith('/(protected)') ||
      request.nextUrl.pathname.startsWith('/api/v1')
    )) {
      console.log('Middleware: No session for protected route')
      // API requests return 401
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ 
          error: 'Unauthorized', 
          details: 'No session found',
          cookies: cookieNames,
          hasAuth: !!request.headers.get('authorization')
        }, { status: 401 })
      }
      
      // Other routes redirect to sign-in
      const redirectUrl = new URL('/sign-in', request.url)
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    return response

  } catch (error) {
    console.error('Middleware: Auth error:', error)
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