"use client";

import { useState } from "react";
import Link from "next/link";
import FeedClient, { StageFilter } from "./FeedClient";
import type { Project, ProjectStage } from "@/types";

export default function FeedWrapper({ initialProjects }: { initialProjects: Project[] }) {
  const [activeStage, setActiveStage] = useState<ProjectStage | "all">("all");

  return (
    <div className="grid grid-cols-[1fr_280px] max-lg:grid-cols-1 gap-10 items-start">

      {/* Main feed */}
      <FeedClient
        initialProjects={initialProjects}
        activeStage={activeStage}
        onStageChange={setActiveStage}
      />

      {/* Sidebar */}
      <aside className="sticky top-20 max-lg:hidden space-y-6">

        <div className="border border-zinc-200 p-5">
          <h3 className="font-[family-name:var(--font-dm-serif)] text-[16px] text-zinc-900 mb-4">
            Filter by stage
          </h3>
          <StageFilter active={activeStage} onChange={setActiveStage} />
        </div>

        <div className="border border-zinc-200 bg-green-50 p-5">
          <p className="font-[family-name:var(--font-dm-serif)] text-[18px] leading-snug text-zinc-900 mb-3">
            Building something?
          </p>
          <p className="text-[13px] text-zinc-500 leading-[1.6] mb-4">
            Share your project, log milestones, and find collaborators.
          </p>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 w-full justify-center px-4 py-[10px] bg-zinc-900 text-white rounded text-[13px] font-semibold transition hover:bg-zinc-800 no-underline"
          >
            Post your project
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        <div className="border border-zinc-200 p-5">
          <p className="font-[family-name:var(--font-dm-serif)] text-[16px] text-zinc-900 mb-1">
            Celebration Wall
          </p>
          <p className="text-[13px] text-zinc-500 leading-[1.6] mb-3">
            See who&apos;s shipped and earned their place.
          </p>
          <Link
            href="/celebration-wall"
            className="text-[13px] font-semibold text-green-600 hover:text-green-800 transition-colors no-underline"
          >
            View the wall →
          </Link>
        </div>

      </aside>
    </div>
  );
}