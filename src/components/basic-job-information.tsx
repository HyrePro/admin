'use client'

import React, { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Field, FormikProps } from "formik"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sparkles, Loader2 } from "@/components/icons"
import { createClient } from "@/lib/supabase/api/client"
import { toast } from "sonner"

const subjects = [
  "Mathematics", "Science", "English", "Social Studies", "Hindi",
  "Computer Science", "Physical Education", "Art", "Music", "Other",
]

const gradeLevels = [
  "Pre-Primary",
  "Primary (1-5)",
  "Middle (6-8)",
  "Secondary (9-10)",
  "Senior Secondary (11-12)"
]

const employmentTypes = ["full-time", "part-time", "contract", "substitute"]
const experienceOptions = [
  { value: "any", label: "Any" },
  { value: "0-1", label: "0–1 years (Fresher)" },
  { value: "1-3", label: "1–3 years" },
  { value: "3-5", label: "3–5 years" },
  { value: "5-10", label: "5–10 years" },
]

// Function to extract subjects from job title
const extractSubjectsFromTitle = (title: string): string[] => {
  const detectedSubjects: string[] = []
  const normalizedTitle = title.toLowerCase()
  
  subjects.forEach(subject => {
    // Skip "Other" as it's a special case
    if (subject === "Other") return
    
    // Check for exact matches and common variations
    const subjectVariations = getSubjectVariations(subject)
    
    if (subjectVariations.some(variation => 
      normalizedTitle.includes(variation.toLowerCase())
    )) {
      detectedSubjects.push(subject)
    }
  })
  
  return detectedSubjects
}

// Helper function to get common variations of subject names
const getSubjectVariations = (subject: string): string[] => {
  const variations: Record<string, string[]> = {
    "Mathematics": ["math", "maths", "mathematics", "pgt maths", "tgt maths", "math teacher"],
    "Science": ["science", "physics", "chemistry", "biology", "pgt science", "tgt science"],
    "English": ["english", "pgt english", "tgt english", "english teacher"],
    "Social Studies": ["social studies", "sst", "history", "geography", "civics", "economics"],
    "Hindi": ["hindi", "pgt hindi", "tgt hindi"],
    "Computer Science": ["computer science", "cs", "computer", "programming", "coding"],
    "Physical Education": ["physical education", "pe", "sports", "pt"],
    "Art": ["art", "drawing", "painting", "fine arts"],
    "Music": ["music", "vocal", "instrumental"]
  }
  
  return variations[subject] || [subject]
}

type FormValues = {
  jobTitle: string
  description?: string
  subjects: string[]
  otherSubject?: string
  gradeLevel: string[]
  employmentType: string
  experience: string
  salaryMin?: number
  salaryMax?: number
  numberOfOpenings?: number
}

type BasicJobInformationProps = FormikProps<FormValues>

export function BasicJobInformation(props: BasicJobInformationProps) {
  const { values, errors, touched, setFieldValue } = props
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Effect to automatically detect subjects when job title changes
  useEffect(() => {
    if (values.jobTitle && values.subjects.length === 0) {
      const detectedSubjects = extractSubjectsFromTitle(values.jobTitle)
      if (detectedSubjects.length > 0) {
        setFieldValue("subjects", detectedSubjects)
      }
    }
  }, [values.jobTitle, values.subjects.length, setFieldValue])
  
  // Function to generate job description using SQL function proxy
  const generateJobDescription = async () => {
    if (!values.jobTitle) {
      toast.error("Please enter a job title first")
      return
    }
    
    setIsGenerating(true)
    try {
      const supabase = createClient()
      
      // Get school information from user metadata
      const { data: { user } } = await supabase.auth.getUser()
      const schoolId = user?.user_metadata?.school_id
      
      // If we don't have school info, we'll still try to generate but with limited data
      let schoolName = ""
      let board = ""
      let schoolType = ""
      
      if (schoolId) {
        const { data: schoolData, error: schoolError } = await supabase
          .from('schools')
          .select('name, board, type')
          .eq('id', schoolId)
          .single()
        
        if (!schoolError && schoolData) {
          schoolName = schoolData.name || ""
          board = schoolData.board || ""
          schoolType = schoolData.type || ""
        }
      }
      
      // Prepare salary range string
      let salaryRange = ""
      if (values.salaryMin && values.salaryMax) {
        salaryRange = `₹${values.salaryMin} - ₹${values.salaryMax}`
      } else if (values.salaryMin) {
        salaryRange = `₹${values.salaryMin}+`
      } else if (values.salaryMax) {
        salaryRange = `Up to ₹${values.salaryMax}`
      }
      
      // Call the SQL function proxy
      const { data, error } = await supabase.rpc('generate_job_description_via_edge', {
        p_job_title: values.jobTitle,
        p_subjects_to_teach: values.subjects.filter(s => s !== "Other"),
        p_grade: values.gradeLevel.join(", "),
        p_employment_type: values.employmentType,
        p_experience: values.experience,
        p_board: board,
        p_school_type: schoolType,
        p_school_name: schoolName,
        p_salary_range: salaryRange,
        p_existing_job_description: values.description || ""
      })
      
      if (error) {
        console.error("Error generating job description:", error)
        toast.error("Failed to generate job description. Please try again.")
        return
      }
      
      // Extract job description from the response
      // The SQL function returns a JSONB response from the Edge Function
      const jobDescription = data?.job_description || data?.body?.job_description || data?.data?.job_description;
      
      if (jobDescription) {
        setFieldValue("description", jobDescription)
        toast.success("Job description generated successfully!")
      } else {
        toast.error("Failed to generate job description. Please try again.")
      }
    } catch (error) {
      console.error("Error generating job description:", error)
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Job Title */}
      <div>
        <Label htmlFor="jobTitle">
          Job Title
          <span className="text-red-500 ml-0.5">*</span>
        </Label>
        <div className="mt-2">
          <Field
            as={Input}
            id="jobTitle"
            name="jobTitle"
            placeholder="e.g. Mathematics Teacher"
            required
            className="focus-visible:ring-blue-500 focus-visible:border-blue-500 focus-visible:ring-1"
          />
        </div>
        {touched.jobTitle && !values.jobTitle && errors.jobTitle && (
          <div className="text-xs text-red-500 mt-1">{errors.jobTitle}</div>
        )}
      </div>
      {/* Description (optional) */}
      <div className="relative">
        <Label htmlFor="description">Description</Label>
        <div className="mt-2 relative">
          <Field
            as={Textarea}
            id="description"
            name="description"
            placeholder="Describe the job role, expectations, or any other details (optional)"
            rows={6}
            className="focus-visible:ring-blue-500 focus-visible:border-blue-500 focus-visible:ring-1 pr-10"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-2 right-2 h-8 w-8 rounded-full hover:bg-gray-100"
                  onClick={generateJobDescription}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-blue-500" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Generate job description with AI</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      {/* Subjects */}
      <div>
        <Label>
          Subjects to Teach
          <span className="text-red-500 ml-0.5">*</span>
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto">
          {subjects.map((subj) => (
            <label
              key={subj}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md border cursor-pointer ${
                (values.subjects as string[]).includes(subj)
                  ? "bg-blue-50 border-blue-300 text-blue-800"
                  : "hover:bg-gray-50 border-gray-200"
              }`}
            >
              <Checkbox
                checked={(values.subjects as string[]).includes(subj)}
                onCheckedChange={() => {
                  if ((values.subjects as string[]).includes(subj)) {
                    setFieldValue(
                      "subjects",
                      (values.subjects as string[]).filter((v) => v !== subj)
                    )
                  } else {
                    setFieldValue("subjects", [...(values.subjects as string[]), subj])
                  }
                }}
                className="focus-visible:ring-blue-500 focus-visible:ring-1 bg-white"
              />
              <span className="text-sm">{subj}</span>
            </label>
          ))}
        </div>
        {touched.subjects && Array.isArray(values.subjects) && values.subjects.length === 0 && errors.subjects && (
          <div className="text-xs text-red-500 mt-1">{errors.subjects as string}</div>
        )}
        
        {/* Other Subject Input Field */}
        {(values.subjects as string[]).includes("Other") && (
          <div className="mt-3">
            <Label htmlFor="otherSubject">
              Please specify other subject
              <span className="text-red-500 ml-0.5">*</span>
            </Label>
            <div className="mt-2">
              <Field
                as={Input}
                id="otherSubject"
                name="otherSubject"
                placeholder="Enter the subject name"
                className="focus-visible:ring-blue-500 focus-visible:border-blue-500 focus-visible:ring-1"
                value={values.otherSubject || ''}
              />
            </div>
            {touched.otherSubject && !values.otherSubject && errors.otherSubject && (
              <div className="text-xs text-red-500 mt-1">{errors.otherSubject}</div>
            )}
          </div>
        )}
      </div>
      {/* Grade Levels */}
      <div>
        <Label>
          Grade Levels
          <span className="text-red-500 ml-0.5">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {gradeLevels.map((grade) => (
            <label
              key={grade}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md border cursor-pointer ${
                (values.gradeLevel as string[]).includes(grade)
                  ? "bg-blue-50 border-blue-300 text-blue-800"
                  : "hover:bg-gray-50 border-gray-200"
              }`}
            >
              <Checkbox
                checked={(values.gradeLevel as string[]).includes(grade)}
                onCheckedChange={() => {
                  if ((values.gradeLevel as string[]).includes(grade)) {
                    setFieldValue(
                      "gradeLevel",
                      (values.gradeLevel as string[]).filter((v) => v !== grade)
                    )
                  } else {
                    setFieldValue("gradeLevel", [...(values.gradeLevel as string[]), grade])
                  }
                }}
                className="focus-visible:ring-blue-500 focus-visible:ring-1"
              />
              <span className="text-sm">{grade}</span>
            </label>
          ))}
        </div>
        {touched.gradeLevel && Array.isArray(values.gradeLevel) && values.gradeLevel.length === 0 && errors.gradeLevel && (
          <div className="text-xs text-red-500 mt-1">{errors.gradeLevel as string}</div>
        )}
      </div>
      {/* Employment & Experience */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="flex flex-col w-full">
          <Label>
            Employment Type
            <span className="text-red-500 ml-0.5">*</span>
          </Label>
          <div className="mt-2">
            <Field name="employmentType">
              {({ field }: { field: { value: string } }) => (
                <Select
                  value={field.value}
                  onValueChange={(val) => setFieldValue("employmentType", val)}
                >
                  <SelectTrigger className="w-full" >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {employmentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </Field>
          </div>
          {touched.employmentType && !values.employmentType && errors.employmentType && (
            <div className="text-xs text-red-500 mt-1">{errors.employmentType}</div>
          )}
        </div>
        <div className="flex flex-col w-full">
          <Label>Required Experience</Label>
          <div className="mt-2">
            <Field name="experience">
              {({ field }: { field: { value: string } }) => (
                <Select
                  value={field.value}
                  onValueChange={(val) => setFieldValue("experience", val)}
                >
                  <SelectTrigger className="w-full" >
                    <SelectValue placeholder="Select experience" />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </Field>
          </div>
        </div>
        <div className="flex flex-col w-full">
          <Label>Number of Openings</Label>
          <div className="mt-2">
            <Field
              as={Input}
              name="numberOfOpenings"
              type="number"
              min="1"
              placeholder="Enter number of openings"
              className="focus-visible:ring-blue-500 focus-visible:border-blue-500 focus-visible:ring-1"
            />
          </div>
          {errors.numberOfOpenings && (
            <div className="text-xs text-red-500 mt-1">{errors.numberOfOpenings}</div>
          )}
        </div>
      </div>
      {/* Salary Range */}
      <div>
        <Label>Salary Range (Annual)</Label>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <Field
              as={Input}
              name="salaryMin"
              placeholder="Min (₹)"
              type="number"
              className="focus-visible:ring-blue-500 focus-visible:border-blue-500 focus-visible:ring-1"
            />
            {errors.salaryMin && (
              <div className="text-xs text-red-500 mt-1">{errors.salaryMin}</div>
            )}
          </div>
          <div>
            <Field
              as={Input}
              name="salaryMax"
              placeholder="Max (₹)"
              type="number"
              className="focus-visible:ring-blue-500 focus-visible:border-blue-500 focus-visible:ring-1"
            />
            { errors.salaryMax && (
              <div className="text-xs text-red-500 mt-1">{errors.salaryMax}</div>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">Leave blank if you prefer not to disclose.</p>
      </div>
    </div>
  )
}