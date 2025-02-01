import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  // Skip auth check in development
  if (process.env.NODE_ENV === 'development') {
    redirect('/dashboard')
  }

  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/dashboard')
  } else {
    redirect('/sign-in')
  }
}

