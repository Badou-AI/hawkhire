import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  if (!params.slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
  }

  try {
    const supabase = createClient()

    // First get the company data
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('slug', params.slug)
      .single()

    if (companyError) {
      console.error('Error fetching company:', companyError)
      return NextResponse.json(
        { error: 'Failed to fetch company data' },
        { status: 500 }
      )
    }

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Then get the member count in a separate query
    const { count: memberCount, error: countError } = await supabase
      .from('company_members')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company.id)

    if (countError) {
      console.error('Error fetching member count:', countError)
    }

    // Return combined data
    return NextResponse.json({
      ...company,
      company_members: [{ count: memberCount || 0 }]
    })
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 