import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const pythonApiUrl = process.env.PYTHON_API_URL;
    if (!pythonApiUrl) {
      throw new Error('PYTHON_API_URL environment variable is not configured');
    }

    console.log(`Using Python API URL: ${pythonApiUrl}`);

    // Log the incoming request details
    const formData = await request.formData();
    console.log('Incoming request form data fields:', Array.from(formData.keys()));
    console.log('Organization ID:', formData.get('organization_id'));
    console.log('Is Mock:', formData.get('is_mock'));
    console.log('Status:', formData.get('status'));
    
    const file = formData.get('file');
    console.log('File object:', file ? {
      type: file.constructor.name,
      size: file instanceof Blob ? file.size : 'N/A',
      contentType: file instanceof File ? file.type : 'N/A'
    } : 'No file found');

    // Forward the request to our Python backend
    // Use the v2 endpoint for the batch processor
    const endpoint = '/v2/jobs/process-zip';
    console.log(`Forwarding request to: ${pythonApiUrl}${endpoint}`);
    
    const pythonResponse = await fetch(`${pythonApiUrl}${endpoint}`, {
      method: 'POST',
      body: formData,
      headers: {
        // Forward any relevant headers
        'Accept': 'text/event-stream',
      }
    });

    if (!pythonResponse.ok) {
      // Log the error response details
      const errorText = await pythonResponse.text();
      console.error('Python API Error:', {
        status: pythonResponse.status,
        statusText: pythonResponse.statusText,
        headers: Object.fromEntries(pythonResponse.headers.entries()),
        body: errorText
      });
      throw new Error(`Python API returned ${pythonResponse.status}: ${errorText}`);
    }

    console.log('Python API response headers:', Object.fromEntries(pythonResponse.headers.entries()));

    // Return streaming response
    return new NextResponse(pythonResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no' // Disable buffering for Nginx
      }
    });
  } catch (error) {
    console.error('Error processing ZIP file:', error);
    
    // Return a more detailed error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { 
        error: 'Failed to process ZIP file',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 