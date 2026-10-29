"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { deleteRelease, getReleaseById, saveRelease, slugExists } from "@/lib/db";
import { revalidateAfterReleaseChange } from "@/lib/revalidate-releases";
import { sanitizeReleaseHtml } from "@/lib/release-html";
import type { MediaAsset, PressRelease } from "@/lib/types";

const SAVE_FAILED =
  "שמירת ההודעה נכשלה. ודא ש-SUPABASE_SERVICE_ROLE_KEY מוגדר ב-Vercel ושיש הרשאת כתיבה לטבלה.";

function parseFormData(formData: FormData) {
  const title = (formData.get("title") as string).trim();
  const slug = (formData.get("slug") as string).trim();
  const excerpt = (formData.get("excerpt") as string).trim() || null;
  const content = sanitizeReleaseHtml((formData.get("content") as string) ?? "");
  const publishedAt = formData.get("publishedAt") as string;
  const isPublished = formData.get("isPublished") === "true";
  const rawAssets = formData.get("mediaAssets") as string;
  const mediaAssets: MediaAsset[] = rawAssets
    ? (JSON.parse(rawAssets) as MediaAsset[]).filter((asset) => asset.name.trim() && asset.url.trim())
    : [];
  const category = (formData.get("category") as string)?.trim() || null;

  return { title, slug, excerpt, content, publishedAt, isPublished, mediaAssets, category };
}

export async function createRelease(formData: FormData): Promise<void> {
  await requireAdmin();
  const data = parseFormData(formData);

  if (await slugExists(data.slug)) {
    redirect(`/admin/new?error=${encodeURIComponent(`כתובת URL "${data.slug}" כבר קיימת`)}`);
  }

  const now = new Date().toISOString();
  const release: PressRelease = {
    id: crypto.randomUUID(),
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt,
    content: data.content,
    published_at: data.publishedAt ? new Date(data.publishedAt).toISOString() : now,
    created_at: now,
    updated_at: now,
    is_published: data.isPublished,
    media_assets: data.mediaAssets,
    category: data.category,
  };

  try {
    await saveRelease(release);
  } catch (saveError) {
    console.error("createRelease: saveRelease failed", saveError);
    redirect(`/admin/new?error=${encodeURIComponent(SAVE_FAILED)}`);
  }
  revalidateAfterReleaseChange([release.slug]);
  redirect("/admin/dashboard");
}

export async function updateRelease(id: string, formData: FormData): Promise<void> {
  await requireAdmin();
  const existing = await getReleaseById(id);
  if (!existing) redirect(`/admin/dashboard?error=${encodeURIComponent("הודעה לא נמצאה")}`);

  const data = parseFormData(formData);

  if (await slugExists(data.slug, id)) {
    redirect(`/admin/edit/${id}?error=${encodeURIComponent(`כתובת URL "${data.slug}" כבר קיימת`)}`);
  }

  const updated: PressRelease = {
    ...existing,
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt,
    content: data.content,
    published_at: data.publishedAt ? new Date(data.publishedAt).toISOString() : existing.published_at,
    updated_at: new Date().toISOString(),
    is_published: data.isPublished,
    media_assets: data.mediaAssets,
    category: data.category,
  };

  try {
    await saveRelease(updated);
  } catch (saveError) {
    console.error("updateRelease: saveRelease failed", saveError);
    redirect(`/admin/edit/${id}?error=${encodeURIComponent(SAVE_FAILED)}`);
  }
  revalidateAfterReleaseChange([existing.slug, updated.slug]);
  redirect("/admin/dashboard");
}

export async function removeRelease(id: string): Promise<void> {
  await requireAdmin();
  const release = await getReleaseById(id);
  try {
    await deleteRelease(id);
  } catch (deleteError) {
    console.error("removeRelease: deleteRelease failed", deleteError);
    redirect(
      `/admin/dashboard?error=${encodeURIComponent(
        "מחיקת ההודעה נכשלה. ודא ש-SUPABASE_SERVICE_ROLE_KEY מוגדר ב-Vercel."
      )}`
    );
  }
  revalidateAfterReleaseChange(release ? [release.slug] : []);
}
