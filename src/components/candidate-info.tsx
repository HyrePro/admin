"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  GraduationCap,
  Briefcase,
  Calendar
} from "lucide-react";
import { type CandidateInfo as CandidateInfoType } from "@/lib/supabase/api/get-job-application";

interface CandidateInfoProps {
  candidateInfo: CandidateInfoType;
}

export function CandidateInfo({ candidateInfo }: CandidateInfoProps) {
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-gray-500" />
            <div>
              <div className="text-sm font-medium">Email</div>
              <div className="text-sm text-gray-600">{candidateInfo.email}</div>
            </div>
          </div>
          
          {candidateInfo.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm font-medium">Phone</div>
                <div className="text-sm text-gray-600">{candidateInfo.phone}</div>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-gray-500" />
            <div>
              <div className="text-sm font-medium">Location</div>
              <div className="text-sm text-gray-600">{candidateInfo.city}, {candidateInfo.state}</div>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Subjects and Grade Levels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Subjects</h4>
          <div className="flex flex-wrap gap-2">
            {candidateInfo.subjects.map((subject) => (
              <Badge
                key={subject}
                variant="secondary"
                className="bg-indigo-50 text-indigo-700 border-indigo-200"
              >
                {subject}
              </Badge>
            ))}
          </div>
        </div>

        {candidateInfo.grade_levels && candidateInfo.grade_levels.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Grade Levels</h4>
            <div className="flex flex-wrap gap-2">
              {candidateInfo.grade_levels.map((grade) => (
                <Badge
                  key={grade}
                  variant="secondary"
                  className="bg-blue-50 text-blue-600 border-blue-200"
                >
                  {grade}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Resume */}
      {candidateInfo.resume_url && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Resume</h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-gray-500" />
              <div>
                <a 
                  href={candidateInfo.resume_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium"
                >
                  {candidateInfo.resume_file_name || 'View Resume'}
                </a>
                <div className="text-xs text-gray-500">Click to download or view</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Education */}
      {candidateInfo.education_qualifications && candidateInfo.education_qualifications.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Education Qualifications
          </h4>
          <div className="space-y-4">
            {candidateInfo.education_qualifications.map((edu, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="font-semibold text-gray-900">{edu.degree}</div>
                    <div className="text-gray-600">{edu.institution}</div>
                    {edu.specialization && (
                      <div className="text-sm text-gray-500 mt-1">Specialization: {edu.specialization}</div>
                    )}
                  </div>
                  <div className="text-right md:text-left">
                    <div className="text-sm text-gray-500">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teaching Experience */}
      {candidateInfo.teaching_experience && candidateInfo.teaching_experience.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Teaching Experience
          </h4>
          <div className="space-y-4">
            {candidateInfo.teaching_experience.map((exp, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="font-semibold text-gray-900">{exp.designation}</div>
                    <div className="text-gray-600">{exp.school}</div>
                    <div className="text-sm text-gray-500">{exp.city}</div>
                  </div>
                  <div className="text-right md:text-left">
                    <div className="text-sm text-gray-500">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}