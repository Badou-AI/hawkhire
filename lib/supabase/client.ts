import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';

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
      'supabase.auth.expires_at',
      'sb-refresh-token',
      'sb-access-token'
    ];
    
    supabaseKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn(`Failed to remove ${key}`);
      }
    });
    
    // Also clear cookies
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=');
      if (name.includes('supabase') || name.includes('sb-')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    });
    
    console.log('[Supabase] Auth state cleared');
    
    // Force reload to clear any in-memory state and redirect to sign-in
    if (window.location.pathname !== '/sign-in') {
      window.location.href = '/sign-in';
    }
  } catch (e) {
    console.error('Failed to clear auth state', e);
  }
};

// Function to check if a JWT token is valid
const isValidJWT = (token: string): boolean => {
  try {
    // Basic structure validation
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Decode the payload
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    if (!payload.exp) return false;
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) return false;
    
    // Check if expiration is too far in the future (more than 1 year)
    // This catches the invalid exp values like 1740936676
    const oneYearFromNow = now + (60 * 60 * 24 * 365);
    if (payload.exp > oneYearFromNow) return false;
    
    return true;
  } catch (e) {
    console.error('Error validating JWT:', e);
    return false;
  }
};

// Function to validate stored tokens and clear if invalid
const validateStoredTokens = () => {
  if (typeof window === 'undefined') return;
  
  try {
    // Check access token
    const accessToken = localStorage.getItem('sb-access-token');
    if (accessToken && !isValidJWT(accessToken)) {
      console.warn('[Supabase] Invalid access token detected, clearing auth state');
      clearAuthState();
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('Error validating stored tokens:', e);
    clearAuthState();
    return false;
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

  // Validate stored tokens before creating/returning client
  validateStoredTokens();

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
        onAuthStateChange: (event, session) => {
          if (event === 'SIGNED_OUT') {
            clearAuthState();
          } else if (event === 'TOKEN_REFRESHED' && session) {
            // Validate the new token
            const accessToken = session.access_token;
            if (accessToken && !isValidJWT(accessToken)) {
              console.warn('[Supabase] Invalid refreshed token detected, signing out');
              browserClient?.auth.signOut().catch(console.error);
            }
          }
        }
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
        clearAuthState(); // Still clear state even if the API call fails
        return { error };
      }
    };
    
    // Override getSession to handle invalid tokens
    const originalGetSession = browserClient.auth.getSession;
    browserClient.auth.getSession = async () => {
      try {
        // Validate tokens before attempting to get session
        if (!validateStoredTokens()) {
          console.warn('[Supabase] Invalid tokens detected, returning null session');
          return { data: { session: null }, error: null };
        }
        
        const result = await originalGetSession.apply(browserClient.auth);
        
        // If we get an error related to JWT, clear auth state
        if (result.error && 
            (result.error.message.includes('JWT') || 
             result.error.message.includes('token'))) {
          console.warn('[Supabase] JWT error in getSession, clearing auth state:', result.error);
          clearAuthState();
          return { data: { session: null }, error: null };
        }
        
        return result;
      } catch (error) {
        console.error('[Supabase] Error in getSession:', error);
        clearAuthState();
        return { data: { session: null }, error: null };
      }
    };
  }

  return browserClient;
};

// Export utility functions
export { clearAuthState, validateStoredTokens, isValidJWT };
