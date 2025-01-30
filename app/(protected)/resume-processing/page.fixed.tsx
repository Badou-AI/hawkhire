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
import { AlertCircle, CheckCircle2, XCircle, Timer, ChevronLeft, ChevronRight, Database, Settings2 } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FileDropzone } from "@/components/resume-evaluator/FileDropzone"

// Import data and types from shared data file
import { jobs, transformApiResponseToUiFormat, getSkillColor, type Job, type CandidateMatch } from "./data"

interface IndexStatus {
  name: string
  document_count: number
  created_at: string
  status: "active" | "empty"
}

interface ProcessingStats {
  totalFiles: number
  processedCount: number
  failedCount: number
  supported: number
  unsupported: number
}

export default function ResumeProcessingPage() {
  const router = useRouter()
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle')
  const [processingTime, setProcessingTime] = useState<number>(0)
  const [stats, setStats] = useState<ProcessingStats>({
    totalFiles: 0,
    processedCount: 0,
    failedCount: 0,
    supported: 0,
    unsupported: 0
  })
  const [indexStatus, setIndexStatus] = useState<IndexStatus | null>(null)
  const [error, setError] = useState<string>("")
  const [candidateMatches, setCandidateMatches] = useState<CandidateMatch[]>([])

  useEffect(() => {
    const fetchIndexStatus = async (indexName: string) => {
      try {
        const response = await fetch(`/api/indices/${indexName}/verify`)
        if (response.ok) {
          const data = await response.json()
          setIndexStatus(data)
        } else {
          setIndexStatus(null)
        }
      } catch (error) {
        console.error('Error fetching index status:', error)
        setIndexStatus(null)
      }
    }

    if (selectedJob) {
      const slug = selectedJob.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      fetchIndexStatus(`job-${slug}-${selectedJob.id}`)
    }
  }, [selectedJob])

  const handleFileUpload = async (file: File) => {
    if (!selectedJob) {
      setError('Please select a job position')
      return
    }

    setError('')
    setProcessingStatus('uploading')
    setUploadProgress(0)
    setProcessingTime(0)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('jobId', selectedJob.id.toString())
    formData.append('jobTitle', selectedJob.title)

    try {
      const startProcessingTime = Date.now()
      const response = await fetch('/api/resumes', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No reader available')
      }

      const decoder = new TextDecoder()
      let buffer = ''

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

              switch (event.event) {
                case 'processing_started':
                  setProcessingStatus('processing')
                  setStats(prev => ({
                    ...prev,
                    totalFiles: event.total_files
                  }))
                  break

                case 'file_processed':
                  setStats(prev => ({
                    ...prev,
                    processedCount: event.processed_count,
                    failedCount: event.failed_count,
                    supported: prev.supported + 1
                  }))
                  break

                case 'file_failed':
                  setStats(prev => ({
                    ...prev,
                    failedCount: event.failed_count
                  }))
                  break

                case 'completed':
                  const processingDuration = (Date.now() - startProcessingTime) / 1000
                  setProcessingTime(processingDuration)
                  setProcessingStatus('completed')
                  setStats(prev => ({
                    ...prev,
                    processedCount: event.processed_count,
                    failedCount: event.failed_count,
                    supported: event.processed_count,
                    unsupported: event.total_files - event.processed_count - event.failed_count
                  }))
                  
                  // Set candidate matches from the completed event
                  if (event.matches) {
                    setCandidateMatches(transformApiResponseToUiFormat(event.matches))
                  }
                  
                  // After successful processing, redirect to matches page
                  if (selectedJob) {
                    router.push(`/resume-processing/matches?jobId=${selectedJob.id}`)
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
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'Failed to process file')
      setProcessingStatus('error')
    }
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
        return `Uploading files... ${uploadProgress}%`
      case 'processing':
        return `Processing resumes (${stats.processedCount}/${stats.totalFiles})`
      case 'completed':
        return `Processing completed in ${formatTime(processingTime)}`
      case 'error':
        return 'Error processing files: Invalid file format detected'
      default:
        return 'Ready to process'
    }
  }

  const getProcessingProgress = () => {
    if (processingStatus === 'uploading') return uploadProgress
    if (processingStatus === 'processing') {
      return Math.floor((stats.processedCount / stats.totalFiles) * 100)
    }
    return 100
  }

  const formatTime = (seconds: number): string => {
    if (!seconds || seconds < 0) return '0 seconds'
    seconds = Math.round(seconds * 10) / 10
    if (seconds < 60) return `${seconds.toFixed(1)} second${seconds === 1 ? '' : 's'}`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    if (minutes < 60) {
      if (remainingSeconds === 0) return `${minutes} minute${minutes === 1 ? '' : 's'}`
      return `${minutes} minute${minutes === 1 ? '' : 's'} ${remainingSeconds} second${remainingSeconds === 1 ? '' : 's'}`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) return `${hours} hour${hours === 1 ? '' : 's'}`
    return `${hours} hour${hours === 1 ? '' : 's'} ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}`
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
              <Select 
                value={selectedJob?.title} 
                onValueChange={(value) => setSelectedJob(jobs.find(job => job.title === value) || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select job position" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map(job => (
                    <SelectItem key={job.id} value={job.title}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {error && (
                <div className="flex items-center gap-2 p-4 text-sm text-red-600 bg-red-50 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <FileDropzone
                onFileSelect={handleFileUpload}
                disabled={processingStatus !== 'idle'}
                acceptedTypes={['.zip']}
                description="Drag and drop your ZIP file here"
                fileTypeDescription="ZIP files only"
                maxSize={500}
              />

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

              {processingStatus === 'completed' && candidateMatches.length > 0 && (
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
                        <Card key={candidate.id}>
                          <CardContent className="p-4">
                            <div className="space-y-4">
                              <div className="flex items-start gap-3">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={candidate.avatar} alt={candidate.name} />
                                  <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-semibold">{candidate.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {candidate.experience}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between py-2.5 px-3 bg-muted rounded-lg">
                                <span className="text-sm font-medium">Match Score</span>
                                <span className="text-2xl font-bold text-green-600">
                                  {candidate.matchScore}%
                                </span>
                              </div>

                              <div>
                                <p className="text-sm">
                                  {candidate.summary}
                                </p>
                              </div>

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
                  {processingStatus === 'idle' ? (
                    <span className="text-muted-foreground">Ready to process</span>
                  ) : stats.totalFiles}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">PROCESSED</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-green-600">{stats.processedCount}</span>
                    {processingStatus === 'processing' && (
                      <span className="text-xs text-muted-foreground">
                        {((stats.processedCount / stats.totalFiles) * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">FAILED</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-red-600">{stats.failedCount}</span>
                    {stats.failedCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {((stats.failedCount / stats.totalFiles) * 100).toFixed(1)}%
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
                disabled={stats.failedCount === 0}
              >
                View Failed Items ({stats.failedCount})
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

          {selectedJob && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Index Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {indexStatus ? (
                  <>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">INDEX NAME</div>
                      <div className="text-sm font-medium truncate">{indexStatus.name}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">DOCUMENTS</div>
                        <div className="text-xl font-bold">{indexStatus.document_count}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">STATUS</div>
                        <Badge variant={indexStatus.status === 'active' ? 'default' : 'secondary'}>
                          {indexStatus.status}
                        </Badge>
                      </div>
                    </div>

                    {indexStatus.created_at && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                        <Settings2 className="h-4 w-4" />
                        <span>Created {new Date(indexStatus.created_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No index information available
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 