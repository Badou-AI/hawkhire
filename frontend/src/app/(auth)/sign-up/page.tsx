"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Eye, EyeOff } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from 'next/navigation'
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import AuthLayout from '../layout'

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
      }
    }
    checkSession()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    if (!supabase) {
      toast.error('Authentication service unavailable');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      if (data.user) {
        toast.success('Please check your email to verify your account')
        router.push('/sign-in')
      }
    } catch {
      toast.error('Failed to sign up')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Create Account</h2>
          <p className="mt-2 text-sm text-gray-600">Join Hawkhire to start hiring or finding jobs</p>
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
                placeholder="Create a strong password"
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

          <div className="flex items-center">
            <Checkbox id="terms" required />
            <Label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
              I agree to the{" "}
              <Link href="/terms" className="font-medium text-violet-600 hover:text-violet-500">Terms of Service</Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-medium text-violet-600 hover:text-violet-500">Privacy Policy</Link>
            </Label>
          </div>

          <div>
            <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </div>
        </form>

        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-violet-600 hover:text-violet-500">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  )
} 