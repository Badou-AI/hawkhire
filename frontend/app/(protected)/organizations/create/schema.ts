import * as z from "zod"

export const organizationIndustries = [
  "TECHNOLOGY",
  "HEALTHCARE",
  "FINANCE",
  "EDUCATION",
  "RETAIL",
  "MANUFACTURING",
  "SERVICES",
  "OTHER"
] as const

export const organizationCompanyTypes = [
  "PUBLIC_COMPANY",
  "PRIVATE_COMPANY",
  "STARTUP",
  "NONPROFIT",
  "GOVERNMENT",
  "EDUCATIONAL",
  "OTHER"
] as const

export const organizationSizeRanges = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001-5000",
  "5001-10000",
  "10000+"
] as const

export const organizationCreationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  tier: z.enum(["FREE", "PREMIUM", "ENTERPRISE"]).default("FREE"),
  industry: z.enum(organizationIndustries),
  company_type: z.enum(organizationCompanyTypes),
  founded_year: z.number().min(1800).max(new Date().getFullYear()).optional(),
  size_range: z.enum(organizationSizeRanges),
  website_url: z.string().url().optional(),
  logo_url: z.string().url().optional(),
  cover_image_url: z.string().url().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  verification_status: z.enum(["PENDING", "VERIFIED", "REJECTED"]).default("PENDING"),
  is_mock: z.boolean().default(false),
  mock_batch_id: z.string().nullable().default(null),
}) 