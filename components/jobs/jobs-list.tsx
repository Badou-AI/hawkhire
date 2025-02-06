'use client'

import { useState, useEffect } from 'react'
import { getJobs, type ApiJob, type JobsResponse } from '@/app/api/jobs/client'
import { Pagination } from '@/components/shared/pagination'
import { JobCard } from '@/components/jobs/job-card'

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
  const [currentPage, setCurrentPage] = useState(1)
  const [totalJobs, setTotalJobs] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [jobs, setJobs] = useState<DisplayJob[]>([])
  const pageSize = 15

  useEffect(() => {
    async function fetchJobs() {
      try {
        const response: JobsResponse = await getJobs(currentPage - 1, pageSize)
        setJobs(response.data.map((job: ApiJob) => ({
          id: job.id,
          title: job.title.en,
          company: job.organizations?.name.en || 'Company Name',
          location: `${job.location.city.en}, ${job.location.state.en}`,
          type: job.job_type.replace('_', ' ').toLowerCase(),
          rating: job.rating || 4.5,
          logo: job.organizations?.logo_url || '/company-logos/placeholder.png',
          description: job.description.en,
          salary: job.salary_min && job.salary_max 
            ? `$${job.salary_min/1000}k - $${job.salary_max/1000}k ${job.salary_currency}`
            : 'Competitive',
          postedAt: job.created_at,
          skills: job.skills || [],
          remote: job.remote,
          industry: job.organizations?.industry || 'Technology'
        })))
        setTotalJobs(response.total)
        setError(null)
      } catch (err) {
        setError('Failed to fetch jobs')
        console.error('Error fetching jobs:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [currentPage])

  const totalPages = Math.ceil(totalJobs / pageSize)

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          </div>
        ) : jobs.length > 0 ? (
          jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500">
            No jobs found
          </div>
        )}
      </div>
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          className="justify-center"
        />
      )}
    </div>
  )
} 