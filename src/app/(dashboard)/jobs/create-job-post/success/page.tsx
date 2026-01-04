'use client';
import { Suspense } from "react";
import { useSearchParams } from "next/navigation"
import JobPostSuccessMessage from "@/components/job-post-success/job-post-success-message"
import JobPostSuccessShare from "@/components/job-post-success/job-post-success-share"
import JobPostSuccessNextSteps from "@/components/job-post-success/job-post-success-next-steps"
import JobPostSuccessWhatNext from "@/components/job-post-success/job-post-success-what-next"
import JobPostSuccessActions from "@/components/job-post-success/job-post-success-actions"
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

function JobPostSuccessContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId") || "";

  return (
      <div className="flex flex-1 flex-col h-full">
        <div className="flex-1 overflow-y-auto px-4">
          <div className="mx-auto w-full py-8">
            <div className="space-y-4">
              <Link href="/">
              <Button variant="ghost" className="w-10 h-10" 
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              </Link>
              <JobPostSuccessMessage />
              <JobPostSuccessShare jobId={jobId} />
              <JobPostSuccessWhatNext />
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