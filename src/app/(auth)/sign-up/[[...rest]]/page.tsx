import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

const FEATURES = [
  { icon: "◈", title: "Build in public", desc: "Log your projects and share progress with the community." },
  { icon: "⊕", title: "Find collaborators", desc: "Connect with builders who complement your skills." },
  { icon: "◎", title: "Track milestones", desc: "Break your project into wins and celebrate each one." },
  { icon: "✦", title: "Ship and celebrate", desc: "Cross the finish line and earn your place on the wall." },
];

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-zinc-950 font-[family-name:var(--font-manrope)] flex">

      {/* ── Left panel — Clerk form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-green-500/4 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-green-500/3 blur-3xl" />

        <div className="w-full max-w-[400px] relative">
          

          <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-400 font-mono text-[11px] font-medium tracking-[0.08em] px-[10px] py-[4px] rounded-full border border-green-500/20 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Free forever
            </span>
            <h2 className="font-[family-name:var(--font-dm-serif)] text-[28px] text-zinc-100 mb-1">
              Start building
            </h2>
            <p className="text-zinc-500 text-[14px]">
              Join developers building in public.{" "}
              <Link href="/sign-in" className="text-green-400 hover:text-green-300 font-semibold transition-colors">
                Already have an account?
              </Link>
            </p>
          </div>

          <SignUp
            fallbackRedirectUrl="/Onboarding"
            forceRedirectUrl="/Onboarding"
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
                formFieldErrorText: "text-red-400 text-[12px] font-mono",
                alertText: "text-red-400 text-[13px]",
                alert: "bg-red-500/10 border border-red-500/30 rounded-lg",
              },
            }}
          />
        </div>
      </div>

      {/* ── Right panel — features ── */}
      <div className="hidden lg:flex flex-col justify-between w-[440px] shrink-0 border-l border-zinc-800 px-12 py-14 relative overflow-hidden">

        {/* Background effects */}
        <div className="pointer-events-none absolute -top-20 right-0 w-[400px] h-[400px] rounded-full bg-green-500/5 blur-3xl" />
        <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-green-500/20 to-transparent" />

        {/* Top */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600 mb-8">Why DevBuild</p>
          <h3 className="font-[family-name:var(--font-dm-serif)] text-[32px] leading-[1.1] tracking-[-0.02em] text-zinc-100 mb-3">
            Accountability<br />ships products.
          </h3>
          <p className="text-zinc-500 text-[14px] leading-[1.7]">
            Developers who build in public are 3× more likely to finish their projects.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-4">
              <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-green-400 font-mono text-[16px] shrink-0">
                {f.icon}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-zinc-200 mb-0.5">{f.title}</p>
                <p className="text-[12px] text-zinc-500 leading-[1.6]">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}