"use client";

import React, { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { 
  FileText,
  Upload,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from '@/context/auth-context';
import { useAuthStore } from '@/store/auth-store';
import { createClient } from '@/lib/supabase/api/client';

interface CandidateInfo {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
}

interface JobInfo {
  title: string;
  id: string;
}

interface MakeOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateInfo: CandidateInfo;
  jobInfo: JobInfo;
  jobApplicationId: string;
  onOfferMade: () => void;
}

export function MakeOfferDialog({ 
  open, 
  onOpenChange,
  candidateInfo,
  jobInfo,
  jobApplicationId,
  onOfferMade
}: MakeOfferDialogProps) {
  const { user } = useAuth();
  const { schoolId: storeSchoolId } = useAuthStore();
  const [schoolId, setSchoolId] = useState<string | null>(storeSchoolId);
  const [schoolName, setSchoolName] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  
  // Set default values based on user info
  React.useEffect(() => {
    // For now, we'll use a generic approach since we don't know the exact user structure
    if (user) {
      // Assuming user might have firstName/lastName or first_name/last_name properties
      const firstName = (user as any).firstName || (user as any).first_name || '';
      const lastName = (user as any).lastName || (user as any).last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();
      setUserName(fullName || (user as any).email || "Hiring Manager");
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

  const [message, setMessage] = useState<string>(() => {
    const defaultSchoolName = schoolName || "our organization";
    const defaultUserName = userName || "Hiring Manager";
    
    return `Dear ${candidateInfo.first_name} ${candidateInfo.last_name},

We are pleased to inform you that after careful consideration, we would like to extend an offer for the position of ${jobInfo.title} at ${defaultSchoolName}.

Please find the attached offer letter for your review. If you have any questions or need clarification on any points, please don't hesitate to reach out.

We look forward to having you on our team!

Best regards,
${defaultUserName}`;
  });
  
  const [offerLetter, setOfferLetter] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Update message when schoolName or userName changes
  React.useEffect(() => {
    const updatedSchoolName = schoolName || "our organization";
    const updatedUserName = userName || "Hiring Manager";
    
    setMessage(`Dear ${candidateInfo.first_name} ${candidateInfo.last_name},

We are pleased to inform you that after careful consideration, we would like to extend an offer for the position of ${jobInfo.title} at ${updatedSchoolName}.

Please find the attached offer letter for your review. If you have any questions or need clarification on any points, please don't hesitate to reach out.

We look forward to having you on our team!

Best regards,
${updatedUserName}`);
  }, [schoolName, userName, candidateInfo.first_name, candidateInfo.last_name, jobInfo.title]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.includes('pdf') && !file.type.includes('document')) {
        setUploadError('Please upload a PDF or Word document');
        setOfferLetter(null);
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size must be less than 5MB');
        setOfferLetter(null);
        return;
      }
      
      setOfferLetter(file);
      setUploadError(null);
    }
  };

  const handleMakeOffer = async () => {
    if (!offerLetter) {
      toast.error("Please upload an offer letter");
      return;
    }

    // Use either the store schoolId or the fetched one
    const currentSchoolId = storeSchoolId || schoolId;
    
    if (!currentSchoolId) {
      toast.error("School information not available. Please try again.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const supabase = createClient();
      
      // 1. Upload the offer letter to Supabase storage
      const fileName = `offer_letters/${jobApplicationId}/${Date.now()}_${offerLetter.name}`;
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('applications')
        .upload(fileName, offerLetter, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Failed to upload offer letter: ${uploadError.message}`);
      }

      // 2. Get signed URL for 90 days
      const { data: signedUrlData, error: signedUrlError } = await supabase
        .storage
        .from('applications')
        .createSignedUrl(fileName, 90 * 24 * 60 * 60); // 90 days in seconds

      if (signedUrlError) {
        throw new Error(`Failed to create signed URL: ${signedUrlError.message}`);
      }

      const signedUrl = signedUrlData.signedUrl;

      // 3. Save record to offer_letters table
      const { data: offerLetterRecord, error: insertError } = await supabase
        .from('offer_letters')
        .insert({
          application_id: jobApplicationId,
          job_id: jobInfo.id,
          school_id: currentSchoolId,
          offer_letter_url: signedUrl,
          offer_message: message,
          created_by: user?.id
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to save offer letter record: ${insertError.message}`);
      }

      // 4. Update job application status to "offered"
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ status: 'offered' })
        .eq('id', jobApplicationId);

      if (updateError) {
        throw new Error(`Failed to update application status: ${updateError.message}`);
      }

      toast.success("Offer sent successfully!");
      onOfferMade();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error making offer:", error);
      toast.error(error.message || "Failed to send offer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Make Offer</DialogTitle>
          <DialogDescription>
            Send an offer to {candidateInfo.first_name} {candidateInfo.last_name} for the position of {jobInfo.title}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Offer Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
          </div>
          
          {/* Offer Letter Upload */}
          <div className="space-y-2">
            <Label htmlFor="offer-letter">Offer Letter</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Input
                id="offer-letter"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <label 
                htmlFor="offer-letter" 
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-700">
                    {offerLetter ? offerLetter.name : "Upload Offer Letter"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {offerLetter ? `${(offerLetter.size / 1024).toFixed(1)} KB` : "PDF, DOC, DOCX up to 5MB"}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  asChild
                >
                  <span>Browse Files</span>
                </Button>
              </label>
            </div>
            
            {uploadError && (
              <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
                <AlertCircle className="w-4 h-4" />
                <span>{uploadError}</span>
              </div>
            )}
            
            <p className="text-sm text-gray-500">
              Please upload a signed offer letter in PDF or Word format
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
            onClick={handleMakeOffer}
            disabled={isSubmitting || !offerLetter}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Sending Offer...
              </>
            ) : (
              "Send Offer"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}