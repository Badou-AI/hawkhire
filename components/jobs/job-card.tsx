'use client'

import { type Job } from '@/types/job'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { formatSalaryRange } from '@/lib/utils'

interface JobCardProps {
  job: Job
  showOrganization?: boolean
}

export function JobCard({ job, showOrganization = false }: JobCardProps) {
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
        </CardContent>
      </Card>
    </Link>
  )
} 