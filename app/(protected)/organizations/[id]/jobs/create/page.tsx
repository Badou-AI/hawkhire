import { JobCreationForm } from "./job-creation-form"
import { BulkCreateDialog } from "./bulk-create-dialog"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

interface PageProps {
  params: {
    id?: string
  }
}

export default async function CreateJobPage({ params }: PageProps) {
  // Defensive parameter handling
  let organizationId = null
  if (params) {
    const resolvedParams = await params // Await the params
    if (typeof resolvedParams.id === 'string') {
      organizationId = resolvedParams.id
    }
  }
  if (!organizationId) {
    notFound()
  }

  const supabase = createClient()
  const { data: organization, error } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', organizationId)
    .single()

  if (error || !organization) {
    console.error('Error fetching organization:', error)
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Create Vacancy</h1>
          <p className="text-sm text-muted-foreground">
            Create a new job posting for {organization.name.fr}
          </p>
        </div>
        <BulkCreateDialog organizationId={organizationId} />
      </div>

      <div className="relative flex min-h-[calc(100vh-12rem)]">
        {/* Main scrollable content */}
        <div className="w-full overflow-y-auto scrollbar-hide">
          <div className="rounded-lg bg-background">
            <JobCreationForm organizationId={organizationId} />
          </div>
        </div>
      </div>
    </div>
  )
} 