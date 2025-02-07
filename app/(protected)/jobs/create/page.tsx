import { Card } from "@/components/ui/card"
import { JobCreationForm } from "./job-creation-form"

export default function CreateJobPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Create Vacancy</h1>
        <p className="text-sm text-muted-foreground">Create a new job posting</p>
      </div>

      <Card className="p-6">
        <JobCreationForm />
      </Card>
    </div>
  )
} 