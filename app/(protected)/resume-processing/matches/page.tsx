"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ChevronLeft, Calendar, Clock, Users, Briefcase, Star, CheckCircle2, ChevronRight as ChevronRightIcon } from 'lucide-react'
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useState } from "react"

// Import candidate data and helper functions from parent
import { candidateMatches, getSkillColor, jobs } from "../page"

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
  // For demo, we'll use the first job
  const currentJob = jobs[0]
  const [isDetailedView, setIsDetailedView] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  
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

  const renderCandidateCard = (candidate: typeof candidateMatches[0], detailed: boolean) => {
    if (!detailed) {
      return (
        <div className="flex items-start gap-6">
          {/* Left section: Avatar and basic info */}
          <div className="flex items-start gap-4 flex-1">
            <Avatar className="h-12 w-12">
              <AvatarImage src={candidate.avatar} alt={candidate.name} />
              <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{candidate.name}</h4>
                <span className="text-sm text-muted-foreground">
                  {candidate.experience} experience
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {candidate.summary}
              </p>
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

    return (
      <div className="flex items-start gap-6">
        {/* Left section: Avatar and basic info */}
        <div className="flex items-start gap-4 w-[280px]">
          <Avatar className="h-12 w-12">
            <AvatarImage src={candidate.avatar} alt={candidate.name} />
            <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">{candidate.name}</h4>
              <span className="text-sm text-muted-foreground">
                {candidate.experience} experience
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {candidate.summary}
            </p>
          </div>
        </div>

        {/* Center-left: Key skills */}
        <div className="w-[200px] space-y-2">
          <h5 className="font-medium text-sm">Key Skills</h5>
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

        {/* Center-right: Additional Info */}
        <div className="w-[200px] space-y-4">
          <div>
            <h5 className="font-medium text-sm mb-2">Education</h5>
            <div className="space-y-1">
              <p className="text-sm font-medium">Master's in Computer Science</p>
              <p className="text-xs text-muted-foreground">Stanford University, 2020</p>
            </div>
          </div>
          <div>
            <h5 className="font-medium text-sm mb-2">Languages</h5>
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary">English (Native)</Badge>
              <Badge variant="secondary">Spanish (B2)</Badge>
            </div>
          </div>
        </div>

        {/* Center-right: Job Preferences */}
        <div className="w-[200px] space-y-4">
          <div>
            <h5 className="font-medium text-sm mb-2">Preferences</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Salary Range</span>
                <span>$120k - $150k</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Work Type</span>
                <span>Remote</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Notice Period</span>
                <span>2 weeks</span>
              </div>
            </div>
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
            <Button 
              variant="outline" 
              onClick={() => setIsDetailedView(!isDetailedView)}
            >
              {isDetailedView ? 'Simple View' : 'Detailed View'}
            </Button>
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
        {/* Candidate cards - scrollable */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <div className="grid gap-4 pb-6">
            {currentCandidates.map((candidate) => (
              <Card key={candidate.name} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-6">
                  {renderCandidateCard(candidate, isDetailedView)}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Pagination - fixed at bottom */}
        <div className="shrink-0 border-t py-4">
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