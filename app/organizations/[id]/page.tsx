import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrganizationProfile } from '@/components/organization/profile'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type OrganizationMember } from '@/types/organization'
import Link from 'next/link'
import { type Job } from '@/types/job'

interface PageProps {
  params: { id: string }
}

export default async function OrganizationPage({ params }: PageProps) {
  const id = await Promise.resolve(params.id)
  
  // Fetch organization data from our API route
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/organizations/${id}`)
  
  if (!response.ok) {
    console.error('Error fetching organization:', response.statusText)
    notFound()
  }

  const organization = await response.json()

  // Get current user's session (optional)
  const supabase = createClient()
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
      .eq('organization_id', id)
      .order('role', { ascending: true })
      .order('created_at', { ascending: false })

    if (teamMembers) {
      members = teamMembers as OrganizationMember[]
      currentMember = members.find(m => m.user_id === user.id)
    }
  }

  // Check if user can edit (owner or admin)
  const canEdit = currentMember?.role === 'OWNER' || currentMember?.role === 'ADMIN'

  return (
    <div className="flex-1 space-y-8 p-4">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{organization.name.en}</h1>
          {canEdit && (
            <Link 
              href={`/organizations/${id}/edit`}
              className="text-sm text-primary hover:underline"
            >
              Edit Organization
            </Link>
          )}
        </div>
        <OrganizationProfile organization={organization} />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="culture">Culture</TabsTrigger>
          <TabsTrigger value="news">News</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* Overview Tab */}
          <div className="space-y-6">
            <div className="prose max-w-none">
              <h3>About Us</h3>
              <p>{organization.description?.en || 'No description available.'}</p>
            </div>

            {organization.jobs?.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4">Latest Job Openings</h3>
                <div className="grid gap-4">
                  {organization.jobs.slice(0, 3).map((job: Job) => (
                    <div key={job.id} className="p-4 border rounded-lg">
                      <h4 className="font-medium">{job.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{job.location}</p>
                    </div>
                  ))}
                </div>
                {organization.jobs.length > 3 && (
                  <div className="mt-4">
                    <Link href={`/jobs?organization=${id}`} className="text-primary hover:underline">
                      View all {organization.jobs.length} jobs
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