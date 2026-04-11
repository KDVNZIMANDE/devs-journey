import Link from "next/link";
import Image from "next/image";
import { connectDB } from "@/lib/db/mongoose";
import { Project, User } from "@/models";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShippedProject {
  _id: string;
  title: string;
  description: string;
  techStack: string[];
  repoUrl?: string;
  demoUrl?: string;
  completedAt: string;
  author: {
    firstName: string;
    lastName: string;
    username: string;
    imageUrl?: string;
  } | null;
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getShippedProjects(): Promise<ShippedProject[]> {
  await connectDB();

  const projects = await Project.find({ isCompleted: true })
    .sort({ completedAt: -1 })
    .lean();

  if (!projects.length) return [];

  const authorIds = [...new Set(projects.map((p) => p.authorId))];
  const authors = await User.find({ clerkId: { $in: authorIds } })
    .select("clerkId firstName lastName username imageUrl")
    .lean();

  const authorMap = new Map(authors.map((a) => [a.clerkId, a]));

  return projects.map((p) => {
    const author = authorMap.get(p.authorId) ?? null;
    return {
      _id:         String(p._id),
      title:       p.title,
      description: p.description,
      techStack:   p.techStack ?? [],
      repoUrl:     p.repoUrl,
      demoUrl:     p.demoUrl,
      completedAt: p.completedAt
        ? new Date(p.completedAt).toISOString()
        : new Date(p.updatedAt).toISOString(),
      author: author
        ? {
            firstName: author.firstName,
            lastName:  author.lastName,
            username:  author.username,
            imageUrl:  author.imageUrl,
          }
        : null,
    };
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-purple-100 text-purple-700",
  "bg-blue-100 text-blue-700",
  "bg-amber-100 text-amber-700",
  "bg-green-100 text-green-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
];

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function formatShipDate(iso: string) {
  return new Date(iso).toLocaleDateString("en", {
    month: "short",
    day:   "numeric",
    year:  "numeric",
  });
}

// ─── Page (Server Component) ──────────────────────────────────────────────────

export default async function CelebrationWallPage() {
  const shipped = await getShippedProjects();
  const totalDevelopers = new Set(
    shipped.map((p) => p.author?.username).filter(Boolean)
  ).size;

  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-manrope)]">

      {/* Header */}
      <div className="border-b border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-[1100px] px-6 py-12">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <span className="inline-block bg-green-100 text-green-700 font-mono text-[11px] font-medium tracking-[0.08em] px-[10px] py-[3px] rounded-full mb-3">
                Celebration wall
              </span>
              <h1 className="font-[family-name:var(--font-dm-serif)] text-[clamp(32px,4vw,52px)] leading-[1.05] tracking-[-0.03em] text-zinc-900">
                Shipped and<br />
                <span className="text-green-600">celebrated.</span>
              </h1>
              <p className="text-zinc-500 text-[14px] leading-[1.65] mt-3 max-w-[480px]">
                Every project here was built in public and crossed the finish line. These developers did the work.
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pb-1">
              <div>
                <div className="font-[family-name:var(--font-dm-serif)] text-[36px] text-zinc-900 leading-none">
                  {shipped.length}
                </div>
                <div className="text-[12px] text-zinc-400 font-medium mt-1">Projects shipped</div>
              </div>
              <div className="w-px bg-zinc-200" />
              <div>
                <div className="font-[family-name:var(--font-dm-serif)] text-[36px] text-zinc-900 leading-none">
                  {totalDevelopers}
                </div>
                <div className="text-[12px] text-zinc-400 font-medium mt-1">Developers</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-[1100px] px-6 py-10 pb-20">

        {/* CTA strip */}
        <div className="border border-zinc-200 bg-green-50 p-5 mb-10 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-[family-name:var(--font-dm-serif)] text-[17px] text-zinc-900 mb-0.5">
              Your project could be here.
            </p>
            <p className="text-[13px] text-zinc-500">
              Ship something — even small — and earn your place on the wall.
            </p>
          </div>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 px-5 py-[10px] bg-zinc-900 text-white rounded font-semibold text-[13px] transition hover:bg-zinc-800 hover:-translate-y-px no-underline shrink-0"
          >
            Post your project
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        {/* Grid */}
        {shipped.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-200">
            {shipped.map((project) => (
              <WallCard key={project._id} project={project} />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-zinc-200 p-16 text-center">
            <p className="font-[family-name:var(--font-dm-serif)] text-[20px] text-zinc-400 mb-2">
              Nothing shipped yet.
            </p>
            <p className="text-[14px] text-zinc-400">
              Be the first to build and ship in public.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Wall card ────────────────────────────────────────────────────────────────

function WallCard({ project }: { project: ShippedProject }) {
  const firstName = project.author?.firstName ?? "?";
  const lastName  = project.author?.lastName  ?? "";
  const username  = project.author?.username  ?? "unknown";
  const imageUrl  = project.author?.imageUrl;
  const initials  = `${firstName.charAt(0)}${lastName.charAt(0)}`;
  const color     = avatarColor(firstName);

  return (
    <div className="bg-white p-6 hover:bg-zinc-50 transition-colors group">

      {/* Author row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`${firstName} ${lastName}`}
              width={36}
              height={36}
              className="w-9 h-9 rounded-full object-cover ring-1 ring-zinc-200"
            />
          ) : (
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-[family-name:var(--font-dm-serif)] text-[13px] ${color}`}>
              {initials}
            </div>
          )}
          <div>
            <p className="text-[13px] font-semibold text-zinc-800 leading-tight">
              {firstName} {lastName}
            </p>
            <p className="font-mono text-[11px] text-zinc-400 leading-tight mt-0.5">
              @{username}
            </p>
          </div>
        </div>
        <span className="font-mono text-[10px] font-medium px-[9px] py-[3px] bg-green-50 text-green-700 rounded-full border border-green-200 whitespace-nowrap shrink-0">
          ✓ Shipped
        </span>
      </div>

      {/* Title */}
      <h2 className="font-[family-name:var(--font-dm-serif)] text-[18px] leading-[1.2] tracking-[-0.02em] text-zinc-900 mb-2 group-hover:text-green-700 transition-colors">
        {project.title}
      </h2>

      {/* Description */}
      <p className="text-[13px] text-zinc-500 leading-[1.65] line-clamp-3 mb-4">
        {project.description}
      </p>

      {/* Tech stack */}
      {project.techStack.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {project.techStack.map((tech) => (
            <span key={tech} className="font-mono text-[10px] bg-zinc-100 text-zinc-500 px-[8px] py-[3px] rounded-full">
              {tech}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
        <span className="font-mono text-[11px] text-zinc-400">
          {formatShipDate(project.completedAt)}
        </span>
        <div className="flex gap-2">
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[12px] font-semibold px-3 py-1 border border-zinc-200 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900 transition-colors rounded no-underline"
            >
              Repo
            </a>
          )}
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[12px] font-semibold px-3 py-1 border border-zinc-200 text-zinc-500 hover:border-green-600 hover:text-green-700 transition-colors rounded no-underline"
            >
              Live →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}