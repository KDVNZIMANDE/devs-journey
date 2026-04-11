"use client";

import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";

export default function Header() {
  const { isSignedIn, user, isLoaded } = useUser();

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm font-(family-name:--font-manrope)">
      <div className="mx-auto max-w-275 px-6 h-15 flex items-center justify-between">
        {/* Wordmark */}
        <Link href="/" className="no-underline">
          <span className="font-(family-name:--font-dm-serif) text-[22px] tracking-[-0.02em] text-zinc-100">
            Dev<span className="text-green-400">Build</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-7">
          <Link
            href="/feed"
            className="text-[14px] font-medium text-zinc-400 no-underline hover:text-zinc-100 transition-colors"
          >
            Feed
          </Link>
          <Link
            href="/celebration-wall"
            className="text-[14px] font-medium text-zinc-400 no-underline hover:text-zinc-100 transition-colors"
          >
            Wall
          </Link>

          {/* Auth-aware right section */}
          {!isLoaded ? (
            <div className="w-30 h-8 rounded bg-zinc-800 animate-pulse" />
          ) : isSignedIn ? (
            <div className="flex items-center gap-4">
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 px-4 py-1.75 border border-zinc-700 rounded text-[13px] font-semibold text-zinc-200 transition hover:border-zinc-400 hover:bg-zinc-800"
              >
                <PlusIcon />
                New project
              </Link>
              <Link
                href="/dashboard"
                className="text-[14px] font-medium text-zinc-400 no-underline hover:text-zinc-100 transition-colors hidden sm:block"
              >
                Dashboard
              </Link>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 rounded-full ring-2 ring-zinc-700 hover:ring-green-400 transition-all",
                  },
                }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/sign-in"
                className="text-[14px] font-semibold text-zinc-300 no-underline hover:text-zinc-500 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 px-5 py-2 bg-zinc-100 text-zinc-900 rounded text-[14px] font-semibold transition hover:bg-white hover:-translate-y-px"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}