'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'

interface JobCardProps {
  job: {
    id: string
    title: string
    company: string
    location: string
    type: string
    rating: number
    logo: string
    description: string
    salary: string
    postedAt: string
    skills: string[]
    remote: boolean
    industry: string
  }
}

export function JobCard({ job }: JobCardProps) {
  return (
    <Link href={`/job-board/${job.id}`} className="block h-full">
      <Card className="flex h-full flex-col p-6 transition-colors hover:border-primary">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 flex-shrink-0">
            <Image
              src={job.logo}
              alt={`${job.company} logo`}
              width={48}
              height={48}
              className="rounded-lg object-contain"
              quality={95}
            />
          </div>
          <div>
            <h3 className="text-sm font-medium">{job.company}</h3>
            <p className="mt-1 text-sm text-gray-600">
              {job.industry}
            </p>
          </div>
        </div>

        <div className="mt-4 min-h-[120px]">
          <h4 className="text-base font-medium leading-snug">{job.title}</h4>
          <p className="mt-2 line-clamp-3 text-sm text-gray-600">
            {job.description}
          </p>
        </div>

        <div className="mt-4 min-h-[32px]">
          <div className="flex flex-wrap gap-2">
            {job.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>{job.location}</span>
          <span>{job.type}</span>
        </div>

        <div className="mt-4 mt-auto">
          <Button variant="link" className="h-auto p-0 text-primary">
            {job.remote ? 'Remote' : 'On-site'} • {job.salary}
          </Button>
        </div>
      </Card>
    </Link>
  )
} 