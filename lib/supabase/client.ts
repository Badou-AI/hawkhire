import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return ''
          const cookie = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
          return cookie ? cookie.split('=')[1] : ''
        },
        set(name: string, value: string, options: { path?: string; maxAge?: number }) {
          if (typeof document === 'undefined') return
          document.cookie = `${name}=${value}; path=${options.path || '/'}; max-age=${options.maxAge || 60 * 60 * 24 * 7}`
        },
        remove(name: string, options?: { path?: string }) {
          if (typeof document === 'undefined') return
          document.cookie = `${name}=; path=${options?.path || '/'}; max-age=0`
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
}
