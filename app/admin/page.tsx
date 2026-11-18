"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Fan {
  id: string;
  name: string;
  tag: string;
  total_spent: number;
  last_message_at: string | null;
  renewal_date: string | null;
  notes: string;
}

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

interface Announcement {
  id: string;
  message: string;
  active: boolean;
  created_at: string;
}

interface Ticket {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

interface Review {
  id: string;
  rating: number;
  message: string;
  name: string | null;
  role: string | null;
  approved: boolean;
  created_at: string;
}

interface Lead {
  id: string;
  email: string;
  created_at: string;
}

interface Referral {
  id: string;
  referrer_id: string;
  referred_email: string;
  status: string;
  created_at: string;
}

interface Stats {
  total_users: number;
  pro_users: number;
  free_users: number;
  total_fans: number;
}

const TAG_COLORS: Record<string, string> = {
  whale: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  vip: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  regular: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  new: "bg-green-500/20 text-green-300 border-green-500/30",
  "at-risk": "bg-red-500/20 text-red-300 border-red-500/30",
};

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creators, setCreators] = useState<Creator[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [search, setSearch] = useState("");
  const [token, setToken] = useState("");

  // Fan drawer
  const [selectedUser, setSelectedUser] = useState<Creator | null>(null);
  const [fans, setFans] = useState<Fan[]>([]);
  const [fansLoading, setFansLoading] = useState(false);

  // Modals
  const [deleteTarget, setDeleteTarget] = useState<Creator | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [planTarget, setPlanTarget] = useState<Creator | null>(null);
  const [planChanging, setPlanChanging] = useState(false);

  // Announcements
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [announceSaving, setAnnounceSaving] = useState(false);

  // Support tickets
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketFilter, setTicketFilter] = useState<"all" | "open" | "resolved">("open");

  // Reviews & Leads
  const [reviews, setReviews] = useState<Review[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [adminReferrals, setAdminReferrals] = useState<Referral[]>([]);

  // Toast
  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  const loadData = useCallback(async (accessToken: string) => {
    const res = await fetch("/api/admin", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.status === 403) {
      const errData = await res.json();
      setError(errData.hint === "ADMIN_EMAIL env var not set"
        ? "ADMIN_EMAIL is not set on Vercel."
        : "Access denied. Admin only.");
      setLoading(false);
      return;
    }
    if (!res.ok) { setError("Failed to load."); setLoading(false); return; }
    const data = await res.json();
    setCreators(data.creators || []);
    setStats(data.stats);
    setAnnouncements(data.announcements || []);
    setTickets(data.tickets || []);
    setReviews(data.reviews || []);
    setLeads(data.leads || []);
    setAdminReferrals(data.referrals || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push("/login"); return; }
      setToken(session.access_token);
      loadData(session.access_token);
    });
  }, [router, loadData]);

  async function adminAction(body: Record<string, unknown>) {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  async function handleViewFans(c: Creator) {
    if (selectedUser?.id === c.id) { setSelectedUser(null); return; }
    setSelectedUser(c);
    setFansLoading(true);
    const data = await adminAction({ action: "get_fans", userId: c.id });
    setFans(data.fans || []);
    setFansLoading(false);
  }

  async function handleDeleteUser() {
    if (!deleteTarget) return;
    setDeleting(true);
    await adminAction({ action: "delete_user", userId: deleteTarget.id });
    setDeleting(false);
    setDeleteTarget(null);
    if (selectedUser?.id === deleteTarget.id) setSelectedUser(null);
    showToast(`Deleted ${deleteTarget.name || deleteTarget.email}`);
    loadData(token);
  }

  async function handleChangePlan() {
    if (!planTarget) return;
    setPlanChanging(true);
    const newPlan = planTarget.plan === "pro" ? "free" : "pro";
    await adminAction({ action: "change_plan", userId: planTarget.id, plan: newPlan });
    setPlanChanging(false);
    setPlanTarget(null);
    showToast(`Changed ${planTarget.name || planTarget.email} to ${newPlan}`);
    loadData(token);
  }

  async function handleSaveAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    if (!newAnnouncement.trim()) return;
    setAnnounceSaving(true);
    await adminAction({ action: "save_announcement", message: newAnnouncement });
    setAnnounceSaving(false);
    setNewAnnouncement("");
    showToast("Announcement published!");
    loadData(token);
  }

  async function handleDeleteAnnouncement(id: string) {
    await adminAction({ action: "delete_announcement", announcementId: id });
    showToast("Announcement deleted");
    loadData(token);
  }

  async function handleToggleAnnouncement(id: string, active: boolean) {
    await adminAction({ action: "toggle_announcement", announcementId: id, active });
    showToast(active ? "Announcement activated" : "Announcement hidden");
    loadData(token);
  }

  async function handleResolveTicket(id: string) {
    await adminAction({ action: "resolve_ticket", ticketId: id });
    showToast("Ticket resolved");
    loadData(token);
  }

  async function handleDeleteTicket(id: string) {
    await adminAction({ action: "delete_ticket", ticketId: id });
    showToast("Ticket deleted");
    loadData(token);
  }

  async function handleToggleReview(id: string, approved: boolean) {
    await adminAction({ action: "toggle_review", reviewId: id, approved });
    setReviews(prev => prev.map(r => r.id === id ? { ...r, approved } : r));
    showToast(approved ? "Review approved — now live on landing page" : "Review hidden from landing page");
  }

  async function handleDeleteReview(id: string) {
    await adminAction({ action: "delete_review", reviewId: id });
    setReviews(prev => prev.filter(r => r.id !== id));
    showToast("Review deleted");
  }

  function exportCSV() {
    const headers = ["Name", "Email", "Plan", "Fans", "Revenue Tracked", "Joined"];
    const rows = creators.map((c) => [
      c.name || "",
      c.email,
      c.plan,
      c.fan_count.toString(),
      c.total_revenue.toString(),
      c.created_at ? new Date(c.created_at).toLocaleDateString() : "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `creatorcrm-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV exported!");
  }

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

  const mrr = (stats?.pro_users || 0) * 29;

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
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
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

        {/* Announcements */}
        <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-lg font-semibold mb-4">Announcements</h2>
          <form onSubmit={handleSaveAnnouncement} className="flex gap-3 mb-4">
            <input
              type="text"
              value={newAnnouncement}
              onChange={(e) => setNewAnnouncement(e.target.value)}
              placeholder="Type an announcement for all users..."
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 transition"
            />
            <button type="submit" disabled={announceSaving || !newAnnouncement.trim()}
              className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50 whitespace-nowrap">
              {announceSaving ? "Sending..." : "Publish"}
            </button>
          </form>
          {announcements.length > 0 ? (
            <div className="space-y-2">
              {announcements.map((a) => (
                <div key={a.id} className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-sm ${a.active ? "border-green-500/30 bg-green-500/5" : "border-[var(--border)] opacity-50"}`}>
                  <div className="flex-1">
                    <p>{a.message}</p>
                    <p className="text-xs text-[var(--muted)] mt-1">{new Date(a.created_at).toLocaleDateString()} — {a.active ? "Active" : "Hidden"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleToggleAnnouncement(a.id, !a.active)}
                      className="rounded px-2 py-1 text-xs border border-[var(--border)] text-[var(--muted)] hover:text-white transition">
                      {a.active ? "Hide" : "Show"}
                    </button>
                    <button onClick={() => handleDeleteAnnouncement(a.id)}
                      className="rounded px-2 py-1 text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 transition">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">No announcements yet. Users will see these as a banner on their dashboard.</p>
          )}
        </div>

        {/* Support Tickets */}
        <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">Support Tickets</h2>
              {tickets.filter((t) => t.status === "open").length > 0 && (
                <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-xs font-medium text-amber-400">
                  {tickets.filter((t) => t.status === "open").length} open
                </span>
              )}
            </div>
            <div className="flex gap-1 rounded-lg border border-[var(--border)] p-0.5">
              {(["open", "all", "resolved"] as const).map((f) => (
                <button key={f} onClick={() => setTicketFilter(f)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${ticketFilter === f ? "bg-brand-500 text-white" : "text-[var(--muted)] hover:text-white"}`}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {(() => {
            const filtered = tickets.filter((t) => ticketFilter === "all" ? true : t.status === ticketFilter);
            return filtered.length > 0 ? (
              <div className="space-y-3">
                {filtered.map((t) => (
                  <div key={t.id} className={`rounded-lg border p-4 ${t.status === "open" ? "border-amber-500/30 bg-amber-500/5" : "border-[var(--border)] opacity-60"}`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${t.status === "open" ? "bg-amber-500/20 border-amber-500/30 text-amber-400" : "bg-green-500/20 border-green-500/30 text-green-400"}`}>
                            {t.status}
                          </span>
                          <span className="text-xs text-[var(--muted)]">{t.subject}</span>
                        </div>
                        <p className="text-sm font-medium">{t.name}</p>
                        <p className="text-xs text-[var(--muted)]">{t.email}</p>
                      </div>
                      <span className="text-xs text-[var(--muted)] shrink-0">
                        {new Date(t.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--muted)] mb-3 whitespace-pre-wrap">{t.message}</p>
                    <div className="flex gap-2">
                      {t.status === "open" && (
                        <button onClick={() => handleResolveTicket(t.id)}
                          className="rounded px-2.5 py-1 text-xs border border-green-500/30 text-green-400 hover:bg-green-500/10 transition">
                          Mark Resolved
                        </button>
                      )}
                      <a href={`mailto:${t.email}?subject=Re: ${encodeURIComponent(t.subject)}`}
                        className="rounded px-2.5 py-1 text-xs border border-[var(--border)] text-[var(--muted)] hover:text-white transition">
                        Reply via Email
                      </a>
                      <button onClick={() => handleDeleteTicket(t.id)}
                        className="rounded px-2.5 py-1 text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 transition">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">
                {ticketFilter === "open" ? "No open tickets. Nice!" : `No ${ticketFilter} tickets.`}
              </p>
            );
          })()}
        </div>

        {/* Reviews */}
        <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Reviews ({reviews.length})</h2>
            <span className="text-xs text-[var(--muted)]">
              {reviews.filter(r => r.approved).length} approved
            </span>
          </div>
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/50 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                      </span>
                      {r.approved && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-green-500/20 border border-green-500/30 text-green-400">
                          Live
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[var(--muted)] shrink-0">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--muted)] mb-2 whitespace-pre-wrap">{r.message}</p>
                  {(r.name || r.role) && (
                    <p className="text-xs text-[var(--muted)] mb-3">
                      — {r.name || "Anonymous"}{r.role ? `, ${r.role}` : ""}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleReview(r.id, !r.approved)}
                      className={`rounded px-2.5 py-1 text-xs border transition ${r.approved ? "border-amber-500/30 text-amber-400 hover:bg-amber-500/10" : "border-green-500/30 text-green-400 hover:bg-green-500/10"}`}
                    >
                      {r.approved ? "Hide" : "Approve"}
                    </button>
                    <button
                      onClick={() => handleDeleteReview(r.id)}
                      className="rounded px-2.5 py-1 text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">No reviews yet.</p>
          )}
        </div>

        {/* Leads */}
        <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-lg font-semibold mb-4">Leads ({leads.length})</h2>
          {leads.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--border)]">
                    <th className="pb-2 pr-4">#</th>
                    <th className="pb-2 pr-4">Email</th>
                    <th className="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l, i) => (
                    <tr key={l.id} className="border-b border-[var(--border)]/50">
                      <td className="py-2 pr-4 text-[var(--muted)]">{i + 1}</td>
                      <td className="py-2 pr-4">{l.email}</td>
                      <td className="py-2 text-[var(--muted)]">{new Date(l.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">No leads yet.</p>
          )}
        </div>

        {/* Referrals */}
        <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Referrals ({adminReferrals.length})</h2>
            <div className="flex gap-3 text-xs text-[var(--muted)]">
              <span>{adminReferrals.filter(r => r.status === "signed_up").length} signed up</span>
              <span>{adminReferrals.filter(r => r.status === "active").length} active</span>
              <span>{adminReferrals.filter(r => r.status === "subscribed").length} pro</span>
            </div>
          </div>
          {adminReferrals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--border)]">
                    <th className="pb-2 pr-4">Referred Email</th>
                    <th className="pb-2 pr-4">Referrer</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {adminReferrals.map((r) => {
                    const referrer = creators.find(c => c.id === r.referrer_id);
                    return (
                      <tr key={r.id} className="border-b border-[var(--border)]/50">
                        <td className="py-2 pr-4">{r.referred_email}</td>
                        <td className="py-2 pr-4 text-[var(--muted)]">{referrer?.email || r.referrer_id.slice(0, 8)}</td>
                        <td className="py-2 pr-4">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                            r.status === "subscribed" ? "bg-green-500/20 border-green-500/30 text-green-400" :
                            r.status === "active" ? "bg-blue-500/20 border-blue-500/30 text-blue-400" :
                            "bg-white/10 border-white/20 text-[var(--muted)]"
                          }`}>
                            {r.status === "subscribed" ? "Pro" : r.status === "active" ? "Active" : "Signed Up"}
                          </span>
                        </td>
                        <td className="py-2 text-[var(--muted)]">{new Date(r.created_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">No referrals yet.</p>
          )}
        </div>

        {/* Activity Log */}
        <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {creators.slice(0, 10).map((c) => (
              <div key={c.id} className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/20 text-brand-400 text-xs font-bold">
                  {(c.name || c.email)?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <span className="font-medium">{c.name || "Anonymous"}</span>
                  <span className="text-[var(--muted)]"> signed up</span>
                  {c.plan === "pro" && <span className="text-brand-400"> and upgraded to Pro</span>}
                </div>
                <span className="text-xs text-[var(--muted)]">
                  {c.created_at ? new Date(c.created_at).toLocaleDateString() : ""}
                </span>
              </div>
            ))}
            {creators.length === 0 && (
              <p className="text-sm text-[var(--muted)]">No activity yet.</p>
            )}
          </div>
        </div>

        {/* Users table */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          <div className="border-b border-[var(--border)] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-semibold">All Users ({filtered.length})</h2>
            <div className="flex gap-3">
              <input
                type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-48 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-white outline-none focus:border-brand-500 transition"
              />
              <button onClick={exportCSV}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] hover:text-white transition whitespace-nowrap">
                Export CSV
              </button>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium text-right">Fans</th>
                  <th className="px-4 py-3 font-medium text-right">Revenue</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <>
                    <tr key={c.id} className={`border-b border-[var(--border)] hover:bg-white/[0.02] transition cursor-pointer ${selectedUser?.id === c.id ? "bg-white/[0.03]" : ""}`}
                      onClick={() => handleViewFans(c)}>
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
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setPlanTarget(c)}
                            className="rounded px-2 py-1 text-xs border border-[var(--border)] text-[var(--muted)] hover:text-white transition">
                            {c.plan === "pro" ? "Downgrade" : "Upgrade"}
                          </button>
                          <button onClick={() => setDeleteTarget(c)}
                            className="rounded px-2 py-1 text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 transition">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {selectedUser?.id === c.id && (
                      <tr key={`${c.id}-fans`}>
                        <td colSpan={6} className="bg-[var(--bg)] border-b border-[var(--border)]">
                          <div className="p-4">
                            <h3 className="text-sm font-semibold mb-3">{c.name || c.email}&apos;s Fans ({fans.length})</h3>
                            {fansLoading ? (
                              <div className="flex justify-center py-4">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                              </div>
                            ) : fans.length === 0 ? (
                              <p className="text-sm text-[var(--muted)] py-2">No fans yet.</p>
                            ) : (
                              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                                {fans.map((f) => (
                                  <div key={f.id} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium text-sm">{f.name}</span>
                                      <span className={`rounded-full border px-2 py-0.5 text-[10px] ${TAG_COLORS[f.tag] || TAG_COLORS.new}`}>{f.tag}</span>
                                    </div>
                                    <p className="text-xs text-[var(--muted)]">
                                      ${f.total_spent.toLocaleString()} spent
                                      {f.notes && ` · ${f.notes.slice(0, 40)}${f.notes.length > 40 ? "..." : ""}`}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[var(--muted)]">
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
              <div key={c.id}>
                <div className="p-4 space-y-2 cursor-pointer" onClick={() => handleViewFans(c)}>
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
                    <span>${c.total_revenue.toLocaleString()}</span>
                    <span>{c.created_at ? new Date(c.created_at).toLocaleDateString() : ""}</span>
                  </div>
                  <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setPlanTarget(c)}
                      className="rounded px-2 py-1 text-xs border border-[var(--border)] text-[var(--muted)] hover:text-white transition">
                      {c.plan === "pro" ? "Downgrade" : "Upgrade"}
                    </button>
                    <button onClick={() => setDeleteTarget(c)}
                      className="rounded px-2 py-1 text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 transition">
                      Delete
                    </button>
                  </div>
                </div>
                {selectedUser?.id === c.id && (
                  <div className="bg-[var(--bg)] border-t border-[var(--border)] p-4">
                    <h3 className="text-sm font-semibold mb-3">{c.name || c.email}&apos;s Fans ({fans.length})</h3>
                    {fansLoading ? (
                      <div className="flex justify-center py-4">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                      </div>
                    ) : fans.length === 0 ? (
                      <p className="text-sm text-[var(--muted)]">No fans yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {fans.map((f) => (
                          <div key={f.id} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{f.name}</span>
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] ${TAG_COLORS[f.tag] || TAG_COLORS.new}`}>{f.tag}</span>
                            </div>
                            <p className="text-xs text-[var(--muted)]">${f.total_spent.toLocaleString()} spent</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--card)] p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Delete User</h3>
            <p className="text-sm text-[var(--muted)] mb-1">
              Are you sure you want to delete <strong>{deleteTarget.name || deleteTarget.email}</strong>?
            </p>
            <p className="text-sm text-red-400 mb-4">
              This will permanently delete their account, all their fans, and all their data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 rounded-lg border border-[var(--border)] py-2.5 text-sm text-[var(--muted)] hover:text-white transition">
                Cancel
              </button>
              <button onClick={handleDeleteUser} disabled={deleting}
                className="flex-1 rounded-lg bg-red-500 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition disabled:opacity-50">
                {deleting ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Change Modal */}
      {planTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setPlanTarget(null)}>
          <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--card)] p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">
              {planTarget.plan === "pro" ? "Downgrade" : "Upgrade"} User
            </h3>
            <p className="text-sm text-[var(--muted)] mb-4">
              {planTarget.plan === "pro"
                ? `Downgrade ${planTarget.name || planTarget.email} from Pro to Free? They'll lose access to Pro features.`
                : `Upgrade ${planTarget.name || planTarget.email} from Free to Pro? They'll get unlimited fans and all Pro features.`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setPlanTarget(null)} className="flex-1 rounded-lg border border-[var(--border)] py-2.5 text-sm text-[var(--muted)] hover:text-white transition">
                Cancel
              </button>
              <button onClick={handleChangePlan} disabled={planChanging}
                className="flex-1 rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50">
                {planChanging ? "Changing..." : (planTarget.plan === "pro" ? "Downgrade to Free" : "Upgrade to Pro")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-[slideUp_0.3s_ease] rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm text-green-300 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
