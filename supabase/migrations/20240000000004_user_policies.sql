-- Enable RLS on auth.users
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own data
CREATE POLICY "Users can view own user data"
ON auth.users
FOR SELECT
USING (auth.uid() = id);

-- Allow authenticated users to read email for member management
CREATE POLICY "Authenticated users can read user emails for member management"
ON auth.users
FOR SELECT
USING (
  -- Allow access to emails when:
  -- 1. The user is accessing their own data
  -- 2. The user is an owner/admin of an organization where the target user is a member
  auth.role() = 'authenticated' AND (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM organization_members om1
      WHERE om1.user_id = auth.uid()
      AND om1.role IN ('OWNER', 'ADMIN')
      AND EXISTS (
        SELECT 1 FROM organization_members om2
        WHERE om2.organization_id = om1.organization_id
        AND om2.user_id = auth.users.id
      )
    )
  )
);

-- Allow the trigger function to read user data
CREATE POLICY "Allow trigger function to read user data"
ON auth.users
FOR SELECT
USING (true);

-- Grant necessary permissions to the postgres role
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT ALL ON auth.users TO postgres;
GRANT ALL ON auth.users TO service_role; 