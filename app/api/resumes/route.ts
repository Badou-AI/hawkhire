import { NextRequest, NextResponse } from 'next/server';

// Get API URL from environment variable or use default
const API_URL = process.env.PYTHON_API_URL || 'https://api.hawkhire.ai'

interface DocumentItem {
  id: string;
  item_data?: {
    content?: {
      profile?: {
        first_name?: string;
        last_name?: string;
      };
    };
    timestamp?: string;
  };
}

// Add GET method to fetch resumes with John Doe filtering
export async function GET() {
  try {
    // Call the backend API to get resumes
    const response = await fetch(`${API_URL}/resumes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`)
    }

    const data = await response.json()
    
    // Filter out John Doe entries if data contains documents
    if (data && data.documents && Array.isArray(data.documents)) {
      console.log(`Processing ${data.documents.length} documents from resumes API`);
      
      const originalCount = data.documents.length;
      
      // Filter out John Doe entries
      data.documents = data.documents.filter((doc: DocumentItem) => {
        // Check if document has valid profile data
        const hasValidProfile = doc?.item_data?.content?.profile?.first_name && 
                               doc?.item_data?.content?.profile?.last_name;
        
        // Check if name is "John Doe" (case insensitive)
        const isJohnDoe = hasValidProfile && 
                         doc?.item_data?.content?.profile?.first_name?.toLowerCase() === "john" && 
                         doc?.item_data?.content?.profile?.last_name?.toLowerCase() === "doe";
        
        // Log any John Doe entries we're filtering out
        if (isJohnDoe) {
          console.log('Resumes API route: Filtering out John Doe entry:', {
            id: doc.id,
            name: `${doc?.item_data?.content?.profile?.first_name} ${doc?.item_data?.content?.profile?.last_name}`,
            timestamp: doc?.item_data?.timestamp
          });
        }
        
        // Keep only valid profiles that are not John Doe
        return hasValidProfile && !isJohnDoe;
      });
      
      const filteredCount = originalCount - data.documents.length;
      if (filteredCount > 0) {
        console.log(`Resumes API route: Filtered out ${filteredCount} John Doe entries`);
        
        // Update total count if it exists
        if (data.total) {
          data.total = data.documents.length;
        }
      }
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching resumes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch resumes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const jobId = formData.get('jobId') as string
    const jobTitle = formData.get('jobTitle') as string
    const jobDescription = formData.get('jobDescription') as string

    if (!file || !jobId || !jobDescription) {
      return NextResponse.json(
        { error: 'File, jobId, and jobDescription are required' },
        { status: 400 }
      )
    }

    // Forward to FastAPI backend
    const apiFormData = new FormData()
    apiFormData.append('file', file)
    apiFormData.append('job_id', jobId)
    apiFormData.append('job_description', jobDescription)
    if (jobTitle) {
      apiFormData.append('job_title', jobTitle)
    }

    const response = await fetch(`${API_URL}/process-zip`, {
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