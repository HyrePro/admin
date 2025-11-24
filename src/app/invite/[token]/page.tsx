// app/invite/[token]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { createClient } from '@/lib/supabase/api/client';

interface SchoolInfo {
  name: string;
  // Add other school properties as needed
}

interface AdminUserInfo {
  name: string;
  // Add other admin user properties as needed
}

interface Invitation {
  school_info: SchoolInfo;
  role: 'admin' | 'hr' | 'interviewer' | 'viewer';
  admin_user_info: AdminUserInfo;
  email: string;
  // Add other invitation properties as needed
}

export default function InvitationPage() {
  const params = useParams();
  const token = params.token as string;
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [responding, setResponding] = useState(false);

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
        setError(error.message);
      } else if (data.error) {
        setError(data.error);
      } else {
        setInvitation(data.invitation);
      }
    } catch (err) {
      setError('Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (action: 'accept' | 'reject') => {
    if (!user) {
      // Store token in localStorage and redirect to signup
      localStorage.setItem('pendingInvite', token);
      router.push(`/auth/signup?email=${encodeURIComponent(invitation?.email || '')}`);
      return;
    }

    setResponding(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { data, error } = await supabase.functions.invoke('respond-invitation', {
        body: {
          token,
          action,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) {
        setError(error.message);
      } else if (data.error) {
        setError(data.error);
      } else {
        if (action === 'accept') {
          router.push(`/dashboard/${data.schoolId}`);
        } else {
          router.push('/');
        }
      }
    } catch (err) {
      setError('Failed to respond to invitation');
    } finally {
      setResponding(false);
    }
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
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">You&apos;ve Been Invited!</h1>
        
        <div className="space-y-4 mb-8">
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-600">Organization</p>
            <p className="text-lg font-semibold text-gray-900">
              {invitation?.school_info?.name || 'Organization Name'}
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-600">Role</p>
            <p className="text-lg font-semibold text-gray-900 capitalize">
              {invitation?.role || 'Role'}
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-600">Invited by</p>
            <p className="text-lg font-semibold text-gray-900">
              {invitation?.admin_user_info?.name || 'Admin User'}
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => handleResponse('accept')}
            disabled={responding}
            className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {responding ? 'Processing...' : 'Accept'}
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
          <p className="mt-4 text-sm text-gray-600 text-center">
            You&apos;ll be redirected to sign up before accepting
          </p>
        )}
      </div>
    </div>
  );
}