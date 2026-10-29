import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PressRelease, MediaAsset } from "./types";
import { getPublicReadClient, getServiceRoleClient } from "./supabase/client";
import { PUBLIC_REVALIDATE_SECONDS, RELEASES_CACHE_TAG } from "./cache-tags";

const SUPABASE_TABLE_CANDIDATES = ["releases", "press_releases"] as const;
type ReleaseTable = (typeof SUPABASE_TABLE_CANDIDATES)[number];

const LIST_COLUMNS =
  "id, title, slug, excerpt, published_at, created_at, updated_at, is_published, category";
const LIST_COLUMNS_LEGACY =
  "id, title, slug, excerpt, published_at, created_at, updated_at, is_published";
const ADMIN_LIST_COLUMNS =
  "id, title, slug, published_at, created_at, updated_at, is_published, category";
const ADMIN_LIST_COLUMNS_LEGACY =
  "id, title, slug, published_at, created_at, updated_at, is_published";
const ARTICLE_COLUMNS =
  "id, title, slug, content, excerpt, published_at, created_at, updated_at, is_published, media_assets, category";
const ARTICLE_COLUMNS_LEGACY =
  "id, title, slug, content, excerpt, published_at, created_at, updated_at, is_published, media_assets";

interface SupabaseRow {
  id: string;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string | null;
  published_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  is_published: boolean;
  media_assets?: MediaAsset[] | null;
  category?: string | null;
}

type PostgrestErrorLike = { code?: string; message: string };

let cachedTable: ReleaseTable | null = null;

function isMissingRelation(error: PostgrestErrorLike): boolean {
  return (
    error.code === "PGRST205" ||
    /schema cache/i.test(error.message) ||
    /does not exist/i.test(error.message) ||
    /could not find the table/i.test(error.message)
  );
}

function isMissingCategory(error: PostgrestErrorLike): boolean {
  return /column .*category/i.test(error.message);
}

function normalizeDateString(input: string | null | undefined): string {
  const candidate = input ?? "";
  const parsed = new Date(candidate);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }
  return new Date().toISOString();
}

function rowToRelease(row: SupabaseRow): PressRelease {
  const createdAt = normalizeDateString(row.created_at);
  const publishedAt = normalizeDateString(row.published_at ?? row.created_at);
  const updatedAt = normalizeDateString(row.updated_at ?? row.created_at);

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content ?? "",
    excerpt: row.excerpt ?? null,
    published_at: publishedAt,
    created_at: createdAt,
    updated_at: updatedAt,
    is_published: row.is_published,
    media_assets: row.media_assets ?? [],
    category: row.category ?? null,
  };
}

function toListItem(release: PressRelease): PressRelease {
  return { ...release, content: "", media_assets: [] };
}

function publishedSorted(rows: PressRelease[]): PressRelease[] {
  return rows
    .filter((release) => release.is_published)
    .sort(
      (a, b) =>
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );
}

let localCache: { mtimeMs: number; releases: PressRelease[] } | null = null;

async function readLocalDb(): Promise<PressRelease[]> {
  const fs = await import("fs");
  const path = await import("path");
  const file = path.join(process.cwd(), "data", "releases.json");
  if (!fs.existsSync(file)) return [];
  const stat = fs.statSync(file);
  if (localCache && localCache.mtimeMs === stat.mtimeMs) return localCache.releases;
  const releases = JSON.parse(fs.readFileSync(file, "utf-8")) as PressRelease[];
  localCache = { mtimeMs: stat.mtimeMs, releases };
  return releases;
}

async function writeLocalDb(releases: PressRelease[]): Promise<void> {
  const fs = await import("fs");
  const path = await import("path");
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "releases.json");
  fs.writeFileSync(file, JSON.stringify(releases, null, 2), "utf-8");
  localCache = null;
}

async function writeLocalRelease(release: PressRelease): Promise<void> {
  const all = await readLocalDb();
  const idx = all.findIndex((row) => row.id === release.id);
  if (idx >= 0) all[idx] = release;
  else all.unshift(release);
  all.sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
  await writeLocalDb(all);
}

type LooseResult = {
  data: unknown;
  error: PostgrestErrorLike | null;
  count?: number | null;
};

async function queryTable(
  run: (table: ReleaseTable) => PromiseLike<LooseResult>
): Promise<LooseResult> {
  const order: ReleaseTable[] = cachedTable
    ? [cachedTable, ...SUPABASE_TABLE_CANDIDATES.filter((table) => table !== cachedTable)]
    : [...SUPABASE_TABLE_CANDIDATES];

  let last: LooseResult | null = null;
  for (const table of order) {
    const result = await run(table);
    last = result;
    if (!result.error) {
      cachedTable = table;
      return result;
    }
    if (!isMissingRelation(result.error)) return result;
  }
  cachedTable = null;
  return last ?? { data: null, error: { message: "No releases table found" } };
}

function rowsOf(data: unknown): SupabaseRow[] {
  return Array.isArray(data) ? (data as SupabaseRow[]) : [];
}

async function selectColumns(
  client: SupabaseClient,
  columns: string,
  legacyColumns: string,
  build: (table: ReleaseTable, selected: string) => PromiseLike<LooseResult>
): Promise<LooseResult> {
  return queryTable(async (table) => {
    const primary = await build(table, columns);
    if (primary.error && isMissingCategory(primary.error)) {
      return build(table, legacyColumns);
    }
    return primary;
  });
}

async function remoteHasAnyRow(client: SupabaseClient): Promise<boolean> {
  const result = await queryTable((table) =>
    client.from(table).select("id", { count: "exact", head: true })
  );
  if (result.error) throw result.error;
  return (result.count ?? 0) > 0;
}

async function loadPublishedList(): Promise<PressRelease[]> {
  const client = getPublicReadClient();
  if (!client) return publishedSorted(await readLocalDb()).map(toListItem);

  try {
    const result = await selectColumns(
      client,
      LIST_COLUMNS,
      LIST_COLUMNS_LEGACY,
      (table, columns) =>
        client
          .from(table)
          .select(columns)
          .eq("is_published", true)
          .order("published_at", { ascending: false })
    );
    if (result.error) throw result.error;
    const rows = rowsOf(result.data).map(rowToRelease);
    if (rows.length > 0) return rows;

    const counter = getServiceRoleClient() ?? client;
    if (!(await remoteHasAnyRow(counter))) {
      return publishedSorted(await readLocalDb()).map(toListItem);
    }
    return [];
  } catch (error) {
    console.error("Supabase published list failed; falling back to local JSON:", error);
    return publishedSorted(await readLocalDb()).map(toListItem);
  }
}

async function loadPublishedBySlug(slug: string): Promise<PressRelease | null> {
  const client = getPublicReadClient();
  if (!client) {
    const match = (await readLocalDb()).find(
      (release) => release.slug === slug && release.is_published
    );
    return match ?? null;
  }

  try {
    const result = await selectColumns(
      client,
      ARTICLE_COLUMNS,
      ARTICLE_COLUMNS_LEGACY,
      (table, columns) =>
        client
          .from(table)
          .select(columns)
          .eq("slug", slug)
          .eq("is_published", true)
          .limit(1)
    );
    if (result.error) throw result.error;
    const row = rowsOf(result.data)[0];
    if (row) return rowToRelease(row);

    const counter = getServiceRoleClient() ?? client;
    if (!(await remoteHasAnyRow(counter))) {
      return (
        (await readLocalDb()).find(
          (release) => release.slug === slug && release.is_published
        ) ?? null
      );
    }
    return null;
  } catch (error) {
    console.error("Supabase article read failed; falling back to local JSON:", error);
    return (
      (await readLocalDb()).find(
        (release) => release.slug === slug && release.is_published
      ) ?? null
    );
  }
}

const cachedPublishedList = unstable_cache(loadPublishedList, ["published-releases-list-v1"], {
  revalidate: PUBLIC_REVALIDATE_SECONDS,
  tags: [RELEASES_CACHE_TAG],
});

const cachedPublishedBySlug = unstable_cache(
  loadPublishedBySlug,
  ["published-release-by-slug-v1"],
  { revalidate: PUBLIC_REVALIDATE_SECONDS, tags: [RELEASES_CACHE_TAG] }
);

/** Homepage and related-story lists. Narrow columns, shared for 5 minutes. */
export const getPublishedReleases = cache(async (): Promise<PressRelease[]> => {
  return cachedPublishedList();
});

/** One published article. Deduped within a request (page + metadata). */
export const getReleaseBySlug = cache(async (slug: string): Promise<PressRelease | null> => {
  return cachedPublishedBySlug(slug);
});

async function adminClient(): Promise<SupabaseClient | null> {
  const service = getServiceRoleClient();
  if (service) return service;
  const anon = getPublicReadClient();
  if (anon) {
    console.warn(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Admin reads use the anon key and will hide unpublished rows after RLS allows only SELECT of published rows."
    );
  }
  return anon;
}

export async function getAllReleases(): Promise<PressRelease[]> {
  const client = await adminClient();
  if (!client) return readLocalDb();

  try {
    const result = await selectColumns(
      client,
      ADMIN_LIST_COLUMNS,
      ADMIN_LIST_COLUMNS_LEGACY,
      (table, columns) =>
        client.from(table).select(columns).order("published_at", { ascending: false })
    );
    if (result.error) throw result.error;
    const rows = rowsOf(result.data).map(rowToRelease);
    if (rows.length > 0) return rows;
    if (!(await remoteHasAnyRow(getServiceRoleClient() ?? client))) return readLocalDb();
    return [];
  } catch (error) {
    console.error("Supabase admin list failed; falling back to local JSON:", error);
    return readLocalDb();
  }
}

export async function getReleaseById(id: string): Promise<PressRelease | null> {
  const client = await adminClient();
  if (!client) {
    return (await readLocalDb()).find((release) => release.id === id) ?? null;
  }

  try {
    const result = await selectColumns(
      client,
      ARTICLE_COLUMNS,
      ARTICLE_COLUMNS_LEGACY,
      (table, columns) => client.from(table).select(columns).eq("id", id).limit(1)
    );
    if (result.error) throw result.error;
    const row = rowsOf(result.data)[0];
    if (row) return rowToRelease(row);
    if (!(await remoteHasAnyRow(getServiceRoleClient() ?? client))) {
      return (await readLocalDb()).find((release) => release.id === id) ?? null;
    }
    return null;
  } catch (error) {
    console.error("Supabase admin read failed; falling back to local JSON:", error);
    return (await readLocalDb()).find((release) => release.id === id) ?? null;
  }
}

export async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  const client = getServiceRoleClient() ?? getPublicReadClient();
  if (!client) {
    return (await readLocalDb()).some((release) => release.slug === slug && release.id !== excludeId);
  }

  try {
    const result = await queryTable((table) =>
      client.from(table).select("id").eq("slug", slug).limit(1)
    );
    if (result.error) throw result.error;
    const row = rowsOf(result.data)[0];
    if (row) return row.id !== excludeId;
    if (!(await remoteHasAnyRow(client))) {
      return (await readLocalDb()).some(
        (release) => release.slug === slug && release.id !== excludeId
      );
    }
    return false;
  } catch (error) {
    console.error("slugExists failed; falling back to local JSON:", error);
    return (await readLocalDb()).some(
      (release) => release.slug === slug && release.id !== excludeId
    );
  }
}

async function seedSupabaseFromLocal(
  supabase: SupabaseClient,
  table: ReleaseTable
): Promise<void> {
  const localRows = await readLocalDb();
  if (localRows.length === 0) return;

  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true });
  if (error || (count ?? 0) >= localRows.length) return;

  const { error: seedError } = await supabase.from(table).upsert(localRows, { onConflict: "id" });
  if (seedError) {
    console.error("Supabase seed from local JSON failed:", seedError);
  }
}

async function upsertRelease(
  supabase: SupabaseClient,
  table: ReleaseTable,
  release: PressRelease
): Promise<void> {
  const { error } = await supabase.from(table).upsert(release);
  if (!error) return;

  if (isMissingCategory(error)) {
    const legacyRelease: Omit<PressRelease, "category"> = {
      id: release.id,
      title: release.title,
      slug: release.slug,
      content: release.content,
      excerpt: release.excerpt,
      published_at: release.published_at,
      created_at: release.created_at,
      updated_at: release.updated_at,
      is_published: release.is_published,
      media_assets: release.media_assets,
    };
    const { error: legacyError } = await supabase.from(table).upsert(legacyRelease);
    if (!legacyError) return;
    throw legacyError;
  }

  throw error;
}

function requireWriteClient(): SupabaseClient {
  if (!process.env.SUPABASE_URL) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }
  const client = getServiceRoleClient();
  if (!client) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for server-side writes. Refusing to write with the anon key."
    );
  }
  return client;
}

async function resolveWriteTable(client: SupabaseClient): Promise<ReleaseTable> {
  const probe = await queryTable((candidate) =>
    client.from(candidate).select("id").limit(1)
  );
  if (probe.error) throw probe.error;
  if (!cachedTable) throw new Error("Could not resolve the releases table");
  return cachedTable;
}

export async function saveRelease(release: PressRelease): Promise<void> {
  if (!process.env.SUPABASE_URL) {
    await writeLocalRelease(release);
    return;
  }

  // Missing service-role key must not fall through to the anon key or to a
  // silent local write while the live table stays unchanged.
  const client = requireWriteClient();
  try {
    const table = await resolveWriteTable(client);
    await seedSupabaseFromLocal(client, table);
    await upsertRelease(client, table, release);
  } catch (error) {
    console.error("Supabase write failed; falling back to local JSON:", error);
    await writeLocalRelease(release);
  }
}

export async function deleteRelease(id: string): Promise<void> {
  if (!process.env.SUPABASE_URL) {
    const all = await readLocalDb();
    await writeLocalDb(all.filter((release) => release.id !== id));
    return;
  }

  const client = requireWriteClient();
  try {
    const table = await resolveWriteTable(client);
    const { error } = await client.from(table).delete().eq("id", id);
    if (error) throw error;
  } catch (error) {
    console.error("Supabase delete failed; falling back to local JSON:", error);
    const all = await readLocalDb();
    await writeLocalDb(all.filter((release) => release.id !== id));
  }
}
