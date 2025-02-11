import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { refreshSession, supabase } from '@/lib/auth'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial session check
    const checkSession = async () => {
      try {
        const session = await refreshSession()
        setSession(session)
      } catch (error) {
        console.error('Session check failed:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        
        if (event === 'SIGNED_OUT') {
          setSession(null)
        }
      }
    )

    // Set up periodic token refresh (every 4 minutes)
    const refreshInterval = setInterval(async () => {
      const updatedSession = await refreshSession()
      setSession(updatedSession)
    }, 4 * 60 * 1000)

    return () => {
      subscription.unsubscribe()
      clearInterval(refreshInterval)
    }
  }, [])

  return { session, loading }
} 