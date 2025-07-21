"use client"

import JobPostSuccessHeader from "@/components/job-post-success/job-post-success-header"
import JobPostSuccessMessage from "@/components/job-post-success/job-post-success-message"
import JobPostSuccessShare from "@/components/job-post-success/job-post-success-share"
import JobPostSuccessNextSteps from "@/components/job-post-success/job-post-success-next-steps"
import JobPostSuccessWhatNext from "@/components/job-post-success/job-post-success-what-next"
import JobPostSuccessActions from "@/components/job-post-success/job-post-success-actions"

export default function JobPostSuccess() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <JobPostSuccessHeader />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <JobPostSuccessMessage />
        <JobPostSuccessShare />
        <JobPostSuccessNextSteps />
        <JobPostSuccessWhatNext />
        <JobPostSuccessActions />
      </div>
    </div>
  )
} 