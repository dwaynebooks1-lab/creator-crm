"use client";
import { useState } from "react";
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
  const router = useRouter();

  // MFA state
  const [mfaStep, setMfaStep] = useState(false);
  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    // Check if MFA is required
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const totp = factors?.totp?.find((f) => f.status === "verified");

    if (totp) {
      // MFA is enabled — need verification code
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

    // No MFA — go straight to dashboard
    router.push("/dashboard");
  }

  async function handleMfaVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setVerifying(true);

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: factorId,
      challengeId: challengeId,
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
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-3 text-center text-2xl font-mono tracking-[0.5em] text-white outline-none focus:border-brand-500"
                placeholder="000000"
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              disabled={verifying || code.length !== 6}
              className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50"
            >
              {verifying ? "Verifying..." : "Verify & Log In"}
            </button>

            <button
              type="button"
              onClick={() => { setMfaStep(false); setCode(""); setError(""); }}
              className="w-full text-center text-sm text-[var(--muted)] hover:text-white transition"
            >
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
          <p className="mt-2 text-[var(--muted)]">Log in to your account</p>
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
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500"
              placeholder="Your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>

          <div className="text-center space-y-2">
            <p className="text-sm text-[var(--muted)]">
              <Link href="/forgot-password" className="text-brand-400 hover:underline">Forgot your password?</Link>
            </p>
            <p className="text-sm text-[var(--muted)]">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-brand-400 hover:underline">Sign up free</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
