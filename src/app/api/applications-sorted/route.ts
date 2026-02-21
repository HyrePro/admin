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
    const sort = searchParams.get("sort") || "created_at";
    const ascParam = searchParams.get("asc") || "false";
    const asc = ascParam.toLowerCase() === "true";

    const rawStartIndex = parseInt(searchParams.get("startIndex") || "0") || 0;
    const rawEndIndex = parseInt(searchParams.get("endIndex") || "20") || 20;
    const startIndex = Math.max(0, rawStartIndex);
    const endIndex = Math.min(1000, Math.max(startIndex + 1, rawEndIndex));

    if (startIndex > 10000) {
      return NextResponse.json({ error: "Start index too large. Maximum allowed is 10,000." }, { status: 400 });
    }

    if (endIndex - startIndex > 100) {
      return NextResponse.json(
        {
          error: "Maximum page size is 100 items. Please reduce the range between startIndex and endIndex.",
          details: {
            requestedSize: endIndex - startIndex,
            maxAllowed: 100,
            suggestion: `Try endIndex: ${startIndex + 100}`,
          },
        },
        { status: 400 }
      );
    }

    const searchParam = search && search.trim() !== "" ? search : null;

    const { data, error } = await auth.supabaseService.rpc("get_applications_by_school", {
      p_school_id: auth.schoolId,
      p_start_index: startIndex,
      p_end_index: endIndex,
      p_search: searchParam || "ALL",
      p_status: status,
      p_sort: sort,
      p_asc: asc,
    });

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch applications: ${error.message || "Unknown error"}`, details: error },
        { status: 500 }
      );
    }

    const { data: countData, error: countError } = await auth.supabaseService.rpc("get_applications_count_by_school", {
      p_school_id: auth.schoolId,
      p_status: status,
      p_search: search || null,
    });

    if (countError) {
      return NextResponse.json(
        { error: `Failed to count applications: ${countError.message || "Unknown error"}`, details: countError },
        { status: 500 }
      );
    }

    let totalCount = 0;
    if (countData && Array.isArray(countData) && countData.length > 0) {
      totalCount = Number(countData[0]);
    } else if (countData && typeof countData === "object" && "count" in countData) {
      totalCount = Number(countData.count);
    } else if (countData && typeof countData === "number") {
      totalCount = Number(countData);
    }

    return NextResponse.json(
      {
        applications: data || [],
        totalCount,
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
