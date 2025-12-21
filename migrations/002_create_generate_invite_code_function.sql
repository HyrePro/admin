-- Create function to generate unique invite codes
CREATE OR REPLACE FUNCTION generate_invite_code(
  p_school_id UUID,
  p_user_id UUID,
  p_role TEXT,
  p_expires_at TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE(generated_code TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
  v_attempts INTEGER := 0;
BEGIN
  -- Try up to 10 times to generate a unique code
  WHILE v_attempts < 10 LOOP
    -- Generate a 6-character alphanumeric code
    v_code := substring(md5(random()::text), 1, 6);
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM invite_codes ic WHERE ic.code = v_code) INTO v_exists;
    
    IF NOT v_exists THEN
      -- Verify that the school_id and user_id exist before inserting
      IF NOT EXISTS (SELECT 1 FROM school_info WHERE id = p_school_id) THEN
        RAISE EXCEPTION 'Invalid school_id: %', p_school_id;
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM admin_user_info WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'Invalid user_id: %', p_user_id;
      END IF;
      
      -- Insert the new invite code
      INSERT INTO invite_codes (code, school_id, created_by, role, expires_at)
      VALUES (v_code, p_school_id, p_user_id, p_role, p_expires_at);
      
      -- Return the generated code
      RETURN QUERY SELECT v_code AS generated_code;
      RETURN;
    END IF;
    
    v_attempts := v_attempts + 1;
  END LOOP;
  
  -- If we couldn't generate a unique code after 10 attempts, raise an exception
  RAISE EXCEPTION 'Could not generate unique invite code after 10 attempts';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_invite_code(UUID, UUID, TEXT, TIMESTAMP WITH TIME ZONE) TO authenticated;
-- Grant execute permission to service role for backend operations
GRANT EXECUTE ON FUNCTION generate_invite_code(UUID, UUID, TEXT, TIMESTAMP WITH TIME ZONE) TO service_role;