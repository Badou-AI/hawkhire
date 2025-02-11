import { verifyAuth } from '@/lib/api-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authResult = await verifyAuth()
  
  if (authResult instanceof NextResponse) {
    return authResult // Returns 401 or 500 if auth failed
  }

  const { supabase, session } = authResult

  // Your protected API logic here
  return NextResponse.json({ 
    message: 'Protected data',
    user: session.user
  })
}

export async function POST(request: NextRequest) {
  const authResult = await verifyAuth()
  
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { supabase, session } = authResult
  const data = await request.json()

  // Your protected API logic here
  return NextResponse.json({ 
    message: 'Data received',
    user: session.user,
    data 
  })
} 