import type { PressRelease, MediaAsset } from "./types";

// ---------- helpers ----------

const SUPABASE_TABLE_CANDIDATES = ["press_releases", "releases"] as const;
const DEFAULT_SUPABASE_TABLE = SUPABASE_TABLE_CANDIDATES[0];

function useSupabase(): boolean {
  return (
    !!process.env.SUPABASE_URL &&
    !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)
  );
}

interface SupabaseRow {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  published_at: string;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  media_assets: MediaAsset[];
  category: string | null;
}

function rowToRelease(row: SupabaseRow): PressRelease {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    excerpt: row.excerpt,
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    is_published: row.is_published,
    media_assets: row.media_assets ?? [],
    category: row.category ?? null,
  };
}

async function readLocalDb(): Promise<PressRelease[]> {
  const fs = await import("fs");
  const path = await import("path");
  const file = path.join(process.cwd(), "data", "releases.json");
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf-8")) as PressRelease[];
}

async function getSupabaseTable(
  supabase: Awaited<typeof import("./supabase/client")>["supabase"]
): Promise<(typeof SUPABASE_TABLE_CANDIDATES)[number]> {
  for (const table of SUPABASE_TABLE_CANDIDATES) {
    const { error } = await supabase.from(table).select("id", { head: true }).limit(1);
    if (!error) return table;
  }

  return DEFAULT_SUPABASE_TABLE;
}

async function seedSupabaseFromLocal(
  supabase: Awaited<typeof import("./supabase/client")>["supabase"],
  table: (typeof SUPABASE_TABLE_CANDIDATES)[number]
): Promise<void> {
  const localRows = await readLocalDb();
  if (localRows.length === 0) return;

  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true });
  if (error || (count ?? 0) >= localRows.length) return;

  const { error: seedError } = await supabase
    .from(table)
    .upsert(localRows, { onConflict: "id" });

  if (seedError) {
    console.error("Supabase seed from local JSON failed:", seedError);
  }
}

async function upsertRelease(
  supabase: Awaited<typeof import("./supabase/client")>["supabase"],
  table: (typeof SUPABASE_TABLE_CANDIDATES)[number],
  release: PressRelease
): Promise<void> {
  const { error } = await supabase.from(table).upsert(release);

  if (!error) return;

  if (/column .*category/i.test(error.message)) {
    const { category: _category, ...legacyRelease } = release;
    const { error: legacyError } = await supabase.from(table).upsert(legacyRelease);
    if (!legacyError) return;
    throw legacyError;
  }

  throw error;
}

// ---------- storage backend ----------

async function readDb(): Promise<PressRelease[]> {
  if (useSupabase()) {
    try {
      const { supabase } = await import("./supabase/client");
      if (!supabase) {
        console.warn("Supabase client is null; falling back to local JSON");
        return readLocalDb();
      }
      const table = await getSupabaseTable(supabase);
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order("published_at", { ascending: false });
      if (error) throw error;
      const rows = (data as SupabaseRow[]).map(rowToRelease);
      // If the table is empty (e.g. not seeded yet) keep the bundled JSON as a
      // safety net so the public site never renders blank.
      if (rows.length > 0) return rows;
    } catch (error) {
      console.error("Supabase read failed; falling back to local JSON:", error);
    }
  }
  return readLocalDb();
}

async function writeRelease(release: PressRelease): Promise<void> {
  if (useSupabase()) {
    try {
      const { supabase } = await import("./supabase/client");
      if (!supabase) {
        console.warn("Supabase client is null; falling back to local JSON");
        const all = await readLocalDb();
        const idx = all.findIndex((r) => r.id === release.id);
        if (idx >= 0) all[idx] = release;
        else all.unshift(release);
        all.sort(
          (a, b) =>
            new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
        );
        await writeLocalDb(all);
        return;
      }
      const table = await getSupabaseTable(supabase);
      await seedSupabaseFromLocal(supabase, table);
      await upsertRelease(supabase, table, release);
      return;
    } catch (error) {
      console.error("Supabase write failed; falling back to local JSON:", error);
    }
  }
  // local fallback: read-modify-write
  const all = await readLocalDb();
  const idx = all.findIndex((r) => r.id === release.id);
  if (idx >= 0) all[idx] = release;
  else all.unshift(release);
  all.sort(
    (a, b) =>
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
  await writeLocalDb(all);
}

async function removeRelease(id: string): Promise<void> {
  if (useSupabase()) {
    try {
      const { supabase } = await import("./supabase/client");
      if (!supabase) {
        console.warn("Supabase client is null; falling back to local JSON");
        const all = await readLocalDb();
        await writeLocalDb(all.filter((r) => r.id !== id));
        return;
      }
      const table = await getSupabaseTable(supabase);
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      return;
    } catch (error) {
      console.error("Supabase delete failed; falling back to local JSON:", error);
    }
  }
  const all = await readLocalDb();
  await writeLocalDb(all.filter((r) => r.id !== id));
}

async function writeLocalDb(releases: PressRelease[]): Promise<void> {
  const fs = await import("fs");
  const path = await import("path");
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "releases.json"),
    JSON.stringify(releases, null, 2),
    "utf-8"
  );
}

// ---------- public API ----------

export async function getAllReleases(): Promise<PressRelease[]> {
  return readDb();
}

export async function getPublishedReleases(): Promise<PressRelease[]> {
  const all = await readDb();
  return all
    .filter((r) => r.is_published)
    .sort(
      (a, b) =>
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );
}

export async function getReleaseBySlug(slug: string): Promise<PressRelease | null> {
  const all = await readDb();
  return all.find((r) => r.slug === slug) ?? null;
}

export async function getReleaseById(id: string): Promise<PressRelease | null> {
  const all = await readDb();
  return all.find((r) => r.id === id) ?? null;
}

export async function saveRelease(release: PressRelease): Promise<void> {
  await writeRelease(release);
}

export async function deleteRelease(id: string): Promise<void> {
  await removeRelease(id);
}

export async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  const all = await readDb();
  return all.some((r) => r.slug === slug && r.id !== excludeId);
}
