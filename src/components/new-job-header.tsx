import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { IconX } from "@tabler/icons-react"
import { useRouter } from "next/navigation"

export function NewJobHeader() {
  const router = useRouter();
  return (
    <header className="fixed top-0 left-0 w-full z-10 bg-white flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6 py-2">
        <a href="#">
          {/* <IconInnerShadowTop className="!size-5" /> */}
          <span className="text-base font-semibold">HyrePro</span>
        </a>
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">New Job Post</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="sm:flex" >
            Save Draft
          </Button>
          <Button variant="outline" size="icon" className="sm:flex" title="Close" onClick={() => router.back()}>
            <IconX />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </div>
    </header>
  )
}