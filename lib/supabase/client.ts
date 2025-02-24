import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export const createClient = () => {
  if (typeof window === 'undefined') {
    // Return a dummy client for SSR that will be replaced on the client side
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: { session: null }, error: null }),
      },
    } as ReturnType<typeof createBrowserClient<Database>>;
  }

  if (!browserClient) {
    console.log('[Supabase] Creating new client instance');
    browserClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              const cookie = document.cookie
                .split('; ')
                .find((row) => row.startsWith(`${name}=`))
              return cookie ? cookie.split('=')[1] : ''
            } catch {
              return ''
            }
          },
          set(name: string, value: string, options: { path?: string; maxAge?: number }) {
            try {
              document.cookie = `${name}=${value}; path=${options.path || '/'}; max-age=${options.maxAge || 60 * 60 * 24 * 7}`
            } catch {
              console.warn('Failed to set cookie')
            }
          },
          remove(name: string, options?: { path?: string }) {
            try {
              document.cookie = `${name}=; path=${options?.path || '/'}; max-age=0`
            } catch {
              console.warn('Failed to remove cookie')
            }
          },
        },
        auth: {
          flowType: 'pkce',
          detectSessionInUrl: true,
          persistSession: true,
          autoRefreshToken: true,
          storage: {
            getItem: (key) => {
              try {
                return localStorage.getItem(key)
              } catch {
                return null
              }
            },
            setItem: (key, value) => {
              try {
                localStorage.setItem(key, value)
              } catch {
                console.warn('Failed to set localStorage item')
              }
            },
            removeItem: (key) => {
              try {
                localStorage.removeItem(key)
              } catch {
                console.warn('Failed to remove localStorage item')
              }
            },
          },
          onAuthStateChange: (event) => {
            console.log(`[Supabase] Auth state change: ${event}`);
          },
        },
        global: {
          headers: {
            'X-Client-Info': 'supabase-js/2.x',
          },
          retryConfig: {
            maxRetries: 3,
            retryDelay: (retryCount) => {
              const baseDelay = 1000
              const maxDelay = 30000
              return Math.min(baseDelay * Math.pow(2, retryCount), maxDelay)
            },
            retryCondition: (error: any) => {
              if (error?.status === 429) return false
              return !error.status || (error.status >= 500 && error.status <= 599)
            },
          },
        },
      }
    );

    // Add development logging
    if (process.env.NODE_ENV === 'development') {
      const originalPost = browserClient.auth.signInWithPassword;
      browserClient.auth.signInWithPassword = async (...args) => {
        console.log('[Supabase] Attempting sign in', {
          timestamp: new Date().toISOString(),
        });
        return originalPost.apply(browserClient.auth, args);
      };
    }
  } else {
    console.log('[Supabase] Reusing existing client instance');
  }

  return browserClient;
}
