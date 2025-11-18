"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from '@/lib/supabase/api/client';
import { useAuth } from '@/context/auth-context';
import { useAuthStore } from '@/store/auth-store';
import { User } from '@supabase/supabase-js';

interface CandidateInfo {
  first_name: string;
  last_name: string;
  email: string;
}

interface JobInfo {
  title: string;
}

interface RejectCandidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateInfo: CandidateInfo;
  jobInfo: JobInfo;
  jobApplicationId: string;
  onReject: () => void;
}

interface UserInfo {
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface ExtendedUser extends User {
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
}

export function RejectCandidateDialog({ 
  open, 
  onOpenChange,
  candidateInfo,
  jobInfo,
  jobApplicationId,
  onReject
}: RejectCandidateDialogProps) {
  const { user } = useAuth();
  const { schoolId: storeSchoolId } = useAuthStore();
  const [schoolId, setSchoolId] = useState<string | null>(storeSchoolId);
  const [schoolName, setSchoolName] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default values based on user info
  useEffect(() => {
    // For now, we'll use a generic approach since we don't know the exact user structure
    if (user) {
      // Extract user info from user metadata or user object
      const typedUser = user as ExtendedUser;
      const userInfo: UserInfo = {
        first_name: user.user_metadata?.first_name || typedUser.firstName || typedUser.first_name || '',
        last_name: user.user_metadata?.last_name || typedUser.lastName || typedUser.last_name || '',
        email: user.email || ''
      };
      
      const firstName = userInfo.first_name || '';
      const lastName = userInfo.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();
      setUserName(fullName || userInfo.email || "Hiring Manager");
    }
    
    // Fetch schoolId if not available in store
    const fetchSchoolId = async () => {
      if (!storeSchoolId && user?.id) {
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from('admin_user_info')
            .select('school_id')
            .eq('id', user.id)
            .single();
          
          if (!error && data?.school_id) {
            setSchoolId(data.school_id);
            // Update the store as well
            useAuthStore.getState().setSchoolId(data.school_id);
          }
        } catch (error) {
          console.error("Error fetching school ID:", error);
        }
      }
    };
    
    // Fetch school name if schoolId is available
    const fetchSchoolName = async () => {
      // Use either the store schoolId or the fetched one
      const currentSchoolId = storeSchoolId || schoolId;
      
      if (currentSchoolId) {
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from('school_info')
            .select('name')
            .eq('id', currentSchoolId)
            .single();
          
          if (!error && data) {
            setSchoolName(data.name);
          }
        } catch (error) {
          console.error("Error fetching school name:", error);
        }
      }
    };
    
    fetchSchoolId();
    fetchSchoolName();
  }, [user, storeSchoolId, schoolId]);

  // Set default rejection message
  useEffect(() => {
    const defaultSchoolName = schoolName || "our organization";
    const defaultUserName = userName || "Hiring Manager";
    
    const defaultMessage = `Hi ${candidateInfo.first_name} ${candidateInfo.last_name},

Thank you for applying to the ${jobInfo.title} role at ${defaultSchoolName}. Unfortunately, we have decided not to proceed with your candidacy at this stage. We appreciate the effort behind your application, and understand that news like this is always disappointing, no matter where you are in the job search process. 

Thanks again for your interest in ${defaultSchoolName} and we wish you luck in your search.

Regards,
${defaultUserName},
${defaultSchoolName}`;

    setReason(defaultMessage);
  }, [candidateInfo.first_name, candidateInfo.last_name, jobInfo.title, schoolName, userName]);

  const handleReject = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const supabase = createClient();
      
      // 1. Insert the rejection message into the application_rejection table
      const { error: insertError } = await supabase
        .from('application_rejection')
        .insert({
          message: reason,
          application_id: jobApplicationId
        });

      if (insertError) {
        throw new Error(`Failed to save rejection message: ${insertError.message}`);
      }

      // 2. Update job application status to "rejected"
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ 
          status: 'rejected'
        })
        .eq('id', jobApplicationId);

      if (updateError) {
        throw new Error(`Failed to update application status: ${updateError.message}`);
      }

      toast.success("Candidate rejected successfully");
      onReject();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error("Error rejecting candidate:", error as unknown as Error);
      toast.error((error as Error | undefined)?.message || "Failed to reject candidate. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Reject Candidate</DialogTitle>
          <DialogDescription>
            Confirm rejection of {candidateInfo.first_name} {candidateInfo.last_name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          
          
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason for Rejection <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for rejecting this candidate..."
              rows={8}
              className="resize-none font-mono text-sm"
            />
            <p className="text-sm text-gray-500">
              This reason will be shared with the candidate in the rejection mail.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={handleReject}
            disabled={isSubmitting || !reason.trim()}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Rejecting...
              </>
            ) : (
              "Confirm Rejection"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}