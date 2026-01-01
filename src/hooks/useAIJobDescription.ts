// hooks/useAIJobDescription.ts
import { useState } from 'react';

interface JobDescriptionPayload {
  job_title: string;
  subjects_to_teach: string[] | string;
  grade: string;
  employment_type: string;
  experience: string;
  board: string;
  school_type: string;
  school_name: string;
  salary_range?: string;
  existing_job_description?: string;
}

interface JobDescription {
  title: string;
  school_overview: string;
  role_summary: string;
  key_responsibilities: string[];
  required_qualifications: string[];
  preferred_qualifications: string[];
  experience_requirements: string;
  employment_details: string;
  salary_information: string;
  application_notes: string;
}

interface GenerateResponse {
  success: boolean;
  optimized: boolean;
  job_description: JobDescription;
  quota?: {
    remaining_hour: number;
    remaining_day: number;
  };
}

interface RateLimitError {
  error: string;
  reason: string;
  limit: number;
  reset_at: string;
  message: string;
}

export function useAIJobDescription() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitError | null>(null);

  const generateJobDescription = async (
    payload: JobDescriptionPayload
  ): Promise<JobDescription | null> => {
    setLoading(true);
    setError(null);
    setRateLimitInfo(null);

    try {
      const response = await fetch('/api/ai/generate-job-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setRateLimitInfo(data);
          setError(data.message);
        } else if (response.status === 401) {
          setError('Please log in to use AI generation');
        } else {
          setError(data.error || 'Failed to generate job description');
        }
        return null;
      }

      const result = data as GenerateResponse;
      return result.job_description;
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    generateJobDescription,
    loading,
    error,
    rateLimitInfo,
  };
}

// ============================================
// Component Example
// ============================================

// 'use client';

// import { useState } from 'react';
// import { useAIJobDescription } from '@/hooks/useAIJobDescription';

// interface AIGenerateButtonProps {
//   formData: JobDescriptionPayload;
//   onGenerated: (description: JobDescription) => void;
//   disabled?: boolean;
// }

// export function AIGenerateButton({ 
//   formData, 
//   onGenerated, 
//   disabled 
// }: AIGenerateButtonProps) {
//   const { generateJobDescription, loading, error, rateLimitInfo } = useAIJobDescription();
//   const [showError, setShowError] = useState(false);

//   const handleGenerate = async () => {
//     const result = await generateJobDescription(formData);
    
//     if (result) {
//       onGenerated(result);
//     } else {
//       setShowError(true);
//       setTimeout(() => setShowError(false), 5000);
//     }
//   };

//   return (
//     <div className="space-y-2">
//       <button
//         onClick={handleGenerate}
//         disabled={disabled || loading}
//         className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
//       >
//         {loading ? (
//           <>
//             <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
//               <circle
//                 className="opacity-25"
//                 cx="12"
//                 cy="12"
//                 r="10"
//                 stroke="currentColor"
//                 strokeWidth="4"
//                 fill="none"
//               />
//               <path
//                 className="opacity-75"
//                 fill="currentColor"
//                 d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//               />
//             </svg>
//             <span>Generating...</span>
//           </>
//         ) : (
//           <>
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//             </svg>
//             <span>
//               {formData.existing_job_description ? 'Optimize with AI' : 'Generate with AI'}
//             </span>
//           </>
//         )}
//       </button>

//       {/* Error Display */}
//       {showError && error && (
//         <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
//           <p className="text-sm text-red-800">{error}</p>
//           {rateLimitInfo && (
//             <p className="text-xs text-red-600 mt-1">
//               Limit: {rateLimitInfo.limit} requests. 
//               Resets: {new Date(rateLimitInfo.reset_at).toLocaleTimeString()}
//             </p>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// // ============================================
// // Full Form Example with AI Integration
// // ============================================

// export function JobPostingForm() {
//   const [formData, setFormData] = useState<JobDescriptionPayload>({
//     job_title: '',
//     subjects_to_teach: [],
//     grade: '',
//     employment_type: '',
//     experience: '',
//     board: '',
//     school_type: '',
//     school_name: '',
//     salary_range: '',
//     existing_job_description: '',
//   });

//   const [generatedDescription, setGeneratedDescription] = useState<JobDescription | null>(null);

//   const handleGenerated = (description: JobDescription) => {
//     setGeneratedDescription(description);
    
//     // Auto-fill form fields with generated content
//     setFormData(prev => ({
//       ...prev,
//       job_title: description.title,
//       existing_job_description: JSON.stringify(description, null, 2), // or format as needed
//     }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     // Submit the job posting with the generated/optimized description
//     console.log('Submitting job with description:', generatedDescription);
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto p-6">
//       <div className="grid grid-cols-2 gap-4">
//         <div>
//           <label className="block text-sm font-medium mb-2">Job Title *</label>
//           <input
//             type="text"
//             value={formData.job_title}
//             onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
//             className="w-full px-3 py-2 border rounded-lg"
//             required
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium mb-2">School Name *</label>
//           <input
//             type="text"
//             value={formData.school_name}
//             onChange={(e) => setFormData(prev => ({ ...prev, school_name: e.target.value }))}
//             className="w-full px-3 py-2 border rounded-lg"
//             required
//           />
//         </div>

//         {/* Add other form fields similarly */}
//       </div>

//       {/* AI Generate Button */}
//       <div className="border-t pt-6">
//         <h3 className="text-lg font-semibold mb-3">Job Description</h3>
//         <AIGenerateButton
//           formData={formData}
//           onGenerated={handleGenerated}
//           disabled={!formData.job_title || !formData.school_name}
//         />
//       </div>

//       {/* Display Generated Description */}
//       {generatedDescription && (
//         <div className="mt-6 p-6 bg-gray-50 rounded-lg space-y-4">
//           <h4 className="font-bold text-xl">{generatedDescription.title}</h4>
          
//           <div>
//             <h5 className="font-semibold">School Overview</h5>
//             <p className="text-sm text-gray-700">{generatedDescription.school_overview}</p>
//           </div>

//           <div>
//             <h5 className="font-semibold">Role Summary</h5>
//             <p className="text-sm text-gray-700">{generatedDescription.role_summary}</p>
//           </div>

//           <div>
//             <h5 className="font-semibold">Key Responsibilities</h5>
//             <ul className="list-disc list-inside text-sm text-gray-700">
//               {generatedDescription.key_responsibilities.map((resp, i) => (
//                 <li key={i}>{resp}</li>
//               ))}
//             </ul>
//           </div>

//           {/* Add other sections */}
//         </div>
//       )}

//       <button
//         type="submit"
//         className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//       >
//         Publish Job Posting
//       </button>
//     </form>
//   );
// }