"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/context/SessionContext";
import { getProject, completeProject } from "@/app/api/projects";
import { getMilestones, createMilestone } from "@/app/api/milestones";
import { getComments, createComment } from "@/app/api/comments";
import type { Project, Milestone, Comment } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STAGE_STYLES: Record<string, { bg: string; text: string }> = {
  idea:     { bg: "bg-purple-950", text: "text-purple-300" },
  planning: { bg: "bg-blue-950",   text: "text-blue-300"   },
  building: { bg: "bg-amber-950",  text: "text-amber-300"  },
  testing:  { bg: "bg-orange-950", text: "text-orange-300" },
  launched: { bg: "bg-green-950",  text: "text-green-400"  },
};

function StageBadge({ stage }: { stage: string }) {
  const s = STAGE_STYLES[stage] ?? { bg: "bg-zinc-800", text: "text-zinc-400" };
  return (
    <span className={`font-mono text-[11px] font-medium px-[10px] py-[3px] rounded-full ${s.bg} ${s.text}`}>
      {stage.charAt(0).toUpperCase() + stage.slice(1)}
    </span>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric" });
}

function Avatar({ name, imageUrl, size = 8 }: { name: string; imageUrl?: string; size?: number }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`w-${size} h-${size} rounded-full object-cover ring-1 ring-zinc-700`}
      />
    );
  }
  return (
    <div
      className={`w-${size} h-${size} rounded-full bg-green-950 border border-green-800 flex items-center justify-center font-[family-name:var(--font-dm-serif)] text-green-400`}
      style={{ fontSize: size * 1.8 }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const id     = params.id as string;

  const { userData } = useSession();

  const [project, setProject]               = useState<Project | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [projectError, setProjectError]     = useState<string | null>(null);

  const [milestones, setMilestones]               = useState<Milestone[]>([]);
  const [loadingMilestones, setLoadingMilestones] = useState(true);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneTitle, setMilestoneTitle]       = useState("");
  const [milestoneDesc, setMilestoneDesc]         = useState("");
  const [postingMilestone, setPostingMilestone]   = useState(false);
  const [milestoneError, setMilestoneError]       = useState<string | null>(null);

  const [comments, setComments]               = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText, setCommentText]         = useState("");
  const [postingComment, setPostingComment]   = useState(false);
  const [commentError, setCommentError]       = useState<string | null>(null);

  const [showShipConfirm, setShowShipConfirm] = useState(false);
  const [shipping, setShipping]               = useState(false);
  const [shipError, setShipError]             = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setLoadingProject(true);
      const result = await getProject(id);
      if (!result.success || !result.data) setProjectError("Project not found.");
      else setProject(result.data);
      setLoadingProject(false);
    };
    fetch();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setLoadingMilestones(true);
      const result = await getMilestones(id);
      if (result.success && result.data) setMilestones(result.data);
      setLoadingMilestones(false);
    };
    fetch();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setLoadingComments(true);
      const result = await getComments(id);
      if (result.success && result.data) setComments(result.data);
      setLoadingComments(false);
    };
    fetch();
  }, [id]);

  const handlePostMilestone = useCallback(async () => {
    if (!milestoneTitle.trim()) return;
    setPostingMilestone(true);
    setMilestoneError(null);
    const result = await createMilestone({
      projectId:   id,
      title:       milestoneTitle.trim(),
      description: milestoneDesc.trim() || undefined,
    });
    if (!result.success) {
      setMilestoneError(result.message ?? "Failed to post milestone.");
      setPostingMilestone(false);
      return;
    }
    if (result.data) setMilestones((prev) => [result.data!, ...prev]);
    setMilestoneTitle("");
    setMilestoneDesc("");
    setShowMilestoneForm(false);
    setPostingMilestone(false);
  }, [id, milestoneTitle, milestoneDesc]);

  const handlePostComment = useCallback(async () => {
    if (!commentText.trim()) return;
    setPostingComment(true);
    setCommentError(null);
    const result = await createComment({ projectId: id, content: commentText.trim() });
    if (!result.success) {
      setCommentError(result.message ?? "Failed to post comment.");
      setPostingComment(false);
      return;
    }
    if (result.data) setComments((prev) => [...prev, result.data!]);
    setCommentText("");
    setPostingComment(false);
  }, [id, commentText]);

  const handleShip = useCallback(async () => {
    setShipping(true);
    setShipError(null);
    const result = await completeProject(id);
    if (!result.success) {
      setShipError(result.message ?? "Failed to mark as complete.");
      setShipping(false);
      return;
    }
    router.push("/celebration-wall");
  }, [id, router]);

  const isOwner = userData?.clerkId === project?.authorId;

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loadingProject) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-green-500 rounded-full animate-spin" />
          <p className="font-mono text-[12px] text-zinc-500">Loading project…</p>
        </div>
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-zinc-500 text-[14px] mb-4">{projectError ?? "Something went wrong."}</p>
          <button onClick={() => router.back()} className="text-[13px] font-semibold text-green-400 hover:text-green-300 transition-colors">
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  const authorName = project.author
    ? `${project.author.firstName} ${project.author.lastName}`
    : "Unknown developer";

  return (
    <div className="min-h-screen bg-zinc-950 font-[family-name:var(--font-manrope)]">

      {/* ── Header ── */}
      <div className="border-b border-zinc-800">
        <div className="mx-auto max-w-[1100px] px-6 py-8">

          <button
            onClick={() => router.back()}
            className="font-mono text-[12px] text-zinc-500 hover:text-zinc-300 transition-colors mb-6 flex items-center gap-1.5 group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform inline-block">←</span> Back
          </button>

          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-0">

              {/* Badges row */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <StageBadge stage={project.stage} />
                {project.isCompleted && (
                  <span className="font-mono text-[11px] font-medium px-[10px] py-[3px] rounded-full bg-green-950 text-green-400 border border-green-900">
                    Shipped 🎉
                  </span>
                )}
                <span className="font-mono text-[11px] text-zinc-600">{project.viewCount} views</span>
              </div>

              <h1 className="font-[family-name:var(--font-dm-serif)] text-[clamp(26px,4vw,44px)] leading-[1.06] tracking-[-0.025em] text-zinc-100 mb-5">
                {project.title}
              </h1>

              {/* Author row */}
              <div className="flex items-center gap-3">
                <Avatar name={authorName} imageUrl={project.author?.imageUrl} size={8} />
                <div>
                  <p className="text-[13px] font-semibold text-zinc-300">{authorName}</p>
                  <p className="font-mono text-[11px] text-zinc-500">
                    @{project.author?.username} · {timeAgo(project.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Owner actions */}
            {isOwner && !project.isCompleted && (
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <Link
                  href={`/projects/${id}/edit`}
                  className="text-[13px] font-semibold px-4 py-2 border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors rounded no-underline"
                >
                  Edit
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto max-w-[1100px] px-6 py-10">
        <div className="grid grid-cols-[1fr_300px] max-lg:grid-cols-1 gap-10 items-start">

          {/* ── Main column ── */}
          <div className="space-y-10">

            {/* Description */}
            <section>
              <SectionLabel>About this project</SectionLabel>
              <p className="text-[15px] text-zinc-400 leading-[1.8] whitespace-pre-wrap">
                {project.description}
              </p>
            </section>

            {/* Links */}
            {(project.repoUrl || project.demoUrl || project.targetLaunchDate) && (
              <section>
                <SectionLabel>Links & timeline</SectionLabel>
                <div className="flex flex-wrap gap-3">
                  {project.repoUrl && (
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-700 rounded text-[13px] font-semibold text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors no-underline"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58v-2.03c-3.34.72-4.04-1.61-4.04-1.61-.54-1.38-1.33-1.74-1.33-1.74-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02.005 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.7.82.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg>
                      Repository
                    </a>
                  )}
                  {project.demoUrl && (
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-700 rounded text-[13px] font-semibold text-zinc-400 hover:border-green-600 hover:text-green-400 transition-colors no-underline"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      Live demo
                    </a>
                  )}
                  {project.targetLaunchDate && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-zinc-700 rounded text-[13px] text-zinc-500 font-mono">
                      🎯 Target: {new Date(project.targetLaunchDate).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  )}
                </div>
              </section>
            )}

            {/* Milestones */}
            <section id="milestones">
              <div className="flex items-center justify-between mb-4">
                <SectionLabel>Milestones</SectionLabel>
                {isOwner && !project.isCompleted && (
                  <button
                    onClick={() => setShowMilestoneForm((v) => !v)}
                    className="text-[12px] font-semibold text-green-400 hover:text-green-300 transition-colors font-mono"
                  >
                    {showMilestoneForm ? "× Cancel" : "+ Log milestone"}
                  </button>
                )}
              </div>

              {/* Milestone form */}
              {showMilestoneForm && (
                <div className="border border-zinc-700 rounded-lg p-4 mb-5 bg-zinc-900">
                  {milestoneError && (
                    <p className="text-[12px] text-red-400 font-mono mb-3">{milestoneError}</p>
                  )}
                  <input
                    type="text"
                    value={milestoneTitle}
                    onChange={(e) => setMilestoneTitle(e.target.value)}
                    placeholder="What did you achieve? (e.g. Shipped auth flow)"
                    className="w-full bg-zinc-800 border border-zinc-700 px-3 py-2 text-[13px] text-zinc-200 outline-none focus:border-green-500 transition-colors rounded mb-2 placeholder:text-zinc-600"
                  />
                  <textarea
                    value={milestoneDesc}
                    onChange={(e) => setMilestoneDesc(e.target.value.slice(0, 500))}
                    placeholder="More detail… (optional)"
                    rows={2}
                    className="w-full bg-zinc-800 border border-zinc-700 px-3 py-2 text-[13px] text-zinc-200 outline-none focus:border-green-500 transition-colors resize-none rounded mb-3 placeholder:text-zinc-600"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handlePostMilestone}
                      disabled={!milestoneTitle.trim() || postingMilestone}
                      className="px-4 py-1.5 bg-zinc-100 text-zinc-900 text-[12px] font-semibold rounded hover:bg-white transition disabled:opacity-40 disabled:pointer-events-none"
                    >
                      {postingMilestone ? "Posting…" : "Post milestone"}
                    </button>
                  </div>
                </div>
              )}

              {/* Milestone list */}
              {loadingMilestones ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-14 bg-zinc-800/60 rounded animate-pulse" />
                  ))}
                </div>
              ) : milestones.length === 0 ? (
                <div className="border border-dashed border-zinc-700 rounded-lg p-8 text-center">
                  <p className="text-[13px] text-zinc-500">No milestones logged yet.</p>
                  {isOwner && (
                    <p className="text-[12px] text-zinc-600 mt-1 font-mono">
                      Hit &quot;Log milestone&quot; to record your first win.
                    </p>
                  )}
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[11px] top-3 bottom-3 w-px bg-zinc-800" />
                  <div className="space-y-5">
                    {milestones.map((m) => (
                      <div key={String(m._id)} className="flex gap-4 relative">
                        <div className="w-6 h-6 rounded-full bg-green-950 border-2 border-green-600 flex items-center justify-center shrink-0 mt-0.5 z-10">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                        </div>
                        <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 hover:border-zinc-700 transition-colors">
                          <p className="text-[14px] font-semibold text-zinc-200">{m.title}</p>
                          {m.description && (
                            <p className="text-[13px] text-zinc-400 leading-[1.6] mt-1">{m.description}</p>
                          )}
                          <p className="font-mono text-[11px] text-zinc-600 mt-2">{timeAgo(m.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Comments */}
            <section id="comments">
              <SectionLabel>
                Discussion{" "}
                {comments.length > 0 && (
                  <span className="font-mono text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full ml-1 normal-case tracking-normal">
                    {comments.length}
                  </span>
                )}
              </SectionLabel>

              {/* Comment input */}
              <div className="flex gap-3 mb-8">
                {userData && (
                  <Avatar
                    name={`${userData.firstName} ${userData.lastName}`}
                    imageUrl={userData.imageUrl}
                    size={8}
                  />
                )}
                <div className="flex-1">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value.slice(0, 500))}
                    placeholder="Leave a comment, raise a question, or offer to help…"
                    rows={3}
                    className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2.5 text-[13px] text-zinc-200 outline-none focus:border-green-500 transition-colors resize-none rounded placeholder:text-zinc-600"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-mono text-[11px] text-zinc-600">{commentText.length} / 500</span>
                    <div className="flex items-center gap-2">
                      {commentError && (
                        <span className="text-[11px] text-red-400 font-mono">{commentError}</span>
                      )}
                      <button
                        onClick={handlePostComment}
                        disabled={!commentText.trim() || postingComment}
                        className="px-4 py-1.5 bg-zinc-100 text-zinc-900 text-[12px] font-semibold rounded hover:bg-white transition disabled:opacity-40 disabled:pointer-events-none"
                      >
                        {postingComment ? "Posting…" : "Post comment"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comment list */}
              {loadingComments ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0" />
                      <div className="flex-1">
                        <div className="h-3 w-24 bg-zinc-800 rounded mb-2" />
                        <div className="h-3 w-full bg-zinc-800/60 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <p className="text-[13px] text-zinc-500 text-center py-8 border border-dashed border-zinc-800 rounded-lg">
                  No comments yet. Start the conversation.
                </p>
              ) : (
                <div className="space-y-1">
                  {comments.map((c) => {
                    const name = c.author
                      ? `${c.author.firstName} ${c.author.lastName}`
                      : "Developer";
                    return (
                      <div
                        key={String(c._id)}
                        className="flex gap-3 px-4 py-4 rounded-lg hover:bg-zinc-900 transition-colors"
                      >
                        <Avatar name={name} imageUrl={c.author?.imageUrl} size={8} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-[13px] font-semibold text-zinc-200">{name}</span>
                            {c.author?.username && (
                              <span className="font-mono text-[11px] text-zinc-500">@{c.author.username}</span>
                            )}
                            <span className="font-mono text-[11px] text-zinc-700">·</span>
                            <span className="font-mono text-[11px] text-zinc-600">{timeAgo(c.createdAt)}</span>
                          </div>
                          <p className="text-[14px] text-zinc-400 leading-[1.7]">{c.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* ── Sidebar ── */}
          <aside className="sticky top-20 space-y-4">

            {/* Tech stack */}
            {project.techStack.length > 0 && (
              <div className="border border-zinc-800 bg-zinc-900 rounded-lg p-5">
                <p className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-zinc-500 mb-3">Tech stack</p>
                <div className="flex flex-wrap gap-1.5">
                  {project.techStack.map((t) => (
                    <span key={t} className="font-mono text-[11px] bg-zinc-800 text-zinc-400 border border-zinc-700 px-[10px] py-[4px] rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Support needed */}
            {project.supportNeeded.length > 0 && (
              <div className="border border-zinc-800 bg-zinc-900 rounded-lg p-5">
                <p className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-zinc-500 mb-3">Looking for</p>
                <div className="space-y-2">
                  {project.supportNeeded.map((s) => (
                    <div key={s} className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                      <span className="text-[13px] text-zinc-400 capitalize">{s.replace("-", " ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Project meta */}
            <div className="border border-zinc-800 bg-zinc-900 rounded-lg p-5">
              <p className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-zinc-500 mb-3">Details</p>
              <div className="space-y-2.5">
                <MetaRow label="Stage"><StageBadge stage={project.stage} /></MetaRow>
                <MetaRow label="Posted">
                  <span className="text-[13px] text-zinc-400">{new Date(project.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</span>
                </MetaRow>
                <MetaRow label="Updated">
                  <span className="text-[13px] text-zinc-400">{timeAgo(project.updatedAt)}</span>
                </MetaRow>
                <MetaRow label="Views">
                  <span className="font-mono text-[13px] text-zinc-400">{project.viewCount}</span>
                </MetaRow>
                <MetaRow label="Milestones">
                  <span className="font-mono text-[13px] text-zinc-400">{milestones.length}</span>
                </MetaRow>
              </div>
            </div>

            {/* Author card */}
            {project.author && (
              <div className="border border-zinc-800 bg-zinc-900 rounded-lg p-5">
                <p className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-zinc-500 mb-3">Builder</p>
                <div className="flex items-center gap-3">
                  <Avatar name={authorName} imageUrl={project.author.imageUrl} size={10} />
                  <div>
                    <p className="text-[14px] font-semibold text-zinc-200">{authorName}</p>
                    <p className="font-mono text-[11px] text-zinc-500 mt-0.5">@{project.author.username}</p>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold font-mono tracking-[0.1em] uppercase text-zinc-500 border-b border-zinc-800 pb-2 mb-5">
      {children}
    </p>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-zinc-600 font-mono">{label}</span>
      {children}
    </div>
  );
}