-- Auchan Jobs (organization_id: 71f38f4e-b172-43f2-83d2-aa8463d9a0c3)
INSERT INTO jobs (
    title,
    description,
    organization_id,
    requirements,
    skills,
    status,
    location,
    job_type,
    salary_min,
    salary_max,
    salary_currency,
    remote,
    is_mock,
    created_at,
    updated_at
) VALUES
-- Retail Store Manager
(
    '{"en": "Retail Store Manager", "fr": "Responsable de Magasin"}'::jsonb,
    '{"en": "Experienced retail manager needed to oversee store operations and lead a team of 20+ employees.", "fr": "Responsable de magasin expérimenté recherché pour superviser les opérations du magasin et diriger une équipe de plus de 20 employés."}'::jsonb,
    '71f38f4e-b172-43f2-83d2-aa8463d9a0c3',
    '{"en": ["5+ years of retail management experience", "Proven track record in team leadership", "Experience with inventory management systems", "Strong customer service orientation"], "fr": ["5+ ans d''expérience en gestion de commerce de détail", "Expérience prouvée en leadership d''équipe", "Expérience avec les systèmes de gestion des stocks", "Forte orientation service client"]}'::jsonb,
    ARRAY['RETAIL_MANAGEMENT', 'TEAM_LEADERSHIP', 'INVENTORY_MANAGEMENT', 'CUSTOMER_SERVICE'],
    'PUBLISHED',
    '{"city": {"en": "Chicago", "fr": "Chicago"}, "state": {"en": "Illinois", "fr": "Illinois"}, "country": {"en": "United States", "fr": "États-Unis"}, "postal_code": {"en": "60601", "fr": "60601"}}'::jsonb,
    'FULL_TIME',
    60000,
    80000,
    'USD',
    false,
    true,
    NOW(),
    NOW()
); 