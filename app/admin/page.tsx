"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Creator {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  stripe_customer_id: string | null;
  created_at: string;
  fan_count: number;
  total_revenue: number;
}

interface Stats {
  total_users: number;
  pro_users: number;
  free_users: number;
  total_fans: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creators, setCreators] = useState<Creator[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const res = await fetch("/api/admin", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.status === 403) {
        setError("Access denied. Admin only.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError("Failed to load admin data.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setCreators(data.creators || []);
      setStats(data.stats);
      setLoading(false);
    }
    load();
  }, [router]);

  const filtered = creators.filter((c) =>
    (c.email?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (c.name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30">
            <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">{error}</h2>
          <Link href="/dashboard" className="text-brand-400 hover:underline text-sm">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const mrr = (stats?.pro_users || 0) * 49;

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xl font-bold">
              Creator<span className="text-brand-500">CRM</span>
            </Link>
            <span className="rounded-full bg-red-500/20 border border-red-500/30 px-2.5 py-0.5 text-xs font-medium text-red-400">Admin</span>
          </div>
          <Link href="/dashboard" className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white transition">
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-sm text-[var(--muted)] mb-1">Total Users</p>
            <p className="text-3xl font-bold">{stats?.total_users}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-sm text-[var(--muted)] mb-1">Pro Subscribers</p>
            <p className="text-3xl font-bold text-brand-400">{stats?.pro_users}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-sm text-[var(--muted)] mb-1">Free Users</p>
            <p className="text-3xl font-bold">{stats?.free_users}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-sm text-[var(--muted)] mb-1">Monthly Revenue</p>
            <p className="text-3xl font-bold text-green-400">${mrr.toLocaleString()}</p>
          </div>
        </div>

        {/* Extra stats row */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-sm text-[var(--muted)] mb-1">Total Fans Tracked</p>
            <p className="text-2xl font-bold">{stats?.total_fans?.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-sm text-[var(--muted)] mb-1">Avg Fans per User</p>
            <p className="text-2xl font-bold">
              {stats?.total_users ? Math.round((stats.total_fans || 0) / stats.total_users) : 0}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-sm text-[var(--muted)] mb-1">Conversion Rate</p>
            <p className="text-2xl font-bold">
              {stats?.total_users ? ((stats.pro_users / stats.total_users) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        {/* Users table */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          <div className="border-b border-[var(--border)] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-semibold">All Users ({filtered.length})</h2>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-white outline-none focus:border-brand-500 transition"
            />
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium text-right">Fans</th>
                  <th className="px-4 py-3 font-medium text-right">Revenue Tracked</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--border)] hover:bg-white/[0.02] transition">
                    <td className="px-4 py-3">
                      <p className="font-medium">{c.name || "No name"}</p>
                      <p className="text-xs text-[var(--muted)]">{c.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      {c.plan === "pro" ? (
                        <span className="rounded-full bg-brand-500/20 border border-brand-500/30 px-2.5 py-0.5 text-xs font-medium text-brand-400">Pro</span>
                      ) : (
                        <span className="rounded-full bg-white/5 border border-[var(--border)] px-2.5 py-0.5 text-xs text-[var(--muted)]">Free</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">{c.fan_count}</td>
                    <td className="px-4 py-3 text-right">${c.total_revenue.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[var(--muted)]">
                      {search ? "No users match your search" : "No users yet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-[var(--border)]">
            {filtered.map((c) => (
              <div key={c.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{c.name || "No name"}</p>
                    <p className="text-xs text-[var(--muted)]">{c.email}</p>
                  </div>
                  {c.plan === "pro" ? (
                    <span className="rounded-full bg-brand-500/20 border border-brand-500/30 px-2.5 py-0.5 text-xs font-medium text-brand-400">Pro</span>
                  ) : (
                    <span className="rounded-full bg-white/5 border border-[var(--border)] px-2.5 py-0.5 text-xs text-[var(--muted)]">Free</span>
                  )}
                </div>
                <div className="flex gap-4 text-xs text-[var(--muted)]">
                  <span>{c.fan_count} fans</span>
                  <span>${c.total_revenue.toLocaleString()} tracked</span>
                  <span>Joined {c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}</span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-8 text-center text-[var(--muted)]">
                {search ? "No users match your search" : "No users yet"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
