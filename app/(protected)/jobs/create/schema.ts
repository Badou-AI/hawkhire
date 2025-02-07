import { z } from "zod"

const localizedStringSchema = z.object({
  en: z.string().min(1, "English text is required"),
  fr: z.string().optional(),
})

const localizedLocationSchema = z.object({
  city: localizedStringSchema,
  state: localizedStringSchema,
  country: localizedStringSchema,
  postal_code: localizedStringSchema,
})

export const jobTypes = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "FREELANCE",
  "INTERNSHIP",
] as const

export const jobStatuses = [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
  "CLOSED",
] as const

export const currencies = [
  "USD",
  "EUR",
  "GBP",
  "CAD",
] as const

export const jobCreationSchema = z.object({
  organization_id: z.string().uuid(),
  title: localizedStringSchema,
  description: localizedStringSchema,
  requirements: z.object({
    en: z.array(z.string()),
    fr: z.array(z.string()).optional(),
  }),
  skills: z.array(z.string()),
  status: z.enum(jobStatuses).default("DRAFT"),
  location: localizedLocationSchema,
  job_type: z.enum(jobTypes),
  salary_min: z.number().min(0).nullable(),
  salary_max: z.number().min(0).nullable(),
  salary_currency: z.enum(currencies).default("USD"),
  remote: z.boolean().default(false),
  rating: z.number().min(0).max(5).nullable(),
  is_mock: z.boolean().default(false),
  mock_batch_id: z.string().uuid().nullable(),
  // Contact Information
  contact_person: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional(),
  show_contact_info: z.boolean().default(false),
  // Dates
  opening_date: z.date().optional(),
  closing_date: z.date().optional(),
})

export type JobCreationInput = z.infer<typeof jobCreationSchema> 