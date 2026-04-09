"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectStage, SupportType } from "@/types";

const STAGE_OPTIONS: { value: ProjectStage; label: string; emoji: string }[] = [
  { value: "idea",     label: "Idea",     emoji: "💡" },
  { value: "planning", label: "Planning", emoji: "📋" },
  { value: "building", label: "Building", emoji: "🔨" },
  { value: "testing",  label: "Testing",  emoji: "🧪" },
  { value: "launched", label: "Launched", emoji: "🚀" },
];

const SUPPORT_OPTIONS: { value: SupportType; label: string; description: string }[] = [
  { value: "code-review",      label: "Code review",     description: "Feedback on architecture and implementation" },
  { value: "design-feedback",  label: "Design feedback", description: "UI/UX critique and ideas to improve the experience" },
  { value: "beta-testing",     label: "Beta testing",    description: "Early users to try the product and report issues" },
  { value: "accountability",   label: "Accountability",  description: "Someone to check in and keep you on track" },
  { value: "collaboration",    label: "Collaboration",   description: "A co-builder to work on this together" },
];

export default function NewProjectPage() {
  const router = useRouter();

  const [title, setTitle]                     = useState("");
  const [description, setDescription]         = useState("");
  const [stage, setStage]                     = useState<ProjectStage>("idea");
  const [techInput, setTechInput]             = useState("");
  const [techStack, setTechStack]             = useState<string[]>([]);
  const [supportNeeded, setSupportNeeded]     = useState<SupportType[]>([]);
  const [repoUrl, setRepoUrl]                 = useState("");
  const [demoUrl, setDemoUrl]                 = useState("");
  const [targetLaunchDate, setTargetLaunchDate] = useState("");

  function addTech() {
    const t = techInput.trim();
    if (t && !techStack.includes(t)) {
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

  function handleSubmit(draft = false) {
    // TODO: POST /api/projects with form state + { isDraft: draft }
    router.push("/dashboard");
  }

  const canSubmit = title.trim().length > 0 && description.trim().length > 0;

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
            Log your project in public. Be specific — the more detail, the better the feedback and the collaborators you attract.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[720px] px-6 py-10 pb-20">

        {/* ── Basics ── */}
        <SectionTitle>Basics</SectionTitle>

        <div className="mb-5">
          <label className="block text-[13px] font-semibold text-zinc-600 mb-1.5">Project name</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Devlog — AI-powered dev journal"
            className="w-full border border-zinc-200 px-3 py-2.5 text-[14px] text-zinc-900 outline-none focus:border-green-500 transition-colors placeholder:text-zinc-300"
          />
        </div>

        <div className="mb-5">
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-[13px] font-semibold text-zinc-600">Description</label>
            <span className="font-mono text-[11px] text-zinc-400">{description.length} / 280</span>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 280))}
            placeholder="What are you building? What problem does it solve? Who is it for?"
            rows={4}
            className="w-full border border-zinc-200 px-3 py-2.5 text-[14px] text-zinc-900 outline-none focus:border-green-500 transition-colors resize-none placeholder:text-zinc-300"
          />
        </div>

        <Divider />

        {/* ── Stage ── */}
        <SectionTitle>Current stage</SectionTitle>
        <div className="grid grid-cols-5 max-sm:grid-cols-3 gap-2 mb-1">
          {STAGE_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setStage(s.value)}
              className={`border py-3 px-2 text-center transition-all ${
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
            onKeyDown={(e) => e.key === "Enter" && addTech()}
            placeholder="Add a technology (e.g. React, Supabase, Go)"
            className="flex-1 border border-zinc-200 px-3 py-2.5 text-[14px] text-zinc-900 outline-none focus:border-green-500 transition-colors placeholder:text-zinc-300"
          />
          <button
            onClick={addTech}
            className="px-4 py-2.5 bg-zinc-100 border border-zinc-200 text-[13px] font-semibold text-zinc-700 hover:bg-zinc-200 transition-colors whitespace-nowrap"
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
                className={`text-left border p-4 transition-all ${
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

        <Divider />

        {/* ── Links (optional) ── */}
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
              className="w-full border border-zinc-200 px-3 py-2.5 text-[14px] text-zinc-900 outline-none focus:border-green-500 transition-colors placeholder:text-zinc-300"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-zinc-600 mb-1.5">Demo / Live URL</label>
            <input
              type="url"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              placeholder="https://…"
              className="w-full border border-zinc-200 px-3 py-2.5 text-[14px] text-zinc-900 outline-none focus:border-green-500 transition-colors placeholder:text-zinc-300"
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
            onChange={(e) => setTargetLaunchDate(e.target.value)}
            className="w-full border border-zinc-200 px-3 py-2.5 text-[14px] text-zinc-900 outline-none focus:border-green-500 transition-colors"
          />
        </div>

        {/* Submit row */}
        <div className="flex items-center gap-3 pt-6 border-t border-zinc-100 flex-wrap">
          <button
            onClick={() => handleSubmit(false)}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 px-6 py-[10px] bg-zinc-900 text-white text-[14px] font-semibold rounded transition hover:bg-zinc-800 hover:-translate-y-px disabled:opacity-40 disabled:pointer-events-none"
          >
            Post project →
          </button>
          <button
            onClick={() => handleSubmit(true)}
            className="inline-flex items-center gap-2 px-5 py-[10px] border border-zinc-200 text-[14px] font-semibold text-zinc-500 rounded transition hover:border-zinc-400 hover:text-zinc-700"
          >
            Save as draft
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