import { z } from "zod"

export const JobType = z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "TO_BE_DETERMINED"])
export type JobType = z.infer<typeof JobType>

export const JobStatus = z.enum(["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"])
export type JobStatus = z.infer<typeof JobStatus>

// For backward compatibility
export const LocalizedString = z.object({
  en: z.string(),
  fr: z.string().optional()
})
export type LocalizedString = z.infer<typeof LocalizedString>

// For backward compatibility
export const LocalizedStringArray = z.object({
  en: z.array(z.string()),
  fr: z.array(z.string()).optional()
})
export type LocalizedStringArray = z.infer<typeof LocalizedStringArray>

// New single-language location structure
export const JobLocationSingle = z.object({
  city: z.string(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional()
})
export type JobLocationSingle = z.infer<typeof JobLocationSingle>

// For backward compatibility
export const JobLocation = z.object({
  city: LocalizedString,
  state: LocalizedString,
  country: LocalizedString,
  postal_code: LocalizedString
})
export type JobLocation = z.infer<typeof JobLocation>

// New single-language job creation request
export const JobCreationRequestSingle = z.object({
  organization_id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  requirements: z.array(z.string()),
  skills: z.array(z.string()),
  status: JobStatus,
  location: JobLocationSingle,
  job_type: JobType,
  salary_min: z.number(),
  salary_max: z.number(),
  salary_currency: z.string(),
  remote: z.boolean(),
  rating: z.number(),
  is_mock: z.boolean(),
  language: z.string().default("en"),
  summary: z.string().optional(),
  opening_date: z.string().optional(),
  closing_date: z.string().optional(),
  contact_person: z.string().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  show_contact_info: z.boolean()
})
export type JobCreationRequestSingle = z.infer<typeof JobCreationRequestSingle>

// For backward compatibility
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
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  jobType: JobType,
  salaryMin: z.number().min(0),
  salaryMax: z.number().min(0),
  salaryCurrency: z.string().min(1),
  remote: z.boolean().default(false),
  status: z.literal("DRAFT").default("DRAFT"),
  language: z.string().default("en"),
  summary: z.string().optional(),
  opening_date: z.string().optional(),
  closing_date: z.string().optional(),
  contact_person: z.string().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  show_contact_info: z.boolean().default(false)
})
export type JobFormData = z.infer<typeof jobFormSchema>

// Helper function to transform form data to API request (new single-language version)
export function transformFormToRequestSingle(
  formData: JobFormData,
  organizationId: string
): JobCreationRequestSingle {
  return {
    organization_id: organizationId,
    title: formData.title,
    description: formData.description,
    requirements: formData.requirements?.split('\n').filter(Boolean) || [],
    skills: formData.skills,
    status: formData.status,
    location: {
      city: formData.city,
      state: formData.state,
      country: formData.country,
      postal_code: formData.postalCode
    },
    job_type: formData.jobType,
    salary_min: formData.salaryMin,
    salary_max: formData.salaryMax,
    salary_currency: formData.salaryCurrency,
    remote: formData.remote,
    rating: 0,
    is_mock: false,
    language: formData.language || "en",
    summary: formData.summary,
    opening_date: formData.opening_date,
    closing_date: formData.closing_date,
    contact_person: formData.contact_person,
    contact_email: formData.contact_email,
    contact_phone: formData.contact_phone,
    show_contact_info: formData.show_contact_info
  }
}

// Helper function to transform form data to API request (for backward compatibility)
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