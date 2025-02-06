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
export async function getJobs(page = 0, pageSize = 15) {
  try {
    const response = await fetch(`http://127.0.0.1:8080/v1/jobs?page=${page}&page_size=${pageSize}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json'
      }
    })
    if (!response.ok) {
      throw new Error('Failed to fetch jobs')
    }
    const data: JobsApiResponse = await response.json()
    return {
      ...data,
      data: data.data.map(mapBackendJobToFrontend)
    }
  } catch (error) {
    console.error('Error fetching jobs:', error)
    throw error
  }
}

export async function getJob(id: string): Promise<Job | null> {
  if (!id) throw new Error('Job ID is required')
  
  try {
    const response = await fetch(`http://127.0.0.1:8080/v1/jobs/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json'
      },
      cache: 'no-store'
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Failed to fetch job: ${response.statusText}`)
    }
    
    const data: BackendJob = await response.json()
    return mapBackendJobToFrontend(data)
  } catch (error) {
    console.error(`Error fetching job ${id}:`, error)
    throw error
  }
}

export async function getSimilarJobs(jobId: string, limit = 4) {
  try {
    const response = await fetch(`http://127.0.0.1:8080/v1/jobs?page=0&page_size=${limit}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json'
      },
      cache: 'no-store'
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch similar jobs')
    }
    
    const data: JobsApiResponse = await response.json()
    return data.data.map(mapBackendJobToFrontend)
  } catch (error) {
    console.error('Error fetching similar jobs:', error)
    throw error
  }
}