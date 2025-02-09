import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

// Create a single instance
const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'supabase-auth-token',
      autoRefreshToken: true,
      debug: process.env.NODE_ENV === 'development'
    },
    global: {
      headers: {
        'X-Supabase-Host': '127.0.0.1'
      }
    }
  }
)

// Export the singleton instance
export const createClient = () => supabase
