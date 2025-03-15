import { Organization } from "./organization"

export interface Job {
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
  language?: string
  summary?: string
  organization?: Organization
  processed?: ProcessedJob
}

export interface ProcessedJob {
  // Resume processing metadata
  index_name: string
  total_applicants: number
  last_processed_at: string
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  
  // Statistics
  average_match_score?: number
  top_skills?: Array<{
    skill: string
    count: number
    average_score: number
  }>
  
  // Processing metadata
  error_message?: string
  processing_duration?: number
}

export interface JobLocation {
  city: string
  state?: string
  country?: string
  postal_code?: string
}

export interface ApiJob {
  id: string
  title: string
  description: string
  language?: string | null
  summary?: string | null
  organizations?: Organization
  location?: JobLocation | null
  job_type?: string | null
  rating?: number | null
  salary_min?: number | null
  salary_max?: number | null
  salary_currency?: string | null
  created_at?: string
  updated_at?: string
  skills?: string[]
  remote?: boolean
  is_mock?: boolean
  mock_batch_id?: string | null
  // Add any other fields that might be in the fetched data
  organization_id?: string
  status?: string
  processed?: ProcessedJob
}

export interface JobsResponse {
  data: ApiJob[]
  page: number
  page_size: number
  total: number
}