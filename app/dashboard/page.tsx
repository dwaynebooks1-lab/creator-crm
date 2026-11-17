"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, User } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Tag = "whale" | "vip" | "regular" | "new" | "at-risk";

type Fan = {
  id: string;
  name: string;
  tag: Tag;
  total_spent: number;
  last_message_at: string | null;
  renewal_date: string | null;
  notes: string;
};

const TAG_COLORS: Record<Tag, string> = {
  whale: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  vip: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  regular: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  new: "bg-green-500/20 text-green-300 border-green-500/30",
  "at-risk": "bg-red-500/20 text-red-300 border-red-500/30",
};

const TAG_LABELS: Record<Tag, string> = {
  whale: "Whale",
  vip: "VIP",
  regular: "Regular",
  new: "New",
  "at-risk": "At Risk",
};

function daysAgo(iso: string | null) {
  if (!iso) return "Never";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff}d ago`;
}

function daysUntil(iso: string | null) {
  if (!iso) return "—";
  const diff = Math.floor((new Date(iso).getTime() - Date.now()) / 86400000);
  if (diff < 0) return "Expired";
  if (diff === 0) return "Today!";
  if (diff === 1) return "Tomorrow!";
  return `${diff} days`;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-[var(--muted)]">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [fans, setFans] = useState<Fan[]>([]);
  const [filter, setFilter] = useState<Tag | "all">("all");
  const [selected, setSelected] = useState<Fan | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFan, setNewFan] = useState({ name: "", tag: "new" as Tag, total_spent: "", renewal_date: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const loadFans = useCallback(async () => {
    const { data } = await supabase
      .from("fans")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setFans(data);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) {
        router.push("/login");
        return;
      }
      setUser(u);
      setLoading(false);
      loadFans();
    });
  }, [router, loadFans]);

  async function handleAddFan() {
    if (!newFan.name.trim()) return;
    setSaving(true);

    const { error } = await supabase.from("fans").insert({
      creator_id: user!.id,
      name: newFan.name.trim(),
      tag: newFan.tag,
      total_spent: parseFloat(newFan.total_spent) || 0,
      renewal_date: newFan.renewal_date || null,
      notes: newFan.notes.trim(),
    });

    if (!error) {
      await loadFans();
      setNewFan({ name: "", tag: "new", total_spent: "", renewal_date: "", notes: "" });
      setShowAddModal(false);
    }
    setSaving(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function handleUpgrade() {
    const res = await fetch("/api/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[var(--muted)]">Loading...</p>
      </div>
    );
  }

  const filtered = filter === "all" ? fans : fans.filter((f) => f.tag === filter);
  const totalRevenue = fans.reduce((s, f) => s + (f.total_spent || 0), 0);
  const atRisk = fans.filter((f) => f.tag === "at-risk").length;
  const urgentRenewals = fans.filter((f) => {
    if (!f.renewal_date) return false;
    const d = Math.floor((new Date(f.renewal_date).getTime() - Date.now()) / 86400000);
    return d >= 0 && d <= 3;
  }).length;

  return (
    <div className="min-h-screen">
      {/* Top Nav */}
      <nav className="border-b border-[var(--border)] px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Creator<span className="text-brand-500">CRM</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-[var(--muted)] sm:inline">
              {user?.user_metadata?.name || user?.email}
            </span>
            <button
              onClick={handleUpgrade}
              className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 transition"
            >
              Upgrade to Pro
            </button>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white transition"
            >
              Log Out
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-[var(--muted)]">Your fan overview</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition"
          >
            + Add Fan
          </button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Total Fans" value={String(fans.length)} sub="tracked in CRM" />
          <StatCard label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} sub="lifetime from tracked fans" />
          <StatCard label="At Risk" value={String(atRisk)} sub="need attention now" />
          <StatCard label="Renewals ≤3 days" value={String(urgentRenewals)} sub="message them today" />
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-2">
          {(["all", "whale", "vip", "at-risk", "new", "regular"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                filter === t
                  ? "border-brand-500 bg-brand-500/20 text-brand-400"
                  : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--muted)]"
              }`}
            >
              {t === "all" ? "All Fans" : TAG_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Fan Table */}
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
          {fans.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-lg font-medium mb-2">No fans yet</p>
              <p className="text-sm text-[var(--muted)] mb-4">Add your first fan to start tracking</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition"
              >
                + Add Your First Fan
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                  <th className="px-4 py-3 font-medium">Fan</th>
                  <th className="px-4 py-3 font-medium">Tag</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Spent</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Last Msg</th>
                  <th className="px-4 py-3 font-medium">Renewal</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((fan) => (
                  <tr
                    key={fan.id}
                    onClick={() => setSelected(fan)}
                    className="cursor-pointer border-b border-[var(--border)] transition hover:bg-white/5"
                  >
                    <td className="px-4 py-3 font-medium">{fan.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${TAG_COLORS[fan.tag]}`}>
                        {TAG_LABELS[fan.tag]}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">${(fan.total_spent || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{daysAgo(fan.last_message_at)}</td>
                    <td className="px-4 py-3">
                      <span className={(() => {
                        if (!fan.renewal_date) return "text-[var(--muted)]";
                        const d = Math.floor((new Date(fan.renewal_date).getTime() - Date.now()) / 86400000);
                        return d <= 1 ? "text-red-400 font-semibold" : d <= 3 ? "text-amber-400" : "text-[var(--muted)]";
                      })()}>
                        {daysUntil(fan.renewal_date)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative w-full max-w-md bg-[var(--card)] border-l border-[var(--border)] p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="absolute top-4 right-4 text-[var(--muted)] hover:text-white text-lg">✕</button>
            <h2 className="text-xl font-bold mb-1">{selected.name}</h2>
            <span className={`inline-block rounded-full border px-2 py-0.5 text-xs mb-4 ${TAG_COLORS[selected.tag]}`}>
              {TAG_LABELS[selected.tag]}
            </span>
            <div className="space-y-4 mt-4">
              <div className="rounded-lg bg-white/5 p-4">
                <p className="text-xs text-[var(--muted)] mb-1">Lifetime Spent</p>
                <p className="text-lg font-bold">${(selected.total_spent || 0).toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-white/5 p-4">
                <p className="text-xs text-[var(--muted)] mb-1">Last Messaged</p>
                <p className="font-medium">{daysAgo(selected.last_message_at)}</p>
              </div>
              <div className="rounded-lg bg-white/5 p-4">
                <p className="text-xs text-[var(--muted)] mb-1">Renewal In</p>
                <p className="font-medium">{daysUntil(selected.renewal_date)}</p>
              </div>
              {selected.notes && (
                <div className="rounded-lg bg-white/5 p-4">
                  <p className="text-xs text-[var(--muted)] mb-1">Notes</p>
                  <p className="text-sm">{selected.notes}</p>
                </div>
              )}
              {selected.tag === "at-risk" && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                  <p className="text-sm font-semibold text-red-300">Action Needed</p>
                  <p className="text-xs text-red-300/80 mt-1">
                    This fan is at risk of churning. Send a personal message or exclusive offer before their renewal date.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Fan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowAddModal(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative w-full max-w-md rounded-xl bg-[var(--card)] border border-[var(--border)] p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-[var(--muted)] hover:text-white text-lg">✕</button>
            <h2 className="text-xl font-bold mb-6">Add New Fan</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Fan Name</label>
                <input
                  type="text"
                  value={newFan.name}
                  onChange={(e) => setNewFan({ ...newFan, name: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
                  placeholder="e.g. Jake M."
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Tag</label>
                <select
                  value={newFan.tag}
                  onChange={(e) => setNewFan({ ...newFan, tag: e.target.value as Tag })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
                >
                  <option value="new">New</option>
                  <option value="regular">Regular</option>
                  <option value="vip">VIP</option>
                  <option value="whale">Whale</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Total Spent ($)</label>
                <input
                  type="number"
                  value={newFan.total_spent}
                  onChange={(e) => setNewFan({ ...newFan, total_spent: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Renewal Date</label>
                <input
                  type="date"
                  value={newFan.renewal_date}
                  onChange={(e) => setNewFan({ ...newFan, renewal_date: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Notes</label>
                <textarea
                  value={newFan.notes}
                  onChange={(e) => setNewFan({ ...newFan, notes: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
                  rows={3}
                  placeholder="Preferences, interests, etc."
                />
              </div>
              <button
                onClick={handleAddFan}
                disabled={saving || !newFan.name.trim()}
                className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Add Fan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
