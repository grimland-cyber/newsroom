import { notFound } from "next/navigation";
import Link from "next/link";
import { getReleaseBySlug, getPublishedReleases } from "@/lib/db";
import type { MediaAsset } from "@/lib/types";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

interface Props {
  params: Promise<{ slug: string }>;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const release = await getReleaseBySlug(slug);
  if (!release || !release.is_published) return {};
  return {
    title: `${release.title} | חדר החדשות`,
    description: release.excerpt ?? undefined,
  };
}

export default async function ReleasePage({ params }: Props) {
  const { slug } = await params;
  const release = await getReleaseBySlug(slug);

  if (!release || !release.is_published) notFound();

  const allReleases = await getPublishedReleases();
  const related = allReleases
    .filter((r) => r.id !== release.id)
    .slice(0, 3);

  return (
    <>
      <SiteHeader />

      {/* Accent gradient bar */}
      <div className="h-1 intel-gradient" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-[#0071c5] transition-colors">
            חדר החדשות
          </Link>
          <span>/</span>
          <span className="text-gray-500">הודעות לעיתונות</span>
        </nav>

        <header className="mb-8 pb-8 border-b border-gray-200">
          <span className="inline-block bg-[#e8f4fd] text-[#0071c5] text-xs font-medium px-3 py-1.5 rounded-full mb-4">
            {formatDate(release.published_at)}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            {release.title}
          </h1>
          {release.excerpt && (
            <p className="mt-5 text-lg text-gray-500 leading-relaxed border-r-4 border-[#0071c5] pr-4">
              {release.excerpt}
            </p>
          )}
        </header>

        <div
          className="release-body text-gray-800"
          dangerouslySetInnerHTML={{ __html: release.content }}
        />

        {release.media_assets?.length > 0 && (
          <section className="mt-10 pt-8 border-t border-gray-200">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              נכסי מדיה
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {release.media_assets.map((asset: MediaAsset, index: number) => (
                <a
                  key={index}
                  href={asset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-lg border border-gray-200 bg-white hover:border-[#0071c5] hover:bg-[#e8f4fd] transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg intel-gradient flex items-center justify-center shrink-0">
                    <span className="text-white text-sm">↗</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-[#0071c5] transition-colors truncate">
                    {asset.name}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Share */}
        <div className="mt-10 pt-6 border-t border-gray-100 flex items-center gap-4">
          <span className="text-xs text-gray-400 font-medium">שתף:</span>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://newsroom-psi.vercel.app/news/${release.slug}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-[#0071c5] font-medium transition-colors"
          >
            LinkedIn
          </a>
          <button
            className="text-xs text-gray-400 hover:text-[#0071c5] font-medium transition-colors"
            data-url={`https://newsroom-psi.vercel.app/news/${release.slug}`}
          >
            העתק קישור
          </button>
        </div>

        {/* Related news */}
        {related.length > 0 && (
          <section className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-5">
              חדשות נוספות
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/news/${r.slug}`}
                  className="block p-4 rounded-xl border border-gray-200 bg-white hover:border-[#0071c5] hover:shadow-md transition-all group"
                >
                  <time className="text-xs text-[#0071c5] font-medium">
                    {formatShortDate(r.published_at)}
                  </time>
                  <h3 className="mt-1.5 text-sm font-semibold text-gray-900 group-hover:text-[#0071c5] transition-colors line-clamp-3 leading-snug">
                    {r.title}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
