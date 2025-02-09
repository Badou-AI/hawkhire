-- Drop existing trigger and function
DROP TRIGGER IF EXISTS auto_create_owner_member ON organizations;
DROP FUNCTION IF EXISTS create_owner_member();

-- Recreate function with correct email access
CREATE OR REPLACE FUNCTION create_owner_member()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get email from auth.users table
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = auth.uid();

  INSERT INTO organization_members (
    organization_id,
    user_id,
    email,
    role,
    status
  ) VALUES (
    NEW.id,
    auth.uid(),
    user_email,
    'OWNER',
    'ACTIVE'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER auto_create_owner_member
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION create_owner_member(); 