"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { NavUser } from "@/components/nav-user";
import { Button } from "@/components/ui/button";
import SchoolInfoDisplay from "@/components/school-info-display";
import { CircleArrowUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AuthProviderWrapper } from "@/components/auth-provider-wrapper";
import { I18nProvider } from "@/contexts/i18n-context";
import PricingPlansSheet from "@/components/pricing-plans-sheet";
import NavigationProgressBar from "@/components/navigation-progress-bar";
import type { User } from "@supabase/supabase-js";

interface SchoolInfo {
  name: string;
  location: string;
}

interface DashboardShellClientProps {
  children: React.ReactNode;
  initialUser: User | null;
  schoolInfo: SchoolInfo | null;
  initialSchoolId: string | null;
}

export default function DashboardShellClient({
  children,
  initialUser,
  schoolInfo,
  initialSchoolId,
}: DashboardShellClientProps) {
  return (
    <AuthProviderWrapper initialUser={initialUser} initialSchoolId={initialSchoolId}>
      <I18nProvider>
        <DashboardShellContent initialUser={initialUser} schoolInfo={schoolInfo}>
          {children}
        </DashboardShellContent>
      </I18nProvider>
    </AuthProviderWrapper>
  );
}

function DashboardShellContent({
  children,
  initialUser,
  schoolInfo,
}: {
  children: React.ReactNode;
  initialUser: DashboardShellClientProps["initialUser"];
  schoolInfo: SchoolInfo | null;
}) {
  const { user } = useAuth();
  const [isPricingSheetOpen, setIsPricingSheetOpen] = useState(false);

  const displayUser = user ?? initialUser;
  const displayName =
    displayUser?.user_metadata?.name ||
    (displayUser?.email ? displayUser.email.split("@")[0] : "User");
  const displayEmail = displayUser?.email || "";
  const displayAvatar = (displayUser?.user_metadata?.avatar_url as string) || "";

  return (
    <SidebarProvider>
      <NavigationProgressBar />
      <AppSidebar />
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        <header className="shrink-0 flex h-18 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-16 border-b border-gray-200 dark:border-gray-800 z-50">
          <div className="lg:hidden">
            <SidebarTrigger className="ml-2" />
          </div>
          <div className="flex flex-1 px-2 items-center ms-2 bg-red flex-1 min-w-0">
            <SchoolInfoDisplay schoolInfo={schoolInfo} />
          </div>
          <div className="ml-auto flex items-center gap-4 px-4">
            <div className="hidden sm:block">
              <Button
                variant="default"
                className="text-xs bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 hover:from-yellow-400 hover:via-yellow-500 hover:to-yellow-600 text-white shadow-md font-semibold"
                onClick={() => setIsPricingSheetOpen(true)}
              >
                Upgrade Plan
              </Button>
            </div>
            <div className="sm:hidden">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="icon"
                      className="h-8 w-8 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 hover:from-yellow-400 hover:via-yellow-500 hover:to-yellow-600 text-white shadow-md"
                      onClick={() => setIsPricingSheetOpen(true)}
                    >
                      <CircleArrowUp className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upgrade Plan</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {displayUser && displayEmail ? (
              <NavUser
                user={{
                  name: String(displayName || "User"),
                  email: displayEmail,
                  avatar: displayAvatar,
                }}
              />
            ) : null}
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">{children}</div>
      </SidebarInset>
      <PricingPlansSheet isOpen={isPricingSheetOpen} onClose={() => setIsPricingSheetOpen(false)} />
    </SidebarProvider>
  );
}
