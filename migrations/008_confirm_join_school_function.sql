-- Create function to confirm user joining school and update admin_user_info
CREATE OR REPLACE FUNCTION confirm_user_join_school(p_user_id UUID, p_invite_code TEXT, p_school_id UUID, p_role TEXT DEFAULT 'admin')
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  updated_user_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invite_code_record RECORD;
  v_user_exists BOOLEAN;
BEGIN
  -- Initialize return values
  success := FALSE;
  message := '';
  updated_user_id := NULL;

  -- Verify the invite code is valid and hasn't been used
  SELECT 
    ic.id,
    ic.school_id,
    ic.role,
    ic.expires_at
  INTO v_invite_code_record
  FROM invite_codes ic
  WHERE ic.code = p_invite_code
    AND ic.expires_at > NOW();

  -- Check if invite code exists and is valid
  IF v_invite_code_record IS NULL THEN
    success := FALSE;
    message := 'Invalid or expired invite code';
    RETURN QUERY SELECT success, message, updated_user_id;
    RETURN;
  END IF;

  -- Check if the provided school_id matches the invite code's school_id
  IF v_invite_code_record.school_id != p_school_id THEN
    success := FALSE;
    message := 'School ID does not match the invite code';
    RETURN QUERY SELECT success, message, updated_user_id;
    RETURN;
  END IF;

  -- Check if user already has a school assigned
  SELECT EXISTS(
    SELECT 1 
    FROM admin_user_info 
    WHERE id = p_user_id 
    AND school_id IS NOT NULL
  ) INTO v_user_exists;

  IF v_user_exists THEN
    success := FALSE;
    message := 'User is already associated with a school';
    RETURN QUERY SELECT success, message, updated_user_id;
    RETURN;
  END IF;

  -- Determine the role to use: either the parameter or the one from the invite code
  IF p_role IS NULL OR p_role = '' THEN
    p_role := v_invite_code_record.role;
  END IF;
  
  -- Validate that the role is one of the allowed values, default to 'admin' if invalid
  IF p_role NOT IN ('admin', 'hr', 'interviewer', 'viewer') THEN
    -- If the role from the invite code is invalid, default to 'admin'
    p_role := 'admin';
  END IF;
  
  -- Update the admin_user_info table with the school_id and role
  INSERT INTO admin_user_info (id, school_id, role)
  VALUES (p_user_id, p_school_id, p_role::user_role)
  ON CONFLICT (id) 
  DO UPDATE SET 
    school_id = EXCLUDED.school_id,
    role = EXCLUDED.role::user_role,
    updated_at = NOW();

  -- Mark the invite code as used by deleting it (or you could add a used flag)
  DELETE FROM invite_codes WHERE code = p_invite_code;

  -- Return success
  success := TRUE;
  message := 'Successfully joined the school';
  updated_user_id := p_user_id;

  RETURN QUERY SELECT success, message, updated_user_id;

END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION confirm_user_join_school(UUID, TEXT, UUID, TEXT) TO authenticated;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION confirm_user_join_school(UUID, TEXT, UUID, TEXT) TO service_role;