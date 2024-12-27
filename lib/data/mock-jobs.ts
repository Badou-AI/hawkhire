import { type Job } from '@/types/job'

export const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    company: 'TechCorp',
    location: 'San Francisco, CA',
    type: 'Full-time',
    rating: 4.8,
    logo: '/company-logos/techcorp.png',
    description: 'Join our team as a Senior Frontend Developer working with React, TypeScript, and Next.js to build scalable web applications.',
    salary: '$120k - $180k',
    postedAt: '2024-03-20T08:00:00Z',
    skills: ['React', 'TypeScript', 'Next.js', 'TailwindCSS'],
    remote: true
  },
  {
    id: '2', 
    title: 'Product Designer',
    company: 'DesignHub',
    location: 'New York, NY',
    type: 'Full-time',
    rating: 4.5,
    logo: '/company-logos/designhub.png',
    description: "We're looking for a Product Designer to join our growing team. You'll be working on exciting projects for Fortune 500 clients.",
    salary: '$90k - $130k',
    postedAt: '2024-03-19T15:30:00Z',
    skills: ['Figma', 'UI/UX', 'Design Systems', 'User Research'],
    remote: false
  },
  {
    id: '3',
    title: 'DevOps Engineer',
    company: 'CloudScale',
    location: 'Remote',
    type: 'Full-time',
    rating: 4.9,
    logo: '/company-logos/cloudscale.png',
    description: 'Looking for a DevOps Engineer to help us scale our cloud infrastructure and implement CI/CD pipelines.',
    salary: '$130k - $180k',
    postedAt: '2024-03-18T10:15:00Z',
    skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform'],
    remote: true
  },
  {
    id: '4',
    title: 'Marketing Manager',
    company: 'GrowthCo',
    location: 'Austin, TX',
    type: 'Full-time',
    rating: 4.6,
    logo: '/company-logos/growthco.png',
    description: 'Join our marketing team to lead growth initiatives and develop comprehensive marketing strategies.',
    salary: '$85k - $120k',
    postedAt: '2024-03-17T14:45:00Z',
    skills: ['Digital Marketing', 'SEO', 'Content Strategy', 'Analytics'],
    remote: true
  },
  {
    id: '5',
    title: 'Backend Developer',
    company: 'DataFlow',
    location: 'Seattle, WA',
    type: 'Contract',
    rating: 4.7,
    logo: '/company-logos/dataflow.png',
    description: 'Backend developer needed for building scalable APIs and microservices using Node.js and PostgreSQL.',
    salary: '$100k - $150k',
    postedAt: '2024-03-16T09:20:00Z',
    skills: ['Node.js', 'PostgreSQL', 'Redis', 'GraphQL'],
    remote: false
  },
  // Add 15 more job listings with varied roles, companies, and details...
]

// Helper function to get jobs by filter
export function getFilteredJobs(filters: {
  search?: string
  location?: string
  type?: string[]
  remote?: boolean
  salaryRange?: [number, number]
}) {
  let filtered = [...mockJobs]

  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    filtered = filtered.filter(job => 
      job.title.toLowerCase().includes(searchLower) ||
      job.company.toLowerCase().includes(searchLower) ||
      job.description.toLowerCase().includes(searchLower)
    )
  }

  if (filters.location) {
    const locationLower = filters.location.toLowerCase()
    filtered = filtered.filter(job =>
      job.location.toLowerCase().includes(locationLower)
    )
  }

  if (filters.type?.length) {
    filtered = filtered.filter(job =>
      filters.type.includes(job.type)
    )
  }

  if (filters.remote !== undefined) {
    filtered = filtered.filter(job =>
      job.remote === filters.remote
    )
  }

  if (filters.salaryRange) {
    const [min, max] = filters.salaryRange
    filtered = filtered.filter(job => {
      const salary = parseInt(job.salary.replace(/[^0-9]/g, ''))
      return salary >= min && salary <= max
    })
  }

  return filtered
} 