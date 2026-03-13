import Link from "next/link";
import { cookies } from "next/headers";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";
import AdminSignOut from "./AdminSignOut";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  const authenticated = token ? await verifySessionToken(token) : false;

  if (!authenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin/dashboard" className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-[#0068b5] rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <span className="font-semibold text-gray-900 text-sm">ניהול</span>
            </Link>

            <nav className="flex items-center gap-1">
              <Link
                href="/admin/dashboard"
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                הודעות
              </Link>
              <Link
                href="/admin/new"
                className="px-3 py-1.5 text-sm text-white bg-[#0068b5] hover:bg-[#004f8c] rounded-md transition-colors"
              >
                + הודעה חדשה
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              צפייה באתר ↗
            </Link>
            <AdminSignOut />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</div>
    </div>
  );
}
