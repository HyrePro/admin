// Validation test: Create-school API should not fail with "User school information not found"
// Run with: node scripts/validate_create_school_auth.js
//
// Required env:
// - NEXT_PUBLIC_SUPABASE_URL
// - NEXT_PUBLIC_SUPABASE_ANON_KEY
// - ADMIN_EMAIL
// - ADMIN_PASSWORD
// Optional env:
// - BASE_URL (default: http://localhost:3000)
// - SUPABASE_SERVICE_ROLE_KEY (used to warn if the user already has a school)

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  process.exit(1);
}

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Missing admin credentials. Set ADMIN_EMAIL and ADMIN_PASSWORD for a user WITHOUT a school.");
  process.exit(1);
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL.trim().toLowerCase(),
    password: ADMIN_PASSWORD,
  });

  if (error || !data?.session) {
    console.error("Login failed:", error?.message || "No session returned");
    process.exit(1);
  }

  const accessToken = data.session.access_token;

  // Optional: warn if this user already has a school.
  if (SERVICE_KEY) {
    const service = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: userData, error: userError } = await service.auth.getUser(accessToken);
    if (!userError && userData?.user?.id) {
      const { data: adminInfo } = await service
        .from("admin_user_info")
        .select("school_id")
        .eq("id", userData.user.id)
        .single();
      if (adminInfo?.school_id) {
        console.warn(
          "Warning: This user already has a school_id. Use a test user without a school to validate the regression properly."
        );
      }
    }
  }

  const response = await fetch(`${BASE_URL}/api/school`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({}),
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    // ignore
  }

  if (response.status === 404 && payload?.error?.includes("User school information not found")) {
    console.error("FAIL: API returned 404 with 'User school information not found' (regression).");
    process.exit(1);
  }

  if (response.status !== 400) {
    console.error(
      `FAIL: Expected 400 (missing required fields). Got ${response.status}. Payload:`,
      payload
    );
    process.exit(1);
  }

  console.log("PASS: /api/school rejects missing fields with 400 and does NOT require school_id.");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
