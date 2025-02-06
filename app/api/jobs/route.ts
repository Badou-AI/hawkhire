import { NextResponse } from 'next/server'

const API_URL = process.env.API_URL || 'http://127.0.0.1:8080'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = searchParams.get('page') || '0'
  const pageSize = searchParams.get('page_size') || '10'
  const jobId = searchParams.get('id')

  try {
    // If jobId is provided, fetch specific job
    if (jobId) {
      const response = await fetch(`${API_URL}/v1/jobs/${jobId}`)
      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json({ error: 'Job not found' }, { status: 404 })
        }
        throw new Error('Failed to fetch job')
      }
      const data = await response.json()
      return NextResponse.json(data)
    }

    // Otherwise fetch job list
    const response = await fetch(
      `${API_URL}/v1/jobs?page=${page}&page_size=${pageSize}`
    )
    if (!response.ok) {
      throw new Error('Failed to fetch jobs')
    }
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in jobs API route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 