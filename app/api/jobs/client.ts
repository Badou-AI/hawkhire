import { type Job } from '@/types/job'

// Types
export interface LocalizedText {
  en: string
  fr: string
}

export interface LocalizedLocation {
  city: LocalizedText
  state: LocalizedText
  country: LocalizedText
  postal_code: LocalizedText
}

export interface BackendJob {
  id: string
  organization_id: string
  title: LocalizedText
  description: LocalizedText
  requirements: {
    en: string[]
    fr: string[]
  }
  skills: string[]
  status: string
  location: LocalizedLocation
  job_type: string
  salary_min: number
  salary_max: number
  salary_currency: string
  remote: boolean
  rating: number | null
  is_mock: boolean
  created_at: string
  updated_at: string
}

export interface JobsApiResponse {
  data: BackendJob[]
  page: number
  page_size: number
  total: number
}

// API URL from environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080'

// Helper function to map backend job response to frontend Job type
export function mapBackendJobToFrontend(backendJob: BackendJob): Job {
  // Format salary string
  const salaryString = backendJob.salary_min && backendJob.salary_max 
    ? `$${backendJob.salary_min/1000}k - $${backendJob.salary_max/1000}k`
    : 'Competitive'

  // Format location string
  const location = backendJob.location?.city?.en && backendJob.location?.state?.en
    ? `${backendJob.location.city.en}, ${backendJob.location.state.en}`
    : 'Remote'

  return {
    id: backendJob.id,
    title: backendJob.title.en,
    company: 'Company Name', // TODO: Add organization name from organizations table
    location: location,
    type: backendJob.job_type.replace('_', ' ').toLowerCase(),
    rating: backendJob.rating || 4.5,
    logo: '/company-logos/placeholder.png', // TODO: Add organization logo from organizations table
    description: backendJob.description.en,
    salary: salaryString,
    postedAt: backendJob.created_at,
    skills: backendJob.skills || [],
    remote: backendJob.remote
  }
}

// API Client functions
export async function getJobs(page = 0, pageSize = 10) {
  const response = await fetch(`/api/jobs?page=${page}&page_size=${pageSize}`)
  if (!response.ok) {
    throw new Error('Failed to fetch jobs')
  }
  const data: JobsApiResponse = await response.json()
  return {
    ...data,
    data: data.data.map(mapBackendJobToFrontend)
  }
}

export async function getJob(id: string) {
  const response = await fetch(`/api/jobs?id=${id}`)
  if (!response.ok) {
    if (response.status === 404) {
      return null
    }
    throw new Error('Failed to fetch job')
  }
  const data: BackendJob = await response.json()
  return mapBackendJobToFrontend(data)
}

export async function getSimilarJobs(jobId: string, limit = 4) {
  // TODO: Implement actual similar jobs endpoint when available
  const response = await fetch(`/api/jobs?page=0&page_size=${limit}`)
  if (!response.ok) {
    throw new Error('Failed to fetch similar jobs')
  }
  const data: JobsApiResponse = await response.json()
  return data.data.map(mapBackendJobToFrontend)
} 