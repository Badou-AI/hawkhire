'use client'

import { Card } from '@/components/ui/card'
import ReactMarkdown from 'react-markdown'

interface FeedbackViewProps {
  content: string
  isLoading?: boolean
}

export function FeedbackView({ content, isLoading = false }: FeedbackViewProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4 animate-pulse">
          <div className="h-6 w-1/3 bg-gray-200 rounded" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-5/6 bg-gray-200 rounded" />
            <div className="h-4 w-4/6 bg-gray-200 rounded" />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </Card>
  )
} 