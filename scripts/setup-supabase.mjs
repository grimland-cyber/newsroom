/**
 * One-time setup: creates the releases table in Supabase and seeds all 20 press releases.
 * Run: node scripts/setup-supabase.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually
const envPath = join(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = Object.fromEntries(
  envContent
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => l.split("=").map((p) => p.trim()))
    .map(([k, ...v]) => [k, v.join("=")])
);

const SUPABASE_URL = env.SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

// Use service role key to bypass RLS
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// ── Step 1: Create table via Management API (SQL execution) ────────────────
const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS releases (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  slug          text NOT NULL UNIQUE,
  content       text NOT NULL DEFAULT '',
  excerpt       text,
  published_at  timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  is_published  boolean NOT NULL DEFAULT true,
  media_assets  jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS releases_slug_idx ON releases (slug);
CREATE INDEX IF NOT EXISTS releases_published_at_idx ON releases (published_at DESC);

ALTER TABLE releases ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'releases' AND policyname = 'Public read published'
  ) THEN
    CREATE POLICY "Public read published" ON releases FOR SELECT USING (is_published = true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'releases' AND policyname = 'Service role full access'
  ) THEN
    CREATE POLICY "Service role full access" ON releases FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
`;

console.log("🔧  Connecting to Supabase:", SUPABASE_URL);

// Try to create the table via the REST API /query endpoint (service role)
let tableReady = false;

try {
  const projectRef = new URL(SUPABASE_URL).hostname.split(".")[0];
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // This requires a personal access token, not service role key
        // Try anyway
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: CREATE_SQL }),
    }
  );

  if (res.ok) {
    console.log("✅  Table created via Management API");
    tableReady = true;
  } else {
    throw new Error(await res.text());
  }
} catch {
  // Fallback: try to check if table already exists by querying it
  const { error } = await supabase.from("releases").select("id").limit(1);
  if (!error) {
    console.log("✅  Table already exists");
    tableReady = true;
  } else {
    console.log("\n⚠️  Could not create table automatically.");
    console.log("📋  Please run this SQL in the Supabase Dashboard → SQL Editor:\n");
    console.log("   https://supabase.com/dashboard/project/" + new URL(SUPABASE_URL).hostname.split(".")[0] + "/sql/new\n");
    console.log("─".repeat(60));
    console.log(CREATE_SQL);
    console.log("─".repeat(60));
    console.log("\nAfter running the SQL above, re-run this script to seed the data.");
    process.exit(0);
  }
}

if (!tableReady) process.exit(1);

// ── Step 2: Seed the 20 press releases ─────────────────────────────────────
const releases = JSON.parse(
  readFileSync(join(__dirname, "../data/releases.json"), "utf-8")
);

console.log(`\n📰  Seeding ${releases.length} press releases...`);

// Upsert in batches of 5
const BATCH = 5;
let inserted = 0;

for (let i = 0; i < releases.length; i += BATCH) {
  const batch = releases.slice(i, i + BATCH);
  const { error } = await supabase.from("releases").upsert(batch, {
    onConflict: "slug",
    ignoreDuplicates: false,
  });

  if (error) {
    console.error(`❌  Error seeding batch ${i / BATCH + 1}:`, error.message);
    process.exit(1);
  }
  inserted += batch.length;
  console.log(`   ${inserted}/${releases.length} done...`);
}

console.log(`\n✅  All ${releases.length} press releases seeded to Supabase!`);
console.log(`\n🌐  Site: https://newsroom-psi.vercel.app`);
console.log(`   Remember to add env vars to Vercel (see below):\n`);
console.log(`   SUPABASE_URL=${SUPABASE_URL}`);
console.log(`   SUPABASE_ANON_KEY=${ANON_KEY}`);
