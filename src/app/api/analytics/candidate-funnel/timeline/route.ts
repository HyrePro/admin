import { NextRequest, NextResponse } from "next/server";
import {
  getCandidateTimeline,
  parseCandidateFunnelFilters,
  resolveAnalyticsScope,
} from "@/lib/supabase/api/candidate-funnel-analytics";

export async function GET(request: NextRequest) {
  try {
    const requestedSchoolId = request.nextUrl.searchParams.get("schoolId");
    const scopeResolution = await resolveAnalyticsScope(request, requestedSchoolId);

    if (!scopeResolution.ok) {
      return NextResponse.json(
        {
          error: scopeResolution.error,
        },
        { status: scopeResolution.status },
      );
    }

    const candidateKey = request.nextUrl.searchParams.get("candidateKey") || "";
    if (!candidateKey.trim()) {
      return NextResponse.json({ error: "candidateKey is required" }, { status: 400 });
    }

    const page = Number.parseInt(request.nextUrl.searchParams.get("page") || "0", 10);
    const pageSize = Number.parseInt(request.nextUrl.searchParams.get("pageSize") || "20", 10);

    const filters = parseCandidateFunnelFilters(request.nextUrl.searchParams);
    const timeline = await getCandidateTimeline(
      scopeResolution.supabase,
      scopeResolution.scope,
      filters,
      candidateKey,
      Number.isFinite(page) ? page : 0,
      Number.isFinite(pageSize) ? pageSize : 20,
    );

    return NextResponse.json(timeline);
  } catch (error) {
    console.error("candidate-funnel timeline error", error);
    return NextResponse.json(
      { error: "Failed to load candidate timeline" },
      { status: 500 },
    );
  }
}
