-- First, get the organization IDs
WITH org_ids AS (
  SELECT id, name->>'en' as name
  FROM organizations
  WHERE is_mock = true
)

-- Update jobs with organization IDs
UPDATE jobs j
SET organization_id = o.id
FROM org_ids o
WHERE j.company = o.name
AND j.is_mock = true
RETURNING j.id, j.company, o.id as organization_id;

-- Verify the updates
SELECT j.id, j.company, j.organization_id, o.name->>'en' as org_name
FROM jobs j
LEFT JOIN organizations o ON j.organization_id = o.id
WHERE j.is_mock = true
ORDER BY j.id; 