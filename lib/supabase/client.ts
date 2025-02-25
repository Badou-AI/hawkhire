import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'
import { toast } from 'sonner'

// Singleton instance
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

// Simple function to clear auth state
const clearAuthState = () => {
  if (typeof window === 'undefined') return;
  
  try {
    // Clear Supabase session data
    const supabaseKeys = [
      'supabase.auth.token',
      'supabase.auth.refreshToken',
      'supabase.auth.user',
      'supabase.auth.expires_at'
    ];
    
    supabaseKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn(`Failed to remove ${key}`);
      }
    });
    
    console.log('[Supabase] Auth state cleared');
  } catch (e) {
    console.error('Failed to clear auth state', e);
  }
};

export const createClient = () => {
  if (typeof window === 'undefined') {
    // Return a dummy client for SSR
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: { session: null }, error: null }),
      },
    } as ReturnType<typeof createBrowserClient<Database>>;
  }

  // Return existing client if already initialized
  if (browserClient) {
    return browserClient;
  }

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
      },
    }
  );

  // Add signOut override to properly clean up state
  if (browserClient) {
    const originalSignOut = browserClient.auth.signOut;
    browserClient.auth.signOut = async (...args) => {
      try {
        const result = await originalSignOut.apply(browserClient.auth, args);
        clearAuthState();
        return result;
      } catch (error) {
        console.error('[Supabase] Sign out error:', error);
        return { error };
      }
    };
  }

  return browserClient;
};

// Export utility functions
export { clearAuthState };
