"use client"

import { useState } from "react"
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

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    setError("")
    setProcessingStatus('idle')
    setStats({
      totalFiles: 0,
      processedCount: 0,
      failedCount: 0,
      processingTime: 0,
      unsupportedCount: 0
    })
  }

  const handleUpload = async () => {
    if (!file) return

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

      const response = await fetch("/api/jobs/process-zip", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to process jobs")
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No reader available')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      const startTime = Date.now()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim()
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6))
              console.log('Received event:', event)

              switch (event.event) {
                case 'processing_started':
                  setProcessingStatus('processing')
                  setStats(prev => ({
                    ...prev,
                    totalFiles: event.total_files,
                    unsupportedCount: event.unsupported_files?.length || 0
                  }))
                  if (event.unsupported_files?.length) {
                    setUnsupportedFiles(event.unsupported_files)
                  }
                  break

                case 'file_processing_complete':
                case 'file_processing_failed':
                case 'job_created':
                case 'job_creation_failed':
                  setStats(prev => ({
                    ...prev,
                    processedCount: event.processed_count,
                    failedCount: event.failed_count,
                    processingTime: (Date.now() - startTime) / 1000
                  }))
                  break

                case 'batch_completed':
                  setProcessingStatus('completed')
                  setStats(prev => ({
                    ...prev,
                    processedCount: event.processed_count,
                    failedCount: event.failed_count,
                    processingTime: event.processing_details.total_time,
                    unsupportedCount: event.unsupported_files?.length || 0
                  }))
                  
                  if (event.processed_count > 0) {
                    toast.success(`Successfully processed ${event.processed_count} jobs`)
                  }
                  if (event.failed_count > 0) {
                    toast.error(`Failed to process ${event.failed_count} jobs`)
                  }
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
      const message = error instanceof Error ? error.message : "Failed to process jobs"
      setError(message)
      setProcessingStatus('error')
      toast.error(message)
    }
  }

  return (
    <Dialog>
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
          <FileDropzone
            onFileSelect={handleFileSelect}
            disabled={processingStatus === 'uploading' || processingStatus === 'processing'}
            acceptedTypes={['.zip']}
            description="Drop your ZIP file here"
            fileTypeDescription="ZIP files only"
            maxSize={50}
          />

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

          {processingStatus !== 'idle' && (
            <div className="space-y-4">
              <BulkJobProgress
                stats={stats}
                processingStatus={processingStatus}
                currentFile={file?.name}
                error={error}
                unsupportedFiles={unsupportedFiles}
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
          <Button
            type="submit"
            onClick={handleUpload}
            disabled={!file || processingStatus === 'uploading' || processingStatus === 'processing'}
          >
            {processingStatus === 'uploading' || processingStatus === 'processing'
              ? "Processing..."
              : "Upload and Process"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 