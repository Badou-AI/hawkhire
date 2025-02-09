import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
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
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          })
        },
      },
    }
  )

  try {
    // Refresh session if expired - required for Server Components
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      throw error
    }

    // Protected routes check
    if (!session && (
      request.nextUrl.pathname.startsWith('/(protected)') ||
      request.nextUrl.pathname.startsWith('/api/v1')
    )) {
      // API requests return 401
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      // Other routes redirect to sign-in
      const redirectUrl = new URL('/sign-in', request.url)
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Redirect signed-in users away from auth pages
    if (session && (
      request.nextUrl.pathname.startsWith('/sign-in') ||
      request.nextUrl.pathname.startsWith('/sign-up')
    )) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    return response

  } catch (error) {
    // On auth error, clear session and redirect to sign-in
    response.cookies.set({
      name: 'supabase-auth-token',
      value: '',
      maxAge: 0,
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