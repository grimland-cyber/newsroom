import type { Metadata } from "next";
import ReleaseIndex from "@/components/ReleaseIndex";
import { getPublishedReleases } from "@/lib/db";
import { CATEGORIES } from "@/lib/types";

// Literal required by Next. Keep in step with PUBLIC_REVALIDATE_SECONDS.
export const revalidate = 300;

interface Props {
  params: Promise<{ category: string }>;
}

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ category: category.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  return {
    alternates: {
      canonical: `/?category=${encodeURIComponent(category)}`,
    },
  };
}

/**
 * Cached rendering of /?category=...
 * next.config rewrites that query onto this route so the public URL stays the same.
 */
export default async function CategoryFeedPage({ params }: Props) {
  const { category } = await params;
  const releases = await getPublishedReleases();
  return <ReleaseIndex releases={releases} activeCategory={category} />;
}
