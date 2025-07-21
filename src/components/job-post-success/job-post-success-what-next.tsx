import { Card, CardContent } from "@/components/ui/card"

export default function JobPostSuccessWhatNext() {
  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="p-6">
        <h3 className="font-semibold text-blue-900 mb-4">What Happens Next?</h3>
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3 mt-0.5 text-sm font-semibold">
              1
            </div>
            <div>
              <p className="font-medium">Teachers Apply</p>
              <p className="text-sm text-gray-600">Candidates complete assessments and submit demo videos</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3 mt-0.5 text-sm font-semibold">
              2
            </div>
            <div>
              <p className="font-medium">AI Evaluation</p>
              <p className="text-sm text-gray-600">Applications are automatically scored and ranked</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3 mt-0.5 text-sm font-semibold">
              3
            </div>
            <div>
              <p className="font-medium">You Review</p>
              <p className="text-sm text-gray-600">Access structured reports and shortlist candidates</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 