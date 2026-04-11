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

  const authorMap      = Object.fromEntries(authors.map((a) => [a.clerkId, a]));
  const initialProjects = projects.map((p) => ({
    ...p,
    _id:    p._id.toString(),
    author: authorMap[p.authorId] ?? null,
  }));

  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-manrope)]">

      {/* Page header */}
      <div className="border-b border-zinc-200">
        <div className="mx-auto max-w-[1100px] px-6 py-10">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <span className="inline-block bg-green-100 text-green-700 font-mono text-[11px] font-medium tracking-[0.08em] px-[10px] py-[3px] rounded-full mb-3">
                Live feed
              </span>
              <h1 className="font-[family-name:var(--font-dm-serif)] text-[clamp(32px,4vw,48px)] leading-[1.05] tracking-[-0.03em] text-zinc-900 m-0">
                What&apos;s being built,<br />
                <span className="text-green-600">right now.</span>
              </h1>
            </div>
            <div className="flex items-center gap-3 pb-1">
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

      {/* Feed */}
      <div className="mx-auto max-w-[1100px] px-6 py-10">
        <Suspense fallback={<ProjectCardSkeleton count={4} />}>
          <FeedWrapper initialProjects={JSON.parse(JSON.stringify(initialProjects))} />
        </Suspense>
      </div>
    </div>
  );
}