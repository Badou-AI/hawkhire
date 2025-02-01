-- Create test users with proper auth fields
INSERT INTO auth.users (
    id, 
    email, 
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmed_at
) VALUES 
(
    'd0714948-f2aa-4eb1-9d6d-0fe71c1c6856',
    'admin@test.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"name": "Test Admin"}',
    NOW(),
    NOW(),
    NOW()
),
(
    'e1714948-f2aa-4eb1-9d6d-0fe71c1c6857',
    'org@test.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"name": "Test Org User"}',
    NOW(),
    NOW(),
    NOW()
);

-- Create test organizations
INSERT INTO organizations (id, name, verification_status, slug) VALUES 
('123e4567-e89b-12d3-a456-426614174000', 'Test Organization', 'verified', 'test-org'),
('223e4567-e89b-12d3-a456-426614174001', 'Pending Organization', 'pending', 'pending-org');

-- Create organization members
INSERT INTO organization_members (organization_id, user_id, role) VALUES 
('123e4567-e89b-12d3-a456-426614174000', 'd0714948-f2aa-4eb1-9d6d-0fe71c1c6856', 'admin'),
('223e4567-e89b-12d3-a456-426614174001', 'e1714948-f2aa-4eb1-9d6d-0fe71c1c6857', 'owner');

-- Create test jobs
INSERT INTO jobs (organization_id, title, description, job_type, remote, status) VALUES 
('123e4567-e89b-12d3-a456-426614174000', 'Senior Developer', 'Test job description', 'full-time', true, 'published'),
('123e4567-e89b-12d3-a456-426614174000', 'Junior Developer', 'Another test job', 'full-time', false, 'draft');

-- Create test testimonials
INSERT INTO testimonials (organization_id, author_name, author_title, content, rating, status) VALUES 
('123e4567-e89b-12d3-a456-426614174000', 'John Doe', 'CEO', 'Great organization to work with!', 5, 'approved');

-- Create test news
INSERT INTO organization_news (organization_id, title, content, status) VALUES 
('123e4567-e89b-12d3-a456-426614174000', 'Company Update', 'We are growing!', 'published');