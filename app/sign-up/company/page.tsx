import { CompanyRegistrationForm } from '@/components/auth/company-registration-form'

export default function CompanyRegistrationPage() {
  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Create Company Account</h1>
        <p className="text-muted-foreground mt-2">
          For recruitment agencies and staffing firms
        </p>
      </div>
      <CompanyRegistrationForm />
    </div>
  )
} 