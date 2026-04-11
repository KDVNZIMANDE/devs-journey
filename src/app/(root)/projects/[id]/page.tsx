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
  idea:     { bg: "bg-purple-50", text: "text-purple-700" },
  planning: { bg: "bg-blue-50",   text: "text-blue-700"   },
  building: { bg: "bg-amber-50",  text: "text-amber-700"  },
  testing:  { bg: "bg-orange-50", text: "text-orange-700" },
  launched: { bg: "bg-green-50",  text: "text-green-700"  },
};

function StageBadge({ stage }: { stage: string }) {
  const s = STAGE_STYLES[stage] ?? { bg: "bg-zinc-100", text: "text-zinc-500" };
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
    return <img src={imageUrl} alt={name} className={`w-${size} h-${size} rounded-full object-cover`} />;
  }
  return (
    <div className={`w-${size} h-${size} rounded-full bg-green-50 border border-green-200 flex items-center justify-center font-[family-name:var(--font-dm-serif)] text-green-600`}
      style={{ fontSize: size * 1.8 }}>
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

  // ── Project ────────────────────────────────────────────────────────────────
  const [project, setProject]         = useState<Project | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [projectError, setProjectError]     = useState<string | null>(null);

  // ── Milestones ─────────────────────────────────────────────────────────────
  const [milestones, setMilestones]       = useState<Milestone[]>([]);
  const [loadingMilestones, setLoadingMilestones] = useState(true);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneTitle, setMilestoneTitle]       = useState("");
  const [milestoneDesc, setMilestoneDesc]         = useState("");
  const [postingMilestone, setPostingMilestone]   = useState(false);
  const [milestoneError, setMilestoneError]       = useState<string | null>(null);

  // ── Comments ───────────────────────────────────────────────────────────────
  const [comments, setComments]           = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText, setCommentText]         = useState("");
  const [postingComment, setPostingComment]   = useState(false);
  const [commentError, setCommentError]       = useState<string | null>(null);

  // ── Ship confirmation ──────────────────────────────────────────────────────
  const [showShipConfirm, setShowShipConfirm] = useState(false);
  const [shipping, setShipping]               = useState(false);
  const [shipError, setShipError]             = useState<string | null>(null);

  // ── Fetch project ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setLoadingProject(true);
      const result = await getProject(id);
      if (!result.success || !result.data) {
        setProjectError("Project not found.");
      } else {
        setProject(result.data);
      }
      setLoadingProject(false);
    };
    fetch();
  }, [id]);

  // ── Fetch milestones ───────────────────────────────────────────────────────
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

  // ── Fetch comments ─────────────────────────────────────────────────────────
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

  // ── Post milestone ─────────────────────────────────────────────────────────
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

  // ── Post comment ───────────────────────────────────────────────────────────
  const handlePostComment = useCallback(async () => {
    if (!commentText.trim()) return;
    setPostingComment(true);
    setCommentError(null);

    const result = await createComment({
      projectId: id,
      content:   commentText.trim(),
    });

    if (!result.success) {
      setCommentError(result.message ?? "Failed to post comment.");
      setPostingComment(false);
      return;
    }

    if (result.data) setComments((prev) => [...prev, result.data!]);
    setCommentText("");
    setPostingComment(false);
  }, [id, commentText]);

  // ── Ship project ───────────────────────────────────────────────────────────
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-200 border-t-green-500 rounded-full animate-spin" />
          <p className="font-mono text-[12px] text-zinc-400">Loading project…</p>
        </div>
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-zinc-500 text-[14px] mb-4">{projectError ?? "Something went wrong."}</p>
          <button onClick={() => router.back()} className="text-[13px] font-semibold text-green-600 hover:text-green-800 transition-colors">
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
    <div className="min-h-screen bg-white font-[family-name:var(--font-manrope)]">

      {/* ── Header ── */}
      <div className="border-b border-zinc-200">
        <div className="mx-auto max-w-[1100px] px-6 py-8">

          <button
            onClick={() => router.back()}
            className="font-mono text-[12px] text-zinc-400 hover:text-zinc-700 transition-colors mb-5 flex items-center gap-1"
          >
            ← Back
          </button>

          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-0">

              {/* Stage + completed badge */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <StageBadge stage={project.stage} />
                {project.isCompleted && (
                  <span className="font-mono text-[11px] font-medium px-[10px] py-[3px] rounded-full bg-green-100 text-green-700">
                    Shipped 🎉
                  </span>
                )}
                <span className="font-mono text-[11px] text-zinc-400">{project.viewCount} views</span>
              </div>

              <h1 className="font-[family-name:var(--font-dm-serif)] text-[clamp(24px,4vw,40px)] leading-[1.08] tracking-[-0.02em] text-zinc-900 mb-3">
                {project.title}
              </h1>

              {/* Author row */}
              <div className="flex items-center gap-2.5">
                <Avatar
                  name={authorName}
                  imageUrl={project.author?.imageUrl}
                  size={7}
                />
                <div>
                  <p className="text-[13px] font-semibold text-zinc-700">{authorName}</p>
                  <p className="font-mono text-[11px] text-zinc-400">
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
                  className="text-[13px] font-semibold px-4 py-2 border border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 transition-colors rounded no-underline"
                >
                  Edit
                </Link>
                <button
                  onClick={() => setShowShipConfirm(true)}
                  className="text-[13px] font-semibold px-4 py-2 border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 hover:border-green-400 transition-colors rounded"
                >
                  Ship it ✓
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Ship confirm modal ── */}
      {showShipConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => !shipping && setShowShipConfirm(false)}
        >
          <div
            className="bg-white rounded-xl border border-zinc-200 p-8 max-w-[440px] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-[family-name:var(--font-dm-serif)] text-[24px] text-zinc-900 mb-2">
              Ship this project? 🚀
            </h2>
            <p className="text-[14px] text-zinc-500 leading-[1.65] mb-6">
              Marking it as complete will move it to the <strong className="text-zinc-700">Celebration Wall</strong> and close it from the live feed. This cannot be undone.
            </p>
            {shipError && (
              <p className="text-[13px] text-red-600 mb-4 font-mono">{shipError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleShip}
                disabled={shipping}
                className="flex-1 py-2.5 bg-zinc-900 text-white text-[14px] font-semibold rounded hover:bg-zinc-800 transition disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {shipping ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Shipping…
                  </>
                ) : "Yes, ship it"}
              </button>
              <button
                onClick={() => setShowShipConfirm(false)}
                disabled={shipping}
                className="flex-1 py-2.5 border border-zinc-200 text-zinc-600 text-[14px] font-semibold rounded hover:border-zinc-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div className="mx-auto max-w-[1100px] px-6 py-10">
        <div className="grid grid-cols-[1fr_320px] max-lg:grid-cols-1 gap-10 items-start">

          {/* ── Main column ── */}
          <div className="space-y-10">

            {/* Description */}
            <section>
              <SectionLabel>About this project</SectionLabel>
              <p className="text-[15px] text-zinc-600 leading-[1.75] whitespace-pre-wrap">
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
                      className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded text-[13px] font-semibold text-zinc-700 hover:border-zinc-400 hover:text-zinc-900 transition-colors no-underline"
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
                      className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded text-[13px] font-semibold text-zinc-700 hover:border-zinc-400 hover:text-zinc-900 transition-colors no-underline"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      Live demo
                    </a>
                  )}
                  {project.targetLaunchDate && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-zinc-200 rounded text-[13px] text-zinc-400 font-mono">
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
                    className="text-[12px] font-semibold text-green-600 hover:text-green-800 transition-colors font-mono"
                  >
                    {showMilestoneForm ? "× Cancel" : "+ Log milestone"}
                  </button>
                )}
              </div>

              {/* Milestone form */}
              {showMilestoneForm && (
                <div className="border border-zinc-200 rounded-lg p-4 mb-5 bg-zinc-50">
                  {milestoneError && (
                    <p className="text-[12px] text-red-500 font-mono mb-3">{milestoneError}</p>
                  )}
                  <input
                    type="text"
                    value={milestoneTitle}
                    onChange={(e) => setMilestoneTitle(e.target.value)}
                    placeholder="What did you achieve? (e.g. Shipped auth flow)"
                    className="w-full border border-zinc-200 px-3 py-2 text-[13px] text-zinc-900 outline-none focus:border-green-500 transition-colors rounded mb-2 bg-white"
                  />
                  <textarea
                    value={milestoneDesc}
                    onChange={(e) => setMilestoneDesc(e.target.value.slice(0, 500))}
                    placeholder="More detail… (optional)"
                    rows={2}
                    className="w-full border border-zinc-200 px-3 py-2 text-[13px] text-zinc-900 outline-none focus:border-green-500 transition-colors resize-none rounded mb-3 bg-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handlePostMilestone}
                      disabled={!milestoneTitle.trim() || postingMilestone}
                      className="px-4 py-1.5 bg-zinc-900 text-white text-[12px] font-semibold rounded hover:bg-zinc-800 transition disabled:opacity-40 disabled:pointer-events-none"
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
                    <div key={i} className="h-14 bg-zinc-50 rounded animate-pulse" />
                  ))}
                </div>
              ) : milestones.length === 0 ? (
                <div className="border border-dashed border-zinc-200 rounded-lg p-8 text-center">
                  <p className="text-[13px] text-zinc-400">No milestones logged yet.</p>
                  {isOwner && (
                    <p className="text-[12px] text-zinc-300 mt-1 font-mono">
                      Hit &quot;Log milestone&quot; to record your first win.
                    </p>
                  )}
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[11px] top-2 bottom-2 w-px bg-zinc-100" />
                  <div className="space-y-4">
                    {milestones.map((m) => (
                      <div key={String(m._id)} className="flex gap-4 relative">
                        <div className="w-6 h-6 rounded-full bg-green-100 border-2 border-green-400 flex items-center justify-center shrink-0 mt-0.5 z-10">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                        </div>
                        <div className="flex-1 pb-1">
                          <p className="text-[14px] font-semibold text-zinc-800">{m.title}</p>
                          {m.description && (
                            <p className="text-[13px] text-zinc-500 leading-[1.6] mt-0.5">{m.description}</p>
                          )}
                          <p className="font-mono text-[11px] text-zinc-400 mt-1">{timeAgo(m.createdAt)}</p>
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
                  <span className="font-mono text-[10px] bg-zinc-100 text-zinc-400 px-2 py-0.5 rounded-full ml-1 normal-case tracking-normal">
                    {comments.length}
                  </span>
                )}
              </SectionLabel>

              {/* Comment input */}
              <div className="flex gap-3 mb-6">
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
                    className="w-full border border-zinc-200 px-3 py-2.5 text-[13px] text-zinc-900 outline-none focus:border-green-500 transition-colors resize-none rounded"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-mono text-[11px] text-zinc-300">{commentText.length} / 500</span>
                    <div className="flex items-center gap-2">
                      {commentError && (
                        <span className="text-[11px] text-red-500 font-mono">{commentError}</span>
                      )}
                      <button
                        onClick={handlePostComment}
                        disabled={!commentText.trim() || postingComment}
                        className="px-4 py-1.5 bg-zinc-900 text-white text-[12px] font-semibold rounded hover:bg-zinc-800 transition disabled:opacity-40 disabled:pointer-events-none"
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
                      <div className="w-8 h-8 rounded-full bg-zinc-100 shrink-0" />
                      <div className="flex-1">
                        <div className="h-3 w-24 bg-zinc-100 rounded mb-2" />
                        <div className="h-3 w-full bg-zinc-50 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <p className="text-[13px] text-zinc-400 text-center py-6">
                  No comments yet. Start the conversation.
                </p>
              ) : (
                <div className="space-y-5">
                  {comments.map((c) => {
                    const name = c.author
                      ? `${c.author.firstName} ${c.author.lastName}`
                      : "Developer";
                    return (
                      <div key={String(c._id)} className="flex gap-3">
                        <Avatar name={name} imageUrl={c.author?.imageUrl} size={8} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[13px] font-semibold text-zinc-800">{name}</span>
                            {c.author?.username && (
                              <span className="font-mono text-[11px] text-zinc-400">@{c.author.username}</span>
                            )}
                            <span className="font-mono text-[11px] text-zinc-300">·</span>
                            <span className="font-mono text-[11px] text-zinc-400">{timeAgo(c.createdAt)}</span>
                          </div>
                          <p className="text-[14px] text-zinc-600 leading-[1.65]">{c.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* ── Sidebar ── */}
          <aside className="sticky top-20 space-y-6">

            {/* Tech stack */}
            {project.techStack.length > 0 && (
              <div className="border border-zinc-200 rounded-lg p-5">
                <p className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-zinc-400 mb-3">Tech stack</p>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map((t) => (
                    <span key={t} className="font-mono text-[11px] bg-zinc-100 text-zinc-600 px-[10px] py-[4px] rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Support needed */}
            {project.supportNeeded.length > 0 && (
              <div className="border border-zinc-200 rounded-lg p-5">
                <p className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-zinc-400 mb-3">Looking for</p>
                <div className="space-y-2">
                  {project.supportNeeded.map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                      <span className="text-[13px] text-zinc-600 capitalize">{s.replace("-", " ")}</span>
                    </div>
                  ))}
                </div>
                {!isOwner && (
                  <button
                    onClick={() => {
                      const el = document.getElementById("comments");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="mt-4 w-full py-2 border border-green-300 text-green-700 text-[13px] font-semibold rounded hover:bg-green-50 hover:border-green-400 transition-colors"
                  >
                    ✋ Raise hand
                  </button>
                )}
              </div>
            )}

            {/* Project meta */}
            <div className="border border-zinc-200 rounded-lg p-5">
              <p className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-zinc-400 mb-3">Details</p>
              <div className="space-y-2.5">
                <MetaRow label="Stage">
                  <StageBadge stage={project.stage} />
                </MetaRow>
                <MetaRow label="Posted">
                  <span className="text-[13px] text-zinc-600">{new Date(project.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</span>
                </MetaRow>
                <MetaRow label="Updated">
                  <span className="text-[13px] text-zinc-600">{timeAgo(project.updatedAt)}</span>
                </MetaRow>
                <MetaRow label="Views">
                  <span className="font-mono text-[13px] text-zinc-600">{project.viewCount}</span>
                </MetaRow>
                <MetaRow label="Milestones">
                  <span className="font-mono text-[13px] text-zinc-600">{milestones.length}</span>
                </MetaRow>
              </div>
            </div>

            {/* Author card */}
            {project.author && (
              <div className="border border-zinc-200 rounded-lg p-5">
                <p className="font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-zinc-400 mb-3">Builder</p>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar
                    name={authorName}
                    imageUrl={project.author.imageUrl}
                    size={9}
                  />
                  <div>
                    <p className="text-[14px] font-semibold text-zinc-800">{authorName}</p>
                    <p className="font-mono text-[11px] text-zinc-400">@{project.author.username}</p>
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
    <p className="text-[11px] font-bold font-mono tracking-[0.1em] uppercase text-zinc-400 border-b border-zinc-100 pb-2 mb-4">
      {children}
    </p>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-zinc-400 font-mono">{label}</span>
      {children}
    </div>
  );
}