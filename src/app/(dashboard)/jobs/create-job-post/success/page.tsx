'use client';
import { Suspense } from "react";
import { useSearchParams } from "next/navigation"
import JobPostSuccessMessage from "@/components/job-post-success/job-post-success-message"
import JobPostSuccessShare from "@/components/job-post-success/job-post-success-share"
import JobPostSuccessNextSteps from "@/components/job-post-success/job-post-success-next-steps"
import JobPostSuccessWhatNext from "@/components/job-post-success/job-post-success-what-next"
import JobPostSuccessActions from "@/components/job-post-success/job-post-success-actions"
import { AuthGuard } from "@/components/auth-guard"

function JobPostSuccessContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId") || "";

  return (
    <AuthGuard>
      <div className="flex flex-1 flex-col px-4">
        <div className="mx-auto w-full max-w-2xl py-8">
          <div className="space-y-8">
            <JobPostSuccessMessage />
            <JobPostSuccessShare jobId={jobId} />
            <JobPostSuccessNextSteps />
            <JobPostSuccessWhatNext />
            <JobPostSuccessActions />
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}

export default function JobPostSuccess() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JobPostSuccessContent />
    </Suspense>
  );
}