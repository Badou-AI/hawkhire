export type OrganizationTier = 'free' | 'pro' | 'enterprise'
export type VerificationStatus = 'pending' | 'verified' | 'rejected'
export type MemberRole = 'owner' | 'admin' | 'member'
export type MemberStatus = 'pending' | 'active' | 'inactive'

export interface Testimonial {
  id: string
  organization_id: string
  content: string
  author_name: string
  author_title: string
  author_image?: string
  created_at: string
}

export interface OrganizationNews {
  id: string
  organization_id: string
  title: string
  summary: string
  content: string
  image_url?: string
  published_at: string
  created_at: string
}

export interface SocialLinks {
  linkedin?: string
  twitter?: string
  facebook?: string
  instagram?: string
  github?: string
  website?: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  company_type: string
  industry?: string[]
  founded_year?: number
  size_range?: string
  website_url?: string
  logo_url?: string
  cover_image_url?: string
  primary_location: string
  additional_locations?: string[]
  languages?: string[]
  verification_status: VerificationStatus
  verified_at?: string
  tier: OrganizationTier
  members: string[]
  benefits?: string[]
  culture_values?: string[]
  social_links?: SocialLinks
  testimonials?: Testimonial[]
  news?: OrganizationNews[]
  storage_used?: number
  storage_limit?: number
  created_at: string
  updated_at: string
}

export interface OrganizationVerification {
  id: string
  organization_id: string
  status: VerificationStatus
  verified_by: string
  notes?: string
  created_at: string
}

export interface OrganizationPermissions {
  canManageMembers?: boolean
  canEditProfile?: boolean
  canPostJobs?: boolean
  canManageJobs?: boolean
  canViewAnalytics?: boolean
  canManageBilling?: boolean
  [key: string]: boolean | undefined
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: MemberRole
  title?: string
  permissions: OrganizationPermissions
  invited_by: string
  status: MemberStatus
  created_at: string
  updated_at: string
}

// Helper type for creating a new organization
export type CreateOrganizationDTO = Omit<
  Organization,
  'id' | 'verification_status' | 'verified_at' | 'storage_used' | 'created_at' | 'updated_at'
>

// Helper type for updating an organization
export type UpdateOrganizationDTO = Partial<CreateOrganizationDTO>

// Helper type for inviting a new member
export interface InviteMemberDTO {
  email: string
  role: MemberRole
  title?: string
  permissions?: OrganizationPermissions
} 