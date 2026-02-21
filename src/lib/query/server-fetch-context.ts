import { cookies, headers } from "next/headers";
import type { FetchContext } from "@/lib/query/fetchers/shared";

/**
 * Build absolute base URL + cookies for server-side fetches to internal API routes.
 */
export async function getServerFetchContext(): Promise<FetchContext> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host");
  const protocol =
    headerList.get("x-forwarded-proto") ||
    (process.env.NODE_ENV === "development" ? "http" : "https");

  const baseUrl = host
    ? `${protocol}://${host}`
    : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  return {
    baseUrl,
    headers: {
      cookie: cookieHeader,
    },
    cache: "no-store",
  };
}
