import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-10">
      {/* Top bar — dark Intel blue */}
      <div className="bg-[#0071c5] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-wide">Intel Israel Newsroom</span>
          </div>
          <a
            href="https://www.intel.co.il"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/80 hover:text-white transition-colors"
          >
            intel.co.il ←
          </a>
        </div>
      </div>

      {/* Main bar — white */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-[#0071c5] rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">intel</span>
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900 tracking-tight block leading-tight">
                חדר החדשות
              </span>
              <span className="text-[11px] text-gray-400 font-medium">
                הודעות לעיתונות
              </span>
            </div>
          </Link>

          <div className="hidden sm:flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-[#0071c5] font-medium"
            >
              כל ההודעות
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
