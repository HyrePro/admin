"use client"

import React from "react"

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
    demoVideo: boolean
    interviewScheduling: boolean
  }
  onChange: (values: {
    assessment: boolean
    demoVideo: boolean
    interviewScheduling: boolean
  }) => void
}) {
  return (
    <>
      <RadioCard
        id="assessment"
        checked={values.assessment}
        onChange={checked => onChange({ ...values, assessment: checked })}
        title="Assessment"
        description="Enable an AI-powered subject assessment for candidates. This will test their knowledge and skills relevant to the role."
      />
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