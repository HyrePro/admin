'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { createClient } from '@/lib/supabase/api/client';

interface UserInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'hr' | 'interviewer' | 'viewer';
  status: 'active' | 'invited' | 'disabled';
  avatar?: string | null;
}

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userToDelete: UserInfo | null;
  onDeleteSuccess: () => void;
}

export function DeleteUserDialog({ open, onOpenChange, userToDelete, onDeleteSuccess }: DeleteUserDialogProps) {
  // Handle delete user
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const supabase = createClient();

      // Check if user is a panelist or admin user
      if (userToDelete.role === 'interviewer') {
        // Delete from interview_panelists
        const { error } = await supabase
          .from('interview_panelists')
          .delete()
          .eq('id', userToDelete.id);

        if (error) throw error;

        // Update local state through callback
        onDeleteSuccess();
      } else {
        // For admin users, you would typically deactivate rather than delete
        toast.info('Admin users cannot be deleted. In a full implementation, they would be deactivated.');
        onOpenChange(false);
        return;
      }

      toast.success('User removed successfully');
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error('Failed to remove user');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove User</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove {userToDelete?.first_name} {userToDelete?.last_name} from your organization?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDeleteUser}>
            Remove User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}