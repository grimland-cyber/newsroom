/**
 * Seed script — uploads the local releases.json to Vercel KV.
 * Run ONCE after connecting KV storage in the Vercel dashboard:
 *
 *   npx vercel env pull .env.local    (pulls KV credentials)
 *   node scripts/seed-kv.mjs
 */

import { createClient } from "@vercel/kv";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env.local") });

const url = process.env.KV_REST_API_URL;
const token = process.env.KV_REST_API_TOKEN;

if (!url || !token) {
  console.error(
    "❌  KV_REST_API_URL or KV_REST_API_TOKEN missing in .env.local\n" +
      "   Run: npx vercel env pull .env.local"
  );
  process.exit(1);
}

const kv = createClient({ url, token });

const data = JSON.parse(
  readFileSync(join(__dirname, "../data/releases.json"), "utf-8")
);

await kv.set("releases", data);
console.log(`✅  Seeded ${data.length} press releases to Vercel KV.`);
