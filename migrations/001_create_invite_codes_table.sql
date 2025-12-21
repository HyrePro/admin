-- Create invite_codes table
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  created_by UUID REFERENCES admin_user_info(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_school_id ON invite_codes(school_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_created_by ON invite_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_invite_codes_expires_at ON invite_codes(expires_at);

-- Enable Row Level Security
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their school's invite codes" 
  ON invite_codes FOR SELECT 
  USING (school_id IN (
    SELECT school_id FROM admin_user_info WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert invite codes for their school" 
  ON invite_codes FOR INSERT 
  WITH CHECK (school_id IN (
    SELECT school_id FROM admin_user_info WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their school's invite codes" 
  ON invite_codes FOR UPDATE 
  USING (school_id IN (
    SELECT school_id FROM admin_user_info WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete their school's invite codes" 
  ON invite_codes FOR DELETE 
  USING (school_id IN (
    SELECT school_id FROM admin_user_info WHERE id = auth.uid()
  ));