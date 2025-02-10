import { z } from "zod"

export const JobType = z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"])
export type JobType = z.infer<typeof JobType>

export const JobStatus = z.enum(["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"])
export type JobStatus = z.infer<typeof JobStatus>

export const LocalizedString = z.object({
  en: z.string(),
  fr: z.string().optional()
})
export type LocalizedString = z.infer<typeof LocalizedString>

export const LocalizedStringArray = z.object({
  en: z.array(z.string()),
  fr: z.array(z.string()).optional()
})
export type LocalizedStringArray = z.infer<typeof LocalizedStringArray>

export const JobLocation = z.object({
  city: LocalizedString,
  state: LocalizedString,
  country: LocalizedString,
  postal_code: LocalizedString
})
export type JobLocation = z.infer<typeof JobLocation>

export const JobCreationRequest = z.object({
  organization_id: z.string().uuid(),
  title: LocalizedString,
  description: LocalizedString,
  requirements: LocalizedStringArray,
  skills: z.array(z.string()),
  status: JobStatus,
  location: JobLocation,
  job_type: JobType,
  salary_min: z.number(),
  salary_max: z.number(),
  salary_currency: z.string(),
  remote: z.boolean(),
  rating: z.number(),
  is_mock: z.boolean(),
  opening_date: z.string().optional(),
  closing_date: z.string().optional(),
  contact_person: z.string().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  show_contact_info: z.boolean()
})
export type JobCreationRequest = z.infer<typeof JobCreationRequest>

// Form schema (flattened version of the API schema)
export const jobFormSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  requirements: z.string().optional(),
  skills: z.array(z.string()).default([]),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  postalCode: z.string().min(1),
  jobType: JobType,
  salaryMin: z.number().min(0),
  salaryMax: z.number().min(0),
  salaryCurrency: z.string().min(1),
  remote: z.boolean().default(false),
  status: z.literal("DRAFT").default("DRAFT"),
  opening_date: z.string().optional(),
  closing_date: z.string().optional(),
  contact_person: z.string().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  show_contact_info: z.boolean().default(false)
})
export type JobFormData = z.infer<typeof jobFormSchema>

// Helper function to transform form data to API request
export function transformFormToRequest(
  formData: JobFormData,
  organizationId: string
): JobCreationRequest {
  return {
    organization_id: organizationId,
    title: {
      en: formData.title,
      fr: formData.title // TODO: Add translation support
    },
    description: {
      en: formData.description,
      fr: formData.description // TODO: Add translation support
    },
    requirements: {
      en: formData.requirements?.split('\n').filter(Boolean) || [],
      fr: [] // TODO: Add translation support
    },
    skills: formData.skills,
    status: formData.status,
    location: {
      city: {
        en: formData.city,
        fr: formData.city
      },
      state: {
        en: formData.state,
        fr: formData.state
      },
      country: {
        en: formData.country,
        fr: formData.country
      },
      postal_code: {
        en: formData.postalCode,
        fr: formData.postalCode
      }
    },
    job_type: formData.jobType,
    salary_min: formData.salaryMin,
    salary_max: formData.salaryMax,
    salary_currency: formData.salaryCurrency,
    remote: formData.remote,
    rating: 0,
    is_mock: false,
    opening_date: formData.opening_date,
    closing_date: formData.closing_date,
    contact_person: formData.contact_person,
    contact_email: formData.contact_email,
    contact_phone: formData.contact_phone,
    show_contact_info: formData.show_contact_info
  }
} 