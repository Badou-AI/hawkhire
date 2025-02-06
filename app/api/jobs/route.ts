import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://127.0.0.1:8080'

export async function GET(request: Request) {
    console.log('request', request);
  try {
    const { searchParams } = new URL(request.url)
    console.log('searchParams', searchParams);
    // Check if we're fetching a single job
    const jobId = await searchParams.get('id')
    if (jobId) {
      const response = await fetch(`${API_URL}/v1/jobs/${jobId}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        },
        cache: 'no-store'
      })

      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json(
            { error: 'Job not found' },
            { status: 404 }
          )
        }
        throw new Error(`Backend responded with ${response.status}`)
      }

      const data = await response.json()
      return NextResponse.json(data)
    }

    // Otherwise, fetch job list
    const page = searchParams.get('page') || '0'
    const pageSize = searchParams.get('page_size') || '20'

    const response = await fetch(
      `${API_URL}/v1/jobs?page=${page}&page_size=${pageSize}`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        },
        cache: 'no-store'
      }
    )

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in jobs API route:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 