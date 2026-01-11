'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/api/client';
import { User } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';
import { XIcon } from 'lucide-react';

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string | null;
  user: User | null;
  onInviteSuccess: () => void;
  onCodeGenerated?: (code: string) => void;
}

export function InviteDialog({
  open,
  onOpenChange,
  schoolId,
  user,
  onInviteSuccess,
  onCodeGenerated,
}: InviteDialogProps) {
  const [method, setMethod] = useState<'email' | 'code'>('email');
  const [role, setRole] = useState<'admin' | 'hr' | 'interviewer' | 'viewer'>(
    'viewer'
  );

  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [name, setName] = useState(''); // Name for all invitees
  const [expirationPeriod, setExpirationPeriod] = useState('7');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* ---------------- EMAIL PARSING ---------------- */

  useEffect(() => {
    if (!emailInput.includes(',') && !emailInput.includes(' ')) return;

    const parts = emailInput
      .split(/[,\s]+/)
      .map(e => e.trim())
      .filter(Boolean);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valid = parts.filter(
      e => emailRegex.test(e) && !emails.includes(e)
    );

    if (valid.length) {
      setEmails(prev => [...prev, ...valid]);
      setEmailInput('');
    }
  }, [emailInput, emails]);

  const removeEmail = (email: string) =>
    setEmails(prev => prev.filter(e => e !== email));

  /* ---------------- ACTIONS ---------------- */

  const handleEmailInvite = async () => {
    if (!schoolId || emails.length === 0) return;

    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error();

      const response = await fetch('/api/create-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({
          name: user?.user_metadata?.full_name || user?.email || 'User', // Use the inviter's name or email as default
          emails,
          role,
          schoolId,
        }),
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to send invitations');
      }
      
      // Check if there were any failures in the batch
      const failedInvites = result.results.filter((r: any) => !r.success);
      if (failedInvites.length > 0) {
        const errorMsg = `Failed to send invitations to ${failedInvites.length} email(s). Some emails may have been sent successfully.`;
        setError(errorMsg);
      } else {
        // All invitations were sent successfully
        onInviteSuccess();
        onOpenChange(false);
        setEmails([]);
        setEmailInput('');
      }
    } catch {
      setError('Failed to send invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!schoolId || !user?.id) return;

    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(expirationPeriod));

      const { data, error } = await supabase.rpc('generate_invite_code', {
        p_school_id: schoolId,
        p_user_id: user.id,
        p_role: role,
        p_expires_at: expiresAt.toISOString(),
      });

      if (error || !data) throw new Error();

      const code =
        Array.isArray(data) ? data[0]?.generated_code : data.generated_code;

      onOpenChange(false);
      onCodeGenerated?.(code);
    } catch {
      setError('Failed to generate invite code');
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Invite Users</DialogTitle>
          <DialogDescription>
            Invite multiple people by email or generate a shared invite code
          </DialogDescription>
        </DialogHeader>

        {/* METHOD SWITCH */}
        <div className="flex border-b">
          {['email', 'code'].map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m as any)}
              className={cn(
                'px-4 py-2 text-sm font-medium',
                method === m
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground'
              )}
            >
              {m === 'email' ? 'Email Invite' : 'Invite Code'}
            </button>
          ))}
        </div>

        <div className="space-y-6 py-4">

          {/* ROLE */}
          <div className="space-y-3">
            <Label>Role</Label>
            <div className="grid grid-cols-4 gap-3">
              {[
                { id: 'admin', title: 'Admin', desc: 'Full access' },
                { id: 'hr', title: 'HR', desc: 'Hiring' },
                { id: 'interviewer', title: 'Interviewer', desc: 'Interviews' },
                { id: 'viewer', title: 'Viewer', desc: 'Read only' },
              ].map(r => (
                <label
                  key={r.id}
                  className={cn(
                    'cursor-pointer rounded-lg border p-3',
                    role === r.id
                      ? 'border-primary bg-muted'
                      : 'hover:border-muted-foreground'
                  )}
                >
                  <input
                    type="radio"
                    className="hidden"
                    checked={role === r.id}
                    onChange={() => setRole(r.id as any)}
                  />
                  <div className="font-medium">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{r.desc}</div>
                </label>
              ))}
            </div>
          </div>

          {/* EMAIL MODE */}
          {method === 'email' && (
            <div className="space-y-3">
              <Label>Email addresses</Label>
              <Textarea
                placeholder="user@company.com, another@company.com"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                className="min-h-[80px]"
              />

              {emails.length > 0 && (
                <div className="flex flex-wrap gap-2 rounded-md border p-2">
                  {emails.map(email => (
                    <Badge
                      key={email}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => removeEmail(email)}
                        className="ml-1 rounded-full hover:bg-secondary-foreground/10"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                Enter emails separated by commas or spaces. Invites are sent individually.
              </p>
            </div>
          )}

          {/* CODE MODE */}
          {method === 'code' && (
            <div className="max-w-md space-y-2">
              <Label>Expiration</Label>
              <Select value={expirationPeriod} onValueChange={setExpirationPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Anyone with the code can join until expiry.
              </p>
            </div>
          )}
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {method === 'email' ? (
            <Button 
              onClick={handleEmailInvite} 
              disabled={loading || emails.length === 0}
            >
              {loading ? (
                <>Sending Invites...</>
              ) : emails.length === 0 ? (
                <span className="inline-flex items-center gap-2">
                  Send Invites (0)
                </span>
              ) : (
                `Send Invites (${emails.length})`
              )}
            </Button>
          ) : (
            <Button onClick={handleGenerateCode} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Code'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
