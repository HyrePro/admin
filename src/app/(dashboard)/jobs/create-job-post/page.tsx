'use client'

import React, { memo, Suspense, useCallback, useMemo, useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Formik, FormikProps } from "formik"
import { Form } from "formik"
import { useAuth } from "@/context/auth-context"
import { useAuthStore } from "@/store/auth-store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { X, AlertCircle } from "lucide-react"
import dynamicImport from "next/dynamic"
import { JobPostDialog } from "@/components/job-post-dialog"
import { createClient } from '@/lib/supabase/api/client'
import { toast } from "sonner"
import * as Yup from "yup"
import type { ExtendedInterviewSettings } from "@/components/screening-settings"



// Dynamically import heavy components to reduce initial bundle size
const BasicJobInformation = dynamicImport(() => import("@/components/basic-job-information").then(mod => mod.BasicJobInformation), {
  ssr: false,
  loading: () => (
    <div className="space-y-6 p-4">
      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  )
})

const ScreeningSettings = dynamicImport(() => import("@/components/screening-settings").then(mod => mod.ScreeningSettings), {
  ssr: false,
  loading: () => (
    <div className="space-y-6 p-4">
      <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  )
})

const ReviewAndPublish = dynamicImport(() => import("@/components/review-and-publish").then(mod => mod.ReviewAndPublish), {
  ssr: false,
  loading: () => (
    <div className="space-y-6 p-4">
      <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3"></div>
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  )
})

// Memoize validation schema
const validationSchema = Yup.object({
  jobTitle: Yup.string().required('Job title is required'),
  description: Yup.string(),
  subjects: Yup.array().min(1, 'At least one subject is required'),
  gradeLevel: Yup.array().min(1, 'At least one grade level is required'),
  employmentType: Yup.string().required('Employment type is required'),
  experience: Yup.string(),
  salaryRange: Yup.string().required('Salary range is required'),
  hiringUrgency: Yup.string().required('Hiring urgency is required'),
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
  salaryRange?: string
  hiringUrgency?: string
  numberOfOpenings?: number
}

const initialValues: FormValues = {
  jobTitle: '',
  description: '',
  subjects: [],
  gradeLevel: [],
  employmentType: 'full-time',
  experience: 'any',
  salaryRange: 'not-disclosed',
  hiringUrgency: 'within-2-weeks',
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
      <AlertCircle className="h-4 w-4 text-red-500" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  </div>
))
ErrorAlert.displayName = 'ErrorAlert'

export default function CreateJobApplicationPage() {
  const [jobInfo, setJobInfo] = useState<FormValues>(initialValues)
  const jobInfoRef = useRef<FormValues>(initialValues)
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
  const { schoolId } = useAuthStore()
  const [createdJobId, setCreatedJobId] = useState<string | null>(null)
  const [interviewSettings, setInterviewSettings] = useState<ExtendedInterviewSettings | null>(null)
  const [pendingJobSettings, setPendingJobSettings] = useState<{settings: ExtendedInterviewSettings, jobId: string} | null>(null) // Add state for pending job settings
  const [resolvedSchoolId, setResolvedSchoolId] = useState<string | null>(schoolId || null) // Add state for resolved schoolId
  
  // Log auth information for debugging
  const formikRef = useRef<FormikProps<FormValues>>(null)

  // Fetch schoolId from admin_user_info if not provided
  useEffect(() => {
    const fetchSchoolId = async () => {
      if (schoolId) {
        // If schoolId is already provided, use it
        setResolvedSchoolId(schoolId);
        return;
      }
      
      if (!user?.id) {
        return;
      }
      
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('admin_user_info')
          .select('school_id')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching school info:', error);
          return;
        }
        
        if (data?.school_id) {
          setResolvedSchoolId(data.school_id);
          // Update the store as well
          useAuthStore.getState().setSchoolId(data.school_id);
        }
      } catch (error) {
        console.error('Error fetching school ID:', error);
      }
    };
    
    if (!schoolId && user?.id) {
      fetchSchoolId();
    } else if (schoolId) {
      setResolvedSchoolId(schoolId);
    }
  }, [schoolId, user?.id]);

  // Memoize progress percentage
  const progressPercentage = useMemo(() => 
    Math.round(((step + 1) / steps.length) * 100), 
    [step]
  )

  // Memoize current step info
  const currentStep = useMemo(() => steps[step], [step])

  // Memoize job payload creation
  const createJobPayload = useCallback(() => ({
    jobTitle: jobInfo.jobTitle,
    experience: jobInfo.experience,
    employmentType: jobInfo.employmentType,
    subjects: jobInfo.subjects,
    gradeLevel: jobInfo.gradeLevel,
    salaryRange: jobInfo.salaryRange ?? "not-disclosed",
    hiringUrgency: jobInfo.hiringUrgency ?? "within-2-weeks",
    numberOfOpenings: jobInfo.numberOfOpenings,
    schoolName: "Dayanand Public School",
    location: "Mumbai",
    jobDescription: jobInfo.description ?? "Job description here...",
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
    // Store the form values in ref to avoid re-initialization
    jobInfoRef.current = values
    setJobInfo(values)
    // Only navigate if we're not already navigating via handleNext
    if (step === 0) {
      setStep(1)
    }
  }, [step])

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
            salaryRange: true,
            hiringUrgency: true,
          })
          return
        }
        // Instead of calling handleSubmit, manually update the state
        const currentValues = formikRef.current.values;
        jobInfoRef.current = currentValues;
        setJobInfo(currentValues);
        setStep(prev => prev + 1);
      }
    } else if (step === 1) {
      if (!screening.assessment && !screening.demoVideo) {
        toast.error('Please select at least one screening method', {
          description: 'Select either MCQ Assessment or Teaching Demo Video to continue.'
        });
        return
      }
      setStep(prev => prev + 1)
    } else {
      setStep(prev => prev + 1)
    }
  }, [step, screening.assessment, screening.demoVideo, formikRef])

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
      
      // Set the created job ID
      const newJobId = data.id;
      console.log('Job created with ID:', newJobId);
      setCreatedJobId(newJobId)
      
      // Log the current state
      console.log('Current state:', { pendingJobSettings, screening, interviewSettings, resolvedSchoolId });
      
      // If we have pending job settings, save them now
      if (pendingJobSettings) {
        console.log('Saving pending job settings:', pendingJobSettings);
        try {
          await saveJobSettings(pendingJobSettings.settings, newJobId);
          setPendingJobSettings(null);
        } catch (settingsError) {
          console.error('Error saving job interview settings:', settingsError);
        }
      }
      // If interview scheduling is enabled and we have interview settings, save job-specific settings
      else if (screening.interviewScheduling && interviewSettings && resolvedSchoolId) {
        console.log('Saving interview settings:', interviewSettings);
        try {
          await saveJobSettings(interviewSettings, newJobId);
        } catch (settingsError) {
          console.error('Error saving job interview settings:', settingsError);
        }
      } else {
        console.log('No job settings to save. Conditions:', {
          hasInterviewScheduling: screening.interviewScheduling,
          hasInterviewSettings: !!interviewSettings,
          hasSchoolId: !!resolvedSchoolId,
          hasPendingSettings: !!pendingJobSettings
        });
      }
      
      setDialogType('success')
      setTimeout(() => {
        setDialogOpen(false)
        setTimeout(() => {
          router.push(`/jobs/create-job-post/success?jobId=${newJobId}`)
        }, 100)
      }, 1000)
    } catch (e: unknown) {
      let errorMessage = 'Something went wrong. Please try again.';
      if (typeof e === 'object' && e !== null && 'message' in e && typeof (e as { message?: unknown }).message === 'string') {
        errorMessage = (e as { message: string }).message;
      }
      console.error('Error in handlePublish:', e);
      setError(errorMessage)
      setDialogType('error')
      setLoading(false)
    }
  }, [user, session, createJobPayload, router, screening.interviewScheduling, interviewSettings, resolvedSchoolId, pendingJobSettings])

  // Add function to save job settings
  const saveJobSettings = async (settings: ExtendedInterviewSettings, jobId: string) => {
    console.log('Saving job settings:', { settings, jobId, resolvedSchoolId });
    
    if (!resolvedSchoolId) {
      console.error('No resolved school ID found');
      return;
    }
    
    const settingsPayload = {
      job_id: jobId,
      school_id: resolvedSchoolId,
      default_interview_type: settings.default_interview_type,
      default_duration: settings.default_duration,
      buffer_time: settings.buffer_time,
      working_hours_start: settings.working_hours_start,
      working_hours_end: settings.working_hours_end,
      candidate_reminder_hours: settings.candidate_reminder_hours,
      interviewer_reminder_hours: settings.interviewer_reminder_hours,
      custom_instructions: settings.custom_instructions,
      slots: settings.slots
    };
    
    console.log('Settings payload:', settingsPayload);
    
    const settingsHeaders = new Headers({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    });
    
    if (session?.access_token) {
      settingsHeaders.set('Authorization', `Bearer ${session.access_token}`);
    }
    
    const settingsResponse = await fetch('/api/job-interview-settings', {
      method: 'POST',
      headers: settingsHeaders,
      credentials: 'include',
      body: JSON.stringify(settingsPayload),
    });
    
    console.log('Settings response:', settingsResponse);
    
    if (!settingsResponse.ok) {
      const errorText = await settingsResponse.text();
      console.error('Failed to save job interview settings:', errorText);
      throw new Error(`Failed to save job interview settings: ${errorText}`);
    }
    
    const responseData = await settingsResponse.json();
    console.log('Settings saved successfully:', responseData);
  };

  // Add this function to handle saving interview settings
  const handleSaveInterviewSettings = useCallback(async (settings: ExtendedInterviewSettings) => {
    console.log('Handling save interview settings:', settings);
    console.log('Current state - createdJobId:', createdJobId, 'pendingJobSettings:', pendingJobSettings);
    setInterviewSettings(settings);
    
    // If we already have a job ID, save the settings immediately
    if (createdJobId) {
      console.log('Saving settings immediately for job:', createdJobId);
      try {
        await saveJobSettings(settings, createdJobId);
      } catch (error) {
        console.error('Error saving job interview settings:', error);
      }
    }
    // Otherwise, store the settings to be saved after job creation
    else {
      console.log('Storing settings for later save (no job ID yet)');
      setPendingJobSettings({ settings, jobId: 'pending' });
      console.log('Updated pendingJobSettings:', { settings, jobId: 'pending' });
    }
  }, [createdJobId, session, pendingJobSettings]);

  // Add a function to refresh job-specific settings after they've been saved
  const refreshJobSettings = useCallback(async (jobId: string) => {
    if (!jobId) return;
    
    try {
      const supabase = createClient();
      
      // Fetch job-specific settings
      const { data: jobSettings, error: jobError } = await supabase
        .from('job_meeting_settings')
        .select('*')
        .eq('job_id', jobId)
        .single();
      
      if (!jobError && jobSettings) {
        const jobSpecificSettings: ExtendedInterviewSettings = {
          default_interview_type: jobSettings.default_interview_type || 'in-person',
          default_duration: jobSettings.default_duration || '30',
          buffer_time: '15',
          working_hours_start: '09:00',
          working_hours_end: '17:00',
          candidate_reminder_hours: jobSettings.candidate_reminder_hours || '24',
          interviewer_reminder_hours: jobSettings.interviewer_reminder_hours || '1',
          custom_instructions: jobSettings.custom_instructions || '',
          working_days: [
            { day: 'monday', enabled: false, start_time: '09:00', end_time: '17:00', slot_duration: '30' },
            { day: 'tuesday', enabled: false, start_time: '09:00', end_time: '17:00', slot_duration: '30' },
            { day: 'wednesday', enabled: false, start_time: '09:00', end_time: '17:00', slot_duration: '30' },
            { day: 'thursday', enabled: false, start_time: '09:00', end_time: '17:00', slot_duration: '30' },
            { day: 'friday', enabled: false, start_time: '09:00', end_time: '17:00', slot_duration: '30' },
            { day: 'saturday', enabled: false, start_time: '09:00', end_time: '17:00', slot_duration: '30' },
            { day: 'sunday', enabled: false, start_time: '09:00', end_time: '17:00', slot_duration: '30' }
          ],
          breaks: [],
          slots: jobSettings.slots || []
        };
        
        setInterviewSettings(jobSpecificSettings);
      }
    } catch (error) {
      console.error('Error refreshing job-specific settings:', error);
    }
  }, []);

  // Memoize review job data
  const reviewJobData = useMemo(() => ({
    jobTitle: jobInfo.jobTitle,
    experience: jobInfo.experience,
    employmentType: jobInfo.employmentType,
    subjects: jobInfo.subjects,
    gradeLevel: jobInfo.gradeLevel,
    salaryRange: jobInfo.salaryRange ?? "not-disclosed",
    hiringUrgency: jobInfo.hiringUrgency ?? "within-2-weeks",
    numberOfOpenings: jobInfo.numberOfOpenings,
    schoolName: "Dayanand Public School",
    location: "Mumbai",
    jobDescription: jobInfo.description ?? "Job description here...",
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
                      initialValues={jobInfo}
                      validationSchema={validationSchema}
                      onSubmit={handleFormSubmit}
                      validateOnChange={true}
                      validateOnBlur={true}
                      enableReinitialize={true}
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
                      schoolId={resolvedSchoolId || undefined} // Pass resolvedSchoolId
                      jobId={createdJobId || undefined} // Pass the created job ID if available
                      onSaveJobSettings={handleSaveInterviewSettings} // Pass the save function
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
  )
}