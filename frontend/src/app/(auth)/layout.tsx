"use client"

import Image from "next/image"
import { ReactNode } from "react"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
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
            Join Hawkhire to streamline your hiring process and find the perfect candidates!
          </h2>
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {children}
        </div>
      </div>
    </div>
  )
} 