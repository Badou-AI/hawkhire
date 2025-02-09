-- Drop existing policies
DROP POLICY IF EXISTS "Organization members are insertable by organization owners and admins" ON organization_members;
DROP POLICY IF EXISTS "Users can view own user data" ON auth.users;
DROP POLICY IF EXISTS "Authenticated users can read user emails for member management" ON auth.users;
DROP POLICY IF EXISTS "Allow trigger function to read user data" ON auth.users;

-- Create simpler policy for organization members
CREATE POLICY "Organization members insertable by owners or during creation"
ON organization_members
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow during organization creation (for owner)
  (
    role = 'OWNER' AND
    user_id = auth.uid()
  )
  OR
  -- Allow owners/admins to add members
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_id
    AND om.user_id = auth.uid()
    AND om.role IN ('OWNER', 'ADMIN')
  )
);

-- Create simpler policies for auth.users
CREATE POLICY "Users can view own data and basic info"
ON auth.users
FOR SELECT
TO authenticated
USING (
  -- Users can always see their own data
  auth.uid() = id
  OR
  -- Or if they're authenticated, they can see basic info
  auth.role() = 'authenticated'
);

-- Grant necessary permissions to the postgres role
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT ALL ON auth.users TO postgres;
GRANT ALL ON auth.users TO service_role; 