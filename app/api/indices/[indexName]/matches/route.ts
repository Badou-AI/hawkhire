import { NextResponse } from 'next/server'

const serviceUrl = process.env.RESUME_PROCESSING_URL || 'http://147.93.44.131:8000'

export async function GET(
  request: Request,
  { params }: { params: { indexName: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const offset = searchParams.get('offset') || '0'
    const size = searchParams.get('size') || '5000'
    const excludeFields = searchParams.get('exclude_fields')

    // Ensure we have the indexName before proceeding
    if (!params?.indexName) {
      return NextResponse.json(
        { error: 'Index name is required' },
        { status: 400 }
      )
    }

    const response = await fetch(
      `${serviceUrl}/v1/index/${params.indexName}/document?offset=${offset}&size=${size}${excludeFields ? `&exclude_fields=${excludeFields}` : ''}`,
      {
        headers: {
          'accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Resume processing service returned ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch candidate matches' },
      { status: 500 }
    )
  }
} 