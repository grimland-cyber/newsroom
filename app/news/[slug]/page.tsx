import { notFound } from "next/navigation";
import Link from "next/link";
import { getReleaseBySlug } from "@/lib/db";
import type { MediaAsset } from "@/lib/types";
import SiteHeader from "@/components/SiteHeader";

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

  return (
    <>
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0068b5] transition-colors mb-8"
        >
          <span>←</span>
          <span>כל ההודעות</span>
        </Link>

        <header className="mb-8 pb-6 border-b border-gray-200">
          <time
            dateTime={release.published_at}
            className="text-sm text-[#0068b5] font-medium"
          >
            {formatDate(release.published_at)}
          </time>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 leading-tight">
            {release.title}
          </h1>
          {release.excerpt && (
            <p className="mt-3 text-base text-gray-500 leading-relaxed">
              {release.excerpt}
            </p>
          )}
        </header>

        <div
          className="release-body text-gray-800 text-base"
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
                  className="flex items-center gap-3 p-3.5 rounded-lg border border-gray-200 bg-white hover:border-[#0068b5] hover:bg-blue-50 transition-all group"
                >
                  <div className="w-9 h-9 rounded bg-[#0068b5]/10 flex items-center justify-center shrink-0 group-hover:bg-[#0068b5]/20 transition-colors">
                    <span className="text-[#0068b5] text-base">↗</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-[#0068b5] transition-colors truncate">
                    {asset.name}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-10 pt-6 border-t border-gray-100 text-xs text-gray-400">
          הודעה לעיתונות · {formatDate(release.published_at)}
        </footer>
      </main>
    </>
  );
}
