'use client'

import React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Field, FormikProps } from "formik"
import { Textarea } from "@/components/ui/textarea"

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
  { value: "10+", label: "10+ years" },
]


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
}

type BasicJobInformationProps = FormikProps<FormValues>

export function BasicJobInformation(props: BasicJobInformationProps) {
  const { values, errors, touched, setFieldValue } = props
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
      <div>
        <Label htmlFor="description">Description</Label>
        <div className="mt-2">
          <Field
            as={Textarea}
            id="description"
            name="description"
            placeholder="Describe the job role, expectations, or any other details (optional)"
            rows={3}
            className="focus-visible:ring-blue-500 focus-visible:border-blue-500 focus-visible:ring-1"
          />
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
      <div className="grid md:grid-cols-2 gap-4">
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
            {touched.salaryMin && errors.salaryMin && (
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
            {errors.salaryMax && (
              <div className="text-xs text-red-500 mt-1">{errors.salaryMax}</div>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">Leave blank if you prefer not to disclose.</p>
      </div>
    </div>
  )
}