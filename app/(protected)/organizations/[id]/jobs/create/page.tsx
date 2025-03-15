import { notFound } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { JobCreationForm } from "./job-creation-form"
import { BulkCreateDialog } from "./bulk-create-dialog"

interface CreateJobPageProps {
  params: {
    id: string
  }
}

export default async function CreateJobPage({ params }: CreateJobPageProps) {
  const organizationId = params.id

  if (!organizationId || organizationId === "[id]") {
    return notFound()
  }

  const supabase = createServerComponentClient({ cookies })
  
  const { data: organization, error } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("id", organizationId)
    .single()

  if (error || !organization) {
    console.error("Error fetching organization:", error)
    return notFound()
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Create Job</h1>
        <BulkCreateDialog organizationId={organizationId} />
      </div>
      <JobCreationForm organizationId={organizationId} />
    </div>
  )
} 