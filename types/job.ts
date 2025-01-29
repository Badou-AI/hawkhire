export type JobStatus = 'draft' | 'published' | 'closed' | 'archived'
export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship'

export interface Job {
  id: string
  organization_id: string
  title: string
  description: string
  requirements: string[]
  responsibilities: string[]
  skills: string[]
  location: string
  job_type: JobType
  salary_min: number
  salary_max: number
  remote: boolean
  status: JobStatus
  created_at: string
  updated_at: string
  organization?: {
    id: string
    name: string
    slug: string
    logo_url?: string
  }
} 