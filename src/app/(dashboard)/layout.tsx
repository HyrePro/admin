"use client"

import { useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Bell, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function DashboardShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const pathname = usePathname();

  // Title based on top-level path (e.g., "/applied-jobs", "/assessments").
  const pageTitle = useMemo(() => {
    if (!pathname || pathname === "/") return "Dashboard";
    const segs = pathname.split("/").filter(Boolean);
    const first = segs[0];
    const mapping: Record<string, string> = {
      "jobs": "Jobs",
      "profile": "My Profile",
      "help": "Help & Support",
      "settings": "Settings",
    };
    return mapping[first] ?? first.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }, [pathname]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="p-8">Authenticating...</div>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto flex items-center gap-2 px-4">
            <Link href="/create-job-post" passHref>
            <Button asChild variant="default" size="sm" className="sm:flex bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <span>+ Create Job Post</span>
            </Button>
          </Link>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Messages">
                  <MessageSquare className="size-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="p-3 border-b flex items-center justify-between">
                  <div className="font-medium">Messages</div>
                  <button className="text-xs text-primary hover:underline">New message</button>
                </div>
                <div className="max-h-80 overflow-auto divide-y">
                  <div className="p-3 hover:bg-accent/40 cursor-pointer">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>Recruiter - Greenfield High</span>
                      <span className="text-[11px] text-muted-foreground">5m</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Hi! Thanks for applying. Are you available for a quick call tomorrow?</div>
                  </div>
                </div>
                <div className="p-2 text-center text-xs text-muted-foreground border-t">
                  View all messages
                </div>
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
                  <Bell className="size-5" />
                  <span className="absolute right-2 top-2 inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="p-3 border-b flex items-center justify-between">
                  <div className="font-medium">Notifications</div>
                  <button className="text-xs text-primary hover:underline">Mark all as read</button>
                </div>
                <div className="max-h-80 overflow-auto divide-y">
                  <div className="p-3 hover:bg-accent/40 cursor-pointer">
                    <div className="text-sm font-medium">Application update</div>
                    <div className="text-xs text-muted-foreground">Your Math Teacher application status changed to Under Review.</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">2h ago</div>
                  </div>
                </div>
                <div className="p-2 text-center text-xs text-muted-foreground border-t">
                  View all notifications
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

