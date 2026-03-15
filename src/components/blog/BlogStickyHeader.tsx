import Link from "next/link";

type BlogStickyHeaderProps = {
  showBlogLink?: boolean;
};

export default function BlogStickyHeader({
  showBlogLink = false,
}: BlogStickyHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="group inline-flex items-center">
          <span className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
            Hello<span className="text-[#2563EB]">China</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {showBlogLink ? (
            <Link
              href="/blog"
              className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
            >
              Blog
            </Link>
          ) : null}
          <a
            href="https://app.hellochina.chat"
            className="inline-flex items-center rounded-lg bg-[#2563EB] px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8] sm:px-4"
          >
            Try HelloChina
          </a>
        </div>
      </div>
    </header>
  );
}
