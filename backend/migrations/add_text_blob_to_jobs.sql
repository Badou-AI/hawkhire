-- Add text_blob column to jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS text_blob JSONB DEFAULT '{"en":"", "fr":""}';

-- Add comment to the column
COMMENT ON COLUMN jobs.text_blob IS 'Markdown formatted job description in different languages';

-- Update existing jobs with empty text_blob if null
UPDATE jobs 
SET text_blob = '{"en":"", "fr":""}'
WHERE text_blob IS NULL; 