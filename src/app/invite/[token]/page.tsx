// app/invite/[token]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { createClient } from '@/lib/supabase/api/client';

interface SchoolInfo {
  name: string;
}

interface AdminUserInfo {
  first_name: string;
  last_name: string;
  email: string;
}

interface Invitation {
  school_info: SchoolInfo;
  role: 'admin' | 'hr' | 'interviewer' | 'viewer';
  admin_user_info: AdminUserInfo;
  email: string;
  expires_at: string;
}

interface SchoolChangeConfirmation {
  currentSchool: {
    id: string;
    name: string;
  };
  newSchool: {
    id: string;
    name: string;
  };
}

export default function InvitationPage() {
  const params = useParams();
  const token = params.token as string;
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [responding, setResponding] = useState(false);
  const [showSchoolChangeConfirmation, setShowSchoolChangeConfirmation] = useState(false);
  const [schoolChangeData, setSchoolChangeData] = useState<SchoolChangeConfirmation | null>(null);
  const [showSignOutPrompt, setShowSignOutPrompt] = useState(false);
  const [signOutMessage, setSignOutMessage] = useState('');

  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-invitation', {
        body: { token },
      });

      if (error) {
        setError(error.message || 'Failed to load invitation');
      } else if (data.error) {
        setError(data.message || data.error);
      } else {
        setInvitation(data.invitation);
      }
    } catch (err) {
      setError('Failed to load invitation');
      console.error('Error fetching invitation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (action: 'accept' | 'reject', confirmSchoolChange = false) => {
    // Scenario A: User not logged in - redirect to signup
    if (!user && action === 'accept') {
      localStorage.setItem('pendingInvite', token);
      router.push(`/signup?email=${encodeURIComponent(invitation?.email || '')}`);
      return;
    }

    // Allow rejection without login
    if (!user && action === 'reject') {
      setResponding(true);
      try {
        const { data, error } = await supabase.functions.invoke('respond-invitation', {
          body: { token, action },
        });

        if (error) {
          setError(error.message || 'Failed to reject invitation');
        } else if (data.error) {
          setError(data.message || data.error);
        } else {
          router.push('/');
        }
      } catch (err) {
        setError('Failed to reject invitation');
        console.error('Error rejecting invitation:', err);
      } finally {
        setResponding(false);
      }
      return;
    }

    setResponding(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { data, error } = await supabase.functions.invoke('respond-invitation', {
        body: {
          token,
          action,
          confirmSchoolChange,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      // Log the full response for debugging
      console.log('Response from server:', { data, error });

      // Handle Supabase invocation errors
      if (error) {
        console.error('Supabase function error:', error);
        setError(error.message || 'Failed to process invitation');
        setResponding(false);
        return;
      }

      // Check for special scenarios first
      if (data.requiresSignOut) {
        // Scenario D: User logged in with different email
        console.log('Scenario D: Requires sign out', data);
        setSignOutMessage(data.message);
        setShowSignOutPrompt(true);
        setResponding(false);
        return;
      }
      
      if (data.requiresConfirmation) {
        // Scenario C: School change confirmation required
        console.log('Scenario C: School change required', data);
        setSchoolChangeData({
          currentSchool: data.currentSchool,
          newSchool: data.newSchool,
        });
        setShowSchoolChangeConfirmation(true);
        setResponding(false);
        return;
      }
      
      if (data.requiresAuth) {
        // Scenario A: Need to sign up/login
        console.log('Scenario A: Requires auth', data);
        localStorage.setItem('pendingInvite', token);
        router.push(`/signup?email=${encodeURIComponent(data.invitationEmail || '')}`);
        return;
      }

      // Handle other errors from the function
      if (data.error && !data.success) {
        console.error('Function returned error:', data);
        setError(data.message || data.error);
        setResponding(false);
        return;
      }

      // Success!
      if (data.success) {
        if (action === 'accept') {
          // Show success message based on scenario
          const messages: { [key: string]: string } = {
            'new_user_created': 'Welcome! Your account has been created.',
            'existing_user_no_school': 'Successfully joined the organization!',
            'school_changed': 'Successfully switched organizations!',
            'already_member': 'Welcome back!',
          };
          
          const successMessage = messages[data.scenario] || 'Invitation accepted!';
          
          // You can show a toast notification here
          console.log(successMessage);
          
          router.push(`/dashboard/${data.schoolId}`);
        } else {
          router.push('/');
        }
      }
    } catch (err) {
      setError('Failed to respond to invitation');
      console.error('Error responding to invitation:', err);
    } finally {
      setResponding(false);
    }
  };

  const handleSchoolChangeConfirm = () => {
    setShowSchoolChangeConfirmation(false);
    handleResponse('accept', true);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push(`/login?email=${encodeURIComponent(invitation?.email || '')}&redirect=/invite/${token}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => router.push('/')}
                className="mt-4 text-sm text-red-700 hover:text-red-800 underline"
              >
                Return to home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // School Change Confirmation Modal
  if (showSchoolChangeConfirmation && schoolChangeData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Switch Organizations?</h2>
            <p className="text-gray-600">This action will change your current organization</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-red-50 border border-red-200 p-4 rounded-md">
              <p className="text-sm text-red-600 font-medium mb-1">Current Organization</p>
              <p className="text-lg font-semibold text-gray-900">
                {schoolChangeData.currentSchool.name}
              </p>
            </div>

            <div className="flex justify-center">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>

            <div className="bg-green-50 border border-green-200 p-4 rounded-md">
              <p className="text-sm text-green-600 font-medium mb-1">New Organization</p>
              <p className="text-lg font-semibold text-gray-900">
                {schoolChangeData.newSchool.name}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSchoolChangeConfirm}
              disabled={responding}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {responding ? 'Switching...' : 'Confirm Switch'}
            </button>
            <button
              onClick={() => {
                setShowSchoolChangeConfirmation(false);
                setSchoolChangeData(null);
              }}
              disabled={responding}
              className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Sign Out Prompt Modal
  if (showSignOutPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Different Account</h2>
            <p className="text-gray-600">{signOutMessage}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <p className="text-sm text-gray-600 mb-2">Current account:</p>
            <p className="text-base font-medium text-gray-900 mb-3">{user?.email}</p>
            <p className="text-sm text-gray-600 mb-2">Required account:</p>
            <p className="text-base font-medium text-gray-900">{invitation?.email}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Sign Out & Continue
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main invitation display
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">You&apos;ve Been Invited!</h1>
          <p className="text-gray-600">You&apos;re invited to join an organization</p>
        </div>
        
        <div className="space-y-4 mb-8">
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Organization</p>
            <p className="text-lg font-semibold text-gray-900">
              {invitation?.school_info?.name || 'Organization Name'}
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Role</p>
            <p className="text-lg font-semibold text-gray-900 capitalize">
              {invitation?.role || 'Role'}
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Invited by</p>
            <p className="text-lg font-semibold text-gray-900">
              {invitation?.admin_user_info 
                ? `${invitation.admin_user_info.first_name} ${invitation.admin_user_info.last_name}`
                : 'Admin User'}
            </p>
            <p className="text-sm text-gray-500">
              {invitation?.admin_user_info?.email}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Invited email</p>
            <p className="text-base font-medium text-gray-900">
              {invitation?.email}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => handleResponse('accept')}
            disabled={responding}
            className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
          >
            {responding ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Accept'
            )}
          </button>
          <button
            onClick={() => handleResponse('reject')}
            disabled={responding}
            className="flex-1 bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Decline
          </button>
        </div>

        {!user && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800 text-center">
              <svg className="inline-block h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              You&apos;ll be redirected to sign up before accepting
            </p>
          </div>
        )}
      </div>
    </div>
  );
}