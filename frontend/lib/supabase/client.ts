import { createBrowserClient } from '@supabase/ssr';
import { createClient as createServerClient } from './server';
import { Database } from '@/types/supabase';
import { AuthError, Session } from '@supabase/supabase-js';

// Singleton instance
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

// Update cookie options to be more secure
const COOKIE_OPTIONS = {
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7 // 7 days
};

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
      } catch {
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

// Add a timeout to the token validation process
// const validateStoredTokensWithTimeout = async () => {
//   return new Promise((resolve) => {
//     const timeoutId = setTimeout(() => {
//       console.warn('[Supabase] Token validation timed out');
//       resolve(false);
//     }, 5000); // 5-second timeout

//     validateStoredTokens().then((result) => {
//       clearTimeout(timeoutId);
//       resolve(result);
//     });
//   });
// };

export const createClient = () => {
  if (typeof window === 'undefined') {
    return createServerClient();
  }

  // Validate stored tokens before returning existing client
  if (browserClient) {
    if (validateStoredTokens()) {
      return browserClient;
    }
    // If validation fails, clear the existing client
    browserClient = null;
  }

  console.log('[Supabase] Creating new client instance');
  
  browserClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          try {
            const value = document.cookie
              .split('; ')
              .find((row) => row.startsWith(`${name}=`))
              ?.split('=')[1];
            console.log(`[Supabase] Getting cookie ${name}:`, value);
            return value || '';
          } catch (e) {
            console.error(`[Supabase] Error getting cookie ${name}:`, e);
            return '';
          }
        },
        set(name: string, value: string, options: { path?: string; maxAge?: number }) {
          try {
            const cookieString = `${name}=${value}; ${Object.entries({
              ...COOKIE_OPTIONS,
              ...options
            }).map(([k, v]) => `${k}=${v}`).join('; ')}`;
            document.cookie = cookieString;
            console.log(`[Supabase] Set cookie ${name}`);
          } catch (e) {
            console.error(`[Supabase] Error setting cookie ${name}:`, e);
          }
        },
        remove(name: string, options?: { path?: string }) {
          try {
            const cookieString = `${name}=; ${Object.entries({
              ...COOKIE_OPTIONS,
              ...options,
              maxAge: 0,
              expires: new Date(0).toUTCString()
            }).map(([k, v]) => `${k}=${v}`).join('; ')}`;
            document.cookie = cookieString;
            console.log(`[Supabase] Removed cookie ${name}`);
          } catch (e) {
            console.error(`[Supabase] Error removing cookie ${name}:`, e);
          }
        },
      },
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: false,
        storage: {
          getItem: (key) => {
            try {
              const value = localStorage.getItem(key);
              console.log(`[Supabase] Getting storage item ${key}:`, value ? 'exists' : 'null');
              return value;
            } catch (e) {
              console.error(`[Supabase] Error getting storage item ${key}:`, e);
              return null;
            }
          },
          setItem: (key, value) => {
            try {
              localStorage.setItem(key, value);
              console.log(`[Supabase] Set storage item ${key}`);
            } catch (e) {
              console.error(`[Supabase] Error setting storage item ${key}:`, e);
            }
          },
          removeItem: (key) => {
            try {
              localStorage.removeItem(key);
              console.log(`[Supabase] Removed storage item ${key}`);
            } catch (e) {
              console.error(`[Supabase] Error removing storage item ${key}:`, e);
            }
          }
        }
      },
    }
  );

  // Add event listeners after client creation
  browserClient.auth.onAuthStateChange((event: string, session: Session | null) => {
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
  });

  // Add signOut override to properly clean up state
  if (browserClient) {
    const originalSignOut = browserClient.auth.signOut;
    browserClient.auth.signOut = async (...args) => {
      try {
        if (!browserClient) {
          return { error: new Error('Browser client is null') as AuthError };
        }
        const result = await originalSignOut.apply(browserClient.auth, args);
        clearAuthState();
        return result;
      } catch (error) {
        console.error('[Supabase] Sign out error:', error);
        clearAuthState(); // Still clear state even if the API call fails
        return { error: error as AuthError };
      }
    };
    
    // Add getSession override to validate tokens
    const originalGetSession = browserClient.auth.getSession;
    browserClient.auth.getSession = async () => {
      try {
        // Validate tokens before attempting to get session
        if (!validateStoredTokens()) {
          console.warn('[Supabase] Invalid tokens detected, returning null session');
          return { data: { session: null }, error: null };
        }
        
        if (!browserClient) {
          return { data: { session: null }, error: new Error('Browser client is null') as AuthError };
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
