-- Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id uuid REFERENCES organizations(id),
    author_name text NOT NULL,
    author_title text,
    content text NOT NULL,
    rating integer CHECK (rating >= 1 AND rating <= 5),
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create organization news table
CREATE TABLE IF NOT EXISTS organization_news (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id uuid REFERENCES organizations(id),
    title text NOT NULL,
    content text NOT NULL,
    published_at timestamptz,
    status text DEFAULT 'draft',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
); 