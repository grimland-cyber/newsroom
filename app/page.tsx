import Link from "next/link";
import { getPublishedReleases } from "@/lib/db";
import { CATEGORIES } from "@/lib/types";
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

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: activeCategory = "all" } = await searchParams;
  const releases = await getPublishedReleases();

  // Filter by category
  const filtered =
    activeCategory === "all"
      ? releases
      : releases.filter((r) => r.category === activeCategory);

  const [hero, ...rest] = filtered;

  // Group remaining by year
  const byYear = new Map<number, typeof rest>();
  for (const r of rest) {
    const year = new Date(r.published_at).getFullYear();
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(r);
  }
  const sortedYears = [...byYear.keys()].sort((a, b) => b - a);

  // Which categories actually have releases
  const usedCategories = new Set(releases.map((r) => r.category).filter(Boolean));

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
                <div className="flex items-center gap-3 mb-3">
                  <time className="text-sm text-white/70 font-medium">
                    {formatDate(hero.published_at)}
                  </time>
                  {hero.category && (
                    <>
                      <span className="text-white/40">·</span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
                        {CATEGORIES.find((c) => c.id === hero.category)?.label ?? hero.category}
                      </span>
                    </>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
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

        {/* Category filter */}
        {usedCategories.size > 0 && (
          <div className="flex gap-2 flex-wrap mb-10" dir="rtl">
            <Link
              href="/"
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === "all"
                  ? "bg-[#0071c5] text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              הכול
            </Link>
            {CATEGORIES.filter((c) => usedCategories.has(c.id)).map((cat) => (
              <Link
                key={cat.id}
                href={`/?category=${cat.id}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat.id
                    ? "bg-[#0071c5] text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        )}

        {/* Section header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-gray-900">כל ההודעות</h2>
          <span className="text-xs text-gray-400 font-medium bg-gray-100 px-3 py-1 rounded-full">
            {filtered.length} הודעות
          </span>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-24 text-gray-400">
            <p className="text-lg">אין הודעות לעיתונות בקטגוריה זו</p>
            <Link href="/" className="mt-4 inline-block text-sm text-[#0071c5] hover:underline">
              הצג הכול
            </Link>
          </div>
        )}

        {/* Cards grouped by year */}
        {sortedYears.map((year, yearIndex) => (
          <section key={year} className={yearIndex > 0 ? "mt-20" : ""}>
            {/* Year header */}
            <div className="flex items-center gap-5 mb-10">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 rounded-full bg-[#0071c5]" />
                <h3 className="text-2xl font-bold text-gray-900">{year}</h3>
              </div>
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium bg-gray-100 px-3 py-1 rounded-full">
                {byYear.get(year)!.length} הודעות
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {byYear.get(year)!.map((release) => (
                <article key={release.id} className="group">
                  <Link
                    href={`/news/${release.slug}`}
                    className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-[#0071c5] hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
                  >
                    <div className="h-1 bg-[#0071c5]" />
                    <div className="flex flex-col flex-1 p-7">
                      <div className="flex items-center gap-2 flex-wrap">
                        <time className="text-xs text-[#0071c5] font-medium">
                          {formatDate(release.published_at)}
                        </time>
                        {release.category && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                              {CATEGORIES.find((c) => c.id === release.category)?.label ?? release.category}
                            </span>
                          </>
                        )}
                      </div>
                      <h3 className="mt-4 text-base font-semibold text-gray-900 group-hover:text-[#0071c5] transition-colors leading-snug line-clamp-3">
                        {release.title}
                      </h3>
                      {release.excerpt && (
                        <p className="mt-3 text-sm text-gray-500 line-clamp-3 leading-relaxed flex-1">
                          {release.excerpt}
                        </p>
                      )}
                      <span className="mt-6 text-xs font-medium text-[#0071c5] group-hover:text-[#005a9e]">
                        קרא עוד ←
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ))}

        {/* Bottom spacer */}
        <div className="h-16" />
      </main>
      <SiteFooter />
    </>
  );
}
