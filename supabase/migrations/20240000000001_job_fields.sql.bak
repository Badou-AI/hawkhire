-- Add new columns to jobs table
ALTER TABLE jobs
ADD COLUMN location TEXT,
ADD COLUMN job_type TEXT CHECK (job_type IN ('full-time', 'part-time', 'contract', 'internship')),
ADD COLUMN salary_min INTEGER,
ADD COLUMN salary_max INTEGER,
ADD COLUMN remote BOOLEAN DEFAULT false,
ADD COLUMN rating NUMERIC(2,1) CHECK (rating >= 0 AND rating <= 5);

-- Add logo to organizations
ALTER TABLE organizations
ADD COLUMN logo_url TEXT;

-- Add indexes for common queries
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_job_type ON jobs(job_type);
CREATE INDEX idx_jobs_remote ON jobs(remote); 