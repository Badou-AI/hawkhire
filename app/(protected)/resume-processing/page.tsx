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
import { Upload, FileType, AlertCircle, CheckCircle2, XCircle, Timer, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"

const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds.toFixed(1)} seconds`
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  
  if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (hours < 24) {
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`
  }
  
  return `${hours} hour${hours > 1 ? 's' : ''}`
}

// Import data from shared data file
import { jobs, candidateMatches, getSkillColor } from "./data"

// Remove the exported data and keep only the component logic
export default function ResumeProcessingPage() {
  const [selectedJob, setSelectedJob] = useState<string>("")
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'counting' | 'uploading' | 'processing' | 'completed' | 'error'>('idle')
  const [processingTime, setProcessingTime] = useState<number>(0)
  const [stats, setStats] = useState({
    totalFiles: 0,
    processed: 0,
    failed: 0,
    supported: 0,
    unsupported: 0
  })

  const handleFileUpload = async (e: React.DragEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    
    if (!selectedJob) return

    // Get the file
    let file: File | null = null
    if ('dataTransfer' in e && e.dataTransfer?.files?.length > 0) {
      file = e.dataTransfer.files[0]
    } else if ('target' in e && e.target instanceof HTMLInputElement && e.target.files) {
      const fileList = e.target.files
      if (fileList.length > 0) {
        file = fileList[0]
      }
    }

    if (!file) {
      setProcessingStatus('error')
      return
    }

    // Reset states
    setProcessingStatus('counting')
    setProcessingTime(0)
    setUploadProgress(0)
    setStats({
      totalFiles: 0,
      processed: 0,
      failed: 0,
      supported: 0,
      unsupported: 0
    })

    try {
      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      formData.append('jobId', selectedJob)

      // Start upload with progress tracking
      setProcessingStatus('uploading')
      const startTime = Date.now()

      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/resumes')

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100
          setUploadProgress(Math.round(progress))
        }
      }

      xhr.onload = async () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText)
          setStats({
            totalFiles: data.total_files,
            processed: data.total_files,
            failed: 0,
            supported: data.total_files,
            unsupported: 0
          })
          setProcessingStatus('completed')
          setProcessingTime((Date.now() - startTime) / 1000)
        } else {
          throw new Error('Upload failed')
        }
      }

      xhr.onerror = () => {
        throw new Error('Upload failed')
      }

      xhr.send(formData)
    } catch (error) {
      console.error('Error uploading file:', error)
      setProcessingStatus('error')
    }
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
        return `Uploading files... ${uploadProgress}%`
      case 'processing':
        return `Processing resumes (${stats.processed}/${stats.totalFiles})`
      case 'completed':
        return `Processing completed in ${formatTime(processingTime)}`
      case 'error':
        return 'Error processing files: Invalid file format detected'
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
        <h1 className="text-2xl font-bold">Resume Processing</h1>
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
                    {processingStatus !== 'error' && (
                      <span className="text-sm text-muted-foreground">
                        {getProcessingProgress()}%
                      </span>
                    )}
                  </div>
                  {processingStatus !== 'error' && <Progress value={getProcessingProgress()} />}
                </div>
              )}

              {processingStatus === 'completed' && (
                <div className="pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Top Matches</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            const container = document.getElementById('matches-container')
                            if (container) {
                              container.scrollLeft -= container.clientWidth / 3
                            }
                          }}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            const container = document.getElementById('matches-container')
                            if (container) {
                              container.scrollLeft += container.clientWidth / 3
                            }
                          }}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <Link href="/resume-processing/matches" className="inline-block">
                        <Button variant="outline" size="sm">View All</Button>
                      </Link>
                    </div>
                  </div>
                  <div 
                    id="matches-container"
                    className="overflow-x-auto hide-scrollbar scroll-smooth"
                  >
                    <div className="grid grid-flow-col auto-cols-[calc(33.33%-0.75rem)] gap-3 pb-4">
                      {candidateMatches.map((candidate) => (
                        <Card key={candidate.name}>
                          <CardContent className="p-4">
                            <div className="space-y-4">
                              {/* Header with avatar and name */}
                              <div className="flex items-start gap-3">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={candidate.avatar} alt={candidate.name} />
                                  <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-semibold">{candidate.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {candidate.experience} experience
                                  </p>
                                </div>
                              </div>

                              {/* Match Score */}
                              <div className="flex items-center justify-between py-2.5 px-3 bg-muted rounded-lg">
                                <span className="text-sm font-medium">Match Score</span>
                                <span className="text-2xl font-bold text-green-600">
                                  {candidate.matchScore}%
                                </span>
                              </div>

                              {/* Summary */}
                              <div>
                                <p className="text-sm">
                                  {candidate.summary}
                                </p>
                              </div>

                              {/* Skill Stats */}
                              <div className="space-y-2.5">
                                <p className="text-sm font-medium">Skill Assessment</p>
                                {Object.entries(candidate.skillRatings).map(([skill, score]) => (
                                  <div key={skill} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span className="font-medium">{skill}</span>
                                      <span className="text-muted-foreground">{score}%</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-secondary">
                                      <div 
                                        className={cn("h-full rounded-full transition-all", getSkillColor(score))}
                                        style={{ width: `${score}%` }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Other Job Matches */}
                              {candidate.otherMatches && candidate.otherMatches.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium mb-2">Also Suitable For</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {candidate.otherMatches.map(match => (
                                      <Badge 
                                        key={match.jobTitle} 
                                        variant="outline"
                                        className="text-xs font-normal"
                                      >
                                        {match.jobTitle} ({match.score}%)
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
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