'use client'

import { useEffect, useState } from 'react'
import { initAuth, supabase } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const initialize = async () => {
      try {
        // Check if we have a session
        const { data: { session } } = await supabase.auth.getSession()
        
        // If no session and we're not on auth pages, redirect
        if (!session && 
            !window.location.pathname.startsWith('/sign-in') && 
            !window.location.pathname.startsWith('/sign-up')) {
          router.push('/sign-in')
          return
        }

        // Initialize auth state listener
        initAuth()
        setIsInitialized(true)
      } catch (e) {
        console.error('Failed to initialize auth:', e)
        router.push('/sign-in?error=init_failed')
      }
    }

    initialize()
  }, [router])

  if (!isInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return children
} 