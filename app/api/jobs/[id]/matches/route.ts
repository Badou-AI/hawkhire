import { NextResponse } from 'next/server'
import { getJob } from '../../client'

const REMOTE_API_URL = process.env.NEXT_PUBLIC_REMOTE_API_URL || 'http://147.79.115.55:8000'

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params

  try {
    const { searchParams } = new URL(request.url)
    const excludeFields = searchParams.get('exclude_fields')
    const offset = searchParams.get('offset') || '0'
    const size = searchParams.get('size') || '5000'

    // Get the job first to generate the correct index name
    const job = await getJob(id)
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Generate the index name using the same format as the backend
    const titleSlug = job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const indexName = `job-${titleSlug}-${id}`

    // Make the request to the remote API
    const response = await fetch(
      `${REMOTE_API_URL}/v1/index/${indexName}/document?offset=${offset}&size=${size}${excludeFields ? `&exclude_fields=${excludeFields}` : ''}`,
      {
        headers: {
          'accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      // If the index doesn't exist, return empty results instead of an error
      if (response.status === 404) {
        return NextResponse.json({
          matches: [],
          total: 0
        })
      }
      throw new Error(`Remote API returned ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching job matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job matches' },
      { status: 500 }
    )
  }
} 