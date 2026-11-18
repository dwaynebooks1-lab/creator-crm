"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  const router = useRouter();

  const [mfaStep, setMfaStep] = useState(false);
  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/dashboard");
    });
  }, [router]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("crm_remember_email");
      if (saved) {
        setEmail(saved);
        setRememberEmail(true);
      }
    } catch {}
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (rememberEmail) {
      try { localStorage.setItem("crm_remember_email", email); } catch {}
    } else {
      try { localStorage.removeItem("crm_remember_email"); } catch {}
    }

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    const { data: factors } = await supabase.auth.mfa.listFactors();
    const totp = factors?.totp?.find((f) => f.status === "verified");

    if (totp) {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totp.id,
      });

      if (challengeError) {
        setError(challengeError.message);
        setLoading(false);
        return;
      }

      setFactorId(totp.id);
      setChallengeId(challenge.id);
      setMfaStep(true);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  async function handleMfaVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setVerifying(true);

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code: code.trim(),
    });

    if (verifyError) {
      setError("Invalid code. Please try again.");
      setVerifying(false);
      return;
    }

    router.push("/dashboard");
  }

  if (mfaStep) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="text-2xl font-bold">
              Creator<span className="text-brand-500">CRM</span>
            </Link>
            <p className="mt-2 text-[var(--muted)]">Enter your authenticator code</p>
          </div>

          <form onSubmit={handleMfaVerify} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 space-y-4">
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="text-center mb-2">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/10 border border-brand-500/30">
                <svg className="h-7 w-7 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-sm text-[var(--muted)]">Open your authenticator app and enter the 6-digit code</p>
            </div>

            <div>
              <input
                type="text" inputMode="numeric" maxLength={6}
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-3 text-center text-2xl font-mono tracking-[0.5em] text-white outline-none focus:border-brand-500"
                placeholder="000000" autoFocus required
              />
            </div>

            <button type="submit" disabled={verifying || code.length !== 6}
              className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50">
              {verifying ? "Verifying..." : "Verify & Log In"}
            </button>

            <button type="button" onClick={() => { setMfaStep(false); setCode(""); setError(""); }}
              className="w-full text-center text-sm text-[var(--muted)] hover:text-white transition">
              Back to login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold">
            Creator<span className="text-brand-500">CRM</span>
          </Link>
          <p className="mt-2 text-lg text-[var(--muted)]">Welcome back</p>
        </div>

        <form onSubmit={handleLogin} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Email</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 transition"
              placeholder="you@example.com" required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-[var(--muted)]">Password</label>
              <Link href="/forgot-password" className="text-xs text-brand-400 hover:underline">Forgot?</Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 pr-10 text-sm text-white outline-none focus:border-brand-500 transition"
                placeholder="Your password" required
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
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={rememberEmail} onChange={(e) => setRememberEmail(e.target.checked)}
              className="rounded border-[var(--border)] bg-[var(--bg)] text-brand-500 focus:ring-brand-500" />
            <span className="text-xs text-[var(--muted)]">Remember my email</span>
          </label>

          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50">
            {loading ? "Logging in..." : "Log In"}
          </button>

          <p className="text-center text-sm text-[var(--muted)]">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-brand-400 hover:underline">Sign up free</Link>
          </p>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          Protected by 2FA &middot; Bank-level encryption
        </p>
      </div>
    </div>
  );
}
