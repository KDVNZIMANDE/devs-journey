import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 py-8 px-6 font-(family-name:--font-manrope)">
      <div className="mx-auto max-w-275 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="no-underline">
          <span className="font-(family-name:--font-dm-serif) text-[18px] text-zinc-900">
            Dev<span className="text-green-600">Build</span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/feed"
            className="text-[13px] text-zinc-500 no-underline hover:text-zinc-900 transition-colors"
          >
            Feed
          </Link>
          <Link
            href="/celebration-wall"
            className="text-[13px] text-zinc-500 no-underline hover:text-zinc-900 transition-colors"
          >
            Wall
          </Link>
        </div>

        <span className="text-[13px] text-zinc-500">
          Built by developers, for developers.
        </span>
      </div>
    </footer>
  );
}