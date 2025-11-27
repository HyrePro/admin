import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"

export default function JobPostSuccessHeader() {
  const router = useRouter();
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6 py-2">
        <a href="#">
          <span className="text-base font-semibold">Hyriki</span>
        </a>
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Job Post</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="default" size="sm" className="hidden sm:flex" onClick={() => router.push('/')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </header>
  )
} 