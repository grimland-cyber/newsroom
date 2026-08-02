"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  saveRelease,
  deleteRelease,
  getReleaseById,
  slugExists,
} from "@/lib/db";
import type { MediaAsset, PressRelease } from "@/lib/types";

function parseFormData(formData: FormData) {
  const title = (formData.get("title") as string).trim();
  const slug = (formData.get("slug") as string).trim();
  const excerpt = (formData.get("excerpt") as string).trim() || null;
  const content = (formData.get("content") as string) ?? "";
  const publishedAt = formData.get("publishedAt") as string;
  const isPublished = formData.get("isPublished") === "true";
  const rawAssets = formData.get("mediaAssets") as string;
  const mediaAssets: MediaAsset[] = rawAssets
    ? (JSON.parse(rawAssets) as MediaAsset[]).filter(
        (a) => a.name.trim() && a.url.trim()
      )
    : [];
  const category = (formData.get("category") as string)?.trim() || null;

  return { title, slug, excerpt, content, publishedAt, isPublished, mediaAssets, category };
}

export async function createRelease(formData: FormData): Promise<void> {
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
    published_at: data.publishedAt
      ? new Date(data.publishedAt).toISOString()
      : now,
    created_at: now,
    updated_at: now,
    is_published: data.isPublished,
    media_assets: data.mediaAssets,
    category: data.category,
  };

  await saveRelease(release);
  revalidatePath("/");
  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard");
}

export async function updateRelease(
  id: string,
  formData: FormData
): Promise<void> {
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
    published_at: data.publishedAt
      ? new Date(data.publishedAt).toISOString()
      : existing.published_at,
    updated_at: new Date().toISOString(),
    is_published: data.isPublished,
    media_assets: data.mediaAssets,
    category: data.category,
  };

  await saveRelease(updated);
  revalidatePath("/");
  revalidatePath(`/news/${updated.slug}`);
  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard");
}

export async function removeRelease(id: string): Promise<void> {
  const release = await getReleaseById(id);
  await deleteRelease(id);
  revalidatePath("/");
  revalidatePath("/admin/dashboard");
  if (release) revalidatePath(`/news/${release.slug}`);
}