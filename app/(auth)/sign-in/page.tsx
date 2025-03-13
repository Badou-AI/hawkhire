/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Eye, EyeOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { AuthError } from "@supabase/supabase-js";

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryTimeRemaining, setRetryTimeRemaining] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { supabase } = useAuth();

  useEffect(() => {
    // Check if user is already signed in
    const checkSession = async () => {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/jobs');
      }
    };
    
    // Check for error parameter in URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const error = params.get('error');
      
      if (error === 'invalid_token') {
        toast.error('Authentication error', {
          description: 'Your session was invalid. Please sign in again.',
          duration: 5000
        });
        
        // Clear the error from URL to prevent showing the message again on refresh
        if (window.history.replaceState) {
          const url = new URL(window.location.href);
          url.searchParams.delete('error');
          window.history.replaceState({}, document.title, url.toString());
        }
      }
    }
    
    // Check if there's a stored retry time
    const storedRetryTime = localStorage.getItem('auth_retry_after');
    if (storedRetryTime) {
      const retryTime = parseInt(storedRetryTime, 10);
      const now = Date.now();
      
      if (retryTime > now) {
        const secondsRemaining = Math.ceil((retryTime - now) / 1000);
        const minutes = Math.floor(secondsRemaining / 60);
        const seconds = secondsRemaining % 60;
        const timeDisplay = minutes > 0 
          ? `${minutes} minute${minutes > 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''}` 
          : `${seconds} second${seconds !== 1 ? 's' : ''}`;
        
        setIsRateLimited(true);
        setRetryTimeRemaining(timeDisplay);
        
        toast.error('Sign-in temporarily disabled', {
          description: `Too many attempts. Please try again in ${timeDisplay}`,
          duration: 5000
        });
        
        // Set up a timer to update the countdown
        const intervalId = setInterval(() => {
          const currentTime = Date.now();
          if (retryTime <= currentTime) {
            setIsRateLimited(false);
            setRetryTimeRemaining(null);
            localStorage.removeItem('auth_retry_after');
            clearInterval(intervalId);
          } else {
            const newSecondsRemaining = Math.ceil((retryTime - currentTime) / 1000);
            const newMinutes = Math.floor(newSecondsRemaining / 60);
            const newSeconds = newSecondsRemaining % 60;
            const newTimeDisplay = newMinutes > 0 
              ? `${newMinutes} minute${newMinutes > 1 ? 's' : ''} and ${newSeconds} second${newSeconds !== 1 ? 's' : ''}` 
              : `${newSeconds} second${newSeconds !== 1 ? 's' : ''}`;
            
            setRetryTimeRemaining(newTimeDisplay);
          }
        }, 1000);
        
        return () => clearInterval(intervalId);
      } else {
        // Clear the stored retry time if it's expired
        localStorage.removeItem('auth_retry_after');
      }
    }
    
    checkSession();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verify session was created
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        throw new Error('No session found after sign-in');
      }

      // Success - redirect to dashboard
      router.push('/dashboard');
      router.refresh(); // Force a refresh to update server components
      
    } catch (error) {
      console.error('[SignInPage] Sign-in error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during sign-in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!supabase) {
      toast.error('Authentication service unavailable');
      return;
    }
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error) {
      if (error instanceof AuthError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to sign in with Google');
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="space-y-6">
            <div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Sign In</h2>
              <p className="mt-2 text-sm text-gray-600">
                Welcome back! Please enter your details
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  EMAIL
                </Label>
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
                <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  PASSWORD
                </Label>
                <div className="mt-1 relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
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
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Checkbox id="remember-me" />
                  <Label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Remember me
                  </Label>
                </div>

                <div className="text-sm">
                  <Link href="#" className="font-medium text-violet-600 hover:text-violet-500">
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <Button 
                  type="submit" 
                  className="w-full bg-violet-600 hover:bg-violet-700"
                  disabled={isLoading || isRateLimited}
                >
                  {isLoading ? 'Signing in...' : 
                   isRateLimited ? `Try again in ${retryTimeRemaining}` : 
                   'Sign in'}
                </Button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleGoogleSignIn}
                >
                  <Image
                    className="mr-2 h-5 w-5"
                    src="/google.svg"
                    alt="Google logo"
                    width={20}
                    height={20}
                  />
                  <span className="text-sm font-medium">Google</span>
                </Button>
              </div>
            </div>

            <p className="mt-2 text-center text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className="font-medium text-violet-600 hover:text-violet-500">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
      <div className="hidden lg:block relative w-0 flex-1 bg-violet-600">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-12">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Cleverwise-NNqNplHGCNwge6NJihMuobMRSYyxJC.png"
            alt="Hawkhire"
            width={150}
            height={40}
            className="mb-8"
          />
          <h2 className="text-4xl font-bold text-center max-w-xl">
            Hawkhire streamlines your personnel processes for better efficiency and convenience instantly!
          </h2>
        </div>
      </div>
    </div>
  );
}

