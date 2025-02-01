'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { SupabaseFileUpload } from '@/components/ui/supabase-file-upload'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'

const companySchema = z.object({
  name: z.string().min(3),
  type: z.enum(['recruitment_agency', 'corporate', 'startup', 'non_profit']),
  description: z.string().min(20),
  website: z.string().url(),
  industry: z.array(z.string()),
  location: z.string().min(3),
  logo: z.string().optional()
})

type CompanyFormValues = z.infer<typeof companySchema>

export function CompanyRegistrationForm() {
  const router = useRouter()
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      type: 'recruitment_agency',
      description: '',
      website: '',
      industry: [],
      location: '',
      logo: ''
    }
  })

  const isLoading = form.formState.isSubmitting

  const onSubmit = async (values: CompanyFormValues) => {
    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData || 'Registration failed')
      }

      const data = await response.json()
      toast({
        title: 'Company registered successfully',
        description: 'Redirecting to dashboard...'
      })
      router.push('/dashboard')
    } catch (error) {
      console.error('Registration error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to register company. Please try again.',
        variant: 'destructive'
      })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* Logo Upload */}
        <div className="space-y-2">
          <Label>Company Logo</Label>
          <SupabaseFileUpload 
            fileType="company_logo"
            onUploadComplete={(url) => {
              form.setValue('logo', url, { 
                shouldValidate: true,
                shouldDirty: true 
              })
            }}
            onError={(error) => {
              toast({
                title: 'Upload failed',
                description: error,
                variant: 'destructive'
              })
            }}
          />
          {form.formState.errors.logo && (
            <p className="text-sm text-destructive">
              {form.formState.errors.logo.message}
            </p>
          )}
        </div>

        {/* Company Name */}
        <div className="space-y-2">
          <Label>Company Name *</Label>
          <Input
            {...form.register('name')}
            placeholder="Enter company name"
            disabled={isLoading}
          />
        </div>

        {/* Company Type */}
        <div className="space-y-2">
          <Label>Company Type *</Label>
          <Select
            onValueChange={(value: "recruitment_agency" | "corporate" | "startup" | "non_profit") => 
              form.setValue('type', value)
            }
            defaultValue={form.watch('type')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select company type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recruitment_agency">Recruitment Agency</SelectItem>
              <SelectItem value="corporate">Corporate</SelectItem>
              <SelectItem value="startup">Startup</SelectItem>
              <SelectItem value="non_profit">Non-Profit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Company Description */}
        <div className="space-y-2">
          <Label>Description *</Label>
          <Textarea
            {...form.register('description')}
            placeholder="Describe your company"
            className="min-h-[120px]"
            disabled={isLoading}
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label>Headquarters Location *</Label>
          <Input
            {...form.register('location')}
            placeholder="City, Country"
            disabled={isLoading}
          />
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label>Website URL *</Label>
          <Input
            {...form.register('website')}
            placeholder="https://example.com"
            type="url"
            disabled={isLoading}
          />
        </div>

        {/* Industry */}
        <div className="space-y-2">
          <Label>Industry *</Label>
          <Select
            onValueChange={(value) => 
              form.setValue('industry', [...form.watch('industry'), value])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select industries" />
            </SelectTrigger>
            <SelectContent>
              {['Technology', 'Healthcare', 'Finance', 'Manufacturing'].map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          type="submit" 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : 'Create Company Account'}
        </Button>
      </div>
    </form>
  )
} 