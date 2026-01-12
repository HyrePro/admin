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
import { toast } from "sonner"
import { useAIJobDescription } from "@/hooks/useAIJobDescription"
import { createClient } from "@/lib/supabase/api/client"

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

// Helper function to extract numeric grade from grade level format
const extractNumericGrade = (gradeLevels: string[]): string => {
  if (gradeLevels.length === 0) return ""
  
  // For each grade level, try to extract the number(s) from parentheses
  const grade = gradeLevels[0]
  
  // Handle special case for Pre-Primary
  if (grade === "Pre-Primary") {
    return "Pre-Primary"
  }
  
  // If it's a range like "Secondary (9-10)", extract the last number
  const match = grade.match(/\((\d+)(?:-(\d+))?\)/)
  if (match) {
    // If it's a range, return the higher number (e.g., "10" from "Secondary (9-10)")
    return match[2] || match[1]
  }
  
  // If no parentheses, try to extract any numbers
  const numberMatch = grade.match(/\d+/)
  return numberMatch ? numberMatch[0] : grade
}

type FormValues = {
  jobTitle: string
  description?: string
  subjects: string[]
  otherSubject?: string
  gradeLevel: string[]
  employmentType: string
  experience: string
  salaryRange?: string
  hiringUrgency?: string
  numberOfOpenings?: number
}

type BasicJobInformationProps = FormikProps<FormValues>

export function BasicJobInformation(props: BasicJobInformationProps) {
  const { values, errors, touched, setFieldValue } = props
  const [isGenerating, setIsGenerating] = useState(false)
  const [schoolInfo, setSchoolInfo] = useState({
    schoolName: "",
    board: "",
    schoolType: ""
  })
  const [isSchoolInfoFetched, setIsSchoolInfoFetched] = useState(false)

  // Use the new AI job description hook
  const { generateJobDescription: generateAIJobDescription, loading: aiLoading, error: aiError } = useAIJobDescription()

  // Function to fetch school information only once
  const fetchSchoolInformation = async () => {
    if (isSchoolInfoFetched) {
      // Return early if school info has already been fetched
      return schoolInfo
    }
    
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    
    let schoolName = ""
    let board = ""
    let schoolType = ""
    
    if (userId) {
      const { data: userInfo, error: userError } = await supabase
        .from('admin_user_info')
        .select('school_id')
        .eq('id', userId)
        .single()
      
      if (userError) {
        console.error('Error fetching user info:', userError)
      }
      
      if (userInfo?.school_id) {
        // Then get the school information
        const { data: schoolData, error: schoolError } = await supabase
          .from('school_info')
          .select('*')
          .eq('id', userInfo.school_id)
          .single()
        
        if (schoolError) {
          console.error('Error fetching school info:', schoolError)
        }
        
        if (schoolData) {
          schoolName = schoolData.name || ""
          board = schoolData.board || ""
          schoolType = schoolData.school_type || ""
        } else {
          console.log('Missing school data')
        }
      }
    } else {
      console.log('user is missing', userId)
    }
    
    // Update state with fetched school information
    const newSchoolInfo = { schoolName, board, schoolType }
    setSchoolInfo(newSchoolInfo)
    setIsSchoolInfoFetched(true)
    
    return newSchoolInfo
  }

  // Effect to automatically detect subjects when job title changes
  useEffect(() => {
    if (values.jobTitle && values.subjects.length === 0) {
      const detectedSubjects = extractSubjectsFromTitle(values.jobTitle)
      if (detectedSubjects.length > 0) {
        setFieldValue("subjects", detectedSubjects)
      }
    }
  }, [values.jobTitle, values.subjects.length, setFieldValue])

  // Function to generate job description using the new hook
  const generateJobDescription = async () => {
    if (!values.jobTitle) {
      toast.error("Please enter a job title first")
      return
    }

    setIsGenerating(true)

    try {
      // Fetch school information (will only fetch once)
      const schoolInfoData = await fetchSchoolInformation()
      const { schoolName, board, schoolType } = schoolInfoData
      // Prepare salary range string
      let salaryRange = ""
      if (values.salaryRange) {
        switch(values.salaryRange) {
          case "not-disclosed":
            salaryRange = "Not disclosed"
            break
          case "2-3-lakhs":
            salaryRange = "₹2-3 lakhs"
            break
          case "3-4-lakhs":
            salaryRange = "₹3-4 lakhs"
            break
          case "4-5-lakhs":
            salaryRange = "₹4-5 lakhs"
            break
          case "5-7-lakhs":
            salaryRange = "₹5-7 lakhs"
            break
          case "7-10-lakhs":
            salaryRange = "₹7-10 lakhs"
            break
          case "above-10-lakhs":
            salaryRange = "Above ₹10 lakhs"
            break
          default:
            salaryRange = "Not disclosed"
        }
      }

      // Validate required fields before proceeding
      if (!values.jobTitle) {
        toast.error("Job title is required to generate AI job description.")
        setIsGenerating(false)
        return
      }
      
      const filteredSubjects = values.subjects.filter(s => s !== "Other")
      if (filteredSubjects.length === 0 && !values.otherSubject) {
        toast.error("At least one subject is required to generate AI job description.")
        setIsGenerating(false)
        return
      }
      
      const extractedGrade = extractNumericGrade(values.gradeLevel)
      if (!extractedGrade) {
        toast.error("Grade level is required to generate AI job description.")
        setIsGenerating(false)
        return
      }
      
      if (!values.employmentType) {
        toast.error("Employment type is required to generate AI job description.")
        setIsGenerating(false)
        return
      }
      
      if (!values.experience) {
        toast.error("Experience requirement is required to generate AI job description.")
        setIsGenerating(false)
        return
      }
      
      if (!schoolInfoData.board || !schoolInfoData.schoolType || !schoolInfoData.schoolName) {
        console.log(schoolInfoData.board, schoolInfoData.schoolName, schoolInfoData.schoolType)
        toast.error("School information is required to generate AI job description. Please ensure your school profile is complete.")
        setIsGenerating(false)
        return
      }
      
      // Prepare the payload for the AI job description
      const payload = {
        job_title: values.jobTitle,
        subjects_to_teach: filteredSubjects,
        grade: extractedGrade,
        employment_type: values.employmentType.charAt(0).toUpperCase() + values.employmentType.slice(1), // Capitalize first letter
        experience: values.experience === 'any' ? 'Any' : values.experience + ' years', // Format like '1-3 years'
        board,
        school_type: schoolType,
        school_name: schoolName,
        salary_range: salaryRange,
        existing_job_description: values.description || ""
      }

      // Call the AI job description function
      const result = await generateAIJobDescription(payload)

      if (result) {
        // Format the job description from the structured response
        const formattedDescription = `
${result.role_summary}

Key Responsibilities:
${result.key_responsibilities.map(item => `- ${item}`).join('\n')}

Required Qualifications:
${result.required_qualifications.map(item => `- ${item}`).join('\n')}

${result.preferred_qualifications.length > 0 ? `Preferred Qualifications:\n${result.preferred_qualifications.map(item => `- ${item}`).join('\n')}` : ''}

Experience Requirements:
${result.experience_requirements}

Employment Details:
${result.employment_details}

${result.salary_information ? `Salary Information:\n${result.salary_information}` : ''}

${result.application_notes ? `Application Notes:\n${result.application_notes}` : ''}
        `.trim()

        setFieldValue("description", formattedDescription)
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

  // Show AI error as toast if there's an error from the hook
  useEffect(() => {
    if (aiError) {
      toast.error(aiError)
    }
  }, [aiError])

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
                  disabled={isGenerating || aiLoading}
                >
                  {isGenerating || aiLoading ? (
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
              className={`flex items-center space-x-2 px-3 py-2 rounded-md border cursor-pointer ${(values.subjects as string[]).includes(subj)
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
              className={`flex items-center space-x-2 px-3 py-2 rounded-md border cursor-pointer ${(values.gradeLevel as string[]).includes(grade)
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
      {/* Salary Range and Hiring Urgency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Salary Range (Annual)</Label>
          <div className="mt-2">
            <Field name="salaryRange">
              {({ field }: { field: { value: string } }) => (
                <Select
                  value={field.value}
                  onValueChange={(val) => setFieldValue("salaryRange", val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select salary range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not-disclosed">Not disclosed</SelectItem>
                    <SelectItem value="2-3-lakhs">Between 2-3 lakhs</SelectItem>
                    <SelectItem value="3-4-lakhs">Between 3-4 lakhs</SelectItem>
                    <SelectItem value="4-5-lakhs">Between 4-5 lakhs</SelectItem>
                    <SelectItem value="5-7-lakhs">Between 5-7 lakhs</SelectItem>
                    <SelectItem value="7-10-lakhs">Between 7-10 lakhs</SelectItem>
                    <SelectItem value="above-10-lakhs">Above 10 lakhs</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </Field>
          </div>
        </div>
        
        <div>
          <Label>Hiring Urgency</Label>
          <div className="mt-2">
            <Field name="hiringUrgency">
              {({ field }: { field: { value: string } }) => (
                <Select
                  value={field.value}
                  onValueChange={(val) => setFieldValue("hiringUrgency", val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select hiring urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediately">Immediately</SelectItem>
                    <SelectItem value="within-1-week">Within 1 week</SelectItem>
                    <SelectItem value="within-2-weeks">Within 2 weeks</SelectItem>
                    <SelectItem value="next-month">Next month</SelectItem>
                    <SelectItem value="next-academic-year">Next academic year</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </Field>
          </div>
        </div>
      </div>
    </div>
  )
}