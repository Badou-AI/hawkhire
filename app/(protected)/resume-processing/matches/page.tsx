"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import {
  ChevronLeft,
  Calendar,
  Clock,
  Users,
  Briefcase,
  Star,
  CheckCircle2, LayoutList,
  Table as TableIcon,
  LayoutGrid,
  Send,
  Bot,
  Plus,
  Printer,
  Grid,
  List,
  Search,
  Filter,
  X
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useState, useEffect, useMemo, useRef } from "react"
import { usePipelineStore } from '@/lib/store/pipeline-store'
import { PipelineStatus } from '@/components/pipeline-status'
import { useSearchParams } from "next/navigation"
import { Pagination } from '@/components/shared/pagination'
import { getJob, type ApiJob } from "@/app/api/jobs/client"

// Import data from shared data file
import { transformApiResponseToUiFormat, getSkillColor } from "../data"

interface JobStats {
  totalCandidates: number;
  shortlisted: number;
  averageMatchScore: number;
  averageExperience: number;
  lastProcessed?: string;
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  
  try {
    const date = new Date(dateString)
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date'
    }
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid Date'
  }
}

// Add pagination config
const ITEMS_PER_PAGE = 50

// Define the candidate type to fix type errors
interface Candidate {
  id: string;
  name: string;
  avatar: string;
  matchScore: number;
  role: string;
  experience: string;
  mainSkillScore: number;
  skillRatings: { [key: string]: number };
  summary: string;
  stage: string;
  otherMatches: Array<{ jobTitle: string; score: number }>;
}

// Add TypeScript declaration for the window.testPrint property
declare global {
  interface Window {
    testPrint?: () => void;
  }
}

export default function MatchesPage() {
  const searchParams = useSearchParams()
  const { addCandidate, candidates } = usePipelineStore()
  const [currentJob, setCurrentJob] = useState<ApiJob | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'simple' | 'detailed' | 'table' | 'grid'>('grid')
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [showDetails, setShowDetails] = useState(false)
  const [candidateMatches, setCandidateMatches] = useState<Candidate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [jobStats, setJobStats] = useState<JobStats | null>(null)
  const [showShortlisted, setShowShortlisted] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Add a ref for the print button
  const printButtonRef = useRef<HTMLButtonElement>(null);

  // Fetch job data
  useEffect(() => {
    console.log('Fetching job data...');
    const fetchJob = async () => {
      const jobId = searchParams.get('jobId')
      if (!jobId) return

      try {
        const jobData = await getJob(jobId)
        if (jobData) {
          setCurrentJob(jobData as unknown as ApiJob)
        }
      } catch (error) {
        console.error('Error fetching job:', error)
      }
    }

    fetchJob()
  }, [searchParams])

  // Fetch candidates and stats
  useEffect(() => {
    const fetchCandidatesAndStats = async () => {
      if (!currentJob?.id) {
        console.log('Waiting for job data to load...');
        return;
      } else {
        console.log('Job data loaded:', currentJob);
      }

      try {
        setIsLoading(true);
        
        // Use the new endpoint to fetch matches
        const response = await fetch(`/api/jobs/${currentJob.id}/matches?exclude_fields=embedding`);
        if (!response.ok) {
          throw new Error('Failed to fetch candidates');
        }

        const { documents, total } = await response.json()
        console.log(documents)
        // The data comes in the format { matches: [], total: number }
        const transformedData = documents ? transformApiResponseToUiFormat(documents) : []
        // Sort candidates by match score in descending order
        const sortedData = transformedData.sort((a, b) => b.matchScore - a.matchScore)
        setCandidateMatches(sortedData)

        // Count shortlisted candidates (those with match score >= 80%)
        const shortlistedCandidates = sortedData.filter(c => c.matchScore >= 80);
        const shortlistedCount = shortlistedCandidates.length;
        console.log(`Auto-shortlisted ${shortlistedCount} candidates with match scores >= 80%`);
        
        // Automatically add shortlisted candidates to the pipeline
        shortlistedCandidates.forEach(candidate => {
          addCandidate({
            id: candidate.id,
            name: candidate.name,
            role: candidate.role,
            score: candidate.matchScore,
            imageUrl: candidate.avatar
          });
        });
        console.log(`Added ${shortlistedCount} shortlisted candidates to the pipeline`);

        // Calculate stats
        const stats: JobStats = {
          totalCandidates: total || transformedData.length,
          shortlisted: shortlistedCount,
          averageMatchScore: calculateAverageMatchScore(sortedData),
          averageExperience: calculateAverageExperience(sortedData),
          lastProcessed: new Date().toISOString()
        }
        setJobStats(stats)
      } catch (error) {
        console.error('Error fetching candidates:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCandidatesAndStats()
  }, [currentJob, addCandidate])

  const calculateAverageExperience = (candidates: Candidate[]): number => {
    const experienceValues = candidates
      .map(c => parseFloat(c.experience.replace(' years', '')))
      .filter(v => !isNaN(v))
    
    if (experienceValues.length === 0) return 0
    
    const average = experienceValues.reduce((a, b) => a + b, 0) / experienceValues.length
    return average
  }

  const calculateAverageMatchScore = (candidates: Candidate[]): number => {
    if (candidates.length === 0) return 0
    const sum = candidates.reduce((acc, curr) => acc + curr.matchScore, 0)
    return Math.round(sum / candidates.length)
  }

  // Helper function for match score color
  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  // Helper function for match score variant
  const getMatchScoreVariant = (score: number): "default" | "outline" | "secondary" => {
    if (score >= 80) return "default"
    if (score >= 70) return "secondary"
    return "outline"
  }

  // Add the missing getMatchLabel function
  const getMatchLabel = (score: number): string => {
    if (score >= 90) return "Excellent Match"
    if (score >= 80) return "Good Match"
    if (score >= 70) return "Fair Match"
    return "Poor Match"
  }

  // Filter candidates based on the showShortlisted toggle
  const filteredCandidates = useMemo(() => {
    let filtered = candidateMatches;
    
    // Filter by shortlisted status if enabled
    if (showShortlisted) {
      filtered = filtered.filter(candidate => candidate.matchScore >= 80);
    }
    
    // Filter by search query if present
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(candidate => 
        candidate.name.toLowerCase().includes(query) || 
        candidate.role.toLowerCase().includes(query) ||
        candidate.summary.toLowerCase().includes(query) ||
        Object.keys(candidate.skillRatings).some(skill => 
          skill.toLowerCase().includes(query)
        )
      );
    }
    
    return filtered;
  }, [candidateMatches, showShortlisted, searchQuery]);

  // Calculate pagination values based on filtered candidates
  const totalPages = Math.ceil(filteredCandidates.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentCandidates = filteredCandidates?.slice(startIndex, endIndex) || []

  // Reset to page 1 when toggling the filter to avoid empty pages
  useEffect(() => {
    setCurrentPage(1);
  }, [showShortlisted, searchQuery]);

  // Add a useEffect to ensure pagination is properly initialized
  useEffect(() => {
    if (filteredCandidates.length > 0) {
      const maxPage = Math.ceil(filteredCandidates.length / ITEMS_PER_PAGE)
      if (currentPage > maxPage) {
        setCurrentPage(1)
      }
    }
  }, [filteredCandidates, currentPage])

  // Add a function to handle adding a candidate to the pipeline
  const handleAddCandidate = (candidate: Candidate) => {
    addCandidate({
      id: candidate.id,
      name: candidate.name,
      role: candidate.role,
      score: candidate.matchScore,
      imageUrl: candidate.avatar
    })
  }

  const renderCandidateCard = (candidate: typeof candidateMatches[0]) => {
    // Check if candidate is already shortlisted (match score >= 80%)
    const isShortlisted = candidate.matchScore >= 80;
    const isInPipeline = !!candidates[candidate.id];
    
    return (
      <div className="flex items-start gap-6">
        {/* Left section: Avatar and basic info */}
        <div className="flex items-start gap-4 flex-[2]">
          <Avatar className="h-12 w-12 print:hidden">
            <AvatarImage src={candidate.avatar} alt={candidate.name} />
            <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1 min-w-[200px]">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{candidate.name}</h4>
              <span className="text-sm text-muted-foreground">
                {candidate.experience} experience
              </span>
              {isShortlisted && (
                <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 print:hidden">Shortlisted</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground col-span-2">
              {candidate.summary}
            </p>
            {isInPipeline ? (
              <div className="mt-2 print:hidden">
                <PipelineStatus currentStage={candidates[candidate.id].stage} />
              </div>
            ) : (
              <Button
                onClick={() => handleAddCandidate(candidate)}
                variant={isShortlisted ? "default" : "outline"}
                size="sm"
                className="gap-2 mt-2 h-7 text-xs print:hidden"
              >
                <Plus className="h-3 w-3" />
                Add to Pipeline
              </Button>
            )}
          </div>
        </div>

        {/* Center section: Key skills */}
        <div className="flex-1 print:hidden">
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            {Object.entries(candidate.skillRatings)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 6)
              .map(([skill, score]) => (
                <div key={skill} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium truncate mr-2">{skill}</span>
                    <span className="text-muted-foreground shrink-0">{score}%</span>
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
        </div>

        {/* Right section: Match score and actions */}
        <div className="flex flex-col items-end gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <span className={cn("text-3xl font-bold match-score", getMatchScoreColor(candidate.matchScore))}>
              {candidate.matchScore}%
            </span>
            <Badge variant={getMatchScoreVariant(candidate.matchScore)} className="match-score-label">Match Score</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">View Profile</Button>
            <Button size="sm">Contact</Button>
          </div>
        </div>
        
        {/* Print-only version with simplified layout using Tailwind print modifiers */}
        <div className="hidden print:block print:w-full">
          <div className="print:flex print:justify-between print:items-center print:mb-2">
            <span className="print:font-bold print:text-lg">{candidate.name}</span>
            <span className="print:italic print:text-gray-600">{candidate.experience}</span>
            {isShortlisted && <span className="print:font-bold print:text-green-600 print:mx-2">Shortlisted</span>}
            <span className="print:font-bold print:text-lg">{candidate.matchScore}%</span>
          </div>
          <div className="print:italic print:text-gray-600 print:mb-2">
            {candidate.summary}
          </div>
          <div className="print:flex print:flex-wrap print:gap-1 print:mt-2">
            {Object.entries(candidate.skillRatings)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 6)
              .map(([skill, score]) => (
                <span 
                  key={skill}
                  className={cn(
                    "print:inline-block print:px-2 print:py-1 print:m-1 print:text-xs print:border print:border-gray-200",
                    score >= 90 ? "print:border-l-4 print:border-l-green-500" : 
                    score >= 80 ? "print:border-l-4 print:border-l-blue-500" : 
                    score >= 70 ? "print:border-l-4 print:border-l-yellow-500" : 
                    "print:border-l-4 print:border-l-red-500"
                  )}
                >
                  {skill}: {score}%
                </span>
              ))}
          </div>
        </div>
      </div>
    )
  }

  const sampleQuestions = [
    "Show me candidates with React experience above 90%",
    "Who has the most years of experience?",
    "Find candidates who know both Python and JavaScript",
    "Which candidates are available to start within 2 weeks?",
    "Show remote-only candidates with salary expectations under $130k"
  ]

  // Calculate job stats
  useEffect(() => {
    if (candidateMatches.length > 0) {
      const totalScore = candidateMatches.reduce((sum, candidate) => sum + candidate.matchScore, 0)
      const totalExperience = candidateMatches.reduce((sum, candidate) => {
        const exp = parseInt(candidate.experience) || 0
        return sum + exp
      }, 0)
      
      // Count shortlisted candidates (80% or higher match score)
      // This implements the automatic shortlisting feature - candidates with match scores of 80% or higher
      // are automatically added to the shortlist and can be filtered using the toggle
      const shortlistedCount = candidateMatches.filter(candidate => candidate.matchScore >= 80).length
      
      setJobStats({
        totalCandidates: candidateMatches.length,
        shortlisted: shortlistedCount,
        averageMatchScore: Math.round(totalScore / candidateMatches.length),
        averageExperience: Math.round(totalExperience / candidateMatches.length * 10) / 10,
        lastProcessed: new Date().toISOString()
      })
    }
  }, [candidateMatches])

  // Function to handle print button click
  const handlePrint = (event: React.MouseEvent) => {
    console.log('Print button clicked');
    
    // Prevent React's synthetic event from interfering
    event.preventDefault();
    event.stopPropagation();
    
    // Use a small timeout to ensure the event is fully processed
    setTimeout(() => {
      try {
        console.log('Calling window.print() directly');
        window.print();
        console.log('Print dialog should now be visible');
      } catch (error) {
        console.error('Error showing print dialog:', error);
      }
    }, 0);
  };

  // Add back the handlePageChange function
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top when changing pages
    window.scrollTo(0, 0)
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Single unified header - only visible in regular view */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/resume-processing" className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{currentJob?.title || 'Job Matches'}</h1>
            <p className="text-sm text-muted-foreground">
              {jobStats ? `${jobStats.totalCandidates} candidates, ${jobStats.shortlisted} shortlisted` : 'Loading...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Sheet open={chatOpen} onOpenChange={setChatOpen}>
            <SheetTrigger asChild>
              <Button variant="default" className="gap-2">
                <Bot className="h-4 w-4" />
                Ask AI Assistant
              </Button>
            </SheetTrigger>
            <SheetContent 
              className="w-[800px] sm:w-full sm:max-w-full lg:w-[750px] flex flex-col p-0 max-w-full"
              side="right"
            >
              <SheetHeader className="p-6 border-b">
                <SheetTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI Assistant
                </SheetTitle>
                <SheetDescription>
                  Ask questions about the candidates in natural language
                </SheetDescription>
              </SheetHeader>
              
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Try asking about:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {sampleQuestions.map((question, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="h-auto py-1.5 px-2.5 text-xs justify-start font-normal whitespace-normal text-left"
                          onClick={() => setChatInput(question)}
                        >
                          {question}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Chat messages will go here */}
                  <div className="space-y-4 min-h-[300px]">
                    {/* Example message */}
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <p className="text-sm text-muted-foreground">AI Assistant</p>
                        <div className="bg-muted p-3 rounded-lg text-sm">
                          Hello! I can help you analyze the candidate data. Try asking me about specific skills, experience levels, or other criteria.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="border-t p-4">
                <form 
                  className="flex gap-2" 
                  onSubmit={(e) => {
                    e.preventDefault()
                    // Handle chat submission
                    console.log('Chat input:', chatInput)
                    setChatInput("")
                  }}
                >
                  <Input
                    placeholder="Ask about candidates..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  />
                  <Button type="submit" size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </SheetContent>
          </Sheet>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4" />
            Print Results
          </Button>
          <Link href="/hiring-pipeline">
            <Button variant="default" className="gap-2">
              <Users className="h-4 w-4" />
              View Pipeline
            </Button>
          </Link>
        </div>
      </div>

      {/* Print-only header - only visible when printing */}
      <div className="hidden print:block print:text-left print:mb-5 print:pb-3 print:border-b print:border-gray-200">
        <h1 className="print:text-2xl print:font-bold print:mb-1">{currentJob?.title || 'Job Matches'}</h1>
        <p className="print:text-sm print:text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
        {showShortlisted && <p className="print:text-sm print:text-gray-600">Showing shortlisted candidates only (80%+ match)</p>}
        
        {jobStats && (
          <div className="print:grid print:grid-cols-4 print:gap-5 print:mt-3">
            <div>
              <div className="print:text-sm print:text-gray-600">Posted Date</div>
              <div className="print:font-bold print:text-base">{formatDate(currentJob?.created_at || '')}</div>
            </div>
            <div>
              <div className="print:text-sm print:text-gray-600">Last Processed</div>
              <div className="print:font-bold print:text-base">{formatDate(jobStats.lastProcessed || '')}</div>
            </div>
            <div>
              <div className="print:text-sm print:text-gray-600">Applications</div>
              <div className="print:font-bold print:text-base">{jobStats.totalCandidates.toLocaleString()}</div>
            </div>
            <div>
              <div className="print:text-sm print:text-gray-600">Shortlisted</div>
              <div className="print:font-bold print:text-base">{jobStats.shortlisted}</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Stats cards */}
      {jobStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 print:hidden">
          <Card className="stats-card">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Posted Date</span>
                </div>
                <p className="text-lg font-semibold">{formatDate(currentJob?.created_at || '')}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="stats-card">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Last Processed</span>
                </div>
                <p className="text-lg font-semibold">{formatDate(jobStats.lastProcessed || '')}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="stats-card">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Applications</span>
                </div>
                <p className="text-lg font-semibold">{jobStats.totalCandidates.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="stats-card">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4" />
                  <span>Avg. Match</span>
                </div>
                <p className="text-lg font-semibold">{jobStats.averageMatchScore}%</p>
              </div>
            </CardContent>
          </Card>
          <Card className="stats-card bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  <span>Shortlisted</span>
                  <Badge variant="outline" className="ml-auto text-xs">Auto (80%+)</Badge>
                </div>
                <p className="text-lg font-semibold">{jobStats.shortlisted}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Display toggle for shortlisted candidates */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6 print:hidden">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search candidates..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-9 w-9 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="shortlisted"
              checked={showShortlisted}
              onCheckedChange={(checked) => setShowShortlisted(checked === true)}
            />
            <Label htmlFor="shortlisted">Show shortlisted only</Label>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center space-x-2 print:hidden border rounded-md p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
              <span className="sr-only">Grid view</span>
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
              <span className="sr-only">Table view</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="main-content print:hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-8">
            <div className="rounded-full bg-muted p-3 mb-4">
              {showShortlisted ? (
                <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
              ) : searchQuery ? (
                <Search className="h-6 w-6 text-muted-foreground" />
              ) : (
                <Users className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-lg font-medium mb-1">
              {showShortlisted 
                ? "No shortlisted candidates found" 
                : searchQuery
                ? "No matching candidates found"
                : "No candidates found"}
            </h3>
            <p className="text-muted-foreground max-w-md mb-4">
              {showShortlisted 
                ? "There are no candidates with a match score of 80% or higher. Try viewing all candidates instead." 
                : searchQuery
                ? `No candidates match the search term "${searchQuery}". Try a different search term.`
                : "No candidates match the current filters. Try adjusting your search criteria."}
            </p>
            {showShortlisted && (
              <Button 
                variant="outline" 
                onClick={() => setShowShortlisted(false)}
              >
                View All Candidates
              </Button>
            )}
            {searchQuery && (
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-6">
            {currentCandidates.map((candidate) => (
              <Card 
                key={candidate.id} 
                className={cn(
                  "hover:shadow-md transition-shadow",
                  candidate.matchScore >= 80 && "border-l-4 border-l-blue-500",
                  candidate.stage === "phone_screening" && "border-l-[hsl(var(--status-screening))]",
                  candidate.stage === "interview" && "border-l-[hsl(var(--status-interview))]",
                  candidate.stage === "offer" && "border-l-[hsl(var(--status-offer))]",
                  candidate.stage === "hired" && "border-l-[hsl(var(--status-hired))]"
                )}
              >
                <CardContent className="p-6">
                  {renderCandidateCard(candidate)}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Candidate</TableHead>
                  <TableHead className="w-[100px]">Experience</TableHead>
                  <TableHead>Key Skills</TableHead>
                  <TableHead className="w-[120px] text-right">Match Score</TableHead>
                  <TableHead className="w-[150px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentCandidates.map((candidate) => {
                  // Check if candidate is already shortlisted (match score >= 80%)
                  const isShortlisted = candidate.matchScore >= 80;
                  const isInPipeline = !!candidates[candidate.id];
                  
                  return (
                    <TableRow 
                      key={candidate.id}
                      className={cn(
                        candidate.matchScore >= 80 && "bg-blue-50",
                        candidate.stage === "phone_screening" && "border-l-[hsl(var(--status-screening))]",
                        candidate.stage === "interview" && "border-l-[hsl(var(--status-interview))]",
                        candidate.stage === "offer" && "border-l-[hsl(var(--status-offer))]",
                        candidate.stage === "hired" && "border-l-[hsl(var(--status-hired))]"
                      )}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={candidate.avatar} alt={candidate.name} />
                            <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{candidate.name}</div>
                            <div className="text-sm text-muted-foreground">{candidate.role}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{candidate.experience}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[300px]">
                          {Object.entries(candidate.skillRatings)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 3)
                            .map(([skill, score]) => (
                              <Badge 
                                key={skill} 
                                variant="secondary"
                                className={cn(
                                  "text-xs font-normal",
                                  score >= 90 ? "bg-green-100" : 
                                  score >= 80 ? "bg-blue-100" : 
                                  "bg-yellow-100"
                                )}
                              >
                                {skill} ({score}%)
                              </Badge>
                            ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={cn("font-bold", getMatchScoreColor(candidate.matchScore))}>
                            {candidate.matchScore}%
                          </span>
                          <div className="w-16 h-2 bg-secondary rounded-full">
                            <div 
                              className={cn("h-full rounded-full", getSkillColor(candidate.matchScore))}
                              style={{ width: `${candidate.matchScore}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {candidates[candidate.id] ? (
                            <PipelineStatus currentStage={candidates[candidate.id].stage} />
                          ) : (
                            <Button
                              onClick={() => handleAddCandidate(candidate)}
                              variant={isShortlisted ? "default" : "outline"}
                              size="sm"
                              className="gap-1"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {filteredCandidates.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-center mt-8 mb-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      {/* Remove the redundant print-only summary footer */}
      {/* Print-only content with all candidates */}
      <div className="hidden print:block print:w-full">
        {filteredCandidates.length > 0 && (
          <div className="print:grid print:grid-cols-1 print:gap-6">
            {filteredCandidates.map((candidate) => (
              <Card 
                key={candidate.id} 
                className={cn(
                  "print:break-inside-avoid print:page-break-inside-avoid print:border print:border-gray-200 print:shadow-none print:mb-5 print:p-3",
                  candidate.matchScore >= 80 && "print:border-l-4 print:border-l-blue-500"
                )}
              >
                <CardContent className="print:p-4">
                  <div className="print:flex print:justify-between print:items-center print:mb-2">
                    <span className="print:font-bold print:text-lg">{candidate.name}</span>
                    <span className="print:italic print:text-gray-600">{candidate.experience}</span>
                    {candidate.matchScore >= 80 && <span className="print:font-bold print:text-green-600 print:mx-2">Shortlisted</span>}
                    <span className="print:font-bold print:text-lg">{candidate.matchScore}%</span>
                  </div>
                  <div className="print:italic print:text-gray-600 print:mb-2">
                    {candidate.summary}
                  </div>
                  <div className="print:flex print:flex-wrap print:gap-1 print:mt-2">
                    {Object.entries(candidate.skillRatings)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 6)
                      .map(([skill, score]) => (
                        <span 
                          key={skill}
                          className={cn(
                            "print:inline-block print:px-2 print:py-1 print:m-1 print:text-xs print:border print:border-gray-200",
                            score >= 90 ? "print:border-l-4 print:border-l-green-500" : 
                            score >= 80 ? "print:border-l-4 print:border-l-blue-500" : 
                            score >= 70 ? "print:border-l-4 print:border-l-yellow-500" : 
                            "print:border-l-4 print:border-l-red-500"
                          )}
                        >
                          {skill}: {score}%
                        </span>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}