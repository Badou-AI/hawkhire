'use client';
import { type Job } from '@/types/job';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { formatSalaryRange } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface JobCardProps {
  job: Job
  showOrganization?: boolean
  locale?: 'en' | 'fr'
}

export function JobCard({ job, showOrganization = false, locale = 'en' }: JobCardProps) {
  const [isApplying, setIsApplying] = useState(false)

  const handleApply = async () => {
    setIsApplying(true)
    try {
      const response = await fetch('http://127.0.0.1:8000/jobs/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: job.id,
          user_id: 'current-user-id', // We'll get this from auth
          resume_url: 'mock-resume-url',
          cover_letter: 'Sample cover letter'
        }),
      })
      
      if (!response.ok) throw new Error('Failed to apply')
    } catch (error) {
      console.error('Error applying:', error)
    } finally {
      setIsApplying(false)
    }
  }

  const applyText = locale === 'fr' ? 'Postuler' : 'Apply'
  const applyingText = locale === 'fr' ? 'Candidature en cours...' : 'Applying...'

  return (
    <Link href={`/jobs/${job.id}`}>
      <Card className="group h-full cursor-pointer transition-colors hover:border-primary">
        <CardHeader className="space-y-1">
          <div className="flex items-start justify-between">
            <CardTitle className="line-clamp-2 text-lg group-hover:text-primary">
              {job.title}
            </CardTitle>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{job.job_type}</Badge>
            {job.remote && <Badge variant="outline">Remote</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{job.location}</span>
            </div>
            {job.salary_min && job.salary_max && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>{formatSalaryRange(job.salary_min, job.salary_max)}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Posted {formatDistanceToNow(new Date(job.created_at))} ago</span>
            </div>
          </div>
          <Button 
            onClick={handleApply} 
            disabled={isApplying}
            className="w-full"
          >
            {isApplying ? applyingText : applyText}
          </Button>
        </CardContent>
      </Card>
    </Link>
  )
} 