import { createClient } from '@/lib/supabase/server'
import { JobCard } from '@/components/job/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Search, SlidersHorizontal } from 'lucide-react'
import { type Job } from '@/app/types/job'

export default async function JobBoardPage() {
  const supabase = createClient()

  // Get all published jobs
  const { data: jobs } = await supabase
    .from('jobs')
    .select(`
      *,
      organization:organizations (
        id,
        name,
        industry,
        size_range,
        logo_url
      )
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  // Filter out jobs without organization data
  const validJobs = jobs?.filter((job): job is Job & {
    organization: NonNullable<Job['organization']>
  } => job.organization !== null) || []

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Job Board</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        {/* Filters */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                className="pl-8"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Job Type</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select job type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full-time">Full Time</SelectItem>
                <SelectItem value="part-time">Part Time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="on-site">On Site</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Experience Level</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select experience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entry">Entry Level</SelectItem>
                <SelectItem value="mid">Mid Level</SelectItem>
                <SelectItem value="senior">Senior Level</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" className="w-full gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Reset Filters
          </Button>
        </div>

        {/* Job List */}
        <div className="space-y-4">
          {validJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </div>
    </div>
  )
} 