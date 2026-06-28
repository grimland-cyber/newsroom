import type { PressRelease, MediaAsset } from "./types";

// ---------- helpers ----------

function useSupabase(): boolean {
  return !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY;
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

// ---------- storage backend ----------

async function readDb(): Promise<PressRelease[]> {
  if (useSupabase()) {
    const { supabase } = await import("./supabase/client");
    const { data, error } = await supabase
      .from("releases")
      .select("*")
      .order("published_at", { ascending: false });
    if (error) throw error;
    return (data as SupabaseRow[]).map(rowToRelease);
  }
  const fs = await import("fs");
  const path = await import("path");
  const file = path.join(process.cwd(), "data", "releases.json");
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf-8")) as PressRelease[];
}

async function writeRelease(release: PressRelease): Promise<void> {
  if (useSupabase()) {
    const { supabase } = await import("./supabase/client");
    const { error } = await supabase.from("releases").upsert(release);
    if (error) throw error;
    return;
  }
  // local fallback: read-modify-write
  const all = await readDb();
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
    const { supabase } = await import("./supabase/client");
    const { error } = await supabase.from("releases").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  const all = await readDb();
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
