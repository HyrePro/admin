export function eventToPlainLabel(eventName: string): string {
  const key = eventName.trim().toLowerCase();

  switch (key) {
    case "form_submit_success":
      return "Application submitted successfully";
    case "next_step_resolved":
      return "Reached the MCQ assessment step";
    case "redirect_success":
      return "Moved to the next step";
    case "form_submit_failed":
      return "Could not submit application";
    case "redirect_failed":
      return "Could not move to next step";
    case "route_guard_blocked":
      return "Access blocked before MCQ assessment";
    case "screen_view":
      return "Viewed a page";
    case "screen_exit":
      return "Exited a page";
    default:
      return eventName || "Unknown event";
  }
}

export function stageToPlainLabel(stageLabel: string): string {
  const key = stageLabel.trim().toLowerCase();

  if (key.includes("form submit")) return "Submitted application";
  if (key.includes("next step")) return "Reached MCQ assessment step";
  if (key.includes("dropped")) return "Dropped before MCQ assessment";

  return stageLabel;
}

export function issueToPlainLabel(issueType: string): string {
  const key = issueType.trim().toLowerCase();

  if (!key || key === "-") return "-";

  switch (key) {
    case "form_submit_failed":
      return "Form submission failed";
    case "redirect_failed":
      return "Could not continue to next step";
    case "route_guard_blocked":
      return "Blocked before MCQ assessment";
    default:
      return issueType;
  }
}
