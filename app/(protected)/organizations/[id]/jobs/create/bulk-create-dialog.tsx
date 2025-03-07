"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Upload, AlertCircle } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { FileDropzone } from "@/components/resume-evaluator/FileDropzone"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { BulkJobProgress } from "@/components/jobs/BulkJobProgress"

interface BulkCreateDialogProps {
  organizationId: string
}

interface ProcessingStats {
  totalFiles: number;
  processedCount: number;
  failedCount: number;
  processingTime: number;
  unsupportedCount?: number;
}

type ProcessingStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

export function BulkCreateDialog({ organizationId }: BulkCreateDialogProps) {
  const { session } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [isMock, setIsMock] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle')
  const [stats, setStats] = useState<ProcessingStats>({
    totalFiles: 0,
    processedCount: 0,
    failedCount: 0,
    processingTime: 0,
    unsupportedCount: 0
  })
  const [error, setError] = useState<string>("")
  const [unsupportedFiles, setUnsupportedFiles] = useState<Array<{name: string, type: string, reason: string}>>([])
  const [currentFile, setCurrentFile] = useState<string>("")
  const [isOpen, setIsOpen] = useState(false)
  // Add a ref to track the number of processed files
  const processedFilesRef = useRef<{
    processed: number;
    failed: number;
    total: number;
  }>({
    processed: 0,
    failed: 0,
    total: 0
  });

  // Add useEffect for debugging
  useEffect(() => {
    console.log('Current state:', {
      processingStatus,
      stats,
      currentFile,
      error
    })
  }, [processingStatus, stats, currentFile, error])

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    setError("")
    setCurrentFile("")
    setProcessingStatus('idle')
    setStats({
      totalFiles: 0,
      processedCount: 0,
      failedCount: 0,
      processingTime: 0,
      unsupportedCount: 0
    })
  }

  // Reset function to clear state when dialog is closed
  const handleClose = () => {
    setIsOpen(false)
  }

  // Reset function when dialog is opened
  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    
    // If dialog is being closed, don't reset anything
    if (!open) return;
    
    // Don't reset the stats if we're in completed state
    if (processingStatus !== 'completed') {
      setFile(null);
      setError("");
      setCurrentFile("");
      setProcessingStatus('idle');
      setStats({
        totalFiles: 0,
        processedCount: 0,
        failedCount: 0,
        processingTime: 0,
        unsupportedCount: 0
      });
    } else {
      // Log the current stats for debugging
      console.log('Dialog reopened with completed stats:', stats);
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload")
      return
    }

    if (!session) {
      toast.error("You must be logged in to upload files")
      return
    }

    try {
      console.log('Starting upload process...')
      setProcessingStatus('uploading')
      const formData = new FormData()
      formData.append('file', file)
      formData.append('organization_id', organizationId)
      formData.append('is_mock', String(isMock))
      formData.append('status', isPublished ? 'PUBLISHED' : 'DRAFT')

      console.log('Sending request to /api/jobs/process-zip with form data:', {
        organizationId,
        isMock,
        status: isPublished ? 'PUBLISHED' : 'DRAFT',
        fileSize: file.size,
        fileName: file.name
      })

      const response = await fetch("/api/jobs/process-zip", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        throw new Error(`Failed to process jobs: ${response.status} ${response.statusText}`)
      }

      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      console.log('Response status:', response.status)

      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No reader available')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      const startTime = Date.now()

      console.log('Starting to read stream...')
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          console.log('Stream complete')
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        console.log('Received chunk:', chunk)
        buffer += chunk
        const lines = buffer.split('\n\n')
        
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim()
          if (line.startsWith('data: ')) {
            try {
              const eventData = line.slice(6)
              console.log('Raw event data:', eventData)
              const event = JSON.parse(eventData)
              console.log('Parsed event:', event)

              // Normalize event type - backend might send 'event' or 'type'
              const eventType = event.event || event.type
              if (!eventType) {
                console.log('Event has no type or event field:', event)
                return
              }

              // Always update the file name if present
              if (event.file_name && event.file_name !== 'null') {
                console.log('Processing file:', event.file_name)
                setCurrentFile(event.file_name)
              } else if (event.current_file && event.current_file !== 'null') {
                console.log('Processing file:', event.current_file)
                setCurrentFile(event.current_file)
              }

              // Map backend event types to frontend event types
              let normalizedEventType = eventType.toLowerCase()
              if (normalizedEventType === 'processing_started') normalizedEventType = 'processing_started'
              else if (normalizedEventType === 'file_processed') normalizedEventType = 'file_processed'
              else if (normalizedEventType === 'processing_completed') normalizedEventType = 'batch_completed'
              else if (normalizedEventType === 'processing_error') normalizedEventType = 'file_processing_failed'
              else if (normalizedEventType === 'file_processing_complete') normalizedEventType = 'file_processed'
              else if (normalizedEventType === 'file_processing_failed') normalizedEventType = 'file_processing_failed'
              else if (normalizedEventType === 'job_created') normalizedEventType = 'job_created'
              else if (normalizedEventType === 'job_creation_failed') normalizedEventType = 'job_creation_failed'

              console.log('Normalized event type:', normalizedEventType)

              switch (normalizedEventType) {
                case 'processing_started':
                  setProcessingStatus('processing')
                  // Reset the processed files counter
                  processedFilesRef.current = {
                    processed: 0,
                    failed: 0,
                    total: event.total_files || 0
                  };
                  setStats(prev => ({
                    ...prev,
                    totalFiles: event.total_files || prev.totalFiles,
                    unsupportedCount: event.unsupported_files?.length || prev.unsupportedCount || 0
                  }))
                  if (event.unsupported_files?.length) {
                    setUnsupportedFiles(event.unsupported_files)
                  }
                  break

                case 'file_processed':
                  // Keep track of processed files count
                  processedFilesRef.current.processed += 1;
                  const newProcessedCount = Math.max(event.processed_count || 0, stats.processedCount, processedFilesRef.current.processed);
                  const newFailedCount = Math.max(event.failed_count || 0, stats.failedCount, processedFilesRef.current.failed);
                  
                  console.log(`File processed: ${event.file_name}, processed: ${newProcessedCount}, failed: ${newFailedCount}, ref: ${processedFilesRef.current.processed}`);
                  
                  setStats(prev => ({
                    ...prev,
                    processedCount: newProcessedCount,
                    failedCount: newFailedCount,
                    processingTime: (Date.now() - startTime) / 1000
                  }))
                  break

                case 'file_processing_complete':
                case 'file_processing_failed':
                case 'job_created':
                case 'job_creation_failed':
                  setStats(prev => ({
                    ...prev,
                    processedCount: Math.max(event.processed_count || 0, prev.processedCount),
                    failedCount: Math.max(event.failed_count || 0, prev.failedCount),
                    processingTime: (Date.now() - startTime) / 1000
                  }))
                  break

                case 'batch_completed':
                  console.log('Received batch_completed event with data:', event);
                  console.log('Processed files ref:', processedFilesRef.current);
                  
                  // Store the final stats in a more reliable way
                  // If the server reports 0 processed but we know jobs were created, use our tracked count
                  const actualProcessedCount = event.processed_count > 0 
                    ? event.processed_count 
                    : Math.max(stats.processedCount, processedFilesRef.current.processed);
                    
                  const actualFailedCount = event.failed_count > 0
                    ? event.failed_count
                    : Math.max(stats.failedCount, processedFilesRef.current.failed);
                  
                  // Force update the stats directly with setState instead of using the functional update
                  // This ensures the state is immediately updated with the correct values
                  const finalStats = {
                    totalFiles: event.total_files || stats.totalFiles || processedFilesRef.current.total,
                    processedCount: actualProcessedCount,
                    failedCount: actualFailedCount,
                    processingTime: event.processing_details?.total_time || (Date.now() - startTime) / 1000,
                    unsupportedCount: event.unsupported_files?.length || stats.unsupportedCount || 0
                  };
                  
                  console.log('Setting final stats:', finalStats);
                  
                  // Set processing status first
                  setProcessingStatus('completed');
                  
                  // Then update stats with the final values - use direct setState instead of functional update
                  setStats(finalStats);
                  
                  // Force a re-render by updating a dummy state
                  setCurrentFile('');
                  
                  // Log the stats after the update
                  setTimeout(() => {
                    console.log('Stats after batch completion:', stats);
                  }, 0);
                  
                  if (finalStats.processedCount > 0) {
                    toast.success(`Successfully processed ${finalStats.processedCount} jobs`);
                  }
                  if (finalStats.failedCount > 0) {
                    toast.error(`Failed to process ${finalStats.failedCount} jobs`);
                  }
                  break

                case 'file_processing_failed':
                  // Keep track of failed files count
                  processedFilesRef.current.failed += 1;
                  const updatedFailedCount = Math.max(event.failed_count || 0, stats.failedCount, processedFilesRef.current.failed);
                  
                  console.log(`File processing failed: ${event.file_name}, failed: ${updatedFailedCount}, ref: ${processedFilesRef.current.failed}`);
                  
                  setStats(prev => ({
                    ...prev,
                    processedCount: Math.max(event.processed_count || 0, prev.processedCount, processedFilesRef.current.processed),
                    failedCount: updatedFailedCount,
                    processingTime: (Date.now() - startTime) / 1000
                  }))
                  break

                case 'job_created':
                  // Keep track of processed files count for job creation
                  processedFilesRef.current.processed += 1;
                  const updatedProcessedCount = Math.max(event.processed_count || 0, stats.processedCount, processedFilesRef.current.processed);
                  
                  console.log(`Job created: ${event.file_name}, processed: ${updatedProcessedCount}, ref: ${processedFilesRef.current.processed}`);
                  
                  setStats(prev => ({
                    ...prev,
                    processedCount: updatedProcessedCount,
                    failedCount: Math.max(event.failed_count || 0, prev.failedCount, processedFilesRef.current.failed),
                    processingTime: (Date.now() - startTime) / 1000
                  }))
                  break

                case 'job_creation_failed':
                  // Keep track of failed files count for job creation
                  processedFilesRef.current.failed += 1;
                  const updatedJobFailedCount = Math.max(event.failed_count || 0, stats.failedCount, processedFilesRef.current.failed);
                  
                  console.log(`Job creation failed: ${event.file_name}, failed: ${updatedJobFailedCount}, ref: ${processedFilesRef.current.failed}`);
                  
                  setStats(prev => ({
                    ...prev,
                    processedCount: Math.max(event.processed_count || 0, prev.processedCount, processedFilesRef.current.processed),
                    failedCount: updatedJobFailedCount,
                    processingTime: (Date.now() - startTime) / 1000
                  }))
                  break

                default:
                  console.log('Unhandled event type:', eventType)
                  break
              }
            } catch (e) {
              console.error('Error parsing event:', line.slice(6), e)
            }
          }
        }
        buffer = lines[lines.length - 1]
      }
      console.log('Upload process completed.')
    } catch (error) {
      console.error("Error uploading jobs:", error)
      setProcessingStatus('error')
      setError(error instanceof Error ? error.message : String(error))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Bulk Create Jobs
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Bulk Create Jobs</DialogTitle>
          <DialogDescription>
            Upload a ZIP file containing job descriptions in PDF or TXT format. Each file will be
            processed and converted into a job posting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {processingStatus !== 'completed' && (
            <FileDropzone
              onFileSelect={handleFileSelect}
              disabled={processingStatus === 'uploading' || processingStatus === 'processing'}
              acceptedTypes={['.zip']}
              description="Drop your ZIP file here"
              fileTypeDescription="ZIP files only"
              maxSize={50}
            />
          )}

          {processingStatus !== 'completed' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-mock"
                  checked={isMock}
                  onCheckedChange={(checked) => setIsMock(checked as boolean)}
                  disabled={processingStatus === 'uploading' || processingStatus === 'processing'}
                />
                <Label htmlFor="is-mock">Mark jobs as mock data</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-published"
                  checked={isPublished}
                  onCheckedChange={(checked) => setIsPublished(checked as boolean)}
                  disabled={processingStatus === 'uploading' || processingStatus === 'processing'}
                />
                <Label htmlFor="is-published">Publish jobs immediately</Label>
              </div>
            </div>
          )}

          {processingStatus !== 'idle' && (
            <div className="space-y-4">
              <BulkJobProgress
                stats={stats}
                processingStatus={processingStatus}
                currentFile={currentFile || file?.name}
                error={error}
                unsupportedFiles={unsupportedFiles}
                organizationId={organizationId}
                onClose={handleClose}
              />
            </div>
          )}

          {error && (
            <div className="text-sm text-red-500 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          {processingStatus !== 'completed' && (
            <Button
              type="submit"
              onClick={handleUpload}
              disabled={!file || processingStatus === 'uploading' || processingStatus === 'processing'}
            >
              {processingStatus === 'uploading' || processingStatus === 'processing'
                ? "Processing..."
                : "Upload and Process"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 