import { CheckCircle } from "lucide-react"

export default function JobPostSuccessMessage() {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Posted Successfully</h1>
      <p className="text-sm text-gray-600 max-w-xl mx-auto leading-relaxed">
        Your job post has been submitted and is being set up. Once it goes live, teachers will be able to discover and apply for this position.
      </p>
    </div>
  )
}