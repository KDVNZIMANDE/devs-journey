"use client";

import { useState, useCallback, useMemo } from "react";
import { useSession } from "@/context/SessionContext";
import type { Project, ProjectStage } from "@/types";
import ProjectCard from "./ProjectCard";

interface FeedClientProps {
  initialProjects: Project[];
  activeStage:     ProjectStage | "all";
  onStageChange:   (stage: ProjectStage | "all") => void;
}

const STAGES: { value: ProjectStage | "all"; label: string; dot: string }[] = [
  { value: "all",      label: "All",      dot: "bg-zinc-400"   },
  { value: "idea",     label: "Idea",     dot: "bg-purple-400" },
  { value: "planning", label: "Planning", dot: "bg-blue-400"   },
  { value: "building", label: "Building", dot: "bg-amber-400"  },
  { value: "testing",  label: "Testing",  dot: "bg-orange-400" },
  { value: "launched", label: "Launched", dot: "bg-green-400"  },
];

export function StageFilter({
  active,
  onChange,
}: {
  active: ProjectStage | "all";
  onChange: (stage: ProjectStage | "all") => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {STAGES.map((s) => (
        <button
          key={s.value}
          onClick={() => onChange(s.value)}
          className={`flex items-center gap-2.5 text-left px-3 py-2 rounded-md transition-all text-[13px] font-medium ${
            active === s.value
              ? "bg-zinc-100 text-zinc-900"
              : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active === s.value ? s.dot : "bg-zinc-700"}`} />
          {s.label}
          {active === s.value && (
            <span className="ml-auto font-mono text-[10px] text-zinc-500">✓</span>
          )}
        </button>
      ))}
    </div>
  );
}

export default function FeedClient({ initialProjects, activeStage, onStageChange }: FeedClientProps) {
  const { projects: contextProjects } = useSession();
  const [search, setSearch] = useState("");

  // Merge server-rendered initial projects with live context projects.
  // Context projects take precedence so real-time updates are reflected.
  const projects = useMemo(() => {
    const map = new Map(initialProjects.map((p) => [String(p._id), p]));
    contextProjects
      .filter((p) => !p.isCompleted)
      .forEach((p) => map.set(String(p._id), p));
    return Array.from(map.values()).filter((p) => !p.isCompleted);
  }, [initialProjects, contextProjects]);

  const filtered = useMemo(() => {
    let result = projects;
    if (activeStage !== "all") result = result.filter((p) => p.stage === activeStage);
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

  const clearFilters = useCallback(() => {
    onStageChange("all");
    setSearch("");
  }, [onStageChange]);

  return (
    <div>
      {/* Search */}
      <div className="mb-5">
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600"
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
            className="w-full bg-zinc-900 border border-zinc-700 pl-10 pr-9 py-2.5 text-[13px] text-zinc-200 outline-none focus:border-green-500 transition-colors placeholder:text-zinc-600 rounded-lg"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors font-mono text-[16px] leading-none"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Count + clear */}
      <div className="flex items-center justify-between mb-5">
        <span className="font-mono text-[11px] text-zinc-500">
          {filtered.length === projects.length
            ? `${projects.length} project${projects.length !== 1 ? "s" : ""}`
            : `${filtered.length} of ${projects.length}`}
        </span>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="font-mono text-[11px] text-zinc-500 hover:text-red-400 transition-colors"
          >
            × Clear filters
          </button>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 && hasFilters ? (
        <div className="border border-dashed border-zinc-700 rounded-xl p-12 text-center">
          <p className="text-zinc-500 text-[14px] mb-2">No projects match your filters.</p>
          <button
            onClick={clearFilters}
            className="text-[13px] font-semibold text-green-400 hover:text-green-300 transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-zinc-700 rounded-xl p-12 text-center">
          <p className="text-zinc-500 text-[14px]">No projects yet. Be the first to build in public.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((project) => (
            <ProjectCard key={String(project._id)} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}