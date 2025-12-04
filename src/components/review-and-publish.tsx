import React, { memo, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import {
  MapPin,
  Clock,
  GraduationCap,
  IndianRupee,
  Target,
  Video,
  Users,
} from "lucide-react"

interface InterviewQuestion {
  id: string | number
  question: string
}

interface ReviewAndPublishProps {
  jobData: {
    jobTitle: string
    schoolName: string
    location: string
    experience: string
    employmentType: string
    salaryMin?: string
    salaryMax?: string
    subjects: string[]
    gradeLevel: string[]
    jobDescription: string
    requirements: string[]
    includeSubjectTest?: boolean
    subjectTestDuration?: number
    demoVideoDuration?: number
    demoVideoPassingScore?: number
    includeInterview?: boolean
    interviewFormat?: string
    interviewDuration?: number
    interviewQuestions: InterviewQuestion[]
    assessmentDifficulty?: string
    numberOfQuestions?: number
    minimumPassingMarks?: number
    numberOfOpenings?: number
  }
}

// Memoized job info item component
const JobInfoItem = memo(({ icon: Icon, children }: { icon: React.ElementType, children: React.ReactNode }) => (
  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
    <Icon className="w-4 h-4 text-gray-500" />
    <span className="font-medium">{children}</span>
  </div>
))
JobInfoItem.displayName = 'JobInfoItem'

// Memoized assessment card component
const AssessmentCard = memo(({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className: string 
}) => (
  <div className={`flex items-center p-4 rounded-lg border ${className}`}>
    <div className="flex-1">{children}</div>
  </div>
))
AssessmentCard.displayName = 'AssessmentCard'

// Memoized section component
const Section = memo(({ 
  title, 
  children 
}: { 
  title: string
  children: React.ReactNode 
}) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
    {children}
  </div>
))
Section.displayName = 'Section'

export const ReviewAndPublish = memo(({ jobData }: ReviewAndPublishProps) => {
  // Memoize capitalized text
  const capitalizedExperience = useMemo(() => 
    jobData.experience?.charAt(0).toUpperCase() + jobData.experience?.slice(1),
    [jobData.experience]
  )

  const capitalizedEmploymentType = useMemo(() => 
    jobData.employmentType?.charAt(0).toUpperCase() + jobData.employmentType?.slice(1),
    [jobData.employmentType]
  )

  const capitalizedDifficulty = useMemo(() => 
    jobData.assessmentDifficulty 
      ? jobData.assessmentDifficulty.charAt(0).toUpperCase() + jobData.assessmentDifficulty.slice(1)
      : null,
    [jobData.assessmentDifficulty]
  )

  const capitalizedInterviewFormat = useMemo(() => 
    jobData.interviewFormat 
      ? jobData.interviewFormat.charAt(0).toUpperCase() + jobData.interviewFormat.slice(1)
      : "Interview",
    [jobData.interviewFormat]
  )

  // Memoize salary display
  const salaryDisplay = useMemo(() => {
    if (!jobData.salaryMin || parseInt(jobData.salaryMin) === 0) return null
    
    if (jobData.salaryMin && jobData.salaryMax) {
      return `₹${jobData.salaryMin} - ₹${jobData.salaryMax}`
    }
    if (jobData.salaryMin) {
      return `₹${jobData.salaryMin}+`
    }
    return `Up to ₹${jobData.salaryMax}`
  }, [jobData.salaryMin, jobData.salaryMax])

  // Memoize openings display
  const openingsDisplay = useMemo(() => {
    if (!jobData.numberOfOpenings) return null
    return jobData.numberOfOpenings === 1 ? '1 Opening' : `${jobData.numberOfOpenings} Openings`
  }, [jobData.numberOfOpenings])

  // Memoize calculated values
  const numberOfQuestions = useMemo(() => 
    jobData.numberOfQuestions !== undefined ? Math.max(5, jobData.numberOfQuestions) : 5,
    [jobData.numberOfQuestions]
  )

  const demoVideoDuration = useMemo(() => 
    jobData.demoVideoDuration !== undefined ? Math.max(2, jobData.demoVideoDuration) : 2,
    [jobData.demoVideoDuration]
  )

  const demoVideoPassingScore = useMemo(() => 
    jobData.demoVideoPassingScore !== undefined ? Math.max(1, jobData.demoVideoPassingScore) : 1,
    [jobData.demoVideoPassingScore]
  )

  return (
    <div className="space-y-4">
      {/* Job Header */}
      <div className="border-b border-gray-200 pb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-3">{jobData.jobTitle}</h2>
        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
          <JobInfoItem icon={Clock}>
            {capitalizedExperience}
          </JobInfoItem>
          <JobInfoItem icon={GraduationCap}>
            {capitalizedEmploymentType}
          </JobInfoItem>
          {openingsDisplay && (
            <JobInfoItem icon={Users}>
              {openingsDisplay}
            </JobInfoItem>
          )}
          {salaryDisplay && (
            <JobInfoItem icon={IndianRupee}>
              {salaryDisplay}
            </JobInfoItem>
          )}
        </div>
      </div>

      {/* About the Job */}
      <Section title="About the Job">
        <div className="text-gray-600 whitespace-pre-line leading-relaxed">
          {jobData.jobDescription}
        </div>
      </Section>

      {/* Subjects */}
      <Section title="Subjects">
        <div className="flex flex-wrap gap-2">
          {jobData.subjects.map((subject) => (
            <Badge 
              key={subject} 
              className="hover:bg-blue-100 border border-blue-200 px-3 py-1.5 text-sm font-medium"
            >
              {subject}
            </Badge>
          ))}
        </div>
      </Section>

      {/* Grade Levels */}
      <Section title="Grade Levels">
        <div className="flex flex-wrap gap-2">
          {jobData.gradeLevel.map((grade) => (
            <Badge 
              key={grade} 
              variant="outline" 
              className="border-gray-300 px-3 py-1.5 text-sm font-medium"
            >
              {grade}
            </Badge>
          ))}
        </div>
      </Section>

      {/* Assessment Info */}
      <Section title="Assessment Process">
        <div className="space-y-2">
          {jobData.includeSubjectTest && (
            <AssessmentCard className="bg-gradient-to-r from-purple-50 to-purple-100/50 border-purple-200">
              <span className="text-gray-900 font-medium">
                MCQ Assessment
              </span>
              <div className="flex flex-wrap gap-2 mt-2">
                {capitalizedDifficulty && (
                  <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 bg-white">
                    {capitalizedDifficulty}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-white">
                  {numberOfQuestions} Questions
                </Badge>
                {jobData.minimumPassingMarks !== undefined && (
                  <Badge variant="outline" className="text-xs border-green-300 text-green-700 bg-white">
                    {jobData.minimumPassingMarks}% Pass Mark
                  </Badge>
                )}
              </div>
            </AssessmentCard>
          )}
          
          {jobData.demoVideoDuration !== undefined && jobData.demoVideoDuration >= 0 && (
            <AssessmentCard className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-200">
              <span className="text-gray-900 font-medium">
                Teaching demo video
              </span>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-white">
                  {demoVideoDuration} min
                </Badge>
                {jobData.demoVideoPassingScore !== undefined && (
                  <Badge variant="outline" className="text-xs border-green-300 text-green-700 bg-white">
                    Pass Score: {demoVideoPassingScore}/10
                  </Badge>
                )}
              </div>
            </AssessmentCard>
          )}
          
          {jobData.includeInterview && jobData.interviewQuestions.length > 0 && (
            <AssessmentCard className="bg-gradient-to-r from-indigo-50 to-indigo-100/50 border-indigo-200">
              <span className="text-gray-900 font-medium">
                {capitalizedInterviewFormat} interview
              </span>
            </AssessmentCard>
          )}
        </div>
      </Section>
    </div>
  )
})
ReviewAndPublish.displayName = 'ReviewAndPublish'