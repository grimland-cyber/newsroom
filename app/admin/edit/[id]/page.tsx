import Link from "next/link";
import { getAllReleases } from "@/lib/db";
import DeleteButton from "./DeleteButton";

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "תאריך לא זמין";
  }

  return date.toLocaleDateString("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const releases = await getAllReleases();

  return (
    <div>
      {error && (
        <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">הודעות לעיתונות</h1>
          <p className="text-sm text-gray-500 mt-0.5">{releases.length} הודעות סה&quot;כ</p>
        </div>
        <Link
          href="/admin/new"
          className="inline-flex items-center gap-2 bg-[#0068b5] hover:bg-[#004f8c] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <span>+</span>
          <span>הודעה חדשה</span>
        </Link>
      </div>

      {releases.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400">אין הודעות עדיין</p>
          <Link
            href="/admin/new"
            className="mt-4 inline-block text-sm text-[#0068b5] hover:underline"
          >
            צור הודעה ראשונה →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-right px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
                  כותרת
                </th>
                <th className="text-right px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide hidden sm:table-cell">
                  תאריך
                </th>
                <th className="text-right px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide hidden md:table-cell">
                  סטטוס
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {releases.map((release) => (
                <tr key={release.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900 leading-snug">{release.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">/news/{release.slug}</p>
                  </td>
                  <td className="px-5 py-4 text-gray-500 hidden sm:table-cell whitespace-nowrap">
                    {formatDate(release.published_at)}
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        release.is_published
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {release.is_published ? "פורסם" : "טיוטה"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/news/${release.slug}`}
                        target="_blank"
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded hover:bg-gray-100"
                      >
                        צפייה
                      </Link>
                      <Link
                        href={`/admin/edit/${release.id}`}
                        className="text-xs text-[#0068b5] hover:text-[#004f8c] transition-colors px-2 py-1 rounded hover:bg-blue-50"
                      >
                        עריכה
                      </Link>
                      <DeleteButton id={release.id} title={release.title} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}