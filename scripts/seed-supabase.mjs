import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);
const releases = JSON.parse(readFileSync(join(__dirname, "..", "data", "releases.json"), "utf-8"));

console.log(`Seeding ${releases.length} releases to Supabase...`);

const { error } = await supabase.from("releases").upsert(releases);

if (error) {
  console.error("Error:", error.message);
  process.exit(1);
}

console.log(`Done! ${releases.length} releases seeded.`);
