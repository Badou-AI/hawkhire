import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Share2, BookmarkIcon } from 'lucide-react'
import { getJob, getSimilarJobs } from '@/app/api/jobs/client'
import { type Job } from '@/types/job'
import Link from 'next/link'

type Params = Promise<{ id: string }>

export default async function JobPage({
  params,
}: {
  params: Params
}) {
  try {
    // Ensure params.id exists before using it
    const resolvedParams = await params;
    const jobId = resolvedParams.id;
    if (!jobId) {
      return notFound()
    }

    const job = await getJob(jobId)
    console.log('Job:', job)
    if (!job) {
      return notFound()
    }

    console.log('Fetching similar jobs for:', jobId)
    const similarJobs = await getSimilarJobs(jobId)
    console.log('Found similar jobs:', similarJobs.length)

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="h-16 w-16 flex-shrink-0">
                    <Image
                      src={job.logo}
                      alt={`${job.company} logo`}
                      width={64}
                      height={64}
                      className="rounded-lg object-contain"
                      quality={95}
                      priority
                    />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold">{job.title}</h1>
                    <div className="mt-1">
                      <h2 className="text-base font-medium">{job.company}</h2>
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
                  <h3 className="text-sm font-medium text-gray-500">Experience</h3>
                  <p className="mt-1">Minimum 1 Year</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Work Level</h3>
                  <p className="mt-1">Senior Level</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Job Type</h3>
                  <p className="mt-1">{job.type}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Offer Salary</h3>
                  <p className="mt-1">{job.salary}</p>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium">Overview</h3>
                <p className="mt-2 text-gray-600">{job.summary}</p>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium">Job Description</h3>
                <ul className="mt-4 list-inside list-disc space-y-2 text-gray-600">
                  <li>Provide clear user flow and wireframe</li>
                  <li>Build prototype and do usability testing to solve user problems</li>
                  <li>Follow design system guidelines</li>
                  <li>Explore best practice approach to execute comprehensive documentation</li>
                  <li>Mentor and coach junior team member to ensure the best design implementation</li>
                  <li>Being a consultant for other UX Designers in at least 3 tribes</li>
                </ul>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium">What we offer</h3>
                <ul className="mt-4 list-inside list-disc space-y-2 text-gray-600">
                  <li>Competitive salary</li>
                  <li>Office in {job.location}</li>
                  <li>A lot of responsibility and freedom</li>
                  <li>Be part of a funded startup and an exciting international growth journey</li>
                  <li>Opportunity to work closely with and learn from an experienced team</li>
                  <li>A small dedicated team with a fun, personal, and friendly culture</li>
                  <li>Opportunity to grow your responsibility as the company grows</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Company Card */}
            <div className="rounded-lg bg-white p-6 shadow-sm mb-6">
              <h3 className="text-lg font-medium">About the Company</h3>
              <div className="mt-4">
                <div className="flex items-center gap-3 mb-4">
                  <Image
                    src={job.logo}
                    alt={`${job.company} logo`}
                    width={48}
                    height={48}
                    className="rounded-lg object-contain"
                    quality={95}
                  />
                  <div>
                    <h4 className="font-medium">{job.company}</h4>
                    <p className="text-sm text-gray-600">{job.location}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <h5 className="text-sm font-medium text-gray-500">Industry</h5>
                    <p className="text-sm">{job.organization?.industry || 'Technology'}</p>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-500">Company Size</h5>
                    <p className="text-sm">{job.organization?.size_range || '51-200 employees'}</p>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-500">Founded</h5>
                    <p className="text-sm">{job.organization?.founded_year || 'N/A'}</p>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-500">Type</h5>
                    <p className="text-sm">{job.organization?.company_type || 'Private'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Similar Jobs Card */}
            {similarJobs.length > 0 && (
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h3 className="text-lg font-medium">Similar jobs</h3>
                <div className="mt-4 space-y-4">
                  {similarJobs.map((similarJob: Job) => (
                    <Link 
                      key={similarJob.id} 
                      href={`/job-board/${similarJob.id}`}
                      className="group flex gap-4 hover:bg-gray-50 p-3 rounded-lg transition-colors"
                    >
                      <div className="h-12 w-12 flex-shrink-0">
                        <Image
                          src={similarJob.logo}
                          alt={`${similarJob.company} logo`}
                          width={48}
                          height={48}
                          className="rounded-lg object-contain"
                          quality={95}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate group-hover:text-blue-600 transition-colors">
                          {similarJob.title}
                        </h4>
                        <p className="text-sm text-gray-600 truncate">{similarJob.company}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{similarJob.location}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-gray-500">{similarJob.type}</span>
                          {similarJob.remote && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="text-xs text-gray-500">Remote</span>
                            </>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {similarJob.skills.slice(0, 3).map((skill, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                            >
                              {skill}
                            </span>
                          ))}
                          {similarJob.skills.length > 3 && (
                            <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
                              +{similarJob.skills.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
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
  } catch (error) {
    console.error('Error in JobPage:', error)
    return notFound()
  }
} 