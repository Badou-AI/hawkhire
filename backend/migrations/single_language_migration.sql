-- Migration script to convert jobs table from multilingual to single-language model
-- This script will:
-- 1. Add a language column to the jobs table
-- 2. Add a summary column to the jobs table
-- 3. Create temporary columns for the transition
-- 4. Migrate existing data (extract content by language)
-- 5. Drop the JSONB columns
-- 6. Rename the new columns to the original names
-- 7. Add indexes for improved performance

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add language column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS language VARCHAR(10) NOT NULL DEFAULT 'en';

-- Add summary column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS summary TEXT;

-- Create temporary columns for the transition
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS title_text TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS description_text TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS requirements_text TEXT[];

-- Create temporary location columns
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Migrate existing data (extract English content by default)
-- We'll create a function to handle the extraction of data from JSONB fields
CREATE OR REPLACE FUNCTION extract_language_from_jsonb(data JSONB, lang VARCHAR(10))
RETURNS TEXT AS $$
BEGIN
    -- If the data is NULL, return NULL
    IF data IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- If the data contains the language key, return its value
    IF data ? lang THEN
        RETURN data->>lang;
    -- Otherwise, try to get the English value as fallback
    ELSIF data ? 'en' THEN
        RETURN data->>'en';
    -- If neither exists, return the first value
    ELSE
        RETURN data->>0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to extract array elements from JSONB
CREATE OR REPLACE FUNCTION extract_array_from_jsonb(data JSONB, lang VARCHAR(10))
RETURNS TEXT[] AS $$
BEGIN
    -- If the data is NULL, return empty array
    IF data IS NULL THEN
        RETURN '{}';
    END IF;
    
    -- If the data contains the language key, return its value as array
    IF data ? lang THEN
        RETURN ARRAY(SELECT jsonb_array_elements_text(data->lang));
    -- Otherwise, try to get the English value as fallback
    ELSIF data ? 'en' THEN
        RETURN ARRAY(SELECT jsonb_array_elements_text(data->'en'));
    -- If neither exists, return empty array
    ELSE
        RETURN '{}';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Update the jobs table with English content first
UPDATE jobs
SET 
  title_text = extract_language_from_jsonb(title, 'en'),
  description_text = extract_language_from_jsonb(description, 'en'),
  requirements_text = extract_array_from_jsonb(requirements, 'en'),
  city = extract_language_from_jsonb(location->'city', 'en'),
  state = extract_language_from_jsonb(location->'state', 'en'),
  country = extract_language_from_jsonb(location->'country', 'en'),
  postal_code = extract_language_from_jsonb(location->'postal_code', 'en'),
  summary = extract_language_from_jsonb(text_blob, 'en');

-- Create a backup of the original data
CREATE TABLE IF NOT EXISTS jobs_multilingual_backup AS
SELECT * FROM jobs;

-- Now we'll duplicate the jobs for French content
-- First, let's get all jobs that have French content
INSERT INTO jobs (
  organization_id, title_text, description_text, requirements_text,
  city, state, country, postal_code, job_type, salary_min, salary_max,
  salary_currency, remote, rating, is_mock, mock_batch_id, status,
  language, summary, skills, created_at, updated_at
)
SELECT 
  organization_id,
  extract_language_from_jsonb(title, 'fr'),
  extract_language_from_jsonb(description, 'fr'),
  extract_array_from_jsonb(requirements, 'fr'),
  extract_language_from_jsonb(location->'city', 'fr'),
  extract_language_from_jsonb(location->'state', 'fr'),
  extract_language_from_jsonb(location->'country', 'fr'),
  extract_language_from_jsonb(location->'postal_code', 'fr'),
  job_type, salary_min, salary_max, salary_currency, remote, rating,
  is_mock, mock_batch_id, status, 'fr',
  extract_language_from_jsonb(text_blob, 'fr'),
  skills, created_at, updated_at
FROM jobs
WHERE 
  (title ? 'fr' AND title->>'fr' IS NOT NULL AND title->>'fr' != '') OR
  (description ? 'fr' AND description->>'fr' IS NOT NULL AND description->>'fr' != '') OR
  (requirements ? 'fr' AND jsonb_array_length(requirements->'fr') > 0) OR
  (text_blob ? 'fr' AND text_blob->>'fr' IS NOT NULL AND text_blob->>'fr' != '');

-- Update the language column for existing records to 'en'
UPDATE jobs SET language = 'en' WHERE language IS NULL OR language = '';

-- Create a new location column as a structured JSON (not for localization)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS location_new JSONB;

-- Populate the new location column
UPDATE jobs
SET location_new = jsonb_build_object(
  'city', city,
  'state', state,
  'country', country,
  'postal_code', postal_code
);

-- Drop the JSONB columns
ALTER TABLE jobs DROP COLUMN IF EXISTS title CASCADE;
ALTER TABLE jobs DROP COLUMN IF EXISTS description CASCADE;
ALTER TABLE jobs DROP COLUMN IF EXISTS requirements CASCADE;
ALTER TABLE jobs DROP COLUMN IF EXISTS location CASCADE;
ALTER TABLE jobs DROP COLUMN IF EXISTS text_blob CASCADE;

-- Rename the new columns to the original names
ALTER TABLE jobs RENAME COLUMN title_text TO title;
ALTER TABLE jobs RENAME COLUMN description_text TO description;
ALTER TABLE jobs RENAME COLUMN requirements_text TO requirements;
ALTER TABLE jobs RENAME COLUMN location_new TO location;

-- Drop the temporary location columns
ALTER TABLE jobs DROP COLUMN IF EXISTS city CASCADE;
ALTER TABLE jobs DROP COLUMN IF EXISTS state CASCADE;
ALTER TABLE jobs DROP COLUMN IF EXISTS country CASCADE;
ALTER TABLE jobs DROP COLUMN IF EXISTS postal_code CASCADE;

-- Drop the temporary functions
DROP FUNCTION IF EXISTS extract_language_from_jsonb(JSONB, VARCHAR(10));
DROP FUNCTION IF EXISTS extract_array_from_jsonb(JSONB, VARCHAR(10));

-- Add indexes for improved performance
-- First try to create trigram indexes if pg_trgm is available
DO $$
BEGIN
    -- Check if pg_trgm extension is available
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
        -- Create trigram indexes
        CREATE INDEX IF NOT EXISTS idx_jobs_title_trgm ON jobs USING gin (title gin_trgm_ops);
        CREATE INDEX IF NOT EXISTS idx_jobs_description_trgm ON jobs USING gin (description gin_trgm_ops);
    ELSE
        -- Fallback to basic indexes if pg_trgm is not available
        CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs (title);
        CREATE INDEX IF NOT EXISTS idx_jobs_description ON jobs (description);
    END IF;
END
$$;

-- Always create the language index
CREATE INDEX IF NOT EXISTS idx_jobs_language ON jobs(language);

-- Add comments to the new columns
COMMENT ON COLUMN jobs.language IS 'Language of the job posting (e.g., en, fr)';
COMMENT ON COLUMN jobs.summary IS 'Descriptive summary for the candidate to read';
COMMENT ON COLUMN jobs.location IS 'Job location details as a JSON object'; 