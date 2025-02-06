-- First, clean up any existing mock organizations
DELETE FROM organizations WHERE is_mock = true;

-- Insert mock organizations
INSERT INTO organizations (
  name,
  description,
  tier,
  industry,
  company_type,
  founded_year,
  size_range,
  website_url,
  logo_url,
  cover_image_url,
  primary_location,
  additional_locations,
  languages,
  verification_status,
  is_mock,
  created_at,
  updated_at
) VALUES
-- Oak Tech
(
  '{"en": "Oak Tech", "fr": "Oak Tech"}',
  '{"en": "Leading technology company specializing in enterprise software solutions and innovative web applications.", "fr": "Entreprise technologique de premier plan spécialisée dans les solutions logicielles d''entreprise et les applications web innovantes."}',
  'PROFESSIONAL',
  'TECHNOLOGY',
  '{"en": "STARTUP", "fr": "STARTUP"}',
  2018,
  '{"en": "51-200", "fr": "51-200"}',
  'https://www.oaktech.io',
  '/company-logos/oak-tech.png',
  '/company-covers/oak-tech-cover.png',
  '{"city": {"en": "San Francisco", "fr": "San Francisco"}, "state": {"en": "California", "fr": "Californie"}, "country": {"en": "United States", "fr": "États-Unis"}, "postal_code": {"en": "94105", "fr": "94105"}}',
  '[]',
  ARRAY['en'],
  'VERIFIED',
  true,
  NOW(),
  NOW()
),
-- Tech Sim
(
  '{"en": "Tech Sim", "fr": "Tech Sim"}',
  '{"en": "Cloud infrastructure and DevOps solutions provider, helping companies modernize their tech stack.", "fr": "Fournisseur de solutions DevOps et d''infrastructure cloud, aidant les entreprises à moderniser leur stack technologique."}',
  'ENTERPRISE',
  'TECHNOLOGY',
  '{"en": "ENTERPRISE", "fr": "ENTERPRISE"}',
  2015,
  '{"en": "201-1000", "fr": "201-1000"}',
  'https://www.techsim.com',
  '/company-logos/tech-sim.png',
  '/company-covers/tech-sim-cover.png',
  '{"city": {"en": "Austin", "fr": "Austin"}, "state": {"en": "Texas", "fr": "Texas"}, "country": {"en": "United States", "fr": "États-Unis"}, "postal_code": {"en": "78701", "fr": "78701"}}',
  '[]',
  ARRAY['en'],
  'VERIFIED',
  true,
  NOW(),
  NOW()
),
-- Lion BI
(
  '{"en": "Lion BI", "fr": "Lion BI"}',
  '{"en": "Business intelligence and data analytics company providing insights for enterprise decision making.", "fr": "Société de business intelligence et d''analyse de données fournissant des insights pour la prise de décision en entreprise."}',
  'ENTERPRISE',
  'TECHNOLOGY',
  '{"en": "ENTERPRISE", "fr": "ENTERPRISE"}',
  2012,
  '{"en": "1001-5000", "fr": "1001-5000"}',
  'https://www.lionbi.com',
  '/company-logos/lion-bi.png',
  '/company-covers/lion-bi-cover.png',
  '{"city": {"en": "New York", "fr": "New York"}, "state": {"en": "New York", "fr": "New York"}, "country": {"en": "United States", "fr": "États-Unis"}, "postal_code": {"en": "10001", "fr": "10001"}}',
  '[{"city": {"en": "Boston", "fr": "Boston"}, "state": {"en": "Massachusetts", "fr": "Massachusetts"}, "country": {"en": "United States", "fr": "États-Unis"}, "postal_code": {"en": "02108", "fr": "02108"}}]',
  ARRAY['en'],
  'VERIFIED',
  true,
  NOW(),
  NOW()
),
-- Mat Tech
(
  '{"en": "Mat Tech", "fr": "Mat Tech"}',
  '{"en": "Software development company focused on building scalable backend solutions and APIs.", "fr": "Société de développement logiciel spécialisée dans la création de solutions backend et d''APIs évolutives."}',
  'PROFESSIONAL',
  'TECHNOLOGY',
  '{"en": "STARTUP", "fr": "STARTUP"}',
  2019,
  '{"en": "11-50", "fr": "11-50"}',
  'https://www.mattech.dev',
  '/company-logos/mat-tech.png',
  '/company-covers/mat-tech-cover.png',
  '{"city": {"en": "Seattle", "fr": "Seattle"}, "state": {"en": "Washington", "fr": "Washington"}, "country": {"en": "United States", "fr": "États-Unis"}, "postal_code": {"en": "98101", "fr": "98101"}}',
  '[]',
  ARRAY['en'],
  'VERIFIED',
  true,
  NOW(),
  NOW()
),
-- Auchan
(
  '{"en": "Auchan", "fr": "Auchan"}',
  '{"en": "Major retail chain offering a wide range of products with locations across the country.", "fr": "Grande chaîne de distribution proposant une large gamme de produits avec des magasins dans tout le pays."}',
  'ENTERPRISE',
  'RETAIL',
  '{"en": "ENTERPRISE", "fr": "ENTERPRISE"}',
  1961,
  '{"en": "5000+", "fr": "5000+"}',
  'https://www.auchan.com',
  '/company-logos/auchan.png',
  '/company-covers/auchan-cover.png',
  '{"city": {"en": "Chicago", "fr": "Chicago"}, "state": {"en": "Illinois", "fr": "Illinois"}, "country": {"en": "United States", "fr": "États-Unis"}, "postal_code": {"en": "60601", "fr": "60601"}}',
  '[]',
  ARRAY['en', 'fr'],
  'VERIFIED',
  true,
  NOW(),
  NOW()
)
RETURNING id; 