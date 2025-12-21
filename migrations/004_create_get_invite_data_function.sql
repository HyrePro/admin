-- Create function to retrieve all invite codes and invited users for a school
CREATE OR REPLACE FUNCTION get_invite_data(p_school_id UUID)
RETURNS TABLE(
  -- Invite codes data
  code_id UUID,
  invite_code TEXT,
  code_role TEXT,
  code_expires_at TIMESTAMP WITH TIME ZONE,
  code_created_by TEXT,
  code_created_at TIMESTAMP WITH TIME ZONE,
  code_status TEXT,
  associated_user_id UUID,
  associated_user_name TEXT,
  associated_user_email TEXT,
  
  -- Invited users data
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  user_role TEXT,
  user_invited_at TIMESTAMP WITH TIME ZONE,
  user_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify school exists and user has access
  IF NOT EXISTS (SELECT 1 FROM school_info WHERE id = p_school_id) THEN
    RAISE EXCEPTION 'Invalid school ID';
  END IF;
  
  RETURN QUERY
  -- Get invite codes data
  SELECT 
    ic.id as code_id,
    ic.code as invite_code,
    ic.role as code_role,
    ic.expires_at as code_expires_at,
    aui.first_name || ' ' || aui.last_name as code_created_by,
    ic.created_at as code_created_at,
    CASE 
      WHEN ic.expires_at < NOW() THEN 'Expired'
      WHEN i.id IS NOT NULL AND i.status = 'accepted' THEN 'Used'
      ELSE 'Active'
    END as code_status,
    aui2.id as associated_user_id,
    aui2.first_name || ' ' || aui2.last_name as associated_user_name,
    aui2.email as associated_user_email,
    
    -- Null values for invited users data in this part of the union
    NULL::UUID as user_id,
    NULL::TEXT as user_name,
    NULL::TEXT as user_email,
    NULL::TEXT as user_role,
    NULL::TIMESTAMP WITH TIME ZONE as user_invited_at,
    NULL::TEXT as user_status
  FROM invite_codes ic
  LEFT JOIN admin_user_info aui ON ic.created_by = aui.id
  LEFT JOIN invitations i ON ic.code = i.token AND i.school_id = p_school_id
  LEFT JOIN admin_user_info aui2 ON i.email = aui2.email AND aui2.school_id = p_school_id
  WHERE ic.school_id = p_school_id
  
  UNION ALL
  
  -- Get invited users data
  SELECT
    -- Null values for invite codes data in this part of the union
    NULL::UUID as code_id,
    NULL::TEXT as invite_code,
    NULL::TEXT as code_role,
    NULL::TIMESTAMP WITH TIME ZONE as code_expires_at,
    NULL::TEXT as code_created_by,
    NULL::TIMESTAMP WITH TIME ZONE as code_created_at,
    NULL::TEXT as code_status,
    NULL::UUID as associated_user_id,
    NULL::TEXT as associated_user_name,
    NULL::TEXT as associated_user_email,
    
    -- Actual invited users data
    aui.id as user_id,
    aui.first_name || ' ' || aui.last_name as user_name,
    aui.email as user_email,
    aui.role::TEXT as user_role,  -- Explicitly cast to TEXT to match UNION type
    aui.created_at as user_invited_at,
    CASE 
      WHEN EXISTS (
        SELECT 1 
        FROM invitations i 
        WHERE i.email = aui.email 
        AND i.status = 'accepted'
        AND i.school_id = p_school_id
      ) THEN 'Accepted'
      ELSE 'Pending'
    END as user_status
  FROM admin_user_info aui
  WHERE aui.school_id = p_school_id 
    AND EXISTS (
      SELECT 1 
      FROM invitations i 
      WHERE i.email = aui.email 
      AND i.school_id = p_school_id
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_invite_data(UUID) TO authenticated;