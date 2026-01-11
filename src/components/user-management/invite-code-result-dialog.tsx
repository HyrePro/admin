'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

interface InviteCodeResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviteCode: string;
}

export function InviteCodeResultDialog({
  open,
  onOpenChange,
  inviteCode,
}: InviteCodeResultDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite code created</DialogTitle>
          <DialogDescription>
            Share this code to allow a user to join your organization.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          {/* CODE DISPLAY */}
          <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
            <span className="font-mono text-lg tracking-wider">
              {inviteCode}
            </span>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(inviteCode);
                  toast.success('Invite code copied');
                } catch {
                  toast.error('Copy failed');
                }
              }}
              aria-label="Copy invite code"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {/* CONTEXT */}
          <p className="text-sm text-muted-foreground">
            Anyone with this code can join until it expires. You can revoke it at any time from user settings.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
