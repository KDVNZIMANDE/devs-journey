"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "@/context/SessionContext";

import type { Project } from "@/types";
import { updateUserProfile } from "@/app/api/user";
import { completeProject } from "@/app/api/projects";

// ─── Stage badge ──────────────────────────────────────────────────────────────

const STAGE_STYLES: Record<string, string> = {
  idea:     "bg-purple-950 text-purple-300",
  planning: "bg-blue-950 text-blue-300",
  building: "bg-amber-950 text-amber-300",
  testing:  "bg-orange-950 text-orange-300",
  launched: "bg-green-950 text-green-400",
};

function StageBadge({ stage }: { stage: string }) {
  return (
    <span className={`font-mono text-[11px] font-medium px-2.5 py-0.75 rounded-full ${STAGE_STYLES[stage] ?? "bg-zinc-800 text-zinc-400"}`}>
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

// ─── Ship It Modal ────────────────────────────────────────────────────────────

function ShipItModal({
  project,
  onConfirm,
  onCancel,
  shipping,
  error,
}: {
  project: Project;
  onConfirm: () => void;
  onCancel: () => void;
  shipping: boolean;
  error: string | null;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={(e) => { if (e.target === e.currentTarget && !shipping) onCancel(); }}
    >
      <div
        className="bg-zinc-900 w-full max-w-[420px] rounded-xl border border-zinc-700 shadow-2xl
                   font-[family-name:var(--font-manrope)]
                   animate-[shipModal_0.22s_cubic-bezier(0.34,1.56,0.64,1)_forwards]"
      >
        <div className="h-[3px] w-full rounded-t-xl bg-green-500" />
        <div className="px-6 py-5">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-green-950 border border-green-800 flex items-center justify-center text-base shrink-0">
              🚀
            </div>
            <div>
              <p className="text-[17px] font-semibold text-zinc-100 mb-0.5">Ship this project?</p>
              <p className="text-[13px] text-zinc-400 leading-[1.5]">
                This marks the project as launched and moves it to your Shipped wall.
              </p>
            </div>
          </div>

          <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 mb-4">
            <p className="text-[14px] font-semibold text-zinc-200 mb-1">{project.title}</p>
            <p className="text-[12px] text-zinc-400 line-clamp-2 leading-[1.5] mb-2.5">{project.description}</p>
            {project.techStack.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {project.techStack.slice(0, 4).map((t) => (
                  <span key={t} className="font-mono text-[11px] bg-zinc-700 border border-zinc-600 text-zinc-300 px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 bg-amber-950/50 border border-amber-900 rounded-lg px-3 py-2.5 mb-5">
            <svg className="shrink-0 mt-px" width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5L1.5 13h13L8 1.5z" stroke="#fbbf24" strokeWidth="1.2" strokeLinejoin="round"/>
              <path d="M8 6v3.5M8 11v.5" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <p className="text-[12px] text-amber-300 leading-[1.5]">
              This cannot be undone. The stage will be set to <strong>Launched</strong> and removed from your active projects.
            </p>
          </div>

          {error && (
            <div className="border border-red-800 bg-red-950 px-3 py-2 text-[12px] text-red-300 rounded-lg mb-4">{error}</div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onConfirm}
              disabled={shipping}
              className="inline-flex items-center gap-2 px-5 py-2 bg-green-500 text-zinc-950 text-[13px] font-semibold rounded-lg transition hover:bg-green-400 hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
            >
              {shipping ? (
                <><span className="w-3.5 h-3.5 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" />Shipping…</>
              ) : "Ship it ✓"}
            </button>
            <button
              onClick={onCancel}
              disabled={shipping}
              className="px-4 py-2 border border-zinc-700 text-[13px] font-semibold text-zinc-400 rounded-lg transition hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-40"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { userData, reloadUserData, isLoadingUser, projects, isLoadingProjects, reloadProjects } = useSession();

  const [editingProfile, setEditingProfile] = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [saveError, setSaveError]           = useState<string | null>(null);

  const [editBio, setEditBio]             = useState("");
  const [editGithub, setEditGithub]       = useState("");
  const [editPortfolio, setEditPortfolio] = useState("");
  const [editAvail, setEditAvail]         = useState(true);
  const [editTechStack, setEditTechStack] = useState<string[]>([]);
  const [techInput, setTechInput]         = useState("");

  const [shipTarget, setShipTarget] = useState<Project | null>(null);
  const [shipping, setShipping]     = useState(false);
  const [shipError, setShipError]   = useState<string | null>(null);

  function openEdit() {
    setEditBio(userData?.bio ?? "");
    setEditGithub(userData?.githubUrl ?? "");
    setEditPortfolio(userData?.portfolioUrl ?? "");
    setEditAvail(userData?.availableForCollab ?? true);
    setEditTechStack(userData?.techStack ?? []);
    setTechInput("");
    setSaveError(null);
    setEditingProfile(true);
  }

  function cancelEdit() {
    setEditingProfile(false);
    setSaveError(null);
  }

  function addTech() {
    const t = techInput.trim();
    if (t && !editTechStack.includes(t) && editTechStack.length < 15) {
      setEditTechStack((prev) => [...prev, t]);
    }
    setTechInput("");
  }

  function removeTech(t: string) {
    setEditTechStack((prev) => prev.filter((x) => x !== t));
  }

  async function saveProfile() {
    setSaving(true);
    setSaveError(null);
    const result = await updateUserProfile({
      bio:                editBio,
      githubUrl:          editGithub,
      portfolioUrl:       editPortfolio,
      availableForCollab: editAvail,
      techStack:          editTechStack,
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

  function openShipModal(project: Project) {
    setShipTarget(project);
    setShipError(null);
  }

  function closeShipModal() {
    if (shipping) return;
    setShipTarget(null);
    setShipError(null);
  }

  async function handleConfirmShip() {
    if (!shipTarget) return;
    setShipping(true);
    setShipError(null);
    const result = await completeProject(String(shipTarget._id));
    setShipping(false);
    if (!result.success) {
      setShipError(result.message ?? "Failed to ship project. Please try again.");
      return;
    }
    setShipTarget(null);
    reloadProjects?.();
  }

  const activeProjects  = projects.filter((p) => !p.isCompleted);
  const shippedProjects = projects.filter((p) => p.isCompleted);

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-green-500 rounded-full animate-spin" />
          <p className="font-mono text-[12px] text-zinc-500">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500 text-[14px]">Could not load your profile. Please refresh.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 font-(family-name:--font-manrope)">

      {shipTarget && (
        <ShipItModal
          project={shipTarget}
          onConfirm={handleConfirmShip}
          onCancel={closeShipModal}
          shipping={shipping}
          error={shipError}
        />
      )}

      {/* ── Header ── */}
      <div className="border-b border-zinc-800">
        <div className="mx-auto max-w-275 px-6 py-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              {userData.imageUrl ? (
                <Image
                  src={userData.imageUrl}
                  alt={userData.firstName}
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-zinc-700"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-green-950 border-2 border-green-800 flex items-center justify-center font-(family-name:--font-dm-serif) text-[22px] text-green-400">
                  {userData.firstName.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="font-(family-name:--font-dm-serif) text-[22px] text-zinc-100 leading-tight">
                  {userData.firstName} {userData.lastName}
                </h1>
                <p className="font-mono text-[12px] text-zinc-500 mt-0.5">
                  @{userData.username} · Member since{" "}
                  {new Date(userData.createdAt).toLocaleDateString("en", { month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-100 text-zinc-900 rounded font-semibold text-[14px] transition hover:bg-white hover:-translate-y-px no-underline"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              New project
            </Link>
          </div>

          {/* Stats */}
          <div className="flex gap-0 mt-7 border border-zinc-800 rounded-lg overflow-hidden w-fit divide-x divide-zinc-800">
            {[
              { value: activeProjects.length,  label: "Active projects" },
              { value: shippedProjects.length, label: "Shipped" },
            ].map((stat) => (
              <div key={stat.label} className="px-7 py-4 bg-zinc-900">
                <div className="font-(family-name:--font-dm-serif) text-[28px] text-zinc-100 leading-none">{stat.value}</div>
                <div className="text-[11px] text-zinc-500 font-medium mt-1 uppercase tracking-[0.06em]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto max-w-275 px-6 py-10">
        <div className="grid grid-cols-[1fr_300px] max-lg:grid-cols-1 gap-10 items-start">

          {/* ── Projects column ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-(family-name:--font-dm-serif) text-[18px] text-zinc-100">Your projects</h2>
              <span className="font-mono text-[11px] text-zinc-500">{activeProjects.length} active</span>
            </div>

            {isLoadingProjects ? (
              <div className="border border-zinc-800 divide-y divide-zinc-800">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-5 animate-pulse">
                    <div className="h-4 w-48 bg-zinc-800 rounded mb-3" />
                    <div className="h-3 w-full bg-zinc-800/60 rounded mb-2" />
                    <div className="h-3 w-2/3 bg-zinc-800/60 rounded" />
                  </div>
                ))}
              </div>
            ) : activeProjects.length === 0 ? (
              <div className="border border-dashed border-zinc-700 rounded-lg p-12 text-center">
                <p className="text-zinc-500 text-[14px] mb-4">No active projects yet.</p>
                <Link
                  href="/projects/new"
                  className="inline-flex items-center gap-2 px-5 py-2.25 bg-zinc-100 text-zinc-900 text-[13px] font-semibold rounded hover:bg-white transition no-underline"
                >
                  Post your first project
                </Link>
              </div>
            ) : (
              <div className="border border-zinc-800 divide-y divide-zinc-800">
                {activeProjects.map((project) => (
                  <ProjectRow key={String(project._id)} project={project} onShipClick={openShipModal} />
                ))}
              </div>
            )}

            {shippedProjects.length > 0 && (
              <div className="mt-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-(family-name:--font-dm-serif) text-[18px] text-zinc-100">Shipped 🎉</h2>
                  <span className="font-mono text-[11px] text-zinc-500">{shippedProjects.length} completed</span>
                </div>
                <div className="border border-zinc-800 divide-y divide-zinc-800 opacity-70">
                  {shippedProjects.map((project) => (
                    <div key={String(project._id)} className="p-5">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <h3 className="font-(family-name:--font-dm-serif) text-[16px] text-zinc-300 mb-1">{project.title}</h3>
                          <div className="flex items-center gap-2">
                            <StageBadge stage="launched" />
                            <span className="font-mono text-[11px] text-zinc-500">
                              Shipped{" "}
                              {project.completedAt
                                ? new Date(project.completedAt).toLocaleDateString("en", { month: "short", year: "numeric" })
                                : ""}
                            </span>
                          </div>
                        </div>
                        <Link
                          href="/celebration-wall"
                          className="text-[13px] font-semibold text-green-400 hover:text-green-300 transition-colors no-underline"
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
            <div className="border border-zinc-800 bg-zinc-900 rounded-lg p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-(family-name:--font-dm-serif) text-[16px] text-zinc-100">Profile</h3>
                {!editingProfile && (
                  <button
                    onClick={openEdit}
                    className="text-[12px] font-semibold text-green-400 hover:text-green-300 transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>

              {saveError && (
                <div className="mb-4 border border-red-800 bg-red-950 px-3 py-2 text-[12px] text-red-300 rounded">
                  {saveError}
                </div>
              )}

              {!editingProfile ? (
                // ── View mode ──
                <div className="space-y-4">
                  <div>
                    <p className="font-mono text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Bio</p>
                    <p className="text-[13px] text-zinc-400 leading-[1.6]">
                      {userData.bio || <span className="text-zinc-600 italic">No bio yet.</span>}
                    </p>
                  </div>

                  <hr className="border-zinc-800" />

                  <div>
                    <p className="font-mono text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-2">Tech stack</p>
                    <div className="flex flex-wrap gap-1.5">
                      {userData.techStack.length > 0
                        ? userData.techStack.map((t) => (
                            <span key={t} className="font-mono text-[11px] bg-green-950 border border-green-900 text-green-400 px-2.25 py-0.75 rounded-full">
                              {t}
                            </span>
                          ))
                        : <span className="text-zinc-600 text-[12px] italic">None added yet.</span>
                      }
                    </div>
                  </div>

                  {(userData.githubUrl || userData.portfolioUrl) && (
                    <>
                      <hr className="border-zinc-800" />
                      <div className="space-y-2">
                        {userData.githubUrl && (
                          <div>
                            <p className="font-mono text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-0.5">GitHub</p>
                            <a href={userData.githubUrl} target="_blank" rel="noreferrer" className="text-[13px] text-green-400 hover:text-green-300 no-underline">
                              {userData.githubUrl.replace("https://", "")}
                            </a>
                          </div>
                        )}
                        {userData.portfolioUrl && (
                          <div>
                            <p className="font-mono text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-0.5">Portfolio</p>
                            <a href={userData.portfolioUrl} target="_blank" rel="noreferrer" className="text-[13px] text-green-400 hover:text-green-300 no-underline">
                              {userData.portfolioUrl.replace("https://", "")}
                            </a>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <hr className="border-zinc-800" />

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={toggleCollab}
                      className={`relative w-9 h-5 rounded-full transition-colors ${userData.availableForCollab ? "bg-green-500" : "bg-zinc-700"}`}
                    >
                      <span className={`absolute top-0.75 w-3.5 h-3.5 rounded-full bg-white transition-transform ${userData.availableForCollab ? "translate-x-4.5" : "translate-x-0.75"}`} />
                    </button>
                    <span className="text-[13px] text-zinc-400">
                      {userData.availableForCollab ? "Open to collaborate" : "Not available"}
                    </span>
                  </div>
                </div>
              ) : (
                // ── Edit mode ──
                <div className="space-y-4">

                  {/* Bio */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[13px] font-semibold text-zinc-400">Bio</label>
                      <span className="font-mono text-[11px] text-zinc-500">{editBio.length} / 300</span>
                    </div>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value.slice(0, 300))}
                      rows={3}
                      className="w-full bg-zinc-800 border border-zinc-700 px-3 py-2 text-[13px] text-zinc-200 outline-none focus:border-green-500 transition-colors resize-none rounded placeholder:text-zinc-600"
                    />
                  </div>

                  {/* Tech stack */}
                  <div>
                    <label className="block text-[13px] font-semibold text-zinc-400 mb-1.5">Tech stack</label>
                    <div className="flex gap-1.5 mb-2">
                      <input
                        type="text"
                        value={techInput}
                        onChange={(e) => setTechInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTech(); } }}
                        placeholder="e.g. React, Go, Postgres"
                        className="flex-1 min-w-0 bg-zinc-800 border border-zinc-700 px-2.5 py-1.5 text-[12px] text-zinc-200 outline-none focus:border-green-500 transition-colors rounded placeholder:text-zinc-600"
                      />
                      <button
                        onClick={addTech}
                        disabled={!techInput.trim() || editTechStack.length >= 15}
                        className="px-2.5 py-1.5 bg-zinc-700 border border-zinc-600 text-[12px] font-semibold text-zinc-300 hover:bg-zinc-600 transition-colors rounded disabled:opacity-40 disabled:pointer-events-none shrink-0"
                      >
                        + Add
                      </button>
                    </div>
                    {editTechStack.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {editTechStack.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 font-mono text-[11px] bg-green-950 border border-green-900 text-green-400 px-2 py-0.5 rounded-full"
                          >
                            {t}
                            <button
                              onClick={() => removeTech(t)}
                              className="text-green-600 hover:text-red-400 transition-colors leading-none ml-0.5"
                              aria-label={`Remove ${t}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    {editTechStack.length >= 15 && (
                      <p className="text-[11px] text-zinc-500 mt-1 font-mono">Maximum 15 technologies</p>
                    )}
                  </div>

                  {/* GitHub */}
                  <div>
                    <label className="block text-[13px] font-semibold text-zinc-400 mb-1.5">GitHub URL</label>
                    <input
                      type="url"
                      value={editGithub}
                      onChange={(e) => setEditGithub(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 px-3 py-2 text-[13px] text-zinc-200 outline-none focus:border-green-500 transition-colors rounded"
                    />
                  </div>

                  {/* Portfolio */}
                  <div>
                    <label className="block text-[13px] font-semibold text-zinc-400 mb-1.5">Portfolio</label>
                    <input
                      type="url"
                      value={editPortfolio}
                      onChange={(e) => setEditPortfolio(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 px-3 py-2 text-[13px] text-zinc-200 outline-none focus:border-green-500 transition-colors rounded"
                    />
                  </div>

                  {/* Available for collab */}
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setEditAvail((v) => !v)}
                      className={`relative w-9 h-5 rounded-full transition-colors ${editAvail ? "bg-green-500" : "bg-zinc-700"}`}
                    >
                      <span className={`absolute top-0.75 w-3.5 h-3.5 rounded-full bg-white transition-transform ${editAvail ? "translate-x-4.5" : "translate-x-0.75"}`} />
                    </button>
                    <span className="text-[13px] text-zinc-400">
                      {editAvail ? "Open to collaborate" : "Not available"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className="px-4 py-2 bg-zinc-100 text-zinc-900 text-[13px] font-semibold rounded hover:bg-white transition disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {saving ? "Saving…" : "Save"}
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={saving}
                      className="px-4 py-2 border border-zinc-700 text-[13px] font-semibold text-zinc-400 rounded hover:border-zinc-500 hover:text-zinc-200 transition"
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

function ProjectRow({
  project,
  onShipClick,
}: {
  project: Project;
  onShipClick: (project: Project) => void;
}) {
  return (
    <div className="p-5 hover:border-l-2 hover:border-l-green-500 transition-all group">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <Link
            href={`/projects/${project._id}`}
            className="font-(family-name:--font-dm-serif) text-[16px] text-zinc-100 group-hover:text-green-400 transition-colors no-underline"
          >
            {project.title}
          </Link>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <StageBadge stage={project.stage} />
            <span className="font-mono text-[11px] text-zinc-500">Updated {timeAgo(project.updatedAt)}</span>
            <span className="font-mono text-[11px] text-zinc-500">{project.viewCount} views</span>
          </div>
          <p className="text-[13px] text-zinc-400 leading-normal mt-2 line-clamp-2">{project.description}</p>
          {project.techStack.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {project.techStack.slice(0, 5).map((t) => (
                <span key={t} className="font-mono text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <Link
            href={`/projects/${project._id}/edit`}
            className="text-[12px] font-semibold px-3 py-1.5 border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors rounded no-underline"
          >
            Edit
          </Link>
          <Link
            href={`/projects/${project._id}#milestones`}
            className="text-[12px] font-semibold px-3 py-1.5 border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors rounded no-underline"
          >
            Log milestone
          </Link>
          <button
            type="button"
            onClick={() => onShipClick(project)}
            className="text-[12px] font-semibold px-3 py-1.5 border border-zinc-700 text-green-400 hover:border-green-500 hover:bg-green-950 transition-colors rounded"
          >
            Ship it ✓
          </button>
        </div>
      </div>
    </div>
  );
}