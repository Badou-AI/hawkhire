import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  console.log('🚀 Middleware running for path:', request.nextUrl.pathname)
  
  // DEV ONLY: Set admin user with full permissions
  if (process.env.NODE_ENV === 'development') {
    console.log('🔑 Setting development auth headers')
    const headers = new Headers(request.headers)
    
    // Set admin user ID
    headers.set('x-user-id', 'd0714948-f2aa-4eb1-9d6d-0fe71c1c6856')
    
    // Set RLS claims for full access
    headers.set('x-role', 'admin')
    headers.set('x-organization-id', '123e4567-e89b-12d3-a456-426614174000') // Your org ID from seed
    
    console.log('✅ Development headers set')
    return NextResponse.next({
      request: {
        headers: headers,
      },
    })
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}