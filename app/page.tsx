import Link from "next/link";
import { getPublishedReleases } from "@/lib/db";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

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
  const [hero, ...rest] = releases;

  return (
    <>
      <SiteHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero */}
        {hero && (
          <Link href={`/news/${hero.slug}`} className="block group mb-10">
            <div className="intel-gradient rounded-2xl p-8 sm:p-12 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
              <div className="relative max-w-3xl">
                <time className="text-sm text-white/70 font-medium">
                  {formatDate(hero.published_at)}
                </time>
                <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                  {hero.title}
                </h1>
                {hero.excerpt && (
                  <p className="mt-4 text-base sm:text-lg text-white/80 leading-relaxed line-clamp-3">
                    {hero.excerpt}
                  </p>
                )}
                <span className="inline-flex items-center gap-2 mt-6 text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                  קרא עוד ←
                </span>
              </div>
            </div>
          </Link>
        )}

        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">כל ההודעות</h2>
          <span className="text-xs text-gray-400 font-medium bg-gray-100 px-3 py-1 rounded-full">
            {releases.length} הודעות
          </span>
        </div>

        {releases.length === 0 && (
          <div className="text-center py-24 text-gray-400">
            <p className="text-lg">אין הודעות לעיתונות כרגע</p>
          </div>
        )}

        {/* Card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rest.map((release) => (
            <article key={release.id} className="group">
              <Link
                href={`/news/${release.slug}`}
                className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-[#0071c5] hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                {/* Accent bar */}
                <div className="h-1 bg-[#0071c5]" />

                <div className="flex flex-col flex-1 p-5">
                  <time className="text-xs text-[#0071c5] font-medium">
                    {formatDate(release.published_at)}
                  </time>
                  <h3 className="mt-2 text-base font-semibold text-gray-900 group-hover:text-[#0071c5] transition-colors leading-snug line-clamp-3">
                    {release.title}
                  </h3>
                  {release.excerpt && (
                    <p className="mt-2 text-sm text-gray-500 line-clamp-3 leading-relaxed flex-1">
                      {release.excerpt}
                    </p>
                  )}
                  <span className="mt-4 text-xs font-medium text-[#0071c5] group-hover:text-[#005a9e]">
                    קרא עוד ←
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
