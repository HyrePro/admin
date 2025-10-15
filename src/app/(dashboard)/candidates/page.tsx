export default function Page() {
  return (
    <div className="p-2">
      <h1 className="text-xl font-semibold">Help & Support</h1>
    </div>
  );
}


// // ... existing code ...
// 'use client'
// import { useEffect, useState } from 'react';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { Button } from '@/components/ui/button';
// import { Search } from 'lucide-react';
// import { Badge } from '@/components/ui/badge';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { createClient } from '@/lib/supabase/api/server';

// export default function CandidatesPage() {
//   const [candidates, setCandidates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [statusFilter, setStatusFilter] = useState('All');
//   const [jobTitleFilter, setJobTitleFilter] = useState('All');
//   const [assessmentFilter, setAssessmentFilter] = useState('All');

//   // Fetch candidates data
//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         setLoading(true);
//         const supabase = createClient();

//         // Get current user's school_id
//         const { data: userData } = await supabase.auth.getUser();
//         if (!userData?.user) return;
        
//         const { data: userSchoolData } = await supabase
//           .from('users')
//           .select('school_id')
//           .eq('id', userData.user.id)
//           .single();
        
//         const schoolId = userSchoolData?.school_id;
        
//         if (!schoolId) return;
        
//         // Fetch job applications with applicant info
//         const { data: applications, error } = await supabase
//           .from('job_applications')
//           .select(`
//             id,
//             job_id,
//             status,
//             score,
//             demo_score,
//             submitted_at,
//             applicant_id,
//             jobs.title as job_title,
//             applicant_info.first_name,
//             applicant_info.last_name,
//             applicant_info.email,
//             applicant_info.city,
//             applicant_info.subjects
//           `)
//           .join('jobs', 'jobs.id', 'job_applications.job_id')
//           .join('applicant_info', 'applicant_info.id', 'job_applications.applicant_id')
//           .eq('jobs.school_id', schoolId)
//           .order('submitted_at', { ascending: false });
        
//         if (error) throw error;
        
//         // Transform data for display
//         const transformedCandidates = applications.map(app => ({
//           id: app.id,
//           jobTitle: app.job_title,
//           status: app.status,
//           score: app.score || app.demo_score || 0,
//           submittedAt: app.submitted_at,
//           firstName: app.first_name,
//           lastName: app.last_name,
//           email: app.email,
//           city: app.city,
//           subjects: app.subjects || []
//         }));
        
//         setCandidates(transformedCandidates);
//       } catch (error) {
//         console.error('Error fetching candidates:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCandidates();
//   }, []);

//   // Filter candidates based on search and filters
//   const filteredCandidates = candidates.filter(candidate => {
//     const matchesSearch = 
//       candidate.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       candidate.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       candidate.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
//     const matchesStatus = statusFilter === 'All' || candidate.status === statusFilter;
//     const matchesJobTitle = jobTitleFilter === 'All' || candidate.jobTitle === jobTitleFilter;
//     const matchesAssessment = assessmentFilter === 'All' || 
//       (candidate.score >= 70 && assessmentFilter === 'Passed') ||
//       (candidate.score < 70 && assessmentFilter === 'Failed');
    
//     return matchesSearch && matchesStatus && matchesJobTitle && matchesAssessment;
//   });

//   // Format assessment result
//   const getAssessmentStatus = (score) => {
//     if (score >= 70) return 'Passed';
//     return 'Failed';
//   };

//   // Format status badge
//   const getStatusBadge = (status) => {
//     const statusConfig = {
//       'in_progress': { text: 'New', color: 'bg-gray-100 text-gray-800' },
//       'reviewed': { text: 'Reviewed', color: 'bg-blue-100 text-blue-800' },
//       'interview': { text: 'Interview', color: 'bg-blue-100 text-blue-800' },
//       'offer': { text: 'Offer', color: 'bg-green-100 text-green-800' },
//       'rejected': { text: 'Rejected', color: 'bg-red-100 text-red-800' }
//     };
    
//     return statusConfig[status] || statusConfig['in_progress'];
//   };

//   return (
//     <div className="space-y-6">
//       {/* Search and Filters */}
//       <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
//         <div className="relative flex-1 max-w-md">
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//           <input
//             type="text"
//             placeholder="Search candidates by name, job, or skill..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           />
//         </div>
        
//         <div className="flex gap-2">
//           <select
//             value={statusFilter}
//             onChange={(e) => setStatusFilter(e.target.value)}
//             className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           >
//             <option value="All">Status: All</option>
//             <option value="in_progress">New</option>
//             <option value="reviewed">Reviewed</option>
//             <option value="interview">Interview</option>
//             <option value="offer">Offer</option>
//             <option value="rejected">Rejected</option>
//           </select>
          
//           <select
//             value={jobTitleFilter}
//             onChange={(e) => setJobTitleFilter(e.target.value)}
//             className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           >
//             <option value="All">Job Title: All</option>
//             {/* Job titles will be populated dynamically */}
//           </select>
          
//           <select
//             value={assessmentFilter}
//             onChange={(e) => setAssessmentFilter(e.target.value)}
//             className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           >
//             <option value="All">Assessment: All</option>
//             <option value="Passed">Passed</option>
//             <option value="Failed">Failed</option>
//           </select>
          
//           <Button variant="default" className="px-4 py-2">
//             Apply Filters
//           </Button>
          
//           <Button variant="outline" className="px-4 py-2">
//             Clear All
//           </Button>
//         </div>
//       </div>

//       {/* Candidates Table */}
//       <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead className="w-20">CANDIDATE</TableHead>
//               <TableHead>JOBS APPLIED</TableHead>
//               <TableHead>STATUS</TableHead>
//               <TableHead>ASSESSMENT</TableHead>
//               <TableHead>DATE APPLIED</TableHead>
//               <TableHead>SKILLS</TableHead>
//               <TableHead>ACTIONS</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {loading ? (
//               <TableRow>
//                 <TableCell colSpan={7} className="text-center py-8">
//                   Loading candidates...
//                 </TableCell>
//               </TableRow>
//             ) : filteredCandidates.length > 0 ? (
//               filteredCandidates.map((candidate) => (
//                 <TableRow key={candidate.id}>
//                   <TableCell className="flex items-center space-x-3">
//                     <Avatar className="h-8 w-8">
//                       <AvatarImage src={`https://avatar.vercel.sh/${candidate.firstName} ${candidate.lastName}`} alt={`${candidate.firstName} ${candidate.lastName}`} />
//                       <AvatarFallback>{candidate.firstName.charAt(0)}{candidate.lastName.charAt(0)}</AvatarFallback>
//                     </Avatar>
//                     <div>
//                       <p className="font-medium">{candidate.firstName} {candidate.lastName}</p>
//                       <p className="text-sm text-gray-500">{candidate.email}</p>
//                     </div>
//                   </TableCell>
                  
//                   <TableCell>{candidate.jobTitle}</TableCell>
                  
//                   <TableCell>
//                     <Badge className={`${getStatusBadge(candidate.status).color}`}>
//                       {getStatusBadge(candidate.status).text}
//                     </Badge>
//                   </TableCell>
                  
//                   <TableCell>
//                     <Badge 
//                       className={`${
//                         getAssessmentStatus(candidate.score) === 'Passed' 
//                           ? 'bg-green-100 text-green-800' 
//                           : 'bg-red-100 text-red-800'
//                       }`}
//                     >
//                       {getAssessmentStatus(candidate.score)} ({Math.round(candidate.score || 0)}%)
//                     </Badge>
//                   </TableCell>
                  
//                   <TableCell>{candidate.submittedAt ? new Date(candidate.submittedAt).toLocaleDateString() : '-'}</TableCell>
                  
//                   <TableCell>
//                     <div className="flex flex-wrap gap-1">
//                       {candidate.subjects && candidate.subjects.map((subject, index) => (
//                         <Badge key={index} variant="secondary" className="text-xs">
//                           {subject}
//                         </Badge>
//                       ))}
//                     </div>
//                   </TableCell>
                  
//                   <TableCell className="flex gap-2">
//                     <Button variant="outline" size="sm" className="flex items-center gap-1">
//                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                         <path d="M21 16v2a4 4 0 0 1-4 4H5a4 4 0 0 1-4-4v-2"></path>
//                         <circle cx="8.5" cy="7" r="4"></circle>
//                         <line x1="20.5" y1="7" x2="16" y2="12"></line>
//                         <line x1="4" y1="12" x2="8.5" y2="7"></line>
//                       </svg>
//                       View Profile
//                     </Button>
//                     <Button variant="outline" size="sm" className="flex items-center gap-1">
//                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                         <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
//                         <polyline points="22,6 12,13 2,6"></polyline>
//                       </svg>
//                       Contact
//                     </Button>
//                   </TableCell>
//                 </TableRow>
//               ))
//             ) : (
//               <TableRow>
//                 <TableCell colSpan={7} className="text-center py-8">
//                   No candidates found matching your criteria.
//                 </TableCell>
//               </TableRow>
//             )}
//           </TableBody>
//         </Table>
//       </div>
//     </div>
//   );
// }