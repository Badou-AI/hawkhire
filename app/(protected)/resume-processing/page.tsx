"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Upload, FileType, AlertCircle, CheckCircle2, XCircle, Timer } from 'lucide-react'
import { cn } from "@/lib/utils"

// Simulated processing speeds (ms)
const UPLOAD_SPEED = 50 // Time per % of upload
const PROCESS_SPEED = 20 // Time per CV
const COUNT_FILES_DURATION = 2000 // Time to count files in ZIP
const TOTAL_FILES = 1000 // Constant for total files

const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds.toFixed(1)} seconds`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes} minute${minutes > 1 ? 's' : ''} ${remainingSeconds.toFixed(0)} seconds`
}

export default function ResumeProcessingPage() {
  const [selectedJob, setSelectedJob] = useState<string>("")
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'counting' | 'uploading' | 'processing' | 'completed' | 'error'>('idle')
  const [startTime, setStartTime] = useState<number>(0)
  const [processingTime, setProcessingTime] = useState<number>(0)
  const [stats, setStats] = useState({
    totalFiles: 0,
    processed: 0,
    failed: 0,
    supported: 0,
    unsupported: 0
  })

  // Mock jobs data - replace with actual API call
  const jobs = [
    { id: "1", title: "Full Stack Developer" },
    { id: "2", title: "UI/UX Designer" },
    { id: "3", title: "Data Analyst" },
  ]

  // Simulate processing of CVs
  const simulateProcessing = () => {
    let processedCount = 0
    let failedCount = 0
    let supportedCount = 0
    let unsupportedCount = 0
    setStartTime(Date.now()) // Start timing
    
    const processInterval = setInterval(() => {
      // Simulate random success/failure for each batch
      const batchSize = Math.floor(Math.random() * 5) + 1
      const newProcessed = Math.min(processedCount + batchSize, TOTAL_FILES)
      const newFailed = Math.floor(Math.random() * (batchSize * 0.2))
      
      processedCount = newProcessed
      failedCount += newFailed
      supportedCount = processedCount - failedCount
      unsupportedCount = Math.floor(Math.random() * (processedCount * 0.05))

      setStats(prev => ({
        ...prev,
        processed: processedCount,
        failed: failedCount,
        supported: supportedCount,
        unsupported: unsupportedCount
      }))

      if (processedCount >= TOTAL_FILES) {
        clearInterval(processInterval)
        setProcessingStatus('completed')
        setProcessingTime((Date.now() - startTime) / 1000)
      }
    }, PROCESS_SPEED)

    return () => clearInterval(processInterval)
  }

  const handleFileUpload = (e: React.DragEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    
    if (!selectedJob) return

    // First, simulate counting files in the ZIP
    setProcessingStatus('counting')
    setStats({
      totalFiles: 0,
      processed: 0,
      failed: 0,
      supported: 0,
      unsupported: 0
    })
    
    // Simulate ZIP extraction and file counting
    setTimeout(() => {
      setStats(prev => ({
        ...prev,
        totalFiles: TOTAL_FILES
      }))
      
      // Then start upload simulation
      setProcessingStatus('uploading')
      let progress = 0
      const uploadInterval = setInterval(() => {
        progress += 1
        setUploadProgress(progress)
        
        if (progress >= 100) {
          clearInterval(uploadInterval)
          setProcessingStatus('processing')
          simulateProcessing()
        }
      }, UPLOAD_SPEED)
    }, COUNT_FILES_DURATION)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const getStatusColor = (status: typeof processingStatus) => {
    switch (status) {
      case 'counting':
      case 'uploading':
      case 'processing':
        return 'text-blue-500'
      case 'completed':
        return 'text-green-500'
      case 'error':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusMessage = (status: typeof processingStatus) => {
    switch (status) {
      case 'counting':
        return 'Counting files in ZIP...'
      case 'uploading':
        return 'Uploading files...'
      case 'processing':
        return `Processing resumes (${stats.processed}/${stats.totalFiles})`
      case 'completed':
        return `Processing completed in ${formatTime(processingTime)}`
      case 'error':
        return 'Error processing files'
      default:
        return 'Ready to process'
    }
  }

  // Calculate processing progress percentage
  const getProcessingProgress = () => {
    if (processingStatus === 'uploading') return uploadProgress
    if (processingStatus === 'processing') {
      return Math.floor((stats.processed / stats.totalFiles) * 100)
    }
    return 100
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Resume Processing</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Upload Resumes</CardTitle>
            <CardDescription>
              Upload a ZIP file containing resumes in PDF, DOC, or DOCX format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job position" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map(job => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center space-y-4",
                  "hover:border-primary/50 transition-colors",
                  processingStatus === 'idle' ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                )}
                onDrop={processingStatus === 'idle' ? handleFileUpload : undefined}
                onDragOver={handleDragOver}
                onClick={() => {
                  if (processingStatus === 'idle') {
                    document.getElementById('file-upload')?.click()
                  }
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-lg font-medium">Drag and drop your ZIP file here</p>
                    <p className="text-sm text-muted-foreground">or click to browse</p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileType className="h-4 w-4" />
                    <span>ZIP files only</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>Max size: 500MB</span>
                  </div>
                </div>

                <input
                  id="file-upload"
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={processingStatus !== 'idle'}
                />
              </div>

              {processingStatus !== 'idle' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {processingStatus === 'completed' ? (
                        <CheckCircle2 className={getStatusColor(processingStatus)} />
                      ) : processingStatus === 'error' ? (
                        <XCircle className={getStatusColor(processingStatus)} />
                      ) : (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                      )}
                      <span className={cn("text-sm font-medium", getStatusColor(processingStatus))}>
                        {getStatusMessage(processingStatus)}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {getProcessingProgress()}%
                    </span>
                  </div>
                  <Progress value={getProcessingProgress()} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Processing Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">TOTAL FILES</div>
                <div className="text-2xl font-bold">
                  {processingStatus === 'counting' ? (
                    <span className="text-muted-foreground">Counting...</span>
                  ) : stats.totalFiles}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">PROCESSED</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-green-600">{stats.processed}</span>
                    {processingStatus === 'processing' && (
                      <span className="text-xs text-muted-foreground">
                        {((stats.processed / stats.totalFiles) * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">FAILED</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-red-600">{stats.failed}</span>
                    {stats.failed > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {((stats.failed / stats.totalFiles) * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {processingStatus === 'completed' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                  <Timer className="h-4 w-4" />
                  <span>Processed {stats.totalFiles} files in {formatTime(processingTime)}</span>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Badge variant="secondary" className="mb-2">Supported</Badge>
                    <div className="text-xl font-bold">{stats.supported}</div>
                  </div>
                  <div>
                    <Badge variant="destructive" className="mb-2">Unsupported</Badge>
                    <div className="text-xl font-bold">{stats.unsupported}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full" 
                variant="outline" 
                disabled={processingStatus !== 'completed'}
              >
                View Processed Resumes ({stats.supported})
              </Button>
              <Button 
                className="w-full" 
                variant="outline" 
                disabled={stats.failed === 0}
              >
                View Failed Items ({stats.failed})
              </Button>
              <Button 
                className="w-full" 
                variant="outline" 
                disabled={stats.unsupported === 0}
              >
                View Unsupported Files ({stats.unsupported})
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 