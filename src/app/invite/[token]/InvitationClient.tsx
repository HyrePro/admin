'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner'; // or your toast library
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { User } from '@supabase/supabase-js';

interface InvitationClientProps {
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

export default function InvitationClient({
  invitation,
  token,
  user,
  currentSchool,
}: InvitationClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Scenario A: Show toast for unauthenticated users
  useEffect(() => {
    if (!user) {
      toast.info('Please sign up or log in to accept this invitation', {
        duration: 5000,
      });
    }
  }, [user]);

  const handleAccept = async () => {
    // Proceed with acceptance, the API will handle confirmation if needed
    await processAcceptance();
  };

  const processAcceptance = async (confirmed = false) => {
    setLoading(true);
    setShowConfirmModal(false);

    try {
      const response = await fetch('/api/respond-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'accept', confirmed }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation');
      }

      // Check if confirmation is required (user has existing school)
      if (data.requiresConfirmation && !confirmed) {
        setShowConfirmModal(true);
        setLoading(false);
        return;
      }

      toast.success('Invitation accepted! Welcome to ' + invitation.school_info?.[0]?.name);
      
      // Redirect to dashboard after brief delay
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!confirm('Are you sure you want to decline this invitation?')) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/respond-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'reject' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to decline invitation');
      }

      toast.info('Invitation declined');
      
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  // Calculate days until expiration
  const daysUntilExpiration = Math.ceil(
    (new Date(invitation.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
          <div className="text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h1 className="text-3xl font-bold text-white mb-2">
              You&apos;re Invited!
            </h1>
            <p className="text-blue-100">
              {invitation.inviter_info?.[0]?.first_name + ' ' + invitation.inviter_info?.[0]?.last_name} has invited you to join their team
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          {/* Invitation Details */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Organization</p>
                <p className="text-xl font-bold text-gray-900">
                  {invitation.school_info?.[0]?.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Role</p>
                <p className="text-xl font-bold text-gray-900 capitalize">
                  {invitation.role}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Your Email</p>
                <p className="text-lg font-semibold text-gray-900">
                  {invitation.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Expires In</p>
                <p className="text-lg font-semibold text-gray-900">
                  {daysUntilExpiration} day{daysUntilExpiration !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Scenario A: Unauthenticated */}
          {!user && (
            <div className="mb-6">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      You need to sign up or log in to accept this invitation.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => router.push(`/auth/signup?invitation=${token}`)}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Sign Up
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/auth/login?invitation=${token}`)}
                  className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Log In
                </Button>
              </div>
            </div>
          )}

          {/* Scenario B: Authenticated, no school */}
          {user && !currentSchool && (
            <div className="mb-6">
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      Join {invitation.school_info?.[0]?.name} as {invitation.role}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button
                  onClick={handleAccept}
                  disabled={loading}
                  className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                >
                  {loading ? 'Processing...' : 'Accept Invitation'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDecline}
                  disabled={loading}
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Decline
                </Button>
              </div>
            </div>
          )}

          {/* Scenario C: Authenticated with existing school */}
          {user && currentSchool && (
            <div className="mb-6">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      You are currently part of <span className="font-semibold">{currentSchool.name}</span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      <strong>⚠️ Warning:</strong> Accepting this invitation will remove you from your current school and you&apos;ll lose access to all its data and resources.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button
                  onClick={handleAccept}
                  disabled={loading}
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                >
                  {loading ? 'Processing...' : 'Accept Invitation'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDecline}
                  disabled={loading}
                  className="flex-1 py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Decline
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Users with Existing Schools */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm School Transfer</DialogTitle>
            <DialogDescription>
              You are about to leave <strong>{currentSchool?.name}</strong> and join <strong>{invitation.school_info?.[0]?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-red-600">
              <strong>Warning:</strong> You will lose access to all data and resources from your current school.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmModal(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => processAcceptance(true)}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Processing...' : 'Confirm Transfer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}