'use client'

import { BasicJobInformation } from '@/components/basic-job-information'
import { ScreeningSettings } from '@/components/screening-settings'
import { ReviewAndPublish } from "@/components/review-and-publish"

import { Formik, Form, FormikProps } from 'formik'
import * as Yup from 'yup'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { JobPostDialog } from '@/components/job-post-dialog'
import { AuthGuard } from '@/components/auth-guard'
import '@/styles/jobs.css'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

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
  const [screening, setScreening] = useState({
    assessment: false,
    assessmentDifficulty: undefined as string | undefined,
    numberOfQuestions: 5 as number | undefined,
    minimumPassingMarks: undefined as number | undefined,
    demoVideo: false,
    demoVideoDuration: undefined as number | undefined,
    interviewScheduling: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'progress' | 'success' | 'error' | null>(null)
  const { user, session } = useAuth()
  const formikRef = useRef<FormikProps<FormValues>>(null)

  const handleNext = async () => {
    if (step === 0) {
      // Validate and submit form for step 0
      if (formikRef.current) {
        const errors = await formikRef.current.validateForm()
        if (Object.keys(errors).length > 0) {
          formikRef.current.setTouched({
            jobTitle: true,
            subjects: true,
            gradeLevel: true,
            employmentType: true,
          })
          return
        }
        formikRef.current.handleSubmit()
      }
    } else {
      // For other steps, just proceed
      setStep(step + 1)
    }
  }

  return (
    <AuthGuard>
      <div className="flex flex-col h-full">
        {/* Fixed Header with Progress */}
        <div className="shrink-0 bg-background ">
          <div className="px-6 py-4 flex items-center gap-4">

            <div className="mx-auto flex-1">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" className="hover:bg-gray-100" onClick={() => router.back()}>
                    <X className="w-4 h-4 bg-white" />
                  </Button>
                  <h1 className="jobs-title">Create New Job Post</h1>
                </div>
                <div className="relative inline-block bg-violet-500 rounded-full border-2 border-white m-1">
                  <Badge className="text-xs px-3 py-2 bg-white rounded-full font-medium ">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                      1 Free Job Post
                    </span>
                  </Badge>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round(((step + 1) / steps.length) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto px-2">
            <Card className="border-0 shadow-none bg-white py-1">
              <CardHeader className='flex justify-between items-center'>
                <div>
                  <CardTitle>{steps[step].title}</CardTitle>
                  <CardDescription>{steps[step].description}</CardDescription>
                </div>
                <Badge className="text-xs px-3 py-1 border border-gray-300 text-gray-700 bg-white rounded-full font-medium">
                  Step {step + 1} of {steps.length}
                </Badge>
              </CardHeader>
              <CardContent>
                {step === 0 && (
                  <Formik
                    innerRef={formikRef}
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
                        minimumPassingMarks: values.minimumPassingMarks,
                        demoVideo: values.demoVideo,
                        demoVideoDuration: values.demoVideoDuration,
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
                      demoVideoDuration: screening.demoVideo ? screening.demoVideoDuration : undefined,
                      includeInterview: screening.interviewScheduling,
                      interviewFormat: screening.interviewScheduling ? "panel" : undefined,
                      interviewDuration: screening.interviewScheduling ? 20 : undefined,
                      interviewQuestions: screening.interviewScheduling ? [
                        { id: 1, question: "Why do you want this job?" },
                        { id: 2, question: "Describe your teaching style." }
                      ] : [],
                      assessmentDifficulty: screening.assessment ? screening.assessmentDifficulty : undefined,
                      numberOfQuestions: screening.assessment ? screening.numberOfQuestions : undefined,
                      minimumPassingMarks: screening.assessment ? screening.minimumPassingMarks : undefined
                    }}
                  />
                )}
              </CardContent>
            </Card>
            {/* Bottom spacing */}
            <div className="h-6"></div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="shrink-0 bg-white border-t border-gray-200 shadow-sm">
          <div className="mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              {step > 0 ? (
                <button
                  type="button"
                  className="px-6 py-2 rounded-md font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                  onClick={() => setStep(step - 1)}
                >
                  Previous
                </button>
              ) : (
                <div></div>
              )}

              {step < 2 ? (
                <button
                  type="button"
                  className="px-6 py-2 rounded-md text-white font-semibold bg-gradient-to-r from-blue-600 to-purple-600 shadow-md hover:from-blue-700 hover:to-purple-700 transition-colors duration-200"
                  onClick={handleNext}
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  className="px-6 py-2 rounded-md text-white font-semibold bg-gradient-to-r from-blue-600 to-purple-600 shadow-md hover:from-blue-700 hover:to-purple-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={async () => {
                    setError(null)
                    setLoading(true)
                    setDialogType('progress')
                    setDialogOpen(true)
                    try {
                      // Check if user is authenticated
                      if (!user || !session) {
                        setError('Please log in to create a job post.')
                        setDialogType('error')
                        setLoading(false)
                        return
                      }
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
                        demoVideoDuration: screening.demoVideo ? screening.demoVideoDuration : undefined,
                        includeInterview: screening.interviewScheduling,
                        interviewFormat: screening.interviewScheduling ? "panel" : undefined,
                        interviewDuration: screening.interviewScheduling ? 20 : undefined,
                        interviewQuestions: screening.interviewScheduling ? [
                          { id: 1, question: "Why do you want this job?" },
                          { id: 2, question: "Describe your teaching style." }
                        ] : [],
                        assessmentDifficulty: screening.assessment ? screening.assessmentDifficulty : undefined,
                        numberOfQuestions: screening.assessment ? screening.numberOfQuestions : undefined,
                        minimumPassingMarks: screening.assessment ? screening.minimumPassingMarks : undefined
                      }
                      // Call the API endpoint with authentication
                      const headers = new Headers({
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                      })
                      // Add Authorization header if we have an access token
                      if (session?.access_token) {
                        headers.set('Authorization', `Bearer ${session.access_token}`)
                      }
                      const response = await fetch('/api/create-job', {
                        method: 'POST',
                        headers,
                        credentials: 'include', // Include cookies for server-side auth
                        body: JSON.stringify(jobPayload),
                      })

                      if (!response.ok) {
                        const errorData = await response.json()
                        setError(errorData.error || 'Failed to create job. Please try again.')
                        setDialogType('error')
                        setLoading(false)
                        return
                      }

                      const { data } = await response.json()
                      if (!data?.id) {
                        setError('Failed to create job. Please try again.')
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
              )}
            </div>
          </div>
        </div>

        <JobPostDialog
          open={dialogOpen}
          type={dialogType}
          error={error}
          onClose={() => setDialogOpen(false)}
        />
      </div>
    </AuthGuard>
  )
}