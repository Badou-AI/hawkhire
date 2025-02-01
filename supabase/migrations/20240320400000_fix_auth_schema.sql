-- Create auth schema
CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth.users table (minimal version for development)
CREATE TABLE IF NOT EXISTS auth.users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text,
    raw_user_meta_data jsonb DEFAULT '{}'::jsonb
);

-- Add missing columns
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS slug text UNIQUE,
ADD COLUMN IF NOT EXISTS verification_notes text;

-- Now recreate the policies
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