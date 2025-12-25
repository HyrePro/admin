// types/hiring-funnel.ts
export type FunnelStages = {
  applications_submitted: number
  assessment_started: number
  assessment_passed: number
  assessment_failed: number
  demo_submitted: number
  demo_passed: number
  demo_failed: number
  interview_scheduled: number
  interview_completed: number
  offers_extended: number
  hired: number
  rejected: number
  suspended: number
  appealed: number
}

export type ConversionRates = {
  application_to_assessment: number
  assessment_pass_rate: number
  demo_submission_rate: number
  demo_pass_rate: number
  interview_conversion: number
  offer_rate: number
  hire_rate: number
}

export type FunnelResponse = {
  total_applicants: number
  stages: FunnelStages
  conversion_rates: ConversionRates
}
