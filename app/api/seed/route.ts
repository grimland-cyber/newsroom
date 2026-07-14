import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readFileSync } from "fs";
import { join } from "path";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";
import { saveRelease } from "@/lib/db";
import type { PressRelease } from "@/lib/types";

// One-time seeding: copies the bundled data/releases.json into the Supabase
// press_releases table. Admin-only. Safe to run repeatedly (upsert by id).
export async function GET() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token || !(await verifySessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let releases: PressRelease[];
  try {
    const file = join(process.cwd(), "data", "releases.json");
    releases = JSON.parse(readFileSync(file, "utf-8")) as PressRelease[];
  } catch (e) {
    return NextResponse.json(
      { error: `Could not read seed data: ${(e as Error).message}` },
      { status: 500 }
    );
  }

  let seeded = 0;
  const errors: string[] = [];
  for (const r of releases) {
    try {
      await saveRelease({ ...r, category: r.category ?? null });
      seeded++;
    } catch (e) {
      errors.push(`${r.slug}: ${(e as Error).message}`);
    }
  }

  return NextResponse.json({ seeded, total: releases.length, errors });
}
