"use client";

import { useState } from "react";
import Link from "next/link";
import FeedClient, { StageFilter } from "./FeedClient";
import type { Project, ProjectStage } from "@/types";

export default function FeedWrapper({ initialProjects }: { initialProjects: Project[] }) {
  const [activeStage, setActiveStage] = useState<ProjectStage | "all">("all");

  return (
    <div className="grid grid-cols-[1fr_260px] max-lg:grid-cols-1 gap-8 items-start">

      {/* Main feed */}
      <FeedClient
        initialProjects={initialProjects}
        activeStage={activeStage}
        onStageChange={setActiveStage}
      />

      {/* Sidebar */}
      <aside className="sticky top-20 max-lg:hidden space-y-4">

        {/* Stage filter */}
        <div className="border border-zinc-800 bg-zinc-900 rounded-lg p-4">
          <h3 className="font-[family-name:var(--font-dm-serif)] text-[15px] text-zinc-100 mb-3 px-1">
            Filter by stage
          </h3>
          <StageFilter active={activeStage} onChange={setActiveStage} />
        </div>

        {/* CTA */}
        <div className="relative overflow-hidden border border-zinc-800 bg-zinc-900 rounded-lg p-5">
          {/* Green glow */}
          <div className="pointer-events-none absolute right-0 top-0 w-48 h-full bg-gradient-to-l from-green-500/8 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-lg bg-green-500" />
          <p className="font-[family-name:var(--font-dm-serif)] text-[17px] leading-snug text-zinc-100 mb-2">
            Building something?
          </p>
          <p className="text-[13px] text-zinc-400 leading-[1.6] mb-4">
            Share your project, log milestones, and find collaborators.
          </p>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 w-full justify-center px-4 py-2.5 bg-zinc-100 text-zinc-900 rounded-md text-[13px] font-semibold transition hover:bg-white no-underline"
          >
            Post your project
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        {/* Wall link */}
        <div className="border border-zinc-800 bg-zinc-900 rounded-lg p-5">
          <p className="font-[family-name:var(--font-dm-serif)] text-[15px] text-zinc-100 mb-1">
            Celebration Wall
          </p>
          <p className="text-[13px] text-zinc-400 leading-[1.6] mb-3">
            See who&apos;s shipped and earned their place.
          </p>
          <Link
            href="/celebration-wall"
            className="text-[13px] font-semibold text-green-400 hover:text-green-300 transition-colors no-underline"
          >
            View the wall →
          </Link>
        </div>

      </aside>
    </div>
  );
}