"use client"

import { useState } from "react"
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
import { Upload, FileType, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from "@/lib/utils"

export default function ResumeProcessingPage() {
  const [selectedJob, setSelectedJob] = useState<string>("")
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle')
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

  const handleFileUpload = (e: React.DragEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    
    // Handle both drag and drop and file input
    const files = 'dataTransfer' in e 
      ? e.dataTransfer.files 
      : e.target.files

    if (!files || !selectedJob) return

    // Simulate file upload and processing
    setProcessingStatus('uploading')
    setStats({
      totalFiles: files.length,
      processed: 0,
      failed: 0,
      supported: files.length,
      unsupported: 0
    })

    // Simulate progress
    let progress = 0
    const interval = setInterval(() => {
      progress += 5
      setUploadProgress(progress)
      
      if (progress >= 100) {
        clearInterval(interval)
        setProcessingStatus('completed')
        setStats(prev => ({
          ...prev,
          processed: prev.totalFiles,
        }))
      }
    }, 100)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const getStatusColor = (status: typeof processingStatus) => {
    switch (status) {
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
      case 'uploading':
        return 'Uploading files...'
      case 'processing':
        return 'Processing resumes...'
      case 'completed':
        return 'Processing completed'
      case 'error':
        return 'Error processing files'
      default:
        return 'Ready to process'
    }
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
                  "cursor-pointer"
                )}
                onDrop={handleFileUpload}
                onDragOver={handleDragOver}
                onClick={() => document.getElementById('file-upload')?.click()}
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
                      {uploadProgress}%
                    </span>
                  </div>
                  <Progress value={uploadProgress} />
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
                <div className="text-2xl font-bold">{stats.totalFiles}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">PROCESSED</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-green-600">{stats.processed}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">FAILED</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-red-600">{stats.failed}</span>
                  </div>
                </div>
              </div>

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
              <Button className="w-full" variant="outline" disabled={processingStatus !== 'completed'}>
                View Processed Resumes
              </Button>
              <Button className="w-full" variant="outline" disabled={stats.failed === 0}>
                View Failed Items
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 