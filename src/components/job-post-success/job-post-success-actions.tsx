import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function JobPostSuccessActions() {
  return (
    <div className="flex flex-col sm:flex-row gap-3 pt-2">
      <Link href="/" className="flex-1 sm:flex-none">
        <Button size="lg" className="w-full sm:w-auto">
          Go to Dashboard
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </Link>
      <Link href="/post-job" className="flex-1 sm:flex-none">
        <Button size="lg" variant="outline" className="w-full sm:w-auto border-gray-300 hover:bg-gray-50">
          Post Another Job
        </Button>
      </Link>
    </div>
  )
}