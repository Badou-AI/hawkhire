import type { Metadata } from "next"
import { Libre_Franklin, Mulish } from 'next/font/google'
import "./globals.css"

const libreFranklin = Libre_Franklin({ 
  subsets: ["latin"],
  variable: '--font-libre-franklin',
})

const mulish = Mulish({ 
  subsets: ["latin"],
  variable: '--font-mulish',
})

export const metadata: Metadata = {
  title: "HR Dashboard",
  description: "Modern HR Dashboard built with Next.js and shadcn/ui",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${libreFranklin.variable} ${mulish.variable} font-sans`}>
        {children}
      </body>
    </html>
  )
}

