-- Create function to verify invite code and return school details
CREATE OR REPLACE FUNCTION verify_invite_code_and_get_school(p_invite_code TEXT)
RETURNS TABLE(
  school_id UUID,
  school_name TEXT,
  school_location TEXT,
  school_logo_url TEXT,
  invite_role TEXT,
  invite_expires_at TIMESTAMP WITH TIME ZONE,
  is_valid BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_school_id UUID;
  v_invite_role TEXT;
  v_invite_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Initialize return values
  is_valid := FALSE;
  error_message := NULL;

  -- Check if invite code exists and is not expired
  SELECT 
    ic.school_id, 
    ic.role, 
    ic.expires_at
  INTO 
    v_school_id, 
    v_invite_role, 
    v_invite_expires_at
  FROM invite_codes ic
  WHERE ic.code = p_invite_code
    AND ic.expires_at > NOW();

  -- If no matching invite code found
  IF NOT FOUND THEN
    is_valid := FALSE;
    error_message := 'Invalid or expired invite code';
    RETURN QUERY SELECT 
      NULL::UUID as school_id,
      NULL::TEXT as school_name,
      NULL::TEXT as school_location,
      NULL::TEXT as school_logo_url,
      NULL::TEXT as invite_role,
      NULL::TIMESTAMP WITH TIME ZONE as invite_expires_at,
      is_valid,
      error_message;
    RETURN;
  END IF;

  -- Check if the school exists
  IF NOT EXISTS (SELECT 1 FROM school_info WHERE id = v_school_id) THEN
    is_valid := FALSE;
    error_message := 'Associated school information not found';
    RETURN QUERY SELECT 
      NULL::UUID as school_id,
      NULL::TEXT as school_name,
      NULL::TEXT as school_location,
      NULL::TEXT as school_logo_url,
      NULL::TEXT as invite_role,
      NULL::TIMESTAMP WITH TIME ZONE as invite_expires_at,
      is_valid,
      error_message;
    RETURN;
  END IF;

  -- Return school information along with invite details
  is_valid := TRUE;
  error_message := NULL;
  
  RETURN QUERY 
  SELECT 
    si.id as school_id,
    si.name as school_name,
    si.location as school_location,
    si.logo_url as school_logo_url,
    v_invite_role as invite_role,
    v_invite_expires_at as invite_expires_at,
    is_valid,
    error_message
  FROM school_info si
  WHERE si.id = v_school_id;

END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION verify_invite_code_and_get_school(TEXT) TO authenticated;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION verify_invite_code_and_get_school(TEXT) TO service_role;