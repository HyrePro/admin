import { Card } from "@/components/ui/card"
import { Eye, Share2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function JobPostSuccessNextSteps() {
  // Share on WhatsApp logic is handled in the share component, so here we just show the button
  const shareOnWhatsApp = () => {
    // This is a placeholder; in a real app, pass the job link as a prop or context
    window.open("https://wa.me/?text=Check%20out%20this%20teaching%20position!", "_blank")
  }

  return (
    <div className="grid md:grid-cols-3 gap-6 mb-8">
      <Card className="text-center p-6">
        <Eye className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h3 className="font-semibold mb-2">Monitor Applications</h3>
        <p className="text-sm text-gray-600 mb-4">
          Track applications and view AI-scored candidate reports in real-time
        </p>
        <Link href="/dashboard/jobs">
          <Button variant="outline" size="sm">
            View Dashboard
          </Button>
        </Link>
      </Card>

      <Card className="text-center p-6">
        <Share2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="font-semibold mb-2">Share Widely</h3>
        <p className="text-sm text-gray-600 mb-4">Share on WhatsApp groups, LinkedIn, and teacher communities</p>
        <Button variant="outline" size="sm" onClick={shareOnWhatsApp}>
          Share Now
        </Button>
      </Card>

      <Card className="text-center p-6">
        <CheckCircle className="w-12 h-12 text-purple-500 mx-auto mb-4" />
        <h3 className="font-semibold mb-2">Review & Hire</h3>
        <p className="text-sm text-gray-600 mb-4">Get structured reports and make informed hiring decisions</p>
        <Link href="/dashboard/jobs">
          <Button variant="outline" size="sm">
            View Applications
          </Button>
        </Link>
      </Card>
    </div>
  )
} 