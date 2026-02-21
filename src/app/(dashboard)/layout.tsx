import { redirect } from "next/navigation";
import DashboardShellClient from "@/components/dashboard-shell-client";
import { createClient } from "@/lib/supabase/api/server";
import { resolveSupabaseUser } from "@/lib/supabase/api/session-resolver";
import type { ReactNode } from "react";

export default async function DashboardShellLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { user } = await resolveSupabaseUser(supabase, {
    allowSessionFallback: true,
  });

  if (!user) {
    redirect("/login");
  }

  const { data: adminInfo, error: adminError } = await supabase
    .from("admin_user_info")
    .select("school_id")
    .eq("id", user.id)
    .single();

  if (adminError || !adminInfo?.school_id) {
    redirect("/select-organization");
  }

  const { data: schoolInfo } = await supabase
    .from("school_info")
    .select("name, location")
    .eq("id", adminInfo.school_id)
    .single();

  const serializedUser = user ? JSON.parse(JSON.stringify(user)) : null;
  const serializedSchoolInfo = schoolInfo ? JSON.parse(JSON.stringify(schoolInfo)) : null;

  return (
    <DashboardShellClient
      initialUser={serializedUser}
      schoolInfo={serializedSchoolInfo}
      initialSchoolId={adminInfo.school_id}
    >
      {children}
    </DashboardShellClient>
  );
}
