-- Mat Tech Jobs (organization_id: b4921f4b-8f67-439d-8e30-c4364dfe2f17)
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
-- Backend Developer
(
    '{"en": "Backend Developer", "fr": "Développeur Backend"}'::jsonb,
    '{"en": "Backend developer needed for building scalable APIs and microservices using Node.js and PostgreSQL.", "fr": "Développeur backend recherché pour construire des APIs et microservices évolutifs utilisant Node.js et PostgreSQL."}'::jsonb,
    'b4921f4b-8f67-439d-8e30-c4364dfe2f17',
    '{"en": ["4+ years of Node.js development experience", "Strong knowledge of PostgreSQL and database design", "Experience with Redis and caching strategies", "Familiarity with GraphQL and API design"], "fr": ["4+ ans d''expérience en développement Node.js", "Solide connaissance de PostgreSQL et conception de bases de données", "Expérience avec Redis et stratégies de cache", "Familiarité avec GraphQL et conception d''API"]}'::jsonb,
    ARRAY['NODEJS', 'POSTGRESQL', 'REDIS', 'GRAPHQL'],
    'PUBLISHED',
    '{"city": {"en": "Seattle", "fr": "Seattle"}, "state": {"en": "Washington", "fr": "Washington"}, "country": {"en": "United States", "fr": "États-Unis"}, "postal_code": {"en": "98101", "fr": "98101"}}'::jsonb,
    'FULL_TIME',
    100000,
    150000,
    'USD',
    false,
    true,
    NOW(),
    NOW()
); 