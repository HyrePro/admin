import React, { useState } from 'react';
import { Clock, Mail, Phone, MapPin, Users, X, ChevronLeft, ChevronRight, MoreVertical, Plus, FileText, MessageSquare, Calendar } from 'lucide-react';

const InterviewDetailSheet = () => {
  const [isOpen, setIsOpen] = useState(true);

  const interview = {
    id: '7781',
    date: 'Mon 17',
    time: '11:00 AM - 12:00 AM',
    status: 'scheduled',
    candidate: { 
      name: 'Yahyo Prayogo Diningrat', 
      email: 'yahyopo@gmail.com', 
      phone: '+62 123 123 1234', 
      id: '#7781' 
    },
    job: { 
      title: 'Math Teacher', 
      id: '#7781', 
      stage: 'Shortlist', 
      endDate: '20 Oct, 2025' 
    },
    interviewers: [
      { name: 'Ahmad Zainy', role: 'Interviewer' },
      { name: 'Lydia Workman', role: 'Interviewer' }
    ],
    location: 'https://meeting.example.com/room/abc123',
    note: "Don't forget to record key feedback during the session for evaluation.",
    duration: '1 hour',
    gmtOffset: 'GMT+8'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Interview Detail</h2>
          <div className="flex items-center gap-3">
            <button className="text-gray-400 hover:text-gray-600">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="text-gray-400 hover:text-gray-600">
              <ChevronRight className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-500">01 of 100</span>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Schedule Info */}
        <div className="border-b px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <span>{interview.date}</span>
              </div>
              <div className="font-semibold text-lg text-gray-900">{interview.time}</div>
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1 text-blue-600">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Scheduled
                </span>
                <span>ID: {interview.id}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {interview.gmtOffset}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {interview.duration}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
                Start Meeting
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b px-6 flex gap-6">
          <button className="py-3 text-sm font-medium border-b-2 border-purple-600 text-purple-600">
            Detail Information
          </button>
          <button className="py-3 text-sm font-medium text-gray-600 hover:text-gray-900">
            Video Recording
          </button>
          <button className="py-3 text-sm font-medium text-gray-600 hover:text-gray-900">
            Interviewer Note
          </button>
          <button className="py-3 text-sm font-medium text-gray-600 hover:text-gray-900">
            Question
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Candidate Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Candidate and Applied Job</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                  Y
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">{interview.candidate.name}</h4>
                    <span className="text-blue-500">♂</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Candidate ID: {interview.candidate.id}</div>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <a href={`mailto:${interview.candidate.email}`} className="text-sm text-blue-600 hover:underline">
                      {interview.candidate.email}
                    </a>
                    <a href={`tel:${interview.candidate.phone}`} className="text-sm text-blue-600 hover:underline">
                      {interview.candidate.phone}
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="font-semibold text-gray-900 mb-2">{interview.job.title}</div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span>Job ID: {interview.job.id}</span>
                  <span className="flex items-center gap-1">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {interview.job.stage}
                    </span>
                  </span>
                  <span>End date: {interview.job.endDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interview Information */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Interview Information</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Participant
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                      Y
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{interview.candidate.name}</div>
                      <div className="text-xs text-gray-500">Candidate</div>
                    </div>
                  </div>
                  {interview.interviewers.map((interviewer, idx) => (
                    <div key={idx} className="flex items-center gap-3 justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 text-sm font-medium">
                          {interviewer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{interviewer.name}</div>
                          <div className="text-xs text-gray-500">{interviewer.role}</div>
                        </div>
                      </div>
                      <button className="text-red-500 hover:text-red-700">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1 font-medium">
                    <Plus className="w-4 h-4" />
                    Add participant
                  </button>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </div>
                <a href={interview.location} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                  {interview.location}
                </a>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Note
                </div>
                <p className="text-sm text-gray-700 mb-2">{interview.note}</p>
                <button className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1 font-medium">
                  <FileText className="w-4 h-4" />
                  Edit note
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewDetailSheet;