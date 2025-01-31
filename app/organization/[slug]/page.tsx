import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrganizationProfile } from '@/components/organization/profile'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type Job } from '@/types/job'
import { type OrganizationMember } from '@/types/organization'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Building2,
    MapPin,
    Globe,
    Users,
    Calendar,
    Languages, MapPinned
} from 'lucide-react'

interface PageProps {
  params: {
    slug: string
  }
}

export default async function OrganizationPage({ params }: PageProps) {
  const supabase = createClient()
  const slug = await Promise.resolve(params.slug)
  
  // Fetch the full organization data
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
      jobs_count:jobs(count),
      members:organization_members(
        id,
        user_id,
        role,
        title,
        status
      )
    `)
    .eq('slug', slug)
    .single()

  if (error || !organization) {
    console.error('Error fetching organization:', error)
    notFound()
  }

  // Get the latest 3 jobs
  const latestJobs = (organization.jobs as Job[])?.slice(0, 3) || []
  const totalJobs = organization.jobs_count?.[0]?.count || 0
  const verifiedMembers = (organization.members as OrganizationMember[])?.filter(m => m.status === 'active') || []

  return (
    <div className="flex-1 space-y-8 p-8 max-w-7xl mx-auto">
      {/* Cover Image */}
      {organization.cover_image_url && (
        <div className="relative h-48 md:h-64 w-full rounded-lg overflow-hidden">
          <img 
            src={organization.cover_image_url} 
            alt={`${organization.name} cover`}
            className="object-cover w-full h-full"
          />
        </div>
      )}

      {/* Organization Profile */}
      <div className="space-y-6">
        <OrganizationProfile organization={organization} />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Company Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Company Type */}
            <Card>
              <CardContent className="p-6 flex items-start space-x-4">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1">Company Type</h3>
                  <p className="text-sm text-muted-foreground">{organization.company_type}</p>
                </div>
              </CardContent>
            </Card>

            {/* Size Range */}
            <Card>
              <CardContent className="p-6 flex items-start space-x-4">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1">Company Size</h3>
                  <p className="text-sm text-muted-foreground">{organization.size_range}</p>
                </div>
              </CardContent>
            </Card>

            {/* Founded Year */}
            {organization.founded_year && (
              <Card>
                <CardContent className="p-6 flex items-start space-x-4">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-1">Founded</h3>
                    <p className="text-sm text-muted-foreground">{organization.founded_year}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Website */}
            {organization.website_url && (
              <Card>
                <CardContent className="p-6 flex items-start space-x-4">
                  <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-1">Website</h3>
                    <a 
                      href={organization.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {organization.website_url.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Primary Location */}
            <Card>
              <CardContent className="p-6 flex items-start space-x-4">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1">Primary Location</h3>
                  <p className="text-sm text-muted-foreground">{organization.primary_location}</p>
                </div>
              </CardContent>
            </Card>

            {/* Languages */}
            {organization.languages && organization.languages.length > 0 && (
              <Card>
                <CardContent className="p-6 flex items-start space-x-4">
                  <Languages className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-1">Languages</h3>
                    <div className="flex flex-wrap gap-2">
                      {organization.languages.map((lang) => (
                        <Badge key={lang} variant="secondary">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* About Section */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-medium">About {organization.name}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {organization.description || 'No description available.'}
              </p>

              {/* Industries */}
              {organization.industry && organization.industry.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Industries</h4>
                  <div className="flex flex-wrap gap-2">
                    {organization.industry.map((ind) => (
                      <Badge key={ind} variant="outline">
                        {ind}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Latest Jobs Preview */}
          {latestJobs.length > 0 && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Latest Job Openings</h3>
                  {totalJobs > 3 && (
                    <Link 
                      href={`/jobs?organization=${organization.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View all {totalJobs} jobs
                    </Link>
                  )}
                </div>
                <div className="grid gap-4">
                  {latestJobs.map(job => (
                    <Link 
                      key={job.id} 
                      href={`/jobs/${job.id}`}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <h4 className="font-medium">{job.title}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </span>
                        <Badge variant="secondary">{job.job_type}</Badge>
                        {job.remote && <Badge variant="outline">Remote</Badge>}
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="jobs">
          {/* Full Jobs List - To be implemented */}
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                Full jobs list coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          {/* Team Members Grid */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {verifiedMembers.map((member) => (
                  <div 
                    key={member.id}
                    className="flex items-start space-x-4 p-4 border rounded-lg"
                  >
                    <div className="space-y-2">
                      <p className="font-medium">{member.title}</p>
                      <Badge variant="secondary">{member.role}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations">
          {/* Locations List */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start space-x-4">
                <MapPinned className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h3 className="font-medium mb-3">Primary Location</h3>
                  <p className="text-sm text-muted-foreground">{organization.primary_location}</p>
                </div>
              </div>

              {organization.additional_locations && organization.additional_locations.length > 0 && (
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-3">Additional Locations</h3>
                  <div className="space-y-2">
                    {organization.additional_locations.map((location, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{location}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 