import JobLayoutClient from "@/components/job-layout-client";
import { createClient } from "@/lib/supabase/api/server";
import type { ReactNode } from "react";

interface JobLayoutProps {
  children: ReactNode;
  params: Promise<{ jobId: string }>;
}

export default async function JobLayout({ children, params }: JobLayoutProps) {
  const { jobId } = await params;
  const supabase = await createClient();

  let initialJob = null;
  let initialError: string | null = null;

  const { data, error } = await supabase.rpc("get_job_with_analytics", {
    p_job_id: jobId,
  });

  if (error) {
    initialError = error.message || "Failed to fetch job details";
  } else if (!data || data.length === 0) {
    initialError = "Job not found";
  } else {
    initialJob = JSON.parse(JSON.stringify(data[0]));
  }

  return (
    <JobLayoutClient jobId={jobId} initialJob={initialJob} initialError={initialError}>
      {children}
    </JobLayoutClient>
  );
}
