'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { type Job } from '@/types/job'
import { mockJobs } from '@/lib/data/mock-jobs'

export function JobsList() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setJobs(mockJobs)
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing: {jobs.length} filtered jobs
        </p>
        <select className="rounded-md border p-2 text-sm">
          <option>Most popular</option>
          <option>Recent</option>
          <option>Highest paid</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <Link href={`/jobs/${job.id}`} key={job.id}>
            <Card className="flex flex-col overflow-hidden p-6 transition-colors hover:border-primary">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 flex-shrink-0">
                  <Image
                    src={job.logo}
                    alt={`${job.company} logo`}
                    width={48}
                    height={48}
                    className="rounded-lg"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium">{job.company}</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    IT & Software, Service
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-base font-medium leading-snug">{job.title}</h4>
                <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                  {job.description}
                </p>
              </div>

              <div className="mt-4">
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

              <div className="mt-4">
                <Button variant="link" className="h-auto p-0 text-primary">
                  {job.remote ? 'Remote' : 'On-site'} • {job.salary}
                </Button>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
} 