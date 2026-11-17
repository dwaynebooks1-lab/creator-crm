"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
  }, []);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="text-[var(--muted)]">Verifying reset link...</p>
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
          <p className="mt-2 text-[var(--muted)]">Set your new password</p>
        </div>

        <form onSubmit={handleUpdate} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500"
              placeholder="At least 6 characters"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50"
          >
            {loading ? "Updating..." : "Set New Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
