-- Drop the members column from organizations
ALTER TABLE organizations DROP COLUMN members;

-- Add missing columns to organizations
ALTER TABLE organizations ADD COLUMN description TEXT;
ALTER TABLE organizations ADD COLUMN industry TEXT;
ALTER TABLE organizations ADD COLUMN company_type TEXT;
ALTER TABLE organizations ADD COLUMN founded_year INTEGER;
ALTER TABLE organizations ADD COLUMN size_range TEXT;
ALTER TABLE organizations ADD COLUMN website_url TEXT;
ALTER TABLE organizations ADD COLUMN logo_url TEXT;
ALTER TABLE organizations ADD COLUMN cover_image_url TEXT;
ALTER TABLE organizations ADD COLUMN primary_location JSONB;
ALTER TABLE organizations ADD COLUMN additional_locations JSONB[];
ALTER TABLE organizations ADD COLUMN languages TEXT[] DEFAULT ARRAY['en'];
ALTER TABLE organizations ADD COLUMN verification_status TEXT DEFAULT 'PENDING';
ALTER TABLE organizations ADD COLUMN is_mock BOOLEAN DEFAULT FALSE;
ALTER TABLE organizations ADD COLUMN mock_batch_id UUID;

-- Create organization_members table
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER', 'GUEST')),
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'PENDING', 'INACTIVE')) DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Create trigger for auto member creation
CREATE OR REPLACE FUNCTION create_owner_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO organization_members (
    organization_id,
    user_id,
    email,
    role,
    status
  ) VALUES (
    NEW.id,
    auth.uid(),
    auth.jwt()->>'email',
    'OWNER',
    'ACTIVE'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_owner_member
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION create_owner_member();

-- Add updated_at trigger for organization_members
CREATE TRIGGER update_organization_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable RLS for organization_members
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Organization members policies
CREATE POLICY "Organization members are viewable by organization members"
  ON organization_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members are insertable by organization owners and admins"
  ON organization_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('OWNER', 'ADMIN')
    )
  );

CREATE POLICY "Organization members are updatable by organization owners and admins"
  ON organization_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('OWNER', 'ADMIN')
    )
  );

-- Update organization policies to use organization_members table
DROP POLICY IF EXISTS "Organizations are viewable by members" ON organizations;
DROP POLICY IF EXISTS "Organizations are updatable by members" ON organizations;

CREATE POLICY "Organizations are viewable by members"
  ON organizations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organizations.id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizations are updatable by owners and admins"
  ON organizations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organizations.id
      AND om.user_id = auth.uid()
      AND om.role IN ('OWNER', 'ADMIN')
    )
  ); 