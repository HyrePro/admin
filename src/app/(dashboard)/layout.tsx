"use client"

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbLink,
  BreadcrumbSeparator,
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
import { supabase } from "@/lib/supabase/api/client";
import { getJobApplication } from "@/lib/supabase/api/get-job-application";

export default function DashboardShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [jobTitle, setJobTitle] = useState<string | null>(null);
  const [candidateName, setCandidateName] = useState<string | null>(null);
  const [loadingJobTitle, setLoadingJobTitle] = useState(false);
  const [loadingCandidateName, setLoadingCandidateName] = useState(false);

  // Extract job ID and application ID from pathname
  const { jobId, applicationId } = useMemo(() => {
    const jobsMatch = pathname.match(/^\/jobs\/([^/]+)$/);
    const applicationMatch = pathname.match(/^\/jobs\/([^/]+)\/([^/]+)$/);
    
    if (applicationMatch) {
      return { 
        jobId: applicationMatch[1], 
        applicationId: applicationMatch[2] 
      };
    } else if (jobsMatch) {
      return { 
        jobId: jobsMatch[1], 
        applicationId: null 
      };
    }
    
    return { jobId: null, applicationId: null };
  }, [pathname]);

  // Fetch job title when we have a job ID
  useEffect(() => {
    if (!jobId) {
      setJobTitle(null);
      return;
    }

    const fetchJobTitle = async () => {
      setLoadingJobTitle(true);
      try {
        const { data, error } = await supabase.rpc("get_jobs_with_analytics", {
          p_school_id: '2317e986-3ebe-415e-b402-849d80f714a0',
          p_start_index: 0,
          p_end_index: 100,
          p_status: 'ALL',
        });

        if (error) {
          console.error("Error fetching job data:", error);
          setJobTitle("Job Details");
        } else {
          const job = data?.find((j: any) => j.id === jobId);
          setJobTitle(job?.title || "Job Details");
        }
      } catch (err) {
        console.error("Error fetching job title:", err);
        setJobTitle("Job Details");
      } finally {
        setLoadingJobTitle(false);
      }
    };

    fetchJobTitle();
  }, [jobId]);

  // Fetch candidate name when we have an application ID
  useEffect(() => {
    if (!applicationId) {
      setCandidateName(null);
      return;
    }

    const fetchCandidateName = async () => {
      setLoadingCandidateName(true);
      try {
        const result = await getJobApplication(applicationId);
        
        if (result.error) {
          console.error("Error fetching candidate data:", result.error);
          setCandidateName("Candidate Details");
        } else if (result.candidateInfo) {
          const fullName = `${result.candidateInfo.first_name} ${result.candidateInfo.last_name}`;
          setCandidateName(fullName);
        } else {
          setCandidateName("Candidate Details");
        }
      } catch (err) {
        console.error("Error fetching candidate name:", err);
        setCandidateName("Candidate Details");
      } finally {
        setLoadingCandidateName(false);
      }
    };

    fetchCandidateName();
  }, [applicationId]);

  // Generate breadcrumb items based on pathname
  const breadcrumbItems = useMemo(() => {
    if (!pathname || pathname === "/") {
      return [{ label: "Dashboard", href: "/", isCurrentPage: true }];
    }

    const segments = pathname.split("/").filter(Boolean);
    const items = [];

    if (segments[0] === "jobs") {
      // Add Jobs page
      items.push({ 
        label: "Jobs", 
        href: "/jobs", 
        isCurrentPage: segments.length === 1 
      });

      // If we have a job ID, add the job title
      if (segments.length >= 2 && jobId) {
        items.push({
          label: loadingJobTitle ? "Loading..." : (jobTitle || "Job Details"),
          href: `/jobs/${jobId}`,
          isCurrentPage: segments.length === 2
        });
      }

      // If we have an application ID, add the candidate name
      if (segments.length === 3 && applicationId) {
        items.push({
          label: loadingCandidateName ? "Loading..." : (candidateName || "Candidate Details"),
          href: `/jobs/${jobId}/${applicationId}`,
          isCurrentPage: true
        });
      }
    } else {
      // Handle other pages
      const mapping: Record<string, string> = {
        "profile": "My Profile",
        "help": "Help & Support",
        "settings": "Settings",
        "create-job-post": "Create Job Post",
      };
      
      const label = mapping[segments[0]] ?? segments[0].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      items.push({ 
        label, 
        href: `/${segments[0]}`, 
        isCurrentPage: true 
      });
    }

    return items;
  }, [pathname, jobId, applicationId, jobTitle, candidateName, loadingJobTitle, loadingCandidateName]);

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
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbItems.map((item, index) => (
                  <React.Fragment key={item.href}>
                    <BreadcrumbItem>
                      {item.isCurrentPage ? (
                        <BreadcrumbPage className="font-medium text-gray-900">
                          {item.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={item.href} className="text-gray-600 hover:text-gray-900 transition-colors">
                          {item.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbItems.length - 1 && (
                      <BreadcrumbSeparator className="text-gray-400" />
                    )}
                  </React.Fragment>
                ))}
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

