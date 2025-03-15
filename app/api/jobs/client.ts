// Types
import {
  Job,
  ApiJob,
  JobsResponse
} from '@/types';

// Get API URL from environment variable or use default
const API_URL = typeof window !== 'undefined' 
  ? process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080'
  : process.env.PYTHON_API_URL || 'http://127.0.0.1:8080'

// Helper function to map backend job response to frontend Job type
export function mapBackendJobToFrontend(backendJob: ApiJob): Job {
  // Extract location
  let locationString = '';
  if (typeof backendJob.location === 'object') {
    const city = backendJob.location?.city;
    const state = backendJob.location?.state;
    locationString = `${city}, ${state}`;
  }

  const salaryString = backendJob.salary_min && backendJob.salary_max
    ? `$${backendJob.salary_min/1000}k - $${backendJob.salary_max/1000}k ${backendJob.salary_currency}`
    : 'Competitive';


  // Extract title
  const title = backendJob.title;

  // Extract company name
  let company = 'Company Name';
  if (backendJob.organizations) {
    company = backendJob.organizations.name;
  }

  // Extract description
  const description = backendJob.description;

  return {
    id: backendJob.id,
    title,
    company,
    location: locationString,
    type: backendJob?.job_type?.replace('_', ' ').toLowerCase() || '',
    rating: backendJob.rating || 4.5,
    logo: backendJob.organizations?.logo_url || '/company-logos/placeholder.png',
    description,
    salary: salaryString,
    postedAt: backendJob.created_at || '',
    skills: backendJob.skills || [],
    remote: backendJob.remote || false,
    language: backendJob.language || '',
    summary: backendJob.summary || '',
    organization: backendJob.organizations ? {...backendJob.organizations} : undefined,
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
      `${API_URL}/v1/jobs/with/organizations?page=${page}&page_size=${pageSize}`,
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

export async function getJob(id: string, language: string = 'fr'): Promise<Job | null> {
  if (!id) throw new Error('Job ID is required')
  
  try {
    const response = await fetch(`${API_URL}/v1/jobs/with/organizations/${encodeURIComponent(id)}?language=${language}`, {
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
      `${API_URL}/v1/jobs/with/organizations?${searchParams.toString()}`,
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
        const matchingSkills = job.skills?.filter(skill => 
          currentJob.skills.includes(skill)
        )
        score += (matchingSkills?.length || 0 / currentJob.skills.length) * 10

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
               ((job.title as unknown as { fr?: string }).fr || 'Unknown'),
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