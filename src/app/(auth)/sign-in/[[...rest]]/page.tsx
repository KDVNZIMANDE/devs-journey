import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-zinc-950 font-[family-name:var(--font-manrope)] flex">

      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 border-r border-zinc-800 px-12 py-14 relative overflow-hidden">

        {/* Background effects */}
        <div className="pointer-events-none absolute -top-40 -left-20 w-[500px] h-[500px] rounded-full bg-green-500/6 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-green-500/4 blur-2xl" />
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-green-500/20 to-transparent" />

        {/* Top — logo */}
        <div>
          <div className="flex items-center gap-2.5 mb-16">
            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M8 3l5 5-5 5" stroke="#09090b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-[family-name:var(--font-dm-serif)] text-[18px] text-zinc-100">DevBuild</span>
          </div>

          <h1 className="font-[family-name:var(--font-dm-serif)] text-[42px] leading-[1.05] tracking-[-0.03em] text-zinc-100 mb-4">
            Build in public.<br />
            <span className="text-green-400">Ship for real.</span>
          </h1>
          <p className="text-zinc-500 text-[15px] leading-[1.7]">
            Track your projects, log milestones, find collaborators, and celebrate when you ship.
          </p>
        </div>

      </div>

      {/* ── Right panel — Clerk form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-green-500/4 blur-3xl" />

        <div className="w-full max-w-[400px] relative">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M8 3l5 5-5 5" stroke="#09090b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-[family-name:var(--font-dm-serif)] text-[16px] text-zinc-100">DevBuild</span>
          </div>

          <div className="mb-8">
            <h2 className="font-[family-name:var(--font-dm-serif)] text-[28px] text-zinc-100 mb-1">Welcome back</h2>
            <p className="text-zinc-500 text-[14px]">Sign in to continue building.</p>
          </div>

          <SignIn
            fallbackRedirectUrl="/feed"
            forceRedirectUrl="/feed"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-transparent shadow-none p-0 w-full",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 transition-all rounded-lg font-medium text-[13px]",
                socialButtonsBlockButtonText: "text-zinc-300 font-medium",
                dividerLine: "bg-zinc-800",
                dividerText: "text-zinc-600 font-mono text-[11px]",
                formFieldLabel: "text-zinc-400 text-[12px] font-semibold uppercase tracking-widest",
                formFieldInput:
                  "bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg px-4 py-2.5 text-[14px] focus:border-green-500 focus:ring-1 focus:ring-green-500/20 placeholder:text-zinc-600 transition-all",
                formButtonPrimary:
                  "bg-green-500 hover:bg-green-400 text-zinc-950 font-bold rounded-lg py-2.5 text-[14px] transition-all hover:-translate-y-px active:translate-y-0",
                footerActionText: "text-zinc-500 text-[13px]",
                footerActionLink: "text-green-400 hover:text-green-300 font-semibold",
                identityPreviewText: "text-zinc-300",
                identityPreviewEditButton: "text-green-400 hover:text-green-300",
                formFieldErrorText: "text-red-400 text-[12px] font-mono",
                alertText: "text-red-400 text-[13px]",
                alert: "bg-red-500/10 border border-red-500/30 rounded-lg",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}