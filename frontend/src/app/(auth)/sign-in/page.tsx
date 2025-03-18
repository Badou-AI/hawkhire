"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Eye, EyeOff } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient, clearAuthState } from "@/lib/supabase/client"
import { toast } from "sonner"
import AuthLayout from '../layout'

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
      }
    }
    checkSession()
  }, [router, supabase.auth])

  useEffect(() => {
    // Check for session expiration query param
    const expired = searchParams.get('expired');
    if (expired === 'true') {
      toast.error('Your session has expired. Please sign in again.');
    }
    
    // Check for invalid JWT token errors
    const invalidToken = searchParams.get('invalid_token');
    if (invalidToken === 'true') {
      clearAuthState();
      toast.error('Authentication error. Please sign in again.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        if (error.status === 429) {
          toast.error('Too many sign-in attempts', {
            description: 'Please wait a few minutes before trying again',
            duration: 5000
          });
        } else {
          toast.error(error.message || 'Failed to sign in');
        }
        setIsLoading(false);
        return;
      }
      
      if (data.session) {
        toast.success('Successfully signed in!');
        router.push('/dashboard');
      } else {
        toast.error('No session returned');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      toast.error('An unexpected error occurred');
      setIsLoading(false);
    }
  };

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
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="font-medium text-violet-600 hover:text-violet-500">Sign up</Link>
        </p>
      </div>
    </AuthLayout>
  )
} 