-- Drop existing policies first
DROP POLICY IF EXISTS "Public organizations are viewable by everyone" ON organizations;
DROP POLICY IF EXISTS "Organization members can update their organization" ON organizations;
DROP POLICY IF EXISTS "Organization admins can manage testimonials" ON testimonials;
DROP POLICY IF EXISTS "Organization admins can manage news" ON organization_news;

-- Enable RLS on tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_news ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Public organizations are viewable by everyone" 
    ON organizations FOR SELECT 
    USING (verification_status = 'verified');

CREATE POLICY "Organization members can update their organization" 
    ON organizations FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = organizations.id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Organization admins can manage testimonials" 
    ON testimonials FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = testimonials.organization_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Organization admins can manage news" 
    ON organization_news FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = organization_news.organization_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    ); 