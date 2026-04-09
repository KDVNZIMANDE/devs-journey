"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { createUser } from "@/app/api/user";

const TECH_OPTIONS = [
  "React", "Next.js", "TypeScript", "Node.js", "Python", "Go", "Rust",
  "PostgreSQL", "MongoDB", "Redis", "Docker", "AWS", "Tailwind", "GraphQL",
  "Swift", "Kotlin", "Vue", "Svelte", "Laravel", "Django",
];

const SUPPORT_OPTIONS = [
  "Code review", "Design feedback", "Beta testing",
  "Accountability", "Mentoring", "Co-founding",
];

const STEPS = ["Profile", "About", "Stack", "Collaboration"];

export default function OnboardingPage() {
  const router = useRouter();
  const { user: clerkUser } = useUser();

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

  const toggleTech = (tech: string) =>
    setSelectedTech((prev) => prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]);

  async function handleFinish() {
    setSubmitting(true);
    setError(null);

    try {
      const result = await createUser({
        firstName,
        lastName,
        username,
        bio,
        githubUrl,
        portfolioUrl,
        techStack: selectedTech,
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

      document.cookie = "onboarding_complete=true; path=/; max-age=31536000; SameSite=Lax";
      router.replace("/feed");

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white font-(family-name:--font-manrope)">
      <div className="mx-auto max-w-130 px-6 py-12">

        {/* Step indicator */}
        <div className="flex gap-1.5 mb-10">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`h-0.75 flex-1 rounded-full transition-colors ${
                i < step ? "bg-green-500" : i === step ? "bg-green-300" : "bg-zinc-200"
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Step 0 — Basic info */}
        {step === 0 && (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center font-(family-name:--font-dm-serif) text-2xl text-green-600 shrink-0">
                {firstName ? firstName.charAt(0).toUpperCase() : "?"}
              </div>
              <div>
                <p className="font-semibold text-zinc-800 text-sm">Welcome to DevBuild</p>
                <p className="text-zinc-400 text-[13px]">Let&apos;s set up your public profile</p>
              </div>
            </div>

            <span className="inline-block bg-green-100 text-green-700 font-mono text-[11px] font-medium tracking-[0.08em] px-2.5 py-0.75 rounded-full mb-3">
              Step 1 of 4
            </span>
            <h1 className="font-(family-name:--font-dm-serif) text-[clamp(28px,5vw,40px)] leading-[1.08] tracking-[-0.03em] text-zinc-900 mb-2">
              You&apos;re in.<br />
              <span className="text-green-600">Let&apos;s set the scene.</span>
            </h1>
            <p className="text-zinc-500 text-[14px] leading-[1.65] mb-8">
              Tell the community who you are. This is your public identity on DevBuild.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[13px] font-semibold text-zinc-600 mb-1.5">First name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Alex"
                  className="w-full border border-zinc-200 px-3 py-2.5 text-[14px] text-zinc-900 outline-none focus:border-green-500 transition-colors placeholder:text-zinc-300 rounded"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-zinc-600 mb-1.5">Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Chen"
                  className="w-full border border-zinc-200 px-3 py-2.5 text-[14px] text-zinc-900 outline-none focus:border-green-500 transition-colors placeholder:text-zinc-300 rounded"
                />
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-[13px] font-semibold text-zinc-600 mb-1.5">
                Username <span className="font-normal text-zinc-400 text-[12px]">· public</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                placeholder="alexchen"
                className="w-full border border-zinc-200 px-3 py-2.5 text-[14px] text-zinc-900 outline-none focus:border-green-500 transition-colors placeholder:text-zinc-300 rounded"
              />
              {username && (
                <p className="text-[12px] text-zinc-400 mt-1 font-mono">devbuild.io/@{username}</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep(1)}
                disabled={!firstName || !lastName || !username}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white text-[14px] font-semibold rounded transition hover:bg-zinc-800 hover:-translate-y-px disabled:opacity-40 disabled:pointer-events-none"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 1 — Bio + links */}
        {step === 1 && (
          <div>
            <span className="inline-block bg-green-100 text-green-700 font-mono text-[11px] font-medium tracking-[0.08em] px-2.5 py-0.75 rounded-full mb-3">
              Step 2 of 4
            </span>
            <h1 className="font-(family-name:--font-dm-serif) text-[clamp(28px,5vw,40px)] leading-[1.08] tracking-[-0.03em] text-zinc-900 mb-2">
              What are<br />you about?
            </h1>
            <p className="text-zinc-500 text-[14px] leading-[1.65] mb-8">
              A short bio helps other builders know what you&apos;re working on.
            </p>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[13px] font-semibold text-zinc-600">Bio</label>
                <span className="font-mono text-[11px] text-zinc-400">{bio.length} / 300</span>
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 300))}
                placeholder="Full-stack developer building tools for indie devs."
                rows={4}
                className="w-full border border-zinc-200 px-3 py-2.5 text-[14px] text-zinc-900 outline-none focus:border-green-500 transition-colors resize-none placeholder:text-zinc-300 rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block text-[13px] font-semibold text-zinc-600 mb-1.5">
                GitHub URL <span className="font-normal text-zinc-400 text-[12px]">· optional</span>
              </label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/alexchen"
                className="w-full border border-zinc-200 px-3 py-2.5 text-[14px] text-zinc-900 outline-none focus:border-green-500 transition-colors placeholder:text-zinc-300 rounded"
              />
            </div>

            <div className="mb-8">
              <label className="block text-[13px] font-semibold text-zinc-600 mb-1.5">
                Portfolio / Website <span className="font-normal text-zinc-400 text-[12px]">· optional</span>
              </label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://alexchen.dev"
                className="w-full border border-zinc-200 px-3 py-2.5 text-[14px] text-zinc-900 outline-none focus:border-green-500 transition-colors placeholder:text-zinc-300 rounded"
              />
            </div>

            <div className="flex justify-between items-center">
              <button onClick={() => setStep(0)} className="text-[13px] font-semibold text-zinc-400 hover:text-zinc-700 transition-colors">
                ← Back
              </button>
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white text-[14px] font-semibold rounded transition hover:bg-zinc-800 hover:-translate-y-px"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Tech stack */}
        {step === 2 && (
          <div>
            <span className="inline-block bg-green-100 text-green-700 font-mono text-[11px] font-medium tracking-[0.08em] px-2.5 py-0.75 rounded-full mb-3">
              Step 3 of 4
            </span>
            <h1 className="font-(family-name:--font-dm-serif) text-[clamp(28px,5vw,40px)] leading-[1.08] tracking-[-0.03em] text-zinc-900 mb-2">
              What do you<br />build with?
            </h1>
            <p className="text-zinc-500 text-[14px] leading-[1.65] mb-8">
              Select the technologies you work with. This surfaces relevant projects and collaborators.
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              {TECH_OPTIONS.map((tech) => (
                <button
                  key={tech}
                  onClick={() => toggleTech(tech)}
                  className={`font-mono text-[12px] px-3 py-1.25 rounded-full border transition-all ${
                    selectedTech.includes(tech)
                      ? "bg-green-50 border-green-300 text-green-700"
                      : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-400"
                  }`}
                >
                  {tech}
                </button>
              ))}
            </div>

            {selectedTech.length > 0 && (
              <p className="text-[12px] text-zinc-400 mb-6 font-mono">
                {selectedTech.length} selected: {selectedTech.join(", ")}
              </p>
            )}

            <div className="flex justify-between items-center">
              <button onClick={() => setStep(1)} className="text-[13px] font-semibold text-zinc-400 hover:text-zinc-700 transition-colors">
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white text-[14px] font-semibold rounded transition hover:bg-zinc-800 hover:-translate-y-px"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Collaboration */}
        {step === 3 && (
          <div>
            <span className="inline-block bg-green-100 text-green-700 font-mono text-[11px] font-medium tracking-[0.08em] px-2.5 py-0.75 rounded-full mb-3">
              Step 4 of 4
            </span>
            <h1 className="font-(family-name:--font-dm-serif) text-[clamp(28px,5vw,40px)] leading-[1.08] tracking-[-0.03em] text-zinc-900 mb-2">
              Open for<br />
              <span className="text-green-600">collaboration?</span>
            </h1>
            <p className="text-zinc-500 text-[14px] leading-[1.65] mb-8">
              Let the community know if you&apos;re open to working with others.
            </p>

            <div className="mb-10">
              <label className="block text-[13px] font-semibold text-zinc-600 mb-3">
                Availability for collaboration
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAvailableForCollab((v) => !v)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    availableForCollab ? "bg-green-500" : "bg-zinc-200"
                  }`}
                >
                  <span
                    className={`absolute top-0.75 w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                      availableForCollab ? "translate-x-5.5" : "translate-x-0.75"
                    }`}
                  />
                </button>
                <span className="text-[13px] text-zinc-600">
                  {availableForCollab ? "Available for collaboration" : "Not available right now"}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-zinc-100">
              <button
                onClick={() => setStep(2)}
                disabled={submitting}
                className="text-[13px] font-semibold text-zinc-400 hover:text-zinc-700 transition-colors disabled:opacity-40"
              >
                ← Back
              </button>
              <button
                onClick={handleFinish}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white text-[14px] font-semibold rounded transition hover:bg-zinc-800 hover:-translate-y-px disabled:opacity-60 disabled:pointer-events-none"
              >
                {submitting ? "Setting up…" : "Finish setup →"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}