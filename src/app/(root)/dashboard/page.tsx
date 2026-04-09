"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "@/context/SessionContext";

import type { Project } from "@/types";
import { updateUserProfile } from "@/app/api/user";

// ─── Stage badge ──────────────────────────────────────────────────────────────

const STAGE_STYLES: Record<string, string> = {
  idea:     "bg-purple-50 text-purple-700",
  planning: "bg-blue-50 text-blue-700",
  building: "bg-amber-50 text-amber-700",
  testing:  "bg-orange-50 text-orange-700",
  launched: "bg-green-50 text-green-700",
};

function StageBadge({ stage }: { stage: string }) {
  return (
    <span className={`font-mono text-[11px] font-medium px-2.5 py-0.75 rounded-full ${STAGE_STYLES[stage] ?? "bg-zinc-100 text-zinc-500"}`}>
      {stage.charAt(0).toUpperCase() + stage.slice(1)}
    </span>
  );
}

// ─── Relative time helper ─────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric" });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { userData, reloadUserData, isLoadingUser, projects, isLoadingProjects } = useSession();

  const [editingProfile, setEditingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Edit local state — initialised from context
  const [editBio, setEditBio]           = useState("");
  const [editGithub, setEditGithub]     = useState("");
  const [editPortfolio, setEditPortfolio] = useState("");
  const [editAvail, setEditAvail]       = useState(true);

  function openEdit() {
    setEditBio(userData?.bio ?? "");
    setEditGithub(userData?.githubUrl ?? "");
    setEditPortfolio(userData?.portfolioUrl ?? "");
    setEditAvail(userData?.availableForCollab ?? true);
    setSaveError(null);
    setEditingProfile(true);
  }

  function cancelEdit() {
    setEditingProfile(false);
    setSaveError(null);
  }

  async function saveProfile() {
    setSaving(true);
    setSaveError(null);

    const result = await updateUserProfile({
      bio:                editBio,
      githubUrl:          editGithub,
      portfolioUrl:       editPortfolio,
      availableForCollab: editAvail,
    });

    setSaving(false);

    if (!result.success) {
      setSaveError(result.message ?? "Failed to save. Please try again.");
      return;
    }

    reloadUserData();
    setEditingProfile(false);
  }

  async function toggleCollab() {
    if (!userData) return;
    await updateUserProfile({ availableForCollab: !userData.availableForCollab });
    reloadUserData();
  }

  const activeProjects  = projects.filter((p) => !p.isCompleted);
  const shippedProjects = projects.filter((p) => p.isCompleted);

  // ─── Loading state ────────────────────────────────────────────────────────

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-200 border-t-green-500 rounded-full animate-spin" />
          <p className="font-mono text-[12px] text-zinc-400">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-zinc-500 text-[14px]">Could not load your profile. Please refresh.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-(family-name:--font-manrope)">

      {/* Header */}
      <div className="border-b border-zinc-200">
        <div className="mx-auto max-w-275 px-6 py-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              {userData.imageUrl ? (
                <Image
                  src={userData.imageUrl}
                  alt={userData.firstName}
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-zinc-200"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center font-(family-name:--font-dm-serif) text-[22px] text-green-600">
                  {userData.firstName.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="font-(family-name:--font-dm-serif) text-[22px] text-zinc-900 leading-tight">
                  {userData.firstName} {userData.lastName}
                </h1>
                <p className="font-mono text-[12px] text-zinc-400 mt-0.5">
                  @{userData.username} · Member since{" "}
                  {new Date(userData.createdAt).toLocaleDateString("en", { month: "long", year: "numeric" })}
                </p>
              </div>
            </div>

            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded font-semibold text-[14px] transition hover:bg-zinc-800 hover:-translate-y-px no-underline"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              New project
            </Link>
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-6 flex-wrap">
            {[
              { value: activeProjects.length,  label: "Active projects" },
              { value: shippedProjects.length, label: "Shipped" },
            ].map((stat, i, arr) => (
              <div key={stat.label} className="flex items-stretch gap-8">
                <div>
                  <div className="font-(family-name:--font-dm-serif) text-[30px] text-zinc-900 leading-none">
                    {stat.value}
                  </div>
                  <div className="text-[12px] text-zinc-400 font-medium mt-1">{stat.label}</div>
                </div>
                {i < arr.length - 1 && <div className="w-px bg-zinc-200" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-275 px-6 py-10">
        <div className="grid grid-cols-[1fr_300px] max-lg:grid-cols-1 gap-10 items-start">

          {/* ── Projects column ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-(family-name:--font-dm-serif) text-[18px] text-zinc-900">Your projects</h2>
              <span className="font-mono text-[11px] text-zinc-400">{activeProjects.length} active</span>
            </div>

            {isLoadingProjects ? (
              <div className="border border-zinc-200 divide-y divide-zinc-100">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-5 animate-pulse">
                    <div className="h-4 w-48 bg-zinc-100 rounded mb-3" />
                    <div className="h-3 w-full bg-zinc-50 rounded mb-2" />
                    <div className="h-3 w-2/3 bg-zinc-50 rounded" />
                  </div>
                ))}
              </div>
            ) : activeProjects.length === 0 ? (
              <div className="border border-dashed border-zinc-200 p-12 text-center">
                <p className="text-zinc-400 text-[14px] mb-4">No active projects yet.</p>
                <Link
                  href="/projects/new"
                  className="inline-flex items-center gap-2 px-5 py-2.25 bg-zinc-900 text-white text-[13px] font-semibold rounded hover:bg-zinc-800 transition no-underline"
                >
                  Post your first project
                </Link>
              </div>
            ) : (
              <div className="border border-zinc-200 divide-y divide-zinc-100">
                {activeProjects.map((project) => (
                  <ProjectRow key={String(project._id)} project={project} />
                ))}
              </div>
            )}

            {/* Shipped */}
            {shippedProjects.length > 0 && (
              <div className="mt-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-(family-name:--font-dm-serif) text-[18px] text-zinc-900">
                    Shipped 🎉
                  </h2>
                  <span className="font-mono text-[11px] text-zinc-400">{shippedProjects.length} completed</span>
                </div>
                <div className="border border-zinc-200 divide-y divide-zinc-100 opacity-75">
                  {shippedProjects.map((project) => (
                    <div key={String(project._id)} className="p-5">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <h3 className="font-(family-name:--font-dm-serif) text-[16px] text-zinc-900 mb-1">
                            {project.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <StageBadge stage="launched" />
                            <span className="font-mono text-[11px] text-zinc-400">
                              Shipped{" "}
                              {project.completedAt
                                ? new Date(project.completedAt).toLocaleDateString("en", { month: "short", year: "numeric" })
                                : ""}
                            </span>
                          </div>
                        </div>
                        <Link
                          href="/celebration-wall"
                          className="text-[13px] font-semibold text-green-600 hover:text-green-800 transition-colors no-underline"
                        >
                          View on wall →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Profile sidebar ── */}
          <aside className="sticky top-20">
            <div className="border border-zinc-200 p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-(family-name:--font-dm-serif) text-[16px] text-zinc-900">Profile</h3>
                {!editingProfile && (
                  <button
                    onClick={openEdit}
                    className="text-[12px] font-semibold text-green-600 hover:text-green-800 transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>

              {saveError && (
                <div className="mb-4 border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700 rounded">
                  {saveError}
                </div>
              )}

              {!editingProfile ? (
                /* ── View mode ── */
                <div className="space-y-4">
                  <div>
                    <p className="font-mono text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1">Bio</p>
                    <p className="text-[13px] text-zinc-600 leading-[1.6]">
                      {userData.bio || <span className="text-zinc-300 italic">No bio yet.</span>}
                    </p>
                  </div>

                  <hr className="border-zinc-100" />

                  <div>
                    <p className="font-mono text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-2">Tech stack</p>
                    <div className="flex flex-wrap gap-1.5">
                      {userData.techStack.length > 0
                        ? userData.techStack.map((t) => (
                            <span key={t} className="font-mono text-[11px] bg-green-50 border border-green-200 text-green-700 px-2.25 py-0.75 rounded-full">
                              {t}
                            </span>
                          ))
                        : <span className="text-zinc-300 text-[12px] italic">None added yet.</span>
                      }
                    </div>
                  </div>

                  {(userData.githubUrl || userData.portfolioUrl) && (
                    <>
                      <hr className="border-zinc-100" />
                      <div className="space-y-2">
                        {userData.githubUrl && (
                          <div>
                            <p className="font-mono text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-0.5">GitHub</p>
                            <a href={userData.githubUrl} target="_blank" rel="noreferrer" className="text-[13px] text-green-600 hover:text-green-800 no-underline">
                              {userData.githubUrl.replace("https://", "")}
                            </a>
                          </div>
                        )}
                        {userData.portfolioUrl && (
                          <div>
                            <p className="font-mono text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-0.5">Portfolio</p>
                            <a href={userData.portfolioUrl} target="_blank" rel="noreferrer" className="text-[13px] text-green-600 hover:text-green-800 no-underline">
                              {userData.portfolioUrl.replace("https://", "")}
                            </a>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <hr className="border-zinc-100" />

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={toggleCollab}
                      className={`relative w-9 h-5 rounded-full transition-colors ${userData.availableForCollab ? "bg-green-500" : "bg-zinc-200"}`}
                    >
                      <span className={`absolute top-0.75 w-3.5 h-3.5 rounded-full bg-white transition-transform ${userData.availableForCollab ? "translate-x-4.5" : "translate-x-0.75"}`} />
                    </button>
                    <span className="text-[13px] text-zinc-600">
                      {userData.availableForCollab ? "Open to collaborate" : "Not available"}
                    </span>
                  </div>
                </div>
              ) : (
                /* ── Edit mode ── */
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[13px] font-semibold text-zinc-600">Bio</label>
                      <span className="font-mono text-[11px] text-zinc-400">{editBio.length} / 300</span>
                    </div>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value.slice(0, 300))}
                      rows={3}
                      className="w-full border border-zinc-200 px-3 py-2 text-[13px] text-zinc-900 outline-none focus:border-green-500 transition-colors resize-none rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-zinc-600 mb-1.5">GitHub URL</label>
                    <input
                      type="url"
                      value={editGithub}
                      onChange={(e) => setEditGithub(e.target.value)}
                      className="w-full border border-zinc-200 px-3 py-2 text-[13px] text-zinc-900 outline-none focus:border-green-500 transition-colors rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-zinc-600 mb-1.5">Portfolio</label>
                    <input
                      type="url"
                      value={editPortfolio}
                      onChange={(e) => setEditPortfolio(e.target.value)}
                      className="w-full border border-zinc-200 px-3 py-2 text-[13px] text-zinc-900 outline-none focus:border-green-500 transition-colors rounded"
                    />
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setEditAvail((v) => !v)}
                      className={`relative w-9 h-5 rounded-full transition-colors ${editAvail ? "bg-green-500" : "bg-zinc-200"}`}
                    >
                      <span className={`absolute top-0.75 w-3.5 h-3.5 rounded-full bg-white transition-transform ${editAvail ? "translate-x-4.5" : "translate-x-0.75"}`} />
                    </button>
                    <span className="text-[13px] text-zinc-600">
                      {editAvail ? "Open to collaborate" : "Not available"}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className="px-4 py-2 bg-zinc-900 text-white text-[13px] font-semibold rounded hover:bg-zinc-800 transition disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {saving ? "Saving…" : "Save"}
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={saving}
                      className="px-4 py-2 border border-zinc-200 text-[13px] font-semibold text-zinc-500 rounded hover:border-zinc-400 hover:text-zinc-700 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}

// ─── Project row ──────────────────────────────────────────────────────────────

function ProjectRow({ project }: { project: Project }) {
  return (
    <div className="p-5 hover:border-l-2 hover:border-l-green-500 transition-all group">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <Link
            href={`/projects/${project._id}`}
            className="font-(family-name:--font-dm-serif) text-[16px] text-zinc-900 group-hover:text-green-700 transition-colors no-underline"
          >
            {project.title}
          </Link>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <StageBadge stage={project.stage} />
            <span className="font-mono text-[11px] text-zinc-400">Updated {timeAgo(project.updatedAt)}</span>
            <span className="font-mono text-[11px] text-zinc-400">{project.viewCount} views</span>
          </div>
          <p className="text-[13px] text-zinc-500 leading-normal mt-2 line-clamp-2">{project.description}</p>
          {project.techStack.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {project.techStack.slice(0, 5).map((t) => (
                <span key={t} className="font-mono text-[10px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <Link
            href={`/projects/${project._id}/edit`}
            className="text-[12px] font-semibold px-3 py-1.5 border border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 transition-colors rounded no-underline"
          >
            Edit
          </Link>
          <Link
            href={`/projects/${project._id}#milestones`}
            className="text-[12px] font-semibold px-3 py-1.5 border border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 transition-colors rounded no-underline"
          >
            Log milestone
          </Link>
          <button
            type="button"
            className="text-[12px] font-semibold px-3 py-1.5 border border-zinc-200 text-green-600 hover:border-green-500 hover:bg-green-50 transition-colors rounded"
          >
            Ship it ✓
          </button>
        </div>
      </div>
    </div>
  );
}