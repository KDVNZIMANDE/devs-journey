"use client";

import { useState, useCallback, useMemo } from "react";
import { useSSE } from "@/hooks/useSSE";
import type { Project, ProjectStage } from "@/types";
import ProjectCard from "./ProjectCard";

interface FeedClientProps {
  initialProjects: Project[];
  activeStage:     ProjectStage | "all";
  onStageChange:   (stage: ProjectStage | "all") => void;
}

const STAGES: { value: ProjectStage | "all"; label: string; emoji: string }[] = [
  { value: "all",      label: "All",      emoji: "🌐" },
  { value: "idea",     label: "Idea",     emoji: "💡" },
  { value: "planning", label: "Planning", emoji: "📋" },
  { value: "building", label: "Building", emoji: "🔨" },
  { value: "testing",  label: "Testing",  emoji: "🧪" },
  { value: "launched", label: "Launched", emoji: "🚀" },
];

export function StageFilter({
  active,
  onChange,
}: {
  active: ProjectStage | "all";
  onChange: (stage: ProjectStage | "all") => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      {STAGES.map((s) => (
        <button
          key={s.value}
          onClick={() => onChange(s.value)}
          className={`flex items-center gap-2.5 text-left px-3 py-2 rounded transition-colors text-[13px] font-medium ${
            active === s.value
              ? "bg-zinc-900 text-white"
              : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
          }`}
        >
          <span className="text-[14px]">{s.emoji}</span>
          {s.label}
        </button>
      ))}
    </div>
  );
}

export default function FeedClient({ initialProjects, activeStage, onStageChange }: FeedClientProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [search, setSearch]     = useState("");

  const handleNewProject = useCallback((data: unknown) => {
    const project = data as Project;
    setProjects((prev) => {
      if (prev.some((p) => String(p._id) === String(project._id))) return prev;
      return [project, ...prev];
    });
  }, []);

  const handleProjectUpdated = useCallback((data: unknown) => {
    const updated = data as Project;
    setProjects((prev) =>
      prev.map((p) => (String(p._id) === String(updated._id) ? { ...p, ...updated } : p))
    );
  }, []);

  const handleProjectCompleted = useCallback((data: unknown) => {
    const completed = data as Project;
    setProjects((prev) => prev.filter((p) => String(p._id) !== String(completed._id)));
  }, []);

  useSSE({
    new_project:       handleNewProject,
    project_updated:   handleProjectUpdated,
    project_completed: handleProjectCompleted,
  });

  const filtered = useMemo(() => {
    let result = projects;

    if (activeStage !== "all") {
      result = result.filter((p) => p.stage === activeStage);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.techStack.some((t) => t.toLowerCase().includes(q)) ||
          p.author?.firstName?.toLowerCase().includes(q) ||
          p.author?.lastName?.toLowerCase().includes(q) ||
          p.author?.username?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [projects, activeStage, search]);

  const hasFilters = activeStage !== "all" || search.trim().length > 0;

  return (
    <div>
      {/* Mobile stage pills
      <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {STAGES.map((s) => (
          <button
            key={s.value}
            onClick={() => onStageChange(s.value)}
            className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full border text-[12px] font-medium font-mono transition-colors ${
              activeStage === s.value
                ? "bg-zinc-900 border-zinc-900 text-white"
                : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
            }`}
          >
            {s.emoji} {s.label}
          </button>
        ))}
      </div> */}

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300"
            width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects, tech, or builders…"
            className="w-full border border-zinc-200 pl-9 pr-9 py-2.5 text-[13px] text-zinc-900 outline-none focus:border-green-500 transition-colors placeholder:text-zinc-300 rounded"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500 transition-colors font-mono text-[16px] leading-none"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Count + clear */}
      <div className="flex items-center justify-between mb-5">
        <span className="font-mono text-[11px] text-zinc-400">
          {filtered.length === projects.length
            ? `${projects.length} project${projects.length !== 1 ? "s" : ""}`
            : `${filtered.length} of ${projects.length}`}
        </span>
        {hasFilters && (
          <button
            onClick={() => { onStageChange("all"); setSearch(""); }}
            className="font-mono text-[11px] text-zinc-400 hover:text-red-400 transition-colors"
          >
            × Clear filters
          </button>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 && hasFilters ? (
        <div className="border border-dashed border-zinc-200 rounded-xl p-12 text-center">
          <p className="text-zinc-400 text-[14px] mb-2">No projects match your filters.</p>
          <button
            onClick={() => { onStageChange("all"); setSearch(""); }}
            className="text-[13px] font-semibold text-green-600 hover:text-green-800 transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-zinc-200 rounded-xl p-12 text-center">
          <p className="text-zinc-400 text-[14px]">No projects yet. Be the first to build in public.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((project) => (
            <ProjectCard key={String(project._id)} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}