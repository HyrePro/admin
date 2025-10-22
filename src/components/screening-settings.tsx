"use client"

import React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { AlertTriangle } from "lucide-react"

function RadioCard({
  checked,
  onChange,
  title,
  description,
  id,
  children,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  title: string
  description: string
  id: string
  children?: React.ReactNode
}) {
  // Prevent label click from affecting the checkbox when clicking on interactive elements
  const handleLabelClick = (e: React.MouseEvent) => {
    // Don't prevent default for the checkbox itself
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
      return;
    }
    // For all other elements inside the label, stop propagation
    e.stopPropagation();
  };

  return (
    <div className={`flex flex-col gap-4 px-4 py-3 rounded-md cursor-pointer transition-colors ${checked ? "border border-blue-300 text-blue-800" : "hover:bg-gray-50 border border-gray-200"}`}>
      <label
        htmlFor={id}
        className="flex items-center gap-4"
        onClick={handleLabelClick}
      >
        <input
          type="checkbox"
          id={id}
          name={id}
          checked={checked}
          onChange={() => onChange(!checked)}
          className="accent-blue-600 w-5 h-5 shrink-0"
        />
        <div>
          <div className="text-base font-medium text-gray-900">{title}</div>
          <div className="text-xs text-muted-foreground mt-1">{description}</div>
        </div>
      </label>
      {checked && children && (
        <div className="pl-9 space-y-2">
          {children}
        </div>
      )}
    </div>
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
    minimumPassingMarks?: number
    demoVideo: boolean
    demoVideoDuration?: number
    interviewScheduling: boolean
  }
  onChange: (values: {
    assessment: boolean
    assessmentDifficulty?: string
    numberOfQuestions?: number
    minimumPassingMarks?: number
    demoVideo: boolean
    demoVideoDuration?: number
    interviewScheduling: boolean
  }) => void
}) {
  const handleSliderChange = (value: number[]) => {
    onChange({ ...values, numberOfQuestions: value[0] });
  };

  return (
    <div className="space-y-4">
      <RadioCard
        id="assessment"
        checked={values.assessment}
        onChange={checked => {
          const newValues = { ...values, assessment: checked };
          if (!checked) {
            // Don't reset assessment settings when assessment is disabled
            // Just disable the feature but keep the values
          } else {
            // Set default values only when assessment is enabled and no values exist
            if (!values.assessmentDifficulty) {
              newValues.assessmentDifficulty = 'medium';
            }
            if (!values.numberOfQuestions) {
              newValues.numberOfQuestions = 5;
            }
            if (values.minimumPassingMarks === undefined || values.minimumPassingMarks === null) {
              newValues.minimumPassingMarks = 0;
            }
          }
          onChange(newValues);
        }}
        title="Subject Screening Assessment"
        description="Enable an AI-powered subject assessment for candidates. This will test their knowledge and skills relevant to the role."
      >
        <>
          <div className="space-y-2 flex flex-col w-full">
            <Label htmlFor="assessment-difficulty" className="text-sm font-medium text-gray-700">
              Assessment Difficulty
            </Label>
            <Select
              value={values.assessmentDifficulty || 'medium'}
              onValueChange={(value) => onChange({ ...values, assessmentDifficulty: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select difficulty level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy - Basic concepts and fundamental knowledge</SelectItem>
                <SelectItem value="medium">Medium - Standard curriculum and practical application</SelectItem>
                <SelectItem value="hard">Hard - Advanced concepts and critical thinking</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="number-of-questions" className="text-sm font-medium text-gray-700">
              Number of Questions: {values.numberOfQuestions !== undefined ? Math.max(5, values.numberOfQuestions) : 5}
            </Label>
            <Slider
              id="number-of-questions"
              min={0}
              max={30}
              step={5}
              value={[values.numberOfQuestions !== undefined ? values.numberOfQuestions : 5]}
              onValueChange={(value) => onChange({ ...values, numberOfQuestions: Math.max(5, value[0]) })}
              className="w-full"
            />
            {values.numberOfQuestions !== undefined && Math.max(5, values.numberOfQuestions) > 20 && (
              <Alert variant="warning" className="items-center gap-2 mt-2">
                <AlertTitle>
                  Setting too many questions may increase drop-off rates — keep it concise for better completion.
                </AlertTitle>
              </Alert>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="minimum-passing-marks" className="text-sm font-medium text-gray-700">
              Minimum Passing Marks: {(values.minimumPassingMarks !== undefined && values.minimumPassingMarks !== null) ? values.minimumPassingMarks : 0}%
            </Label>
            <Select
              value={((values.minimumPassingMarks !== undefined && values.minimumPassingMarks !== null) ? values.minimumPassingMarks : 0).toString()}
              onValueChange={(value) => onChange({ ...values, minimumPassingMarks: parseInt(value) })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select passing marks" />
              </SelectTrigger>
              <SelectContent>
                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((value) => (
                  <SelectItem key={value} value={value.toString()}>
                    {value}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(values.minimumPassingMarks !== undefined && values.minimumPassingMarks !== null) && values.minimumPassingMarks > 70 && (
              <Alert variant="warning" className="items-center gap-2 mt-2">
                <AlertTitle>
                  Setting a high passing threshold may result in more candidates failing, creating a bottleneck in your hiring process.
                </AlertTitle>
              </Alert>
            )}
          </div>
        </>
      </RadioCard>

      <RadioCard
        id="demoVideo"
        checked={values.demoVideo}
        onChange={checked => {
          const newValues = { ...values, demoVideo: checked };
          // Set default duration to 2 when demo video is enabled and no duration is set
          if (checked && (!values.demoVideoDuration || values.demoVideoDuration < 2)) {
            newValues.demoVideoDuration = 2;
          }
          // Don't reset duration when demo video is disabled, just keep the value
          onChange(newValues);
        }}
        title="Teaching Demo Video"
        description="Require candidates to submit a short teaching demo video as part of their application."
      >
        {values.demoVideo && (
          <div className="mt-4 space-y-2">
            <Label htmlFor="demo-video-duration" className="text-sm font-medium text-gray-700">
              Video Duration: {values.demoVideoDuration !== undefined ? Math.max(2, values.demoVideoDuration) : 2} minutes
            </Label>
            <Slider
              id="demo-video-duration"
              min={0}
              max={10}
              step={1}
              value={[values.demoVideoDuration !== undefined ? values.demoVideoDuration : 2]}
              onValueChange={(value) => onChange({ ...values, demoVideoDuration: Math.max(2, value[0]) })}
              className="w-full"
            />
          </div>
        )}
      </RadioCard>

      <RadioCard
        id="interviewScheduling"
        checked={values.interviewScheduling}
        onChange={checked => onChange({ ...values, interviewScheduling: checked })}
        title="Interview Scheduling"
        description="Allow recruiters to schedule interviews after screening."
      />
    </div>
  )
}