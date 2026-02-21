import { NextRequest, NextResponse } from "next/server";
import { resolveUserAndSchoolId } from "@/lib/supabase/api/route-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveUserAndSchoolId(request);
    if (auth.error || !auth.schoolId || !auth.supabaseService) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status || 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get("jobId");
    const startIndex = parseInt(searchParams.get("startIndex") || "0") || 0;
    const endIndex = parseInt(searchParams.get("endIndex") || "10") || 10;
    const search = searchParams.get("search") || "";

    if (!jobId) {
      return NextResponse.json({ error: "Missing required parameter: jobId" }, { status: 400 });
    }

    const MAX_INDEX = 10000;
    const MAX_PAGE_SIZE = 100;

    if (startIndex < 0 || startIndex > MAX_INDEX) {
      return NextResponse.json({ error: `Start index must be between 0 and ${MAX_INDEX}` }, { status: 400 });
    }

    const requestedEndIndex = Math.max(startIndex + 1, endIndex);
    if (requestedEndIndex - startIndex > MAX_PAGE_SIZE) {
      return NextResponse.json({ error: `Maximum page size is ${MAX_PAGE_SIZE} items` }, { status: 400 });
    }

    const validatedEndIndex = Math.min(requestedEndIndex, MAX_INDEX);

    if (search && search.length > 100) {
      return NextResponse.json({ error: "Search text too long. Maximum 100 characters allowed." }, { status: 400 });
    }

    const { data: applicationsData, error: applicationsError } = await auth.supabaseService.rpc("get_job_applications", {
      p_job_id: jobId,
      p_start_index: startIndex,
      p_end_index: validatedEndIndex,
      p_search: search.trim(),
    });

    if (applicationsError) {
      return NextResponse.json(
        { error: `Failed to fetch job applications: ${applicationsError.message}` },
        { status: 500 }
      );
    }

    let countQuery = auth.supabaseService
      .from("job_applications")
      .select("*", { count: "exact", head: true })
      .eq("job_id", jobId);

    if (search) {
      countQuery = countQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { count: totalApplications, error: countError } = await countQuery;

    if (countError) {
      return NextResponse.json(
        {
          applications: applicationsData || [],
          total: 0,
          message: "Applications fetched successfully (count unavailable)",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        applications: applicationsData || [],
        total: totalApplications || 0,
        message: "Applications fetched successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
