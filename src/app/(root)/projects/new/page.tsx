"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/app/api/projects";
import type { ProjectStage, SupportType } from "@/types";

const STAGE_OPTIONS: { value: ProjectStage; label: string; emoji: string }[] = [
  { value: "idea",     label: "Idea",     emoji: "💡" },
  { value: "planning", label: "Planning", emoji: "📋" },
  { value: "building", label: "Building", emoji: "🔨" },
  { value: "testing",  label: "Testing",  emoji: "🧪" },
  { value: "launched", label: "Launched", emoji: "🚀" },
];

const SUPPORT_OPTIONS: { value: SupportType; label: string; description: string }[] = [
  { value: "code-review",     label: "Code review",     description: "Feedback on architecture and implementation" },
  { value: "design-feedback", label: "Design feedback", description: "UI/UX critique and ideas to improve the experience" },
  { value: "beta-testing",    label: "Beta testing",    description: "Early users to try the product and report issues" },
  { value: "accountability",  label: "Accountability",  description: "Someone to check in and keep you on track" },
  { value: "collaboration",   label: "Collaboration",   description: "A co-builder to work on this together" },
];

export default function NewProjectPage() {
  const router = useRouter();

  const [title, setTitle]                       = useState("");
  const [description, setDescription]           = useState("");
  const [stage, setStage]                       = useState<ProjectStage>("idea");
  const [techInput, setTechInput]               = useState("");
  const [techStack, setTechStack]               = useState<string[]>([]);
  const [supportNeeded, setSupportNeeded]       = useState<SupportType[]>([]);
  const [repoUrl, setRepoUrl]                   = useState("");
  const [demoUrl, setDemoUrl]                   = useState("");
  const [targetLaunchDate, setTargetLaunchDate] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  function addTech() {
    const t = techInput.trim();
    if (t && !techStack.includes(t) && techStack.length < 10) {
      setTechStack((prev) => [...prev, t]);
    }
    setTechInput("");
  }

  function removeTech(tech: string) {
    setTechStack((prev) => prev.filter((t) => t !== tech));
  }

  function toggleSupport(s: SupportType) {
    setSupportNeeded((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    console.log({ title, description, stage, techStack, supportNeeded, repoUrl, demoUrl, targetLaunchDate });

    const result = await createProject({
      title:            title.trim(),
      description:      description.trim(),
      stage,
      supportNeeded,
      techStack,
      repoUrl:          repoUrl.trim() || undefined,
      demoUrl:          demoUrl.trim() || undefined,
      targetLaunchDate: targetLaunchDate
        ? new Date(targetLaunchDate).toISOString()
        : undefined,
    });

    if (!result.success) {
      setError(result.message ?? "Failed to create project. Please try again.");
      setSubmitting(false);
      return;
    }

    router.push("/dashboard");
  }

  const canSubmit =
    title.trim().length >= 3 &&
    description.trim().length >= 10 &&
    !submitting;

  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-manrope)]">

      {/* Page header */}
      <div className="border-b border-zinc-200">
        <div className="mx-auto max-w-[720px] px-6 py-10">
          <span className="inline-block bg-green-100 text-green-700 font-mono text-[11px] font-medium tracking-[0.08em] px-[10px] py-[3px] rounded-full mb-3">
            New project
          </span>
          <h1 className="font-[family-name:var(--font-dm-serif)] text-[clamp(28px,4vw,42px)] leading-[1.08] tracking-[-0.03em] text-zinc-900">
            What are you<br />
            <span className="text-green-600">building?</span>
          </h1>
          <p className="text-zinc-500 text-[14px] leading-[1.65] mt-2 max-w-[480px]">
            Log your project in public. Be specific — the more detail, the better the feedback and collaborators you attract.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[720px] px-6 py-10 pb-20">

        {/* Global error */}
        {error && (
          <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 rounded">
            {error}
          </div>
        )}

        {/* ── Basics ── */}
        <SectionTitle>Basics</SectionTitle>

        <div className="mb-5">
          <label className="block text-[13px] font-semibold text-zinc-600 mb-1.5">
            Project name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Devlog — AI-powered dev journal"
            className="w-full border border-zinc-200 px-3 py-2.5 text-[14px] text-zinc-900 outline-none focus:border-green-500 transition-colors placeholder:text-zinc-300 rounded"
          />
          {title.length > 0 && title.trim().length < 3 && (
            <p className="text-[11px] text-red-400 mt-1 font-mono">Minimum 3 characters</p>
          )}
        </div>

        <div className="mb-5">
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-[13px] font-semibold text-zinc-600">
              Description <span className="text-red-400">*</span>
            </label>
            <span className="font-mono text-[11px] text-zinc-400">{description.length} / 1000</span>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
            placeholder="What are you building? What problem does it solve? Who is it for?"
            rows={4}
            className="w-full border border-zinc-200 px-3 py-2.5 text-[14px] text-zinc-900 outline-none focus:border-green-500 transition-colors resize-none placeholder:text-zinc-300 rounded"
          />
          {description.length > 0 && description.trim().length < 10 && (
            <p className="text-[11px] text-red-400 mt-1 font-mono">Minimum 10 characters</p>
          )}
        </div>

        <Divider />

        {/* ── Stage ── */}
        <SectionTitle>Current stage</SectionTitle>
        <div className="grid grid-cols-5 max-sm:grid-cols-3 gap-2 mb-1">
          {STAGE_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setStage(s.value)}
              className={`border py-3 px-2 text-center transition-all rounded ${
                stage === s.value
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-400"
              }`}
            >
              <span className="block text-xl mb-1">{s.emoji}</span>
              <span className="font-mono text-[11px] font-medium">{s.label}</span>
            </button>
          ))}
        </div>

        <Divider />

        {/* ── Tech stack ── */}
        <SectionTitle>Tech stack</SectionTitle>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTech(); } }}
            placeholder="Add a technology (e.g. React, Supabase, Go)"
            className="flex-1 border border-zinc-200 px-3 py-2.5 text-[14px] text-zinc-900 outline-none focus:border-green-500 transition-colors placeholder:text-zinc-300 rounded"
          />
          <button
            onClick={addTech}
            disabled={!techInput.trim() || techStack.length >= 10}
            className="px-4 py-2.5 bg-zinc-100 border border-zinc-200 text-[13px] font-semibold text-zinc-700 hover:bg-zinc-200 transition-colors whitespace-nowrap rounded disabled:opacity-40 disabled:pointer-events-none"
          >
            + Add
          </button>
        </div>
        {techStack.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-1">
            {techStack.map((tech) => (
              <span
                key={tech}
                className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-zinc-100 text-zinc-600 px-[10px] py-[4px] rounded-full"
              >
                {tech}
                <button
                  onClick={() => removeTech(tech)}
                  className="text-zinc-400 hover:text-red-500 transition-colors leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        {techStack.length >= 10 && (
          <p className="text-[11px] text-zinc-400 mt-1 font-mono">Maximum 10 technologies</p>
        )}

        <Divider />

        {/* ── Support needed ── */}
        <SectionTitle>Support needed</SectionTitle>
        <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-2 mb-1">
          {SUPPORT_OPTIONS.map((s) => {
            const selected = supportNeeded.includes(s.value);
            return (
              <button
                key={s.value}
                onClick={() => toggleSupport(s.value)}
                className={`text-left border p-4 transition-all rounded ${
                  selected
                    ? "border-green-500 bg-green-50"
                    : "border-zinc-200 bg-white hover:border-zinc-400"
                }`}
              >
                <span className={`block text-[13px] font-bold mb-0.5 ${selected ? "text-green-800" : "text-zinc-800"}`}>
                  {s.label}
                </span>
                <span className="text-[12px] text-zinc-500 leading-[1.5]">
                  {s.description}
                </span>
              </button>
            );
          })}
        </div>
        {supportNeeded.length === 0 && (
          <p className="text-[11px] text-zinc-400 mt-2 font-mono">Select at least one type of support</p>
        )}

        <Divider />

        {/* ── Links ── */}
        <SectionTitle>
          Links{" "}
          <span className="font-normal font-mono text-[10px] text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full ml-1 normal-case tracking-normal">
            optional
          </span>
        </SectionTitle>

        <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-4 mb-4">
          <div>
            <label className="block text-[13px] font-semibold text-zinc-600 mb-1.5">Repo URL</label>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/…"
              className="w-full border border-zinc-200 px-3 py-2.5 text-[14px] text-zinc-900 outline-none focus:border-green-500 transition-colors placeholder:text-zinc-300 rounded"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-zinc-600 mb-1.5">Demo / Live URL</label>
            <input
              type="url"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              placeholder="https://…"
              className="w-full border border-zinc-200 px-3 py-2.5 text-[14px] text-zinc-900 outline-none focus:border-green-500 transition-colors placeholder:text-zinc-300 rounded"
            />
          </div>
        </div>

        <div className="mb-8" style={{ maxWidth: 260 }}>
          <label className="block text-[13px] font-semibold text-zinc-600 mb-1.5">
            Target launch date{" "}
            <span className="font-normal text-zinc-400 text-[12px]">· optional</span>
          </label>
          <input
            type="date"
            value={targetLaunchDate}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setTargetLaunchDate(e.target.value)}
            className="w-full border border-zinc-200 px-3 py-2.5 text-[14px] text-zinc-900 outline-none focus:border-green-500 transition-colors rounded"
          />
        </div>

        {/* Submit row */}
        <div className="flex items-center gap-3 pt-6 border-t border-zinc-100 flex-wrap">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || supportNeeded.length === 0}
            className="inline-flex items-center gap-2 px-6 py-[10px] bg-zinc-900 text-white text-[14px] font-semibold rounded transition hover:bg-zinc-800 hover:-translate-y-px disabled:opacity-40 disabled:pointer-events-none"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Posting…
              </>
            ) : (
              "Post project →"
            )}
          </button>
          <button
            onClick={() => router.back()}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-[10px] border border-zinc-200 text-[14px] font-semibold text-zinc-500 rounded transition hover:border-zinc-400 hover:text-zinc-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold font-mono tracking-[0.1em] uppercase text-zinc-400 border-b border-zinc-100 pb-2 mb-4">
      {children}
    </p>
  );
}

function Divider() {
  return <hr className="border-none border-t border-zinc-100 my-7" />;
}