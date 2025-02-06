'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { getJobs, type ApiJob, type JobsResponse } from '@/app/api/jobs/client'
import { Pagination } from '@/components/shared/pagination'

interface DisplayJob {
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

export function JobsList() {
  const [currentPage, setCurrentPage] = useState(0)
  const [totalJobs, setTotalJobs] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [jobs, setJobs] = useState<DisplayJob[]>([])
  const pageSize = 15

  useEffect(() => {
    async function fetchJobs() {
      try {
        const response: JobsResponse = await getJobs(currentPage)
        setJobs(response.data.map((job: ApiJob) => ({
          id: job.id,
          title: job.title.en,
          company: job.organizations.name.en,
          location: `${job.location.city.en}, ${job.location.state.en}`,
          type: job.job_type.replace('_', ' ').toLowerCase(),
          rating: job.rating || 4.5,
          logo: job.organizations.logo_url || '/company-logos/placeholder.png',
          description: job.description.en,
          salary: job.salary_min && job.salary_max 
            ? `$${job.salary_min/1000}k - $${job.salary_max/1000}k ${job.salary_currency}`
            : 'Competitive',
          postedAt: job.created_at,
          skills: job.skills || [],
          remote: job.remote,
          industry: job.organizations.industry.toLowerCase().replace('_', ' ')
        })))
        setTotalJobs(response.total)
        setError(null)
      } catch (err) {
        setError('Failed to fetch jobs. Please try again later.')
        console.error('Error fetching jobs:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [currentPage])

  const handlePageChange = (page: number) => {
    setCurrentPage(page - 1) // Convert 1-based to 0-based pagination
  }

  if (loading) return <div className="text-center py-4">Loading jobs...</div>
  if (error) return <div className="text-center text-red-500 py-4">{error}</div>

  const totalPages = Math.ceil(totalJobs / pageSize)

  return (
    <div className="min-h-0 flex-1 flex flex-col">
      {/* Content - scrollable */}
      <div className="flex-1 overflow-y-auto hide-scrollbar scroll-smooth">
        <div className="space-y-6 pb-16">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing: {jobs.length} of {totalJobs} jobs
            </p>
            <select className="rounded-md border p-2 text-sm">
              <option>Most popular</option>
              <option>Recent</option>
              <option>Highest paid</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
            {jobs.map((job) => (
              <Link href={`/jobs/${job.id}`} key={job.id} className="block h-full">
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
            ))}
          </div>
        </div>
      </div>

      {/* Pagination - fixed at bottom */}
      <div className="shrink-0 border-t py-2 -mb-6 bg-background">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{jobs.length}</span> of{" "}
            <span className="font-medium">{totalJobs}</span> jobs
          </div>
          
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage + 1} // Convert 0-based to 1-based pagination
              totalPages={totalPages}
              onPageChange={handlePageChange}
              className="mt-0"
            />
          )}
        </div>
      </div>
    </div>
  )
} 