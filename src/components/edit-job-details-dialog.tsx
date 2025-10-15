"use client";

import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// Define the Job type locally since we can't import it from the page component
type Job = {
  id: string;
  title: string;
  status: string;
  subjects: string[];
  grade_levels: string[];
  job_type?: string;
  location?: string;
  mode?: string;
  board?: string;
  openings?: number;
  salary_range?: string;
  job_description?: string;
  responsibilities?: string;
  requirements?: string;
  created_at?: string;
  school_id?: string;
  number_of_questions?: number;
  assessment_difficulty?: {
    interviewFormat?: string;
    includeInterview?: boolean;
    demoVideoDuration?: number;
    interviewDuration?: number;
    includeSubjectTest?: boolean;
    subjectTestDuration?: number;
    interviewQuestions?: Array<{
      id: number;
      question: string;
    }>;
  };
  application_analytics: {
    total_applications: number;
    assessment: number;
    demo: number;
    interviews: number;
    offered: number;
  };
};

interface EditJobDetailsDialogProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedJob: Partial<Job>) => void;
}

export function EditJobDetailsDialog({ 
  job, 
  open, 
  onOpenChange,
  onSave
}: EditJobDetailsDialogProps) {
  const [title, setTitle] = useState(job?.title || "");
  const [jobType, setJobType] = useState(job?.job_type || "");
  const [location, setLocation] = useState(job?.location || "");
  const [mode, setMode] = useState(job?.mode || "");
  const [board, setBoard] = useState(job?.board || "");
  const [openings, setOpenings] = useState(job?.openings?.toString() || "");
  const [salaryRange, setSalaryRange] = useState(job?.salary_range || "");
  const [description, setDescription] = useState(job?.job_description || "");
  const [responsibilities, setResponsibilities] = useState(job?.responsibilities || "");
  const [requirements, setRequirements] = useState(job?.requirements || "");

  const handleSave = () => {
    const updatedJob: Partial<Job> = {
      title,
      job_type: jobType,
      location,
      mode,
      board,
      openings: openings ? parseInt(openings) : undefined,
      salary_range: salaryRange,
      job_description: description,
      responsibilities,
      requirements
    };
    
    onSave(updatedJob);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Edit Job Details</SheetTitle>
          <SheetDescription>
            Make changes to the job details here. Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        
        <div className="grid gap-4 p-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Job Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter job title"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="jobType">Job Type</Label>
            <Select value={jobType} onValueChange={setJobType}>
              <SelectTrigger>
                <SelectValue placeholder="Select job type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full-time">Full Time</SelectItem>
                <SelectItem value="part-time">Part Time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter job location"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="mode">Work Mode</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger>
                <SelectValue placeholder="Select work mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="onsite">On-site</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="board">Board</Label>
            <Input
              id="board"
              value={board}
              onChange={(e) => setBoard(e.target.value)}
              placeholder="Enter board name"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="openings">Openings</Label>
            <Input
              id="openings"
              type="number"
              value={openings}
              onChange={(e) => setOpenings(e.target.value)}
              placeholder="Enter number of openings"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="salaryRange">Salary Range</Label>
            <Input
              id="salaryRange"
              value={salaryRange}
              onChange={(e) => setSalaryRange(e.target.value)}
              placeholder="Enter salary range"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Job Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter job description"
              rows={4}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="responsibilities">Responsibilities</Label>
            <Textarea
              id="responsibilities"
              value={responsibilities}
              onChange={(e) => setResponsibilities(e.target.value)}
              placeholder="Enter job responsibilities"
              rows={4}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="requirements">Requirements</Label>
            <Textarea
              id="requirements"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Enter job requirements"
              rows={4}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}