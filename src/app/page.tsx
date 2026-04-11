import Link from "next/link";

const features = [
  {
    tag: "01",
    title: "Build in public",
    description:
      "Log your project, set your stage, and tell the community what support you need. Transparency accelerates progress.",
  },
  {
    tag: "02",
    title: "Live feed",
    description:
      "See what other developers are shipping right now. Comment, collaborate, or raise a hand to join a project.",
  },
  {
    tag: "03",
    title: "Milestone tracking",
    description:
      "Mark every win — big or small. A running timeline of your progress keeps momentum alive and accountability real.",
  },
  {
    tag: "04",
    title: "Celebration wall",
    description:
      "Ship it and get on the wall. Every completed project earns its place in the public hall of fame.",
  },
];

const stats: { value: string; label: string }[] = [
  { value: "2 400+", label: "Projects shipped" },
  { value: "8 100+", label: "Developers building" },
  { value: "14 000+", label: "Milestones logged" },
];

const marqueeItems = [
  "BUILD IN PUBLIC",
  "SHIP IT",
  "FIND COLLABORATORS",
  "LOG MILESTONES",
  "GET CELEBRATED",
  "STAY ACCOUNTABLE",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-(family-name:--font-manrope)">

      {/* Hero */}
      <section className="mx-auto max-w-275 px-6 pt-25 pb-20">
        <div className="max-w-190">
          <span className="inline-block bg-green-950 text-green-400 font-mono text-[11px] font-medium tracking-[0.08em] px-2.5 py-0.75 rounded-full mb-6 animate-[fadeUp_0.7s_ease_both]">
            Build · Ship · Celebrate
          </span>

          <h1 className="font-(family-name:--font-dm-serif) text-[clamp(52px,8vw,96px)] leading-[1.01] tracking-[-0.03em] mb-7 text-zinc-100 animate-[fadeUp_0.7s_ease_both]">
            Your code,
            <br />
            <span className="text-green-400">in public.</span>
            <span className="inline-block w-0.75 h-[0.88em] bg-green-400 ml-1 align-middle animate-[blink_1s_step-end_infinite]" />
          </h1>

          <p className="text-[clamp(17px,2vw,20px)] leading-[1.65] text-zinc-400 max-w-130 mb-11 font-normal animate-[fadeUp_0.7s_0.15s_ease_both]">
            DevBuild is where developers log what they&apos;re building, find
            collaborators, track milestones, and get celebrated when they ship.
          </p>

          <div className="flex flex-wrap gap-3 animate-[fadeUp_0.7s_0.28s_ease_both]">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-zinc-100 text-zinc-900 rounded font-semibold text-[15px] transition hover:bg-white hover:-translate-y-px"
            >
              Start building free
              <ArrowRight />
            </Link>
            <Link
              href="/feed"
              className="inline-flex items-center gap-2 px-7 py-3.5 border border-zinc-700 rounded font-semibold text-[15px] text-zinc-300 transition hover:border-zinc-400 hover:bg-zinc-800 hover:-translate-y-px"
            >
              Browse the feed
            </Link>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="border-y border-zinc-800 py-3.5 bg-zinc-900 overflow-hidden">
        <div className="flex gap-12 animate-[marquee_20s_linear_infinite] whitespace-nowrap font-mono text-[12px] tracking-widest">
          {Array.from({ length: 2 })
            .flatMap(() => marqueeItems)
            .map((t, i) => (
              <span
                key={i}
                className={i % 3 === 1 ? "text-green-400" : "text-zinc-500"}
              >
                {t}&nbsp;&nbsp;/&nbsp;&nbsp;
              </span>
            ))}
        </div>
      </div>

      {/* Stats */}
      <section className="mx-auto max-w-275 px-6 py-20 animate-[fadeUp_0.7s_0.4s_ease_both]">
        <div className="grid grid-cols-3 max-sm:grid-cols-1 gap-px bg-zinc-800">
          {stats.map((s) => (
            <div key={s.label} className="bg-zinc-950 px-10 py-12">
              <div className="font-(family-name:--font-dm-serif) text-[clamp(36px,5vw,56px)] leading-none text-zinc-100">
                {s.value}
              </div>
              <div className="text-sm text-zinc-500 mt-2 font-medium">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-zinc-800" />

      {/* Features */}
      <section className="mx-auto max-w-275 px-6 py-20">
        <div className="grid grid-cols-2 max-md:grid-cols-1 gap-16 items-start">
          {/* Sticky left */}
          <div className="sticky top-20 max-md:static">
            <span className="inline-block bg-green-950 text-green-400 font-mono text-[11px] font-medium tracking-[0.08em] px-2.5 py-0.75 rounded-full mb-4">
              How it works
            </span>
            <h2 className="font-(family-name:--font-dm-serif) text-[clamp(32px,4vw,52px)] leading-[1.08] tracking-[-0.025em] m-0 text-zinc-100">
              From idea
              <br />
              to shipped.
            </h2>
            <p className="mt-5 text-zinc-400 leading-[1.7] max-w-85 text-[15px]">
              A focused workflow built around the real lifecycle of a side
              project — from the first commit to the celebration.
            </p>
          </div>

          {/* Feature rows */}
          <div>
            {features.map((f) => (
              <div
                key={f.tag}
                className="border-t border-zinc-800 py-8 grid gap-6 grid-cols-[64px_1fr] last:border-b last:border-zinc-800 transition-colors hover:border-green-500"
              >
                <span className="font-mono text-[12px] text-green-400 font-medium">
                  {f.tag}
                </span>
                <div>
                  <h3 className="text-[18px] font-bold mb-2.5 text-zinc-100">
                    {f.title}
                  </h3>
                  <p className="text-[15px] text-zinc-400 leading-[1.65] m-0">
                    {f.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="border-zinc-800" />

      {/* CTA */}
      <section className="bg-zinc-900 py-25 px-6 text-center">
        <div className="max-w-150 mx-auto">
          <span className="inline-block bg-green-950 text-green-400 font-mono text-[11px] font-medium tracking-[0.08em] px-2.5 py-0.75 rounded-full mb-6">
            Join the community
          </span>
          <h2 className="font-(family-name:--font-dm-serif) text-[clamp(36px,5vw,64px)] leading-[1.05] tracking-[-0.03em] mb-6 text-zinc-100">
            Ready to build
            <br />
            <em>in public?</em>
          </h2>
          <p className="text-[18px] text-zinc-400 leading-[1.65] mb-10">
            Your next project deserves an audience. Start logging, start
            shipping, get on the wall.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 px-9 py-4 bg-zinc-100 text-zinc-900 rounded font-semibold text-[16px] transition hover:bg-white hover:-translate-y-px"
          >
            Create your free account
            <ArrowRight />
          </Link>
        </div>
      </section>
    </div>
  );
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}