-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'enterprise')),
  members TEXT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create jobs table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[] NOT NULL,
  skills TEXT[] NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'closed')) DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create resumes table
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id),
  user_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'reviewed', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_resumes_updated_at
  BEFORE UPDATE ON resumes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Organizations are viewable by members"
  ON organizations
  FOR SELECT
  USING (auth.jwt() IS NOT NULL AND auth.jwt()->>'email' = ANY (members));

CREATE POLICY "Users can create organizations"
  ON organizations
  FOR INSERT
  WITH CHECK (auth.jwt() IS NOT NULL AND auth.jwt()->>'email' = ANY (members));

CREATE POLICY "Organizations are updatable by members"
  ON organizations
  FOR UPDATE
  USING (auth.jwt() IS NOT NULL AND auth.jwt()->>'email' = ANY (members));

-- Jobs policies
CREATE POLICY "Published jobs are viewable by anyone"
  ON jobs
  FOR SELECT
  USING (status = 'published' OR 
         (EXISTS (
           SELECT 1 FROM organizations 
           WHERE organizations.id = jobs.organization_id 
           AND auth.jwt()->>'email' = ANY (organizations.members)
         )));

CREATE POLICY "Jobs are insertable by authenticated users"
  ON jobs
  FOR INSERT
  WITH CHECK (auth.jwt() IS NOT NULL);

CREATE POLICY "Jobs are updatable by organization members"
  ON jobs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organizations 
      WHERE organizations.id = jobs.organization_id 
      AND auth.jwt()->>'email' = ANY (organizations.members)
    )
  );

-- Resumes policies
CREATE POLICY "Resumes are viewable by owner and organization members"
  ON resumes
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM jobs 
      JOIN organizations ON jobs.organization_id = organizations.id 
      WHERE jobs.id = resumes.job_id 
      AND auth.jwt()->>'email' = ANY (organizations.members)
    )
  );

CREATE POLICY "Resumes are insertable by authenticated users for published jobs"
  ON resumes
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_id 
      AND jobs.status = 'published'
    )
  );

CREATE POLICY "Resumes are updatable by organization members"
  ON resumes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      JOIN organizations ON jobs.organization_id = organizations.id 
      WHERE jobs.id = resumes.job_id 
      AND auth.jwt()->>'email' = ANY (organizations.members)
    )
  ); 