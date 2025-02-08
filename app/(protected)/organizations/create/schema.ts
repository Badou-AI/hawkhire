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

export const organizationTiers = [
  "FREE",
  "PROFESSIONAL",
  "ENTERPRISE",
] as const

export const organizationIndustries = [
  "TECHNOLOGY",
  "HEALTHCARE",
  "EDUCATION",
  "FINANCE",
  "RETAIL",
  "MANUFACTURING",
  "SERVICES",
  "OTHER",
] as const

export const organizationCompanyTypes = [
  "CORPORATION",
  "LLC",
  "PARTNERSHIP",
  "SOLE_PROPRIETORSHIP",
  "NONPROFIT",
  "GOVERNMENT",
  "OTHER",
] as const

export const organizationSizeRanges = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001-5000",
  "5000+",
] as const

export const organizationCreationSchema = z.object({
  name: localizedStringSchema,
  description: localizedStringSchema,
  tier: z.enum(organizationTiers).default("FREE"),
  industry: z.enum(organizationIndustries),
  company_type: z.enum(organizationCompanyTypes),
  founded_year: z.number().min(1800).max(new Date().getFullYear()),
  size_range: z.enum(organizationSizeRanges),
  website_url: z.string().url(),
  logo_url: z.string().optional().default("/placeholders/organization-logo.png"),
  cover_image_url: z.string().optional().default("/placeholders/organization-cover.png"),
  primary_location: localizedLocationSchema,
  additional_locations: z.array(localizedLocationSchema).default([]),
  languages: z.array(z.string()).min(1).default(["en"]),
  verification_status: z.enum(["PENDING", "VERIFIED", "REJECTED"]).default("PENDING"),
  is_mock: z.boolean().default(false),
  mock_batch_id: z.string().uuid().nullable(),
}) 