'use client'

import { NewJobHeader } from '@/components/new-job-header'
import { BasicJobInformation } from '@/components/basic-job-information'
import { ScreeningSettings } from '@/components/screening-settings'
import { ReviewAndPublish } from "@/components/review-and-publish"
import { motion } from 'framer-motion'
import { Formik, Form } from 'formik'
import * as Yup from 'yup'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createJob } from '@/lib/supabase/api/create-job'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { JobPostDialog } from '@/components/job-post-dialog'
import { AuthGuard } from '@/components/auth-guard'

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

const steps = [
  {
    title: "Basic Job Information",
    description: "Fill out the form below to create a job post."
  },
  {
    title: "Screening & Assessment",
    description: "Choose which screening steps to enable for this job application."
  },
  {
    title: "Review & Publish",
    description: "Review all details before publishing your job post."
  }
]

export default function CreateJobApplicationPage() {
  const [jobInfo, setJobInfo] = useState<FormValues | null>(null)
  const [step, setStep] = useState(0)
  // Remove difficulty state, add screening state
  const [screening, setScreening] = useState({
    assessment: false,
    assessmentDifficulty: undefined as string | undefined,
    numberOfQuestions: undefined as number | undefined,
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
    <AuthGuard>
      <div className="fixed inset-0 flex flex-col">
        <JobPostDialog
          open={dialogOpen}
          type={dialogType}
          error={error}
          onClose={() => setDialogOpen(false)}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col h-full"
        >
          {/* Fixed Header */}
          <div className="shrink-0">
            <NewJobHeader />
          </div>
          <main className="flex-1 overflow-y-auto px-4 bg-muted pt-[64px] pb-16 flex justify-center mt-10">
            <div className="w-full max-w-3xl">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <CardTitle className="text-2xl font-semibold text-gray-800">{steps[step].title}</CardTitle>
                    <Badge className="text-xs px-2 py-0.5 border border-gray-300 text-black bg-white rounded-full font-medium">Step {step + 1} of {steps.length}</Badge>
                  </div>
                  <CardDescription>{steps[step].description}</CardDescription>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                      style={{ width: `${Math.round(((step + 1) / steps.length) * 100)}%` }}
                    ></div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {step === 0 && (
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
                        <Form>
                          <BasicJobInformation {...formik} />
                          <div className="flex justify-end mt-6">
                            <button
                              type="button"
                              className="px-6 py-2 rounded text-white font-semibold bg-gradient-to-r from-blue-600 to-purple-600 shadow-md hover:from-blue-700 hover:to-purple-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={async () => {
                                const errors = await formik.validateForm();
                                if (Object.keys(errors).length > 0) {
                                  formik.setTouched({
                                    jobTitle: true,
                                    subjects: true,
                                    gradeLevel: true,
                                    employmentType: true,
                                  });
                                  return;
                                }
                                formik.handleSubmit();
                              }}
                            >
                              Continue
                            </button>
                          </div>
                        </Form>
                      )}
                    </Formik>
                  )}
                  {step === 1 && (
                    <ScreeningSettings
                      values={screening}
                      onChange={(values) => {
                        setScreening({
                          assessment: values.assessment,
                          assessmentDifficulty: values.assessmentDifficulty,
                          numberOfQuestions: values.numberOfQuestions,
                          demoVideo: values.demoVideo,
                          interviewScheduling: values.interviewScheduling,
                        });
                      }}
                    />
                  )}
                  {step === 2 && (
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
                        ] : [],
                        assessmentDifficulty: screening.assessment ? screening.assessmentDifficulty : undefined,
                        numberOfQuestions: screening.assessment ? screening.numberOfQuestions : undefined
                      }}
                    />
                  )}
                </CardContent>
                <CardFooter className="flex justify-between gap-2 bg-white border-t border-gray-200">
                  {step === 0 && (
                    // No buttons here for step 0; Continue button is inside the Formik form above
                    null
                  )}
                  {step === 1 && (
                    <>
                      <button
                        type="button"
                        className="bg-muted text-gray-700 px-6 py-2 rounded-md font-medium hover:bg-gray-200 transition-colors"
                        onClick={() => setStep(0)}
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        className="px-6 py-2 rounded text-white font-semibold bg-gradient-to-r from-blue-600 to-purple-600 shadow-md hover:from-blue-700 hover:to-purple-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => setStep(2)}
                      >
                        Next
                      </button>
                    </>
                  )}
                  {step === 2 && (
                    <>
                      <button
                        type="button"
                        className="bg-muted text-gray-700 px-6 py-2 rounded-md font-medium hover:bg-gray-200 transition-colors"
                        onClick={() => setStep(1)}
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        className="px-6 py-2 rounded text-white font-semibold bg-gradient-to-r from-blue-600 to-purple-600 shadow-md hover:from-blue-700 hover:to-purple-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                              ] : [],
                              assessmentDifficulty: screening.assessment ? screening.assessmentDifficulty : undefined,
                              numberOfQuestions: screening.assessment ? screening.numberOfQuestions : undefined
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
                              setTimeout(() => {
                                router.push(`/create-job-post/success?jobId=${data.id}`)
                              }, 100) // small delay to allow dialog to close visually
                            }, 1000)
                          } catch (e: unknown) {
                            let errorMessage = 'Something went wrong. Please try again.';
                            if (typeof e === 'object' && e !== null && 'message' in e && typeof (e as { message?: unknown }).message === 'string') {
                              errorMessage = (e as { message: string }).message;
                            }
                            setError(errorMessage)
                            setDialogType('error')
                            setLoading(false)
                          }
                        }}
                        disabled={loading}
                      >
                        {loading ? 'Publishing...' : 'Publish'}
                      </button>
                    </>
                  )}
                </CardFooter>
              </Card>
            </div>
          </main>
        </motion.div>
      </div>
    </AuthGuard>
  )
}