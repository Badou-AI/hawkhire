-- Ensure email column exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'organization_members' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE organization_members ADD COLUMN email TEXT NOT NULL;
    END IF;
END $$; 