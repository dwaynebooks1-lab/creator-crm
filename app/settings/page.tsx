"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, User } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Settings() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState("free");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) {
        router.push("/login");
        return;
      }
      setUser(u);
      setName(u.user_metadata?.name || "");

      const { data: creator } = await supabase
        .from("creators")
        .select("plan")
        .eq("id", u.id)
        .single();
      if (creator) setPlan(creator.plan);

      setLoading(false);
    });
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    const { error: updateError } = await supabase.auth.updateUser({
      data: { name: name.trim() },
    });

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    await supabase
      .from("creators")
      .update({ name: name.trim() })
      .eq("id", user!.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleUpgrade() {
    const res = await fetch("/api/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold">
            Creator<span className="text-brand-500">CRM</span>
          </Link>
          <Link href="/dashboard" className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white transition">
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Settings</h1>

        {/* Profile */}
        <form onSubmit={handleSave} className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-lg font-semibold mb-4">Profile</h2>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}
          {saved && (
            <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-300">
              Profile updated successfully!
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 transition"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Email</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--muted)] outline-none opacity-60"
              />
              <p className="mt-1 text-xs text-[var(--muted)]">Email can&apos;t be changed</p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

        {/* Subscription */}
        <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-lg font-semibold mb-4">Subscription</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {plan === "pro" ? "Pro Plan" : "Free Plan"}
              </p>
              <p className="text-sm text-[var(--muted)]">
                {plan === "pro" ? "$49/month — Unlimited fans" : "Up to 25 fans"}
              </p>
            </div>
            {plan !== "pro" && (
              <button
                onClick={handleUpgrade}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition"
              >
                Upgrade to Pro
              </button>
            )}
            {plan === "pro" && (
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-brand-500/20 border border-brand-500/30 px-3 py-1 text-sm font-medium text-brand-400">
                  Active
                </span>
                <button
                  onClick={async () => {
                    const res = await fetch("/api/portal", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ userId: user?.id }),
                    });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  }}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white transition"
                >
                  Manage Subscription
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
          <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            Need to delete your account? Contact support and we&apos;ll handle it for you.
          </p>
        </div>
      </div>
    </div>
  );
}
