import { createServerClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';

const COOKIE_OPTIONS = {
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7 // 7 days
};

export const createClient = () => {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
            ?.split('=')[1] || '';
        },
        set(name: string, value: string, options: { path?: string; maxAge?: number }) {
          document.cookie = `${name}=${value}; ${Object.entries({
            ...COOKIE_OPTIONS,
            ...options
          }).map(([k, v]) => `${k}=${v}`).join('; ')}`;
        },
        remove(name: string, options?: { path?: string }) {
          document.cookie = `${name}=; ${Object.entries({
            ...COOKIE_OPTIONS,
            ...options,
            maxAge: 0
          }).map(([k, v]) => `${k}=${v}`).join('; ')}`;
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
              const value = localStorage.getItem(key);
              // Add validation for auth-related items
              if (key.includes('auth.') && value) {
                try {
                  const parsed = JSON.parse(value);
                  if (parsed.expires_at && new Date(parsed.expires_at) < new Date()) {
                    localStorage.removeItem(key);
                    return null;
                   }
                } catch {}
              }
              return value;
            } catch {
              return null;
            }
          },
          setItem: (key, value) => {
            try {
              localStorage.setItem(key, value);
            } catch (e) {
              console.error('[Supabase] Error setting storage item:', e);
            }
          },
          removeItem: (key) => {
            try {
              localStorage.removeItem(key);
            } catch (e) {
              console.error('[Supabase] Error removing storage item:', e);
            }
          }
        }
      },
    }
  );
}

// Add runtime directive for edge compatibility
export const runtime = 'edge' 