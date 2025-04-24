-- Function to update demo name and slug
CREATE OR REPLACE FUNCTION public.update_demo_info_as_admin(
  p_component_id INT,
  p_demo_name TEXT,
  p_demo_slug TEXT
)
RETURNS json AS $$
DECLARE
  v_result json;
  v_user_id TEXT;
  v_is_admin BOOLEAN;
BEGIN
  -- Get the user ID for security checks
  v_user_id := requesting_user_id();
  
  -- Check if the user is admin using the is_admin boolean column in the users table
  SELECT is_admin INTO v_is_admin
  FROM users
  WHERE id = v_user_id;
  
  IF NOT COALESCE(v_is_admin, FALSE) THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'User does not have admin privileges'
    );
  END IF;
  
  -- Update the demo info in the demos table (not component_demos)
  UPDATE public.demos
  SET 
    name = p_demo_name,
    demo_slug = p_demo_slug,
    updated_at = NOW()
  WHERE component_id = p_component_id;
  
  IF FOUND THEN
    v_result := json_build_object('success', true);
  ELSE
    v_result := json_build_object(
      'success', false, 
      'error', 'No demo found with the provided component ID'
    );
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 