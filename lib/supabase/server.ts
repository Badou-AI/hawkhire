import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export const createClient = () => {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          try {
            const cookieStore = await cookies()
            const cookie = cookieStore.get(name)
            return cookie?.value ?? ''
          } catch {
            return ''
          }
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            const cookieStore = await cookies()
            cookieStore.set({
              name,
              value,
              ...options,
              path: '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production'
            })
          } catch {
            // Silently handle cookie errors in non-Route Handler contexts
            return
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            const cookieStore = await cookies()
            cookieStore.delete({
              name,
              path: '/',
              ...options
            })
          } catch {
            // Silently handle cookie errors in non-Route Handler contexts
            return
          }
        },
      },
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true
      },
      global: {
        headers: {
          'X-Supabase-Host': '127.0.0.1'
        }
      }
    }
  )
}

// Add runtime directive for edge compatibility
export const runtime = 'edge' 