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
} 