import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.error('Auth error:', sessionError)
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    console.log('Attempting to create organization with data:', body)
    
    const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name: body.name,
        slug,
        company_type: body.type,
        description: body.description,
        website_url: body.website,
        industry: body.industry,
        primary_location: body.location,
        logo_url: body.logo || null,
        verification_status: 'pending',
        tier: 'free', // Default tier
        members: [session.user.id] // Add creator as first member
      })
      .select()
      .single()

    if (error) {
      console.error('Database error details:', error)
      return new NextResponse(
        JSON.stringify({ error: error.message }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Server error:', error)
    return new NextResponse(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal Server Error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 