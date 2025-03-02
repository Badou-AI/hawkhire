'use client'

import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Add a function to handle session refresh
  const refreshSession = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        console.error('[useAuth] Session refresh error:', result.error)
        
        if (result.invalidToken) {
          // Handle invalid token by signing out
          await supabase.auth.signOut()
          router.push('/sign-in')
          return false
        }
        
        setLoading(false)
        return false
      }
      
      // Update session if available
      if (result.user) {
        const { data } = await supabase.auth.getSession()
        setSession(data.session)
      }
      
      setLoading(false)
      return true
    } catch (error) {
      console.error('[useAuth] Unexpected error during session refresh:', error)
      setLoading(false)
      return false
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
        
        // Handle token errors
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.warn('[useAuth] Token refresh failed, attempting to recover')
          refreshSession().catch(console.error)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { session, loading, refreshSession }
} 