import { Suspense } from "react";
import Link from "next/link";
import { connectDB } from "@/lib/db/mongoose";
import { Project as ProjectModel, User } from "@/models";
import FeedWrapper from "@/components/feed/FeedWrapper";
import ProjectCardSkeleton from "@/components/feed/ProjectCardSkeleton";

export default async function FeedPage() {
  await connectDB();

  const projects = await ProjectModel.find({ isCompleted: false })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const authorIds = [...new Set(projects.map((p) => p.authorId))];
  const authors   = await User.find({ clerkId: { $in: authorIds } })
    .select("clerkId firstName lastName imageUrl username")
    .lean();

  const authorMap       = Object.fromEntries(authors.map((a) => [a.clerkId, a]));
  const initialProjects = projects.map((p) => ({
    ...p,
    _id:    p._id.toString(),
    author: authorMap[p.authorId] ?? null,
  }));

  return (
    <div className="min-h-screen bg-zinc-950 font-[family-name:var(--font-manrope)]">

      {/* Page header */}
      <div className="relative border-b border-zinc-800 overflow-hidden">
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-green-500/5 blur-3xl" />

        <div className="relative mx-auto max-w-[1100px] px-6 py-12">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <span className="inline-flex items-center gap-1.5 bg-green-950 text-green-400 font-mono text-[11px] font-medium tracking-[0.08em] px-[10px] py-[4px] rounded-full mb-4 border border-green-900">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Live feed
              </span>
              <h1 className="font-[family-name:var(--font-dm-serif)] text-[clamp(32px,4vw,52px)] leading-[1.02] tracking-[-0.03em] text-zinc-100 m-0">
                What&apos;s being built,
                <br />
                <span className="text-green-400">right now.</span>
              </h1>
            </div>
            <div className="flex items-center gap-3 pb-1">
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 px-5 py-[10px] bg-zinc-100 text-zinc-900 rounded-lg font-semibold text-[14px] transition hover:bg-white hover:-translate-y-px no-underline"
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

      {/* Feed */}
      <div className="mx-auto max-w-[1100px] px-6 py-10">
        <Suspense fallback={<ProjectCardSkeleton count={4} />}>
          <FeedWrapper initialProjects={JSON.parse(JSON.stringify(initialProjects))} />
        </Suspense>
      </div>
    </div>
  );
}