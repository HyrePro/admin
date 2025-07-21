import { CheckCircle } from "lucide-react"

export default function JobPostSuccessMessage() {
  return (
    <div className="text-center mb-12">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Job Posted Successfully! 🎉</h1>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
        Your job post is now live and ready to receive applications. Start sharing the link to find your perfect
        teacher!
      </p>
    </div>
  )
} 