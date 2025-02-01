-- First check if the enum exists to avoid errors
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'company_type') THEN
        CREATE TYPE company_type AS ENUM ('recruitment_agency', 'corporate', 'startup', 'non_profit');
    END IF;
END $$;

-- Create the companies table with all required fields
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    company_type company_type NOT NULL DEFAULT 'corporate',
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
    recruitment_specialties TEXT[],
    client_portal_enabled BOOLEAN NOT NULL DEFAULT false,
    owner_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS companies_slug_idx ON companies(slug);
CREATE INDEX IF NOT EXISTS companies_verification_status_idx ON companies(verification_status);
CREATE INDEX IF NOT EXISTS companies_owner_id_idx ON companies(owner_id);

-- Set up RLS policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Policy for viewing verified companies
CREATE POLICY "Verified companies are viewable by everyone"
    ON companies
    FOR SELECT
    USING (verification_status = 'verified');

-- Policy for company owners
CREATE POLICY "Company owners have full access"
    ON companies
    USING (owner_id = auth.uid());

-- Create function to auto-generate slug
CREATE OR REPLACE FUNCTION generate_company_slug()
RETURNS TRIGGER AS $$
BEGIN
    -- Convert name to lowercase and replace spaces/special chars with hyphens
    NEW.slug := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
    -- Ensure unique by appending random string if needed
    WHILE EXISTS (SELECT 1 FROM companies WHERE slug = NEW.slug AND id != NEW.id) LOOP
        NEW.slug := NEW.slug || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4);
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for slug generation
CREATE TRIGGER before_company_insert_update
    BEFORE INSERT OR UPDATE OF name
    ON companies
    FOR EACH ROW
    EXECUTE FUNCTION generate_company_slug();

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE
    ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create company verifications table for audit trail
CREATE TABLE IF NOT EXISTS company_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    status TEXT NOT NULL,
    verified_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for company verifications
CREATE INDEX IF NOT EXISTS company_verifications_company_id_idx ON company_verifications(company_id);

-- Set up RLS for verifications
ALTER TABLE company_verifications ENABLE ROW LEVEL SECURITY;

-- Only allow platform admins to create verifications
CREATE POLICY "Platform admins can manage verifications"
    ON company_verifications
    USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));

-- Allow company owners to view their verifications
CREATE POLICY "Company owners can view their verifications"
    ON company_verifications
    FOR SELECT
    USING (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())); 