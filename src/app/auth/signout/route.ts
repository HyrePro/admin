import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Server signout error:", error);
  }

  const redirectUrl = new URL("/login", request.url);
  redirectUrl.searchParams.set("logged_out", "1");
  return NextResponse.redirect(redirectUrl);
}
