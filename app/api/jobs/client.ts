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
  title: string
  organizations: Organization
  location: {
    city: LocalizedText
    state: LocalizedText
  }
  job_type: string
  rating: number | null
  description: string
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
  processed?: {
    index_name: string
    total_applicants: number
    last_processed_at: string
    processing_status: string
    average_match_score?: number
    top_skills?: Array<{
      skill: string
      count: number
      average_score: number
    }>
    error_message?: string
    processing_duration?: number
  }
}

export interface JobsResponse {
  data: ApiJob[]
  page: number
  page_size: number
  total: number
}

import { ProcessedJob } from '@/types/job'

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
  processed?: ProcessedJob;
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
    if (typeof field === 'object') {
      // Check if it has an 'en' property
      if ('en' in field && typeof field.en === 'string') {
        return field.en
      }
      // Otherwise try to get the first value
      const values = Object.values(field)
      if (values.length > 0 && typeof values[0] === 'string') {
        return values[0]
      }
    }
    return String(field)
  }

  // Extract title from potentially complex structure
  let title = ''
  if (typeof backendJob.title === 'string') {
    title = backendJob.title
  } else if (typeof backendJob.title === 'object' && backendJob.title !== null) {
    // Handle the potential structure variations
    const titleObj = backendJob.title as unknown as { en?: string };
    title = titleObj.en || '';
  }

  // Extract company name
  let company = 'Company Name!'
  if (backendJob.organizations) {
    if (typeof backendJob.organizations.name === 'string') {
      company = backendJob.organizations.name
    } else if (typeof backendJob.organizations.name === 'object' && backendJob.organizations.name !== null) {
      // Handle the potential structure variations
      const nameObj = backendJob.organizations.name as unknown as { en?: string };
      company = nameObj.en || 'Company Name!';
    }
  }

  // Extract description
  let description = ''
  if (typeof backendJob.description === 'string') {
    description = backendJob.description
  } else if (typeof backendJob.description === 'object' && backendJob.description !== null) {
    // Handle the potential structure variations
    const descObj = backendJob.description as unknown as { en?: string };
    description = descObj.en || '';
  }

  return {
    id: backendJob.id,
    title,
    company,
    location: locationString,
    type: backendJob.job_type.replace('_', ' ').toLowerCase(),
    rating: backendJob.rating || 4.5,
    logo: backendJob.organizations?.logo_url || '/company-logos/placeholder.png',
    description,
    salary: salaryString,
    postedAt: backendJob.created_at,
    skills: backendJob.skills || [],
    remote: backendJob.remote,
    organization: backendJob.organizations ? {
      industry: parseLocalizedField(backendJob.organizations.industry),
      size_range: parseLocalizedField(backendJob.organizations.size_range),
      founded_year: backendJob.organizations.founded_year,
      company_type: parseLocalizedField(backendJob.organizations.company_type)
    } : undefined,
    processed: backendJob.processed ? {
      index_name: backendJob.processed.index_name,
      total_applicants: backendJob.processed.total_applicants,
      last_processed_at: backendJob.processed.last_processed_at,
      processing_status: backendJob.processed.processing_status as 'pending' | 'processing' | 'completed' | 'failed',
      average_match_score: backendJob.processed.average_match_score,
      top_skills: backendJob.processed.top_skills,
      error_message: backendJob.processed.error_message,
      processing_duration: backendJob.processed.processing_duration
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

export async function getSimilarJobs(jobId: string, limit = 4): Promise<Job[]> {
  try {
    // First get the current job to use its properties for comparison
    const currentJob = await getJob(jobId)
    if (!currentJob) throw new Error('Job not found')

    console.log('Current job:', {
      id: currentJob.id,
      title: currentJob.title,
      skills: currentJob.skills,
      industry: currentJob.organization?.industry
    })

    // Build search parameters focusing on skills and industry
    const searchParams = new URLSearchParams({
      page: '0',
      page_size: String(limit + 5), // Request extra to account for filtering
      exclude_id: jobId
    })

    // Add skills if available - require matching ANY of the skills
    if (currentJob.skills.length) {
      searchParams.append('skills', currentJob.skills.join(','))
    }

    // Add industry if available
    if (currentJob.organization?.industry) {
      searchParams.append('industry', currentJob.organization.industry)
    }

    // Add semantic search parameters if we have title/description
    if (currentJob.title || currentJob.description) {
      searchParams.append('use_semantic', 'true')
      if (currentJob.title) {
        searchParams.append('job_title', currentJob.title)
      }
      if (currentJob.description) {
        // Only use first 500 chars of description to keep search focused
        searchParams.append('job_description', currentJob.description.slice(0, 500))
      }
    }
    
    console.log('Searching for similar jobs with params:', searchParams.toString())
    
    const response = await fetch(
      `http://127.0.0.1:8080/v1/jobs/with/organizations?${searchParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      }
    )
    
    if (!response.ok) {
      console.warn('Failed to fetch similar jobs:', await response.text())
      return []
    }
    
    const data: JobsResponse = await response.json()
    
    // Filter and sort results by relevance:
    // 1. Jobs with more matching skills get higher priority
    // 2. Same industry jobs get higher priority
    // 3. Remote/non-remote matching gets some priority
    const scoredJobs = data.data
      .filter(job => job.id !== jobId) // Ensure current job is filtered out
      .map(job => {
        let score = 0
        
        // Score based on matching skills
        const matchingSkills = job.skills.filter(skill => 
          currentJob.skills.includes(skill)
        )
        score += (matchingSkills.length / currentJob.skills.length) * 10

        // Score based on industry match
        if (job.organizations?.industry === currentJob.organization?.industry) {
          score += 5
        }

        // Small boost for matching remote status
        if (job.remote === currentJob.remote) {
          score += 2
        }

        return { job, score }
      })
      .sort((a, b) => b.score - a.score) // Sort by score descending
    
    console.log('Found similar jobs:', {
      total: scoredJobs.length,
      scores: scoredJobs.map(({ job, score }) => ({
        id: job.id,
        title: typeof job.title === 'string' ? job.title : 
               ((job.title as unknown as { en?: string }).en || 'Unknown'),
        score: Math.round(score * 100) / 100
      }))
    })

    // Return the top matches after mapping to frontend format
    return scoredJobs
      .slice(0, limit)
      .map(({ job }) => mapBackendJobToFrontend(job))
    
  } catch (error) {
    console.error('Error fetching similar jobs:', error)
    return []
  }
}