"use client";

import React, { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

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

const subjects = [
  "Mathematics", "Science", "English", "Social Studies", "Hindi",
  "Computer Science", "Physical Education", "Art", "Music", "Other",
];

const gradeLevels = [
  "Pre-Primary",
  "Primary (1-5)",
  "Middle (6-8)",
  "Secondary (9-10)",
  "Senior Secondary (11-12)"
];

const employmentTypes = ["full-time", "part-time", "contract", "substitute"];
const experienceOptions = [
  { value: "any", label: "Any" },
  { value: "0-1", label: "0–1 years (Fresher)" },
  { value: "1-3", label: "1–3 years" },
  { value: "3-5", label: "3–5 years" },
  { value: "5-10", label: "5–10 years" },
  { value: "10+", label: "10+ years" },
];

export function EditJobDetailsDialog({ 
  job, 
  open, 
  onOpenChange,
  onSave
}: EditJobDetailsDialogProps) {
  const [title, setTitle] = useState(job?.title || "");
  const [jobType, setJobType] = useState(job?.job_type || "");
  const [mode, setMode] = useState(job?.mode || "");
  const [openings, setOpenings] = useState(job?.openings?.toString() || "");
  const [salaryRange, setSalaryRange] = useState(job?.salary_range || "");
  const [jobDescription, setJobDescription] = useState(job?.job_description || "");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(job?.subjects || []);
  const [selectedGradeLevels, setSelectedGradeLevels] = useState<string[]>(job?.grade_levels || []);
  const [otherSubjectInput, setOtherSubjectInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle subjects selection
  const handleSubjectChange = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
      if (subject === "Other") {
        setOtherSubjectInput("");
      }
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  // Handle grade level selection
  const handleGradeLevelChange = (grade: string) => {
    if (selectedGradeLevels.includes(grade)) {
      setSelectedGradeLevels(selectedGradeLevels.filter(g => g !== grade));
    } else {
      setSelectedGradeLevels([...selectedGradeLevels, grade]);
    }
  };

  const handleSave = async () => {
    if (!job?.id) {
      toast.error("Job ID is missing");
      return;
    }

    setIsLoading(true);
    
    try {
      const updatedJobData = {
        jobId: job.id,
        title,
        job_type: jobType,
        mode,
        openings: openings ? parseInt(openings) : undefined,
        salary_range: salaryRange,
        job_description: jobDescription,
        subjects: selectedSubjects,
        grade_levels: selectedGradeLevels
      };

      const response = await fetch("/api/update-job", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedJobData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update job");
      }

      // Call the onSave prop to update the UI
      onSave(result.job);
      
      toast.success("Job updated successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating job:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update job");
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize state when job prop changes
  useEffect(() => {
    if (job) {
      setTitle(job.title || "");
      setJobType(job.job_type || "");
      setMode(job.mode || "");
      setOpenings(job.openings?.toString() || "");
      setSalaryRange(job.salary_range || "");
      setJobDescription(job.job_description || "");
      setSelectedSubjects(job.subjects || []);
      setSelectedGradeLevels(job.grade_levels || []);
    }
  }, [job]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl flex flex-col"
      >
        <SheetHeader>
          <SheetTitle>Edit Job Details</SheetTitle>
          <SheetDescription>
            Make changes to the job details here. Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter job title"
              />
            </div>
            
            {/* Job Description */}
            <div className="grid gap-2">
              <Label htmlFor="jobDescription">Job Description</Label>
              <Textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Describe the job role, expectations, or any other details (optional)"
                rows={3}
              />
            </div>
            
            {/* Subjects */}
            <div className="grid gap-2">
              <Label>Subjects to Teach</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto">
                {subjects.map((subj) => (
                  <label
                    key={subj}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md border cursor-pointer ${
                      selectedSubjects.includes(subj)
                        ? "bg-blue-50 border-blue-300 text-blue-800"
                        : "hover:bg-gray-50 border-gray-200"
                    }`}
                  >
                    <Checkbox
                      checked={selectedSubjects.includes(subj)}
                      onCheckedChange={() => handleSubjectChange(subj)}
                      className="focus-visible:ring-blue-500 focus-visible:ring-1 bg-white"
                    />
                    <span className="text-sm">{subj}</span>
                  </label>
                ))}
              </div>
              
              {/* Other Subject Input Field */}
              {selectedSubjects.includes("Other") && (
                <div className="mt-3">
                  <Label htmlFor="otherSubject">
                    Please specify other subject
                  </Label>
                  <div className="mt-2">
                    <Input
                      id="otherSubject"
                      value={otherSubjectInput}
                      onChange={(e) => setOtherSubjectInput(e.target.value)}
                      placeholder="Enter the subject name"
                      className="focus-visible:ring-blue-500 focus-visible:border-blue-500 focus-visible:ring-1"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Grade Levels */}
            <div className="grid gap-2">
              <Label>Grade Levels</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {gradeLevels.map((grade) => (
                  <label
                    key={grade}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md border cursor-pointer ${
                      selectedGradeLevels.includes(grade)
                        ? "bg-blue-50 border-blue-300 text-blue-800"
                        : "hover:bg-gray-50 border-gray-200"
                    }`}
                  >
                    <Checkbox
                      checked={selectedGradeLevels.includes(grade)}
                      onCheckedChange={() => handleGradeLevelChange(grade)}
                      className="focus-visible:ring-blue-500 focus-visible:ring-1"
                    />
                    <span className="text-sm">{grade}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Job Type and Mode */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex flex-col w-full">
                <Label>Job Type</Label>
                <div className="mt-2">
                  <Select value={jobType} onValueChange={setJobType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      {employmentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col w-full">
                <Label>Work Mode</Label>
                <div className="mt-2">
                  <Select value={mode} onValueChange={setMode}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select work mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="onsite">On-site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Openings and Salary */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex flex-col w-full">
                <Label>Number of Openings</Label>
                <div className="mt-2">
                  <Input
                    type="number"
                    min="1"
                    value={openings}
                    onChange={(e) => setOpenings(e.target.value)}
                    placeholder="Enter number of openings"
                    className="focus-visible:ring-blue-500 focus-visible:border-blue-500 focus-visible:ring-1"
                  />
                </div>
              </div>
              <div className="flex flex-col w-full">
                <Label>Salary Range</Label>
                <div className="mt-2">
                  <Input
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                    placeholder="Enter salary range"
                    className="focus-visible:ring-blue-500 focus-visible:border-blue-500 focus-visible:ring-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}