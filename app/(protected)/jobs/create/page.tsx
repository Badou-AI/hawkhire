import { JobCreationForm } from "./job-creation-form"

export default function CreateJobPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Create Vacancy</h1>
        <p className="text-sm text-muted-foreground">Create a new job posting</p>
      </div>

      <div className="relative flex min-h-[calc(100vh-12rem)]">
        {/* Main scrollable content */}
        <div className="w-full overflow-y-auto scrollbar-hide">
          <div className="rounded-lg bg-background">
            <JobCreationForm />
          </div>
        </div>
      </div>
    </div>
  )
} 