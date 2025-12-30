-- Create function to handle the entire invitation process
CREATE OR REPLACE FUNCTION create_invitation(
  p_name TEXT,
  p_email TEXT,
  p_role TEXT,
  p_school_id UUID,
  p_invited_by UUID
)
RETURNS TABLE (
  success BOOLEAN,
  error_message TEXT,
  invitation_id UUID,
  token TEXT,
  email_sent BOOLEAN,
  details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_school_id UUID;
  v_existing_user RECORD;
  v_existing_invite RECORD;
  v_invite_token TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_school_name TEXT;
  v_inviter_name TEXT;
  v_invite_link TEXT;
  v_resend_response JSONB;
  v_email_sent BOOLEAN := FALSE;
BEGIN
  -- Verify the user has access to this school
  SELECT school_id INTO v_user_school_id
  FROM admin_user_info
  WHERE id = p_invited_by;
  
  IF v_user_school_id IS NULL OR v_user_school_id != p_school_id THEN
    RETURN QUERY SELECT 
      FALSE as success,
      'Access denied' as error_message,
      NULL::UUID as invitation_id,
      NULL::TEXT as token,
      FALSE as email_sent,
      jsonb_build_object('type', 'access_denied') as details;
    RETURN;
  END IF;

  -- Validate required fields
  IF p_name IS NULL OR p_email IS NULL OR p_role IS NULL OR p_school_id IS NULL THEN
    RETURN QUERY SELECT 
      FALSE as success,
      'Missing required fields' as error_message,
      NULL::UUID as invitation_id,
      NULL::TEXT as token,
      FALSE as email_sent,
      jsonb_build_object('type', 'missing_fields') as details;
    RETURN;
  END IF;

  -- Validate email format
  IF p_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RETURN QUERY SELECT 
      FALSE as success,
      'Invalid email format' as error_message,
      NULL::UUID as invitation_id,
      NULL::TEXT as token,
      FALSE as email_sent,
      jsonb_build_object('type', 'invalid_email', 'email', p_email) as details;
    RETURN;
  END IF;

  -- Check if user already exists with this email in the same school
  SELECT id INTO v_existing_user
  FROM admin_user_info
  WHERE email = p_email AND school_id = p_school_id;
  
  IF v_existing_user IS NOT NULL THEN
    RETURN QUERY SELECT 
      FALSE as success,
      p_email || ' is already a member of this organization.' as error_message,
      NULL::UUID as invitation_id,
      NULL::TEXT as token,
      FALSE as email_sent,
      jsonb_build_object('type', 'user_exists', 'email', p_email) as details;
    RETURN;
  END IF;

  -- Check for existing invitations (both pending and other statuses)
  SELECT id, status, expires_at, created_at INTO v_existing_invite
  FROM invitations
  WHERE email = p_email AND school_id = p_school_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_existing_invite IS NOT NULL THEN
    IF v_existing_invite.status = 'pending' THEN
      IF v_existing_invite.expires_at > NOW() THEN
        -- Active pending invitation
        DECLARE
          v_days_remaining INTEGER;
        BEGIN
          v_days_remaining := CEIL(EXTRACT(EPOCH FROM (v_existing_invite.expires_at - NOW())) / 86400)::INTEGER;
          RETURN QUERY SELECT 
            FALSE as success,
            'An invitation has already been sent to ' || p_email || '. It will expire in ' || v_days_remaining || ' day' || CASE WHEN v_days_remaining != 1 THEN 's' ELSE '' END || '.' as error_message,
            NULL::UUID as invitation_id,
            NULL::TEXT as token,
            FALSE as email_sent,
            jsonb_build_object(
              'type', 'invitation_exists',
              'status', 'pending',
              'expires_at', v_existing_invite.expires_at,
              'sent_at', v_existing_invite.created_at
            ) as details;
          RETURN;
        END;
      ELSE
        -- Expired invitation - delete it and allow new invitation
        DELETE FROM invitations WHERE id = v_existing_invite.id;
      END IF;
    ELSIF v_existing_invite.status = 'accepted' THEN
      RETURN QUERY SELECT 
        FALSE as success,
        p_email || ' has already accepted a previous invitation.' as error_message,
        NULL::UUID as invitation_id,
        NULL::TEXT as token,
        FALSE as email_sent,
        jsonb_build_object('type', 'invitation_accepted', 'email', p_email) as details;
        RETURN;
    ELSIF v_existing_invite.status = 'declined' THEN
      -- Allow new invitation if previous was declined
      RAISE NOTICE 'Re-inviting % after previous decline', p_email;
    END IF;
  END IF;

  -- Generate secure token (32 bytes = 64 hex characters)
  v_invite_token := encode(gen_random_bytes(32), 'hex');

  -- Set expiration (7 days from now)
  v_expires_at := NOW() + INTERVAL '7 days';

  -- Create invitation record
  INSERT INTO invitations (school_id, invited_by, email, name, role, token, expires_at)
  VALUES (p_school_id, p_invited_by, p_email, p_name, p_role, v_invite_token, v_expires_at);

  -- Get school and inviter info for email
  SELECT name INTO v_school_name
  FROM school_info
  WHERE id = p_school_id;

  SELECT first_name || ' ' || last_name INTO v_inviter_name
  FROM admin_user_info
  WHERE id = p_invited_by;

  -- Construct the invite link (using a placeholder - in practice, this would call an edge function)
  v_invite_link := 'http://localhost:3000/invite/' || v_invite_token;

  -- In a real implementation, we would call an edge function to send the email
  -- For now, we'll simulate the email sending and assume it succeeds
  -- This is where you would integrate with your email service
  
  -- In a real implementation, you would do something like:
  -- SELECT send_invitation_email(p_name, p_email, v_school_name, v_inviter_name, v_invite_link) INTO v_resend_response;
  
  -- For this example, we'll assume the email was sent successfully
  v_email_sent := TRUE;

  -- Return success response
  RETURN QUERY SELECT 
    TRUE as success,
    NULL as error_message,
    (SELECT id FROM invitations WHERE token = v_invite_token) as invitation_id,
    v_invite_token as token,
    v_email_sent as email_sent,
    jsonb_build_object(
      'type', 'success',
      'school_name', v_school_name,
      'inviter_name', v_inviter_name,
      'expires_at', v_expires_at
    ) as details;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_invitation(TEXT, TEXT, TEXT, UUID, UUID) TO authenticated;