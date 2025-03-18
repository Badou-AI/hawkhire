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
  "TEMPORARY",
  "INTERNSHIP",
  "VOLUNTEER",
] as const

export const jobStatuses = [
  "DRAFT",
  "PUBLISHED",
  "CLOSED",
  "ARCHIVED",
] as const

export const currencies = [
  "USD",
  "CAD",
  "EUR",
  "GBP",
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
  status: z.enum(jobStatuses),
  location: localizedLocationSchema,
  job_type: z.enum(jobTypes),
  salary_min: z.number().nullable(),
  salary_max: z.number().nullable(),
  salary_currency: z.enum(currencies),
  remote: z.boolean(),
  opening_date: z.date().optional(),
  closing_date: z.date().optional(),
  contact_person: z.string().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  show_contact_info: z.boolean().optional(),
  rating: z.number().min(0).max(5).nullable(),
  is_mock: z.boolean(),
  mock_batch_id: z.string().uuid().nullable(),
})

export type JobCreationInput = z.infer<typeof jobCreationSchema> 