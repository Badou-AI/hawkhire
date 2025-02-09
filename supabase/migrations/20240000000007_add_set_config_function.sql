-- Create function to set configuration values
CREATE OR REPLACE FUNCTION set_config(
  key text,
  value text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow setting app.* configuration values
  IF key NOT LIKE 'app.%' THEN
    RAISE EXCEPTION 'Only app.* configuration values are allowed';
  END IF;

  -- Set the configuration value for the current transaction
  PERFORM set_config(key, value, false);
END;
$$; 