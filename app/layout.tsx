import type { Metadata } from "next"
import { Libre_Franklin, Mulish } from 'next/font/google'
import "./globals.css"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { ThemeProvider } from "@/components/theme-provider"

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${libreFranklin.variable} ${mulish.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto p-6">
                {children}
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}

