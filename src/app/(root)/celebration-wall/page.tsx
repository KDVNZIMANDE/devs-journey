"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "@/context/SessionContext";
import type { Project } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACCENT_COLORS = [
  "before:bg-green-500",
  "before:bg-blue-500",
  "before:bg-purple-500",
  "before:bg-amber-500",
  "before:bg-teal-500",
  "before:bg-rose-500",
];

const AVATAR_COLORS = [
  "bg-purple-950 text-purple-300",
  "bg-blue-950 text-blue-300",
  "bg-amber-950 text-amber-300",
  "bg-green-950 text-green-400",
  "bg-rose-950 text-rose-300",
  "bg-teal-950 text-teal-300",
];

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function formatShipDate(iso: string) {
  return new Date(iso).toLocaleDateString("en", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CelebrationWallPage() {
  const { wallProjects, isLoadingWallProjects } = useSession();

  const totalDevelopers = new Set(
    wallProjects.map((p) => p.author?.username).filter(Boolean)
  ).size;

  return (
    <div className="min-h-screen bg-zinc-950 font-[family-name:var(--font-manrope)]">

      {/* Header */}
      <div className="relative border-b border-zinc-800 overflow-hidden">
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-green-500/5 blur-3xl" />
        <div className="relative mx-auto max-w-[1100px] px-6 py-14">
          <div className="flex items-end justify-between gap-8 flex-wrap">
            <div>
              <span className="inline-flex items-center gap-1.5 bg-green-950 text-green-400 font-mono text-[11px] font-medium tracking-[0.08em] px-[10px] py-[4px] rounded-full mb-4 border border-green-900">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Celebration wall
              </span>
              <h1 className="font-[family-name:var(--font-dm-serif)] text-[clamp(36px,5vw,60px)] leading-[1.02] tracking-[-0.03em] text-zinc-100">
                Shipped and<br />
                <span className="text-green-400">celebrated.</span>
              </h1>
              <p className="text-zinc-400 text-[15px] leading-[1.65] mt-4 max-w-[460px]">
                Every project here was built in public and crossed the finish line.
              </p>
            </div>

            <div className="flex border border-zinc-800 divide-x divide-zinc-800 rounded-lg overflow-hidden mb-1">
              <Stat value={wallProjects.length} label="Projects shipped" />
              <Stat value={totalDevelopers} label="Developers" />
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-[1100px] px-6 py-10 pb-24">

        {/* CTA */}
        <div className="relative overflow-hidden border border-zinc-800 bg-zinc-900 rounded-lg p-6 mb-10 flex items-center justify-between gap-4 flex-wrap">
          <div className="pointer-events-none absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-green-500/5 to-transparent" />
          <div>
            <p className="font-[family-name:var(--font-dm-serif)] text-[18px] text-zinc-100 mb-1">
              Your project could be here.
            </p>
            <p className="text-[13px] text-zinc-400 leading-[1.6]">
              Ship something — even small — and earn your place on the wall.
            </p>
          </div>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 px-5 py-[10px] bg-zinc-100 text-zinc-900 rounded font-semibold text-[13px] transition hover:bg-white hover:-translate-y-px no-underline shrink-0"
          >
            Post your project →
          </Link>
        </div>

        {/* Grid */}
        {isLoadingWallProjects ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 animate-pulse">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-9 h-9 rounded-full bg-zinc-800" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-24 bg-zinc-800 rounded" />
                    <div className="h-2.5 w-16 bg-zinc-800 rounded" />
                  </div>
                </div>
                <div className="h-5 w-3/4 bg-zinc-800 rounded mb-2" />
                <div className="space-y-1.5 mb-4">
                  <div className="h-3 w-full bg-zinc-800 rounded" />
                  <div className="h-3 w-2/3 bg-zinc-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : wallProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wallProjects.map((project, i) => (
              <WallCard key={String(project._id)} project={project} index={i} />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-zinc-800 rounded-xl p-20 text-center">
            <p className="font-[family-name:var(--font-dm-serif)] text-[22px] text-zinc-600 mb-2">
              Nothing shipped yet.
            </p>
            <p className="text-[14px] text-zinc-600">Be the first to build and ship in public.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="px-8 py-5 bg-zinc-900">
      <div className="font-[family-name:var(--font-dm-serif)] text-[40px] text-zinc-100 leading-none">{value}</div>
      <div className="text-[11px] text-zinc-500 font-medium mt-1.5 uppercase tracking-[0.06em]">{label}</div>
    </div>
  );
}

function WallCard({ project, index }: { project: Project; index: number }) {
  const firstName = project.author?.firstName ?? "?";
  const lastName  = project.author?.lastName  ?? "";
  const username  = project.author?.username  ?? "unknown";
  const imageUrl  = project.author?.imageUrl;
  const color     = avatarColor(firstName);
  const accent    = ACCENT_COLORS[index % ACCENT_COLORS.length];

  return (
    <div className={`relative bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-600 hover:-translate-y-0.5 transition-all duration-200 group before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:rounded-t-lg ${accent}`}>

      {/* Author */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          {imageUrl ? (
            <Image src={imageUrl} alt={`${firstName} ${lastName}`} width={36} height={36} className="w-9 h-9 rounded-full object-cover ring-1 ring-zinc-700" />
          ) : (
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-[family-name:var(--font-dm-serif)] text-[13px] ${color}`}>
              {firstName.charAt(0)}{lastName.charAt(0)}
            </div>
          )}
          <div>
            <p className="text-[13px] font-semibold text-zinc-200 leading-tight">{firstName} {lastName}</p>
            <p className="font-mono text-[11px] text-zinc-500 leading-tight mt-0.5">@{username}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-medium px-[9px] py-[3px] bg-green-950 text-green-400 rounded-full border border-green-900 whitespace-nowrap shrink-0">
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Shipped
        </span>
      </div>

      {/* Content */}
      <h2 className="font-[family-name:var(--font-dm-serif)] text-[19px] leading-[1.2] tracking-[-0.02em] text-zinc-100 mb-2 group-hover:text-green-400 transition-colors">
        {project.title}
      </h2>
      <p className="text-[13px] text-zinc-400 leading-[1.65] line-clamp-3 mb-4">{project.description}</p>

      {/* Tech */}
      {project.techStack.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {project.techStack.map((tech) => (
            <span key={tech} className="font-mono text-[10px] bg-zinc-800 text-zinc-400 px-[8px] py-[3px] rounded-full border border-zinc-700">{tech}</span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
        <span className="font-mono text-[11px] text-zinc-600">
          {project.completedAt ? formatShipDate(String(project.completedAt)) : ""}
        </span>
        <div className="flex gap-2">
          {project.repoUrl && (
            <a href={project.repoUrl} target="_blank" rel="noreferrer" className="text-[12px] font-semibold px-3 py-1 border border-zinc-700 text-zinc-400 hover:border-zinc-400 hover:text-zinc-200 transition-colors rounded no-underline">
              Repo
            </a>
          )}
          {project.demoUrl && (
            <a href={project.demoUrl} target="_blank" rel="noreferrer" className="text-[12px] font-semibold px-3 py-1 border border-zinc-700 text-zinc-400 hover:border-green-500 hover:text-green-400 transition-colors rounded no-underline">
              Live →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}