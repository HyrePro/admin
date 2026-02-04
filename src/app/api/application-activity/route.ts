import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/api/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const applicationId = searchParams.get("applicationId");
    const startIndex = Number(searchParams.get("startIndex") || 0);
    const endIndex = Number(searchParams.get("endIndex") || 9);

    if (!applicationId) {
      return Response.json({ error: "applicationId is required" }, { status: 400 });
    }

    if (Number.isNaN(startIndex) || Number.isNaN(endIndex) || startIndex < 0 || endIndex < startIndex) {
      return Response.json({ error: "Invalid pagination parameters" }, { status: 400 });
    }

    const pageSize = endIndex - startIndex + 1;
    if (pageSize > 100) {
      return Response.json({ error: "Page size too large" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_application_activity", {
      p_application_id: applicationId,
      p_start_index: startIndex,
      p_end_index: endIndex,
    });

    if (error) {
      console.error("Error fetching application activity:", error);
      return Response.json({ error: error.message || "Failed to fetch activity" }, { status: 500 });
    }

    const serializedData = JSON.parse(JSON.stringify(data ?? []));
    return Response.json({ items: serializedData });
  } catch (error) {
    console.error("Unexpected error in application-activity API route:", error);
    return Response.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
