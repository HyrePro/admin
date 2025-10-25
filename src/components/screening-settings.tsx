"use client"

import React, { memo, useCallback, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertTitle } from "./ui/alert"

// Memoized RadioCard component
const RadioCard = memo(({
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
}) => {
  const handleLabelClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
      return;
    }
    e.stopPropagation();
  }, []);

  const handleCheckboxChange = useCallback(() => {
    onChange(!checked);
  }, [checked, onChange]);

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
          onChange={handleCheckboxChange}
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
})
RadioCard.displayName = 'RadioCard'

// Memoized warning alert component
const WarningAlert = memo(({ message }: { message: string }) => (
  <Alert variant="warning" className="items-center gap-2 mt-2">
    <AlertTitle>{message}</AlertTitle>
  </Alert>
))
WarningAlert.displayName = 'WarningAlert'

interface ScreeningValues {
  assessment: boolean
  assessmentDifficulty: string | undefined
  numberOfQuestions: number | undefined
  minimumPassingMarks: number | undefined
  demoVideo: boolean
  demoVideoDuration: number | undefined
  demoVideoPassingScore: number | undefined
  interviewScheduling: boolean
}

export const ScreeningSettings = memo(({
  values,
  onChange,
}: {
  values: ScreeningValues
  onChange: (values: ScreeningValues) => void
}) => {
  // Memoize calculated values
  const numberOfQuestions = useMemo(() => 
    values.numberOfQuestions !== undefined ? Math.max(5, values.numberOfQuestions) : 5,
    [values.numberOfQuestions]
  )

  const minimumPassingMarks = useMemo(() => 
    (values.minimumPassingMarks !== undefined && values.minimumPassingMarks !== null) 
      ? values.minimumPassingMarks 
      : 0,
    [values.minimumPassingMarks]
  )

  const demoVideoDuration = useMemo(() => 
    Math.max(2, values.demoVideoDuration || 2),
    [values.demoVideoDuration]
  )

  const demoVideoPassingScore = useMemo(() => 
    Math.max(1, values.demoVideoPassingScore || 1),
    [values.demoVideoPassingScore]
  )

  // Memoize handlers
  const handleAssessmentChange = useCallback((checked: boolean) => {
    const newValues = { ...values, assessment: checked };
    if (checked) {
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
  }, [values, onChange])

  const handleDifficultyChange = useCallback((value: string) => {
    onChange({ ...values, assessmentDifficulty: value });
  }, [values, onChange])

  const handleQuestionsChange = useCallback((value: number[]) => {
    onChange({ ...values, numberOfQuestions: Math.max(5, value[0]) });
  }, [values, onChange])

  const handlePassingMarksChange = useCallback((value: string) => {
    onChange({ ...values, minimumPassingMarks: parseInt(value) });
  }, [values, onChange])

  const handleDemoVideoChange = useCallback((checked: boolean) => {
    const newValues = { ...values, demoVideo: checked };
    if (checked && (!values.demoVideoDuration || values.demoVideoDuration < 2)) {
      newValues.demoVideoDuration = 2;
    }
    if (checked && (!values.demoVideoPassingScore || values.demoVideoPassingScore < 1)) {
      newValues.demoVideoPassingScore = 1;
    }
    onChange(newValues);
  }, [values, onChange])

  const handleDemoVideoDurationChange = useCallback((value: number[]) => {
    onChange({ ...values, demoVideoDuration: Math.max(2, value[0]) });
  }, [values, onChange])

  const handleDemoVideoScoreChange = useCallback((value: string) => {
    onChange({ ...values, demoVideoPassingScore: parseInt(value) });
  }, [values, onChange])

  const handleInterviewChange = useCallback((checked: boolean) => {
    onChange({ ...values, interviewScheduling: checked });
  }, [values, onChange])

  // Memoize passing marks options
  const passingMarksOptions = useMemo(() => 
    [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
    []
  )

  const demoScoreOptions = useMemo(() => 
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    []
  )

  return (
    <div className="space-y-4">
      <RadioCard
        id="assessment"
        checked={values.assessment}
        onChange={handleAssessmentChange}
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
              onValueChange={handleDifficultyChange}
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
              Number of Questions: {numberOfQuestions}
            </Label>
            <Slider
              id="number-of-questions"
              min={0}
              max={30}
              step={5}
              value={[numberOfQuestions]}
              onValueChange={handleQuestionsChange}
              className="w-full"
            />
            {numberOfQuestions > 20 && (
              <WarningAlert message="Setting too many questions may increase drop-off rates — keep it concise for better completion." />
            )}
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="minimum-passing-marks" className="text-sm font-medium text-gray-700">
              Minimum Passing Marks: {minimumPassingMarks}%
            </Label>
            <Select
              value={minimumPassingMarks.toString()}
              onValueChange={handlePassingMarksChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select passing marks" />
              </SelectTrigger>
              <SelectContent>
                {passingMarksOptions.map((value) => (
                  <SelectItem key={value} value={value.toString()}>
                    {value}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {minimumPassingMarks > 70 && (
              <WarningAlert message="Setting a high passing threshold may result in more candidates failing, creating a bottleneck in your hiring process." />
            )}
          </div>
        </>
      </RadioCard>

      <RadioCard
        id="demoVideo"
        checked={values.demoVideo}
        onChange={handleDemoVideoChange}
        title="Teaching Demo Video"
        description="Require candidates to submit a short teaching demo video as part of their application."
      >
        {values.demoVideo && (
          <div className="mt-4 space-y-2">
            <Label htmlFor="demo-video-duration" className="text-sm font-medium text-gray-700">
              Video Duration: {demoVideoDuration} minutes
            </Label>
            <Slider
              id="demo-video-duration"
              min={0}
              max={10}
              step={1}
              value={[demoVideoDuration]}
              onValueChange={handleDemoVideoDurationChange}
              className="w-full"
            />
            
            <div className="mt-4 space-y-2">
              <Label htmlFor="demo-video-passing-score" className="text-sm font-medium text-gray-700">
                Passing Demo Score: {demoVideoPassingScore}/10
              </Label>
              <Select
                value={demoVideoPassingScore.toString()}
                onValueChange={handleDemoVideoScoreChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select passing score" />
                </SelectTrigger>
                <SelectContent>
                  {demoScoreOptions.map((value) => (
                    <SelectItem key={value} value={value.toString()}>
                      {value}/10
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {demoVideoPassingScore > 7 && (
                <WarningAlert message="Higher demo score can lead to candidate drop off" />
              )}
            </div>
          </div>
        )}
      </RadioCard>

      <RadioCard
        id="interviewScheduling"
        checked={values.interviewScheduling}
        onChange={handleInterviewChange}
        title="Interview Scheduling"
        description="Allow recruiters to schedule interviews after screening."
      />
    </div>
  )
})
ScreeningSettings.displayName = 'ScreeningSettings'