"use client"

import { OrganizationCreationForm } from "./organization-creation-form"

export default function CreateOrganizationPage() {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)]">
      <div className="flex-1 space-y-8 overflow-y-auto scrollbar-hide p-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create Organization</h1>
          <p className="text-sm text-muted-foreground">
            Create a new organization to start posting jobs and managing your team.
          </p>
        </div>

        <OrganizationCreationForm />
      </div>
    </div>
  )
} 