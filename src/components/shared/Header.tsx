"use client";

import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import { useState } from "react";

export default function Header() {
  const { isSignedIn, isLoaded } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm font-(family-name:--font-manrope)">
      <div className="mx-auto max-w-275 px-6 h-15 flex items-center justify-between">
        {/* Wordmark */}
        <Link href="/" className="no-underline">
          <span className="font-(family-name:--font-dm-serif) text-[22px] tracking-[-0.02em] text-zinc-100">
            Dev<span className="text-green-400">Build</span>
          </span>
        </Link>

        {/* Desktop nav — hidden on mobile */}
        <div className="hidden sm:flex items-center gap-7">
          <Link href="/feed" className="text-[14px] font-medium text-zinc-400 no-underline hover:text-zinc-100 transition-colors">
            Feed
          </Link>
          <Link href="/celebration-wall" className="text-[14px] font-medium text-zinc-400 no-underline hover:text-zinc-100 transition-colors">
            Wall
          </Link>

          {!isLoaded ? (
            <div className="w-30 h-8 rounded bg-zinc-800 animate-pulse" />
          ) : isSignedIn ? (
            <div className="flex items-center gap-4">
              <Link href="/projects/new" className="inline-flex items-center gap-2 px-4 py-1.75 border border-zinc-700 rounded text-[13px] font-semibold text-zinc-200 transition hover:border-zinc-400 hover:bg-zinc-800">
                <PlusIcon />
                New project
              </Link>
              <Link href="/dashboard" className="text-[14px] font-medium text-zinc-400 no-underline hover:text-zinc-100 transition-colors">
                Dashboard
              </Link>
              <UserButton appearance={{ elements: { avatarBox: "w-8 h-8 rounded-full ring-2 ring-zinc-700 hover:ring-green-400 transition-all" } }} />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/sign-in" className="text-[14px] font-semibold text-zinc-300 no-underline hover:text-zinc-500 transition-colors">
                Sign in
              </Link>
              <Link href="/sign-up" className="inline-flex items-center gap-2 px-5 py-2 bg-zinc-100 text-zinc-900 rounded text-[14px] font-semibold transition hover:bg-white hover:-translate-y-px">
                Get started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile right — avatar + hamburger */}
        <div className="flex sm:hidden items-center gap-3">
          {isLoaded && isSignedIn && (
            <UserButton appearance={{ elements: { avatarBox: "w-8 h-8 rounded-full ring-2 ring-zinc-700 hover:ring-green-400 transition-all" } }} />
          )}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex flex-col gap-[5px] p-1.5 text-zinc-400 hover:text-zinc-100 transition-colors"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <span className={`block w-[18px] h-[1.5px] bg-current rounded transition-transform origin-center ${menuOpen ? "translate-y-[6.5px] rotate-45" : ""}`} />
            <span className={`block w-[18px] h-[1.5px] bg-current rounded transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-[18px] h-[1.5px] bg-current rounded transition-transform origin-center ${menuOpen ? "-translate-y-[6.5px] -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden border-t border-zinc-800 bg-zinc-950 px-6 py-4 flex flex-col gap-0">
          <MobileLink href="/feed" onClick={() => setMenuOpen(false)}>Feed</MobileLink>
          <MobileLink href="/celebration-wall" onClick={() => setMenuOpen(false)}>Wall</MobileLink>

          {isLoaded && isSignedIn && (
            <MobileLink href="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</MobileLink>
          )}

          <div className="mt-4 flex gap-2.5">
            {isLoaded && isSignedIn ? (
              <Link
                href="/projects/new"
                onClick={() => setMenuOpen(false)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-zinc-700 rounded text-[13px] font-semibold text-zinc-200 transition hover:border-zinc-400 hover:bg-zinc-800"
              >
                <PlusIcon />
                New project
              </Link>
            ) : (
              <>
                <Link href="/sign-in" onClick={() => setMenuOpen(false)} className="flex-1 inline-flex items-center justify-center py-2.5 border border-zinc-700 rounded text-[14px] font-semibold text-zinc-200 transition hover:bg-zinc-800">
                  Sign in
                </Link>
                <Link href="/sign-up" onClick={() => setMenuOpen(false)} className="flex-1 inline-flex items-center justify-center py-2.5 bg-zinc-100 text-zinc-900 rounded text-[14px] font-semibold transition hover:bg-white">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function MobileLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="text-[14px] font-medium text-zinc-400 no-underline hover:text-zinc-100 transition-colors py-3 border-b border-zinc-800/60 last:border-b-0"
    >
      {children}
    </Link>
  );
}

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}