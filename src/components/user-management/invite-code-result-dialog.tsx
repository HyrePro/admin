'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface InviteCodeResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviteCode: string;
}

export function InviteCodeResultDialog({ open, onOpenChange, inviteCode }: InviteCodeResultDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Code Generated</DialogTitle>
          <DialogDescription>
            Share this code with the person you want to invite. They can use it to join your organization.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-6 py-4">
          <div className="flex justify-center space-x-2">
            {inviteCode.split('').map((char, index) => (
              <div key={index} className="w-12 h-12 flex items-center justify-center text-2xl font-bold border-2 border-gray-300 rounded-lg bg-gray-50">
                {char}
              </div>
            ))}
          </div>
          <Button 
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(inviteCode);
                toast.success('Code copied to clipboard');
              } catch (err) {
                console.error('Failed to copy: ', err);
                toast.error('Failed to copy code');
              }
            }}
          >
            Copy Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}