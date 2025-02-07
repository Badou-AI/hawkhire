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

export interface Organization {
  id: string
  name: LocalizedText
  logo_url: string
  industry: string
  tier: string
  is_mock: boolean
  languages: string[]
  created_at: string
  size_range: string
  updated_at: string
  description: LocalizedText
  website_url: string
  company_type: string
  founded_year: number
  mock_batch_id: string | null
  cover_image_url: string
  primary_location: LocalizedLocation
  verification_status: string
  additional_locations: LocalizedLocation[]
}

export interface ApiJob {
  id: string
  title: LocalizedText
  organizations: Organization
  location: {
    city: LocalizedText
    state: LocalizedText
  }
  job_type: string
  rating: number | null
  description: LocalizedText
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  created_at: string
  updated_at: string
  skills: string[]
  remote: boolean
  is_mock: boolean
  mock_batch_id: string | null
  status: string
  requirements: {
    en: string[]
    fr: string[]
  }
}

export interface JobsResponse {
  data: ApiJob[]
  page: number
  page_size: number
  total: number
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  rating: number;
  logo: string;
  description: string;
  salary: string;
  postedAt: string;
  skills: string[];
  remote: boolean;
  organization?: {
    industry: string;
    size_range: string;
    founded_year: number;
    company_type: string;
  };
}

// Helper function to map backend job response to frontend Job type
export function mapBackendJobToFrontend(backendJob: ApiJob): Job {
  const locationString = `${backendJob.location.city.en}, ${backendJob.location.state.en}`

  const salaryString = backendJob.salary_min && backendJob.salary_max
    ? `$${backendJob.salary_min/1000}k - $${backendJob.salary_max/1000}k ${backendJob.salary_currency}`
    : 'Competitive'

  // Handle organization fields that might be localized JSON strings
  const parseLocalizedField = (field: string | LocalizedText | Record<string, string> | undefined): string => {
    if (!field) return ''
    if (typeof field === 'string') {
      try {
        // Try to parse if it's a stringified JSON
        const parsed = JSON.parse(field)
        return parsed.en || parsed['en'] || field
      } catch {
        return field
      }
    }
    if (typeof field === 'object' && (field.en || field['en'])) {
      return field.en || field['en']
    }
    return String(field)
  }

  return {
    id: backendJob.id,
    title: backendJob.title.en,
    company: backendJob.organizations?.name.en || 'Company Name',
    location: locationString,
    type: backendJob.job_type.replace('_', ' ').toLowerCase(),
    rating: backendJob.rating || 4.5,
    logo: backendJob.organizations?.logo_url || '/company-logos/placeholder.png',
    description: backendJob.description.en,
    salary: salaryString,
    postedAt: backendJob.created_at,
    skills: backendJob.skills || [],
    remote: backendJob.remote,
    organization: backendJob.organizations ? {
      industry: parseLocalizedField(backendJob.organizations.industry),
      size_range: parseLocalizedField(backendJob.organizations.size_range),
      founded_year: backendJob.organizations.founded_year,
      company_type: parseLocalizedField(backendJob.organizations.company_type)
    } : undefined
  }
}

// API Client functions
export async function getJobs(page: number = 0, pageSize: number = 15): Promise<JobsResponse> {
  try {
    const response = await fetch(
      `http://127.0.0.1:8080/v1/jobs/with/organizations?page=${page}&page_size=${pageSize}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch jobs')
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching jobs:', error)
    throw error
  }
}

export async function getJob(id: string): Promise<Job | null> {
  if (!id) throw new Error('Job ID is required')
  
  try {
    const response = await fetch(`http://127.0.0.1:8080/v1/jobs/with/organizations/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Failed to fetch job: ${response.statusText}`)
    }
    
    const data: ApiJob = await response.json()
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
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch similar jobs')
    }
    
    const data: JobsResponse = await response.json()
    return data.data.map(mapBackendJobToFrontend)
  } catch (error) {
    console.error('Error fetching similar jobs:', error)
    throw error
  }
}