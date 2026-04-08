"use client";

import { useState, useCallback } from "react";
import { useSSE } from "@/hooks/useSSE";
import { Project } from "@/types";
import ProjectCard from "./ProjectCard";

interface FeedClientProps {
  initialProjects: Project[];
}

export default function FeedClient({ initialProjects }: FeedClientProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);

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
      prev.map((p) =>
        String(p._id) === String(updated._id) ? { ...p, ...updated } : p
      )
    );
  }, []);

  const handleProjectCompleted = useCallback((data: unknown) => {
    const completed = data as Project;
    setProjects((prev) =>
      prev.filter((p) => String(p._id) !== String(completed._id))
    );
  }, []);

  useSSE({
    new_project: handleNewProject,
    project_updated: handleProjectUpdated,
    project_completed: handleProjectCompleted,
  });

  if (projects.length === 0) {
    return (
      <div className="border border-zinc-200 p-16 text-center">
        <p className="font-[family-name:var(--font-dm-serif)] text-[20px] text-zinc-400 mb-2">
          Nothing here yet.
        </p>
        <p className="text-[14px] text-zinc-400">
          Be the first to build in public.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-zinc-200 divide-y divide-zinc-100">
      {projects.map((project) => (
        <ProjectCard key={String(project._id)} project={project} />
      ))}
    </div>
  );
}