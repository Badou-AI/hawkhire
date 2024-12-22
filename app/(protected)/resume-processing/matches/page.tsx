"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ChevronLeft } from 'lucide-react'
import { cn } from "@/lib/utils"
import Link from "next/link"

// Import candidate data and helper functions from parent
import { candidateMatches, getSkillColor } from "../page"

export default function MatchesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/resume-processing">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-4xl font-bold">Candidate Matches</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Filter</Button>
          <Button variant="outline">Sort by Match Score</Button>
        </div>
      </div>

      <div className="grid gap-4">
        {candidateMatches.map((candidate) => (
          <Card key={candidate.name} className="hover:bg-muted/50 transition-colors">
            <CardContent className="p-6">
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 