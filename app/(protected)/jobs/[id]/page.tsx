import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Share2, BookmarkIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { OrganizationAvatar } from '@/components/ui/organization-avatar'

interface PageProps {
  params: {
    id: string;
  };
}

interface JobWithOrganization {
  id: string
  title: string
  description: string
  requirements: string[]
  skills: string[]
  status: string
  created_at: string
  location: string | null
  job_type: string | null
  salary_min: number | null
  salary_max: number | null
  remote: boolean
  rating: number | null
  organization: {
    id: string
    name: string
    logo_url: string | null
  }
}

export default async function JobPage({ 
  params,
}: PageProps) {
  const supabase = createClient()
  
  const { data: job, error } = await supabase
    .from('jobs')
    .select(`
      *,
      organization:organizations (
        name,
        id,
        logo_url
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !job) {
    notFound()
  }

  const typedJob = job as JobWithOrganization
  const salary = typedJob.salary_min && typedJob.salary_max 
    ? `$${typedJob.salary_min/1000}k - $${typedJob.salary_max/1000}k`
    : 'Competitive'

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="h-16 w-16 flex-shrink-0">
                  <OrganizationAvatar
                    name={typedJob.organization.name}
                    logoUrl={typedJob.organization.logo_url}
                    size={64}
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold">{typedJob.title}</h1>
                  <div className="mt-1">
                    <h2 className="text-base font-medium">{typedJob.organization.name}</h2>
                    <p className="text-sm text-gray-600">IT & Software, Service</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <BookmarkIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Job Type</h3>
                <p className="mt-1">{typedJob.job_type || 'Full-time'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Location</h3>
                <p className="mt-1">{typedJob.location || 'Remote'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Work Type</h3>
                <p className="mt-1">{typedJob.remote ? 'Remote' : 'On-site'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Salary Range</h3>
                <p className="mt-1">{salary}</p>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium">Overview</h3>
              <p className="mt-2 text-gray-600">{typedJob.description}</p>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium">Required Skills</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {typedJob.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium">Requirements</h3>
              <ul className="mt-4 list-inside list-disc space-y-2 text-gray-600">
                {typedJob.requirements.map((req) => (
                  <li key={req}>{req}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="text-lg font-medium">Similar jobs</h3>
            <div className="mt-4 space-y-4">
              {/* TODO: Add similar jobs based on skills */}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <p className="text-lg font-medium">Are you interested in this job?</p>
          <div className="flex gap-4">
            <Button variant="outline">Contact us</Button>
            <Button>Apply now</Button>
          </div>
        </div>
      </div>
    </div>
  )
} 