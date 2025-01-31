# Company Management Implementation Plan

## Overview
This document outlines the implementation plan for the company management features in HawkHire, based on the requirements gathered from example companies (Lekal Distribution and Pro RH).

## 1. Database Schema & Infrastructure

### Company Profile Table
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  company_type TEXT NOT NULL,
  industry TEXT[],
  founded_year INT,
  size_range TEXT,
  website_url TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  primary_location TEXT NOT NULL,
  additional_locations TEXT[],
  languages TEXT[],
  verification_status TEXT NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Company verification history
CREATE TABLE company_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  status TEXT NOT NULL,
  verified_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Company team members and roles
CREATE TABLE company_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL,
  title TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  invited_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);
```

### Storage Buckets
- company-logos: For company logo images (max 2MB, PNG/JPG)
- company-covers: For company cover images (max 5MB, PNG/JPG)
- company-documents: For verification documents (max 20MB, PDF/DOCX)
- Add retention policies:
  - Logos/covers: Permanent until deleted
  - Documents: Auto-delete after 6 months of verification
  - Temp uploads: Auto-delete after 7 days

### Row Level Security Policies
- Verified companies: Public read access
- Company admins: Full write access to their org data
- Platform admins: Verification status updates + audit access
- Team members: Read access based on role permissions
- Add tier-based access controls for storage limits

## 2. Company Registration Flow

### Step 1: Basic Information
- Company name
- Company type (Corporation, LLC, etc.)
- Industry selection (multiple)
- Founded year
- Company size range
- Primary location
- Additional locations (optional)
- Operating languages

### Step 2: Branding
- Logo upload
- Cover image upload
- Website URL
- Company description
- Social media links (optional)

### Step 3: Team Setup
- Primary admin details
- Additional team members (optional)
- Role assignment
- Email invitations

### Step 4: Verification
- Document upload requirements
- Business registration verification
- Contact information verification
- Manual review process
- Verification status tracking

## 3. Role-Based Access Control

### Company Roles
1. Owner
   - All admin privileges + ownership transfer
   - Manage billing and subscriptions
   - Delete organization

2. Admin
   - Full access except ownership/billing
   - Manage all team members and roles
   - Configure organization settings

3. Member
   - Basic access to job posts/applications
   - View team directory
   - Limited editing capabilities

### Permission Sets
```typescript
interface CompanyPermissions {
  manage_company: boolean;
  edit_profile: boolean;
  manage_members: boolean;
  create_jobs: boolean;
  publish_jobs: boolean;
  view_applications: boolean;
  manage_applications: boolean;
  schedule_interviews: boolean;
}
```

## 4. UI Components

### Company Profile Pages
1. Public Profile
   - Company overview
   - Active job listings
   - Team highlights
   - Location information

2. Admin Dashboard
   - Profile completion status
   - Team management
   - Verification status
   - Analytics overview

3. Settings Pages
   - Company information
   - Branding settings
   - Team management
   - Notification preferences

### Forms and Modals
1. Company Registration Wizard
2. Team Member Invitation
3. Role Management
4. Document Upload
5. Verification Status

## 5. API Endpoints

### Company Management
```typescript
// Company routes
POST /api/companies
GET /api/companies/:id
PATCH /api/companies/:id
DELETE /api/companies/:id

// Team management
POST /api/companies/:id/members
GET /api/companies/:id/members
PATCH /api/companies/:id/members/:memberId
DELETE /api/companies/:id/members/:memberId

// Verification
POST /api/companies/:id/verify
GET /api/companies/:id/verification-status
```

## 6. Implementation Phases

### Phase 1: Core Company Setup
1. Database schema implementation
2. Basic company profile creation
3. Essential UI components
4. Basic role management

### Phase 2: Team Management
1. Team invitation system
2. Role-based access control
3. Team member dashboard
4. Notification system

### Phase 3: Verification System
1. Document upload system
2. Verification workflow
3. Admin review interface
4. Status tracking

### Phase 4: Enhanced Features
1. Analytics dashboard
2. Advanced team permissions
3. Integration with job posting
4. Company insights

## 7. Testing Strategy

### Unit Tests
- Company creation validation
- Permission checks
- Role assignment logic
- File upload handling
- Add test cases for:
  - Storage quota enforcement
  - Role escalation prevention
  - Verification workflow states
  - Slug generation uniqueness

### Integration Tests
- Complete registration flow
- Team management operations
- Verification process
- API endpoints
- Add scenarios:
  - Storage limit exceeded during upload
  - Cross-organization data isolation
  - Verification document expiration
  - Bulk member invitations

### E2E Tests
- Company registration
- Team invitation flow
- Profile management
- Role-based access
- Add new cases:
  - Ownership transfer flow
  - Storage quota warning notifications
  - Tier upgrade/downgrade process
  - Multi-admin concurrent edits

## Questions for Review
1. Should we implement a staging area for company profile changes?
2. Do we need different verification requirements for different company types?
3. How should we handle company mergers or acquisitions?
4. What metrics should we track for company analytics?

## Next Steps
1. Review and finalize database schema
2. Set up initial company registration flow
3. Implement core UI components
4. Begin role-based access control implementation

Would you like to proceed with any specific aspect of this implementation plan? 

## 8. Storage Management
- Tier-based storage limits:
  - Free: 5GB
  - Pro: 50GB 
  - Enterprise: 500GB
- File type restrictions per bucket
- Automated cleanup of temp files
- Storage usage dashboard
- Over-quota handling:
  - Email notifications at 80%, 90%, 100%
  - Read-only mode when exceeded
  - Grace period for upgrades 