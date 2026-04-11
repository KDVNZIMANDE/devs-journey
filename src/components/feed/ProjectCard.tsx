"use client";

import Link from "next/link";
import { Project } from "@/types";

const STAGE_CONFIG: Record<string, { label: string; className: string }> = {
  idea:     { label: "Idea",     className: "bg-purple-950 text-purple-300" },
  planning: { label: "Planning", className: "bg-blue-950 text-blue-300" },
  building: { label: "Building", className: "bg-amber-950 text-amber-300" },
  testing:  { label: "Testing",  className: "bg-orange-950 text-orange-300" },
  launched: { label: "Launched", className: "bg-green-950 text-green-400" },
};

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
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
    label:     project.stage,
    className: "bg-zinc-800 text-zinc-400",
  };

  return (
    <article className="bg-black-950 border border-zinc-800 rounded-none p-6 hover:border-green-500 transition-colors group">

      {/* Top row: author + time */}
      <div className="flex items-center gap-2 mb-3">
        {project.author?.imageUrl ? (
          <img
            src={project.author.imageUrl}
            alt={authorName}
            className="w-7 h-7 rounded-full object-cover ring-1 ring-zinc-700"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 ring-1 ring-zinc-700">
            {authorName.charAt(0)}
          </div>
        )}
        <span className="font-[family-name:var(--font-manrope)] text-[13px] font-semibold text-zinc-300">
          {authorName}
        </span>
        <span className="text-zinc-600">·</span>
        <span className="font-mono text-[11px] text-zinc-500">{timeAgo}</span>
      </div>

      {/* Title */}
      <Link href={`/projects/${project._id}`} className="no-underline">
        <h2 className="font-[family-name:var(--font-dm-serif)] text-[20px] leading-tight tracking-[-0.02em] text-zinc-100 group-hover:text-green-400 transition-colors mb-2">
          {project.title}
        </h2>
      </Link>

      {/* Description */}
      <p className="font-[family-name:var(--font-manrope)] text-[14px] text-zinc-400 leading-[1.65] line-clamp-2 mb-4">
        {project.description}
      </p>

      {/* Stage + tech stack */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={`font-mono text-[11px] font-medium px-[10px] py-[3px] rounded-full ${stage.className}`}>
          {stage.label}
        </span>
        {project.techStack.slice(0, 4).map((tech) => (
          <span key={tech} className="font-mono text-[11px] px-[10px] py-[3px] rounded-full bg-zinc-800 text-zinc-400">
            {tech}
          </span>
        ))}
      </div>

      {/* Support needed + actions */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-800 gap-4 flex-wrap">
        {project.supportNeeded.length > 0 ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] text-zinc-500 uppercase tracking-[0.06em]">
              Needs:
            </span>
            {project.supportNeeded.map((s) => (
              <span key={s} className="font-mono text-[11px] px-[10px] py-[3px] rounded-full bg-green-950 text-green-400">
                {s}
              </span>
            ))}
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-3 ml-auto">
          <Link
            href={`/projects/${project._id}#comments`}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors no-underline"
          >
            <CommentIcon />
            <span>{project.commentCount}</span>
          </Link>
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