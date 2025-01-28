import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import { CookieOptions } from '@supabase/ssr'

export const createClient = () => {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = cookies()
          return cookieStore.get(name)?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          const cookieStore = cookies()
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error: unknown) {
            console.error('Error setting cookie:', error)
          }
        },
        async remove(name: string, options: CookieOptions) {
          const cookieStore = cookies()
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error: unknown) {
            console.error('Error removing cookie:', error)
          }
        },
      },
    }
  )
} 