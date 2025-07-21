'use client'

import { NewJobHeader } from '@/components/new-job-header'
import { CreateJobBreadcrumb } from '@/components/create-job-breadcrumb'
import { BasicJobInformation } from '@/components/basic-job-information'
import { ScreeningSettings } from '@/components/screening-settings'
import { ReviewAndPublish } from "@/components/review-and-publish"
import { motion } from 'framer-motion'
import { Formik, Form } from 'formik'
import * as Yup from 'yup'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createJob } from '@/lib/supabase/api/create-job'
import { Dialog, DialogTitle, DialogDescription } from '@/components/ui/dialog'

const validationSchema = Yup.object({
  jobTitle: Yup.string().required('Job title is required'),
  description: Yup.string(), // Optional
  subjects: Yup.array().min(1, 'At least one subject is required'),
  gradeLevel: Yup.array().min(1, 'At least one grade level is required'),
  employmentType: Yup.string().required('Employment type is required'),
  experience: Yup.string(),
  salaryMin: Yup.string(),
  salaryMax: Yup.string(),
})

type FormValues = {
  jobTitle: string
  description?: string
  subjects: string[]
  gradeLevel: string[]
  employmentType: string
  experience: string
  salaryMin: string
  salaryMax: string
}

const initialValues: FormValues = {
  jobTitle: '',
  description: '',
  subjects: [],
  gradeLevel: [],
  employmentType: 'full-time',
  experience: 'any',
  salaryMin: '',
  salaryMax: '',
}

export default function CreateJobApplicationPage() {
  const [jobInfo, setJobInfo] = useState<FormValues | null>(null)
  const [step, setStep] = useState(0)
  // Remove difficulty state, add screening state
  const [screening, setScreening] = useState({
    assessment: false,
    demoVideo: false,
    interviewScheduling: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'progress' | 'success' | 'error' | null>(null)
  
  // Prevent body scrolling when this component mounts
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])
  
  return (
    <div className="fixed inset-0 flex flex-col">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col h-full"
      >
        {/* Fixed Header */}
        <div className="shrink-0">
          <NewJobHeader />
          <CreateJobBreadcrumb currentStep={step} />
          <div className="border-b border-gray-200" />
        </div>
        {step === 0 ? (
          <Formik
            initialValues={jobInfo || initialValues}
            validationSchema={validationSchema}
            onSubmit={(values) => {
              setJobInfo(values)
              setStep(1)
            }}
            validateOnChange={false}
            validateOnBlur={false}
          >
            {(formik) => (
              <Form className="flex flex-col flex-1 min-h-0">
                {/* Scrollable Main Content */}
                <main className="flex-1 overflow-y-auto px-4 py-6 bg-muted">
                  <div className="mx-auto max-w-4xl">
                    <BasicJobInformation {...formik} />
                  </div>
                </main>
                {/* Fixed Bottom Button */}
                <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      className="bg-primary text-white px-6 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        ) : step === 1 ? (
          <div className="flex flex-col flex-1 min-h-0">
            <main className="flex-1 overflow-y-auto px-4 py-6 bg-muted">
              <div className="mx-auto max-w-4xl">
                <ScreeningSettings
                  values={screening}
                  onChange={setScreening}
                />
              </div>
            </main>
            <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-4">
              <div className="flex justify-between gap-2">
                <button
                  type="button"
                  className="bg-muted text-gray-700 px-6 py-2 rounded-md font-medium hover:bg-gray-200 transition-colors"
                  onClick={() => setStep(0)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="bg-primary text-white px-6 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors"
                  onClick={() => setStep(2)}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            <main className="flex-1 overflow-y-auto px-4 py-6 bg-muted">
              <div className="mx-auto max-w-4xl">
                <ReviewAndPublish
                  jobData={{
                    jobTitle: jobInfo?.jobTitle ?? "",
                    experience: jobInfo?.experience ?? "any",
                    employmentType: jobInfo?.employmentType ?? "full-time",
                    subjects: jobInfo?.subjects ?? [],
                    gradeLevel: jobInfo?.gradeLevel ?? [],
                    salaryMin: jobInfo?.salaryMin ?? "",
                    salaryMax: jobInfo?.salaryMax ?? "",
                    schoolName: "Dayanand Public School",
                    location: "Mumbai",
                    jobDescription: jobInfo?.description ?? "Job description here...",
                    requirements: ["Requirement 1", "Requirement 2"],
                    includeSubjectTest: screening.assessment,
                    subjectTestDuration: screening.assessment ? 30 : undefined,
                    demoVideoDuration: screening.demoVideo ? 10 : undefined,
                    includeInterview: screening.interviewScheduling,
                    interviewFormat: screening.interviewScheduling ? "panel" : undefined,
                    interviewDuration: screening.interviewScheduling ? 20 : undefined,
                    interviewQuestions: screening.interviewScheduling ? [
                      { id: 1, question: "Why do you want this job?" },
                      { id: 2, question: "Describe your teaching style." }
                    ] : []
                  }}
                />
              </div>
            </main>
            <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-4">
              <div className="flex justify-between gap-2">
                <button
                  type="button"
                  className="bg-muted text-gray-700 px-6 py-2 rounded-md font-medium hover:bg-gray-200 transition-colors"
                  onClick={() => setStep(1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="bg-primary text-white px-6 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors"
                  onClick={async () => {
                    setError(null)
                    setLoading(true)
                    setDialogType('progress')
                    setDialogOpen(true)
                    try {
                      const jobPayload = {
                        jobTitle: jobInfo?.jobTitle ?? "",
                        experience: jobInfo?.experience ?? "any",
                        employmentType: jobInfo?.employmentType ?? "full-time",
                        subjects: jobInfo?.subjects ?? [],
                        gradeLevel: jobInfo?.gradeLevel ?? [],
                        salaryMin: jobInfo?.salaryMin ?? "",
                        salaryMax: jobInfo?.salaryMax ?? "",
                        schoolName: "Dayanand Public School",
                        location: "Mumbai",
                        jobDescription: jobInfo?.description ?? "Job description here...",
                        requirements: ["Requirement 1", "Requirement 2"],
                        includeSubjectTest: screening.assessment,
                        subjectTestDuration: screening.assessment ? 30 : undefined,
                        demoVideoDuration: screening.demoVideo ? 10 : undefined,
                        includeInterview: screening.interviewScheduling,
                        interviewFormat: screening.interviewScheduling ? "panel" : undefined,
                        interviewDuration: screening.interviewScheduling ? 20 : undefined,
                        interviewQuestions: screening.interviewScheduling ? [
                          { id: 1, question: "Why do you want this job?" },
                          { id: 2, question: "Describe your teaching style." }
                        ] : []
                      }
                      const { data, error } = await createJob(jobPayload)
                      if (error || !data?.id) {
                        setError(error?.message || 'Failed to create job. Please try again.')
                        setDialogType('error')
                        setLoading(false)
                        return
                      }
                      setDialogType('success')
                      setTimeout(() => {
                        setDialogOpen(false)
                        router.push(`/create-job-post/success?jobId=${data.id}`)
                      }, 1200)
                    } catch (e: any) {
                      setError(e?.message || 'Something went wrong. Please try again.')
                      setDialogType('error')
                      setLoading(false)
                    }
                  }}
                  disabled={loading}
                >
                  {loading ? 'Publishing...' : 'Publish'}
                </button>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  {dialogType === 'progress' && (
                    <div className="flex flex-col items-center justify-center">
                      <DialogTitle>Publishing Job...</DialogTitle>
                      <DialogDescription>
                        Please wait while we publish your job post.
                      </DialogDescription>
                      <div className="mt-4 animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
                    </div>
                  )}
                  {dialogType === 'success' && (
                    <div className="flex flex-col items-center justify-center">
                      <DialogTitle>Success!</DialogTitle>
                      <DialogDescription>
                        Your job post has been published.
                      </DialogDescription>
                    </div>
                  )}
                  {dialogType === 'error' && (
                    <div className="flex flex-col items-center justify-center">
                      <DialogTitle>Something went wrong</DialogTitle>
                      <DialogDescription>
                        {error}
                      </DialogDescription>
                      <button
                        className="mt-4 bg-primary text-white px-4 py-2 rounded-md"
                        onClick={() => setDialogOpen(false)}
                      >
                        Close
                      </button>
                    </div>
                  )}
                </Dialog>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}