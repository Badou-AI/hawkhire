-- Script to fix indexes after the single language migration
-- This script can be run if the original migration failed to create the indexes
-- due to missing pg_trgm extension

-- First, try to create the pg_trgm extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Check if the extension was successfully created
DO $$
BEGIN
    -- Check if pg_trgm extension is available
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
        -- Drop existing indexes if they exist
        DROP INDEX IF EXISTS idx_jobs_title;
        DROP INDEX IF EXISTS idx_jobs_description;
        
        -- Create trigram indexes
        CREATE INDEX IF NOT EXISTS idx_jobs_title_trgm ON jobs USING gin (title gin_trgm_ops);
        CREATE INDEX IF NOT EXISTS idx_jobs_description_trgm ON jobs USING gin (description gin_trgm_ops);
        
        RAISE NOTICE 'Successfully created trigram indexes using pg_trgm extension';
    ELSE
        -- Fallback to basic indexes if pg_trgm is not available
        CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs (title);
        CREATE INDEX IF NOT EXISTS idx_jobs_description ON jobs (description);
        
        RAISE NOTICE 'Created basic indexes (pg_trgm extension not available)';
    END IF;
    
    -- Always create the language index if it doesn't exist
    CREATE INDEX IF NOT EXISTS idx_jobs_language ON jobs(language);
END
$$; 