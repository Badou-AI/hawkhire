import { NextResponse } from 'next/server';

const API_URL = process.env.PYTHON_API_URL || 'http://backend:8080'

export async function GET(request: Request) {
    console.log('request', request);
  try {
    const { searchParams } = new URL(request.url)
    console.log('searchParams', searchParams);
    // Check if we're fetching a single job
    const jobId = searchParams.get('id')
    const language = searchParams.get('language') || 'fr'
    if (jobId) {
      const response = await fetch(`${API_URL}/v1/jobs/with/organizations/${jobId}?language=${language}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
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
    const pageSize = searchParams.get('page_size') || '15'

    const response = await fetch(
      `${API_URL}/v1/jobs/with/organizations?page=${page}&page_size=${pageSize}&language=${language}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch jobs')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in jobs API route:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
} 