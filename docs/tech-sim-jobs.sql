-- Tech Sim Jobs (organization_id: 8b809740-9391-4add-be1e-d76db1851e39)
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
-- DevOps Engineer
(
    '{"en": "DevOps Engineer", "fr": "Ingénieur DevOps"}'::jsonb,
    '{"en": "Join our DevOps team to build and maintain our cloud infrastructure and CI/CD pipelines.", "fr": "Rejoignez notre équipe DevOps pour construire et maintenir notre infrastructure cloud et nos pipelines CI/CD."}'::jsonb,
    '8b809740-9391-4add-be1e-d76db1851e39',
    '{"en": ["5+ years of experience with AWS and cloud infrastructure", "Strong knowledge of Kubernetes and container orchestration", "Experience with CI/CD pipelines and automation", "Proficiency in infrastructure as code"], "fr": ["5+ ans d''expérience avec AWS et l''infrastructure cloud", "Solide connaissance de Kubernetes et de l''orchestration de conteneurs", "Expérience avec les pipelines CI/CD et l''automatisation", "Maîtrise de l''infrastructure as code"]}'::jsonb,
    ARRAY['AWS', 'KUBERNETES', 'DOCKER', 'TERRAFORM'],
    'PUBLISHED',
    '{"city": {"en": "Austin", "fr": "Austin"}, "state": {"en": "Texas", "fr": "Texas"}, "country": {"en": "United States", "fr": "États-Unis"}, "postal_code": {"en": "78701", "fr": "78701"}}'::jsonb,
    'FULL_TIME',
    130000,
    180000,
    'USD',
    true,
    true,
    NOW(),
    NOW()
),
-- Cloud Solutions Architect
(
    '{"en": "Cloud Solutions Architect", "fr": "Architecte Solutions Cloud"}'::jsonb,
    '{"en": "Design and implement cloud-native solutions for enterprise clients.", "fr": "Concevoir et mettre en œuvre des solutions cloud natives pour les clients entreprise."}'::jsonb,
    '8b809740-9391-4add-be1e-d76db1851e39',
    '{"en": ["7+ years of experience in cloud architecture", "Deep expertise in AWS and Azure services", "Experience designing microservices architectures", "Strong background in enterprise architecture"], "fr": ["7+ ans d''expérience en architecture cloud", "Expertise approfondie des services AWS et Azure", "Expérience dans la conception d''architectures microservices", "Solide expérience en architecture d''entreprise"]}'::jsonb,
    ARRAY['AWS', 'AZURE', 'CLOUD_ARCHITECTURE', 'MICROSERVICES'],
    'PUBLISHED',
    '{"city": {"en": "Austin", "fr": "Austin"}, "state": {"en": "Texas", "fr": "Texas"}, "country": {"en": "United States", "fr": "États-Unis"}, "postal_code": {"en": "78701", "fr": "78701"}}'::jsonb,
    'FULL_TIME',
    140000,
    200000,
    'USD',
    true,
    true,
    NOW(),
    NOW()
); 