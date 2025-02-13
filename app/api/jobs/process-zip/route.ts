import { verifyAuth } from '@/lib/api-auth'
import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { sign } from 'jsonwebtoken'
import AdmZip from 'adm-zip'

interface ProcessingEvent {
  event: 'processing_started' | 'file_processed' | 'file_failed' | 'completed';
  total_files?: number;
  processed_count?: number;
  failed_count?: number;
  file_name?: string;
  error?: string;
}

interface JobData {
  title: string;
  description: string;
  organization_id: string;
  is_mock: boolean;
  created_by: string;
}

// Generate a unique ID using JWT's sign function
const generateId = () => {
  return sign({}, 'temp-secret', { jwtid: Date.now().toString() }).split('.')[2]
}

export async function POST(request: NextRequest) {
  const authResult = await verifyAuth()
  
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { session, supabase } = authResult

  try {
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()
    const encoder = new TextEncoder()

    const sendEvent = async (event: ProcessingEvent) => {
      await writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const organizationId = formData.get('organizationId') as string
    const isMock = formData.get('isMock') === 'true'

    if (!file || !organizationId) {
      throw new Error('Missing required fields')
    }

    // Create temp directory with JWT-based unique ID
    const tempDir = join(tmpdir(), generateId())
    await mkdir(tempDir, { recursive: true })

    // Save uploaded file
    const zipPath = join(tempDir, 'upload.zip')
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(zipPath, buffer)

    // Extract ZIP
    const zip = new AdmZip(zipPath)
    const entries = zip.getEntries()

    await sendEvent({
      event: 'processing_started',
      total_files: entries.length
    })

    let processedCount = 0
    let failedCount = 0
    const jobs: JobData[] = []

    // Process each file
    for (const entry of entries) {
      try {
        if (entry.isDirectory) continue

        const ext = entry.name.split('.').pop()?.toLowerCase()
        let text = ''

        if (ext === 'pdf') {
          // Instead of processing PDFs directly, we'll send them to the FastAPI backend
          // which has the proper PDF processing libraries
          const pdfBuffer = entry.getData()
          const { data, error: uploadError } = await supabase.storage
            .from('temp-uploads')
            .upload(`pdf-processing/${entry.name}`, pdfBuffer)

          if (uploadError) throw uploadError

          // Call FastAPI endpoint to process the PDF
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/process-pdf`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              file_path: data.path
            })
          })

          if (!response.ok) {
            throw new Error('Failed to process PDF')
          }

          const result = await response.json()
          text = result.text
        } else if (['txt', 'md'].includes(ext || '')) {
          text = entry.getData().toString('utf8')
        } else {
          throw new Error(`Unsupported file type: ${ext}`)
        }

        // Create job using the extracted text
        const job: JobData = {
          title: entry.name.replace(/\.[^/.]+$/, ""),
          description: text.slice(0, 1000), // Truncate for now
          organization_id: organizationId,
          is_mock: isMock,
          created_by: session.user.id
        }

        jobs.push(job)
        processedCount++

        await sendEvent({
          event: 'file_processed',
          processed_count: processedCount,
          failed_count: failedCount,
          file_name: entry.name
        })
      } catch (error) {
        failedCount++
        console.error(`Error processing ${entry.name}:`, error)
        
        await sendEvent({
          event: 'file_failed',
          processed_count: processedCount,
          failed_count: failedCount,
          file_name: entry.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Batch create jobs using Supabase
    if (jobs.length > 0) {
      const { error: insertError } = await supabase
        .from('jobs')
        .insert(jobs)

      if (insertError) {
        throw insertError
      }
    }

    await sendEvent({
      event: 'completed',
      total_files: entries.length,
      processed_count: processedCount,
      failed_count: failedCount
    })

    writer.close()

    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error processing ZIP:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 