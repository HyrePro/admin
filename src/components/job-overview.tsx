"use client";

interface JobOverviewProps {
  job: {
    id: string;
    title: string;
    status: string;
    subjects: string[];
    grade_levels: string[];
    job_type?: string;
    location?: string;
    mode?: string;
    board?: string;
    openings?: number;
    salary_range?: string;
    job_description?: string;
    responsibilities?: string;
    requirements?: string;
    created_at?: string;
    school_id?: string;
    number_of_questions?: number;
    assessment_difficulty?: {
      interviewFormat?: string;
      includeInterview?: boolean;
      demoVideoDuration?: number;
      interviewDuration?: number;
      includeSubjectTest?: boolean;
      subjectTestDuration?: number;
      interviewQuestions?: Array<{
        id: number;
        question: string;
      }>;
    };
    application_analytics?: {
      total_applications: number;
      assessment: number;
      demo: number;
      interviews: number;
      offered: number;
    };
  };
}

// Mock data for demonstration
const mockJob = {
  id: "1",
  title: "Math Teacher",
  status: "OPEN",
  subjects: ["Mathematics", "Physics"],
  grade_levels: ["9-12"],
  job_type: "Full Time",
  location: "Riyadh, Saudi Arabia",
  mode: "2-5 years",
  board: "Saudi Arabia",
  openings: 3,
  salary_range: "$8,000 - $12,000/weekly",
  job_description: "As a Math Teacher, you will play a vital role in shaping students' critical thinking and problem-solving skills through the delivery of well-structured and engaging lessons. You will be responsible for designing and implementing lessons that align with the school's academic standards—whether based on the national curriculum or an international framework—while ensuring that your teaching is adaptable to students with varying levels of ability.\n\nYou will be expected to create a dynamic and inclusive classroom environment that encourages inquiry, discussion, and independent thinking. In addition to classroom instruction, your role involves evaluating student progress through regular assessments, providing constructive feedback, and maintaining open communication with parents and colleagues. You should be adept at using educational technology and modern teaching methodologies to enhance the learning experience.\n\nBenefits:\n• Competitive salary based on qualifications and experience.\n• Health insurance coverage.\n• Professional development and training opportunities.\n• Opportunities for career advancement within the institution.\n• Paid annual leave and public holidays.\n• Modern and well-equipped teaching facilities.",
  responsibilities: "Sample responsibilities text",
  requirements: "Sample requirements text",
  created_at: "2025-01-10",
  school_id: "school-123",
  number_of_questions: 15,
  assessment_difficulty: {
    interviewFormat: "structured",
    includeInterview: true,
    demoVideoDuration: 10,
    interviewDuration: 45,
    includeSubjectTest: true,
    subjectTestDuration: 30
  },
  application_analytics: {
    total_applications: 45,
    assessment: 30,
    demo: 15,
    interviews: 8,
    offered: 2
  }
};

export function JobOverview({ job = mockJob }: Partial<JobOverviewProps>) {
  return (
    <div className="h-full bg-white">
      <div className="mx-auto px-6 py-6">
        <div className="flex gap-6 h-full">
          {/* Main Content - Left Side */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Job Description Section */}
            <div className="mb-6 flex-1">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">Job Description</h2>
               
              </div>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {job?.job_description || "No description provided."}
              </div>
            </div>

            

          
          </div>

          {/* Divider */}
          <div className="w-px bg-gray-200"></div>

          {/* Sidebar - Right Side */}
          <div className="flex-shrink-0 flex flex-col min-w-[15%]">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Job Detail</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs text-gray-600">Grades</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {job?.grade_levels?.join(', ') || 'Not specified'}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                   <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="text-xs text-gray-600">Subjects</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {job?.subjects?.join(', ') || 'Not specified'}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-xs text-gray-600">Workplace</span>
                </div>
                <p className="text-sm font-medium text-gray-900">On-Place</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs text-gray-600">Salary</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {job?.salary_range || 'Not specified'}
                </p>
              </div>

            
            </div>

            {/* Hiring Manager Section */}
            {/* <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-start gap-2 mb-3">
                <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-blue-900">
                  This hiring manager is for internal use only.
                </p>
              </div>

              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Hiring Manager</h3>
                <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                  + Assign
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-sm font-semibold text-purple-600">A</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Amanda Nur</p>
                    <p className="text-xs text-gray-600">HR Manager</p>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">Y</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Yahyo Prayogo</p>
                    <p className="text-xs text-gray-600">Head of Academic</p>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-sm font-semibold text-green-600">W</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Wildan Athok</p>
                    <p className="text-xs text-gray-600">English Coordinator</p>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}