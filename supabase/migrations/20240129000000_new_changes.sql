-- Enhance organizations table with new fields
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS company_type TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT[],
  ADD COLUMN IF NOT EXISTS founded_year INT,
  ADD COLUMN IF NOT EXISTS size_range TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS primary_location TEXT,
  ADD COLUMN IF NOT EXISTS additional_locations TEXT[],
  ADD COLUMN IF NOT EXISTS languages TEXT[],
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Add NOT NULL constraints after allowing existing rows to be updated
-- First, create a temporary function to generate unique slugs
CREATE OR REPLACE FUNCTION generate_unique_slug(name_param TEXT, attempt INT DEFAULT 0)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  exists_count INT;
BEGIN
  -- Generate base slug from name
  base_slug := LOWER(REGEXP_REPLACE(name_param, '[^a-zA-Z0-9]+', '-', 'g'));
  
  -- For first attempt, try without suffix
  IF attempt = 0 THEN
    final_slug := base_slug;
  ELSE
    -- Add timestamp to make it unique
    final_slug := base_slug || '-' || attempt;
  END IF;
  
  -- Check if slug exists
  SELECT COUNT(*) INTO exists_count
  FROM organizations
  WHERE slug = final_slug;
  
  -- Recursively try with incremented attempt if slug exists
  IF exists_count > 0 THEN
    RETURN generate_unique_slug(name_param, attempt + 1);
  END IF;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Update existing rows with unique slugs
DO $$
DECLARE
  org RECORD;
BEGIN
  FOR org IN SELECT id, name FROM organizations WHERE slug IS NULL OR company_type IS NULL OR primary_location IS NULL
  LOOP
    UPDATE organizations 
    SET 
      slug = generate_unique_slug(org.name),
      company_type = 'corporation',
      primary_location = 'Unknown'
    WHERE id = org.id;
  END LOOP;
END $$;

-- Drop the temporary function
DROP FUNCTION IF EXISTS generate_unique_slug(TEXT, INT);

-- Now set the NOT NULL constraints
ALTER TABLE organizations 
  ALTER COLUMN slug SET NOT NULL,
  ALTER COLUMN company_type SET NOT NULL,
  ALTER COLUMN primary_location SET NOT NULL;

-- Create company verification history
CREATE TABLE IF NOT EXISTS organization_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  status TEXT NOT NULL,
  verified_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create organization team members and roles
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL,
  title TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  invited_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Add updated_at trigger to new tables if not exists
DO $$ BEGIN
  CREATE TRIGGER update_organization_members_updated_at
    BEFORE UPDATE ON organization_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Enable RLS on new tables
ALTER TABLE organization_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Organization verifications policies
DO $$ BEGIN
CREATE POLICY "Verification history viewable by organization members and platform admins"
  ON organization_verifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organizations 
      WHERE organizations.id = organization_verifications.organization_id 
      AND auth.email()::TEXT = ANY (organizations.members)
    ) OR
    auth.role() = 'service_role'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "Verifications insertable by platform admins only"
  ON organization_verifications
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Organization members policies
DO $$ BEGIN
CREATE POLICY "Members viewable by organization members"
  ON organization_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organizations 
      WHERE organizations.id = organization_members.organization_id 
      AND auth.email()::TEXT = ANY (organizations.members)
    )
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "Members insertable by organization admins"
  ON organization_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations 
      WHERE organizations.id = organization_id 
      AND auth.email()::TEXT = ANY (organizations.members)
    )
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "Members updatable by organization admins"
  ON organization_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organizations 
      WHERE organizations.id = organization_members.organization_id 
      AND auth.email()::TEXT = ANY (organizations.members)
    )
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create function to generate slug from organization name if not exists
CREATE OR REPLACE FUNCTION generate_organization_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically generate slug if not exists
DO $$ BEGIN
CREATE TRIGGER generate_organization_slug_trigger
  BEFORE INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION generate_organization_slug();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create indexes for performance if not exists
DO $$ BEGIN
CREATE INDEX idx_organization_members_user_id ON organization_members(user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE INDEX idx_organization_members_organization_id ON organization_members(organization_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE INDEX idx_organization_verifications_organization_id ON organization_verifications(organization_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$; 