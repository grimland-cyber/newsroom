import { NextResponse } from "next/server";

export async function GET() {
  const base = {
    hasAdminPassword: !!process.env.ADMIN_PASSWORD,
    passwordLength: process.env.ADMIN_PASSWORD?.length ?? 0,
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    supabaseUrlPreview: process.env.SUPABASE_URL
      ? `${process.env.SUPABASE_URL.slice(0, 20)}...${process.env.SUPABASE_URL.slice(-15)}`
      : null,
    hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
    hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  let supabaseTest: unknown = "not attempted";
  try {
    const { supabase } = await import("@/lib/supabase/client");
    if (!supabase) {
      supabaseTest = { ok: false, reason: "supabase client is null" };
    } else {
      const releasesResult = await supabase.from("releases").select("id", { head: true }).limit(1);
      const pressReleasesResult = await supabase
        .from("press_releases")
        .select("id", { head: true })
        .limit(1);
      supabaseTest = {
        releasesTable: releasesResult.error ? { error: releasesResult.error.message } : "ok",
        pressReleasesTable: pressReleasesResult.error
          ? { error: pressReleasesResult.error.message }
          : "ok",
      };
    }
  } catch (e) {
    supabaseTest = { ok: false, thrown: e instanceof Error ? e.message : String(e) };
  }

  return NextResponse.json({ ...base, supabaseTest });
}
