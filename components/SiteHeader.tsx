import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-[#0068b5] rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">i</span>
          </div>
          <span className="text-lg font-semibold text-gray-900 tracking-tight">
            חדר החדשות
          </span>
        </Link>
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
          הודעות לעיתונות
        </span>
      </div>
    </header>
  );
}
