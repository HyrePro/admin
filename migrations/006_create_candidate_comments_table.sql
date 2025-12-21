-- Create candidate_comments table
CREATE TABLE IF NOT EXISTS candidate_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES admin_user_info(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  mentioned_ids TEXT[], -- Array of user IDs mentioned in the comment
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_candidate_comments_application_id ON candidate_comments(application_id);
CREATE INDEX IF NOT EXISTS idx_candidate_comments_user_id ON candidate_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_comments_school_id ON candidate_comments(school_id);
CREATE INDEX IF NOT EXISTS idx_candidate_comments_created_at ON candidate_comments(created_at);

-- Enable Row Level Security
ALTER TABLE candidate_comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view comments for their school" 
  ON candidate_comments FOR SELECT 
  USING (school_id IN (
    SELECT school_id FROM admin_user_info WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert comments for their school" 
  ON candidate_comments FOR INSERT 
  WITH CHECK (school_id IN (
    SELECT school_id FROM admin_user_info WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their own comments" 
  ON candidate_comments FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments" 
  ON candidate_comments FOR DELETE 
  USING (user_id = auth.uid());

-- Function to INSERT new comment
CREATE OR REPLACE FUNCTION insert_candidate_comment(
  p_user_id UUID,
  p_school_id UUID,
  p_application_id UUID,
  p_comment TEXT,
  p_mentioned_ids TEXT[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_comment_id UUID;
BEGIN
  INSERT INTO candidate_comments (user_id, school_id, application_id, comment, mentioned_ids)
  VALUES (p_user_id, p_school_id, p_application_id, p_comment, p_mentioned_ids)
  RETURNING id INTO v_comment_id;
  
  RETURN v_comment_id;
END;
$$;

-- Function to FETCH existing comments
CREATE OR REPLACE FUNCTION get_candidate_comments(p_application_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  avatar TEXT,
  comment TEXT,
  mentioned_ids TEXT[],
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cc.id,
    cc.user_id,
    aui.first_name,
    aui.last_name,
    aui.avatar,
    cc.comment,
    cc.mentioned_ids,
    cc.created_at,
    cc.updated_at
  FROM candidate_comments cc
  JOIN admin_user_info aui ON cc.user_id = aui.id
  WHERE cc.application_id = p_application_id
  ORDER BY cc.created_at ASC;
END;
$$;

-- Function to UPDATE existing comment
CREATE OR REPLACE FUNCTION update_candidate_comment(
  p_comment_id UUID,
  p_comment TEXT,
  p_mentioned_ids TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE candidate_comments
  SET comment = p_comment,
      mentioned_ids = p_mentioned_ids,
      updated_at = NOW()
  WHERE id = p_comment_id;
  
  RETURN FOUND;
END;
$$;

-- Function to DELETE comment
CREATE OR REPLACE FUNCTION delete_candidate_comment(p_comment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM candidate_comments
  WHERE id = p_comment_id;
  
  RETURN FOUND;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION insert_candidate_comment(UUID, UUID, UUID, TEXT, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_candidate_comments(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_candidate_comment(UUID, TEXT, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_candidate_comment(UUID) TO authenticated;