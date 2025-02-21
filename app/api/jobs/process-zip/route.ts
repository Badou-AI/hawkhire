import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Forward the request to our Python backend
    const pythonResponse = await fetch(`${process.env.PYTHON_API_URL}/v2/jobs/process-zip`, {
      method: 'POST',
      body: await request.formData(),
      headers: {
        // Forward any relevant headers
        'Accept': 'text/event-stream',
      }
    });

    if (!pythonResponse.ok) {
      throw new Error(`Python API returned ${pythonResponse.status}`);
    }

    // Return streaming response
    return new NextResponse(pythonResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Error processing ZIP file:', error);
    return NextResponse.json(
      { error: 'Failed to process ZIP file' },
      { status: 500 }
    );
  }
} 