-- Lion BI Jobs (organization_id: 917fda56-09ed-44ac-a798-fd50a61a2396)
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
-- Digital Marketing Manager
(
    '{"en": "Digital Marketing Manager", "fr": "Responsable Marketing Digital"}'::jsonb,
    '{"en": "Lead our digital marketing initiatives and develop comprehensive marketing strategies.", "fr": "Dirigez nos initiatives de marketing digital et développez des stratégies marketing complètes."}'::jsonb,
    '917fda56-09ed-44ac-a798-fd50a61a2396',
    '{"en": ["5+ years of digital marketing experience", "Proven track record in SEO and content strategy", "Experience with analytics and data-driven marketing", "Strong project management skills"], "fr": ["5+ ans d''expérience en marketing digital", "Expérience prouvée en SEO et stratégie de contenu", "Expérience en analyse et marketing basé sur les données", "Solides compétences en gestion de projet"]}'::jsonb,
    ARRAY['DIGITAL_MARKETING', 'SEO', 'CONTENT_STRATEGY', 'ANALYTICS'],
    'PUBLISHED',
    '{"city": {"en": "New York", "fr": "New York"}, "state": {"en": "New York", "fr": "New York"}, "country": {"en": "United States", "fr": "États-Unis"}, "postal_code": {"en": "10001", "fr": "10001"}}'::jsonb,
    'FULL_TIME',
    85000,
    120000,
    'USD',
    false,
    true,
    NOW(),
    NOW()
),
-- Data Scientist
(
    '{"en": "Data Scientist", "fr": "Data Scientist"}'::jsonb,
    '{"en": "Looking for a Data Scientist to help derive insights from our vast datasets and build predictive models.", "fr": "Nous recherchons un Data Scientist pour aider à extraire des insights de nos vastes ensembles de données et construire des modèles prédictifs."}'::jsonb,
    '917fda56-09ed-44ac-a798-fd50a61a2396',
    '{"en": ["Masters or PhD in Computer Science, Statistics, or related field", "Strong experience with Python and machine learning frameworks", "Experience with big data technologies", "Strong statistical analysis skills"], "fr": ["Master ou Doctorat en Informatique, Statistiques ou domaine connexe", "Solide expérience avec Python et les frameworks de machine learning", "Expérience avec les technologies big data", "Solides compétences en analyse statistique"]}'::jsonb,
    ARRAY['PYTHON', 'MACHINE_LEARNING', 'SQL', 'TENSORFLOW'],
    'PUBLISHED',
    '{"city": {"en": "Boston", "fr": "Boston"}, "state": {"en": "Massachusetts", "fr": "Massachusetts"}, "country": {"en": "United States", "fr": "États-Unis"}, "postal_code": {"en": "02108", "fr": "02108"}}'::jsonb,
    'FULL_TIME',
    130000,
    170000,
    'USD',
    true,
    true,
    NOW(),
    NOW()
),
-- Business Intelligence Analyst
(
    '{"en": "Business Intelligence Analyst", "fr": "Analyste en Business Intelligence"}'::jsonb,
    '{"en": "Transform complex data into actionable insights using BI tools and statistical analysis.", "fr": "Transformer des données complexes en insights actionnables à l''aide d''outils de BI et d''analyses statistiques."}'::jsonb,
    '917fda56-09ed-44ac-a798-fd50a61a2396',
    '{"en": ["3+ years experience with BI tools and SQL", "Strong background in data visualization", "Experience with Power BI or Tableau", "Understanding of business metrics and KPIs"], "fr": ["3+ ans d''expérience avec les outils de BI et SQL", "Solide expérience en visualisation de données", "Expérience avec Power BI ou Tableau", "Compréhension des métriques business et KPIs"]}'::jsonb,
    ARRAY['TABLEAU', 'SQL', 'POWER_BI', 'DATA_VISUALIZATION'],
    'PUBLISHED',
    '{"city": {"en": "Miami", "fr": "Miami"}, "state": {"en": "Florida", "fr": "Floride"}, "country": {"en": "United States", "fr": "États-Unis"}, "postal_code": {"en": "33101", "fr": "33101"}}'::jsonb,
    'FULL_TIME',
    85000,
    115000,
    'USD',
    true,
    true,
    NOW(),
    NOW()
); 