"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Eye, EyeOff } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // For now, just redirect to the dashboard without authentication
    router.push('/dashboard')
  }

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
                <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700">
                  Sign in
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

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button variant="outline" className="w-full">
                  <Image
                    className="mr-2 h-5 w-5"
                    src="/google.svg"
                    alt="Google logo"
                    width={20}
                    height={20}
                  />
                  <span className="text-sm font-medium">Google</span>
                </Button>

                <Button variant="outline" className="w-full">
                  <Image
                    className="mr-2 h-5 w-5"
                    src="/facebook.svg"
                    alt="Facebook logo"
                    width={20}
                    height={20}
                  />
                  <span className="text-sm font-medium">Facebook</span>
                </Button>
              </div>
            </div>

            <p className="mt-2 text-center text-sm text-gray-600">
              Don't have an account?{" "}
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
            alt="Cleverwise"
            width={150}
            height={40}
            className="mb-8"
          />
          <h2 className="text-4xl font-bold text-center max-w-xl">
            Streamline your personnel processes for better efficiency and convenience today!
          </h2>
        </div>
      </div>
    </div>
  )
}

