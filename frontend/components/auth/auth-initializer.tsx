'use client'

import { useEffect } from 'react'
import { initAuth } from '@/lib/auth'

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAuth()
  }, [])

  return children
} 