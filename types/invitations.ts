export type InvitationDetails = {
  id: string;
  school_id: string;
  invited_by: string;
  email: string;
  name: string;
  role: string;
  token: string;
  status: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  school_name: string;
  inviter_first_name: string;
  inviter_last_name: string;
};

export type UserSchoolInfo = {
  school_id: string;
  school_name: string;
};