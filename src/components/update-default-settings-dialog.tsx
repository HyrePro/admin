'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UpdateDefaultSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isJobSettings?: boolean; // Add prop to distinguish between job and school settings
}

export function UpdateDefaultSettingsDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  onCancel,
  isJobSettings = true
}: UpdateDefaultSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isJobSettings ? 'Update Default Settings?' : 'Save Changes to Default Settings?'}
          </DialogTitle>
          <DialogDescription>
            {isJobSettings ? (
              <>
                The interview slots for this job are different from your school&apos;s default settings. 
                Would you like to update the default settings for all future jobs with these configurations?
              </>
            ) : (
              <>
                You&apos;ve made changes to the default interview settings. 
                Would you like to save these changes as the new default for all future jobs?
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel}>
            {isJobSettings ? 'Save Job-Specific Settings Only' : 'Cancel'}
          </Button>
          <Button onClick={onConfirm}>
            {isJobSettings ? 'Update Default Settings' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}