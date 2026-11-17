"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <div className="mb-4 text-4xl">📧</div>
          <h1 className="text-2xl font-bold mb-3">Check your email</h1>
          <p className="text-[var(--muted)] mb-6">
            We sent a password reset link to <strong className="text-white">{email}</strong>. Click it to set a new password.
          </p>
          <Link href="/login" className="inline-block rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition">
            Back to Login
          </Link>
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
          <p className="mt-2 text-[var(--muted)]">Reset your password</p>
        </div>

        <form onSubmit={handleReset} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <p className="text-sm text-[var(--muted)]">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>

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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          <p className="text-center text-sm text-[var(--muted)]">
            Remember your password?{" "}
            <Link href="/login" className="text-brand-400 hover:underline">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
