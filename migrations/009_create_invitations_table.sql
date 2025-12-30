-- Create invitations table for email invitations
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES admin_user_info(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invitations_school_id ON invitations(school_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_invited_by ON invitations(invited_by);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at);

-- Enable Row Level Security
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view invitations for their school" 
  ON invitations FOR SELECT 
  USING (school_id IN (
    SELECT school_id FROM admin_user_info WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert invitations for their school" 
  ON invitations FOR INSERT 
  WITH CHECK (school_id IN (
    SELECT school_id FROM admin_user_info WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update invitations for their school" 
  ON invitations FOR UPDATE 
  USING (school_id IN (
    SELECT school_id FROM admin_user_info WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete invitations for their school" 
  ON invitations FOR DELETE 
  USING (school_id IN (
    SELECT school_id FROM admin_user_info WHERE id = auth.uid()
  ));

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invitations_updated_at 
    BEFORE UPDATE ON invitations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();