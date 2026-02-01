'use client';
import { Suspense } from "react";
import { useSearchParams } from "next/navigation"
import JobPostSuccessMessage from "@/components/job-post-success/job-post-success-message"
import JobPostSuccessShare from "@/components/job-post-success/job-post-success-share"
import JobPostSuccessNextSteps from "@/components/job-post-success/job-post-success-next-steps"
import JobPostSuccessWhatNext from "@/components/job-post-success/job-post-success-what-next"
import JobPostSuccessActions from "@/components/job-post-success/job-post-success-actions"
import JobStatusMonitor from "@/components/job-status-monitor";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

function JobPostSuccessContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId") || "";
  const { schoolId } = useAuthStore();

  return (
    <div className="flex flex-1 flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4">
        <div className="mx-auto w-full py-8">
          <div className="space-y-6">

            {/* Back Navigation */}
            <Link href="/">
              <Button variant="ghost" className="w-10 h-10">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>

            {/* 1. Success confirmation — first thing the user sees */}
            <JobPostSuccessMessage />

            {/* 2. Live status of the job they just created — answers "what's happening now?" */}
            <JobStatusMonitor
              schoolId={schoolId || undefined}
              jobID={jobId || undefined}
            />

            {/* 3. Share the job — while they wait, they can spread the word */}
            <JobPostSuccessShare jobId={jobId} />

            {/* 4. What happens next — sets expectations for the process ahead */}
            <JobPostSuccessWhatNext />


            {/* 6. Quick actions — secondary actions at the bottom */}
            <JobPostSuccessActions />

          </div>
        </div>
      </div>
    </div>
  )
}

export default function JobPostSuccess() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JobPostSuccessContent />
    </Suspense>
  );
}