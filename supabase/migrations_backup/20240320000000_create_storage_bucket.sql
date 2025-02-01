-- Create the storage bucket if it doesn't exist
DO $$
BEGIN
    -- Create bucket if it doesn't exist
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('company-assets', 'company-assets', true)
    ON CONFLICT (id) DO NOTHING;

    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Public Access" ON storage.objects;
    DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;

    -- Create new policies
    CREATE POLICY "Public Access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'company-assets');

    CREATE POLICY "Auth Upload"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'company-assets' 
        AND auth.role() = 'authenticated'
    );
END $$; 