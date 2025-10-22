import React from "react"
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

// Types for interview questions and job data
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
    includeInterview?: boolean
    interviewFormat?: string
    interviewDuration?: number
    interviewQuestions: InterviewQuestion[]
    assessmentDifficulty?: string
    numberOfQuestions?: number
    minimumPassingMarks?: number
  }
}

export function ReviewAndPublish({ jobData }: ReviewAndPublishProps) {
  return (
    <div className="space-y-4">
      {/* Job Header */}
      <div className="border-b border-gray-200 pb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-3">{jobData.jobTitle}</h2>
        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-capitalize">{jobData.experience?.charAt(0).toUpperCase() + jobData.experience?.slice(1)}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
            <GraduationCap className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-capitalize">{jobData.employmentType?.charAt(0).toUpperCase() + jobData.employmentType?.slice(1)}</span>
          </div>
          {jobData.salaryMin && parseInt(jobData.salaryMin) > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <IndianRupee className="w-4 h-4 text-gray-500" />
              <span className="font-medium">
                {jobData.salaryMin && jobData.salaryMax
                  ? `₹${jobData.salaryMin} - ₹${jobData.salaryMax}`
                  : jobData.salaryMin
                  ? `₹${jobData.salaryMin}+`
                  : `Up to ₹${jobData.salaryMax}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* About the Job */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">About the Job</h3>
        <div className="text-gray-600 whitespace-pre-line leading-relaxed">
          {jobData.jobDescription}
        </div>
      </div>

      {/* Subjects */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Subjects</h3>
        <div className="flex flex-wrap gap-2">
          {jobData.subjects.map((subject) => (
            <Badge key={subject} className="hover:bg-blue-100 border border-blue-200 px-3 py-1.5 text-sm font-medium">
              {subject}
            </Badge>
          ))}
        </div>
      </div>

      {/* Grade Levels */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Levels</h3>
        <div className="flex flex-wrap gap-2">
          {jobData.gradeLevel.map((grade) => (
            <Badge key={grade} variant="outline" className="border-gray-300 px-3 py-1.5 text-sm font-medium">
              {grade}
            </Badge>
          ))}
        </div>
      </div>

      {/* Assessment Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Assessment Process</h3>
        <div className="space-y-2">
          {jobData.includeSubjectTest && (
            <div className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-lg border border-purple-200">
              <div className="flex-1">
                <span className="text-gray-900 font-medium">
                  Subject Assessment Test
                </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {jobData.assessmentDifficulty && (
                    <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 bg-white">
                      {jobData.assessmentDifficulty.charAt(0).toUpperCase() + jobData.assessmentDifficulty.slice(1)}
                    </Badge>
                  )}
                  {jobData.numberOfQuestions !== undefined && jobData.numberOfQuestions >= 0 && (
                    <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-white">
                      {Math.max(5, jobData.numberOfQuestions)} Questions
                    </Badge>
                  )}
                  {jobData.minimumPassingMarks !== undefined && (
                    <Badge variant="outline" className="text-xs border-green-300 text-green-700 bg-white">
                      {jobData.minimumPassingMarks}% Pass Mark
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
          {jobData.demoVideoDuration !== undefined && jobData.demoVideoDuration >= 0 && (
            <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-lg border border-blue-200">
              <div className="flex-1">
              
              <span className="text-gray-900 font-medium">
                Teaching demo video
                
              </span>
               <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-white">
                  {Math.max(2, jobData.demoVideoDuration)} min
                </Badge>
               </div>
               </div>
            </div>
          )}
          {jobData.includeInterview && jobData.interviewQuestions.length > 0 && (
            <div>
              <div className="flex items-center p-4 bg-gradient-to-r from-indigo-50 to-indigo-100/50 rounded-lg border border-indigo-200">
                <span className="text-gray-900 font-medium">
                  {(jobData.interviewFormat ? jobData.interviewFormat.charAt(0).toUpperCase() + jobData.interviewFormat.slice(1) : "Interview")} interview
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}