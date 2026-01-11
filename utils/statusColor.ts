// utils/statusColors.ts

export const statusColors: Record<string, string> = {
  // Application stages
  in_progress: "bg-blue-50 text-blue-700",
  application_submitted: "bg-sky-50 text-sky-700",
  
  // Assessment stages
  assessment_in_progress: "bg-yellow-50 text-yellow-700",
  assessment_in_evaluation: "bg-amber-50 text-amber-700",
  assessment_evaluated: "bg-green-50 text-green-700",
  assessment_questionnaire_creation: "bg-cyan-50 text-cyan-700",
  assessment_ready: "bg-teal-50 text-teal-700",
  assessment_failed: "bg-red-50 text-red-700",
  
  // Demo stages
  demo_creation: "bg-cyan-50 text-cyan-700",
  demo_ready: "bg-teal-50 text-teal-700",
  demo_in_progress: "bg-yellow-50 text-yellow-700",
  demo_in_evaluation: "bg-amber-50 text-amber-700",
  demo_evaluated: "bg-green-50 text-green-700",
  demo_failed: "bg-red-50 text-red-700",
  
  // Interview stages
  interview_in_progress: "bg-indigo-50 text-indigo-700",
  interview_ready: "bg-blue-50 text-blue-700",
  interview_scheduled: "bg-green-50 text-green-700",
  interview_rescheduled: "bg-orange-50 text-orange-700",
  interview_completed: "bg-emerald-50 text-emerald-700",
  
  // Panelist review stages
  panelist_form_in_progress: "bg-yellow-50 text-yellow-700",
  panelist_review_in_progress: "bg-amber-50 text-amber-700",
  panelist_review_completed: "bg-green-50 text-green-700",
  
  // AI evaluation stages
  ai_evaluation_in_progress: "bg-blue-50 text-blue-700",
  ai_recommendation_generated: "bg-indigo-50 text-indigo-700",
  ai_recommendation_completed: "bg-green-50 text-green-700",
  
  // Final stages
  paused: "bg-gray-50 text-gray-700",
  completed: "bg-green-50 text-green-700",
  suspended: "bg-zinc-50 text-zinc-700",
  appealed: "bg-purple-50 text-purple-700",
  withdrawn: "bg-gray-50 text-gray-700",
  offered: "bg-violet-50 text-violet-700",
  rejected: "bg-red-50 text-red-700",
  hired: "bg-emerald-50 text-emerald-700",
  hold: "bg-amber-50 text-amber-700",
};

// Status dot colors for use in badges
export const statusDotColors: Record<string, string> = {
  // Application stages
  in_progress: "#3b82f6",
  application_submitted: "#0ea5e9",
  
  // Assessment stages
  assessment_in_progress: "#eab308",
  assessment_in_evaluation: "#f59e0b",
  assessment_evaluated: "#22c55e",
  assessment_questionnaire_creation: "#06b6d4",
  assessment_ready: "#14b8a6",
  assessment_failed: "#ef4444",
  
  // Demo stages
  demo_creation: "#06b6d4",
  demo_ready: "#14b8a6",
  demo_in_progress: "#eab308",
  demo_in_evaluation: "#f59e0b",
  demo_evaluated: "#22c55e",
  demo_failed: "#ef4444",
  
  // Interview stages
  interview_in_progress: "#6366f1",
  interview_ready: "#3b82f6",
  interview_scheduled: "#22c55e",
  interview_rescheduled: "#f97316",
  interview_completed: "#10b981",
  
  // Panelist review stages
  panelist_form_in_progress: "#eab308",
  panelist_review_in_progress: "#f59e0b",
  panelist_review_completed: "#22c55e",
  
  // AI evaluation stages
  ai_evaluation_in_progress: "#3b82f6",
  ai_recommendation_generated: "#6366f1",
  ai_recommendation_completed: "#22c55e",
  
  // Final stages
  paused: "#6b7280",
  completed: "#22c55e",
  suspended: "#71717a",
  appealed: "#a855f7",
  withdrawn: "#6b7280",
  offered: "#8b5cf6",
  rejected: "#ef4444",
  hired: "#10b981",
  hold: "#f59e0b",
};

// Helper function to get status badge classes
export function getStatusBadgeClasses(status: string): string {
  return statusColors[status] || "bg-gray-50 text-gray-700";
}

// Helper function to get status dot color
export function getStatusDotColor(status: string): string {
  return statusDotColors[status] || "#6b7280";
}