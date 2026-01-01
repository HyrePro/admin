import { createClient } from '@/lib/supabase/api/server';
import { redirect } from 'next/navigation';
import InvitationClientWrapper from './InvitationClientWrapper';

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  // Await params first, then destructure
  const { token } = await params;
  
  const supabase = await createClient();

  // Get invitation details (server-side)
  const { data: invitationData, error } = await supabase
    .from('invitations')
    .select(`
      id,
      school_id,
      invited_by,
      email,
      name,
      role,
      token,
      status,
      expires_at,
      created_at,
      updated_at,
      school_info: schools (name),
      inviter_info: admin_user_info (first_name, last_name)
    `)
    .eq('token', token)
    .single();

  // Handle invitation not found
  if (error || !invitationData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-600 text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Invitation
          </h1>
          <p className="text-gray-600">
            This invitation link is invalid or has been deleted.
          </p>
        </div>
      </div>
    );
  }

  const invitation = invitationData;

  // Handle expired or already processed invitations
  const now = new Date();
  const expiresAt = new Date(invitation.expires_at);
  const isExpired = now > expiresAt;

  if (isExpired || invitation.status !== 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-yellow-600 text-5xl mb-4">
            {isExpired ? '⏰' : 'ℹ️'}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isExpired 
              ? 'Invitation Expired' 
              : 'Invitation Already Processed'}
          </h1>
          <p className="text-gray-600">
            {isExpired 
              ? `This invitation expired on ${new Date(invitation.expires_at).toLocaleDateString()}.` 
              : `This invitation has already been ${invitation.status}.`}
          </p>
        </div>
      </div>
    );
  }

  // Get current user (server-side)
  const { data: { user } } = await supabase.auth.getUser();

  // Get user's current school info if authenticated
  let currentSchool = null;
  if (user) {
    const { data: userInfo } = await supabase
      .from('admin_user_info')
      .select('school_id, school_info(name)')
      .eq('id', user.id)
      .single();

    if (userInfo?.school_id) {
      currentSchool = {
        id: userInfo.school_id,
        name: userInfo.school_info?.[0]?.name
      };
    }
  }

  // Prepare user data for client component
  const userData = user ? {
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata,
    app_metadata: user.app_metadata,
    created_at: user.created_at,
    aud: user.aud,
  } : null;

  // Prepare invitation data for client component (ensure it's serializable)
  const serializedInvitation = {
    id: invitation.id,
    school_id: invitation.school_id,
    invited_by: invitation.invited_by,
    email: invitation.email,
    name: invitation.name,
    role: invitation.role,
    token: invitation.token,
    status: invitation.status,
    expires_at: invitation.expires_at,
    created_at: invitation.created_at,
    updated_at: invitation.updated_at,
    school_info: invitation.school_info,
    inviter_info: invitation.inviter_info,
  };

  // Pass data to client component
  return (
    <InvitationClientWrapper 
      invitation={serializedInvitation}
      token={token}
      user={userData}
      currentSchool={currentSchool}
    />
  );
}