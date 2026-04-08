"use client";

import Link from "next/link";
import { useState } from "react";
import { Project } from "@/types";

const STAGE_CONFIG: Record<string, { label: string; className: string }> = {
  idea:     { label: "Idea",     className: "bg-purple-50 text-purple-700" },
  planning: { label: "Planning", className: "bg-blue-50 text-blue-700" },
  building: { label: "Building", className: "bg-amber-50 text-amber-700" },
  testing:  { label: "Testing",  className: "bg-orange-50 text-orange-700" },
  launched: { label: "Launched", className: "bg-green-50 text-green-700" },
};

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const [raised, setRaised] = useState(false);

  const authorName = project.author
    ? `${project.author.firstName} ${project.author.lastName}`
    : "Unknown developer";

  const minutesAgo = Math.round(
    // eslint-disable-next-line react-hooks/purity
    (new Date(project.createdAt).getTime() - Date.now()) / 1000 / 60
  );
  const timeAgo = new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
    minutesAgo,
    "minutes"
  );

  const stage = STAGE_CONFIG[project.stage] ?? {
    label: project.stage,
    className: "bg-zinc-100 text-zinc-600",
  };

  return (
    <article className="bg-white border border-zinc-200 rounded-none p-6 hover:border-green-600 transition-colors group">
      {/* Top row: author + time */}
      <div className="flex items-center gap-2 mb-3">
        {project.author?.imageUrl ? (
          <img
            src={project.author.imageUrl}
            alt={authorName}
            className="w-7 h-7 rounded-full object-cover ring-1 ring-zinc-200"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-500 ring-1 ring-zinc-200">
            {authorName.charAt(0)}
          </div>
        )}
        <span className="font-[family-name:var(--font-manrope)] text-[13px] font-semibold text-zinc-700">
          {authorName}
        </span>
        <span className="text-zinc-300">·</span>
        <span className="font-mono text-[11px] text-zinc-400">{timeAgo}</span>
      </div>

      {/* Title */}
      <Link href={`/projects/${project._id}`} className="no-underline">
        <h2 className="font-[family-name:var(--font-dm-serif)] text-[20px] leading-tight tracking-[-0.02em] text-zinc-900 group-hover:text-green-700 transition-colors mb-2">
          {project.title}
        </h2>
      </Link>

      {/* Description */}
      <p className="font-[family-name:var(--font-manrope)] text-[14px] text-zinc-500 leading-[1.65] line-clamp-2 mb-4">
        {project.description}
      </p>

      {/* Stage + tech stack */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span
          className={`font-mono text-[11px] font-medium px-[10px] py-[3px] rounded-full ${stage.className}`}
        >
          {stage.label}
        </span>
        {project.techStack.slice(0, 4).map((tech) => (
          <span
            key={tech}
            className="font-mono text-[11px] px-[10px] py-[3px] rounded-full bg-zinc-100 text-zinc-500"
          >
            {tech}
          </span>
        ))}
      </div>

      {/* Support needed + actions */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-100 gap-4 flex-wrap">
        {project.supportNeeded.length > 0 ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] text-zinc-400 uppercase tracking-[0.06em]">
              Needs:
            </span>
            {project.supportNeeded.map((s) => (
              <span
                key={s}
                className="font-mono text-[11px] px-[10px] py-[3px] rounded-full bg-green-50 text-green-700"
              >
                {s}
              </span>
            ))}
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-3 ml-auto">
          {/* Comment link */}
          <Link
            href={`/projects/${project._id}#comments`}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-400 hover:text-zinc-700 transition-colors no-underline"
          >
            <CommentIcon />
            <span>{ 0}</span>
          </Link>

          {/* Raise hand */}
          <button
            onClick={() => setRaised((r) => !r)}
            className={`inline-flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded transition-colors ${
              raised
                ? "bg-green-600 text-white"
                : "border border-zinc-200 text-zinc-600 hover:border-green-600 hover:text-green-700"
            }`}
          >
            <HandIcon raised={raised} />
            {raised ? "Hand raised" : "Raise hand"}
          </button>
        </div>
      </div>
    </article>
  );
}

function CommentIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M1 1h12v9H8l-3 3v-3H1V1z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HandIcon({ raised }: { raised: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path
        d="M4 7V2.5a1 1 0 012 0V6m0 0V2a1 1 0 012 0v4m0 0V3a1 1 0 012 0v4.5c0 2.5-1.5 4.5-4 4.5S2 11.5 2 9.5V7.5a1 1 0 012 0V7"
        stroke={raised ? "white" : "currentColor"}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}