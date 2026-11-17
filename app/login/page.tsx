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

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
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
