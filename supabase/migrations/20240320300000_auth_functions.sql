-- Create auth functions schema
CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth.uid() function
CREATE OR REPLACE FUNCTION auth.uid() 
RETURNS uuid 
LANGUAGE sql STABLE
AS $$
  SELECT coalesce(
    current_setting('request.jwt.claim.sub', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  )::uuid
$$;

-- Create auth.role() function
CREATE OR REPLACE FUNCTION auth.role() 
RETURNS text 
LANGUAGE sql STABLE
AS $$
  SELECT coalesce(
    current_setting('request.jwt.claim.role', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role')
  )::text
$$;

-- For development, create a function to simulate auth.uid()
CREATE OR REPLACE FUNCTION set_claim(key text, value text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM set_config('request.jwt.claim.' || key, value, false);
    RETURN format('Claim %I set to %L', key, value);
END;
$$;

-- Recreate policies now that we have auth.uid()
CREATE POLICY "Public organizations are viewable by everyone" ON organizations
    FOR SELECT USING (verification_status = 'verified');

CREATE POLICY "Organization members can update their organization" ON organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = organizations.id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Organization admins can manage testimonials" ON testimonials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = testimonials.organization_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Organization admins can manage news" ON organization_news
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = organization_news.organization_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    ); 