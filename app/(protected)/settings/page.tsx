"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FileText, ExternalLink } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { OrganizationCard } from "@/components/profile/organization-card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

interface Organization {
  id: string
  name: { en: string; fr?: string }
  description: { en: string; fr?: string }
  logo_url?: string
  cover_image_url?: string
  industry?: string
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED'
  _count?: {
    members: number
    jobs: number
  }
}

interface OrganizationMember {
  organization_id: string
  role: string
}

interface ProcessedJob {
  id: string
  title: { en: string; fr?: string }
  organization_id: string
  organization_name: string
  status: string
  created_at: string
  updated_at: string
  resume_count: number
  search_index_name: string | null
}

export default function SettingsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [memberships, setMemberships] = useState<OrganizationMember[]>([])
  const [processedJobs, setProcessedJobs] = useState<ProcessedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [jobsLoading, setJobsLoading] = useState(true)

  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const supabase = createClient()
        const userId = (await supabase.auth.getUser()).data.user?.id

        if (!userId) {
          setLoading(false)
          return
        }
        
        // Get user's member records with roles
        const { data: memberData } = await supabase
          .from('organization_members')
          .select('organization_id, role')
          .eq('user_id', userId)

        if (!memberData?.length) {
          setLoading(false)
          return
        }

        setMemberships(memberData)

        // Get organization details with counts
        const organizationIds = memberData.map(m => m.organization_id)
        const { data: orgs } = await supabase
          .from('organizations')
          .select(`
            id, 
            name, 
            description,
            logo_url,
            cover_image_url,
            industry,
            verification_status,
            organization_members(count),
            jobs(count)
          `)
          .in('id', organizationIds)

        // Transform the data to match our interface
        const transformedOrgs = orgs?.map(org => ({
          ...org,
          _count: {
            members: org.organization_members?.[0]?.count || 0,
            jobs: org.jobs?.[0]?.count || 0
          }
        }))

        setOrganizations(transformedOrgs || [])
      } catch (error) {
        console.error('Error fetching organizations:', error)
      } finally {
        setLoading(false)
      }
    }

    async function fetchProcessedJobs() {
      try {
        setJobsLoading(true)
        const supabase = createClient()
        const userId = (await supabase.auth.getUser()).data.user?.id

        if (!userId) {
          setJobsLoading(false)
          return
        }

        // Get user's organizations
        const { data: memberData } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', userId)

        if (!memberData?.length) {
          setJobsLoading(false)
          return
        }

        const organizationIds = memberData.map(m => m.organization_id)

        // Get jobs with resume processing from user's organizations
        const { data: jobs, error: jobsError } = await supabase
          .from('jobs')
          .select(`
            id,
            title,
            organization_id,
            organizations(name),
            status,
            created_at,
            updated_at,
            search_index_name
          `)
          .in('organization_id', organizationIds)
          .not('search_index_name', 'is', null)
          .order('updated_at', { ascending: false })

        // Log any errors
        if (jobsError) {
          console.error('Error fetching jobs:', jobsError)
        }

        // Now fetch resume counts separately for each job
        const jobsWithResumeCounts = await Promise.all(
          (jobs || []).map(async (job) => {
            const { count, error: countError } = await supabase
              .from('resumes')
              .select('*', { count: 'exact', head: true })
              .eq('job_id', job.id)
            
            if (countError) {
              console.error(`Error fetching resume count for job ${job.id}:`, countError)
            }

            return {
              ...job,
              resume_count: count || 0
            }
          })
        )

        console.log('Jobs with resume counts:', jobsWithResumeCounts)

        // Transform the data
        const transformedJobs = jobsWithResumeCounts.map(job => ({
          id: job.id,
          title: job.title,
          organization_id: job.organization_id,
          organization_name: job.organizations?.[0]?.name || 'Unknown Organization',
          status: job.status,
          created_at: job.created_at,
          updated_at: job.updated_at,
          resume_count: job.resume_count,
          search_index_name: job.search_index_name
        }))

        setProcessedJobs(transformedJobs)
      } catch (error) {
        console.error('Error fetching processed jobs:', error)
      } finally {
        setJobsLoading(false)
      }
    }

    fetchOrganizations()
    fetchProcessedJobs()
  }, [])

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Tabs defaultValue="organizations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="processed-jobs">Processed Jobs</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold">Profile Information</h2>
            {/* TODO: Add profile form */}
          </Card>
        </TabsContent>

        <TabsContent value="organizations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Your Organizations</h2>
            <Button asChild>
              <Link href="/organizations/create" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Organization
              </Link>
            </Button>
          </div>

          <div className="grid gap-6">
            {loading ? (
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">Loading organizations...</p>
              </Card>
            ) : organizations.length > 0 ? (
              organizations.map((org) => (
                <OrganizationCard
                  key={org.id}
                  organization={org}
                  isOwner={memberships.find(m => m.organization_id === org.id)?.role === 'OWNER'}
                />
              ))
            ) : (
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">
                  You haven&apos;t created or joined any organizations yet.
                </p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="processed-jobs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Resume Processed Jobs</h2>
            <Button asChild>
              <Link href="/resume-processing" className="gap-2">
                <FileText className="h-4 w-4" />
                Process New Resumes
              </Link>
            </Button>
          </div>

          <div className="grid gap-6">
            {jobsLoading ? (
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">Loading processed jobs...</p>
              </Card>
            ) : processedJobs.length > 0 ? (
              processedJobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{job.title.en}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {job.organization_name}
                        </p>
                      </div>
                      <Badge variant={job.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                        {job.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Processed Resumes:</span>
                        <span className="font-medium">{job.resume_count}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last Updated:</span>
                        <span className="font-medium">
                          {formatDistanceToNow(new Date(job.updated_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex justify-end">
                        <Button asChild variant="outline" size="sm" className="gap-2">
                          <Link href={`/resume-processing/matches?jobId=${job.id}`}>
                            <ExternalLink className="h-4 w-4" />
                            View Matches
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">
                  No jobs with processed resumes found. Process resumes for a job to see results here.
                </p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold">User Preferences</h2>
            {/* TODO: Add preferences form */}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 