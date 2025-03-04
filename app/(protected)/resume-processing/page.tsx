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
import { AlertCircle, CheckCircle2, XCircle, Timer, Database, Settings2, Plus } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { getJobs, type ApiJob, type LocalizedText } from "@/app/api/jobs/client"
import { createClient } from "@/lib/supabase/client"

// Import data from shared data file
import { transformApiResponseToUiFormat, getSkillColor } from "./data"
import { FileDropzone } from "@/components/resume-evaluator/FileDropzone"

// Add new types
interface IndexStatus {
  name: string;
  document_count: number;
  created_at: string;
  status: "active" | "empty";
}

interface ProcessingStats {
  totalFiles: number
  processedCount: number
  failedCount: number
  supported: number
  unsupported: number
}

// Add back the formatTime function
const formatTime = (seconds: number): string => {
  // Handle invalid or zero time
  if (!seconds || seconds < 0) {
    return '0 seconds'
  }

  // Round to 1 decimal place for seconds
  seconds = Math.round(seconds * 10) / 10

  // Less than a minute: show seconds
  if (seconds < 60) {
    return `${seconds.toFixed(1)} second${seconds === 1 ? '' : 's'}`
  }
  
  // Less than an hour: show minutes and seconds
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  
  if (minutes < 60) {
    if (remainingSeconds === 0) {
      return `${minutes} minute${minutes === 1 ? '' : 's'}`
    }
    return `${minutes} minute${minutes === 1 ? '' : 's'} ${remainingSeconds} second${remainingSeconds === 1 ? '' : 's'}`
  }
  
  // More than an hour: show hours and minutes
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours === 1 ? '' : 's'}`
  }
  return `${hours} hour${hours === 1 ? '' : 's'} ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}`
}

// Add a utility function to generate consistent index names
const generateIndexName = (jobId: string, jobTitle: string): string => {
  const slug = jobTitle.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  return `job-${slug}-${jobId}`;
}

// Remove the exported data and keep only the component logic
export default function ResumeProcessingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const jobIdFromUrl = searchParams.get('jobId')
  const { session } = useAuth()
  const [selectedJob, setSelectedJob] = useState<ApiJob | null>(null)
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
  const [jobs, setJobs] = useState<ApiJob[]>([])
  const [isLoadingJobs, setIsLoadingJobs] = useState(true)
  const [matches, setMatches] = useState<ReturnType<typeof transformApiResponseToUiFormat>>([])

  // Fetch jobs on component mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoadingJobs(true)
        
        // First get the user's organization membership
        const supabase = createClient()
        if (!supabase) {
          setError('Failed to create Supabase client')
          setIsLoadingJobs(false)
          return
        }
        
        const { data: memberData } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', session?.user?.id)
          .single()

        if (!memberData) {
          setError('You are not a member of any organization')
          setIsLoadingJobs(false)
          return
        }

        // Then fetch jobs for that organization
        const response = await getJobs(0, 100) // Get up to 100 jobs
        const filteredJobs = response.data.filter(job => 
          job.status === 'PUBLISHED' && 
          job.organizations?.id === memberData.organization_id
        )
        setJobs(filteredJobs)
        
        // If jobId is provided in URL, select that job
        if (jobIdFromUrl) {
          const jobFromUrl = filteredJobs.find(job => job.id === jobIdFromUrl)
          if (jobFromUrl) {
            setSelectedJob(jobFromUrl)
          }
        }
        
        setIsLoadingJobs(false)
      } catch (error) {
        console.error('Error fetching jobs:', error)
        setError('Failed to load jobs')
        setIsLoadingJobs(false)
      }
    }

    if (session) {
      fetchJobs()
    }
  }, [session, jobIdFromUrl])

  const handleFileUpload = async (file: File) => {
    if (!selectedJob) {
      setError('Please select a job position')
      return
    }

    setError('')
    setProcessingStatus('uploading')
    setUploadProgress(0)
    setProcessingTime(0)  // Reset processing time

    const formData = new FormData()
    formData.append('file', file)
    formData.append('jobId', selectedJob.id)
    
    // Handle title and description which could be strings or LocalizedText objects
    const jobTitle = typeof selectedJob.title === 'string' 
      ? selectedJob.title 
      : (selectedJob.title as unknown as LocalizedText)?.fr || '';
    
    const jobDescription = typeof selectedJob.description === 'string'
      ? selectedJob.description
      : (selectedJob.description as unknown as LocalizedText)?.fr || '';
    
    formData.append('jobTitle', jobTitle)
    formData.append('jobDescription', jobDescription)

    try {
      const startProcessingTime = Date.now()
      const response = await fetch('/api/resumes', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Handle streaming response
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
              console.log('Received event:', event)

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
                  
                  if (event.matches) {
                    setMatches(transformApiResponseToUiFormat(event.matches))
                  }
                  
                  // After successful processing, update job processed data and redirect to matches page
                  if (selectedJob) {
                    // Update the job processed data
                    try {
                      await fetch(`/api/jobs/${selectedJob.id}/matches?update_stats=true&size=1`);
                    } catch (error) {
                      console.error('Error updating job processed data:', error);
                    }
                    
                    // Redirect to matches page
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
        return 'text-blue-500'
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

  // Calculate processing progress percentage
  const getProcessingProgress = () => {
    if (processingStatus === 'uploading') return uploadProgress
    if (processingStatus === 'processing') {
      return Math.floor((stats.processedCount / stats.totalFiles) * 100)
    }
    return 100
  }

  // Update the useEffect for index status
  useEffect(() => {
    const fetchIndexStatus = async (indexName: string) => {
      console.log('Fetching status for index:', indexName);
      
      try {
        const response = await fetch(`/api/indices/${indexName}/verify`);
        if (response.ok) {
          const data = await response.json();
          console.log('Index status:', data);
          setIndexStatus(data);
        } else {
          console.warn(`Failed to fetch index status: ${response.status}`);
          setIndexStatus(null);
        }
      } catch (error) {
        console.error('Error fetching index status:', error);
        setIndexStatus(null);
      }
    };

    if (selectedJob) {
      // Handle title which could be a string or LocalizedText object
      const jobTitle = typeof selectedJob.title === 'string' 
        ? selectedJob.title 
        : (selectedJob.title as unknown as LocalizedText)?.fr || '';
      
      fetchIndexStatus(generateIndexName(selectedJob.id, jobTitle));
    }
  }, [selectedJob]);

  // Replace the candidateMatches line with:
  const candidateMatches = matches;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Resume Processing</h1>
          <p className="text-muted-foreground mt-1">Upload and analyze resumes for job positions</p>
        </div>
        <Link href="/resume-processing/matches">
          <Button variant="outline" className="gap-2">
            <Database className="h-4 w-4" />
            View All Matches
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Main Upload Section */}
        <Card className="md:col-span-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Processing Configuration
            </CardTitle>
            <CardDescription>
              Configure job position and upload resumes for analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Job Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Job Position</label>
                {isLoadingJobs ? (
                  <div className="h-10 bg-muted animate-pulse rounded-md" />
                ) : jobs.length > 0 ? (
                  <Select 
                    value={selectedJob?.id} 
                    onValueChange={(value) => setSelectedJob(jobs.find(job => job.id === value) || null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select job position" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobs.map(job => {
                        const jobTitle = typeof job.title === 'string' 
                          ? job.title 
                          : (job.title as unknown as LocalizedText)?.fr || '';
                        return (
                          <SelectItem key={job.id} value={job.id}>
                            {jobTitle}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-center p-4 border rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground mb-4">No jobs available for resume processing</p>
                    <Link href="/organizations/jobs/create">
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create New Job
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-center gap-2 p-4 text-sm text-red-600 bg-red-50 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              {/* File Upload - Only show if jobs are available */}
              {jobs.length > 0 && (
                <FileDropzone
                  onFileSelect={handleFileUpload}
                  disabled={processingStatus !== 'idle'}
                  acceptedTypes={['.zip']}
                  description="Drag and drop your ZIP file here"
                  fileTypeDescription="ZIP files only"
                  maxSize={500}
                />
              )}

              {/* Processing Status */}
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
            </div>
          </CardContent>
        </Card>

        {/* Stats Section */}
        <div className="md:col-span-4 space-y-6">
          {/* Processing Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Processing Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Files</p>
                    <p className="text-2xl font-bold">{stats.totalFiles}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Processed</p>
                    <p className="text-2xl font-bold text-green-600">{stats.processedCount}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Failed</p>
                    <p className="text-2xl font-bold text-red-600">{stats.failedCount}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Processing Time</p>
                    <p className="text-2xl font-bold">{formatTime(processingTime)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Index Status */}
          {indexStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Index Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant={indexStatus.status === 'active' ? 'default' : 'secondary'}>
                        {indexStatus.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Documents</span>
                      <span className="font-medium">{indexStatus.document_count}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Created</span>
                      <span className="font-medium">
                        {new Date(indexStatus.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Matches Section */}
      {processingStatus === 'completed' && candidateMatches.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Matches</CardTitle>
              <CardDescription>Best matching candidates for the position</CardDescription>
            </div>
            <Link href="/resume-processing/matches">
              <Button variant="outline" size="sm">View All Matches</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div 
              id="matches-container"
              className="overflow-x-auto hide-scrollbar scroll-smooth"
            >
              <div className="grid grid-flow-col auto-cols-[minmax(300px,_1fr)] gap-4 pb-4">
                {candidateMatches.map((candidate) => (
                  <Card key={candidate.id} className="border-0 shadow-md">
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
                          <p className="text-sm line-clamp-2">
                            {candidate.summary}
                          </p>
                        </div>

                        <div className="space-y-2.5">
                          <p className="text-sm font-medium">Top Skills</p>
                          {Object.entries(candidate.skillRatings).slice(0, 3).map(([skill, score]) => (
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
                              {candidate.otherMatches.slice(0, 2).map(match => (
                                <Badge 
                                  key={match.jobTitle} 
                                  variant="outline"
                                  className="text-xs font-normal"
                                >
                                  {match.jobTitle} ({match.score}%)
                                </Badge>
                              ))}
                              {candidate.otherMatches.length > 2 && (
                                <Badge variant="outline" className="text-xs font-normal">
                                  +{candidate.otherMatches.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 