"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  GraduationCap,
  Briefcase,
  Calendar,
  Download,
  ExternalLink
} from "lucide-react";
import { type CandidateInfo as CandidateInfoType } from "@/lib/supabase/api/get-job-application";
import { downloadFile, forceDownload } from "@/lib/utils";

interface CandidateInfoProps {
  candidateInfo: CandidateInfoType;
}

export function CandidateInfo({ candidateInfo }: CandidateInfoProps) {
  const [isDownloading, setIsDownloading] = React.useState(false);
  
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleResumeDownload = async () => {
    if (!candidateInfo.resume_url || isDownloading) return;
    
    setIsDownloading(true);
    try {
      // Try force download method first
      forceDownload(candidateInfo.resume_url, candidateInfo.resume_file_name || 'resume.pdf');
    } finally {
      // Reset loading state after a short delay
      setTimeout(() => setIsDownloading(false), 1000);
    }
  };

  const handleAlternativeDownload = async () => {
    if (!candidateInfo.resume_url) return;
    
    try {
      await downloadFile(candidateInfo.resume_url, candidateInfo.resume_file_name || 'resume.pdf');
    } catch (error) {
      console.error('Alternative download failed:', error);
    }
  };

  return (
    <div className="space-y-4">
      <ToastContainer position="top-right" autoClose={3000} />
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">
                    {candidateInfo.resume_file_name || 'Resume.pdf'}
                  </div>
                  <div className="text-xs text-gray-500">PDF Document</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(candidateInfo.resume_url, '_blank')}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View
                </Button>
                <Button
                  size="sm"
                  onClick={handleResumeDownload}
                  disabled={isDownloading}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isDownloading ? 'Downloading...' : 'Download'}
                </Button>
                
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Education */}
      {candidateInfo.education_qualifications && candidateInfo.education_qualifications.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Education Qualifications
          </h4>
          <div className="space-y-3">
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
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Teaching Experience
          </h4>
          <div className="space-y-3">
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