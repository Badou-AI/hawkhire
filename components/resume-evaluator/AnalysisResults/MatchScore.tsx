'use client'

import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface MatchScoreProps {
  score: number  // Score between 0 and 1
  justification?: string
  isLoading?: boolean
}

export function MatchScore({ score, justification, isLoading = false }: MatchScoreProps) {
  const percentage = Math.round(score * 100)
  
  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return '#16a34a' // green-600
    if (score >= 0.6) return '#ca8a04' // yellow-600
    return '#dc2626' // red-600
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Match Score</h3>
          
          <div className="flex items-center justify-center">
            <div className="relative inline-flex items-center justify-center">
              <div className="h-24 w-24 rounded-full bg-gray-200 animate-pulse" />
              <div className="absolute text-2xl font-bold w-12 h-8 bg-gray-300 animate-pulse rounded" />
            </div>
          </div>

          <div className="h-4 w-3/4 mx-auto bg-gray-200 animate-pulse rounded" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Match Score</h3>
        
        <div className="flex items-center justify-center">
          <div className="relative inline-flex items-center justify-center">
            <Progress
              value={percentage}
              className="h-24 w-24"
              style={{
                ['--progress-background' as string]: getScoreColor(score)
              }}
            />
            <span 
              className="absolute text-2xl font-bold"
              style={{ color: getScoreColor(score) }}
            >
              {percentage}%
            </span>
          </div>
        </div>

        {justification && (
          <p className="text-sm text-gray-600 mt-4">
            {justification}
          </p>
        )}
      </div>
    </Card>
  )
} 