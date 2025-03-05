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
  organization?: {
    industry: string
    size_range: string
    founded_year: number
    company_type: string
  }
  processed?: ProcessedJob
  text_blob?: LocalizedText
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

/**
 * Represents text content in multiple languages
 */
export interface LocalizedText {
  en?: string
  fr?: string
  [key: string]: string | undefined
} 