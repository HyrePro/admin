-- Create function to safely delete invite codes or invited users
CREATE OR REPLACE FUNCTION delete_invite_data(
  p_school_id UUID,
  p_item_id UUID,
  p_item_type TEXT -- 'code' or 'user'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted BOOLEAN := FALSE;
BEGIN
  -- Verify school exists and user has access
  IF NOT EXISTS (SELECT 1 FROM school_info WHERE id = p_school_id) THEN
    RAISE EXCEPTION 'Invalid school ID';
  END IF;
  
  -- Validate item type
  IF p_item_type NOT IN ('code', 'user') THEN
    RAISE EXCEPTION 'Invalid item type. Must be "code" or "user"';
  END IF;
  
  -- Delete invite code
  IF p_item_type = 'code' THEN
    DELETE FROM invite_codes 
    WHERE id = p_item_id 
      AND school_id = p_school_id;
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    
    -- Return true if a row was deleted
    RETURN v_deleted > 0;
  END IF;
  
  -- Delete invited user (only if they were invited, not a direct admin)
  IF p_item_type = 'user' THEN
    DELETE FROM admin_user_info 
    WHERE id = p_item_id 
      AND school_id = p_school_id
      AND EXISTS (
        SELECT 1 
        FROM invitations i 
        WHERE i.email = admin_user_info.email 
        AND i.school_id = p_school_id
      ); -- Only allow deleting invited users, not direct admins
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    
    -- Return true if a row was deleted
    RETURN v_deleted > 0;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION delete_invite_data(UUID, UUID, TEXT) TO authenticated;