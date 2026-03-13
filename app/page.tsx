import Link from "next/link";
import { getPublishedReleases } from "@/lib/db";
import SiteHeader from "@/components/SiteHeader";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const releases = await getPublishedReleases();

  return (
    <>
      <SiteHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8 pb-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">הודעות לעיתונות</h1>
          <p className="mt-1 text-sm text-gray-500">
            {releases.length} הודעות
            {releases[0] && ` · עדכון אחרון: ${formatDate(releases[0].published_at)}`}
          </p>
        </div>

        {releases.length === 0 && (
          <div className="text-center py-24 text-gray-400">
            <p className="text-lg">אין הודעות לעיתונות כרגע</p>
          </div>
        )}

        <div className="divide-y divide-gray-100">
          {releases.map((release) => (
            <article key={release.id} className="py-6 group">
              <Link href={`/news/${release.slug}`} className="block">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-gray-900 group-hover:text-[#0068b5] transition-colors leading-snug">
                      {release.title}
                    </h2>
                    {release.excerpt && (
                      <p className="mt-2 text-sm text-gray-500 line-clamp-2 leading-relaxed">
                        {release.excerpt}
                      </p>
                    )}
                    {release.media_assets?.length > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                        <span>📎</span>
                        <span>{release.media_assets.length} קבצים מצורפים</span>
                      </div>
                    )}
                  </div>
                  <time
                    dateTime={release.published_at}
                    className="shrink-0 text-sm text-gray-400 font-medium mt-0.5 whitespace-nowrap"
                  >
                    {formatDate(release.published_at)}
                  </time>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
