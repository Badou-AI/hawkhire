import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrganizationProfile } from '@/components/organization/profile'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type Job } from '@/types/job'
import { type OrganizationMember } from '@/types/organization'
import Link from 'next/link'

interface PageProps {
  params: {
    slug: string
  }
}

export default async function OrganizationPage({ params }: PageProps) {
  const supabase = createClient()
  const slug = await Promise.resolve(params.slug)
  
  console.log('Fetching organization with slug:', slug)
  
  // First, let's try a simpler query to verify basic connectivity
  const { data: basicOrg, error: basicError } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single()

  console.log('Basic query result:', { data: basicOrg, error: basicError })

  if (basicError || !basicOrg) {
    console.error('Error fetching basic organization data:', basicError)
    notFound()
  }

  // Now fetch the full organization data
  const { data: organization, error } = await supabase
    .from('organizations')
    .select(`
      *,
      jobs(
        id,
        title,
        location,
        job_type,
        salary_min,
        salary_max,
        created_at,
        status,
        remote
      ),
      jobs_count:jobs(count)
    `)
    .eq('slug', slug)
    .single()

  console.log('Full query result:', { data: organization, error })

  if (error) {
    console.error('Error fetching full organization data:', error)
    notFound()
  }

  if (!organization) {
    console.error('No organization found with slug:', slug)
    notFound()
  }

  console.log('Found organization:', organization.name)

  // Get the latest 3 jobs
  const latestJobs = (organization.jobs as Job[])?.slice(0, 3) || []
  const totalJobs = organization.jobs_count?.[0]?.count || 0

  // Get current user's session (optional)
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  // Get team members and current user's role if authenticated
  let members: OrganizationMember[] = []
  let currentMember = null

  if (user) {
    // Use Supabase to fetch team members
    const { data: teamMembers } = await supabase
      .from('organization_members')
      .select()
      .eq('organization_id', organization.id)
      .order('role', { ascending: true })
      .order('created_at', { ascending: false })

    if (teamMembers) {
      members = teamMembers as OrganizationMember[]
      currentMember = members.find(m => m.user_id === user.id)
    }
  }

  return (
    <div className="flex-1 space-y-8 p-4">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{organization.name}</h1>
        <OrganizationProfile organization={organization} />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {user && <TabsTrigger value="team">Team</TabsTrigger>}
          <TabsTrigger value="culture">Culture</TabsTrigger>
          <TabsTrigger value="news">News</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* Overview Tab */}
          <div className="space-y-6">
            <div className="prose max-w-none">
              <h3>About Us</h3>
              <p>{organization.description || 'No description available.'}</p>
            </div>

            {latestJobs.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4">Latest Job Openings</h3>
                <div className="grid gap-4">
                  {latestJobs.map(job => (
                    <div key={job.id} className="p-4 border rounded-lg">
                      <h4 className="font-medium">{job.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{job.location}</p>
                    </div>
                  ))}
                </div>
                {totalJobs > 3 && (
                  <div className="mt-4">
                    <Link href={`/jobs?organization=${organization.id}`} className="text-primary hover:underline">
                      View all {totalJobs} jobs
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Tabs>
    </div>
  )
} 