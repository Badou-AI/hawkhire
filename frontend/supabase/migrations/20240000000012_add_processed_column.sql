-- Add processed column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS processed JSONB;

-- Create index for faster queries on processed data
CREATE INDEX IF NOT EXISTS idx_jobs_processed ON jobs USING GIN (processed);

COMMENT ON COLUMN jobs.processed IS 'Stores resume processing statistics and metadata'; 