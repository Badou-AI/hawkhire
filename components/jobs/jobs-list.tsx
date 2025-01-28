'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { type Job } from '@/types/job'
import { createClient } from '@/lib/supabase/client'
import { OrganizationAvatar } from '@/components/ui/organization-avatar'

interface DatabaseJob {
  id: string
  title: string
  description: string
  requirements: string[]
  skills: string[]
  status: string
  created_at: string
  location: string | null
  job_type: string | null
  salary_min: number | null
  salary_max: number | null
  remote: boolean
  rating: number | null
  organization: {
    id: string
    name: string
    logo_url: string | null
  }
}

export function JobsList() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    async function fetchJobs() {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select(`
            *,
            organization:organizations (
              name,
              id,
              logo_url
            )
          `)
          .eq('status', 'published')
          .order('created_at', { ascending: false })

        if (error) throw error

        setJobs(data.map((job: DatabaseJob) => ({
          id: job.id,
          title: job.title,
          company: job.organization.name,
          description: job.description,
          location: job.location || 'Remote',
          type: job.job_type || 'Full-time',
          rating: job.rating || 4.5,
          logo: job.organization.logo_url || '/placeholder-logo.png',
          salary: job.salary_min && job.salary_max 
            ? `$${job.salary_min/1000}k - $${job.salary_max/1000}k`
            : 'Competitive',
          postedAt: new Date(job.created_at).toLocaleDateString(),
          skills: job.skills || [],
          remote: job.remote,
          requirements: job.requirements || []
        })))
      } catch (error) {
        console.error('Error fetching jobs:', error)
        setError('Failed to load jobs. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchJobs()
  }, [supabase])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading jobs...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-600">{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline" 
          className="mt-4"
        >
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing: {jobs.length} jobs available
        </p>
        <select className="rounded-md border p-2 text-sm">
          <option value="created_at">Most recent</option>
          <option value="title">Job title</option>
          <option value="company">Company name</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
        {jobs.map((job) => (
          <Link href={`/jobs/${job.id}`} key={job.id} className="block h-full">
            <Card className="flex h-full flex-col p-6 transition-colors hover:border-primary">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 flex-shrink-0">
                  <OrganizationAvatar
                    name={job.company}
                    logoUrl={job.logo}
                    size={48}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium">{job.company}</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    IT & Software, Service
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
        ))}
      </div>
    </div>
  )
} 