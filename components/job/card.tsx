import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { type Job } from '@/app/types/job'
import { Building2, MapPin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface JobCardProps {
  job: Job & {
    organization: {
      id: string
      name: string
      industry: string
      size_range: string
      logo_url: string | null
    }
  }
}

export function JobCard({ job }: JobCardProps) {
  return (
    <Link href={`/jobs/${job.id}`}>
      <Card className="p-6 hover:bg-muted/50">
        <div className="flex gap-4">
          {/* Organization Logo */}
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border bg-background">
            {job.organization.logo_url ? (
              <Image
                src={job.organization.logo_url}
                alt={job.organization.name}
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            ) : (
              <Building2 className="h-full w-full p-2 text-muted-foreground" />
            )}
          </div>

          {/* Job Details */}
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="font-semibold">{job.title}</h3>
              <p className="text-sm text-muted-foreground">{job.organization.name}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{job.job_type}</Badge>
              {job.remote ? (
                <Badge variant="secondary">Remote</Badge>
              ) : (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{job.location}</span>
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                {/* Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })} */}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
} 