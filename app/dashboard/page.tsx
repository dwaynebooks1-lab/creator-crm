"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, User } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const FREE_FAN_LIMIT = 25;

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

type Creator = {
  id: string;
  plan: "free" | "pro";
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

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
      <p className="text-xs sm:text-sm text-[var(--muted)]">{label}</p>
      <p className={`mt-1 text-xl sm:text-2xl font-bold ${accent || ""}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-[var(--muted)]">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [fans, setFans] = useState<Fan[]>([]);
  const [filter, setFilter] = useState<Tag | "all">("all");
  const [selected, setSelected] = useState<Fan | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFan, setEditingFan] = useState<Fan | null>(null);
  const [fanForm, setFanForm] = useState({ name: "", tag: "new" as Tag, total_spent: "", renewal_date: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Fan | null>(null);

  const plan = creator?.plan || "free";
  const isPro = plan === "pro";
  const atLimit = !isPro && fans.length >= FREE_FAN_LIMIT;

  const loadFans = useCallback(async () => {
    const { data } = await supabase
      .from("fans")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setFans(data);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) {
        router.push("/login");
        return;
      }
      setUser(u);

      const { data: existing } = await supabase
        .from("creators")
        .select("id, plan")
        .eq("id", u.id)
        .single();

      if (existing) {
        setCreator(existing as Creator);
      } else {
        await supabase.from("creators").insert({
          id: u.id,
          email: u.email,
          name: u.user_metadata?.name || null,
        });
        setCreator({ id: u.id, plan: "free" });
      }

      setLoading(false);
      loadFans();
    });
  }, [router, loadFans]);

  function openAddModal() {
    if (atLimit) return;
    setEditingFan(null);
    setFanForm({ name: "", tag: "new", total_spent: "", renewal_date: "", notes: "" });
    setFormError("");
    setShowAddModal(true);
  }

  function openEditModal(fan: Fan) {
    setEditingFan(fan);
    setFanForm({
      name: fan.name,
      tag: fan.tag,
      total_spent: String(fan.total_spent || 0),
      renewal_date: fan.renewal_date ? fan.renewal_date.split("T")[0] : "",
      notes: fan.notes || "",
    });
    setFormError("");
    setSelected(null);
    setShowAddModal(true);
  }

  async function handleSaveFan() {
    if (!fanForm.name.trim()) return;
    setSaving(true);
    setFormError("");

    const payload = {
      name: fanForm.name.trim(),
      tag: fanForm.tag,
      total_spent: parseFloat(fanForm.total_spent) || 0,
      renewal_date: fanForm.renewal_date || null,
      notes: fanForm.notes.trim(),
    };

    let error;

    if (editingFan) {
      ({ error } = await supabase.from("fans").update(payload).eq("id", editingFan.id));
    } else {
      ({ error } = await supabase.from("fans").insert({ ...payload, creator_id: user!.id }));
    }

    if (error) {
      setFormError(error.message);
      setSaving(false);
      return;
    }

    await loadFans();
    setShowAddModal(false);
    setSaving(false);
  }

  async function handleDeleteFan(fan: Fan) {
    const { error } = await supabase.from("fans").delete().eq("id", fan.id);
    if (!error) {
      await loadFans();
      setSelected(null);
      setConfirmDelete(null);
    }
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
        <div className="text-center">
          <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="text-[var(--muted)]">Loading your dashboard...</p>
        </div>
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
    <div className="min-h-screen pb-20">
      {/* Top Nav */}
      <nav className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Creator<span className="text-brand-500">CRM</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden text-sm text-[var(--muted)] md:inline">
              {user?.user_metadata?.name || user?.email}
            </span>
            {isPro ? (
              <span className="rounded-full bg-brand-500/20 border border-brand-500/30 px-2.5 py-1 text-xs font-medium text-brand-400">
                Pro
              </span>
            ) : (
              <button
                onClick={handleUpgrade}
                className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 transition"
              >
                Upgrade to Pro
              </button>
            )}
            <button
              onClick={handleLogout}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white transition"
            >
              Log Out
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        {/* Plan Banner */}
        {!isPro && fans.length > 0 && (
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-brand-500/30 bg-brand-500/5 p-4">
            <div>
              <p className="text-sm font-medium">
                Free Plan — {fans.length}/{FREE_FAN_LIMIT} fans used
              </p>
              <div className="mt-1.5 h-1.5 w-48 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all"
                  style={{ width: `${Math.min(100, (fans.length / FREE_FAN_LIMIT) * 100)}%` }}
                />
              </div>
            </div>
            <button
              onClick={handleUpgrade}
              className="rounded-lg bg-brand-500 px-4 py-2 text-xs font-medium text-white hover:bg-brand-600 transition whitespace-nowrap"
            >
              Upgrade for Unlimited Fans — $49/mo
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-6 sm:mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
            <p className="text-xs sm:text-sm text-[var(--muted)]">Your fan overview</p>
          </div>
          <button
            onClick={openAddModal}
            disabled={atLimit}
            className="rounded-lg bg-brand-500 px-3 sm:px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title={atLimit ? `Free plan limit reached (${FREE_FAN_LIMIT} fans). Upgrade to Pro for unlimited.` : undefined}
          >
            + Add Fan
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 sm:mb-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          <StatCard label="Total Fans" value={String(fans.length)} sub={isPro ? "unlimited" : `of ${FREE_FAN_LIMIT} free`} />
          <StatCard label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} sub="lifetime tracked" />
          <StatCard label="At Risk" value={String(atRisk)} sub="need attention" accent={atRisk > 0 ? "text-red-400" : ""} />
          <StatCard label="Renewals ≤3d" value={String(urgentRenewals)} sub="message today" accent={urgentRenewals > 0 ? "text-amber-400" : ""} />
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
              {t === "all" ? `All (${fans.length})` : `${TAG_LABELS[t]} (${fans.filter(f => f.tag === t).length})`}
            </button>
          ))}
        </div>

        {/* Fan Table */}
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
          {fans.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mb-4 text-5xl">👥</div>
              <p className="text-lg font-medium mb-2">No fans yet</p>
              <p className="text-sm text-[var(--muted)] mb-6">Add your first fan to start tracking revenue, renewals, and engagement.</p>
              <button
                onClick={openAddModal}
                className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition"
              >
                + Add Your First Fan
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-[var(--muted)]">No fans match this filter.</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="sm:hidden divide-y divide-[var(--border)]">
                {filtered.map((fan) => (
                  <div
                    key={fan.id}
                    onClick={() => setSelected(fan)}
                    className="cursor-pointer p-4 transition hover:bg-white/5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{fan.name}</span>
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${TAG_COLORS[fan.tag]}`}>
                        {TAG_LABELS[fan.tag]}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
                      <span>${(fan.total_spent || 0).toLocaleString()}</span>
                      <span>Renewal: {daysUntil(fan.renewal_date)}</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop Table View */}
              <table className="hidden sm:table w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                    <th className="px-4 py-3 font-medium">Fan</th>
                    <th className="px-4 py-3 font-medium">Tag</th>
                    <th className="px-4 py-3 font-medium">Spent</th>
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
                      <td className="px-4 py-3">${(fan.total_spent || 0).toLocaleString()}</td>
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
            </>
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
              {/* Edit & Delete */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => openEditModal(selected)}
                  className="flex-1 rounded-lg border border-[var(--border)] py-2 text-sm font-medium text-[var(--muted)] hover:text-white hover:border-white/30 transition"
                >
                  Edit Fan
                </button>
                <button
                  onClick={() => setConfirmDelete(selected)}
                  className="flex-1 rounded-lg border border-red-500/30 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setConfirmDelete(null)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-sm rounded-xl bg-[var(--card)] border border-[var(--border)] p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-lg font-bold mb-2">Delete {confirmDelete.name}?</p>
            <p className="text-sm text-[var(--muted)] mb-6">This can&apos;t be undone. All data for this fan will be removed.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-lg border border-[var(--border)] py-2.5 text-sm font-medium text-[var(--muted)] hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteFan(confirmDelete)}
                className="flex-1 rounded-lg bg-red-500 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition"
              >
                Delete Fan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Fan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setShowAddModal(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative w-full max-w-md rounded-xl bg-[var(--card)] border border-[var(--border)] p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-[var(--muted)] hover:text-white text-lg">✕</button>
            <h2 className="text-xl font-bold mb-6">{editingFan ? "Edit Fan" : "Add New Fan"}</h2>
            <div className="space-y-4">
              {formError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Fan Name</label>
                <input
                  type="text"
                  value={fanForm.name}
                  onChange={(e) => setFanForm({ ...fanForm, name: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 transition"
                  placeholder="e.g. Jake M."
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Tag</label>
                <select
                  value={fanForm.tag}
                  onChange={(e) => setFanForm({ ...fanForm, tag: e.target.value as Tag })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 transition"
                >
                  <option value="new">New</option>
                  <option value="regular">Regular</option>
                  <option value="vip">VIP</option>
                  <option value="whale">Whale</option>
                  <option value="at-risk">At Risk</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Total Spent ($)</label>
                <input
                  type="number"
                  value={fanForm.total_spent}
                  onChange={(e) => setFanForm({ ...fanForm, total_spent: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 transition"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Renewal Date</label>
                <input
                  type="date"
                  value={fanForm.renewal_date}
                  onChange={(e) => setFanForm({ ...fanForm, renewal_date: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Notes</label>
                <textarea
                  value={fanForm.notes}
                  onChange={(e) => setFanForm({ ...fanForm, notes: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 transition"
                  rows={3}
                  placeholder="Preferences, interests, etc."
                />
              </div>
              <button
                onClick={handleSaveFan}
                disabled={saving || !fanForm.name.trim()}
                className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50"
              >
                {saving ? "Saving..." : editingFan ? "Save Changes" : "Add Fan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
