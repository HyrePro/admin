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
  }
}

export function ReviewAndPublish({ jobData }: ReviewAndPublishProps) {
  // Remove all state and handlers
  return (
    <div className="space-y-6">
      {/* Job Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">{jobData.jobTitle}</h2>
        <p className="text-lg text-gray-600 mb-4">{jobData.schoolName}</p>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            {jobData.location ?? "Mumbai"}
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {jobData.experience} experience
          </div>
          <div className="flex items-center">
            <GraduationCap className="w-4 h-4 mr-1" />
            {jobData.employmentType}
          </div>
          {(jobData.salaryMin || jobData.salaryMax) && (
            <div className="flex items-center">
              <IndianRupee className="w-4 h-4 mr-1" />
              {jobData.salaryMin && jobData.salaryMax
                ? `₹${jobData.salaryMin} - ₹${jobData.salaryMax}`
                : jobData.salaryMin
                ? `₹${jobData.salaryMin}+`
                : `Up to ₹${jobData.salaryMax}`}
            </div>
          )}
        </div>
      </div>

      {/* Subjects and Grades */}
      <div>
        <h3 className="font-medium text-gray-900 mb-2">About the Job</h3>
        <div className="text-gray-700 whitespace-pre-line mb-4">
          {jobData.jobDescription}
        </div>
      </div>
      <div>
        <h3 className="font-medium text-gray-900 mb-2">Subjects</h3>
        <div className="flex flex-wrap gap-2">
          {jobData.subjects.map((subject) => (
            <Badge key={subject} className="bg-purple-100 text-purple-700 hover:bg-purple-100">
              {subject}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-2">Grade Levels</h3>
        <div className="flex flex-wrap gap-2">
          {jobData.gradeLevel.map((grade) => (
            <Badge key={grade} variant="outline" className="border-gray-300">
              {grade}
            </Badge>
          ))}
        </div>
      </div>

      {/* Assessment Info */}
      <div>
        <h3 className="font-medium text-gray-900 mb-2">Assessment Process</h3>
        <div className="space-y-2">
          {jobData.includeSubjectTest && (
            <div className="flex items-center p-3 bg-purple-50 rounded-lg">
              <Target className="w-5 h-5 text-purple-600 mr-3" />
              <span className="text-gray-700">
                Assesment test
              </span>
            </div>
          )}
          {jobData.demoVideoDuration && (
            <div className="flex items-center p-3 bg-purple-50 rounded-lg">
              <Video className="w-5 h-5 text-purple-600 mr-3" />
              <span className="text-gray-700">Teaching demo video</span>
            </div>
          )}
          {jobData.includeInterview && jobData.interviewQuestions.length > 0 && (
            <div>
              <div className="flex items-center p-3 bg-purple-50 rounded-lg mb-3">
                <Users className="w-5 h-5 text-purple-600 mr-3" />
                <span className="text-gray-700">
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