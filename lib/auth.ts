import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(_name: string) {
        return undefined // Let Supabase handle HTTP-only cookies
      },
      set(_name: string, _value: string) {
        // Let Supabase handle HTTP-only cookies
      },
      remove(_name: string) {
        // Let Supabase handle HTTP-only cookies
      },
    },
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: false // Prevent excessive requests in middleware
    }
  }
)

// Initialize auth state listener
export const initAuth = () => {
  return supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      window.location.href = '/sign-in'
    }
  })
}

export { supabase } 