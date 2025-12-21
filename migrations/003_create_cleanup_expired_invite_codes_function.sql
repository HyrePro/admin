-- Create function to cleanup expired invite codes
CREATE OR REPLACE FUNCTION cleanup_expired_invite_codes()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete all expired invite codes
  DELETE FROM invite_codes 
  WHERE expires_at < NOW();
  
  -- Get the number of deleted records
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Return the count of deleted records
  RETURN deleted_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_expired_invite_codes() TO authenticated;

-- Grant execute permission to service role for automated cleanup
GRANT EXECUTE ON FUNCTION cleanup_expired_invite_codes() TO service_role;