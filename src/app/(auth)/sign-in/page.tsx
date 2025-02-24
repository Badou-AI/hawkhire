"use client"

import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import { Eye, EyeOff } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { AuthError } from "@supabase/supabase-js"
import AuthLayout from './layout'

const RETRY_AFTER_DEFAULT = 60 // Default retry after 60 seconds if header not present
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000 // 1 second

// Add render counter
let renderCount = 0;

export default function SignInPage() {
  renderCount++;
  
  useEffect(() => {
    console.log(`[SignInPage] Render count: ${renderCount}`);
  });

  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [retryAfter, setRetryAfter] = useState<number | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    console.log('[SignInPage] Component mounted');
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
      }
    }
    checkSession()
    return () => console.log('[SignInPage] Component unmounted');
  }, [router, supabase.auth])

  // Memoize the submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('[SignInPage] Submit attempt', {
      timestamp: new Date().toISOString(),
      renderCount,
      hasExistingRateLimit: !!localStorage.getItem('auth_rate_limit'),
    });
    
    // Check if we're in a rate-limited state
    const rateLimitKey = 'auth_rate_limit'
    const rateLimitData = localStorage.getItem(rateLimitKey)
    
    if (rateLimitData) {
      const { timestamp, retryAfter } = JSON.parse(rateLimitData)
      const now = Date.now()
      if (now < timestamp + (retryAfter * 1000)) {
        const remainingSeconds = Math.ceil((timestamp + (retryAfter * 1000) - now) / 1000)
        toast.error(`Please wait ${remainingSeconds} seconds before trying again`)
        return
      }
      localStorage.removeItem(rateLimitKey)
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.status === 429) {
          const retryAfter = parseInt(error.message.match(/\d+/)?.[0] || '60', 10)
          localStorage.setItem(rateLimitKey, JSON.stringify({
            timestamp: Date.now(),
            retryAfter
          }))
          toast.error(`Too many attempts. Please try again in ${retryAfter} seconds.`)
          return
        }
        throw error
      }

      if (data.session) {
        toast.success('Successfully signed in!')
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      if (error instanceof AuthError) {
        toast.error(error.message)
      } else {
        toast.error('Failed to sign in')
      }
    } finally {
      setIsLoading(false)
    }
  }, [email, password])

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Sign In</h2>
          <p className="mt-2 text-sm text-gray-600">Welcome back! Please enter your details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-gray-700">EMAIL</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
            />
          </div>

          <div>
            <Label htmlFor="password" className="block text-sm font-medium text-gray-700">PASSWORD</Label>
            <div className="mt-1 relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className="pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Your Password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
              </Button>
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
        </form>

        <p className="mt-2 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link href="/sign-up" className="font-medium text-violet-600 hover:text-violet-500">Sign up</Link>
        </p>
      </div>
    </AuthLayout>
  )
} 