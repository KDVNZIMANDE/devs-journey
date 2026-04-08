import { Suspense } from "react";
import Link from "next/link";
import { connectDB } from "@/lib/db/mongoose";
import { Project, User } from "@/models";
import FeedClient from "@/components/feed/FeedClient";
import ProjectCardSkeleton from "@/components/feed/ProjectCardSkeleton";

export default async function FeedPage() {
  await connectDB();

  const projects = await Project.find({ isCompleted: false })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const authorIds = [...new Set(projects.map((p) => p.authorId))];
  const authors = await User.find({ clerkId: { $in: authorIds } })
    .select("clerkId firstName lastName imageUrl username")
    .lean();

  const authorMap = Object.fromEntries(authors.map((a) => [a.clerkId, a]));
  const initialProjects = projects.map((p) => ({
    ...p,
    _id: p._id.toString(),
    author: authorMap[p.authorId] ?? null,
  }));

  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-manrope)]">

      {/* Page header bar */}
      <div className="border-b border-zinc-200">
        <div className="mx-auto max-w-[1100px] px-6 py-10">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <span className="inline-block bg-green-100 text-green-700 font-mono text-[11px] font-medium tracking-[0.08em] px-[10px] py-[3px] rounded-full mb-3">
                Live feed
              </span>
              <h1 className="font-[family-name:var(--font-dm-serif)] text-[clamp(32px,4vw,48px)] leading-[1.05] tracking-[-0.03em] text-zinc-900 m-0">
                What&apos;s being built,
                <br />
                <span className="text-green-600">right now.</span>
              </h1>
            </div>

            <div className="flex items-center gap-3 pb-1">
              {/* Live indicator */}
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 px-5 py-[10px] bg-zinc-900 text-white rounded font-semibold text-[14px] transition hover:bg-zinc-800 hover:-translate-y-px no-underline"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Post your project
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Feed + sidebar layout */}
      <div className="mx-auto max-w-[1100px] px-6 py-10">
        <div className="grid grid-cols-[1fr_280px] max-lg:grid-cols-1 gap-10 items-start">

          {/* Main feed */}
          <div>
            <Suspense fallback={<ProjectCardSkeleton count={4} />}>
              <FeedClient
                initialProjects={JSON.parse(JSON.stringify(initialProjects))}
              />
            </Suspense>
          </div>

          {/* Sidebar */}
          <aside className="sticky top-20 max-lg:hidden space-y-6">

            {/* Filter by stage */}
            <div className="border border-zinc-200 p-5">
              <h3 className="font-[family-name:var(--font-dm-serif)] text-[16px] text-zinc-900 mb-4">
                Filter by stage
              </h3>
              <div className="flex flex-col gap-2">
                {["All", "Idea", "Planning", "Building", "Testing", "Launched"].map(
                  (stage) => (
                    <button
                      key={stage}
                      className="text-left text-[13px] font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 px-3 py-2 rounded transition-colors"
                    >
                      {stage}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* CTA to post */}
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

            {/* Link to wall */}
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
      </div>
    </div>
  );
}