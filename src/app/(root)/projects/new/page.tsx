"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/app/api/projects";
import type { ProjectStage, SupportType } from "@/types";

const STAGE_OPTIONS: { value: ProjectStage; label: string; emoji: string; color: string }[] = [
  { value: "idea",     label: "Idea",     emoji: "💡", color: "border-purple-500 bg-purple-500/10 text-purple-300" },
  { value: "planning", label: "Planning", emoji: "📋", color: "border-blue-500 bg-blue-500/10 text-blue-300" },
  { value: "building", label: "Building", emoji: "🔨", color: "border-amber-500 bg-amber-500/10 text-amber-300" },
  { value: "testing",  label: "Testing",  emoji: "🧪", color: "border-orange-500 bg-orange-500/10 text-orange-300" },
  { value: "launched", label: "Launched", emoji: "🚀", color: "border-green-500 bg-green-500/10 text-green-300" },
];

const SUPPORT_OPTIONS: { value: SupportType; label: string; description: string; icon: string }[] = [
  { value: "code-review",     label: "Code review",     description: "Feedback on architecture and implementation", icon: "⌥" },
  { value: "design-feedback", label: "Design feedback", description: "UI/UX critique and ideas", icon: "◈" },
  { value: "beta-testing",    label: "Beta testing",    description: "Early users to try and report issues", icon: "◎" },
  { value: "accountability",  label: "Accountability",  description: "Someone to keep you on track", icon: "⊕" },
  { value: "collaboration",   label: "Collaboration",   description: "A co-builder to work together", icon: "⊗" },
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
  const [submitting, setSubmitting]             = useState(false);
  const [error, setError]                       = useState<string | null>(null);

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

    const result = await createProject({
      title:            title.trim(),
      description:      description.trim(),
      stage,
      supportNeeded,
      techStack,
      repoUrl:          repoUrl.trim() || undefined,
      demoUrl:          demoUrl.trim() || undefined,
      targetLaunchDate: targetLaunchDate ? new Date(targetLaunchDate).toISOString() : undefined,
    });

    if (!result.success) {
      setError(result.message ?? "Failed to create project. Please try again.");
      setSubmitting(false);
      return;
    }

    router.push("/dashboard");
  }

  const canSubmit = title.trim().length >= 3 && description.trim().length >= 10 && !submitting;

  return (
    <div className="min-h-screen bg-zinc-950 font-[family-name:var(--font-manrope)] text-zinc-100">

      {/* Header */}
      <div className="relative border-b border-zinc-800/60 overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-green-500/5 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />

        <div className="relative mx-auto max-w-[720px] px-6 py-10">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors mb-5"
          >
            ← back
          </button>
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-400 font-mono text-[11px] font-medium tracking-[0.08em] px-[10px] py-[4px] rounded-full border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              New project
            </span>
          </div>
          <h1 className="font-[family-name:var(--font-dm-serif)] text-[clamp(28px,4vw,46px)] leading-[1.05] tracking-[-0.03em] text-zinc-100">
            What are you<br />
            <span className="text-green-400">building?</span>
          </h1>
          <p className="text-zinc-500 text-[14px] leading-[1.65] mt-3 max-w-[480px]">
            Log your project in public. Be specific — the more detail, the better the feedback and collaborators you attract.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[720px] px-6 py-10 pb-24">

        {error && (
          <div className="mb-6 border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Basics */}
        <Section label="01" title="Basics">
          <div className="mb-5">
            <label className="block text-[12px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">
              Project name <span className="text-green-500 normal-case tracking-normal">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Devlog — AI-powered dev journal"
              className="w-full bg-zinc-900 border border-zinc-700/60 px-4 py-3 text-[14px] text-zinc-100 outline-none focus:border-green-500/60 focus:ring-1 focus:ring-green-500/20 transition-all placeholder:text-zinc-600 rounded-lg"
            />
            {title.length > 0 && title.trim().length < 3 && (
              <p className="text-[11px] text-red-400 mt-1.5 font-mono">Minimum 3 characters</p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[12px] font-semibold text-zinc-400 uppercase tracking-widest">
                Description <span className="text-green-500 normal-case tracking-normal">*</span>
              </label>
              <span className="font-mono text-[11px] text-zinc-600">{description.length} / 1000</span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
              placeholder="What are you building? What problem does it solve? Who is it for?"
              rows={4}
              className="w-full bg-zinc-900 border border-zinc-700/60 px-4 py-3 text-[14px] text-zinc-100 outline-none focus:border-green-500/60 focus:ring-1 focus:ring-green-500/20 transition-all resize-none placeholder:text-zinc-600 rounded-lg"
            />
            {description.length > 0 && description.trim().length < 10 && (
              <p className="text-[11px] text-red-400 mt-1.5 font-mono">Minimum 10 characters</p>
            )}
          </div>
        </Section>

        {/* Stage */}
        <Section label="02" title="Current stage">
          <div className="grid grid-cols-5 max-sm:grid-cols-3 gap-2">
            {STAGE_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => setStage(s.value)}
                className={`border py-3.5 px-2 text-center transition-all rounded-lg ${
                  stage === s.value
                    ? s.color
                    : "border-zinc-700/60 bg-zinc-900 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                }`}
              >
                <span className="block text-xl mb-1.5">{s.emoji}</span>
                <span className="font-mono text-[11px] font-medium">{s.label}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* Tech stack */}
        <Section label="03" title="Tech stack">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTech(); } }}
              placeholder="React, Supabase, Go…"
              className="flex-1 bg-zinc-900 border border-zinc-700/60 px-4 py-2.5 text-[14px] text-zinc-100 outline-none focus:border-green-500/60 focus:ring-1 focus:ring-green-500/20 transition-all placeholder:text-zinc-600 rounded-lg"
            />
            <button
              onClick={addTech}
              disabled={!techInput.trim() || techStack.length >= 10}
              className="px-4 py-2.5 bg-zinc-800 border border-zinc-700 text-[13px] font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-all rounded-lg disabled:opacity-30 disabled:pointer-events-none"
            >
              + Add
            </button>
          </div>
          {techStack.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-zinc-800 border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-full"
                >
                  {tech}
                  <button
                    onClick={() => removeTech(tech)}
                    className="text-zinc-500 hover:text-red-400 transition-colors leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          {techStack.length >= 10 && (
            <p className="text-[11px] text-zinc-500 mt-2 font-mono">Maximum 10 technologies</p>
          )}
        </Section>

        {/* Support needed */}
        <Section label="04" title="Support needed">
          <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-2">
            {SUPPORT_OPTIONS.map((s) => {
              const selected = supportNeeded.includes(s.value);
              return (
                <button
                  key={s.value}
                  onClick={() => toggleSupport(s.value)}
                  className={`text-left border p-4 transition-all rounded-lg ${
                    selected
                      ? "border-green-500/50 bg-green-500/8"
                      : "border-zinc-700/60 bg-zinc-900 hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[16px] font-mono ${selected ? "text-green-400" : "text-zinc-600"}`}>
                      {s.icon}
                    </span>
                    <span className={`text-[13px] font-bold ${selected ? "text-green-300" : "text-zinc-300"}`}>
                      {s.label}
                    </span>
                    {selected && (
                      <span className="ml-auto text-green-500 text-[10px] font-mono">✓</span>
                    )}
                  </div>
                  <p className="text-[12px] text-zinc-500 leading-[1.5] pl-6">{s.description}</p>
                </button>
              );
            })}
          </div>
          {supportNeeded.length === 0 && (
            <p className="text-[11px] text-zinc-600 mt-2 font-mono">Select at least one</p>
          )}
        </Section>

        {/* Links */}
        <Section label="05" title={<>Links <span className="font-normal font-mono text-[10px] text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full ml-2 normal-case tracking-normal">optional</span></>}>
          <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-4 mb-4">
            <div>
              <label className="block text-[12px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">Repo URL</label>
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/…"
                className="w-full bg-zinc-900 border border-zinc-700/60 px-4 py-2.5 text-[14px] text-zinc-100 outline-none focus:border-green-500/60 focus:ring-1 focus:ring-green-500/20 transition-all placeholder:text-zinc-600 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">Demo / Live URL</label>
              <input
                type="url"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder="https://…"
                className="w-full bg-zinc-900 border border-zinc-700/60 px-4 py-2.5 text-[14px] text-zinc-100 outline-none focus:border-green-500/60 focus:ring-1 focus:ring-green-500/20 transition-all placeholder:text-zinc-600 rounded-lg"
              />
            </div>
          </div>

          <div style={{ maxWidth: 260 }}>
            <label className="block text-[12px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">Target launch date</label>
            <input
              type="date"
              value={targetLaunchDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setTargetLaunchDate(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700/60 px-4 py-2.5 text-[14px] text-zinc-100 outline-none focus:border-green-500/60 focus:ring-1 focus:ring-green-500/20 transition-all rounded-lg [color-scheme:dark]"
            />
          </div>
        </Section>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-6 border-t border-zinc-800 flex-wrap">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || supportNeeded.length === 0}
            className="inline-flex items-center gap-2 px-6 py-[11px] bg-green-500 text-zinc-950 text-[14px] font-bold rounded-lg transition hover:bg-green-400 hover:-translate-y-px active:translate-y-0 disabled:opacity-30 disabled:pointer-events-none"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" />
                Posting…
              </>
            ) : (
              "Post project →"
            )}
          </button>
          <button
            onClick={() => router.back()}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-[11px] border border-zinc-700 text-[14px] font-semibold text-zinc-400 rounded-lg transition hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-40"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ label, title, children }: { label: string; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-5">
        <span className="font-mono text-[10px] text-zinc-600">{label}</span>
        <div className="h-px flex-1 bg-zinc-800" />
        <p className="text-[11px] font-bold font-mono tracking-[0.1em] uppercase text-zinc-400">
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}