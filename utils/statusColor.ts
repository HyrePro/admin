// utils/statusColors.ts

export const statusColors: Record<string, string> = {
  in_progress: "bg-blue-500",
  application_submitted: "bg-sky-500",
  assessment_in_progress: "bg-yellow-500",
  assessment_in_evaluation: "bg-amber-500",
  assessment_evaluated: "bg-green-500",
  assessment_questionnaire_creation: "bg-cyan-500",
  assessment_ready: "bg-teal-500",
  assessment_failed: "bg-red-500",

  demo_creation: "bg-cyan-400",
  demo_ready: "bg-teal-400",
  demo_in_progress: "bg-yellow-400",
  demo_in_evaluation: "bg-amber-400",
  demo_evaluated: "bg-green-400",
  demo_failed: "bg-red-400",

  interview_in_progress: "bg-indigo-500",
  interview_ready: "bg-blue-600",
  interview_scheduled: "bg-green-500",

  paused: "bg-gray-400",
  completed: "bg-green-600",
  suspended: "bg-zinc-500",
  appealed: "bg-purple-500",
  withdrawn: "bg-gray-500",
  offered: "bg-violet-500",
  rejected: "bg-red-600",

  // NEW STATUSES
  interview_rescheduled: "bg-orange-500",
  interview_completed: "bg-emerald-600",

  panelist_form_in_progress: "bg-yellow-300",
  panelist_review_in_progress: "bg-amber-300",
  panelist_review_completed: "bg-green-300",

  ai_evaluation_in_progress: "bg-blue-400",
  ai_recommendation_generated: "bg-indigo-400",
  ai_recommendation_completed: "bg-green-700",

  hired: "bg-emerald-700",
  hold: "bg-amber-700",
};
