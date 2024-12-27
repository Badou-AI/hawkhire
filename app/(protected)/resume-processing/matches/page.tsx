"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
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
  CheckCircle2,
  ChevronRight as ChevronRightIcon,
  LayoutList,
  Table as TableIcon,
  LayoutGrid,
  Send,
  Bot,
  Plus,
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
import { useState } from "react"
import { usePipelineStore } from '@/lib/store/pipeline-store'
import { PipelineStatus } from '@/components/pipeline-status'

// Import candidate data and helper functions from shared data file
import { candidateMatches, getSkillColor, jobs } from "../data"

// Mock data for job stats
const jobStats = {
  createdAt: "2024-01-15T10:00:00Z",
  processedAt: "2024-01-20T14:30:00Z",
  totalApplications: 1432,
  activelyReviewing: 89,
  averageExperience: "4.5",
  shortlisted: 32,
  averageMatchScore: 84
}

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(dateString))
}

// Add pagination config
const ITEMS_PER_PAGE = 5



export default function MatchesPage() {
  const { addCandidate, candidates } = usePipelineStore()
  // For demo, we'll use the first job
  const currentJob = jobs[0]
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'simple' | 'detailed' | 'table'>('simple')
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [showDetails, setShowDetails] = useState(false)

  // Calculate pagination
  const totalPages = Math.ceil(candidateMatches.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentCandidates = candidateMatches.slice(startIndex, endIndex)

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Always show first page
      pageNumbers.push(1)
      
      if (currentPage > 3) {
        pageNumbers.push('...')
      }
      
      // Show pages around current page
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pageNumbers.push(i)
      }
      
      if (currentPage < totalPages - 2) {
        pageNumbers.push('...')
      }
      
      // Always show last page
      pageNumbers.push(totalPages)
    }
    
    return pageNumbers
  }

  const renderCandidateCard = (candidate: typeof candidateMatches[0]) => {
    return (
      <div className="flex items-start gap-6">
        {/* Left section: Avatar and basic info */}
        <div className="flex items-start gap-4 flex-1">
          <Avatar className="h-12 w-12">
            <AvatarImage src={candidate.avatar} alt={candidate.name} />
            <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1 min-w-[200px]">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{candidate.name}</h4>
              <span className="text-sm text-muted-foreground">
                {candidate.experience} experience
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {candidate.summary}
            </p>
            {/* {candidates[candidate.id] ? (
              <PipelineStatus currentStage={candidates[candidate.id].stage} />
            ) : ( */}
              <Button
                onClick={() => addCandidate({
                  id: candidate.id,
                  name: candidate.name,
                  role: candidate.role,
                  score: candidate.matchScore,
                  imageUrl: candidate.avatar
                })}
                variant="outline"
                size="sm"
                className="gap-2 mt-2 h-7 text-xs"
              >
                <Plus className="h-3 w-3" />
                Add to Pipeline
              </Button>
            {/* )} */}
          </div>
        </div>

        {/* Center section: Key skills */}
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(candidate.skillRatings).slice(0, 4).map(([skill, score]) => (
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
        </div>

        {/* Right section: Match score and actions */}
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-green-600">
              {candidate.matchScore}%
            </span>
            <Badge variant="outline">Match Score</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">View Profile</Button>
            <Button size="sm">Contact</Button>
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

  return (
    <div className="h-full flex flex-col">
      {/* Header section - fixed */}
      <div className="shrink-0 space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/jobs">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold">{currentJob.title}</h1>
              <p className="text-muted-foreground mt-1">Review matched candidates based on skills and experience</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/hiring-pipeline">
              <Button variant="default" className="gap-2">
                <Users className="h-4 w-4" />
                View Pipeline
              </Button>
            </Link>
            <Sheet open={chatOpen} onOpenChange={setChatOpen}>
              <SheetTrigger asChild>
                <Button variant="default" className="gap-2">
                  <Bot className="h-4 w-4" />
                  Ask AI Assistant
                </Button>
              </SheetTrigger>
              <SheetContent 
                className="w-[800px] sm:w-full sm:max-w-full lg:w-[750px]  flex flex-col p-0 max-w-full"
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
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button 
                variant={viewMode === 'simple' ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => {setViewMode('simple'); setShowDetails(false)}}
                title="Simple List View"
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === 'detailed' ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => {setViewMode('detailed'); setShowDetails(true)}}
                title="Detailed List View"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === 'table' ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => {setViewMode('table'); setShowDetails(false)}}
                title="Table View"
              >
                <TableIcon className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline">Filter</Button>
            <Button variant="outline">Sort by Match Score</Button>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Posted Date</span>
                </div>
                <p className="text-lg font-semibold">{formatDate(jobStats.createdAt)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Last Processing</span>
                </div>
                <p className="text-lg font-semibold">{formatDate(jobStats.processedAt)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Applications</span>
                </div>
                <p className="text-lg font-semibold">{jobStats.totalApplications.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4" />
                  <span>Avg. Match</span>
                </div>
                <p className="text-lg font-semibold">{jobStats.averageMatchScore}%</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Shortlisted</span>
                </div>
                <p className="text-lg font-semibold">{jobStats.shortlisted}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  <span>Avg. Experience</span>
                </div>
                <p className="text-lg font-semibold">{jobStats.averageExperience} years</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="min-h-0 flex-1 flex flex-col">
        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          {viewMode === 'table' ? (
            <div className="pb-16">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Key Skills</TableHead>
                    <TableHead>Match Score</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentCandidates.map((candidate) => (
                    <TableRow key={candidate.name}>
                      <TableCell>
                        <div className="space-y-4">
                          {/* Main candidate info */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={candidate.avatar} alt={candidate.name} />
                                <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{candidate.name}</div>
                                <div className="text-sm text-muted-foreground line-clamp-1">
                                  {candidate.summary}
                                </div>
                              </div>
                            </div>
                            {candidates[candidate.id] ? (
                              <PipelineStatus currentStage={candidates[candidate.id].stage} />
                            ) : (
                              <Button
                                onClick={() => addCandidate({
                                  id: candidate.id,
                                  name: candidate.name,
                                  role: candidate.role,
                                  score: candidate.matchScore,
                                  imageUrl: candidate.avatar
                                })}
                                variant="outline"
                                size="sm"
                                className="gap-2 h-7 text-xs"
                              >
                                <Plus className="h-3 w-3" />
                                Add to Pipeline
                              </Button>
                            )}
                          </div>

                          {/* Additional details */}
                          {showDetails && (
                            <div className="grid grid-cols-4 gap-6 pt-4 border-t">
                              {/* Education */}
                              <div className="space-y-1">
                                <h5 className="font-medium text-sm">Education</h5>
                                <p className="text-sm">Master&apos;s in Computer Science</p>
                                <p className="text-xs text-muted-foreground">Stanford University, 2020</p>
                              </div>
                              
                              {/* Languages */}
                              <div className="space-y-2">
                                <h5 className="font-medium text-sm">Languages</h5>
                                <div className="flex flex-wrap gap-1">
                                  <Badge variant="secondary">English (Native)</Badge>
                                  <Badge variant="secondary">Spanish (B2)</Badge>
                                </div>
                              </div>
                              
                              {/* Additional Skills */}
                              <div className="space-y-2">
                                <h5 className="font-medium text-sm">Additional Skills</h5>
                                <div className="grid gap-1.5">
                                  {Object.entries(candidate.skillRatings)
                                    .slice(3, 6)
                                    .map(([skill, score]) => (
                                      <div key={skill} className="flex items-center justify-between text-sm">
                                        <span>{skill}</span>
                                        <span className="text-muted-foreground">{score}%</span>
                                      </div>
                                    ))}
                                </div>
                              </div>
                              
                              {/* Preferences */}
                              <div className="space-y-2">
                                <h5 className="font-medium text-sm">Preferences</h5>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Salary</span>
                                    <span>$120k - $150k</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Work Type</span>
                                    <span>Remote</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Notice</span>
                                    <span>2 weeks</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{candidate.experience}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-green-600">
                            {candidate.matchScore}%
                          </span>
                          <div className="h-1.5 w-16 rounded-full bg-secondary">
                            <div 
                              className={cn("h-full rounded-full transition-all", getSkillColor(candidate.matchScore))}
                              style={{ width: `${candidate.matchScore}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">View Profile</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid gap-4 pb-16">
              {currentCandidates.map((candidate) => (
                <Card 
                  key={candidate.name} 
                  data-stage={candidates[candidate.id]?.stage}
                  className={cn(
                    "hover:bg-muted/50 transition-colors",
                    {
                      'border-l-[4px] border-l-[hsl(var(--status-screening))]': candidates[candidate.id]?.stage === 'phoneScreen',
                      'border-l-[4px] border-l-[hsl(var(--status-interview))]': candidates[candidate.id]?.stage === 'technical',
                      'border-l-[4px] border-l-[hsl(var(--status-assessment))]': candidates[candidate.id]?.stage === 'cultural',
                      'border-l-[4px] border-l-[hsl(var(--status-offer))]': candidates[candidate.id]?.stage === 'offer',
                      'border-l-[4px] border-l-[hsl(var(--status-hired))]': candidates[candidate.id]?.stage === 'hired',
                      'border-l-[4px] border-l-[hsl(var(--status-rejected))]': candidates[candidate.id]?.stage === 'rejected',
                    }
                  )}
                >
                  <CardContent className="p-6 space-y-6">
                    {/* Main candidate info */}
                    {renderCandidateCard(candidate)}
                    
                    {/* Additional details */}
                    {viewMode === 'detailed' && (
                      <div className="grid grid-cols-4 gap-6 pt-6 border-t">
                        {/* Education */}
                        <div className="space-y-1">
                          <h5 className="font-medium text-sm">Education</h5>
                          <p className="text-sm">Master&apos;s in Computer Science</p>
                          <p className="text-xs text-muted-foreground">Stanford University, 2020</p>
                        </div>
                        
                        {/* Languages */}
                        <div className="space-y-2">
                          <h5 className="font-medium text-sm">Languages</h5>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="secondary">English (Native)</Badge>
                            <Badge variant="secondary">Spanish (B2)</Badge>
                          </div>
                        </div>
                        
                        {/* Additional Skills */}
                        <div className="space-y-2">
                          <h5 className="font-medium text-sm">Additional Skills</h5>
                          <div className="grid gap-1.5">
                            {Object.entries(candidate.skillRatings)
                              .slice(3, 6)
                              .map(([skill, score]) => (
                                <div key={skill} className="flex items-center justify-between text-sm">
                                  <span>{skill}</span>
                                  <span className="text-muted-foreground">{score}%</span>
                                </div>
                              ))}
                          </div>
                        </div>
                        
                        {/* Preferences */}
                        <div className="space-y-2">
                          <h5 className="font-medium text-sm">Preferences</h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Salary</span>
                              <span>$120k - $150k</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Work Type</span>
                              <span>Remote</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Notice</span>
                              <span>2 weeks</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Pagination - fixed at bottom */}
        <div className="shrink-0 border-t py-2 -mb-6 bg-background">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
              <span className="font-medium">{Math.min(endIndex, candidateMatches.length)}</span> of{" "}
              <span className="font-medium">{candidateMatches.length}</span> candidates
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous page</span>
              </Button>
              
              <div className="flex items-center gap-1">
                {getPageNumbers().map((pageNum, index) => (
                  pageNum === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">...</span>
                  ) : (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      className="w-9"
                      onClick={() => setCurrentPage(pageNum as number)}
                    >
                      {pageNum}
                    </Button>
                  )
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRightIcon className="h-4 w-4" />
                <span className="sr-only">Next page</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 