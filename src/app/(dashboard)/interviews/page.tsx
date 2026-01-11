import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import '@/styles/interview.css'
import InterviewCalendar from "@/components/interview-calendar";
import CandidatesList from "@/components/interview-candidates-list";



export default function Page() {
  return (
    <div className="interview-container">
      <div className="interview-header">
        <h1 className="interview-title">Interviews</h1>
        <Button
          variant="outline"
          className='btn-invite'
        >
          <Plus className="btn-icon" />
          Invite Candidate
        </Button>
      </div>
      {/* <div className="flex flex-col md:flex-row gap-4 w-full flex-1 min-h-0 px-4 pb-4"> */}
        {/* <div className="flex flex-col min-h-0 overflow-hidden"> */}
          <InterviewCalendar />
        {/* </div> */}
       {/* <div className="md:w-1/3 flex flex-col min-h-0 overflow-hidden">  */}
           {/* <CandidatesList /> */}
        {/* </div>  */}
      {/* </div> */}
    </div>
  );
}