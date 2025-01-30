import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const jobId = formData.get('jobId') as string
    const jobTitle = formData.get('jobTitle') as string

    if (!file || !jobId) {
      return NextResponse.json(
        { error: 'File and jobId are required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.endsWith('.zip')) {
      return NextResponse.json(
        { error: 'Only ZIP files are supported' },
        { status: 400 }
      )
    }

    // Forward to FastAPI backend
    const apiFormData = new FormData()
    apiFormData.append('file', file)
    apiFormData.append('job_id', jobId)
    if (jobTitle) {
      apiFormData.append('job_title', jobTitle)
    }

    const response = await fetch('http://127.0.0.1:8080/process-zip', {
      method: 'POST',
      body: apiFormData
    })

    if (!response.ok) {
      let errorMessage = 'Failed to process file'
      try {
        const error = await response.json()
        errorMessage = error.detail || errorMessage
      } catch {
        // If response is not JSON, try to get text
        try {
          errorMessage = await response.text()
        } catch {
          // If we can't get text, use status text
          errorMessage = response.statusText
        }
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    // Return the streaming response
    const headers = new Headers(response.headers)
    headers.set('Content-Type', 'text/event-stream')
    headers.set('Cache-Control', 'no-cache')
    headers.set('Connection', 'keep-alive')

    return new NextResponse(response.body, {
      status: 200,
      headers
    })
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 