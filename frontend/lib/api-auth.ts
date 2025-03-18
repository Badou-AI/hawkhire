import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// TODO: Revisit cookie handling when upgrading Next.js/Supabase
// Current implementation works but has type mismatches with Next.js 15 cookies API
// For now, we're keeping this implementation as it's functionally working with auth
export async function verifyAuth() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies()
          const cookie = cookieStore.get(name)
          return cookie?.value ?? ''
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        set(_name: string, _value: string, _options: CookieOptions) {
          // Cookie setting is handled by middleware
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        remove(_name: string, _options: CookieOptions) {
          // Cookie removal is handled by middleware
        },
      },
    }
  )

  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      console.error('Session error:', error)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return { supabase, session }
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 