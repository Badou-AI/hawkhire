-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'professional', 'enterprise')),
    storage_used BIGINT NOT NULL DEFAULT 0,
    storage_limit BIGINT NOT NULL DEFAULT 5368709120, -- 5GB in bytes for free tier
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT[] NOT NULL DEFAULT '{}',
    skills TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
    search_index_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create resumes table
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
    error_message TEXT,
    processed_data JSONB,
    matching_score REAL CHECK (matching_score >= 0 AND matching_score <= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create processing_logs table
CREATE TABLE processing_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('start', 'progress', 'complete', 'error')),
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at
    BEFORE UPDATE ON resumes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for common queries
CREATE INDEX idx_jobs_organization ON jobs(organization_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_resumes_job ON resumes(job_id);
CREATE INDEX idx_resumes_status ON resumes(status);
CREATE INDEX idx_processing_logs_resume ON processing_logs(resume_id);
CREATE INDEX idx_processing_logs_created_at ON processing_logs(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_logs ENABLE ROW LEVEL SECURITY;

-- Organizations Policies
CREATE POLICY "Organizations are viewable by members" ON organizations
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM auth.users
            WHERE auth.email() IN (
                SELECT unnest(members)::text 
                FROM organizations 
                WHERE id = organizations.id
            )
        )
    );

CREATE POLICY "Organizations are insertable by authenticated users" ON organizations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Organizations are updatable by members" ON organizations
    FOR UPDATE USING (
        auth.email() = ANY (members)
    );

-- Jobs Policies
CREATE POLICY "Published jobs are viewable by anyone" ON jobs
    FOR SELECT USING (status = 'published');

CREATE POLICY "Draft and closed jobs are viewable by organization members" ON jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organizations
            WHERE id = jobs.organization_id
            AND auth.email() = ANY (members)
        )
    );

CREATE POLICY "Jobs are insertable by organization members" ON jobs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM organizations
            WHERE id = organization_id
            AND auth.email() = ANY (members)
        )
    );

CREATE POLICY "Jobs are updatable by organization members" ON jobs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM organizations
            WHERE id = jobs.organization_id
            AND auth.email() = ANY (members)
        )
    );

-- Resumes Policies
CREATE POLICY "Resumes are insertable by authenticated users for published jobs" ON resumes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE id = job_id
            AND status = 'published'
            AND auth.role() = 'authenticated'
        )
    );

CREATE POLICY "Resumes are viewable by their owners" ON resumes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE email = auth.email()
            AND id = auth.uid()
        )
    );

CREATE POLICY "Resumes are viewable by job organization members" ON resumes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM jobs
            JOIN organizations ON organizations.id = jobs.organization_id
            WHERE jobs.id = resumes.job_id
            AND auth.email() = ANY (members)
        )
    );

CREATE POLICY "Resumes are updatable by job organization members" ON resumes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM jobs
            JOIN organizations ON organizations.id = jobs.organization_id
            WHERE jobs.id = resumes.job_id
            AND auth.email() = ANY (members)
        )
    );

-- Processing Logs Policies
CREATE POLICY "Processing logs are viewable by resume owners" ON processing_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM resumes
            WHERE id = resume_id
            AND EXISTS (
                SELECT 1 FROM auth.users
                WHERE email = auth.email()
                AND id = auth.uid()
            )
        )
    );

CREATE POLICY "Processing logs are viewable by organization members" ON processing_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM resumes
            JOIN jobs ON jobs.id = resumes.job_id
            JOIN organizations ON organizations.id = jobs.organization_id
            WHERE resumes.id = processing_logs.resume_id
            AND auth.email() = ANY (members)
        )
    );

CREATE POLICY "Processing logs are insertable by system" ON processing_logs
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Add organization members column if not added by RLS policies
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS members TEXT[] NOT NULL DEFAULT '{}'; 