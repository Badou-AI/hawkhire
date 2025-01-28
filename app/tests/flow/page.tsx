'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2, XCircle, AlertCircle, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SupabaseError {
  message: string
  code?: string
  details?: string
  hint?: string
}

interface TestStep {
  id: string
  name: string
  description: string
  status: 'pending' | 'running' | 'success' | 'error'
  error?: string
  result?: Record<string, unknown>
}

export default function TestFlow() {
  const router = useRouter()
  const supabase = createClient()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [steps, setSteps] = useState<TestStep[]>([
    {
      id: 'create-org',
      name: 'Create Organization',
      description: 'Create a test organization and verify membership',
      status: 'pending'
    },
    {
      id: 'create-job',
      name: 'Create Job Posting',
      description: 'Create a draft job posting with requirements',
      status: 'pending'
    },
    {
      id: 'publish-job',
      name: 'Publish Job',
      description: 'Publish the job posting and verify public access',
      status: 'pending'
    },
    {
      id: 'submit-resume',
      name: 'Submit Resume',
      description: 'Submit a test resume to the published job',
      status: 'pending'
    },
    {
      id: 'verify-access',
      name: 'Verify Access',
      description: 'Verify resume access for both owner and organization',
      status: 'pending'
    }
  ])
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
    }
    checkAuth()
  }, [supabase.auth])

  const updateStepStatus = (
    stepId: string, 
    status: TestStep['status'], 
    error?: string, 
    result?: Record<string, unknown>
  ) => {
    setSteps(steps.map(step => 
      step.id === stepId 
        ? { ...step, status, error, result }
        : step
    ))
  }

  const runTest = async () => {
    setCurrentStepIndex(0)
    
    // Get the current user at the start since we'll need it multiple times
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) throw new Error('No authenticated user found')
    
    // Step 1: Create Organization
    let orgId: string
    try {
      updateStepStatus('create-org', 'running')

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: 'Test Organization',
          tier: 'free',
          members: [user.email]
        })
        .select()
        .single()

      if (orgError) throw orgError
      orgId = org.id
      updateStepStatus('create-org', 'success', undefined, org)
      setCurrentStepIndex(1)
    } catch (error: unknown) {
      const supabaseError = error as SupabaseError
      updateStepStatus('create-org', 'error', supabaseError.message)
      return
    }

    // Step 2: Create Job
    let jobId: string
    try {
      updateStepStatus('create-job', 'running')
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert({
          organization_id: orgId,
          title: 'Full Stack Developer',
          description: 'Test job posting for full stack developer position',
          requirements: ['React', 'TypeScript', 'Node.js'],
          skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
          status: 'draft'
        })
        .select()
        .single()

      if (jobError) throw jobError
      jobId = job.id
      updateStepStatus('create-job', 'success', undefined, job)
      setCurrentStepIndex(2)
    } catch (error: unknown) {
      const supabaseError = error as SupabaseError
      updateStepStatus('create-job', 'error', supabaseError.message)
      return
    }

    // Step 3: Publish Job
    try {
      updateStepStatus('publish-job', 'running')
      const { error: publishError } = await supabase
        .from('jobs')
        .update({ status: 'published' })
        .eq('id', jobId)

      if (publishError) throw publishError

      // Verify public access
      const { data: publicJob, error: accessError } = await supabase
        .from('jobs')
        .select()
        .eq('id', jobId)
        .single()

      if (accessError) throw accessError
      updateStepStatus('publish-job', 'success', undefined, publicJob)
      setCurrentStepIndex(3)
    } catch (error: unknown) {
      const supabaseError = error as SupabaseError
      updateStepStatus('publish-job', 'error', supabaseError.message)
      return
    }

    // Step 4: Submit Resume
    let resumeId: string
    try {
      updateStepStatus('submit-resume', 'running')
      const { data: resume, error: resumeError } = await supabase
        .from('resumes')
        .insert({
          job_id: jobId,
          user_id: user.id,
          file_path: '/test/resume.pdf',
          file_name: 'test_resume.pdf',
          file_size: 1024,
          mime_type: 'application/pdf',
          status: 'pending'
        })
        .select()
        .single()

      if (resumeError) throw resumeError
      resumeId = resume.id
      updateStepStatus('submit-resume', 'success', undefined, resume)
      setCurrentStepIndex(4)
    } catch (error: unknown) {
      const supabaseError = error as SupabaseError
      updateStepStatus('submit-resume', 'error', supabaseError.message)
      return
    }

    // Step 5: Verify Access
    try {
      updateStepStatus('verify-access', 'running')
      
      // Test owner access
      const { data: ownerAccess, error: ownerError } = await supabase
        .from('resumes')
        .select()
        .eq('id', resumeId)
        .single()

      if (ownerError) throw ownerError

      // Test org member access
      const { data: orgAccess, error: orgError } = await supabase
        .from('resumes')
        .select(`
          *,
          job:jobs (
            organization:organizations (
              name
            )
          )
        `)
        .eq('id', resumeId)
        .single()

      if (orgError) throw orgError

      updateStepStatus('verify-access', 'success', undefined, {
        ownerAccess,
        orgAccess
      })
      setCurrentStepIndex(5)
    } catch (error: unknown) {
      const supabaseError = error as SupabaseError
      updateStepStatus('verify-access', 'error', supabaseError.message)
    }
  }

  const handleStartTest = async () => {
    if (!isAuthenticated) {
      router.push('/sign-in?redirect=/tests/flow')
      return
    }
    await runTest()
  }

  const StatusIcon = ({ status }: { status: TestStep['status'] }) => {
    if (status === 'pending' || status === 'running') return null
    return status === 'success' ? 
      <CheckCircle2 className="h-5 w-5 text-green-500" /> : 
      <XCircle className="h-5 w-5 text-red-500" />
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Flow</CardTitle>
          <CardDescription>
            Test the complete job posting and resume submission flow
          </CardDescription>
          {isAuthenticated === false && (
            <div className="mt-2 p-2 bg-yellow-50 text-yellow-800 rounded-md text-sm">
              Please log in to run the tests
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id}>
                <div className="flex items-start justify-between p-4 border rounded">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{step.name}</span>
                      {step.status === 'running' && (
                        <Badge variant="outline" className="animate-pulse">
                          Running...
                        </Badge>
                      )}
                      {index === currentStepIndex && step.status === 'pending' && (
                        <Badge variant="outline">
                          Next up
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{step.description}</p>
                    {step.error && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        {step.error}
                      </div>
                    )}
                    {step.result && (
                      <pre className="mt-2 p-2 text-xs bg-gray-50 rounded overflow-auto">
                        {JSON.stringify(step.result, null, 2)}
                      </pre>
                    )}
                  </div>
                  <StatusIcon status={step.status} />
                </div>
                {index < steps.length - 1 && (
                  <div className="flex justify-center my-2">
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button 
              onClick={handleStartTest}
              disabled={currentStepIndex !== -1 && currentStepIndex < steps.length}
            >
              {!isAuthenticated 
                ? 'Login to Start' 
                : currentStepIndex === -1 
                  ? 'Start Test' 
                  : 'Test Complete'
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 