"use client"

import React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

function RadioCard({
  checked,
  onChange,
  title,
  description,
  id,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  title: string
  description: string
  id: string
}) {
  return (
    <label htmlFor={id} className={`flex items-center gap-4 px-4 py-3 rounded-md cursor-pointer transition-colors ${checked ? "bg-purple-50 border border-purple-300 text-purple-800" : "hover:bg-gray-50 border border-gray-200"}`}>
      <input
        type="checkbox"
        id={id}
        name={id}
        checked={checked}
        onChange={() => onChange(!checked)}
        className="accent-purple-600 w-5 h-5 shrink-0"
      />
      <div>
        <div className="text-base font-medium text-gray-900">{title}</div>
        <div className="text-xs text-muted-foreground mt-1">{description}</div>
      </div>
    </label>
  )
}

export function ScreeningSettings({
  values,
  onChange,
}: {
  values: {
    assessment: boolean
    assessmentDifficulty?: string
    numberOfQuestions?: number
    demoVideo: boolean
    interviewScheduling: boolean
  }
  onChange: (values: {
    assessment: boolean
    assessmentDifficulty?: string
    numberOfQuestions?: number
    demoVideo: boolean
    interviewScheduling: boolean
  }) => void
}) {
  return (
    <>
      <div className="space-y-3">
        <RadioCard
          id="assessment"
          checked={values.assessment}
          onChange={checked => {
            const newValues = { ...values, assessment: checked };
            if (!checked) {
              // Reset assessment settings when assessment is disabled
              newValues.assessmentDifficulty = undefined;
              newValues.numberOfQuestions = undefined;
            } else {
              // Set default values when assessment is enabled
              if (!values.assessmentDifficulty) {
                newValues.assessmentDifficulty = 'medium';
              }
              if (!values.numberOfQuestions) {
                newValues.numberOfQuestions = 10;
              }
            }
            onChange(newValues);
          }}
          title="Subject Screening Assessment"
          description="Enable an AI-powered subject assessment for candidates. This will test their knowledge and skills relevant to the role."
        />
        
        {values.assessment && (
          <div className="ml-9 space-y-2">
            <Label htmlFor="assessment-difficulty" className="text-sm font-medium text-gray-700">
              Assessment Difficulty
            </Label>
            <Select
              value={values.assessmentDifficulty || 'medium'}
              onValueChange={(value) => onChange({ ...values, assessmentDifficulty: value })}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select difficulty level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy - Basic concepts and fundamental knowledge</SelectItem>
                <SelectItem value="medium">Medium - Standard curriculum and practical application</SelectItem>
                <SelectItem value="hard">Hard - Advanced concepts and critical thinking</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="mt-4 space-y-2">
              <Label htmlFor="number-of-questions" className="text-sm font-medium text-gray-700">
                Number of Questions
              </Label>
              <Select
                value={values.numberOfQuestions?.toString() || '10'}
                onValueChange={(value) => onChange({ ...values, numberOfQuestions: parseInt(value) })}
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="Select number of questions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Questions</SelectItem>
                  <SelectItem value="10">10 Questions</SelectItem>
                  <SelectItem value="15">15 Questions</SelectItem>
                  <SelectItem value="20">20 Questions</SelectItem>
                  <SelectItem value="30">30 Questions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
      <RadioCard
        id="demoVideo"
        checked={values.demoVideo}
        onChange={checked => onChange({ ...values, demoVideo: checked })}
        title="Teaching Demo Video"
        description="Require candidates to submit a short teaching demo video as part of their application."
      />
      <RadioCard
        id="interviewScheduling"
        checked={values.interviewScheduling}
        onChange={checked => onChange({ ...values, interviewScheduling: checked })}
        title="Interview Scheduling"
        description="Allow candidates to schedule interviews directly after screening."
      />
    </>
  )
} 