import ApplicationLayoutClient from "@/components/application-layout-client";
import { createClient } from "@/lib/supabase/api/server";
import type { ReactNode } from "react";

interface ApplicationLayoutProps {
  children: ReactNode;
  params: Promise<{ jobId: string; applicationId: string }>;
}

export default async function ApplicationLayout({ children, params }: ApplicationLayoutProps) {
  const { jobId, applicationId } = await params;
  const supabase = await createClient();

  let initialCandidateInfo = null;
  let initialApplicationStage = null;
  let initialAIEvaluation = null;
  let initialJobTitle: string | null = null;
  let initialError: string | null = null;

  const [applicationResult, jobResult] = await Promise.all([
    supabase.rpc("get_job_application", { p_application_id: applicationId }),
    supabase.from("jobs").select("title").eq("id", jobId).single(),
  ]);

  if (jobResult.error) {
    initialJobTitle = "Job Details";
  } else {
    initialJobTitle = jobResult.data?.title || "Job Details";
  }

  if (applicationResult.error) {
    initialError = applicationResult.error.message || "Failed to fetch application details";
  } else if (!applicationResult.data || applicationResult.data.length === 0) {
    initialError = "Application not found";
  } else {
    const applicationData = JSON.parse(JSON.stringify(applicationResult.data[0]));

    initialCandidateInfo = {
      application_id: applicationData.application_id,
      first_name: applicationData.first_name,
      last_name: applicationData.last_name,
      email: applicationData.email,
      phone: applicationData.phone,
      city: applicationData.city,
      state: applicationData.state,
      resume_url: applicationData.resume_url,
      resume_file_name: applicationData.resume_file_name,
      cover_letter: applicationData.cover_letter,
      teaching_experience: applicationData.teaching_experience,
      education_qualifications: applicationData.education_qualifications,
      subjects: applicationData.subjects,
      grade_levels: applicationData.grade_levels,
      created_at: applicationData.created_at,
    };

    initialApplicationStage = {
      application_id: applicationData.application_id,
      status: applicationData.status,
      submitted_at: applicationData.submitted_at,
      score: applicationData.score,
      category_scores: applicationData.category_scores,
      overall: applicationData.overall,
      video_url: applicationData.video_url,
      created_at: applicationData.created_at,
      updated_at: applicationData.updated_at,
      demo_score: applicationData.demo_score,
    };

    if (applicationData.status === "ai_recommendation_completed") {
      const { data: aiData } = await supabase
        .from("application_ai_evaluations")
        .select("*")
        .eq("application_id", applicationId)
        .single();
      if (aiData) {
        initialAIEvaluation = JSON.parse(JSON.stringify(aiData));
      }
    }
  }

  return (
    <ApplicationLayoutClient
      jobId={jobId}
      applicationId={applicationId}
      initialCandidateInfo={initialCandidateInfo}
      initialApplicationStage={initialApplicationStage}
      initialAIEvaluation={initialAIEvaluation}
      initialJobTitle={initialJobTitle}
      initialError={initialError}
    >
      {children}
    </ApplicationLayoutClient>
  );
}
