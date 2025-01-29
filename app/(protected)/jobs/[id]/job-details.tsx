'use client'

import { Button } from '@/components/ui/button'
import { Share2, BookmarkIcon, AlertTriangle, Building2, MapPin, Briefcase, DollarSign, Shield, X } from 'lucide-react'
import { OrganizationAvatar } from '@/components/ui/organization-avatar'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { useState, useEffect } from 'react'
import Link from 'next/link'

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
    slug: string
  }
}

interface JobDetailsProps {
  job: JobWithOrganization
}

function SafetyTipsAlert() {
  const [showAlert, setShowAlert] = useState(true)

  useEffect(() => {
    const hideAlert = localStorage.getItem('hideSafetyTips')
    if (hideAlert === 'true') {
      setShowAlert(false)
    }
  }, [])

  const handleHideAlert = () => {
    localStorage.setItem('hideSafetyTips', 'true')
    setShowAlert(false)
  }

  if (!showAlert) return null

  return (
    <Alert variant="default" className="bg-yellow-50 text-yellow-900 border-yellow-200 relative">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="pr-8">Safety Tips for Job Seekers</AlertTitle>
      <AlertDescription>
        <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
          <li>Never pay any fees for job applications or interviews</li>
          <li>Verify the company&apos;s office address and registration</li>
          <li>Research the company and verify their background</li>
          <li>Don&apos;t share personal financial information before being hired</li>
          <li>Be cautious of work-from-home opportunities that seem too good to be true</li>
        </ul>
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-yellow-900 hover:bg-yellow-100"
            onClick={handleHideAlert}
          >
            Don&apos;t show again
          </Button>
        </div>
      </AlertDescription>
      <button
        onClick={() => setShowAlert(false)}
        className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
    </Alert>
  )
}

export default function JobDetails({ job }: JobDetailsProps) {
  const salary = job.salary_min && job.salary_max 
    ? `$${job.salary_min/1000}k - $${job.salary_max/1000}k`
    : 'Competitive'

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4">
        <div className="py-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Job Header Card */}
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="h-16 w-16 flex-shrink-0">
                      <OrganizationAvatar
                        name={job.organization.name}
                        logoUrl={job.organization.logo_url}
                        size={64}
                      />
                    </div>
                    <div>
                      <h1 className="text-2xl font-semibold">{job.title}</h1>
                      <div className="mt-1">
                        <h2 className="text-base font-medium">{job.organization.name}</h2>
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
              </div>

              {/* Safety Tips Alert */}
              <SafetyTipsAlert />

              {/* Job Details Card */}
              <div className="rounded-lg bg-white p-6 shadow-sm space-y-6">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-gray-500" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Job Type</h3>
                      <p className="mt-1">{job.job_type || 'Full-time'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Location</h3>
                      <p className="mt-1">{job.location || 'Remote'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Work Type</h3>
                      <p className="mt-1">{job.remote ? 'Remote' : 'On-site'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Salary Range</h3>
                      <p className="mt-1">{salary}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="mt-8">
                  <h3 className="text-lg font-medium">Overview</h3>
                  <p className="mt-2 text-gray-600">{job.description}</p>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-medium">Required Skills</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {job.skills.map((skill) => (
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
                    {job.requirements.map((req) => (
                      <li key={req}>{req}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Verification and Actions Card */}
              <div className="rounded-lg bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <Shield className="h-5 w-5 text-green-600" />
                  <p className="text-sm font-medium text-green-900">Verified Job Posting</p>
                </div>
                <Button className="w-full" size="lg">
                  Apply Now
                </Button>
                <Button className="w-full" variant="outline">
                  Save Job
                </Button>
              </div>

              {/* Company Info Card */}
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h3 className="text-lg font-medium">About the Company</h3>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <OrganizationAvatar
                      name={job.organization.name}
                      logoUrl={job.organization.logo_url}
                      size={40}
                    />
                    <div>
                      <h4 className="font-medium">{job.organization.name}</h4>
                      <p className="text-sm text-gray-600">Member since {new Date(job.created_at).getFullYear()}</p>
                    </div>
                  </div>
                  <Link href={`/organization/${job.organization.slug}`} className="block">
                    <Button className="w-full" variant="outline">
                      View Company Profile
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Similar Jobs Card */}
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h3 className="text-lg font-medium">Similar Jobs</h3>
                <div className="mt-4 space-y-4">
                  {/* TODO: Add similar jobs based on skills */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 