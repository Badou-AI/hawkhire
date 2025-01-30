'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface JobDescriptionInputProps {
  onDescriptionChange: (description: string) => void
  onJobSelect?: (jobId: string) => void
  existingJobs?: Array<{ id: string; title: string }>
  value?: string
  isLoading?: boolean
}

export function JobDescriptionInput({
  onDescriptionChange,
  onJobSelect,
  existingJobs,
  value = '',
  isLoading = false
}: JobDescriptionInputProps) {
  const [description, setDescription] = useState(value)

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setDescription(newValue)
    onDescriptionChange(newValue)
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Job Description</h3>
        
        {existingJobs && onJobSelect && (
          <div className="space-y-2">
            <Label>Select Existing Job</Label>
            <Select onValueChange={onJobSelect} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a job posting..." />
              </SelectTrigger>
              <SelectContent>
                {existingJobs.map(job => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            placeholder="Enter job description or paste from job posting..."
            value={description}
            onChange={handleDescriptionChange}
            className="min-h-[200px]"
            disabled={isLoading}
          />
        </div>
      </div>
    </Card>
  )
} 