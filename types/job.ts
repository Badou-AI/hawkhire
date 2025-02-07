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
} 