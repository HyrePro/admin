'use client';

import { Suspense } from 'react';
import InvitationClient from './InvitationClient';
import { User } from '@supabase/supabase-js';

interface InvitationClientWrapperProps {
  invitation: {
    school_id: string;
    school_info: { name: string }[];
    inviter_info: { first_name: string; last_name: string }[];
    role: string;
    name: string;
    email: string;
    expires_at: string;
    status: string;
  };
  token: string;
  user: User | null;
  currentSchool: { id: string; name: string } | null;
}

export default function InvitationClientWrapper({
  invitation,
  token,
  user,
  currentSchool,
}: InvitationClientWrapperProps) {
  return (
    <InvitationClient 
      invitation={invitation}
      token={token}
      user={user}
      currentSchool={currentSchool}
    />
  );
}