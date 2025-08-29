import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function JobPostSuccessActions() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
      <Link href="/">
        <Button
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          Go to Dashboard
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </Link>
      <Link href="/post-job">
        <Button size="lg" variant="outline">
          Post Another Job
        </Button>
      </Link>
    </div>
  )
} 