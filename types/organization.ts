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