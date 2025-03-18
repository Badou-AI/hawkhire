export interface Job {
  id: string
  title: string
  description: string
  requirements: string
  location: string
  job_type: string
  salary_min: number
  salary_max: number
  remote: boolean
  status: 'draft' | 'published' | 'archived'
  created_at: string
  updated_at: string
  organization_id: string
  organization?: {
    id: string
    name: string
    industry: string
    size_range: string
    logo_url: string | null
  }
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

export interface ResumeMatch {
  id: string
  upload_id: string
  job_id: string
  timestamp: string
  content: {
    title?: string
    profile?: {
      first_name: string
      last_name: string
      tel_num?: string
      email?: string
    }
    years_of_experience?: number
    summary?: string
    skills?: Array<{
      skill: string
      score: number
    }>
    topics?: string[]
  }
  file_info: {
    name: string
    size: number
    mime_type: string
    processed_path: string
  }
  matching_score: {
    data: {
      justification?: {
        type: string
        meta: {
          description: string
        }
      }
      score: {
        type: string
        minimum: number
        maximum: number
        meta: {
          description: string
        }
        value: number
      }
    }
  }
} 