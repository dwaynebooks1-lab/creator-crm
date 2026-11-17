"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, User } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const FREE_FAN_LIMIT = 25;

type Tag = "whale" | "vip" | "regular" | "new" | "at-risk";
type SortKey = "name" | "total_spent" | "renewal_date" | "last_message_at" | "tag";
type SortDir = "asc" | "desc";

type Fan = {
  id: string;
  name: string;
  tag: Tag;
  total_spent: number;
  last_message_at: string | null;
  renewal_date: string | null;
  notes: string;
};

type Creator = { id: string; plan: "free" | "pro" };

const TAG_COLORS: Record<Tag, string> = {
  whale: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  vip: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  regular: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  new: "bg-green-500/20 text-green-300 border-green-500/30",
  "at-risk": "bg-red-500/20 text-red-300 border-red-500/30",
};

const TAG_LABELS: Record<Tag, string> = {
  whale: "Whale", vip: "VIP", regular: "Regular", new: "New", "at-risk": "At Risk",
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

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 animate-[slideUp_0.3s_ease-out]">
      <div className="rounded-lg border border-green-500/30 bg-green-500/10 backdrop-blur-sm px-5 py-3 text-sm text-green-300 shadow-lg">
        {message}
      </div>
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
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selected, setSelected] = useState<Fan | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFan, setEditingFan] = useState<Fan | null>(null);
  const [fanForm, setFanForm] = useState({ name: "", tag: "new" as Tag, total_spent: "", renewal_date: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Fan | null>(null);
  const [toast, setToast] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<Array<{ name: string; tag: Tag; total_spent: number; notes: string }>>([]);

  const [announcement, setAnnouncement] = useState("");

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
      if (!u) { router.push("/login"); return; }
      setUser(u);

      const { data: existing } = await supabase
        .from("creators").select("id, plan").eq("id", u.id).single();

      if (existing) {
        setCreator(existing as Creator);
      } else {
        await supabase.from("creators").insert({ id: u.id, email: u.email, name: u.user_metadata?.name || null });
        setCreator({ id: u.id, plan: "free" });

        // Seed demo fans for new users
        const today = new Date();
        const demoFans = [
          { creator_id: u.id, name: "Alex T. (demo)", tag: "whale", total_spent: 2340, renewal_date: new Date(today.getTime() + 12 * 86400000).toISOString(), notes: "Top tipper. Loves exclusive content. Demo fan — delete anytime." },
          { creator_id: u.id, name: "Sam K. (demo)", tag: "vip", total_spent: 890, renewal_date: new Date(today.getTime() + 5 * 86400000).toISOString(), notes: "Loyal subscriber. Demo fan — delete anytime." },
          { creator_id: u.id, name: "Jordan P. (demo)", tag: "at-risk", total_spent: 60, renewal_date: new Date(today.getTime() + 1 * 86400000).toISOString(), notes: "No engagement in 10 days. Renewal tomorrow! Demo fan — delete anytime." },
          { creator_id: u.id, name: "Riley N. (demo)", tag: "new", total_spent: 15, renewal_date: new Date(today.getTime() + 28 * 86400000).toISOString(), notes: "Just subscribed. Demo fan — delete anytime." },
        ];
        await supabase.from("fans").insert(demoFans);
      }

      setLoading(false);
      loadFans();

      // Load active announcement
      const { data: ann } = await supabase
        .from("announcements")
        .select("message")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1);
      if (ann?.[0]) setAnnouncement(ann[0].message);
    });
  }, [router, loadFans]);

  const filtered = useMemo(() => {
    let list = fans;
    if (filter !== "all") list = list.filter((f) => f.tag === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q));
    }
    list = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "total_spent": cmp = (a.total_spent || 0) - (b.total_spent || 0); break;
        case "renewal_date": cmp = (a.renewal_date || "z").localeCompare(b.renewal_date || "z"); break;
        case "last_message_at": cmp = (a.last_message_at || "").localeCompare(b.last_message_at || ""); break;
        case "tag": cmp = a.tag.localeCompare(b.tag); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [fans, filter, search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir(key === "total_spent" ? "desc" : "asc"); }
  }

  function sortIcon(key: SortKey) {
    if (sortKey !== key) return "↕";
    return sortDir === "asc" ? "↑" : "↓";
  }

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
      name: fan.name, tag: fan.tag,
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
      name: fanForm.name.trim(), tag: fanForm.tag,
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

    if (error) { setFormError(error.message); setSaving(false); return; }

    await loadFans();
    setShowAddModal(false);
    setSaving(false);
    setToast(editingFan ? `${fanForm.name.trim()} updated!` : `${fanForm.name.trim()} added!`);
  }

  async function handleDeleteFan(fan: Fan) {
    const { error } = await supabase.from("fans").delete().eq("id", fan.id);
    if (!error) {
      await loadFans();
      setSelected(null);
      setConfirmDelete(null);
      setToast(`${fan.name} deleted`);
    }
  }

  function exportCSV() {
    const headers = ["Name", "Tag", "Total Spent", "Last Message", "Renewal Date", "Notes"];
    const rows = fans.map((f) => [
      f.name, TAG_LABELS[f.tag], String(f.total_spent || 0),
      f.last_message_at || "", f.renewal_date || "", `"${(f.notes || "").replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fans-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToast("Fans exported to CSV!");
  }

  function handleCSVFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) return;

      const headers = lines[0].toLowerCase().split(",").map((h) => h.trim().replace(/"/g, ""));
      const nameIdx = headers.findIndex((h) => h === "name" || h === "fan" || h === "fan name");
      const tagIdx = headers.findIndex((h) => h === "tag" || h === "category" || h === "type");
      const spentIdx = headers.findIndex((h) => h.includes("spent") || h.includes("revenue") || h.includes("amount"));
      const notesIdx = headers.findIndex((h) => h === "notes" || h === "note" || h === "comments");

      if (nameIdx === -1) { setFormError("CSV must have a 'Name' column"); return; }

      const validTags = ["whale", "vip", "regular", "new", "at-risk"];
      const rows = lines.slice(1).map((line) => {
        const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        const rawTag = tagIdx >= 0 ? cols[tagIdx]?.toLowerCase().replace(/\s+/g, "-") : "new";
        return {
          name: cols[nameIdx] || "",
          tag: (validTags.includes(rawTag) ? rawTag : "new") as Tag,
          total_spent: spentIdx >= 0 ? parseFloat(cols[spentIdx]?.replace(/[$,]/g, "")) || 0 : 0,
          notes: notesIdx >= 0 ? cols[notesIdx] || "" : "",
        };
      }).filter((r) => r.name.trim());

      setImportPreview(rows);
      setShowImportModal(true);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleImportConfirm() {
    if (!importPreview.length) return;
    setImporting(true);

    const remaining = isPro ? Infinity : FREE_FAN_LIMIT - fans.length;
    const toImport = importPreview.slice(0, remaining);

    const { error } = await supabase.from("fans").insert(
      toImport.map((f) => ({ creator_id: user!.id, name: f.name, tag: f.tag, total_spent: f.total_spent, notes: f.notes }))
    );

    if (!error) {
      await loadFans();
      setShowImportModal(false);
      setImportPreview([]);
      const skipped = importPreview.length - toImport.length;
      setToast(`${toImport.length} fans imported!${skipped > 0 ? ` (${skipped} skipped — upgrade to Pro for unlimited)` : ""}`);
    } else {
      setFormError(error.message);
    }
    setImporting(false);
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

  const [showTemplates, setShowTemplates] = useState(false);
  const [copiedId, setCopiedId] = useState("");

  const totalRevenue = fans.reduce((s, f) => s + (f.total_spent || 0), 0);
  const atRisk = fans.filter((f) => f.tag === "at-risk").length;
  const urgentRenewals = fans.filter((f) => {
    if (!f.renewal_date) return false;
    const d = Math.floor((new Date(f.renewal_date).getTime() - Date.now()) / 86400000);
    return d >= 0 && d <= 3;
  }).length;
  const avgSpend = fans.length > 0 ? totalRevenue / fans.length : 0;

  // Churn risk score (0-100)
  function churnScore(fan: Fan): number {
    let score = 0;
    // Last message recency
    if (fan.last_message_at) {
      const daysSince = Math.floor((Date.now() - new Date(fan.last_message_at).getTime()) / 86400000);
      if (daysSince > 14) score += 35;
      else if (daysSince > 7) score += 25;
      else if (daysSince > 3) score += 10;
    } else { score += 20; }
    // Tag
    if (fan.tag === "at-risk") score += 30;
    else if (fan.tag === "new") score += 10;
    // Spending
    if (fan.total_spent < 20) score += 15;
    else if (fan.total_spent < 50) score += 5;
    // Renewal urgency
    if (fan.renewal_date) {
      const daysUntilRenewal = Math.floor((new Date(fan.renewal_date).getTime() - Date.now()) / 86400000);
      if (daysUntilRenewal <= 1) score += 20;
      else if (daysUntilRenewal <= 3) score += 10;
    }
    return Math.min(100, score);
  }

  function churnLabel(score: number): { text: string; color: string } {
    if (score >= 60) return { text: "High Risk", color: "text-red-400" };
    if (score >= 35) return { text: "Medium", color: "text-amber-400" };
    return { text: "Low Risk", color: "text-green-400" };
  }

  // Action items — fans that need attention now
  const actionItems = useMemo(() => {
    const items: { fan: Fan; reason: string; message: string; priority: number }[] = [];
    fans.forEach((f) => {
      // Renewal within 3 days
      if (f.renewal_date) {
        const d = Math.floor((new Date(f.renewal_date).getTime() - Date.now()) / 86400000);
        if (d >= 0 && d <= 1) {
          items.push({ fan: f, reason: "Renews tomorrow!", message: `Hey ${f.name.split(" ")[0]}! Just wanted to check in and see how you're doing. I've got some amazing content coming soon and I'd love for you to stick around! 💕`, priority: 1 });
        } else if (d > 1 && d <= 3) {
          items.push({ fan: f, reason: `Renews in ${d} days`, message: `Hi ${f.name.split(" ")[0]}! Your renewal is coming up soon. I appreciate you so much! Is there anything special you'd like to see? Let me know 😊`, priority: 2 });
        }
      }
      // At-risk fans
      if (f.tag === "at-risk" && !items.find(i => i.fan.id === f.id)) {
        items.push({ fan: f, reason: "At risk of leaving", message: `Hey ${f.name.split(" ")[0]}! I noticed we haven't chatted in a while. I miss talking to you! I've got something special coming up that I think you'll love 💖`, priority: 3 });
      }
      // Inactive fans (no message in 7+ days)
      if (f.last_message_at) {
        const daysSince = Math.floor((Date.now() - new Date(f.last_message_at).getTime()) / 86400000);
        if (daysSince >= 7 && !items.find(i => i.fan.id === f.id)) {
          items.push({ fan: f, reason: `No contact in ${daysSince}d`, message: `Hi ${f.name.split(" ")[0]}! It's been a minute since we last chatted. How are you? I'd love to catch up! 😊`, priority: 4 });
        }
      }
      // Whales that haven't been messaged recently
      if (f.tag === "whale" && f.last_message_at) {
        const daysSince = Math.floor((Date.now() - new Date(f.last_message_at).getTime()) / 86400000);
        if (daysSince >= 3 && !items.find(i => i.fan.id === f.id)) {
          items.push({ fan: f, reason: "VIP — keep engaged", message: `Hey ${f.name.split(" ")[0]}! You're one of my absolute favorites. I wanted to send you something exclusive just for you. Check your DMs tonight 😉💕`, priority: 5 });
        }
      }
    });
    return items.sort((a, b) => a.priority - b.priority).slice(0, 8);
  }, [fans]);

  const revenueAtRisk = fans.filter(f => churnScore(f) >= 60).reduce((s, f) => s + (f.total_spent || 0), 0);

  function copyMessage(id: string, msg: string) {
    navigator.clipboard.writeText(msg);
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 2000);
  }

  const MESSAGE_TEMPLATES = [
    { id: "welcome", cat: "Welcome", title: "New Subscriber Welcome", msg: "Hey! Welcome to my page! 🎉 I'm so happy you're here. Feel free to DM me anytime — I love getting to know my subscribers. Any special requests? I'm all ears! 💕" },
    { id: "renewal", cat: "Retention", title: "Renewal Reminder", msg: "Hey babe! Just wanted to let you know your renewal is coming up soon. I've got some amazing new content dropping this week that I think you'll LOVE. Can't wait for you to see it! 😘" },
    { id: "winback", cat: "Win-back", title: "Win Back Lapsed Fan", msg: "Hey! I noticed you've been away for a bit and I just wanted to say I miss you! 💔 I've been posting a lot of new content and I think you'd really enjoy it. Come back and check it out? 😊" },
    { id: "whale", cat: "VIP", title: "Whale Appreciation", msg: "I just wanted to take a moment to tell you how much I appreciate your support. You're one of my top supporters and it means the world to me! 💖 Is there anything special you'd like? You deserve it! ✨" },
    { id: "inactive", cat: "Re-engage", title: "Re-engage Inactive Fan", msg: "Hey! It's been a while since we last chatted and I wanted to check in on you. How are you doing? I've been working on some exciting new stuff and would love to hear what you think! 😊" },
    { id: "upsell", cat: "Upsell", title: "Custom Content Offer", msg: "Hey! I'm doing something special this week — custom content for my favorite subscribers. Since you're one of my most loyal fans, I wanted to offer it to you first before anyone else. Interested? 💫" },
    { id: "thankyou", cat: "Appreciation", title: "Thank You / Milestone", msg: "I just wanted to say THANK YOU! 🙏 Your support means everything to me. Because of fans like you, I get to do what I love every day. You're amazing and I appreciate you so much! 💖" },
    { id: "checkin", cat: "General", title: "Casual Check-in", msg: "Hey! Just thinking about you and wanted to say hi! 😊 How's your day going? Anything exciting happening? I love hearing from you!" },
  ];

  return (
    <div className="min-h-screen pb-20">
      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast("")} />}

      {/* Top Nav */}
      <nav className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Creator<span className="text-brand-500">CRM</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden text-sm text-[var(--muted)] md:inline">
              {user?.user_metadata?.name || user?.email}
            </span>
            {isPro ? (
              <span className="rounded-full bg-brand-500/20 border border-brand-500/30 px-2.5 py-1 text-xs font-medium text-brand-400">
                Pro
              </span>
            ) : (
              <button onClick={handleUpgrade} className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 transition">
                Upgrade
              </button>
            )}
            <Link href="/settings" className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white transition">
              Settings
            </Link>
            <button onClick={handleLogout} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white transition">
              Log Out
            </button>
          </div>
        </div>
      </nav>

      {/* Announcement Banner */}
      {announcement && (
        <div className="border-b border-brand-500/30 bg-brand-500/10 px-4 py-3">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <p className="text-sm text-brand-300">
              <span className="font-semibold mr-2">Announcement:</span>{announcement}
            </p>
            <button onClick={() => setAnnouncement("")} className="text-brand-400 hover:text-white transition text-lg leading-none">&times;</button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        {/* Plan Banner */}
        {!isPro && fans.length > 0 && (
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-brand-500/30 bg-brand-500/5 p-4">
            <div>
              <p className="text-sm font-medium">Free Plan — {fans.length}/{FREE_FAN_LIMIT} fans used</p>
              <div className="mt-1.5 h-1.5 w-48 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${Math.min(100, (fans.length / FREE_FAN_LIMIT) * 100)}%` }} />
              </div>
            </div>
            <button onClick={handleUpgrade} className="rounded-lg bg-brand-500 px-4 py-2 text-xs font-medium text-white hover:bg-brand-600 transition whitespace-nowrap">
              Upgrade for Unlimited — $29/mo
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-6 sm:mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
            <p className="text-xs sm:text-sm text-[var(--muted)]">Your fan overview</p>
          </div>
          <div className="flex gap-2">
            <label className="rounded-lg border border-[var(--border)] px-3 sm:px-4 py-2 text-sm text-[var(--muted)] hover:text-white transition cursor-pointer">
              Import CSV
              <input type="file" accept=".csv" onChange={handleCSVFile} className="hidden" />
            </label>
            {fans.length > 0 && (
              <button onClick={exportCSV} className="rounded-lg border border-[var(--border)] px-3 sm:px-4 py-2 text-sm text-[var(--muted)] hover:text-white transition">
                Export
              </button>
            )}
            <button
              onClick={openAddModal} disabled={atLimit}
              className="rounded-lg bg-brand-500 px-3 sm:px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              title={atLimit ? `Free plan limit reached (${FREE_FAN_LIMIT} fans)` : undefined}
            >
              + Add Fan
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 sm:mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          <StatCard label="Total Fans" value={String(fans.length)} sub={isPro ? "unlimited" : `of ${FREE_FAN_LIMIT} free`} />
          <StatCard label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} sub="lifetime tracked" />
          <StatCard label="Avg per Fan" value={`$${Math.round(avgSpend).toLocaleString()}`} sub="avg lifetime value" />
          <StatCard label="At Risk" value={String(atRisk)} sub="need attention" accent={atRisk > 0 ? "text-red-400" : ""} />
          <StatCard label="Renewals ≤3d" value={String(urgentRenewals)} sub="message today" accent={urgentRenewals > 0 ? "text-amber-400" : ""} />
        </div>

        {/* Action Center */}
        {actionItems.length > 0 && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <h3 className="text-sm font-semibold">Action Center — {actionItems.length} fan{actionItems.length !== 1 ? "s" : ""} need attention</h3>
              </div>
              <button onClick={() => setShowTemplates(true)} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white transition">
                Message Templates
              </button>
            </div>
            <div className="space-y-2">
              {actionItems.map((item) => {
                const cs = churnScore(item.fan);
                const cl = churnLabel(cs);
                return (
                  <div key={item.fan.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`hidden sm:flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${TAG_COLORS[item.fan.tag]}`}>
                        {item.fan.name[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{item.fan.name}</p>
                          <span className={`text-[10px] ${cl.color}`}>{cl.text}</span>
                        </div>
                        <p className="text-xs text-amber-400">{item.reason}</p>
                      </div>
                    </div>
                    <button onClick={() => copyMessage(item.fan.id, item.message)}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${copiedId === item.fan.id ? "bg-green-500/20 text-green-300 border border-green-500/30" : "bg-brand-500 text-white hover:bg-brand-600"}`}>
                      {copiedId === item.fan.id ? "Copied!" : "Copy Message"}
                    </button>
                  </div>
                );
              })}
            </div>
            {revenueAtRisk > 0 && (
              <p className="mt-3 text-xs text-red-400">⚠ ${revenueAtRisk.toLocaleString()} in revenue from high-risk fans</p>
            )}
          </div>
        )}

        {/* Retention Stats */}
        {fans.length >= 3 && (
          <div className="mb-6 grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-xs text-[var(--muted)] mb-1">Fans at Risk</p>
              <p className={`text-xl font-bold ${fans.filter(f => churnScore(f) >= 60).length > 0 ? "text-red-400" : "text-green-400"}`}>
                {fans.filter(f => churnScore(f) >= 60).length}
              </p>
              <p className="text-xs text-[var(--muted)]">churn score 60+</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-xs text-[var(--muted)] mb-1">Revenue at Risk</p>
              <p className="text-xl font-bold text-red-400">${revenueAtRisk.toLocaleString()}</p>
              <p className="text-xs text-[var(--muted)]">from high-risk fans</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-xs text-[var(--muted)] mb-1">Healthy Fans</p>
              <p className="text-xl font-bold text-green-400">{fans.filter(f => churnScore(f) < 35).length}</p>
              <p className="text-xs text-[var(--muted)]">low churn risk</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-xs text-[var(--muted)] mb-1">Retention Rate</p>
              <p className="text-xl font-bold">{fans.length > 0 ? Math.round((fans.filter(f => churnScore(f) < 60).length / fans.length) * 100) : 100}%</p>
              <p className="text-xs text-[var(--muted)]">fans below risk threshold</p>
            </div>
          </div>
        )}

        {/* Insights */}
        {fans.length >= 3 && (
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            {(() => {
              const topFan = [...fans].sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))[0];
              const tagCounts = fans.reduce((acc, f) => { acc[f.tag] = (acc[f.tag] || 0) + 1; return acc; }, {} as Record<string, number>);
              const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0];
              const recentFan = [...fans].filter(f => f.last_message_at).sort((a, b) => (b.last_message_at || "").localeCompare(a.last_message_at || ""))[0];
              return (
                <>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                    <p className="text-xs text-[var(--muted)] mb-1">Top Earner</p>
                    <p className="font-semibold">{topFan.name}</p>
                    <p className="text-sm text-brand-400">${(topFan.total_spent || 0).toLocaleString()} lifetime</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                    <p className="text-xs text-[var(--muted)] mb-1">Most Common Tag</p>
                    <p className="font-semibold">{TAG_LABELS[topTag[0] as Tag] || topTag[0]}</p>
                    <p className="text-sm text-[var(--muted)]">{topTag[1]} fans ({Math.round((topTag[1] / fans.length) * 100)}%)</p>
                  </div>
                  {recentFan && (
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                      <p className="text-xs text-[var(--muted)] mb-1">Most Recent Contact</p>
                      <p className="font-semibold">{recentFan.name}</p>
                      <p className="text-sm text-[var(--muted)]">{daysAgo(recentFan.last_message_at)}</p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Revenue by Tag Chart */}
        {fans.length >= 2 && (() => {
          const tagRevenue: Record<string, number> = {};
          fans.forEach((f) => { tagRevenue[f.tag] = (tagRevenue[f.tag] || 0) + (f.total_spent || 0); });
          const entries = Object.entries(tagRevenue).sort((a, b) => b[1] - a[1]);
          const max = Math.max(...entries.map((e) => e[1]), 1);
          const TAG_BAR_COLORS: Record<string, string> = {
            whale: "bg-purple-500", vip: "bg-amber-500", regular: "bg-blue-500", new: "bg-green-500", "at-risk": "bg-red-500",
          };
          return (
            <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <h3 className="text-sm font-semibold mb-4">Revenue by Tag</h3>
              <div className="space-y-3">
                {entries.map(([tag, rev]) => (
                  <div key={tag}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{TAG_LABELS[tag as Tag] || tag}</span>
                      <span className="text-xs text-[var(--muted)]">${rev.toLocaleString()}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className={`h-full rounded-full ${TAG_BAR_COLORS[tag] || "bg-brand-500"} transition-all`} style={{ width: `${(rev / max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              {totalRevenue > 0 && <p className="mt-3 text-xs text-[var(--muted)]">Total: ${totalRevenue.toLocaleString()}</p>}
            </div>
          );
        })()}

        {/* Search + Filters */}
        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search fans..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] pl-10 pr-3 py-2 text-sm text-white outline-none focus:border-brand-500 transition placeholder:text-[var(--muted)]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "whale", "vip", "at-risk", "new", "regular"] as const).map((t) => (
              <button
                key={t} onClick={() => setFilter(t)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  filter === t ? "border-brand-500 bg-brand-500/20 text-brand-400" : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--muted)]"
                }`}
              >
                {t === "all" ? `All (${fans.length})` : `${TAG_LABELS[t]} (${fans.filter(f => f.tag === t).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Fan Table */}
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
          {fans.length === 0 ? (
            <div className="p-8 sm:p-12">
              <div className="text-center mb-8">
                <div className="mb-4 text-5xl">👋</div>
                <h2 className="text-xl font-bold mb-2">Welcome to CreatorCRM!</h2>
                <p className="text-sm text-[var(--muted)]">Get started in 3 easy steps</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3 mb-8 max-w-2xl mx-auto">
                <div className="rounded-lg border border-[var(--border)] p-4 text-center">
                  <div className="text-2xl mb-2">1</div>
                  <p className="text-sm font-medium mb-1">Add your fans</p>
                  <p className="text-xs text-[var(--muted)]">Manually or import from CSV</p>
                </div>
                <div className="rounded-lg border border-[var(--border)] p-4 text-center">
                  <div className="text-2xl mb-2">2</div>
                  <p className="text-sm font-medium mb-1">Tag &amp; organize</p>
                  <p className="text-xs text-[var(--muted)]">Whales, VIPs, At-Risk, New</p>
                </div>
                <div className="rounded-lg border border-[var(--border)] p-4 text-center">
                  <div className="text-2xl mb-2">3</div>
                  <p className="text-sm font-medium mb-1">Track &amp; grow</p>
                  <p className="text-xs text-[var(--muted)]">Monitor renewals &amp; revenue</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={openAddModal} className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition">
                  + Add Your First Fan
                </button>
                <label className="rounded-lg border border-[var(--border)] px-6 py-2.5 text-sm font-medium text-[var(--muted)] hover:text-white transition cursor-pointer text-center">
                  Import from CSV
                  <input type="file" accept=".csv" onChange={handleCSVFile} className="hidden" />
                </label>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-[var(--muted)]">{search ? `No fans matching "${search}"` : "No fans match this filter."}</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="sm:hidden divide-y divide-[var(--border)]">
                {filtered.map((fan) => {
                  const cl = churnLabel(churnScore(fan));
                  return (
                  <div key={fan.id} onClick={() => setSelected(fan)} className="cursor-pointer p-4 transition hover:bg-white/5 active:bg-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{fan.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] ${cl.color}`}>{cl.text}</span>
                        <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${TAG_COLORS[fan.tag]}`}>{TAG_LABELS[fan.tag]}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
                      <span>${(fan.total_spent || 0).toLocaleString()}</span>
                      <span>Renewal: {daysUntil(fan.renewal_date)}</span>
                    </div>
                  </div>
                  );
                })}
              </div>
              {/* Desktop Table */}
              <table className="hidden sm:table w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                    <th className="px-4 py-3 font-medium cursor-pointer hover:text-white transition select-none" onClick={() => toggleSort("name")}>
                      Fan <span className="text-xs ml-1 opacity-50">{sortIcon("name")}</span>
                    </th>
                    <th className="px-4 py-3 font-medium cursor-pointer hover:text-white transition select-none" onClick={() => toggleSort("tag")}>
                      Tag <span className="text-xs ml-1 opacity-50">{sortIcon("tag")}</span>
                    </th>
                    <th className="px-4 py-3 font-medium cursor-pointer hover:text-white transition select-none" onClick={() => toggleSort("total_spent")}>
                      Spent <span className="text-xs ml-1 opacity-50">{sortIcon("total_spent")}</span>
                    </th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell cursor-pointer hover:text-white transition select-none" onClick={() => toggleSort("last_message_at")}>
                      Last Msg <span className="text-xs ml-1 opacity-50">{sortIcon("last_message_at")}</span>
                    </th>
                    <th className="px-4 py-3 font-medium cursor-pointer hover:text-white transition select-none" onClick={() => toggleSort("renewal_date")}>
                      Renewal <span className="text-xs ml-1 opacity-50">{sortIcon("renewal_date")}</span>
                    </th>
                    <th className="px-4 py-3 font-medium hidden lg:table-cell">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((fan) => {
                    const cs = churnScore(fan);
                    const cl = churnLabel(cs);
                    return (
                    <tr key={fan.id} onClick={() => setSelected(fan)} className="cursor-pointer border-b border-[var(--border)] transition hover:bg-white/5">
                      <td className="px-4 py-3 font-medium">{fan.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${TAG_COLORS[fan.tag]}`}>{TAG_LABELS[fan.tag]}</span>
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
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`text-xs font-medium ${cl.color}`}>{cl.text}</span>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* Result Count */}
        {fans.length > 0 && (
          <p className="mt-3 text-xs text-[var(--muted)]">
            Showing {filtered.length} of {fans.length} fans
            {search && ` matching "${search}"`}
          </p>
        )}
      </div>

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative w-full max-w-md bg-[var(--card)] border-l border-[var(--border)] p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="absolute top-4 right-4 text-[var(--muted)] hover:text-white text-lg">✕</button>
            <h2 className="text-xl font-bold mb-1">{selected.name}</h2>
            <span className={`inline-block rounded-full border px-2 py-0.5 text-xs mb-4 ${TAG_COLORS[selected.tag]}`}>{TAG_LABELS[selected.tag]}</span>
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
                  <p className="text-xs text-red-300/80 mt-1">This fan is at risk of churning. Send a personal message or exclusive offer before their renewal date.</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => openEditModal(selected)} className="flex-1 rounded-lg border border-[var(--border)] py-2 text-sm font-medium text-[var(--muted)] hover:text-white hover:border-white/30 transition">
                  Edit Fan
                </button>
                <button onClick={() => setConfirmDelete(selected)} className="flex-1 rounded-lg border border-red-500/30 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" onClick={() => setConfirmDelete(null)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-sm rounded-xl bg-[var(--card)] border border-[var(--border)] p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-lg font-bold mb-2">Delete {confirmDelete.name}?</p>
            <p className="text-sm text-[var(--muted)] mb-6">This can&apos;t be undone. All data for this fan will be removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-lg border border-[var(--border)] py-2.5 text-sm font-medium text-[var(--muted)] hover:text-white transition">Cancel</button>
              <button onClick={() => handleDeleteFan(confirmDelete)} className="flex-1 rounded-lg bg-red-500 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition">Delete Fan</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Fan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setShowAddModal(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-[var(--card)] border border-[var(--border)] p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-[var(--muted)] hover:text-white text-lg">✕</button>
            <h2 className="text-xl font-bold mb-6">{editingFan ? "Edit Fan" : "Add New Fan"}</h2>
            <div className="space-y-4">
              {formError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{formError}</div>
              )}
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Fan Name</label>
                <input type="text" value={fanForm.name} onChange={(e) => setFanForm({ ...fanForm, name: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 transition" placeholder="e.g. Jake M." />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Tag</label>
                <select value={fanForm.tag} onChange={(e) => setFanForm({ ...fanForm, tag: e.target.value as Tag })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 transition">
                  <option value="new">New</option>
                  <option value="regular">Regular</option>
                  <option value="vip">VIP</option>
                  <option value="whale">Whale</option>
                  <option value="at-risk">At Risk</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Total Spent ($)</label>
                <input type="number" value={fanForm.total_spent} onChange={(e) => setFanForm({ ...fanForm, total_spent: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 transition" placeholder="0" min="0" step="0.01" />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Renewal Date</label>
                <input type="date" value={fanForm.renewal_date} onChange={(e) => setFanForm({ ...fanForm, renewal_date: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 transition" />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Notes</label>
                <textarea value={fanForm.notes} onChange={(e) => setFanForm({ ...fanForm, notes: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 transition" rows={3} placeholder="Preferences, interests, etc." />
              </div>
              <button onClick={handleSaveFan} disabled={saving || !fanForm.name.trim()}
                className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50">
                {saving ? "Saving..." : editingFan ? "Save Changes" : "Add Fan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Preview Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => { setShowImportModal(false); setImportPreview([]); }}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-xl bg-[var(--card)] border border-[var(--border)] p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setShowImportModal(false); setImportPreview([]); }} className="absolute top-4 right-4 text-[var(--muted)] hover:text-white text-lg">✕</button>
            <h2 className="text-xl font-bold mb-2">Import Fans</h2>
            <p className="text-sm text-[var(--muted)] mb-4">
              {importPreview.length} fan{importPreview.length !== 1 ? "s" : ""} found in CSV
              {!isPro && importPreview.length + fans.length > FREE_FAN_LIMIT && (
                <span className="text-amber-400"> (only {FREE_FAN_LIMIT - fans.length} can be imported on Free plan)</span>
              )}
            </p>
            <div className="rounded-lg border border-[var(--border)] overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                    <th className="px-3 py-2 text-left font-medium">Name</th>
                    <th className="px-3 py-2 text-left font-medium">Tag</th>
                    <th className="px-3 py-2 text-left font-medium">Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.slice(0, 10).map((f, i) => (
                    <tr key={i} className="border-b border-[var(--border)]">
                      <td className="px-3 py-2">{f.name}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${TAG_COLORS[f.tag]}`}>{TAG_LABELS[f.tag]}</span>
                      </td>
                      <td className="px-3 py-2">${f.total_spent.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {importPreview.length > 10 && (
                <p className="px-3 py-2 text-xs text-[var(--muted)]">...and {importPreview.length - 10} more</p>
              )}
            </div>
            {formError && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{formError}</div>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setShowImportModal(false); setImportPreview([]); }} className="flex-1 rounded-lg border border-[var(--border)] py-2.5 text-sm font-medium text-[var(--muted)] hover:text-white transition">
                Cancel
              </button>
              <button onClick={handleImportConfirm} disabled={importing}
                className="flex-1 rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50">
                {importing ? "Importing..." : `Import ${Math.min(importPreview.length, isPro ? importPreview.length : FREE_FAN_LIMIT - fans.length)} Fans`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setShowTemplates(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-xl bg-[var(--card)] border border-[var(--border)] p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowTemplates(false)} className="absolute top-4 right-4 text-[var(--muted)] hover:text-white text-lg">✕</button>
            <h2 className="text-xl font-bold mb-1">Message Templates</h2>
            <p className="text-sm text-[var(--muted)] mb-4">Ready-to-use messages. Click to copy, then paste into your DMs.</p>
            <div className="space-y-3">
              {MESSAGE_TEMPLATES.map((t) => (
                <div key={t.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{t.title}</span>
                      <span className="rounded-full bg-white/5 border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--muted)]">{t.cat}</span>
                    </div>
                    <button onClick={() => copyMessage(t.id, t.msg)}
                      className={`shrink-0 rounded px-2.5 py-1 text-xs font-medium transition ${copiedId === t.id ? "bg-green-500/20 text-green-300 border border-green-500/30" : "bg-brand-500/20 text-brand-400 border border-brand-500/30 hover:bg-brand-500/30"}`}>
                      {copiedId === t.id ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">{t.msg}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
