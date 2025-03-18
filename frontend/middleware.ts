import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

// Function to validate JWT token structure and expiration
function isValidJWT(token: string): boolean {
  try {
    // Basic structure check
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Decode the payload
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Check expiration
    if (!payload.exp) return false;
    
    // Ensure exp is a valid timestamp (not in the past and not too far in the future)
    const now = Math.floor(Date.now() / 1000);
    const maxFutureTime = now + (60 * 60 * 24 * 365); // 1 year in the future
    
    return payload.exp > now && payload.exp < maxFutureTime;
  } catch (error) {
    console.error('[Middleware] JWT validation error:', error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  // Create a Supabase client configured to use cookies
  const { supabase, response } = createClient(request)

  // Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Check for protected routes
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/(protected)') ||
                           request.nextUrl.pathname.startsWith('/app') ||
                           request.nextUrl.pathname.startsWith('/dashboard')

  // Check for auth routes
  const isAuthRoute = request.nextUrl.pathname.startsWith('/sign-in') ||
                      request.nextUrl.pathname.startsWith('/sign-up') ||
                      request.nextUrl.pathname.startsWith('/(auth)')

  // If accessing a protected route without a session, redirect to sign-in
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/sign-in', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If we have a session with an access token, validate it
  if (session?.access_token && !isValidJWT(session.access_token)) {
    console.error('[Middleware] Invalid JWT token detected')
    
    // Clear the session and redirect to sign-in
    await supabase.auth.signOut()
    
    const redirectUrl = new URL('/sign-in', request.url)
    redirectUrl.searchParams.set('error', 'invalid_token')
    return NextResponse.redirect(redirectUrl)
  }

  // If accessing auth routes with a valid session, redirect to dashboard
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
} 