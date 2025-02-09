-- Drop all existing complex policies
DROP POLICY IF EXISTS "Organization members are viewable by organization members" ON organization_members;
DROP POLICY IF EXISTS "Organization members are insertable by organization owners and admins" ON organization_members;
DROP POLICY IF EXISTS "Organization members are updatable by organization owners and admins" ON organization_members;
DROP POLICY IF EXISTS "Organizations are viewable by members" ON organizations;
DROP POLICY IF EXISTS "Organizations are updatable by owners and admins" ON organizations;
DROP POLICY IF EXISTS "Organization members insertable by owners or during creation" ON organization_members;

-- Simple organization policies
CREATE POLICY "Organizations are viewable by authenticated users"
ON organizations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Organizations are insertable by authenticated users"
ON organizations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Simple member policies
CREATE POLICY "Members are viewable by authenticated users"
ON organization_members
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Members are insertable by authenticated users"
ON organization_members
FOR INSERT
TO authenticated
WITH CHECK (true);

-- We can add more restrictive policies later, after initial creation works 