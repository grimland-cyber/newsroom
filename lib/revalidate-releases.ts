import { revalidatePath, revalidateTag, updateTag } from "next/cache";
import { RELEASES_CACHE_TAG } from "@/lib/cache-tags";

function revalidateReleasePaths(slugs: Array<string | null | undefined>): void {
  // Root layout covers the homepage (including ?category=) and article routes.
  revalidatePath("/", "layout");
  revalidatePath("/feed/[category]", "page");
  revalidatePath("/admin/dashboard");
  for (const slug of slugs) {
    if (slug) revalidatePath(`/news/${slug}`);
  }
}

/** Call from Server Actions so the next request sees the write immediately. */
export function revalidateAfterReleaseChange(slugs: Array<string | null | undefined>): void {
  updateTag(RELEASES_CACHE_TAG);
  revalidateReleasePaths(slugs);
}

/** Route handlers cannot call updateTag. expire: 0 drops the data cache now. */
export function revalidateAfterReleaseChangeFromRoute(
  slugs: Array<string | null | undefined>
): void {
  revalidateTag(RELEASES_CACHE_TAG, { expire: 0 });
  revalidateReleasePaths(slugs);
}
