-- Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  company_type TEXT NOT NULL DEFAULT 'corporation',
  industry TEXT[],
  founded_year INTEGER,
  size_range TEXT,
  website_url TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  primary_location TEXT NOT NULL,
  additional_locations TEXT[],
  languages TEXT[],
  verification_status TEXT NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  tier TEXT NOT NULL DEFAULT 'free',
  members TEXT[] DEFAULT '{}',
  storage_used BIGINT DEFAULT 0,
  storage_limit BIGINT DEFAULT 5368709120, -- 5GB in bytes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  benefits TEXT[] DEFAULT '{}',
  culture_values TEXT[] DEFAULT '{}',
  social_links JSONB DEFAULT '{}'
);

-- Create organization_members table
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  title TEXT,
  permissions JSONB DEFAULT '{}',
  invited_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_title TEXT NOT NULL,
  author_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create organization news table
CREATE TABLE IF NOT EXISTS organization_news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_news ENABLE ROW LEVEL SECURITY;

-- Everyone can view verified organizations
CREATE POLICY "Anyone can view verified organizations" ON organizations
  FOR SELECT
  USING (verification_status = 'verified');

-- Organization member policies
CREATE POLICY "Organization members can view their memberships" ON organization_members
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Organization admins can manage members" ON organization_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_members.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Everyone can view testimonials and news for verified organizations
CREATE POLICY "View testimonials for verified organizations" ON testimonials
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = testimonials.organization_id
      AND organizations.verification_status = 'verified'
    )
  );

CREATE POLICY "View news for verified organizations" ON organization_news
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = organization_news.organization_id
      AND organizations.verification_status = 'verified'
    )
  );

-- Only organization admins can manage testimonials and news
CREATE POLICY "Organization admins can manage testimonials" ON testimonials
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = testimonials.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Organization admins can manage news" ON organization_news
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_news.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS organizations_slug_idx ON organizations(slug);
CREATE INDEX IF NOT EXISTS organization_members_user_id_idx ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS organization_members_org_id_idx ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS testimonials_organization_id_idx ON testimonials(organization_id);
CREATE INDEX IF NOT EXISTS organization_news_organization_id_idx ON organization_news(organization_id);
CREATE INDEX IF NOT EXISTS organization_news_published_at_idx ON organization_news(published_at DESC);

-- Add updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER set_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_organization_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_testimonials_updated_at
  BEFORE UPDATE ON testimonials
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_organization_news_updated_at
  BEFORE UPDATE ON organization_news
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at(); 