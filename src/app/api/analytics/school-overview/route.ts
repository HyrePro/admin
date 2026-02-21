import { NextRequest, NextResponse } from "next/server";
import { resolveUserAndSchoolId } from "@/lib/supabase/api/route-auth";

type AnalyticsPeriod = "day" | "week" | "month" | "all";

const VALID_PERIODS: readonly AnalyticsPeriod[] = ["day", "week", "month", "all"];
const RPC_TIMEOUT_MS = 25_000;

function isAnalyticsPeriod(value: string): value is AnalyticsPeriod {
  return VALID_PERIODS.includes(value as AnalyticsPeriod);
}

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("Analytics request timed out"));
    }, timeoutMs);

    Promise.resolve(promise)
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

export async function GET(request: NextRequest) {
  const periodParam = request.nextUrl.searchParams.get("period") ?? "week";
  if (!isAnalyticsPeriod(periodParam)) {
    return NextResponse.json(
      {
        error: "Invalid period. Allowed values: day, week, month, all.",
      },
      { status: 400 },
    );
  }

  const auth = await resolveUserAndSchoolId(request);
  if (auth.error || !auth.userId || !auth.schoolId || !auth.supabaseService) {
    return NextResponse.json(
      { error: auth.error || "Unauthorized. Please log in." },
      { status: auth.status || 401 },
    );
  }

  try {
    const { data, error } = await withTimeout(
      auth.supabaseService
        .rpc("get_school_analytics", {
          input_school_id: auth.schoolId,
          date_range: periodParam,
        })
        .then((result) => result as { data: unknown; error: { message?: string } | null }),
      RPC_TIMEOUT_MS,
    );

    if (error) {
      console.error("school-overview analytics rpc error", error);
      return NextResponse.json(
        {
          error: "Failed to load school analytics.",
        },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          error: "No analytics data found for this school.",
        },
        { status: 404 },
      );
    }

    const response = NextResponse.json(data);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    if (error instanceof Error && error.message.includes("timed out")) {
      return NextResponse.json(
        {
          error: "School analytics request timed out. Please try again.",
        },
        { status: 504 },
      );
    }

    console.error("school-overview analytics route error", error);
    return NextResponse.json(
      {
        error: "Unexpected error while loading school analytics.",
      },
      { status: 500 },
    );
  }
}
