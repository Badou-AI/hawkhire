-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create company type enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'company_type') THEN
        CREATE TYPE company_type AS ENUM ('recruitment_agency', 'corporate', 'startup', 'non_profit');
    END IF;
END $$;

-- Create companies table
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

-- Add indexes
CREATE INDEX IF NOT EXISTS companies_slug_idx ON companies(slug);
CREATE INDEX IF NOT EXISTS companies_verification_status_idx ON companies(verification_status);
CREATE INDEX IF NOT EXISTS companies_owner_id_idx ON companies(owner_id);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Verified companies are viewable by everyone"
    ON companies FOR SELECT
    USING (verification_status = 'verified');

CREATE POLICY "Company owners have full access"
    ON companies FOR ALL
    USING (owner_id = auth.uid());

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 