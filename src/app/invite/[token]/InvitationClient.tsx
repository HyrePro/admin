'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
import HeaderIcon from '@/components/header-icon';
import { NavUser } from '@/components/nav-user';
import { useAuth } from '@/context/auth-context';

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
  showEmailMismatchNotification: boolean;
}

export default function InvitationClient({
  invitation,
  token,
  user,
  currentSchool,
  showEmailMismatchNotification
}: InvitationClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Get auth context for NavUser component
  const { user: authUser } = useAuth();
  
  // Get user data for NavUser component
  const getUserData = () => {
    if (!authUser) return { name: 'Loading...', email: '', avatar: '' };
    
    return {
      name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || authUser.id || 'User',
      email: authUser.user_metadata?.email || authUser.email || '',
      avatar: authUser.user_metadata?.avatar_url || ''
    };
  };

  useEffect(() => {
    if (showEmailMismatchNotification) {
      toast.warning('Email mismatch', {
        description:
          'This invitation was sent to a different email address.',
        duration: 8000
      });
    }
  }, [showEmailMismatchNotification]);

  useEffect(() => {
    if (!user) {
      toast.info('Authentication required');
    }
  }, [user]);

  const processAcceptance = async (confirmed = false) => {
    setLoading(true);
    setShowConfirmModal(false);

    try {
      const res = await fetch('/api/respond-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'accept', confirmed })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      if (data.requiresConfirmation && !confirmed) {
        setShowConfirmModal(true);
        setLoading(false);
        return;
      }

      toast.success('Invitation accepted');
      router.push('/');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Request failed');
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);

    try {
      const res = await fetch('/api/respond-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'reject' })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      toast.info('Invitation declined');
      router.push('/');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Request failed');
      setLoading(false);
    }
  };

  const daysUntilExpiration = Math.ceil(
    (new Date(invitation.expires_at).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24)
  );

  return (
  <div className="min-h-screen bg-slate-50 flex flex-col">
    {/* Header section with HeaderIcon and NavUser */}
    <div className="top-0 z-50 bg-white border-b border-slate-200 px-4 absolute w-full">
      <div className="mx-auto py-2 flex items-center justify-between">
        <HeaderIcon />
        {authUser && (
          <NavUser user={getUserData()} />
        )}
      </div>
    </div>
    
    <main className="flex flex-1 items-center justify-center px-4 pt-16">
      <div className="w-full max-w-2xl bg-white border rounded-lg">
          <div className="px-8 py-6 border-b">
            <h1 className="text-2xl font-semibold text-slate-900">
              Invitation to join organization
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {invitation.inviter_info?.[0]?.first_name}{' '}
              {invitation.inviter_info?.[0]?.last_name} invited you to join
              <span className="font-medium">
                {' '}
                {invitation.school_info?.[0]?.name}
              </span>
            </p>
          </div>

          <div className="px-8 py-6">
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-slate-500">Organization</p>
                <p className="font-medium text-slate-900">
                  {invitation.school_info?.[0]?.name}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Role</p>
                <p className="font-medium capitalize text-slate-900">
                  {invitation.role}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Invited email</p>
                <p className="font-medium text-slate-900">
                  {invitation.email}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Expires</p>
                <p className="font-medium text-slate-900">
                  {daysUntilExpiration} days
                </p>
              </div>
            </div>
          </div>

          {!user && (
  <div className="mb-6 border-y bg-slate-50 border-radius px-8 py-3 text-sm text-slate-700">
    You must sign in to accept this invitation.
  </div>
)}


          {user && currentSchool && (
            <div className="mx-8 mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Accepting this invitation removes your access from
              <span className="font-medium"> {currentSchool.name}</span>.
            </div>
          )}

          <div className="px-8 pb-8 flex gap-3">
            {user ? (
              <>
                <Button
                  onClick={() => processAcceptance()}
                  disabled={loading}
                  className={
                    currentSchool
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }
                >
                  Accept
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDecline}
                  disabled={loading}
                >
                  Decline
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() =>
                    router.push(`/signup?invitation=${token}`)
                  }
                >
                  Sign up
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(`/login?invitation=${token}`)
                  }
                >
                  Log in
                </Button>
              </>
            )}
          </div>
        </div>
      </main>

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm transfer</DialogTitle>
            <DialogDescription>
              This action removes your access from{' '}
              {currentSchool?.name}.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
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
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
