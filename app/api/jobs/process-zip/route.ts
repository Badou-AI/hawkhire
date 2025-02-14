import { verifyAuth } from '@/lib/api-auth'
import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import AdmZip from 'adm-zip'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

interface ProcessingEvent {
  event: 'processing_started' | 'file_processed' | 'file_failed' | 'completed' | 'error';
  total_files?: number;
  processed_count?: number;
  failed_count?: number;
  file_name?: string;
  error?: string;
  supported?: number;
  unsupported?: number;
}

interface JobData {
  title: { en: string; fr?: string };
  description: { en: string; fr?: string };
  organization_id: string;
  is_mock: boolean;
  created_by: string;
  job_type: string;
  location: {
    city: { en: string; fr?: string };
    state: { en: string; fr?: string };
    country: { en: string; fr?: string };
    postal_code: { en: string; fr?: string };
  };
  remote: boolean;
  status: string;
  requirements: { en: string[]; fr?: string[] };
  skills: string[];
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  rating: number | null;
}

// Generate a unique ID using UUID v4
const generateId = () => {
  return randomUUID()
}

export async function POST(request: NextRequest) {
  console.log('Received upload request...')
  const authResult = await verifyAuth()
  
  if (authResult instanceof NextResponse) {
    console.log('Authentication failed.')
    return authResult
  }

  const { session } = authResult

  try {
    console.log('Starting file processing...')
    const encoder = new TextEncoder()
    
    // Create a ReadableStream with a controller
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = async (event: ProcessingEvent) => {
          console.log('Sending event:', event)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        }

        try {
          console.log('Parsing form data...')
          const formData = await request.formData()
          const file = formData.get('file') as File
          const organizationId = formData.get('organizationId') as string
          const isMock = formData.get('isMock') === 'true'
          const status = formData.get('status') as string || 'DRAFT'

          if (!file || !organizationId) {
            throw new Error('Missing required fields')
          }

          await sendEvent({ event: 'processing_started', total_files: 0 })

          console.log('Creating temp directory...')
          const tempDir = join(tmpdir(), generateId())
          await mkdir(tempDir, { recursive: true })

          console.log('Saving uploaded file...')
          const zipPath = join(tempDir, 'upload.zip')
          const buffer = Buffer.from(await file.arrayBuffer())
          await writeFile(zipPath, buffer)

          console.log('Extracting ZIP file...')
          const zip = new AdmZip(zipPath)
          const entries = zip.getEntries()
          console.log(`Found ${entries.length} files in ZIP`)

          await sendEvent({
            event: 'processing_started',
            total_files: entries.length
          })

          let processedCount = 0
          let failedCount = 0
          let supportedCount = 0
          let unsupportedCount = 0
          const jobs: JobData[] = []

          // Process each file
          console.log('Starting to process files...')
          for (const entry of entries) {
            console.log(`Starting entry: ${entry.name}`)
            try {
              if (entry.isDirectory) {
                console.log(`Skipping directory: ${entry.name}`);
                unsupportedCount++
                continue;
              }

              // Get file data and validate content
              console.log(`Getting data for: ${entry.name}`)
              const entryData = entry.getData()
              console.log(`Got data, size: ${entryData.length} bytes`)

              const ext = entry.name.split('.').pop()?.toLowerCase()
              console.log(`Processing file: ${entry.name} (${ext})`);

              // Validate file type before processing
              if (ext !== 'pdf') {
                console.log(`Skipping unsupported file type: ${entry.name}`);
                unsupportedCount++
                await sendEvent({
                  event: 'file_failed',
                  processed_count: processedCount,
                  failed_count: failedCount,
                  file_name: entry.name,
                  error: `Unsupported file type: ${ext}. Only PDF files are supported.`
                })
                continue
              }

              // Skip empty or very small files that are likely invalid
              if (entryData.length < 100) {  // Less than 100 bytes is likely invalid
                console.log(`Skipping empty or invalid file: ${entry.name}`);
                failedCount++
                await sendEvent({
                  event: 'file_failed',
                  processed_count: processedCount,
                  failed_count: failedCount,
                  file_name: entry.name,
                  error: 'File appears to be empty or invalid'
                })
                continue
              }

              supportedCount++
              let text = ''

              try {
                console.log(`Converting PDF to text: ${entry.name}`);
                const pdfBuffer = entryData
                
                // Use dedicated job PDF conversion endpoint
                const formData = new FormData()
                const pdfFile = new File([pdfBuffer], entry.name, { type: 'application/pdf' })
                formData.append('file', pdfFile)

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/jobs/convert-pdf`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${session.access_token}`
                  },
                  body: formData
                })

                if (!response.ok) {
                  const errorData = await response.text()
                  console.error('PDF processing error:', errorData)
                  throw new Error(`Failed to process PDF: ${response.status} ${errorData}`)
                }

                console.log('PDF converted to text successfully');
                const result = await response.json()
                text = result.text

                // Validate extracted text before proceeding
                if (!text || text.trim().length < 50) {  // Text should be at least 50 chars
                  throw new Error('Extracted text is too short or empty')
                }

                // Extract job data using LLM
                console.log('Extracting job data using LLM...');
                const jobDataResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/jobs/extract-data`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    text: text,
                    filename: entry.name
                  })
                })

                if (!jobDataResponse.ok) {
                  const errorData = await jobDataResponse.text()
                  console.error('Job data extraction error:', errorData)
                  throw new Error(`Failed to extract job data: ${jobDataResponse.status} ${errorData}`)
                }

                const extractedData = await jobDataResponse.json()
                console.log('Extracted job data:', JSON.stringify(extractedData, null, 2))
                
                // Extract the actual job data from the nested structure
                const jobData = extractedData.data
                if (!jobData) {
                  throw new Error('Invalid response format from LLM')
                }
                
                // Validate extracted data
                if (!jobData.title?.en || !jobData.description?.en) {
                  console.error('Missing required fields in extracted data:', jobData)
                  throw new Error('Failed to extract required job fields (title or description)')
                }

                console.log('Creating job entry from extracted data...');
                
                // Create job entry with extracted data
                const job: JobData = {
                  ...jobData,
                  organization_id: organizationId,
                  is_mock: isMock,
                  created_by: session.user.id,
                  status: status,
                  // Use extracted data or defaults
                  job_type: jobData.job_type || 'FULL_TIME',
                  location: jobData.location || {
                    city: { en: 'Unknown' },
                    state: { en: 'Unknown' },
                    country: { en: 'Unknown' },
                    postal_code: { en: 'Unknown' }
                  },
                  remote: jobData.remote || false,
                  requirements: jobData.requirements || { en: [], fr: [] },
                  skills: jobData.skills || [],
                  salary_min: jobData.salary_min || null,
                  salary_max: jobData.salary_max || null,
                  salary_currency: jobData.salary_currency || 'USD',
                  rating: jobData.rating || 0
                }

                jobs.push(job)
                processedCount++

                await sendEvent({
                  event: 'file_processed',
                  processed_count: processedCount,
                  failed_count: failedCount,
                  file_name: entry.name
                })
                console.log(`Completed processing: ${entry.name}`);
              } catch (error) {
                failedCount++
                console.error(`Error processing ${entry.name}:`, error)
                
                await sendEvent({
                  event: 'file_failed',
                  processed_count: processedCount,
                  failed_count: failedCount,
                  file_name: entry.name,
                  error: error instanceof Error ? error.message : String(error)
                })
              }
            } catch (error) {
              failedCount++
              console.error(`Error processing ${entry.name}:`, error)
              
              await sendEvent({
                event: 'file_failed',
                processed_count: processedCount,
                failed_count: failedCount,
                file_name: entry.name,
                error: error instanceof Error ? error.message : String(error)
              })
            }
          }

          console.log('All files processed, creating jobs in bulk...');
          if (jobs.length > 0) {
            try {
              console.log(`Attempting to create ${jobs.length} jobs...`, JSON.stringify(jobs, null, 2));
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/jobs/bulk`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(jobs)
              })

              if (!response.ok) {
                const error = await response.json()
                console.error('Bulk creation error response:', error);
                throw new Error(error.detail?.[0]?.msg || error.message || 'Failed to create jobs')
              }
              console.log('Bulk job creation successful');
            } catch (error) {
              console.error('Error in bulk creation:', error);
              throw error;
            }
          } else {
            console.log('No jobs to create in bulk');
          }

          await sendEvent({
            event: 'completed',
            total_files: entries.length,
            processed_count: processedCount,
            failed_count: failedCount,
            supported: supportedCount,
            unsupported: unsupportedCount
          })

        } catch (error) {
          console.error('Error in processing:', error)
          await sendEvent({
            event: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        } finally {
          controller.close()
        }
      }
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error setting up stream:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 