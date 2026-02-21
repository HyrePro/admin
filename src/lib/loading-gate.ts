import { cookies } from "next/headers";

export async function isWarm(key: string): Promise<boolean> {
  // Allow opting out for debugging, but keep warm-loading enabled by default.
  if (process.env.NEXT_PUBLIC_DISABLE_WARM_LOADING === "true") {
    return false;
  }

  const cookieStore = await cookies();
  return cookieStore.get(key) !== undefined;
}
