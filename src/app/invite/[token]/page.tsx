import { createClient } from '@/lib/supabase/api/server';
import { redirect } from 'next/navigation';
import InvitationClientWrapper from './InvitationClientWrapper';
import { InvitationDetails, UserSchoolInfo } from '../../../../types/invitations';
import HeaderIcon from '@/components/header-icon';
export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  // Await params first, then destructure
  const { token } = await params;
  console.log('Token extracted:', token);
  
  const supabase = await createClient();
  console.log('Supabase client created');

  // Get invitation details using SQL function (single call)
  const { data: invitationData, error } = await supabase
    .rpc('get_invitation_details', { invitation_token: token })
    .single<InvitationDetails>();
  console.log('Invitation data fetched:', { invitationData, error });

  // Handle invitation not found
  if (error || !invitationData) {
    console.log('Invitation not found or error:', { error, invitationData });
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
  console.log('Invitation processed:', invitation);

  // Handle expired or already processed invitations
  const now = new Date();
  const expiresAt = new Date(invitation.expires_at);
  const isExpired = now > expiresAt;
  console.log('Expiration check:', { now, expiresAt, isExpired, status: invitation.status });

  if (isExpired || invitation.status !== 'pending') {
    console.log('Invitation is expired or already processed');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="absolute top-0 left-0 p-4" >
          <HeaderIcon />
        </div>
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
         
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
  console.log('Current user fetched:', user);

  // Get user's current school info
  let currentSchool = null;
  if (user) {
    console.log('User exists, fetching school info');
    const { data: userSchoolData, error: schoolError } = await supabase
      .from('admin_user_info')
      .select('school_id')
      .eq('id', user.id)
      .single<{ school_id: string }>();
    console.log('User school data fetched:', { userSchoolData, schoolError });

    if (userSchoolData?.school_id) {
      // Get school name using the school_id
      const { data: schoolInfo, error: schoolInfoError } = await supabase
        .from('school_info')
        .select('name')
        .eq('id', userSchoolData.school_id)
        .single<{ name: string }>();
      console.log('School info fetched:', { schoolInfo, schoolInfoError });

      if (schoolInfo?.name) {
        currentSchool = {
          id: userSchoolData.school_id,
          name: schoolInfo.name
        };
        console.log('Current school set:', currentSchool);
      }
    }
  } else {
    console.log('No user found, skipping school info fetch');
  }

  // Check if the authenticated user's email matches the invitation email
  let showEmailMismatchNotification = false;
  if (user && user.email && invitation.email && user.email !== invitation.email) {
    console.log('Email mismatch detected', {
      authenticatedUserEmail: user.email,
      invitationEmail: invitation.email
    });
    showEmailMismatchNotification = true;
  }

  // Check if user is already in the same school as the invitation
  if (currentSchool && currentSchool.id === invitation.school_id) {
    console.log('User is already in the same school as the invitation', {
      currentSchoolId: currentSchool.id,
      invitationSchoolId: invitation.school_id
    });
    
    if (user) {
      console.log('User is authenticated, redirecting to dashboard');
      redirect('/');
    } else {
      console.log('User is not authenticated, redirecting to login');
      redirect('/login');
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
  console.log('User data prepared for client:', userData);

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
    school_info: [{ name: invitation.school_name }],
    inviter_info: [{ 
      first_name: invitation.inviter_first_name, 
      last_name: invitation.inviter_last_name 
    }],
  };
  console.log('Serialized invitation prepared for client:', serializedInvitation);

  // Pass data to client component
  return (
    <InvitationClientWrapper 
      invitation={serializedInvitation}
      token={token}
      user={userData}
      currentSchool={currentSchool}
      showEmailMismatchNotification={showEmailMismatchNotification}
    />
  );
}