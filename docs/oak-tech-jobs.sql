-- Oak Tech Jobs (organization_id: 4357d073-2490-4aaf-af7e-f781206cde96)
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
-- Senior Frontend Developer
(
    '{"en": "Senior Frontend Developer", "fr": "Développeur Frontend Senior"}'::jsonb,
    '{"en": "Join our team as a Senior Frontend Developer working with React, TypeScript, and Next.js to build scalable web applications.", "fr": "Rejoignez notre équipe en tant que développeur Frontend Senior pour travailler avec React, TypeScript et Next.js pour créer des applications web évolutives."}'::jsonb,
    '4357d073-2490-4aaf-af7e-f781206cde96',
    '{"en": ["5+ years of experience with React and TypeScript", "Experience with Next.js and modern frontend tools", "Strong understanding of web performance optimization", "Experience with responsive design and cross-browser compatibility"], "fr": ["5+ ans d''expérience avec React et TypeScript", "Expérience avec Next.js et les outils frontend modernes", "Forte compréhension de l''optimisation des performances web", "Expérience en conception responsive et compatibilité cross-browser"]}'::jsonb,
    ARRAY['REACT', 'TYPESCRIPT', 'NEXTJS', 'TAILWINDCSS'],
    'PUBLISHED',
    '{"city": {"en": "San Francisco", "fr": "San Francisco"}, "state": {"en": "California", "fr": "Californie"}, "country": {"en": "United States", "fr": "États-Unis"}, "postal_code": {"en": "94105", "fr": "94105"}}'::jsonb,
    'FULL_TIME',
    120000,
    180000,
    'USD',
    true,
    true,
    NOW(),
    NOW()
),
-- UX/UI Designer
(
    '{"en": "UX/UI Designer", "fr": "Designer UX/UI"}'::jsonb,
    '{"en": "Looking for a talented UX/UI Designer to create intuitive and beautiful user experiences for our enterprise products.", "fr": "Nous recherchons un designer UX/UI talentueux pour créer des expériences utilisateur intuitives et élégantes pour nos produits d''entreprise."}'::jsonb,
    '4357d073-2490-4aaf-af7e-f781206cde96',
    '{"en": ["3+ years of experience in UX/UI design", "Proficiency with Figma and modern design tools", "Experience creating and maintaining design systems", "Strong portfolio demonstrating user-centered design"], "fr": ["3+ ans d''expérience en design UX/UI", "Maîtrise de Figma et des outils de design modernes", "Expérience dans la création et la maintenance de systèmes de design", "Portfolio solide démontrant une conception centrée sur l''utilisateur"]}'::jsonb,
    ARRAY['FIGMA', 'UI_UX', 'DESIGN_SYSTEMS', 'USER_RESEARCH'],
    'PUBLISHED',
    '{"city": {"en": "San Francisco", "fr": "San Francisco"}, "state": {"en": "California", "fr": "Californie"}, "country": {"en": "United States", "fr": "États-Unis"}, "postal_code": {"en": "94105", "fr": "94105"}}'::jsonb,
    'FULL_TIME',
    90000,
    140000,
    'USD',
    true,
    true,
    NOW(),
    NOW()
); 