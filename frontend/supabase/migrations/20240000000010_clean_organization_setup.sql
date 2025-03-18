-- Clean up any existing complex policies
DROP POLICY IF EXISTS "Organization members are viewable by organization members" ON organization_members;
DROP POLICY IF EXISTS "Organization members are insertable by organization owners and admins" ON organization_members;
DROP POLICY IF EXISTS "Organization members are updatable by organization owners and admins" ON organization_members;
DROP POLICY IF EXISTS "Organizations are viewable by members" ON organizations;
DROP POLICY IF EXISTS "Organizations are updatable by owners and admins" ON organizations;
DROP POLICY IF EXISTS "Organization members insertable by owners or during creation" ON organization_members;
DROP POLICY IF EXISTS "Organizations are viewable by authenticated users" ON organizations;
DROP POLICY IF EXISTS "Organizations are insertable by authenticated users" ON organizations;
DROP POLICY IF EXISTS "Members are viewable by authenticated users" ON organization_members;
DROP POLICY IF EXISTS "Members are insertable by authenticated users" ON organization_members;

-- Drop existing trigger
DROP TRIGGER IF EXISTS auto_create_owner_member ON organizations;
DROP FUNCTION IF EXISTS create_owner_member();

-- Simple trigger to create owner
CREATE FUNCTION create_owner_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO organization_members (
    organization_id,
    user_id,
    email,
    role,
    status
  ) VALUES (
    NEW.id,
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    'OWNER',
    'ACTIVE'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_owner_member
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION create_owner_member();

-- Simple policies
CREATE POLICY "Anyone can view organizations"
ON organizations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create organizations"
ON organizations FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Owners can update their organizations"
ON organizations FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = organizations.id
    AND user_id = auth.uid()
    AND role = 'OWNER'
  )
); 