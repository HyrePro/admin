"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { XIcon } from "lucide-react";

interface Job {
  id: string;
  title: string;
  status: string;
}

interface InviteCandidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (emails: string[], jobId: string) => Promise<void>;
}

export function InviteCandidateDialog({
  open,
  onOpenChange,
  onInvite,
}: InviteCandidateDialogProps) {
  const { user, session } = useAuth();
  const [emailInput, setEmailInput] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);

  // Fetch jobs with OPEN status when dialog opens
  useEffect(() => {
    if (open && user && session) {
      fetchOpenJobs();
    }
  }, [open, user, session]);

  const fetchOpenJobs = async () => {
    setJobsLoading(true);
    try {
      const response = await fetch("/api/jobs?status=OPEN&startIndex=0&endIndex=100");
      const result = await response.json();
      
      if (response.ok) {
        setJobs(result.jobs || []);
      } else {
        toast.error("Failed to load jobs", {
          description: result.error || "Please try again later",
        });
        setJobs([]);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load jobs", {
        description: "Please check your connection and try again",
      });
      setJobs([]);
    } finally {
      setJobsLoading(false);
    }
  };

  // Add emails from input when it changes
  useEffect(() => {
    if (emailInput.includes(",")) {
      const newEmails = emailInput
        .split(",")
        .map(email => email.trim())
        .filter(email => email.length > 0);
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = newEmails.filter(email => !emailRegex.test(email));
      
      if (invalidEmails.length > 0) {
        // Don't add invalid emails, but don't show error unless user tries to submit
        return;
      }
      
      // Add only unique emails that aren't already in the list
      const validNewEmails = newEmails.filter(email => 
        emailRegex.test(email) && !emails.includes(email)
      );
      
      if (validNewEmails.length > 0) {
        setEmails(prev => [...prev, ...validNewEmails]);
        setEmailInput("");
      }
    }
  }, [emailInput, emails]);

  // Remove email from list
  const removeEmail = (emailToRemove: string) => {
    setEmails(prev => prev.filter(email => email !== emailToRemove));
  };

  const handleInvite = async () => {
    if (!selectedJobId) {
      toast.error("Please select a job");
      return;
    }

    // Add any remaining email in the input field
    if (emailInput.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailInput.trim())) {
        toast.error("Invalid email address", {
          description: "Please check the email format",
        });
        return;
      }
      
      if (!emails.includes(emailInput.trim())) {
        setEmails(prev => [...prev, emailInput.trim()]);
      }
      setEmailInput("");
    }

    if (emails.length === 0) {
      toast.error("Please enter at least one email address");
      return;
    }

    setLoading(true);
    
    try {
      // Call the onInvite callback with the validated data
      await onInvite(emails, selectedJobId);
      
      // Close the dialog only after successful invitation
      onOpenChange(false);
      
      // Reset form after successful invitation
      setEmails([]);
      setSelectedJobId("");
    } catch (error) {
      console.error("Error inviting candidates:", error);
      toast.error("Failed to invite candidates", {
        description: "Please try again later",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter jobs based on search input
  const [jobSearch, setJobSearch] = useState("");
  const filteredJobs = useMemo(() => {
    if (!jobSearch) return jobs;
    return jobs.filter(job => 
      job.title.toLowerCase().includes(jobSearch.toLowerCase())
    );
  }, [jobs, jobSearch]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Candidates</DialogTitle>
          <DialogDescription>
            Enter email addresses and select a job to invite candidates.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="emails">Email Addresses</Label>
            <Textarea
              id="emails"
              placeholder="Enter email addresses separated by commas..."
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="min-h-[80px]"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Enter email addresses separated by commas. They will be automatically detected.
            </p>
          </div>
          
          {/* Email Badges */}
          {emails.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
              {emails.map((email) => (
                <Badge key={email} variant="secondary" className="flex items-center gap-1">
                  {email}
                  <button
                    type="button"
                    onClick={() => removeEmail(email)}
                    className="ml-1 rounded-full hover:bg-secondary-foreground/10"
                    disabled={loading}
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          
          <div className="grid gap-2">
            <Label htmlFor="job">Select Job</Label>
            <Select value={selectedJobId} onValueChange={setSelectedJobId} disabled={loading || jobsLoading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={jobsLoading ? "Loading jobs..." : "Select a job"} />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2 sticky top-0 bg-background z-10 border-b">
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    className="w-full p-2 border rounded text-sm"
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    disabled={loading || jobsLoading}
                  />
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredJobs.map((job) => (
                    <SelectItem key={job.id} value={job.id} disabled={loading}>
                      {job.title}
                    </SelectItem>
                  ))}
                  {filteredJobs.length === 0 && jobSearch && (
                    <div className="p-2 text-sm text-muted-foreground">No jobs found</div>
                  )}
                </div>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={loading || jobsLoading}>
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Inviting...
              </>
            ) : (
              `Invite (${emails.length})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}