"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "6+ characters", pass: password.length >= 6 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /\d/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const colors = ["bg-red-500", "bg-amber-500", "bg-amber-500", "bg-green-500"];

  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i < score ? colors[score] : "bg-white/10"}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {checks.map((c) => (
          <span key={c.label} className={`text-[10px] ${c.pass ? "text-green-400" : "text-[var(--muted)]"}`}>
            {c.pass ? "✓" : "○"} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") || "";
  const utmSource = searchParams.get("utm_source") || "";
  const utmMedium = searchParams.get("utm_medium") || "";
  const utmCampaign = searchParams.get("utm_campaign") || "";

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/dashboard");
    });
  }, [router]);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: {
        name,
        ...(refCode ? { referred_by: refCode } : {}),
        ...(utmSource ? { utm_source: utmSource } : {}),
        ...(utmMedium ? { utm_medium: utmMedium } : {}),
        ...(utmCampaign ? { utm_campaign: utmCampaign } : {}),
      } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Send welcome email (fire-and-forget)
    fetch("/api/welcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, utm_source: utmSource, utm_medium: utmMedium, utm_campaign: utmCampaign }),
    }).catch(() => {});
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 border border-green-500/30">
            <svg className="h-7 w-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Check your email</h1>
          <p className="text-[var(--muted)]">
            We sent a confirmation link to <strong className="text-white">{email}</strong>. Click it to activate your account.
          </p>
          <Link href="/login" className="mt-6 inline-block rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl grid gap-8 lg:grid-cols-2 items-center">
        {/* Left side — value prop */}
        <div className="hidden lg:block">
          <h2 className="text-3xl font-bold mb-4">
            Start managing your fans <span className="text-brand-500">like a pro</span>
          </h2>
          <p className="text-[var(--muted)] mb-8">Join creators who are saving subscribers and growing revenue with CreatorCRM.</p>
          <div className="space-y-4">
            {[
              { icon: "⚡", text: "Smart alerts tell you exactly who to message" },
              { icon: "📊", text: "Track revenue, churn risk, and retention" },
              { icon: "📋", text: "8 proven message templates, ready to copy" },
              { icon: "🏷️", text: "Auto-tag fans as Whales, VIPs, or At-Risk" },
              { icon: "🔒", text: "Bank-level security with 2FA" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <span className="text-xl">{f.icon}</span>
                <span className="text-sm">{f.text}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 text-green-400 text-sm">✓</div>
              <span className="text-sm font-medium">Free forever for up to 25 fans</span>
            </div>
            <p className="text-xs text-[var(--muted)] pl-11">No credit card required. Upgrade only when you&apos;re ready.</p>
          </div>
        </div>

        {/* Right side — form */}
        <div>
          <div className="mb-6 text-center lg:text-left">
            <Link href="/" className="text-2xl font-bold">
              Creator<span className="text-brand-500">CRM</span>
            </Link>
            <p className="mt-2 text-[var(--muted)]">Free forever for up to 25 fans. No credit card needed.</p>
          </div>

          <form onSubmit={handleSignUp} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 space-y-4">
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Your name</label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 transition"
                placeholder="e.g. Sarah" required
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 transition"
                placeholder="you@example.com" required
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 pr-10 text-sm text-white outline-none focus:border-brand-500 transition"
                  placeholder="At least 6 characters" minLength={6} required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-white transition" tabIndex={-1}>
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50">
              {loading ? "Creating account..." : "Create Free Account"}
            </button>

            <p className="text-center text-xs text-[var(--muted)]">
              By signing up you agree to our{" "}
              <Link href="/terms" className="text-brand-400 hover:underline">Terms</Link> and{" "}
              <Link href="/privacy" className="text-brand-400 hover:underline">Privacy Policy</Link>
            </p>

            <p className="text-center text-sm text-[var(--muted)]">
              Already have an account?{" "}
              <Link href="/login" className="text-brand-400 hover:underline">Log in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
