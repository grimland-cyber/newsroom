import type { PressRelease } from "./types";

// ---------- storage backend ----------

async function readDb(): Promise<PressRelease[]> {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import("@vercel/kv");
    return (await kv.get<PressRelease[]>("releases")) ?? [];
  }
  const fs = await import("fs");
  const path = await import("path");
  const file = path.join(process.cwd(), "data", "releases.json");
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf-8")) as PressRelease[];
}

async function writeDb(releases: PressRelease[]): Promise<void> {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import("@vercel/kv");
    await kv.set("releases", releases);
    return;
  }
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
  const all = await readDb();
  const idx = all.findIndex((r) => r.id === release.id);
  if (idx >= 0) all[idx] = release;
  else all.unshift(release);
  all.sort(
    (a, b) =>
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
  await writeDb(all);
}

export async function deleteRelease(id: string): Promise<void> {
  const all = await readDb();
  await writeDb(all.filter((r) => r.id !== id));
}

export async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  const all = await readDb();
  return all.some((r) => r.slug === slug && r.id !== excludeId);
}
