'use client'

import { Formik, Form, FormikProps } from 'formik'
import * as Yup from 'yup'
import { useState, useRef, lazy, Suspense, useMemo, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AuthGuard } from '@/components/auth-guard'
import '@/styles/jobs.css'
import { Button } from '@/components/ui/button'
import { X, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'

// Lazy load components
const BasicJobInformation = lazy(() => import('@/components/basic-job-information').then(mod => ({ default: mod.BasicJobInformation })))
const ScreeningSettings = lazy(() => import('@/components/screening-settings').then(mod => ({ default: mod.ScreeningSettings })))
const ReviewAndPublish = lazy(() => import('@/components/review-and-publish').then(mod => ({ default: mod.ReviewAndPublish })))
const JobPostDialog = lazy(() => import('@/components/job-post-dialog').then(mod => ({ default: mod.JobPostDialog })))

// Memoize validation schema
const validationSchema = Yup.object({
  jobTitle: Yup.string().required('Job title is required'),
  description: Yup.string(),
  subjects: Yup.array().min(1, 'At least one subject is required'),
  gradeLevel: Yup.array().min(1, 'At least one grade level is required'),
  employmentType: Yup.string().required('Employment type is required'),
  experience: Yup.string(),
  salaryMin: Yup.number()
    .transform((value, originalValue) => 
      originalValue === '' ? undefined : value
    )
    .min(0, 'Minimum salary must be 0 or greater')
    .optional(),
  salaryMax: Yup.number()
    .transform((value, originalValue) => 
      originalValue === '' ? undefined : value
    )
    .min(0, 'Maximum salary must be 0 or greater')
    .when('salaryMin', ([salaryMin], schema) => {
      return salaryMin !== undefined
        ? schema.min(salaryMin, 'Maximum salary must be greater than or equal to minimum salary')
        : schema;
    })
    .optional(),
  numberOfOpenings: Yup.number()
    .min(1, 'Number of openings must be at least 1')
    .required('Number of openings is required')
    .typeError('Number of openings must be a number'),
});

type FormValues = {
  jobTitle: string
  description?: string
  subjects: string[]
  gradeLevel: string[]
  employmentType: string
  experience: string
  salaryMin?: number
  salaryMax?: number
  numberOfOpenings?: number
}

const initialValues: FormValues = {
  jobTitle: '',
  description: '',
  subjects: [],
  gradeLevel: [],
  employmentType: 'full-time',
  experience: 'any',
  salaryMin: 0,
  salaryMax: 0,
  numberOfOpenings: 1,
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

// Memoized loading fallback
const StepLoader = memo(() => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
  </div>
))
StepLoader.displayName = 'StepLoader'

// Memoized progress bar component
const ProgressBar = memo(({ progress }: { progress: number }) => (
  <div className="w-full bg-gray-200 rounded-full h-1">
    <div
      className="bg-gradient-to-r from-blue-600 to-purple-600 h-1 rounded-full transition-all duration-300"
      style={{ width: `${progress}%` }}
    />
  </div>
))
ProgressBar.displayName = 'ProgressBar'

// Memoized error alert component
const ErrorAlert = memo(({ error }: { error: string }) => (
  <div className="fixed top-2 bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
    <Alert variant="destructive" className="shadow-lg">
      <AlertTriangle className="h-4 w-4 text-red-500" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  </div>
))
ErrorAlert.displayName = 'ErrorAlert'

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
    demoVideoPassingScore: undefined as number | undefined,
    interviewScheduling: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'progress' | 'success' | 'error' | null>(null)
  const { user, session } = useAuth()
  const formikRef = useRef<FormikProps<FormValues>>(null)

  // Memoize progress percentage
  const progressPercentage = useMemo(() => 
    Math.round(((step + 1) / steps.length) * 100), 
    [step]
  )

  // Memoize current step info
  const currentStep = useMemo(() => steps[step], [step])

  // Memoize job payload creation
  const createJobPayload = useCallback(() => ({
    jobTitle: jobInfo?.jobTitle ?? "",
    experience: jobInfo?.experience ?? "any",
    employmentType: jobInfo?.employmentType ?? "full-time",
    subjects: jobInfo?.subjects ?? [],
    gradeLevel: jobInfo?.gradeLevel ?? [],
    salaryMin: jobInfo?.salaryMin ?? "",
    salaryMax: jobInfo?.salaryMax ?? "",
    numberOfOpenings: jobInfo?.numberOfOpenings,
    schoolName: "Dayanand Public School",
    location: "Mumbai",
    jobDescription: jobInfo?.description ?? "Job description here...",
    requirements: ["Requirement 1", "Requirement 2"],
    includeSubjectTest: screening.assessment,
    subjectTestDuration: screening.assessment ? 30 : undefined,
    demoVideoDuration: screening.demoVideo ? screening.demoVideoDuration : undefined,
    demoVideoPassingScore: screening.demoVideo ? screening.demoVideoPassingScore : undefined,
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
  }), [jobInfo, screening])

  // Memoize handlers
  const handleScreeningChange = useCallback((values: typeof screening) => {
    setScreening(values);
  }, [])

  const handleFormSubmit = useCallback((values: FormValues) => {
    setJobInfo(values)
    setStep(1)
  }, [])

  const handleBack = useCallback(() => {
    setStep(prev => prev - 1)
  }, [])

  const handleNext = useCallback(async () => {
    if (step === 0) {
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
    } else if (step === 1) {
      if (!screening.assessment && !screening.demoVideo) {
        toast.error('Please select at least one screening method', {
          description: 'Select either Subject Screening Assessment or Teaching Demo Video to continue.'
        });
        return
      }
      setStep(prev => prev + 1)
    } else {
      setStep(prev => prev + 1)
    }
  }, [step, screening.assessment, screening.demoVideo])

  const handlePublish = useCallback(async () => {
    setError(null)
    setLoading(true)
    setDialogType('progress')
    setDialogOpen(true)
    
    try {
      if (!user || !session) {
        setError('Please log in to create a job post.')
        setDialogType('error')
        setLoading(false)
        return
      }
      
      const jobPayload = createJobPayload()
      
      const headers = new Headers({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      })
      
      if (session?.access_token) {
        headers.set('Authorization', `Bearer ${session.access_token}`)
      }
      
      const response = await fetch('/api/create-job', {
        method: 'POST',
        headers,
        credentials: 'include',
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
          router.push(`/jobs/create-job-post/success?jobId=${data.id}`)
        }, 100)
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
  }, [user, session, createJobPayload, router])

  // Memoize review job data
  const reviewJobData = useMemo(() => ({
    jobTitle: jobInfo?.jobTitle ?? "",
    experience: jobInfo?.experience ?? "any",
    employmentType: jobInfo?.employmentType ?? "full-time",
    subjects: jobInfo?.subjects ?? [],
    gradeLevel: jobInfo?.gradeLevel ?? [],
    salaryMin: jobInfo?.salaryMin?.toString() ?? "",
    salaryMax: jobInfo?.salaryMax?.toString() ?? "",
    numberOfOpenings: jobInfo?.numberOfOpenings,
    schoolName: "Dayanand Public School",
    location: "Mumbai",
    jobDescription: jobInfo?.description ?? "Job description here...",
    requirements: ["Requirement 1", "Requirement 2"],
    includeSubjectTest: screening.assessment,
    subjectTestDuration: screening.assessment ? 30 : undefined,
    demoVideoDuration: screening.demoVideo ? screening.demoVideoDuration : undefined,
    demoVideoPassingScore: screening.demoVideo ? screening.demoVideoPassingScore : undefined,
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
  }), [jobInfo, screening])

  return (
    <AuthGuard>
      <div className="flex flex-col h-full">
        {/* Fixed Header with Progress */}
        <div className="shrink-0 bg-background">
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
                  <Badge className="text-xs px-3 py-2 bg-white rounded-full font-medium">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                      1 Free Job Post
                    </span>
                  </Badge>
                </div>
              </div>
              <ProgressBar progress={progressPercentage} />
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto px-2">
            <Card className="border-0 shadow-none bg-white py-1">
              <CardHeader className='flex justify-between items-center'>
                <div>
                  <CardTitle>{currentStep.title}</CardTitle>
                  <CardDescription>{currentStep.description}</CardDescription>
                </div>
                <Badge className="text-xs px-3 py-1 border border-gray-300 text-gray-700 bg-white rounded-full font-medium">
                  Step {step + 1} of {steps.length}
                </Badge>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<StepLoader />}>
                  {step === 0 && (
                    <Formik
                      innerRef={formikRef}
                      initialValues={jobInfo || initialValues}
                      validationSchema={validationSchema}
                      onSubmit={handleFormSubmit}
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
                      onChange={handleScreeningChange}
                    />
                  )}
                  {step === 2 && (
                    <ReviewAndPublish jobData={reviewJobData} />
                  )}
                </Suspense>
              </CardContent>
            </Card>
            <div className="h-6" />
          </div>
        </div>

        {/* Error Alert */}
        {error && <ErrorAlert error={error} />}

        {/* Fixed Footer */}
        <div className="shrink-0 bg-white border-t border-gray-200 shadow-sm">
          <div className="mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              {step > 0 ? (
                <button
                  type="button"
                  className="px-6 py-2 rounded-md font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                  onClick={handleBack}
                >
                  Previous
                </button>
              ) : (
                <div />
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
                  onClick={handlePublish}
                  disabled={loading}
                >
                  {loading ? 'Publishing...' : 'Publish'}
                </button>
              )}
            </div>
          </div>
        </div>

        <Suspense fallback={null}>
          {dialogOpen && (
            <JobPostDialog
              open={dialogOpen}
              type={dialogType}
              error={error}
              onClose={() => setDialogOpen(false)}
            />
          )}
        </Suspense>
      </div>
    </AuthGuard>
  )
}