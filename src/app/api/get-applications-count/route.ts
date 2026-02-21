import { NextRequest, NextResponse } from "next/server";
import { resolveUserAndSchoolId } from "@/lib/supabase/api/route-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveUserAndSchoolId(request);
    if (auth.error || !auth.schoolId || !auth.supabaseService) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status || 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || "ALL";
    const search = searchParams.get("search") || "";

    const { data: countData, error } = await auth.supabaseService.rpc("get_applications_count_by_school", {
      p_school_id: auth.schoolId,
      p_status: status,
      p_search: search || null,
    });

    if (error) {
      return NextResponse.json(
        { error: `Failed to count applications: ${error.message || "Unknown error"}`, details: error },
        { status: 500 }
      );
    }

    let count = 0;
    if (countData && Array.isArray(countData) && countData.length > 0) {
      count = Number(countData[0]);
    } else if (countData && typeof countData === "object" && "count" in countData) {
      count = Number(countData.count);
    } else if (countData && typeof countData === "number") {
      count = Number(countData);
    }

    return NextResponse.json({ count, message: "Applications count fetched successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
