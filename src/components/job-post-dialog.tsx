import React, { useEffect } from 'react';
import { toast } from 'sonner';

interface JobPostDialogProps {
  open: boolean;
  type: 'progress' | 'success' | 'error' | null;
  error?: string | null;
  onClose: () => void;
}

export const JobPostDialog: React.FC<JobPostDialogProps> = ({ open, type, error, onClose }) => {
  useEffect(() => {
    if (!open || !type) {
      // Dismiss the toast if dialog is closed
      if (!open) {
        toast.dismiss('job-post-toast');
      }
      return;
    }

    switch (type) {
      case 'progress':
        toast.loading('Publishing Job...', {
          id: 'job-post-toast',
          description: 'Please wait while we publish your job post.',
        });
        break;
      case 'success':
        toast.success('Success!', {
          id: 'job-post-toast',
          description: 'Your job post has been published.',
        });
        // Auto close success toast after 3 seconds
        setTimeout(() => {
          onClose();
        }, 3000);
        break;
      case 'error':
        toast.error('Something went wrong', {
          id: 'job-post-toast',
          description: error || 'An unknown error occurred.',
        });
        break;
    }
  }, [open, type, error, onClose]);

  // Render nothing as we're using Sonner toasts
  return null;
};