
import { JobLocation } from "./job";
export interface Organization {
  id: string
  name: string
  logo_url: string
  industry: string
  tier: string
  is_mock: boolean
  languages: string[]
  created_at: string
  size_range: string
  updated_at: string
  description: string
  website_url: string
  company_type: string
  founded_year: number
  mock_batch_id: string | null
  cover_image_url: string
  primary_location: JobLocation
  verification_status: string
  additional_locations: JobLocation[]
}

export enum OrganizationMemberRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
  GUEST = "GUEST",
}

export enum OrganizationMemberStatus {
  ACTIVE = "ACTIVE",
  PENDING = "PENDING",
  INACTIVE = "INACTIVE",
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: OrganizationMemberRole
  status: OrganizationMemberStatus
  email: string
  created_at: string
  updated_at: string
} 