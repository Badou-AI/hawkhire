-- Drop existing trigger and function
DROP TRIGGER IF EXISTS auto_create_owner_member ON organizations;
DROP FUNCTION IF EXISTS create_owner_member();

-- Create function that accepts email parameter
CREATE OR REPLACE FUNCTION create_owner_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO organization_members (
    organization_id,
    user_id,
    email,
    role,
    status
  ) VALUES (
    NEW.id,
    auth.uid(),
    current_setting('app.current_user_email', true),
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