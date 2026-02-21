import { NextRequest, NextResponse } from "next/server";
import {
  getCandidateFunnelOverview,
  getCandidateSuggestions,
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

    const { supabase, scope } = scopeResolution;
    const filters = parseCandidateFunnelFilters(request.nextUrl.searchParams);
    const mode = request.nextUrl.searchParams.get("mode") || "overview";

    if (mode === "candidates") {
      const candidates = await getCandidateSuggestions(supabase, scope, filters);
      return NextResponse.json({ candidates });
    }

    const overview = await getCandidateFunnelOverview(supabase, scope, filters);
    return NextResponse.json(overview);
  } catch (error) {
    console.error("candidate-funnel overview error", error);
    return NextResponse.json(
      { error: "Failed to load candidate funnel analytics" },
      { status: 500 },
    );
  }
}
