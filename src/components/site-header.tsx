import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { IconMail } from "@tabler/icons-react"
import { IconBell } from "@tabler/icons-react"
import Link from "next/link"

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Documents</h1>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/create-job-post" passHref>
            <Button asChild variant="default" size="sm" className="hidden sm:flex">
              <span>+ Create Job Post</span>
            </Button>
          </Link>
          <Button variant="outline" size="icon" className="hidden sm:flex" title="Inbox">
            <IconMail />
            <span className="sr-only">Inbox</span>
          </Button>
          <Button variant="outline" size="icon" className="hidden sm:flex" title="Notifications">
            <IconBell />
            <span className="sr-only">Notifications</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
