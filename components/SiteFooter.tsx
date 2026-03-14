export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#1d1d1d] text-white/70 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0071c5] rounded flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">intel</span>
            </div>
            <span className="text-sm font-medium text-white/90">חדר החדשות</span>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <a
              href="https://www.intel.co.il"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              intel.co.il
            </a>
            <a
              href="https://newsroom.intel.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Intel Global Newsroom
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 text-xs text-white/40">
          <p>
            © {year} Intel Corporation. Intel, the Intel logo, and other Intel marks
            are trademarks of Intel Corporation or its subsidiaries.
          </p>
        </div>
      </div>
    </footer>
  );
}
