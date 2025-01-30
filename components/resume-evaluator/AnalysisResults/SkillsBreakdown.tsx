'use client'

import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

interface Skill {
  skill: string
  score: number
  justification: string
}

interface SkillsBreakdownProps {
  skills: Skill[]
  isLoading?: boolean
}

export function SkillsBreakdown({ skills, isLoading = false }: SkillsBreakdownProps) {
  // Sort skills by score in descending order
  const sortedSkills = [...skills].sort((a, b) => b.score - a.score)

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-600'
    if (score >= 0.6) return 'bg-yellow-600'
    return 'bg-red-600'
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Skills Analysis</h3>
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-20 h-6 bg-gray-200 animate-pulse rounded" />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
                  <div className="h-4 w-12 bg-gray-200 animate-pulse rounded" />
                </div>
                <div className="h-2 bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-full bg-gray-200 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Skills Analysis</h3>
          <div className="flex gap-2">
            <Badge variant="outline" className="gap-1">
              <div className="w-2 h-2 rounded-full bg-green-600" />
              Expert
            </Badge>
            <Badge variant="outline" className="gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-600" />
              Proficient
            </Badge>
            <Badge variant="outline" className="gap-1">
              <div className="w-2 h-2 rounded-full bg-red-600" />
              Basic
            </Badge>
          </div>
        </div>

        <div className="space-y-4">
          {sortedSkills.map((skill, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{skill.skill}</span>
                <span className="text-sm text-gray-500">
                  {Math.round(skill.score * 100)}%
                </span>
              </div>
              <Progress 
                value={skill.score * 100} 
                className="h-2"
                style={{
                  ['--progress-background' as string]: getScoreColor(skill.score)
                }}
              />
              <p className="text-sm text-gray-600">{skill.justification}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
} 