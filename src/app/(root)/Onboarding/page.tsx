"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { createUser } from "@/app/api/user";
import { useClerk } from "@clerk/nextjs";

const TECH_OPTIONS = [
  "React", "Next.js", "TypeScript", "Node.js", "Python", "Go", "Rust",
  "PostgreSQL", "MongoDB", "Redis", "Docker", "AWS", "Tailwind", "GraphQL",
  "Swift", "Kotlin", "Vue", "Svelte", "Laravel", "Django",
];

const STEPS = ["Profile", "About", "Stack", "Collab"];

// ── Validation helpers ────────────────────────────────────────────────────────

function isValidUrl(url: string) {
  if (!url) return true; // optional fields
  try { new URL(url); return true; } catch { return false; }
}

function isValidUsername(u: string) {
  return /^[a-z0-9_-]{3,30}$/.test(u);
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { session } = useClerk();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState(clerkUser?.firstName ?? "");
  const [lastName, setLastName]   = useState(clerkUser?.lastName ?? "");
  const [username, setUsername]   = useState(
    clerkUser?.username ?? clerkUser?.firstName?.toLowerCase() ?? ""
  );
  const [bio, setBio]                   = useState("");
  const [githubUrl, setGithubUrl]       = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [availableForCollab, setAvailableForCollab] = useState(true);

  // ── Per-field touched state for inline validation ─────────────────────────
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (field: string) => setTouched((p) => ({ ...p, [field]: true }));

  // ── Field errors ──────────────────────────────────────────────────────────
  const errors = {
    firstName:   !firstName.trim() ? "First name is required" : firstName.trim().length < 2 ? "Too short" : null,
    lastName:    !lastName.trim()  ? "Last name is required"  : lastName.trim().length < 2  ? "Too short" : null,
    username:    !username         ? "Username is required"   : !isValidUsername(username)   ? "3–30 chars, letters/numbers/_ only" : null,
    githubUrl:   !isValidUrl(githubUrl)    ? "Enter a valid URL (https://…)" : null,
    portfolioUrl:!isValidUrl(portfolioUrl) ? "Enter a valid URL (https://…)" : null,
  };

  const step0Valid = !errors.firstName && !errors.lastName && !errors.username;
  const step1Valid = !errors.githubUrl && !errors.portfolioUrl;

  const toggleTech = (tech: string) =>
    setSelectedTech((prev) => prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]);

  function advanceTo(next: number) {
    // Touch all fields for current step before advancing
    if (next > step) {
      if (step === 0) {
        setTouched((p) => ({ ...p, firstName: true, lastName: true, username: true }));
        if (!step0Valid) return;
      }
      if (step === 1) {
        setTouched((p) => ({ ...p, githubUrl: true, portfolioUrl: true }));
        if (!step1Valid) return;
      }
    }
    setStep(next);
    setError(null);
  }

  async function handleFinish() {
    setSubmitting(true);
    setError(null);

    try {
      const result = await createUser({
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        username,
        bio,
        githubUrl:    githubUrl.trim(),
        portfolioUrl: portfolioUrl.trim(),
        techStack:    selectedTech,
        availableForCollab,
      });

      if (!result.success) {
        if (result.message?.toLowerCase().includes("username")) {
          setError("That username is already taken. Please choose another.");
          setStep(0);
        } else {
          setError(result.message ?? "Something went wrong");
        }
        setSubmitting(false);
        return;
      }

      await session?.reload();
      window.location.href = "/feed";

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 font-[family-name:var(--font-manrope)] text-zinc-100">
      <div className="mx-auto max-w-[520px] px-6 py-12">

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-10">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 flex flex-col gap-1">
              <div className={`h-[3px] rounded-full transition-all duration-500 ${
                i < step ? "bg-green-500" : i === step ? "bg-green-500/50" : "bg-zinc-800"
              }`} />
              <span className={`font-mono text-[9px] tracking-widest uppercase transition-colors ${
                i === step ? "text-green-400" : i < step ? "text-zinc-500" : "text-zinc-700"
              }`}>{label}</span>
            </div>
          ))}
        </div>

        {/* Global error */}
        {error && (
          <div className="mb-6 border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* ── Step 0 — Basic info ───────────────────────────────────────────── */}
        {step === 0 && (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center font-[family-name:var(--font-dm-serif)] text-2xl text-green-400 shrink-0">
                {firstName ? firstName.charAt(0).toUpperCase() : "?"}
              </div>
              <div>
                <p className="font-semibold text-zinc-200 text-sm">Welcome to DevBuild</p>
                <p className="text-zinc-500 text-[13px]">Let&apos;s set up your public profile</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-400 font-mono text-[11px] font-medium tracking-[0.08em] px-[10px] py-[4px] rounded-full border border-green-500/20 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Step 1 of 4
            </span>
            <h1 className="font-[family-name:var(--font-dm-serif)] text-[clamp(28px,5vw,42px)] leading-[1.05] tracking-[-0.03em] text-zinc-100 mb-2">
              You&apos;re in.<br />
              <span className="text-green-400">Let&apos;s set the scene.</span>
            </h1>
            <p className="text-zinc-500 text-[14px] leading-[1.65] mb-8">
              This is your public identity on DevBuild.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="First name" error={touched.firstName ? errors.firstName : null}>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onBlur={() => touch("firstName")}
                  placeholder="Alex"
                  className={inputCls(touched.firstName && !!errors.firstName)}
                />
              </Field>
              <Field label="Last name" error={touched.lastName ? errors.lastName : null}>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onBlur={() => touch("lastName")}
                  placeholder="Chen"
                  className={inputCls(touched.lastName && !!errors.lastName)}
                />
              </Field>
            </div>

            <Field
              label="Username"
              hint="public"
              error={touched.username ? errors.username : null}
              className="mb-8"
            >
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                onBlur={() => touch("username")}
                placeholder="alexchen"
                className={inputCls(touched.username && !!errors.username)}
              />
              {username && !errors.username && (
                <p className="text-[12px] text-zinc-600 mt-1.5 font-mono">devbuild.io/@{username}</p>
              )}
            </Field>

            <div className="flex justify-end">
              <button
                onClick={() => advanceTo(1)}
                disabled={!firstName || !lastName || !username}
                className={primaryBtn}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 1 — Bio + links ──────────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-400 font-mono text-[11px] font-medium tracking-[0.08em] px-[10px] py-[4px] rounded-full border border-green-500/20 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Step 2 of 4
            </span>
            <h1 className="font-[family-name:var(--font-dm-serif)] text-[clamp(28px,5vw,42px)] leading-[1.05] tracking-[-0.03em] text-zinc-100 mb-2">
              What are<br />you about?
            </h1>
            <p className="text-zinc-500 text-[14px] leading-[1.65] mb-8">
              A short bio helps other builders know what you&apos;re working on.
            </p>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[12px] font-semibold text-zinc-400 uppercase tracking-widest">Bio</label>
                <span className="font-mono text-[11px] text-zinc-600">{bio.length} / 300</span>
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 300))}
                placeholder="Full-stack developer building tools for indie devs."
                rows={4}
                className={`${inputCls(false)} resize-none`}
              />
            </div>

            <Field
              label="GitHub URL"
              hint="optional"
              error={touched.githubUrl ? errors.githubUrl : null}
              className="mb-4"
            >
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                onBlur={() => touch("githubUrl")}
                placeholder="https://github.com/alexchen"
                className={inputCls(touched.githubUrl && !!errors.githubUrl)}
              />
            </Field>

            <Field
              label="Portfolio / Website"
              hint="optional"
              error={touched.portfolioUrl ? errors.portfolioUrl : null}
              className="mb-8"
            >
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                onBlur={() => touch("portfolioUrl")}
                placeholder="https://alexchen.dev"
                className={inputCls(touched.portfolioUrl && !!errors.portfolioUrl)}
              />
            </Field>

            <div className="flex justify-between items-center">
              <button onClick={() => advanceTo(0)} className={backBtn}>← Back</button>
              <button onClick={() => advanceTo(2)} disabled={!step1Valid && (!!touched.githubUrl || !!touched.portfolioUrl)} className={primaryBtn}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2 — Tech stack ───────────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-400 font-mono text-[11px] font-medium tracking-[0.08em] px-[10px] py-[4px] rounded-full border border-green-500/20 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Step 3 of 4
            </span>
            <h1 className="font-[family-name:var(--font-dm-serif)] text-[clamp(28px,5vw,42px)] leading-[1.05] tracking-[-0.03em] text-zinc-100 mb-2">
              What do you<br />build with?
            </h1>
            <p className="text-zinc-500 text-[14px] leading-[1.65] mb-8">
              Select the technologies you work with.
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {TECH_OPTIONS.map((tech) => (
                <button
                  key={tech}
                  onClick={() => toggleTech(tech)}
                  className={`font-mono text-[12px] px-3 py-1.5 rounded-full border transition-all ${
                    selectedTech.includes(tech)
                      ? "bg-green-500/10 border-green-500/50 text-green-300"
                      : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                  }`}
                >
                  {selectedTech.includes(tech) && <span className="mr-1 text-green-500">✓</span>}
                  {tech}
                </button>
              ))}
            </div>

            {selectedTech.length > 0 && (
              <p className="text-[12px] text-zinc-600 mb-6 font-mono">
                {selectedTech.length} selected
              </p>
            )}

            <div className="flex justify-between items-center">
              <button onClick={() => advanceTo(1)} className={backBtn}>← Back</button>
              <button onClick={() => advanceTo(3)} className={primaryBtn}>Continue →</button>
            </div>
          </div>
        )}

        {/* ── Step 3 — Collaboration ────────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-400 font-mono text-[11px] font-medium tracking-[0.08em] px-[10px] py-[4px] rounded-full border border-green-500/20 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Step 4 of 4
            </span>
            <h1 className="font-[family-name:var(--font-dm-serif)] text-[clamp(28px,5vw,42px)] leading-[1.05] tracking-[-0.03em] text-zinc-100 mb-2">
              Open for<br />
              <span className="text-green-400">collaboration?</span>
            </h1>
            <p className="text-zinc-500 text-[14px] leading-[1.65] mb-8">
              Let the community know if you&apos;re open to working with others.
            </p>

            <div className="mb-10">
              <button
                onClick={() => setAvailableForCollab((v) => !v)}
                className={`w-full flex items-center justify-between p-5 border rounded-xl transition-all ${
                  availableForCollab
                    ? "border-green-500/50 bg-green-500/8"
                    : "border-zinc-700 bg-zinc-900 hover:border-zinc-600"
                }`}
              >
                <div className="text-left">
                  <p className={`text-[14px] font-semibold ${availableForCollab ? "text-green-300" : "text-zinc-300"}`}>
                    {availableForCollab ? "Available for collaboration" : "Not available right now"}
                  </p>
                  <p className="text-[12px] text-zinc-500 mt-0.5">
                    {availableForCollab
                      ? "Others can reach out to work together"
                      : "You can change this anytime from your profile"}
                  </p>
                </div>
                <div className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ml-4 ${availableForCollab ? "bg-green-500" : "bg-zinc-700"}`}>
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${availableForCollab ? "translate-x-5" : "translate-x-1"}`} />
                </div>
              </button>
            </div>

            {/* Summary card */}
            <div className="border border-zinc-800 bg-zinc-900 rounded-xl p-5 mb-8">
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Your profile summary</p>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center font-[family-name:var(--font-dm-serif)] text-lg text-green-400 shrink-0">
                  {firstName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-zinc-200">{firstName} {lastName}</p>
                  <p className="text-[12px] text-zinc-500 font-mono">@{username}</p>
                </div>
              </div>
              {bio && <p className="text-[13px] text-zinc-400 leading-[1.6] mb-3 line-clamp-2">{bio}</p>}
              {selectedTech.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedTech.slice(0, 6).map((t) => (
                    <span key={t} className="font-mono text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                  {selectedTech.length > 6 && (
                    <span className="font-mono text-[10px] text-zinc-600">+{selectedTech.length - 6} more</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-zinc-800">
              <button onClick={() => advanceTo(2)} disabled={submitting} className={backBtn}>← Back</button>
              <button
                onClick={handleFinish}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-[11px] bg-green-500 text-zinc-950 text-[14px] font-bold rounded-lg transition hover:bg-green-400 hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
              >
                {submitting ? (
                  <><span className="w-4 h-4 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" />Setting up…</>
                ) : "Finish setup →"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Shared style constants ────────────────────────────────────────────────────

const primaryBtn = "inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-100 text-zinc-900 text-[14px] font-bold rounded-lg transition hover:bg-white hover:-translate-y-px disabled:opacity-40 disabled:pointer-events-none";
const backBtn    = "text-[13px] font-semibold text-zinc-500 hover:text-zinc-300 transition-colors";

function inputCls(hasError: boolean) {
  return `w-full bg-zinc-900 border ${hasError ? "border-red-500/60 focus:border-red-500/80" : "border-zinc-700/60 focus:border-green-500/60"} px-4 py-2.5 text-[14px] text-zinc-100 outline-none focus:ring-1 ${hasError ? "focus:ring-red-500/20" : "focus:ring-green-500/20"} transition-all placeholder:text-zinc-600 rounded-lg`;
}

function Field({
  label, hint, error, className, children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <label className="text-[12px] font-semibold text-zinc-400 uppercase tracking-widest">{label}</label>
        {hint && <span className="font-mono text-[10px] text-zinc-600">· {hint}</span>}
      </div>
      {children}
      {error && <p className="text-[11px] text-red-400 mt-1.5 font-mono">{error}</p>}
    </div>
  );
}