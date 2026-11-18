"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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

type Platform = "" | "onlyfans" | "fansly" | "patreon" | "twitch" | "youtube" | "instagram" | "twitter" | "tiktok" | "other";

type Fan = {
  id: string;
  name: string;
  tag: Tag;
  total_spent: number;
  last_message_at: string | null;
  renewal_date: string | null;
  notes: string;
  platform?: Platform;
  created_at?: string;
};

const PLATFORM_LABELS: Record<string, { label: string; color: string }> = {
  onlyfans: { label: "OnlyFans", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  fansly: { label: "Fansly", color: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
  patreon: { label: "Patreon", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  twitch: { label: "Twitch", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  youtube: { label: "YouTube", color: "bg-red-500/20 text-red-300 border-red-500/30" },
  instagram: { label: "Instagram", color: "bg-pink-400/20 text-pink-200 border-pink-400/30" },
  twitter: { label: "Twitter/X", color: "bg-sky-500/20 text-sky-300 border-sky-500/30" },
  tiktok: { label: "TikTok", color: "bg-teal-500/20 text-teal-300 border-teal-500/30" },
  other: { label: "Other", color: "bg-gray-500/20 text-gray-300 border-gray-500/30" },
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

function ProLock({ feature, onUpgrade }: { feature: string; onUpgrade: () => void }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-[var(--card)]/80 backdrop-blur-[6px]">
      <div className="rounded-full bg-brand-500/20 border border-brand-500/30 p-3 mb-3">
        <svg className="h-6 w-6 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <p className="text-sm font-semibold mb-1">Pro Feature</p>
      <p className="text-xs text-[var(--muted)] mb-3 text-center max-w-[200px]">{feature}</p>
      <button onClick={onUpgrade} className="rounded-lg bg-brand-500 px-4 py-2 text-xs font-medium text-white hover:bg-brand-600 transition">
        Upgrade to Pro — $29/mo
      </button>
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
  const [fanForm, setFanForm] = useState({ name: "", tag: "new" as Tag, total_spent: "", renewal_date: "", notes: "", platform: "" as Platform });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Fan | null>(null);
  const [toast, setToast] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<Array<{ name: string; tag: Tag; total_spent: number; notes: string }>>([]);

  const [announcement, setAnnouncement] = useState("");
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [showBulkTag, setShowBulkTag] = useState(false);
  const [revenueGoal, setRevenueGoal] = useState<number | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [copiedId, setCopiedId] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [spotlightQuery, setSpotlightQuery] = useState("");
  const [customTemplates, setCustomTemplates] = useState<Array<{ id: string; title: string; msg: string }>>([]);
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState("");
  const [newTemplateMsg, setNewTemplateMsg] = useState("");
  const [savedSegments, setSavedSegments] = useState<Array<{ id: string; name: string; filter: Tag | "all"; search: string }>>([]);
  const [showSegmentSave, setShowSegmentSave] = useState(false);
  const [segmentName, setSegmentName] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showBatchComposer, setShowBatchComposer] = useState(false);
  const [batchMessage, setBatchMessage] = useState("");
  const [notesHistory, setNotesHistory] = useState<Record<string, Array<{ text: string; at: string }>>>({});
  const [referralCode, setReferralCode] = useState("");
  const [referrals, setReferrals] = useState<Array<{ id: string; referred_email: string; status: string; created_at: string }>>([]);
  const [showReferrals, setShowReferrals] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [reviewDismissed, setReviewDismissed] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [reviewRole, setReviewRole] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);

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
          { creator_id: u.id, name: "Alex T. (demo)", tag: "whale", total_spent: 2340, renewal_date: new Date(today.getTime() + 12 * 86400000).toISOString(), notes: "Top tipper. Loves exclusive content. Demo fan — delete anytime.", platform: "onlyfans" },
          { creator_id: u.id, name: "Sam K. (demo)", tag: "vip", total_spent: 890, renewal_date: new Date(today.getTime() + 5 * 86400000).toISOString(), notes: "Loyal subscriber. Demo fan — delete anytime.", platform: "fansly" },
          { creator_id: u.id, name: "Jordan P. (demo)", tag: "at-risk", total_spent: 60, renewal_date: new Date(today.getTime() + 1 * 86400000).toISOString(), notes: "No engagement in 10 days. Renewal tomorrow! Demo fan — delete anytime.", platform: "onlyfans" },
          { creator_id: u.id, name: "Riley N. (demo)", tag: "new", total_spent: 15, renewal_date: new Date(today.getTime() + 28 * 86400000).toISOString(), notes: "Just subscribed. Demo fan — delete anytime.", platform: "patreon" },
        ];
        await supabase.from("fans").insert(demoFans);
      }

      setLoading(false);
      loadFans();

      // Load revenue goal + onboarding state + custom templates + segments
      try {
        const saved = localStorage.getItem("crm_revenue_goal");
        if (saved) setRevenueGoal(parseFloat(saved));
        if (localStorage.getItem("crm_onboarding_done")) setOnboardingDismissed(true);
        const tpl = localStorage.getItem("crm_custom_templates");
        if (tpl) setCustomTemplates(JSON.parse(tpl));
        const seg = localStorage.getItem("crm_saved_segments");
        if (seg) setSavedSegments(JSON.parse(seg));
        const nh = localStorage.getItem("crm_notes_history");
        if (nh) setNotesHistory(JSON.parse(nh));
        let rc = localStorage.getItem("crm_referral_code");
        if (!rc) {
          rc = u.id.slice(0, 8);
          localStorage.setItem("crm_referral_code", rc);
        }
        setReferralCode(rc);
        if (localStorage.getItem("crm_review_dismissed")) setReviewDismissed(true);
        if (localStorage.getItem("crm_review_submitted")) setReviewSubmitted(true);
      } catch {}

      supabase.auth.getSession().then(({ data: { session: s } }) => {
        if (s?.access_token) {
          fetch("/api/referrals", { headers: { Authorization: `Bearer ${s.access_token}` } })
            .then(r => r.json())
            .then(d => { if (d.referrals) setReferrals(d.referrals); })
            .catch(() => {});
        }
      });

      // Check for upgrade celebration
      const params = new URLSearchParams(window.location.search);
      if (params.get("upgraded") === "true") {
        setShowCelebration(true);
        window.history.replaceState({}, "", "/dashboard");
        setTimeout(() => setShowCelebration(false), 6000);
      }

      // Set dynamic page title
      document.title = `Dashboard — CreatorCRM`;

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
    if (platformFilter !== "all") list = list.filter((f) => (f.platform || "") === platformFilter);
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
  }, [fans, filter, platformFilter, search, sortKey, sortDir]);

  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    fans.forEach(f => {
      const p = f.platform || "";
      if (p) counts[p] = (counts[p] || 0) + 1;
    });
    return counts;
  }, [fans]);

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
    setFanForm({ name: "", tag: "new", total_spent: "", renewal_date: "", notes: "", platform: "" });
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
      platform: (fan.platform || "") as Platform,
    });
    setFormError("");
    setSelected(null);
    setShowAddModal(true);
  }

  async function handleSaveFan() {
    if (!fanForm.name.trim()) return;
    setSaving(true);
    setFormError("");

    const payload: Record<string, unknown> = {
      name: fanForm.name.trim(), tag: fanForm.tag,
      total_spent: parseFloat(fanForm.total_spent) || 0,
      renewal_date: fanForm.renewal_date || null,
      notes: fanForm.notes.trim(),
    };
    if (fanForm.platform) payload.platform = fanForm.platform;

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

  async function markMessaged(fanId: string, fanName: string) {
    const now = new Date().toISOString();
    await supabase.from("fans").update({ last_message_at: now }).eq("id", fanId);
    setFans(prev => prev.map(f => f.id === fanId ? { ...f, last_message_at: now } : f));
    setToast(`${fanName} marked as messaged!`);
  }

  async function bulkMarkMessaged() {
    if (bulkSelected.size === 0) return;
    const now = new Date().toISOString();
    const ids = Array.from(bulkSelected);
    await supabase.from("fans").update({ last_message_at: now }).in("id", ids);
    setFans(prev => prev.map(f => ids.includes(f.id) ? { ...f, last_message_at: now } : f));
    setToast(`${ids.length} fan${ids.length !== 1 ? "s" : ""} marked as messaged!`);
    setBulkSelected(new Set());
  }

  async function bulkChangeTag(tag: Tag) {
    if (bulkSelected.size === 0) return;
    const ids = Array.from(bulkSelected);
    await supabase.from("fans").update({ tag }).in("id", ids);
    setFans(prev => prev.map(f => ids.includes(f.id) ? { ...f, tag } : f));
    setToast(`${ids.length} fan${ids.length !== 1 ? "s" : ""} tagged as ${TAG_LABELS[tag]}!`);
    setBulkSelected(new Set());
    setShowBulkTag(false);
  }

  function toggleBulkSelect(id: string) {
    setBulkSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (bulkSelected.size === filtered.length) {
      setBulkSelected(new Set());
    } else {
      setBulkSelected(new Set(filtered.map(f => f.id)));
    }
  }

  function saveRevenueGoal(val: string) {
    const num = parseFloat(val);
    if (num > 0) {
      setRevenueGoal(num);
      localStorage.setItem("crm_revenue_goal", String(num));
    }
    setShowGoalModal(false);
  }

  function exportCSV() {
    const headers = ["Name", "Tag", "Total Spent", "Last Message", "Renewal Date", "Platform", "Notes"];
    const rows = fans.map((f) => [
      f.name, TAG_LABELS[f.tag], String(f.total_spent || 0),
      f.last_message_at || "", f.renewal_date || "", f.platform || "", `"${(f.notes || "").replace(/"/g, '""')}"`,
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
      const platformIdx = headers.findIndex((h) => h === "platform" || h === "source");

      if (nameIdx === -1) { setFormError("CSV must have a 'Name' column"); return; }

      const validTags = ["whale", "vip", "regular", "new", "at-risk"];
      const validPlatforms = ["onlyfans", "fansly", "patreon", "twitch", "youtube", "instagram", "twitter", "tiktok", "other"];
      const rows = lines.slice(1).map((line) => {
        const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        const rawTag = tagIdx >= 0 ? cols[tagIdx]?.toLowerCase().replace(/\s+/g, "-") : "new";
        const rawPlatform = platformIdx >= 0 ? cols[platformIdx]?.toLowerCase().replace(/\s+/g, "") : "";
        return {
          name: cols[nameIdx] || "",
          tag: (validTags.includes(rawTag) ? rawTag : "new") as Tag,
          total_spent: spentIdx >= 0 ? parseFloat(cols[spentIdx]?.replace(/[$,]/g, "")) || 0 : 0,
          notes: notesIdx >= 0 ? cols[notesIdx] || "" : "",
          platform: validPlatforms.includes(rawPlatform) ? rawPlatform : "",
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
      toImport.map((f) => {
        const row: Record<string, unknown> = { creator_id: user!.id, name: f.name, tag: f.tag, total_spent: f.total_spent, notes: f.notes };
        if ((f as Record<string, unknown>).platform) row.platform = (f as Record<string, unknown>).platform;
        return row;
      })
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

  async function handleUpgrade(planOrEvent?: "monthly" | "annual" | React.MouseEvent) {
    const plan = planOrEvent === "monthly" || planOrEvent === "annual" ? planOrEvent : "monthly";
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${authSession?.access_token}` }, body: JSON.stringify({ plan }) });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setToast("Checkout error: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      setToast("Failed to start checkout. Please try again.");
    }
  }

  const totalRevenue = fans.reduce((s, f) => s + (f.total_spent || 0), 0);
  const atRisk = fans.filter((f) => f.tag === "at-risk").length;
  const urgentRenewals = fans.filter((f) => {
    if (!f.renewal_date) return false;
    const d = Math.floor((new Date(f.renewal_date).getTime() - Date.now()) / 86400000);
    return d >= 0 && d <= 3;
  }).length;
  const avgSpend = fans.length > 0 ? totalRevenue / fans.length : 0;

  const messagedThisWeek = fans.filter(f => {
    if (!f.last_message_at) return false;
    return Date.now() - new Date(f.last_message_at).getTime() < 7 * 86400000;
  }).length;

  function churnScore(fan: Fan): number {
    let score = 0;
    if (fan.last_message_at) {
      const daysSince = Math.floor((Date.now() - new Date(fan.last_message_at).getTime()) / 86400000);
      if (daysSince > 14) score += 35;
      else if (daysSince > 7) score += 25;
      else if (daysSince > 3) score += 10;
    } else { score += 20; }
    if (fan.tag === "at-risk") score += 30;
    else if (fan.tag === "new") score += 10;
    if (fan.total_spent < 20) score += 15;
    else if (fan.total_spent < 50) score += 5;
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

  const actionItems = useMemo(() => {
    const items: { fan: Fan; reason: string; message: string; priority: number }[] = [];
    fans.forEach((f) => {
      if (f.renewal_date) {
        const d = Math.floor((new Date(f.renewal_date).getTime() - Date.now()) / 86400000);
        if (d >= 0 && d <= 1) {
          items.push({ fan: f, reason: "Renews tomorrow!", message: `Hey ${f.name.split(" ")[0]}! Just wanted to check in and see how you're doing. I've got some amazing content coming soon and I'd love for you to stick around!`, priority: 1 });
        } else if (d > 1 && d <= 3) {
          items.push({ fan: f, reason: `Renews in ${d} days`, message: `Hi ${f.name.split(" ")[0]}! Your renewal is coming up soon. I appreciate you so much! Is there anything special you'd like to see? Let me know`, priority: 2 });
        }
      }
      if (f.tag === "at-risk" && !items.find(i => i.fan.id === f.id)) {
        items.push({ fan: f, reason: "At risk of leaving", message: `Hey ${f.name.split(" ")[0]}! I noticed we haven't chatted in a while. I miss talking to you! I've got something special coming up that I think you'll love`, priority: 3 });
      }
      if (!f.last_message_at && !items.find(i => i.fan.id === f.id)) {
        items.push({ fan: f, reason: "Never messaged", message: `Hey ${f.name.split(" ")[0]}! Welcome to my page! I'm so happy you're here. Feel free to DM me anytime — I love getting to know my subscribers. Any special requests? I'm all ears!`, priority: 3.5 });
      }
      if (f.last_message_at) {
        const daysSince = Math.floor((Date.now() - new Date(f.last_message_at).getTime()) / 86400000);
        if (daysSince >= 7 && !items.find(i => i.fan.id === f.id)) {
          items.push({ fan: f, reason: `No contact in ${daysSince}d`, message: `Hi ${f.name.split(" ")[0]}! It's been a minute since we last chatted. How are you? I'd love to catch up!`, priority: 4 });
        }
      }
      if (f.tag === "whale" && f.last_message_at) {
        const daysSince = Math.floor((Date.now() - new Date(f.last_message_at).getTime()) / 86400000);
        if (daysSince >= 3 && !items.find(i => i.fan.id === f.id)) {
          items.push({ fan: f, reason: "VIP — keep engaged", message: `Hey ${f.name.split(" ")[0]}! You're one of my absolute favorites. I wanted to send you something exclusive just for you. Check your DMs tonight`, priority: 5 });
        }
      }
    });
    return items.sort((a, b) => a.priority - b.priority).slice(0, 8);
  }, [fans]);

  const revenueAtRisk = fans.filter(f => churnScore(f) >= 60).reduce((s, f) => s + (f.total_spent || 0), 0);

  const revenueTrend = useMemo(() => {
    const months: { label: string; revenue: number; fans: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const y = d.getFullYear();
      const m = d.getMonth();
      const label = d.toLocaleDateString("en-US", { month: "short" });
      const monthFans = fans.filter(f => {
        if (!f.created_at) return i === 0;
        const cd = new Date(f.created_at);
        return cd.getFullYear() === y && cd.getMonth() === m;
      });
      months.push({ label, revenue: monthFans.reduce((s, f) => s + (f.total_spent || 0), 0), fans: monthFans.length });
    }
    return months;
  }, [fans]);

  const perfComparison = useMemo(() => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const thisMonth = fans.filter(f => f.created_at && new Date(f.created_at).getTime() >= thisMonthStart);
    const lastMonth = fans.filter(f => {
      if (!f.created_at) return false;
      const t = new Date(f.created_at).getTime();
      return t >= lastMonthStart && t < thisMonthStart;
    });
    const thisRev = thisMonth.reduce((s, f) => s + (f.total_spent || 0), 0);
    const lastRev = lastMonth.reduce((s, f) => s + (f.total_spent || 0), 0);
    const thisMessaged = fans.filter(f => f.last_message_at && new Date(f.last_message_at).getTime() >= thisMonthStart).length;
    const lastMessaged = fans.filter(f => {
      if (!f.last_message_at) return false;
      const t = new Date(f.last_message_at).getTime();
      return t >= lastMonthStart && t < thisMonthStart;
    }).length;
    return {
      newFans: { current: thisMonth.length, prev: lastMonth.length },
      revenue: { current: thisRev, prev: lastRev },
      messaged: { current: thisMessaged, prev: lastMessaged },
    };
  }, [fans]);

  const messagingStreak = useMemo(() => {
    const days = new Set<string>();
    fans.forEach(f => {
      if (f.last_message_at) days.add(new Date(f.last_message_at).toISOString().split("T")[0]);
    });
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (days.has(d.toISOString().split("T")[0])) streak++;
      else if (i > 0) break;
    }
    return streak;
  }, [fans]);


  const weeklySummary = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 86400000;
    const twoWeeksAgo = now - 14 * 86400000;
    const thisWeekFans = fans.filter(f => {
      const d = new Date(f.created_at || 0).getTime();
      return d >= weekAgo;
    }).length;
    const lastWeekFans = fans.filter(f => {
      const d = new Date(f.created_at || 0).getTime();
      return d >= twoWeeksAgo && d < weekAgo;
    }).length;
    const messaged7d = fans.filter(f => f.last_message_at && new Date(f.last_message_at).getTime() >= weekAgo).length;
    return { thisWeekFans, lastWeekFans, messaged7d };
  }, [fans]);

  const nextStep = useMemo(() => {
    if (fans.length === 0) return null;
    const unmessaged = fans.filter(f => !f.last_message_at);
    if (unmessaged.length > 0) return { icon: "✉", text: `${unmessaged.length} fan${unmessaged.length !== 1 ? "s have" : " has"} never been messaged. Send a welcome!`, action: "Message them", priority: 1 };
    if (actionItems.length > 0) return { icon: "⚡", text: `${actionItems.length} fan${actionItems.length !== 1 ? "s" : ""} need your attention in the Action Center.`, action: "Take action", priority: 2 };
    if (!revenueGoal) return { icon: "🎯", text: "Set a revenue goal to track your progress and stay motivated.", action: "Set goal", priority: 3 };
    const engagement = fans.length > 0 ? weeklySummary.messaged7d / fans.length : 0;
    if (engagement < 0.5) return { icon: "💬", text: "Your engagement is below 50%. Try messaging a few fans today!", action: "Browse fans", priority: 4 };
    return { icon: "🔥", text: "You're crushing it! Keep up the momentum.", action: null, priority: 5 };
  }, [fans, actionItems, revenueGoal, weeklySummary]);

  function getMilestones(spent: number): { label: string; color: string }[] {
    const m: { label: string; color: string }[] = [];
    if (spent >= 5000) m.push({ label: "Diamond ($5k+)", color: "text-cyan-300" });
    else if (spent >= 1000) m.push({ label: "Gold ($1k+)", color: "text-yellow-300" });
    else if (spent >= 500) m.push({ label: "Silver ($500+)", color: "text-gray-300" });
    else if (spent >= 100) m.push({ label: "Bronze ($100+)", color: "text-amber-600" });
    return m;
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSpotlight(prev => !prev);
        setSpotlightQuery("");
        return;
      }
      if (isInput) {
        if (e.key === "Escape") (target as HTMLInputElement).blur();
        return;
      }
      if (e.key === "/" || e.key === "s") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "n" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (!atLimit) openAddModal();
      } else if (e.key === "t" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowTemplates(true);
      } else if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowShortcuts(true);
      } else if (e.key === "Escape") {
        setSelected(null);
        setShowAddModal(false);
        setShowTemplates(false);
        setShowImportModal(false);
        setShowGoalModal(false);
        setShowBulkTag(false);
        setShowSpotlight(false);
        setShowNotifications(false);
        setShowShortcuts(false);
        setShowBatchComposer(false);
        setConfirmDelete(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [atLimit]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <nav className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-sm px-4 py-3">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="text-xl font-bold">Creator<span className="text-brand-500">CRM</span></div>
            <div className="flex gap-2">
              <div className="h-8 w-16 rounded-lg bg-white/5 animate-pulse" />
              <div className="h-8 w-16 rounded-lg bg-white/5 animate-pulse" />
            </div>
          </div>
        </nav>
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <div className="h-7 w-48 rounded bg-white/5 animate-pulse mb-2" />
              <div className="h-4 w-64 rounded bg-white/5 animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-24 rounded-lg bg-white/5 animate-pulse" />
              <div className="h-9 w-24 rounded-lg bg-brand-500/20 animate-pulse" />
            </div>
          </div>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                <div className="h-3 w-16 rounded bg-white/5 animate-pulse mb-2" />
                <div className="h-6 w-20 rounded bg-white/5 animate-pulse mb-1" />
                <div className="h-3 w-14 rounded bg-white/5 animate-pulse" />
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-[var(--border)] last:border-0">
                <div className="h-4 w-32 rounded bg-white/5 animate-pulse" />
                <div className="h-5 w-16 rounded-full bg-white/5 animate-pulse" />
                <div className="h-4 w-16 rounded bg-white/5 animate-pulse" />
                <div className="h-4 w-24 rounded bg-white/5 animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function copyMessage(id: string, msg: string) {
    navigator.clipboard.writeText(msg);
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 2000);
  }

  function saveCustomTemplate() {
    if (!newTemplateTitle.trim() || !newTemplateMsg.trim()) return;
    const tpl = { id: `custom-${Date.now()}`, title: newTemplateTitle.trim(), msg: newTemplateMsg.trim() };
    const updated = [...customTemplates, tpl];
    setCustomTemplates(updated);
    try { localStorage.setItem("crm_custom_templates", JSON.stringify(updated)); } catch {}
    setNewTemplateTitle("");
    setNewTemplateMsg("");
    setShowNewTemplateForm(false);
    setToast("Template saved!");
  }

  function deleteCustomTemplate(id: string) {
    const updated = customTemplates.filter(t => t.id !== id);
    setCustomTemplates(updated);
    try { localStorage.setItem("crm_custom_templates", JSON.stringify(updated)); } catch {}
    setToast("Template deleted");
  }

  function saveSegment() {
    if (!segmentName.trim()) return;
    const seg = { id: `seg-${Date.now()}`, name: segmentName.trim(), filter, search };
    const updated = [...savedSegments, seg];
    setSavedSegments(updated);
    try { localStorage.setItem("crm_saved_segments", JSON.stringify(updated)); } catch {}
    setSegmentName("");
    setShowSegmentSave(false);
    setToast("Segment saved!");
  }

  function deleteSegment(id: string) {
    const updated = savedSegments.filter(s => s.id !== id);
    setSavedSegments(updated);
    try { localStorage.setItem("crm_saved_segments", JSON.stringify(updated)); } catch {}
    setToast("Segment removed");
  }

  function loadSegment(seg: { filter: Tag | "all"; search: string }) {
    setFilter(seg.filter);
    setSearch(seg.search);
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

      {/* Upgrade Celebration */}
      {showCelebration && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center" onClick={() => setShowCelebration(false)}>
          {/* Confetti particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-sm"
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ["#8b5cf6", "#f59e0b", "#10b981", "#3b82f6", "#ec4899", "#f97316"][i % 6],
                  animation: `confettiFall ${2 + Math.random() * 3}s linear ${Math.random() * 2}s forwards`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                  opacity: 0.8,
                }}
              />
            ))}
          </div>
          <div className="relative z-10 rounded-2xl border border-brand-500/40 bg-[var(--card)] p-8 sm:p-12 text-center shadow-2xl animate-[scaleIn_0.4s_ease-out] max-w-md mx-4">
            <div className="text-5xl sm:text-6xl mb-4 animate-[celebratePulse_1s_ease-in-out_infinite]">
              🎉
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2"
              style={{
                background: "linear-gradient(90deg, #8b5cf6, #d946ef, #8b5cf6)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "shimmer 2s linear infinite",
              }}>
              Welcome to Pro!
            </h2>
            <p className="text-[var(--muted)] text-sm mb-4">
              You now have access to unlimited fans, revenue analytics, custom templates, saved segments, and all premium features.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs mb-6">
              {["Unlimited fans", "Revenue analytics", "Custom templates", "CSV export", "Saved segments", "Advanced charts"].map(f => (
                <div key={f} className="flex items-center gap-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20 px-2.5 py-1.5">
                  <span className="text-green-400">✓</span>
                  <span className="text-brand-300">{f}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowCelebration(false)}
              className="rounded-xl bg-brand-500 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition">
              Let&apos;s Go!
            </button>
          </div>
        </div>
      )}

      {/* Top Nav */}
      <nav className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Creator<span className="text-brand-500">CRM</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => { setShowSpotlight(true); setSpotlightQuery(""); }}
              className="hidden sm:flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white/5 px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white hover:border-[var(--muted)] transition">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <span>Search</span>
              <kbd className="rounded border border-[var(--border)] bg-white/5 px-1 py-0.5 text-[10px]">⌘K</kbd>
            </button>
            {/* Notification Bell */}
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)}
                className="relative rounded-lg border border-[var(--border)] p-1.5 text-[var(--muted)] hover:text-white transition">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {actionItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                    {actionItems.length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl overflow-hidden">
                    <div className="border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Notifications</h3>
                      <span className="text-xs text-[var(--muted)]">{actionItems.length} alerts</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {actionItems.length === 0 ? (
                        <div className="p-6 text-center">
                          <p className="text-sm text-green-400 font-medium">All clear!</p>
                          <p className="text-xs text-[var(--muted)] mt-1">No fans need attention right now.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-[var(--border)]">
                          {actionItems.slice(0, 6).map(item => (
                            <button key={item.fan.id} onClick={() => { setShowNotifications(false); setSelected(item.fan); }}
                              className="w-full text-left px-4 py-3 hover:bg-white/5 transition">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`h-2 w-2 rounded-full ${item.priority <= 2 ? "bg-red-500" : item.priority <= 3.5 ? "bg-amber-500" : "bg-blue-500"}`} />
                                <span className="text-sm font-medium truncate">{item.fan.name}</span>
                              </div>
                              <p className="text-xs text-[var(--muted)] pl-4">{item.reason}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {actionItems.length > 6 && (
                      <div className="border-t border-[var(--border)] px-4 py-2">
                        <p className="text-xs text-[var(--muted)] text-center">+ {actionItems.length - 6} more in Action Center</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
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
            {isPro && (
              <Link href="/analytics" className="rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-xs font-medium text-brand-400 hover:bg-brand-500/20 transition">
                Analytics
              </Link>
            )}
            <Link href="/settings" className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white transition">
              Settings
            </Link>
            <Link href="/help" className="hidden sm:inline-block rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white transition">
              Help
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

        {/* Onboarding Checklist */}
        {fans.length <= 10 && !onboardingDismissed && (() => {
          const steps = [
            { key: "fan", label: "Add your first fan", done: fans.length > 0, action: "Add Fan", onClick: () => openAddModal() },
            { key: "msg", label: "Copy a message template", done: fans.some(f => f.last_message_at), action: "Open Templates", onClick: () => setShowTemplates(true) },
            { key: "goal", label: "Set a revenue goal", done: !!revenueGoal, action: "Set Goal", onClick: () => setShowGoalModal(true) },
            { key: "tag", label: "Tag a fan as VIP or Whale", done: fans.some(f => f.tag === "vip" || f.tag === "whale"), action: "Edit Fan", onClick: () => { if (fans[0]) openEditModal(fans[0]); } },
            { key: "refer", label: "Share your referral link", done: referrals.length > 0, action: "Copy Link", onClick: () => { navigator.clipboard.writeText(`https://creatorcrm.net/signup?ref=${referralCode}`); setToast("Referral link copied!"); } },
          ];
          const done = steps.filter(s => s.done).length;
          if (done === steps.length) return null;
          return (
            <div className="mb-6 rounded-xl border border-brand-500/30 bg-gradient-to-r from-brand-500/10 to-transparent p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    Quick Start Guide
                    <span className="rounded-full bg-brand-500/20 border border-brand-500/30 px-2 py-0.5 text-[10px] font-medium text-brand-400">{done}/{steps.length}</span>
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-0.5">Complete these steps to get the most out of CreatorCRM</p>
                </div>
                <button onClick={() => { setOnboardingDismissed(true); try { localStorage.setItem("crm_onboarding_done", "1"); } catch {} }}
                  className="text-xs text-[var(--muted)] hover:text-white transition">Dismiss</button>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-4">
                <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${(done / steps.length) * 100}%` }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {steps.map((s, i) => (
                  <div key={s.key} className={`flex items-center justify-between gap-2 rounded-lg border p-3 text-xs transition ${s.done ? "border-green-500/30 bg-green-500/5" : "border-[var(--border)] bg-[var(--bg)]"}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold shrink-0 ${s.done ? "bg-green-500/20 text-green-400" : "bg-brand-500/20 text-brand-400"}`}>
                        {s.done ? "✓" : i + 1}
                      </span>
                      <span className={s.done ? "text-green-400 line-through opacity-60" : ""}>{s.label}</span>
                    </div>
                    {!s.done && (
                      <button onClick={s.onClick}
                        className="rounded-md bg-brand-500 px-2.5 py-1 text-[10px] font-medium text-white hover:bg-brand-600 transition whitespace-nowrap shrink-0">
                        {s.action}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {done >= 3 && (
                <p className="mt-3 text-center text-[10px] text-brand-400 font-medium">Almost there! One more step to go.</p>
              )}
            </div>
          );
        })()}

        {/* Personalized Greeting */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              {(() => {
                const h = new Date().getHours();
                const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
                const name = user?.user_metadata?.name?.split(" ")[0] || "";
                return `${greeting}${name ? `, ${name}` : ""}`;
              })()}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)]">
              {fans.length === 0 ? "Let's get started!" :
               actionItems.length > 0 ? `You have ${actionItems.length} fan${actionItems.length !== 1 ? "s" : ""} that need attention today.` :
               "All fans are looking good today!"}
            </p>
          </div>
          <div className="flex gap-2">
            <label className="rounded-lg border border-[var(--border)] px-3 sm:px-4 py-2 text-sm text-[var(--muted)] hover:text-white transition cursor-pointer">
              Import CSV
              <input type="file" accept=".csv" onChange={handleCSVFile} className="hidden" />
            </label>
            {fans.length > 0 && (
              <button onClick={isPro ? exportCSV : handleUpgrade} className="rounded-lg border border-[var(--border)] px-3 sm:px-4 py-2 text-sm text-[var(--muted)] hover:text-white transition">
                Export {!isPro && "🔒"}
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
        <div className="mb-6 sm:mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-7">
          <StatCard label="Total Fans" value={String(fans.length)} sub={isPro ? "unlimited" : `of ${FREE_FAN_LIMIT} free`} />
          <StatCard label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} sub="lifetime tracked" />
          <StatCard label="Avg per Fan" value={`$${Math.round(avgSpend).toLocaleString()}`} sub="avg lifetime value" />
          <StatCard label="At Risk" value={String(atRisk)} sub="need attention" accent={atRisk > 0 ? "text-red-400" : ""} />
          <StatCard label="Renewals ≤3d" value={String(urgentRenewals)} sub="message today" accent={urgentRenewals > 0 ? "text-amber-400" : ""} />
          <StatCard label="Messaged 7d" value={String(messagedThisWeek)} sub={`of ${fans.length} fans`} accent={messagedThisWeek > 0 ? "text-green-400" : ""} />
          <StatCard label="Streak" value={messagingStreak > 0 ? `${messagingStreak}d` : "—"} sub={messagingStreak >= 7 ? "on fire!" : messagingStreak > 0 ? "keep going" : "message a fan"} accent={messagingStreak >= 7 ? "text-brand-400" : messagingStreak > 0 ? "text-green-400" : ""} />
        </div>

        {/* Priority Action Banner */}
        {actionItems.length > 0 && (
          <div className={`mb-6 rounded-xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            actionItems[0].priority <= 2 ? "border-red-500/30 bg-red-500/5" : "border-amber-500/30 bg-amber-500/5"
          }`}>
            <div className="flex items-center gap-3 min-w-0">
              <span className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm ${
                actionItems[0].priority <= 2 ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
              }`}>!</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{actionItems[0].fan.name} — {actionItems[0].reason}</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">{actionItems.length > 1 ? `+ ${actionItems.length - 1} more action${actionItems.length > 2 ? "s" : ""} needed` : "Take action now"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => { navigator.clipboard.writeText(actionItems[0].message); setToast("Message copied!"); }}
                className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 transition whitespace-nowrap">
                Copy Message
              </button>
              <button onClick={() => setSelected(actionItems[0].fan)}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white transition whitespace-nowrap">
                View Fan
              </button>
            </div>
          </div>
        )}

        {/* Platform Breakdown */}
        {Object.keys(platformCounts).length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--muted)] mr-1">Platforms:</span>
            {Object.entries(platformCounts).sort((a, b) => b[1] - a[1]).map(([p, count]) => (
              <button key={p} onClick={() => setPlatformFilter(platformFilter === p ? "all" : p as Platform)}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition ${
                  platformFilter === p
                    ? "border-brand-500 bg-brand-500/20 text-brand-400"
                    : PLATFORM_LABELS[p] ? PLATFORM_LABELS[p].color + " border" : "border-[var(--border)] text-[var(--muted)]"
                }`}>
                {PLATFORM_LABELS[p]?.label || p} ({count})
              </button>
            ))}
            {platformFilter !== "all" && (
              <button onClick={() => setPlatformFilter("all")} className="text-xs text-[var(--muted)] hover:text-white transition ml-1">&times; Clear</button>
            )}
          </div>
        )}

        {/* Referral Program */}
        {referralCode && fans.length > 0 && (
          <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  Referral Program
                  {referrals.length > 0 && (
                    <span className="rounded-full bg-brand-500/20 border border-brand-500/30 px-1.5 py-0.5 text-[10px] font-medium text-brand-400">{referrals.length}</span>
                  )}
                </h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">Share CreatorCRM with other creators and track your referrals</p>
              </div>
              <div className="flex items-center gap-2">
                <code className="rounded-lg bg-white/5 border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] font-mono select-all">
                  creatorcrm.net/signup?ref={referralCode}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://creatorcrm.net/signup?ref=${referralCode}`);
                    setToast("Referral link copied!");
                  }}
                  className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 transition whitespace-nowrap"
                >
                  Copy Link
                </button>
              </div>
            </div>

            {/* Referral Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <p className="text-lg font-bold">{referrals.length}</p>
                <p className="text-[10px] text-[var(--muted)]">Total Referrals</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <p className="text-lg font-bold">{referrals.filter(r => r.status === "active" || r.status === "subscribed").length}</p>
                <p className="text-[10px] text-[var(--muted)]">Active Users</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <p className="text-lg font-bold">{referrals.filter(r => r.status === "subscribed").length}</p>
                <p className="text-[10px] text-[var(--muted)]">Upgraded to Pro</p>
              </div>
            </div>

            {/* Referral List */}
            {referrals.length > 0 ? (
              <>
                <button
                  onClick={() => setShowReferrals(!showReferrals)}
                  className="text-xs text-brand-400 hover:text-brand-300 transition mb-2"
                >
                  {showReferrals ? "Hide referrals" : `Show ${referrals.length} referral${referrals.length !== 1 ? "s" : ""}`}
                </button>
                {showReferrals && (
                  <div className="space-y-2 mt-2">
                    {referrals.map((r) => (
                      <div key={r.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/20 text-brand-400 text-[10px] font-bold">
                            {r.referred_email[0].toUpperCase()}
                          </div>
                          <span className="text-xs">{r.referred_email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                            r.status === "subscribed" ? "bg-green-500/20 border-green-500/30 text-green-400" :
                            r.status === "active" ? "bg-blue-500/20 border-blue-500/30 text-blue-400" :
                            "bg-white/10 border-white/20 text-[var(--muted)]"
                          }`}>
                            {r.status === "subscribed" ? "Pro" : r.status === "active" ? "Active" : "Signed Up"}
                          </span>
                          <span className="text-[10px] text-[var(--muted)]">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-[var(--muted)]">No referrals yet. Share your link to get started!</p>
            )}
          </div>
        )}

        {/* Review Prompt — shown for users with 5+ fans who haven't dismissed or submitted */}
        {fans.length >= 5 && !reviewDismissed && !reviewSubmitted && !showReviewPrompt && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💬</span>
              <div>
                <h3 className="text-sm font-semibold">How&apos;s CreatorCRM working for you?</h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">Your feedback helps other creators find us. Takes 30 seconds.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowReviewPrompt(true)}
                className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 transition whitespace-nowrap">
                Leave a Review
              </button>
              <button onClick={() => { setReviewDismissed(true); try { localStorage.setItem("crm_review_dismissed", "1"); } catch {} }}
                className="text-xs text-[var(--muted)] hover:text-white transition">
                Not now
              </button>
            </div>
          </div>
        )}

        {/* Review Form Modal */}
        {showReviewPrompt && (
          <>
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setShowReviewPrompt(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                {reviewSubmitted ? (
                  <div className="text-center py-4">
                    <div className="text-4xl mb-3">🎉</div>
                    <h3 className="text-lg font-bold mb-2">Thank you!</h3>
                    <p className="text-sm text-[var(--muted)]">Your review means a lot. It helps other creators discover CreatorCRM.</p>
                    <button onClick={() => setShowReviewPrompt(false)}
                      className="mt-4 rounded-lg bg-brand-500 px-6 py-2 text-sm font-medium text-white hover:bg-brand-600 transition">
                      Done
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold">Leave a Review</h3>
                      <button onClick={() => setShowReviewPrompt(false)} className="text-[var(--muted)] hover:text-white transition text-lg">&times;</button>
                    </div>

                    {/* Star Rating */}
                    <div className="mb-4">
                      <label className="text-xs text-[var(--muted)] mb-2 block">Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button key={star} onClick={() => setReviewRating(star)}
                            className={`text-2xl transition ${star <= reviewRating ? "text-amber-400" : "text-[var(--border)] hover:text-amber-400/50"}`}>
                            ★
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message */}
                    <div className="mb-4">
                      <label className="text-xs text-[var(--muted)] mb-1.5 block">What do you like about CreatorCRM?</label>
                      <textarea
                        value={reviewMessage}
                        onChange={e => setReviewMessage(e.target.value)}
                        placeholder="e.g. The action center saves me so much time..."
                        rows={3}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-white outline-none focus:border-brand-500 transition resize-none"
                      />
                    </div>

                    {/* Name (optional) */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="text-xs text-[var(--muted)] mb-1.5 block">Display name <span className="text-[var(--border)]">(optional)</span></label>
                        <input
                          type="text"
                          value={reviewName}
                          onChange={e => setReviewName(e.target.value)}
                          placeholder="e.g. Sarah M."
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-white outline-none focus:border-brand-500 transition"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[var(--muted)] mb-1.5 block">Role <span className="text-[var(--border)]">(optional)</span></label>
                        <input
                          type="text"
                          value={reviewRole}
                          onChange={e => setReviewRole(e.target.value)}
                          placeholder="e.g. OnlyFans creator"
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-white outline-none focus:border-brand-500 transition"
                        />
                      </div>
                    </div>

                    <p className="text-[10px] text-[var(--muted)] mb-4">Your review may be featured on our landing page. Name and role are optional.</p>

                    <button
                      onClick={async () => {
                        if (!reviewRating || !reviewMessage.trim()) return;
                        setReviewSaving(true);
                        try {
                          const { data: { session } } = await supabase.auth.getSession();
                          await fetch("/api/reviews", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
                            body: JSON.stringify({ rating: reviewRating, message: reviewMessage, name: reviewName, role: reviewRole }),
                          });
                          setReviewSubmitted(true);
                          try { localStorage.setItem("crm_review_submitted", "1"); } catch {}
                          setToast("Review submitted! Thank you!");
                        } catch {
                          setToast("Failed to submit. Please try again.");
                        }
                        setReviewSaving(false);
                      }}
                      disabled={!reviewRating || !reviewMessage.trim() || reviewSaving}
                      className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50"
                    >
                      {reviewSaving ? "Submitting..." : "Submit Review"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* Welcome Card — shown when user has no fans */}
        {fans.length === 0 && (
          <div className="mb-6 rounded-xl border border-brand-500/30 bg-brand-500/5 p-6 sm:p-8">
            <div className="text-center max-w-lg mx-auto">
              <div className="text-4xl mb-3">👋</div>
              <h2 className="text-xl font-bold mb-2">Welcome to CreatorCRM!</h2>
              <p className="text-sm text-[var(--muted)] mb-6">Get set up in under 2 minutes. Add your first fans and let CreatorCRM tell you exactly who to message.</p>
              <div className="grid gap-4 sm:grid-cols-3 mb-6">
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                  <div className="text-2xl mb-2">1</div>
                  <p className="text-sm font-medium mb-1">Add fans</p>
                  <p className="text-xs text-[var(--muted)]">Click &quot;+ Add Fan&quot; or import a CSV file</p>
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                  <div className="text-2xl mb-2">2</div>
                  <p className="text-sm font-medium mb-1">Get action items</p>
                  <p className="text-xs text-[var(--muted)]">We&apos;ll tell you who to message and when</p>
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                  <div className="text-2xl mb-2">3</div>
                  <p className="text-sm font-medium mb-1">Grow revenue</p>
                  <p className="text-xs text-[var(--muted)]">Keep fans longer and earn more every month</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={openAddModal} className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition">
                  + Add Your First Fan
                </button>
                <label className="rounded-lg border border-[var(--border)] px-6 py-2.5 text-sm text-[var(--muted)] hover:text-white transition cursor-pointer text-center">
                  Import from CSV
                  <input type="file" accept=".csv" onChange={handleCSVFile} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Platform Summary — Pro only */}
        {isPro && fans.some(f => f.platform) && (() => {
          const platformCounts: Record<string, { count: number; revenue: number }> = {};
          fans.forEach(f => {
            const p = f.platform || "";
            if (!p) return;
            if (!platformCounts[p]) platformCounts[p] = { count: 0, revenue: 0 };
            platformCounts[p].count++;
            platformCounts[p].revenue += f.total_spent || 0;
          });
          const topPlatforms = Object.entries(platformCounts).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 4);
          if (topPlatforms.length === 0) return null;
          return (
            <div className="mb-6 flex flex-wrap gap-3">
              {topPlatforms.map(([p, data]) => {
                const info = PLATFORM_LABELS[p];
                if (!info) return null;
                return (
                  <div key={p} className={`flex items-center gap-2 rounded-xl border ${info.color} px-3 py-2`}>
                    <span className="text-sm font-medium">{info.label}</span>
                    <span className="text-xs opacity-75">{data.count} fans</span>
                    <span className="text-xs opacity-75">${data.revenue.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Fan Health Bar */}
        {fans.length >= 2 && (() => {
          const tagOrder: Tag[] = ["whale", "vip", "regular", "new", "at-risk"];
          const TAG_BAR_BG: Record<Tag, string> = {
            whale: "bg-purple-500", vip: "bg-amber-500", regular: "bg-blue-500", new: "bg-green-500", "at-risk": "bg-red-500",
          };
          const counts = tagOrder.map(t => ({ tag: t, count: fans.filter(f => f.tag === t).length })).filter(t => t.count > 0);
          return (
            <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Audience Health</h3>
                {messagingStreak > 0 && (
                  <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1">
                    <span className="text-xs">🔥</span>
                    <span className="text-xs font-medium text-amber-400">{messagingStreak}-day streak</span>
                  </div>
                )}
              </div>
              <div className="flex h-4 rounded-full overflow-hidden mb-3">
                {counts.map(({ tag, count }) => (
                  <div key={tag} className={`${TAG_BAR_BG[tag]} transition-all`}
                    style={{ width: `${(count / fans.length) * 100}%` }}
                    title={`${TAG_LABELS[tag]}: ${count}`} />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {counts.map(({ tag, count }) => (
                  <div key={tag} className="flex items-center gap-1.5">
                    <div className={`h-2.5 w-2.5 rounded-full ${TAG_BAR_BG[tag]}`} />
                    <span className="text-xs text-[var(--muted)]">{TAG_LABELS[tag]} <span className="font-medium text-white">{count}</span></span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Next Step Nudge */}
        {nextStep && fans.length > 0 && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-brand-500/20 bg-brand-500/5 p-4">
            <span className="text-xl shrink-0">{nextStep.icon}</span>
            <p className="text-sm text-[var(--muted)] flex-1">{nextStep.text}</p>
            {nextStep.action && nextStep.priority === 3 && (
              <button onClick={() => { setGoalInput(""); setShowGoalModal(true); }}
                className="shrink-0 rounded-lg bg-brand-500/20 border border-brand-500/30 px-3 py-1.5 text-xs font-medium text-brand-400 hover:bg-brand-500/30 transition">
                {nextStep.action}
              </button>
            )}
          </div>
        )}

        {/* Weekly Summary + Revenue Goal */}
        {fans.length >= 2 && (
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span>📈</span> This Week
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xl font-bold">{weeklySummary.thisWeekFans}</p>
                  <p className="text-xs text-[var(--muted)]">new fans</p>
                  {weeklySummary.lastWeekFans > 0 && (
                    <p className={`text-xs mt-0.5 ${weeklySummary.thisWeekFans >= weeklySummary.lastWeekFans ? "text-green-400" : "text-red-400"}`}>
                      {weeklySummary.thisWeekFans >= weeklySummary.lastWeekFans ? "↑" : "↓"} vs last week ({weeklySummary.lastWeekFans})
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xl font-bold">{weeklySummary.messaged7d}</p>
                  <p className="text-xs text-[var(--muted)]">messaged</p>
                  {weeklySummary.messaged7d === 0 ? (
                    <p className="text-xs text-amber-400 mt-0.5">start today!</p>
                  ) : (
                    <p className="text-xs text-[var(--muted)] mt-0.5">past 7 days</p>
                  )}
                </div>
                <div>
                  {(() => {
                    const pct = fans.length > 0 ? Math.round((weeklySummary.messaged7d / fans.length) * 100) : 0;
                    return (
                      <>
                        <p className={`text-xl font-bold ${pct === 0 ? "" : pct >= 50 ? "text-green-400" : pct >= 25 ? "text-amber-400" : ""}`}>{pct}%</p>
                        <p className="text-xs text-[var(--muted)]">engagement</p>
                        {pct === 0 ? (
                          <p className="text-xs text-amber-400 mt-0.5">message 1 fan to start</p>
                        ) : pct >= 75 ? (
                          <p className="text-xs text-green-400 mt-0.5">excellent!</p>
                        ) : (
                          <p className="text-xs text-[var(--muted)] mt-0.5">of total fans</p>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <span>🎯</span> Revenue Goal
                </h3>
                <button onClick={() => { setGoalInput(revenueGoal ? String(revenueGoal) : ""); setShowGoalModal(true); }}
                  className="text-xs text-brand-400 hover:text-brand-300 transition">
                  {revenueGoal ? "Edit" : "Set Goal"}
                </button>
              </div>
              {revenueGoal ? (
                <>
                  <div className="flex items-end justify-between mb-2">
                    <p className="text-xl font-bold">${totalRevenue.toLocaleString()}</p>
                    <p className="text-sm text-[var(--muted)]">of ${revenueGoal.toLocaleString()}</p>
                  </div>
                  <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${totalRevenue >= revenueGoal ? "bg-green-500" : "bg-brand-500"}`}
                      style={{ width: `${Math.min(100, (totalRevenue / revenueGoal) * 100)}%` }}
                    />
                  </div>
                  <p className={`text-xs mt-2 ${totalRevenue >= revenueGoal ? "text-green-400" : "text-[var(--muted)]"}`}>
                    {totalRevenue >= revenueGoal
                      ? "🎉 Goal reached!"
                      : `$${(revenueGoal - totalRevenue).toLocaleString()} to go`}
                  </p>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-[var(--muted)] mb-2">Set a revenue target to track progress</p>
                  <button onClick={() => { setGoalInput(""); setShowGoalModal(true); }}
                    className="rounded-lg bg-brand-500/20 border border-brand-500/30 px-4 py-2 text-xs font-medium text-brand-400 hover:bg-brand-500/30 transition">
                    Set Revenue Goal
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Center */}
        {actionItems.length > 0 && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <h3 className="text-sm font-semibold">Action Center — {actionItems.length} fan{actionItems.length !== 1 ? "s" : ""} need attention</h3>
              </div>
              <button onClick={() => setShowTemplates(true)} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white transition">
                All Templates
              </button>
            </div>
            <p className="text-xs text-[var(--muted)] mb-3">Copy a message below, paste it into your DMs, then hit &quot;Sent&quot; to track it.</p>
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
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => copyMessage(item.fan.id, item.message)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${copiedId === item.fan.id ? "bg-green-500/20 text-green-300 border border-green-500/30" : "bg-brand-500 text-white hover:bg-brand-600"}`}>
                        {copiedId === item.fan.id ? "Copied!" : "Copy Message"}
                      </button>
                      <button onClick={() => markMessaged(item.fan.id, item.fan.name)}
                        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-green-300 hover:border-green-500/30 transition"
                        title="Mark as messaged">
                        ✓ Sent
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {revenueAtRisk > 0 && (
              <p className="mt-3 text-xs text-red-400">⚠ ${revenueAtRisk.toLocaleString()} in revenue from high-risk fans</p>
            )}
          </div>
        )}

        {/* Retention Stats — Pro locked */}
        {fans.length >= 3 && (
          <div className="relative mb-6">
            {!isPro && <ProLock feature="Unlock retention analytics to see which fans are at risk" onUpgrade={handleUpgrade} />}
            <div className="grid gap-3 sm:grid-cols-4">
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
          </div>
        )}

        {/* Pro Analytics Section — Engagement Heatmap + Fan Spending Distribution */}
        {fans.length >= 3 && (
          <div className="relative mb-6">
            {!isPro && <ProLock feature="Unlock advanced analytics: engagement heatmap, spending breakdown, and more" onUpgrade={handleUpgrade} />}
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Engagement Heatmap */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span>📅</span> Messaging Activity
                  <span className="rounded-full bg-brand-500/20 border border-brand-500/30 px-1.5 py-0.5 text-[10px] font-medium text-brand-400">PRO</span>
                </h3>
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    const days = Array.from({ length: 28 }, (_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() - (27 - i));
                      const dateStr = d.toISOString().split("T")[0];
                      const count = fans.filter(f => f.last_message_at?.startsWith(dateStr)).length;
                      return { date: d, count };
                    });
                    return days.map((d, i) => (
                      <div key={i} title={`${d.date.toLocaleDateString()}: ${d.count} messaged`}
                        className={`aspect-square rounded-sm ${
                          d.count >= 3 ? "bg-brand-500" : d.count >= 2 ? "bg-brand-500/70" : d.count >= 1 ? "bg-brand-500/40" : "bg-white/5"
                        }`} />
                    ));
                  })()}
                </div>
                <div className="flex items-center gap-2 mt-3 text-[10px] text-[var(--muted)]">
                  <span>Less</span>
                  <div className="flex gap-0.5">
                    <div className="h-2.5 w-2.5 rounded-sm bg-white/5" />
                    <div className="h-2.5 w-2.5 rounded-sm bg-brand-500/40" />
                    <div className="h-2.5 w-2.5 rounded-sm bg-brand-500/70" />
                    <div className="h-2.5 w-2.5 rounded-sm bg-brand-500" />
                  </div>
                  <span>More</span>
                </div>
              </div>

              {/* Spending Distribution */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span>💎</span> Fan Value Tiers
                  <span className="rounded-full bg-brand-500/20 border border-brand-500/30 px-1.5 py-0.5 text-[10px] font-medium text-brand-400">PRO</span>
                </h3>
                <div className="space-y-2">
                  {(() => {
                    const tiers = [
                      { label: "Diamond ($5k+)", min: 5000, color: "bg-cyan-500", text: "text-cyan-300" },
                      { label: "Gold ($1k+)", min: 1000, color: "bg-yellow-500", text: "text-yellow-300" },
                      { label: "Silver ($500+)", min: 500, color: "bg-gray-400", text: "text-gray-300" },
                      { label: "Bronze ($100+)", min: 100, color: "bg-amber-700", text: "text-amber-500" },
                      { label: "Starter (<$100)", min: 0, color: "bg-white/20", text: "text-[var(--muted)]" },
                    ];
                    return tiers.map(t => {
                      const count = t.min === 0
                        ? fans.filter(f => (f.total_spent || 0) < 100).length
                        : fans.filter(f => {
                            const s = f.total_spent || 0;
                            const nextTier = tiers[tiers.indexOf(t) - 1];
                            return s >= t.min && (!nextTier || s < nextTier.min);
                          }).length;
                      return (
                        <div key={t.label} className="flex items-center gap-3">
                          <div className={`h-3 w-3 rounded-full ${t.color}`} />
                          <span className={`text-xs flex-1 ${t.text}`}>{t.label}</span>
                          <span className="text-xs font-medium">{count}</span>
                          <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div className={`h-full rounded-full ${t.color}`} style={{ width: `${fans.length > 0 ? (count / fans.length) * 100 : 0}%` }} />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
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

        {/* Fan of the Month Spotlight */}
        {fans.length >= 3 && (() => {
          const now = Date.now();
          const monthAgo = now - 30 * 86400000;
          const topThisMonth = [...fans]
            .filter(f => f.last_message_at && new Date(f.last_message_at).getTime() >= monthAgo)
            .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))[0];
          if (!topThisMonth) return null;
          return (
            <div className="mb-6 rounded-xl border border-brand-500/30 bg-gradient-to-r from-brand-500/10 to-transparent p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/20 border border-brand-500/30 text-xl font-bold text-brand-400 shrink-0">
                  {topThisMonth.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] uppercase tracking-wider text-brand-400 font-semibold">Fan of the Month</span>
                  </div>
                  <p className="font-bold truncate">{topThisMonth.name}</p>
                  <p className="text-xs text-[var(--muted)]">${(topThisMonth.total_spent || 0).toLocaleString()} lifetime &middot; {TAG_LABELS[topThisMonth.tag]}</p>
                </div>
                <button onClick={() => setSelected(topThisMonth)} className="shrink-0 rounded-lg border border-brand-500/30 px-3 py-1.5 text-xs font-medium text-brand-400 hover:bg-brand-500/20 transition">
                  View
                </button>
              </div>
            </div>
          );
        })()}

        {/* Creator Tips — Pro locked */}
        {fans.length >= 2 && (
          <div className="relative mb-6">
            {!isPro && <ProLock feature="Unlock personalized creator tips and growth strategies" onUpgrade={handleUpgrade} />}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span>💡</span> Growth Tips
                <span className="rounded-full bg-brand-500/20 border border-brand-500/30 px-1.5 py-0.5 text-[10px] font-medium text-brand-400">PRO</span>
              </h3>
              <div className="space-y-2">
                {(() => {
                  const tips: string[] = [];
                  const engagement = fans.length > 0 ? weeklySummary.messaged7d / fans.length : 0;
                  if (engagement < 0.3) tips.push("Your engagement rate is below 30%. Try messaging at least 3 fans today using the Action Center above.");
                  if (fans.filter(f => f.tag === "at-risk").length > fans.length * 0.2) tips.push("Over 20% of your fans are tagged At-Risk. Focus on win-back messages this week — the 'Win Back' template works great.");
                  if (fans.filter(f => !f.last_message_at).length > 0) tips.push(`${fans.filter(f => !f.last_message_at).length} fan${fans.filter(f => !f.last_message_at).length !== 1 ? "s have" : " has"} never been messaged. Send them a Welcome message to start building a relationship.`);
                  if (fans.filter(f => f.tag === "whale").length === 0 && fans.some(f => (f.total_spent || 0) >= 500)) tips.push("You have high-spending fans that aren't tagged as Whales. Use Smart Suggestions to fix this and give them VIP treatment.");
                  if (urgentRenewals > 0) tips.push(`${urgentRenewals} fan${urgentRenewals !== 1 ? "s renew" : " renews"} in the next 3 days. Send them a Renewal Reminder now — it takes 30 seconds.`);
                  if (tips.length === 0) tips.push("You're doing great! Keep engaging with your fans regularly and they'll stick around longer.");
                  return tips.slice(0, 3).map((tip, i) => (
                    <div key={i} className="flex gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
                      <span className="shrink-0 text-brand-400 mt-0.5">→</span>
                      <p className="text-xs text-[var(--muted)] leading-relaxed">{tip}</p>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Best Time to Message + Quick Actions — Pro locked */}
        {fans.length >= 3 && (
          <div className="relative mb-6">
            {!isPro && <ProLock feature="Unlock messaging insights and quick actions" onUpgrade={handleUpgrade} />}
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Best Time to Message */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span>🕐</span> Best Time to Message
                  <span className="rounded-full bg-brand-500/20 border border-brand-500/30 px-1.5 py-0.5 text-[10px] font-medium text-brand-400">PRO</span>
                </h3>
                {(() => {
                  const hourCounts = new Array(24).fill(0);
                  const dayCounts = new Array(7).fill(0);
                  fans.forEach(f => {
                    if (f.last_message_at) {
                      const d = new Date(f.last_message_at);
                      hourCounts[d.getHours()]++;
                      dayCounts[d.getDay()]++;
                    }
                  });
                  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
                  const peakDay = dayCounts.indexOf(Math.max(...dayCounts));
                  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                  const formatHour = (h: number) => h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;
                  const maxH = Math.max(...hourCounts, 1);
                  return (
                    <>
                      <div className="flex gap-[2px] h-16 items-end mb-3">
                        {hourCounts.map((c, i) => (
                          <div key={i} className="flex-1 relative group">
                            <div className={`w-full rounded-t-sm ${i === peakHour ? "bg-brand-500" : "bg-brand-500/30"}`}
                              style={{ height: `${(c / maxH) * 100}%`, minHeight: c > 0 ? "2px" : 0 }}
                              title={`${formatHour(i)}: ${c} messages`} />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-[10px] text-[var(--muted)] mb-3">
                        <span>12AM</span><span>6AM</span><span>12PM</span><span>6PM</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="text-xs text-[var(--muted)]">Peak Hour</p>
                          <p className="text-sm font-semibold text-brand-400">{formatHour(peakHour)}</p>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-[var(--muted)]">Peak Day</p>
                          <p className="text-sm font-semibold text-brand-400">{dayNames[peakDay]}</p>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Quick Actions */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span>🚀</span> Quick Actions
                  <span className="rounded-full bg-brand-500/20 border border-brand-500/30 px-1.5 py-0.5 text-[10px] font-medium text-brand-400">PRO</span>
                </h3>
                <div className="space-y-2">
                  {[
                    { label: "Message all at-risk fans", icon: "⚠", count: fans.filter(f => f.tag === "at-risk").length,
                      action: () => { setFilter("at-risk"); setToast("Filtered to at-risk fans"); } },
                    { label: "Export whale data", icon: "🐋", count: fans.filter(f => f.tag === "whale").length,
                      action: () => {
                        const whales = fans.filter(f => f.tag === "whale");
                        const headers = ["Name", "Spent", "Last Message", "Platform"];
                        const rows = whales.map(f => [f.name, String(f.total_spent || 0), f.last_message_at || "", f.platform || ""]);
                        const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
                        const blob = new Blob([csv], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a"); a.href = url; a.download = "whales-export.csv"; a.click();
                        URL.revokeObjectURL(url);
                        setToast("Whale data exported!");
                      }},
                    { label: "Mark all unmessaged", icon: "✉", count: fans.filter(f => !f.last_message_at).length,
                      action: () => { setFilter("all"); setSearch(""); setToast(`${fans.filter(f => !f.last_message_at).length} unmessaged fans — message them now!`); } },
                    { label: "View renewal alerts", icon: "📅", count: urgentRenewals,
                      action: () => { setToast(`${urgentRenewals} fans renewing within 3 days`); } },
                  ].filter(a => a.count > 0).map(qa => (
                    <button key={qa.label} onClick={qa.action}
                      className="w-full flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-left hover:bg-white/5 transition">
                      <span className="text-sm">{qa.icon}</span>
                      <span className="flex-1 text-xs">{qa.label}</span>
                      <span className="rounded-full bg-brand-500/20 border border-brand-500/30 px-2 py-0.5 text-[10px] font-medium text-brand-400">{qa.count}</span>
                    </button>
                  ))}
                  {fans.filter(f => f.tag === "at-risk").length === 0 && urgentRenewals === 0 && fans.filter(f => !f.last_message_at).length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-xs text-green-400">All caught up! No urgent actions needed.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Revenue by Tag Chart — Pro locked */}
        {fans.length >= 2 && (() => {
          const tagRevenue: Record<string, number> = {};
          fans.forEach((f) => { tagRevenue[f.tag] = (tagRevenue[f.tag] || 0) + (f.total_spent || 0); });
          const entries = Object.entries(tagRevenue).sort((a, b) => b[1] - a[1]);
          const max = Math.max(...entries.map((e) => e[1]), 1);
          const TAG_BAR_COLORS: Record<string, string> = {
            whale: "bg-purple-500", vip: "bg-amber-500", regular: "bg-blue-500", new: "bg-green-500", "at-risk": "bg-red-500",
          };
          return (
            <div className="relative mb-6">
              {!isPro && <ProLock feature="Unlock revenue breakdown by fan category" onUpgrade={handleUpgrade} />}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  Revenue by Tag
                  {!isPro && <span className="rounded-full bg-brand-500/20 border border-brand-500/30 px-1.5 py-0.5 text-[10px] font-medium text-brand-400">PRO</span>}
                </h3>
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
            </div>
          );
        })()}

        {/* Revenue Trend — Pro locked */}
        {fans.length >= 3 && (
          <div className="relative mb-6">
            {!isPro && <ProLock feature="Unlock revenue trends to see your growth over time" onUpgrade={handleUpgrade} />}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <span>📊</span> Revenue Trend (6 Months)
                <span className="rounded-full bg-brand-500/20 border border-brand-500/30 px-1.5 py-0.5 text-[10px] font-medium text-brand-400">PRO</span>
              </h3>
              <div className="flex items-end gap-2 h-32">
                {(() => {
                  const maxRev = Math.max(...revenueTrend.map(m => m.revenue), 1);
                  return revenueTrend.map((m, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-[var(--muted)] font-medium">${m.revenue > 999 ? `${(m.revenue / 1000).toFixed(1)}k` : m.revenue.toLocaleString()}</span>
                      <div className="w-full flex justify-center">
                        <div
                          className={`w-full max-w-[40px] rounded-t-md transition-all ${i === revenueTrend.length - 1 ? "bg-brand-500" : "bg-brand-500/40"}`}
                          style={{ height: `${Math.max(4, (m.revenue / maxRev) * 100)}px` }}
                          title={`${m.label}: $${m.revenue.toLocaleString()} from ${m.fans} new fans`}
                        />
                      </div>
                      <span className="text-[10px] text-[var(--muted)]">{m.label}</span>
                    </div>
                  ));
                })()}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-[var(--muted)]">
                <span>{revenueTrend.reduce((s, m) => s + m.fans, 0)} fans added in 6 months</span>
                <span>${revenueTrend.reduce((s, m) => s + m.revenue, 0).toLocaleString()} total</span>
              </div>
            </div>
          </div>
        )}

        {/* Performance: This Month vs Last — Pro locked */}
        {fans.length >= 3 && (
          <div className="relative mb-6">
            {!isPro && <ProLock feature="Unlock monthly performance comparison to track your growth" onUpgrade={handleUpgrade} />}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <span>⚡</span> This Month vs Last Month
                <span className="rounded-full bg-brand-500/20 border border-brand-500/30 px-1.5 py-0.5 text-[10px] font-medium text-brand-400">PRO</span>
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "New Fans", current: perfComparison.newFans.current, prev: perfComparison.newFans.prev, fmt: (v: number) => String(v) },
                  { label: "Revenue", current: perfComparison.revenue.current, prev: perfComparison.revenue.prev, fmt: (v: number) => `$${v.toLocaleString()}` },
                  { label: "Fans Messaged", current: perfComparison.messaged.current, prev: perfComparison.messaged.prev, fmt: (v: number) => String(v) },
                ].map(stat => {
                  const diff = stat.prev > 0 ? Math.round(((stat.current - stat.prev) / stat.prev) * 100) : stat.current > 0 ? 100 : 0;
                  const up = stat.current >= stat.prev;
                  return (
                    <div key={stat.label} className="text-center">
                      <p className="text-xs text-[var(--muted)] mb-1">{stat.label}</p>
                      <p className="text-xl font-bold">{stat.fmt(stat.current)}</p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        {stat.prev > 0 || stat.current > 0 ? (
                          <>
                            <span className={`text-xs font-medium ${up ? "text-green-400" : "text-red-400"}`}>
                              {up ? "↑" : "↓"} {Math.abs(diff)}%
                            </span>
                            <span className="text-[10px] text-[var(--muted)]">vs {stat.fmt(stat.prev)}</span>
                          </>
                        ) : (
                          <span className="text-[10px] text-[var(--muted)]">no data yet</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Revenue Milestones — Pro locked */}
        {fans.length >= 1 && totalRevenue > 0 && (
          <div className="relative mb-6">
            {!isPro && <ProLock feature="Unlock revenue milestone tracking and celebrations" onUpgrade={handleUpgrade} />}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <span>🏅</span> Revenue Milestones
                <span className="rounded-full bg-brand-500/20 border border-brand-500/30 px-1.5 py-0.5 text-[10px] font-medium text-brand-400">PRO</span>
              </h3>
              <div className="space-y-3">
                {[
                  { amount: 500, label: "$500", icon: "🌱" },
                  { amount: 1000, label: "$1K", icon: "⭐" },
                  { amount: 5000, label: "$5K", icon: "🔥" },
                  { amount: 10000, label: "$10K", icon: "💎" },
                  { amount: 25000, label: "$25K", icon: "🚀" },
                  { amount: 50000, label: "$50K", icon: "👑" },
                  { amount: 100000, label: "$100K", icon: "🏆" },
                ].map(milestone => {
                  const pct = Math.min(100, (totalRevenue / milestone.amount) * 100);
                  const reached = totalRevenue >= milestone.amount;
                  return (
                    <div key={milestone.amount}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{milestone.icon}</span>
                          <span className={`text-sm font-medium ${reached ? "text-green-400" : ""}`}>{milestone.label}</span>
                          {reached && <span className="text-xs text-green-400">Reached!</span>}
                        </div>
                        <span className="text-xs text-[var(--muted)]">
                          {reached ? "✓" : `$${(milestone.amount - totalRevenue).toLocaleString()} to go`}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${reached ? "bg-green-500" : "bg-brand-500"}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Fan LTV Estimator — Pro locked */}
        {fans.length >= 3 && (
          <div className="relative mb-6">
            {!isPro && <ProLock feature="Unlock fan lifetime value predictions" onUpgrade={handleUpgrade} />}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <span>💰</span> Fan Lifetime Value Estimator
                <span className="rounded-full bg-brand-500/20 border border-brand-500/30 px-1.5 py-0.5 text-[10px] font-medium text-brand-400">PRO</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(() => {
                  const totalMonths = (() => {
                    const oldest = fans.reduce((min, f) => {
                      if (!f.created_at) return min;
                      const t = new Date(f.created_at).getTime();
                      return t < min ? t : min;
                    }, Date.now());
                    return Math.max(1, Math.round((Date.now() - oldest) / (30 * 86400000)));
                  })();
                  const monthlyRevPerFan = avgSpend / totalMonths;
                  const projectedAnnualPerFan = monthlyRevPerFan * 12;
                  const projected6mo = monthlyRevPerFan * fans.length * 6;
                  const projected12mo = projectedAnnualPerFan * fans.length;

                  return [
                    { label: "Avg Monthly/Fan", value: `$${Math.round(monthlyRevPerFan).toLocaleString()}` },
                    { label: "Projected Annual/Fan", value: `$${Math.round(projectedAnnualPerFan).toLocaleString()}` },
                    { label: "6-Month Forecast", value: `$${Math.round(projected6mo).toLocaleString()}` },
                    { label: "12-Month Forecast", value: `$${Math.round(projected12mo).toLocaleString()}` },
                  ].map(stat => (
                    <div key={stat.label} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-center">
                      <p className="text-lg font-bold text-brand-400">{stat.value}</p>
                      <p className="text-[10px] text-[var(--muted)] mt-0.5">{stat.label}</p>
                    </div>
                  ));
                })()}
              </div>
              <p className="text-xs text-[var(--muted)] mt-3">
                Based on current spending patterns. Grow your fan base and engagement to increase projections.
              </p>
            </div>
          </div>
        )}

        {/* Top Fans Leaderboard + Smart Tag Suggestions — Pro locked */}
        {fans.length >= 3 && (
          <div className="relative mb-6">
            {!isPro && <ProLock feature="Unlock leaderboard and AI tag suggestions" onUpgrade={handleUpgrade} />}
            <div className="grid gap-3 sm:grid-cols-2">
            {/* Leaderboard */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span>🏆</span> Top Fans
              </h3>
              <div className="space-y-2">
                {[...fans].sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0)).slice(0, 5).map((fan, i) => {
                  const medals = ["🥇", "🥈", "🥉"];
                  return (
                    <div key={fan.id} onClick={() => setSelected(fan)} className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/5 cursor-pointer transition">
                      <span className="text-lg w-6 text-center">{medals[i] || `#${i + 1}`}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{fan.name}</p>
                        <p className="text-xs text-[var(--muted)]">{TAG_LABELS[fan.tag]}</p>
                      </div>
                      <p className="text-sm font-semibold text-brand-400">${(fan.total_spent || 0).toLocaleString()}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Smart Tag Suggestions */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span>💡</span> Smart Suggestions
              </h3>
              <div className="space-y-2">
                {(() => {
                  const suggestions: { fan: Fan; suggestion: string; newTag: Tag; reason: string }[] = [];
                  fans.forEach(f => {
                    if (f.tag !== "whale" && f.total_spent >= 500) {
                      suggestions.push({ fan: f, suggestion: `Upgrade to Whale`, newTag: "whale", reason: `$${f.total_spent.toLocaleString()} spent` });
                    } else if (f.tag !== "vip" && f.tag !== "whale" && f.total_spent >= 150) {
                      suggestions.push({ fan: f, suggestion: `Upgrade to VIP`, newTag: "vip", reason: `$${f.total_spent.toLocaleString()} spent` });
                    }
                    if (f.tag !== "at-risk" && f.last_message_at) {
                      const days = Math.floor((Date.now() - new Date(f.last_message_at).getTime()) / 86400000);
                      if (days >= 14) {
                        suggestions.push({ fan: f, suggestion: `Mark At-Risk`, newTag: "at-risk", reason: `${days}d inactive` });
                      }
                    }
                  });
                  if (suggestions.length === 0) return (
                    <div className="text-center py-6">
                      <p className="text-sm text-green-400 font-medium">All fans are properly tagged!</p>
                      <p className="text-xs text-[var(--muted)] mt-1">No changes needed right now.</p>
                    </div>
                  );
                  return suggestions.slice(0, 5).map(s => (
                    <div key={`${s.fan.id}-${s.newTag}`} className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.fan.name}</p>
                        <p className="text-xs text-[var(--muted)]">{s.reason}</p>
                      </div>
                      <button onClick={async () => {
                        await supabase.from("fans").update({ tag: s.newTag }).eq("id", s.fan.id);
                        setFans(prev => prev.map(f => f.id === s.fan.id ? { ...f, tag: s.newTag } : f));
                        setToast(`${s.fan.name} tagged as ${TAG_LABELS[s.newTag]}!`);
                      }} className="shrink-0 rounded-lg bg-brand-500/20 border border-brand-500/30 px-2.5 py-1 text-xs font-medium text-brand-400 hover:bg-brand-500/30 transition">
                        {s.suggestion}
                      </button>
                    </div>
                  ));
                })()}
              </div>
            </div>
            </div>
          </div>
        )}

        {/* Recent Activity Feed — Pro locked */}
        {fans.length >= 3 && (
          <div className="relative mb-6">
            {!isPro && <ProLock feature="Unlock live activity feed to see recent fan interactions" onUpgrade={handleUpgrade} />}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span>📡</span> Recent Activity
                <span className="rounded-full bg-brand-500/20 border border-brand-500/30 px-1.5 py-0.5 text-[10px] font-medium text-brand-400">PRO</span>
              </h3>
              <div className="space-y-2">
                {(() => {
                  type ActivityItem = { fan: Fan; type: string; detail: string; time: string; color: string };
                  const activities: ActivityItem[] = [];
                  fans.forEach(f => {
                    if (f.last_message_at) {
                      activities.push({ fan: f, type: "messaged", detail: `You messaged ${f.name}`, time: f.last_message_at, color: "text-green-400" });
                    }
                    if (f.created_at) {
                      activities.push({ fan: f, type: "added", detail: `${f.name} was added`, time: f.created_at, color: "text-blue-400" });
                    }
                    if (f.renewal_date) {
                      const d = Math.floor((new Date(f.renewal_date).getTime() - Date.now()) / 86400000);
                      if (d >= 0 && d <= 3) {
                        activities.push({ fan: f, type: "renewal", detail: `${f.name} renews ${d === 0 ? "today" : d === 1 ? "tomorrow" : `in ${d} days`}`, time: f.renewal_date, color: "text-amber-400" });
                      }
                    }
                  });
                  return activities
                    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                    .slice(0, 6)
                    .map((a, i) => (
                      <div key={`${a.fan.id}-${a.type}-${i}`} className="flex items-center gap-3 text-xs">
                        <span className={`${a.color}`}>
                          {a.type === "messaged" ? "✉" : a.type === "added" ? "+" : "⏰"}
                        </span>
                        <span className="flex-1 text-[var(--muted)]">{a.detail}</span>
                        <span className="text-[var(--muted)] shrink-0">{daysAgo(a.time)}</span>
                      </div>
                    ));
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Saved Segments — Pro locked */}
        {isPro && savedSegments.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--muted)] mr-1">Segments:</span>
            {savedSegments.map(seg => (
              <div key={seg.id} className="group flex items-center gap-1">
                <button onClick={() => loadSegment(seg)}
                  className="rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-400 hover:bg-brand-500/20 transition">
                  {seg.name}
                </button>
                <button onClick={() => deleteSegment(seg.id)}
                  className="opacity-0 group-hover:opacity-100 text-[10px] text-[var(--muted)] hover:text-red-400 transition -ml-0.5">
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Search + Filters */}
        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search fans..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] pl-10 pr-10 py-2 text-sm text-white outline-none focus:border-brand-500 transition placeholder:text-[var(--muted)]"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-block rounded border border-[var(--border)] bg-[var(--bg)] px-1.5 py-0.5 text-[10px] text-[var(--muted)] font-mono">/</kbd>
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
            {isPro && (filter !== "all" || search.trim()) && (
              showSegmentSave ? (
                <div className="flex items-center gap-1.5">
                  <input type="text" value={segmentName} onChange={e => setSegmentName(e.target.value)}
                    placeholder="Segment name..." autoFocus
                    onKeyDown={e => { if (e.key === "Enter") saveSegment(); if (e.key === "Escape") setShowSegmentSave(false); }}
                    className="rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs text-white outline-none w-32" />
                  <button onClick={saveSegment} disabled={!segmentName.trim()}
                    className="rounded-full bg-brand-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-600 transition disabled:opacity-50">Save</button>
                  <button onClick={() => setShowSegmentSave(false)} className="text-xs text-[var(--muted)] hover:text-white">&times;</button>
                </div>
              ) : (
                <button onClick={() => { setSegmentName(""); setShowSegmentSave(true); }}
                  className="rounded-full border border-dashed border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)] hover:text-brand-400 hover:border-brand-500/30 transition">
                  + Save Segment
                </button>
              )
            )}
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {bulkSelected.size > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-brand-500/30 bg-brand-500/5 p-3">
            <span className="text-sm font-medium">{bulkSelected.size} selected</span>
            <button onClick={bulkMarkMessaged}
              className="rounded-lg bg-green-500/20 border border-green-500/30 px-3 py-1.5 text-xs font-medium text-green-300 hover:bg-green-500/30 transition">
              ✓ Mark All Messaged
            </button>
            <div className="relative">
              <button onClick={() => setShowBulkTag(!showBulkTag)}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] hover:text-white transition">
                Change Tag ▾
              </button>
              {showBulkTag && (
                <div className="absolute top-full left-0 mt-1 z-20 rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg py-1 min-w-[120px]">
                  {(["whale", "vip", "regular", "new", "at-risk"] as Tag[]).map(t => (
                    <button key={t} onClick={() => bulkChangeTag(t)}
                      className="block w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 transition">
                      {TAG_LABELS[t]}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setBulkSelected(new Set())}
              className="ml-auto text-xs text-[var(--muted)] hover:text-white transition">
              Clear
            </button>
          </div>
        )}

        {/* Tip: Click on a fan */}
        {fans.length > 0 && !selected && !onboardingDismissed && (() => {
          try { if (localStorage.getItem("crm_fan_tip_dismissed")) return null; } catch {}
          return (
            <div className="mb-3 flex items-center justify-between rounded-lg border border-brand-500/20 bg-brand-500/5 px-4 py-2.5">
              <p className="text-xs text-[var(--muted)]">
                <span className="text-brand-400 font-medium">Tip:</span> Click on any fan to see their profile, DM scripts, churn risk, and more
              </p>
              <button onClick={() => { try { localStorage.setItem("crm_fan_tip_dismissed", "1"); } catch {} }}
                className="text-[10px] text-[var(--muted)] hover:text-white transition ml-4 shrink-0">Dismiss</button>
            </div>
          );
        })()}

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
                      <div className="flex items-center gap-2">
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${TAG_COLORS[fan.tag]}`}>
                          {fan.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium">{fan.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] ${cl.color}`}>{cl.text}</span>
                        <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${TAG_COLORS[fan.tag]}`}>{TAG_LABELS[fan.tag]}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                      <span>${(fan.total_spent || 0).toLocaleString()}</span>
                      <span>Renewal: {daysUntil(fan.renewal_date)}</span>
                      {fan.platform && PLATFORM_LABELS[fan.platform] && (
                        <span className={`rounded-full border px-1.5 py-0.5 text-[10px] ${PLATFORM_LABELS[fan.platform].color}`}>{PLATFORM_LABELS[fan.platform].label}</span>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
              {/* Desktop Table */}
              <table className="hidden sm:table w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                    <th className="pl-4 pr-1 py-3 w-8">
                      <input type="checkbox" checked={bulkSelected.size === filtered.length && filtered.length > 0}
                        onChange={toggleSelectAll}
                        className="h-3.5 w-3.5 rounded border-[var(--border)] accent-brand-500 cursor-pointer" />
                    </th>
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
                    <tr key={fan.id} className={`group cursor-pointer border-b border-[var(--border)] transition hover:bg-white/5 ${bulkSelected.has(fan.id) ? "bg-brand-500/5" : ""}`}>
                      <td className="pl-4 pr-1 py-3" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={bulkSelected.has(fan.id)}
                          onChange={() => toggleBulkSelect(fan.id)}
                          className="h-3.5 w-3.5 rounded border-[var(--border)] accent-brand-500 cursor-pointer" />
                      </td>
                      <td className="px-4 py-3 font-medium" onClick={() => setSelected(fan)}>
                        <div className="flex items-center gap-2.5">
                          <div className={`hidden sm:flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${TAG_COLORS[fan.tag]}`}>
                            {fan.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <span>{fan.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3" onClick={() => setSelected(fan)}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${TAG_COLORS[fan.tag]}`}>{TAG_LABELS[fan.tag]}</span>
                          {fan.platform && PLATFORM_LABELS[fan.platform] && (
                            <span className={`hidden sm:inline-block rounded-full border px-1.5 py-0.5 text-[10px] ${PLATFORM_LABELS[fan.platform].color}`}>{PLATFORM_LABELS[fan.platform].label}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3" onClick={() => setSelected(fan)}>${(fan.total_spent || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 hidden md:table-cell" onClick={() => setSelected(fan)}>
                        <span className={(() => {
                          if (!fan.last_message_at) return "text-red-400";
                          const d = Math.floor((Date.now() - new Date(fan.last_message_at).getTime()) / 86400000);
                          return d <= 1 ? "text-green-400" : d <= 3 ? "text-[var(--muted)]" : d <= 7 ? "text-amber-400" : "text-red-400";
                        })()}>
                          {daysAgo(fan.last_message_at)}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={() => setSelected(fan)}>
                        <span className={(() => {
                          if (!fan.renewal_date) return "text-[var(--muted)]";
                          const d = Math.floor((new Date(fan.renewal_date).getTime() - Date.now()) / 86400000);
                          return d <= 1 ? "text-red-400 font-semibold" : d <= 3 ? "text-amber-400" : "text-[var(--muted)]";
                        })()}>
                          {daysUntil(fan.renewal_date)}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell" onClick={() => setSelected(fan)}>
                        <span className={`text-xs font-medium ${cl.color}`}>{cl.text}</span>
                      </td>
                      <td className="pr-3 py-3" onClick={() => setSelected(fan)}>
                        <svg className="h-4 w-4 text-[var(--muted)] opacity-0 group-hover:opacity-100 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* Result Count + Actions */}
        {fans.length > 0 && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-[var(--muted)]">
              Showing {filtered.length} of {fans.length} fans
              {search && ` matching "${search}"`}
            </p>
            <div className="flex items-center gap-2">
              {isPro && filtered.length > 0 && (
                <button onClick={() => { setBatchMessage(""); setShowBatchComposer(true); }}
                  className="rounded-lg border border-brand-500/30 px-2.5 py-1 text-[10px] font-medium text-brand-400 hover:bg-brand-500/10 transition">
                  Batch Message
                </button>
              )}
              <button onClick={() => setShowShortcuts(true)}
                className="rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--muted)] hover:text-white transition" title="Keyboard shortcuts">
                ?
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/60 animate-[fadeIn_0.2s_ease-out]" />
          <div className="relative w-full max-w-md bg-[var(--card)] border-l border-[var(--border)] p-6 overflow-y-auto animate-[slideInRight_0.25s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="absolute top-4 right-4 text-[var(--muted)] hover:text-white text-lg">✕</button>
            <div className="flex items-center gap-3 mb-1">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${TAG_COLORS[selected.tag]}`}>
                {selected.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold">{selected.name}</h2>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <div className="relative group">
                <select
                  value={selected.tag}
                  onChange={async (e) => {
                    const newTag = e.target.value as Tag;
                    await supabase.from("fans").update({ tag: newTag }).eq("id", selected.id);
                    setFans(prev => prev.map(f => f.id === selected.id ? { ...f, tag: newTag } : f));
                    setSelected(prev => prev ? { ...prev, tag: newTag } : null);
                    setToast(`${selected.name} tagged as ${TAG_LABELS[newTag]}!`);
                  }}
                  className={`appearance-none cursor-pointer rounded-full border px-3 py-0.5 text-xs font-medium pr-6 ${TAG_COLORS[selected.tag]} bg-transparent outline-none`}
                >
                  {(["whale", "vip", "regular", "new", "at-risk"] as Tag[]).map(t => (
                    <option key={t} value={t} className="bg-[var(--card)] text-white">{TAG_LABELS[t]}</option>
                  ))}
                </select>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] pointer-events-none opacity-50">▼</span>
              </div>
              {selected.platform && PLATFORM_LABELS[selected.platform] && (
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${PLATFORM_LABELS[selected.platform].color}`}>
                  {PLATFORM_LABELS[selected.platform].label}
                </span>
              )}
              {(selected.total_spent || 0) > avgSpend && avgSpend > 0 && (
                <span className="text-[10px] text-green-400">Above avg spend</span>
              )}
              {fans.length > 0 && (() => {
                const rank = [...fans].sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0)).findIndex(f => f.id === selected.id) + 1;
                const pct = Math.round((rank / fans.length) * 100);
                return <span className="text-[10px] text-[var(--muted)]">#{rank} of {fans.length} ({pct <= 10 ? "Top 10%" : pct <= 25 ? "Top 25%" : `Top ${pct}%`})</span>;
              })()}
            </div>
            <div className="space-y-4 mt-4">
              <div className="rounded-lg bg-white/5 p-4">
                <p className="text-xs text-[var(--muted)] mb-1">Lifetime Spent</p>
                <p className="text-lg font-bold">${(selected.total_spent || 0).toLocaleString()}</p>
                {avgSpend > 0 && (
                  <p className={`text-xs mt-1 ${(selected.total_spent || 0) >= avgSpend ? "text-green-400" : "text-amber-400"}`}>
                    {(selected.total_spent || 0) >= avgSpend ? "↑" : "↓"} {Math.abs(Math.round(((selected.total_spent || 0) - avgSpend) / avgSpend * 100))}% vs avg (${Math.round(avgSpend)})
                  </p>
                )}
              </div>
              <div className="rounded-lg bg-white/5 p-4">
                <p className="text-xs text-[var(--muted)] mb-1">Last Messaged</p>
                <p className={`font-medium ${(() => {
                  if (!selected.last_message_at) return "text-red-400";
                  const d = Math.floor((Date.now() - new Date(selected.last_message_at).getTime()) / 86400000);
                  return d <= 1 ? "text-green-400" : d <= 7 ? "" : "text-red-400";
                })()}`}>{daysAgo(selected.last_message_at)}</p>
              </div>
              <div className="rounded-lg bg-white/5 p-4">
                <p className="text-xs text-[var(--muted)] mb-1">Renewal In</p>
                <p className="font-medium">{daysUntil(selected.renewal_date)}</p>
              </div>
              {selected.created_at && (
                <div className="rounded-lg bg-white/5 p-4">
                  <p className="text-xs text-[var(--muted)] mb-1">Fan Since</p>
                  <p className="font-medium">
                    {(() => {
                      const days = Math.floor((Date.now() - new Date(selected.created_at!).getTime()) / 86400000);
                      if (days < 7) return `${days} day${days !== 1 ? "s" : ""}`;
                      if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) !== 1 ? "s" : ""}`;
                      if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) !== 1 ? "s" : ""}`;
                      return `${Math.floor(days / 365)} year${Math.floor(days / 365) !== 1 ? "s" : ""}`;
                    })()}
                  </p>
                </div>
              )}
              <div className="rounded-lg bg-white/5 p-4">
                <p className="text-xs text-[var(--muted)] mb-1">Notes</p>
                <textarea
                  defaultValue={selected.notes || ""}
                  placeholder="Add a note about this fan..."
                  rows={3}
                  className="w-full bg-transparent text-sm outline-none resize-none placeholder:text-[var(--muted)]/50"
                  onBlur={async (e) => {
                    const val = e.target.value.trim();
                    if (val !== (selected.notes || "")) {
                      const oldNote = selected.notes || "";
                      if (oldNote) {
                        setNotesHistory(prev => {
                          const fanHist = prev[selected.id] || [];
                          const updated = { ...prev, [selected.id]: [{ text: oldNote, at: new Date().toISOString() }, ...fanHist].slice(0, 10) };
                          try { localStorage.setItem("crm_notes_history", JSON.stringify(updated)); } catch {}
                          return updated;
                        });
                      }
                      await supabase.from("fans").update({ notes: val }).eq("id", selected.id);
                      setFans(prev => prev.map(f => f.id === selected.id ? { ...f, notes: val } : f));
                      setSelected(prev => prev ? { ...prev, notes: val } : null);
                      setToast("Notes saved!");
                    }
                  }}
                />
                {(notesHistory[selected.id] || []).length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[10px] text-[var(--muted)] hover:text-white transition">
                      Previous notes ({(notesHistory[selected.id] || []).length})
                    </summary>
                    <div className="mt-1.5 space-y-1.5 max-h-32 overflow-y-auto">
                      {(notesHistory[selected.id] || []).map((h, i) => (
                        <div key={i} className="rounded bg-white/5 px-2 py-1.5">
                          <p className="text-[10px] text-[var(--muted)]">{new Date(h.at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                          <p className="text-[11px]">{h.text}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
              {/* Milestones */}
              {getMilestones(selected.total_spent || 0).length > 0 && (
                <div className="rounded-lg bg-white/5 p-4">
                  <p className="text-xs text-[var(--muted)] mb-1">Milestone</p>
                  {getMilestones(selected.total_spent || 0).map(m => (
                    <p key={m.label} className={`font-semibold ${m.color}`}>🏆 {m.label}</p>
                  ))}
                </div>
              )}
              {/* Churn Score */}
              <div className="rounded-lg bg-white/5 p-4">
                <p className="text-xs text-[var(--muted)] mb-1">Churn Risk</p>
                <div className="flex items-center gap-3">
                  <p className={`text-lg font-bold ${churnLabel(churnScore(selected)).color}`}>
                    {churnScore(selected)}/100
                  </p>
                  <span className={`text-sm ${churnLabel(churnScore(selected)).color}`}>
                    {churnLabel(churnScore(selected)).text}
                  </span>
                </div>
              </div>
              {/* Activity Timeline */}
              <div className="rounded-lg bg-white/5 p-4">
                <p className="text-xs text-[var(--muted)] mb-3">Activity Timeline</p>
                <div className="relative pl-4 border-l border-[var(--border)] space-y-3">
                  {selected.last_message_at && (
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-[var(--card)]" />
                      <p className="text-xs font-medium">Last messaged</p>
                      <p className="text-[11px] text-[var(--muted)]">{new Date(selected.last_message_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ({daysAgo(selected.last_message_at)})</p>
                    </div>
                  )}
                  {selected.renewal_date && (
                    <div className="relative">
                      <div className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-[var(--card)] ${(() => { const d = Math.floor((new Date(selected.renewal_date).getTime() - Date.now()) / 86400000); return d <= 3 ? "bg-amber-500" : "bg-blue-500"; })()}`} />
                      <p className="text-xs font-medium">Renewal {new Date(selected.renewal_date) > new Date() ? "upcoming" : "past due"}</p>
                      <p className="text-[11px] text-[var(--muted)]">{new Date(selected.renewal_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ({daysUntil(selected.renewal_date)})</p>
                    </div>
                  )}
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-brand-500 border-2 border-[var(--card)]" />
                    <p className="text-xs font-medium">Tagged as {TAG_LABELS[selected.tag]}</p>
                    <p className="text-[11px] text-[var(--muted)]">${(selected.total_spent || 0).toLocaleString()} lifetime</p>
                  </div>
                  {selected.created_at && (
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[var(--muted)] border-2 border-[var(--card)]" />
                      <p className="text-xs font-medium">Fan added</p>
                      <p className="text-[11px] text-[var(--muted)]">{new Date(selected.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                  )}
                </div>
              </div>
              {/* Auto-tag suggestion */}
              {(() => {
                const spent = selected.total_spent || 0;
                let suggested: Tag | null = null;
                if (spent >= 500 && selected.tag !== "whale") suggested = "whale";
                else if (spent >= 100 && spent < 500 && selected.tag !== "vip" && selected.tag !== "whale") suggested = "vip";
                else if (selected.last_message_at) {
                  const daysSince = Math.floor((Date.now() - new Date(selected.last_message_at).getTime()) / 86400000);
                  if (daysSince > 14 && selected.tag !== "at-risk") suggested = "at-risk";
                }
                if (!suggested) return null;
                return (
                  <div className="rounded-lg border border-brand-500/20 bg-brand-500/5 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-brand-400">Tag suggestion</p>
                      <p className="text-[11px] text-[var(--muted)] mt-0.5">
                        {suggested === "whale" ? `$${spent.toLocaleString()} spent — consider tagging as Whale` :
                         suggested === "vip" ? `$${spent.toLocaleString()} spent — consider tagging as VIP` :
                         "No messages in 14+ days — consider tagging as At Risk"}
                      </p>
                    </div>
                    <button onClick={async () => {
                      await supabase.from("fans").update({ tag: suggested! }).eq("id", selected.id);
                      setFans(prev => prev.map(f => f.id === selected.id ? { ...f, tag: suggested! } : f));
                      setSelected(prev => prev ? { ...prev, tag: suggested! } : null);
                      setToast(`${selected.name} tagged as ${TAG_LABELS[suggested!]}!`);
                    }} className="rounded-lg bg-brand-500 px-3 py-1 text-[11px] font-medium text-white hover:bg-brand-600 transition whitespace-nowrap">
                      Apply
                    </button>
                  </div>
                );
              })()}
              {selected.tag === "at-risk" && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                  <p className="text-sm font-semibold text-red-300">Action Needed</p>
                  <p className="text-xs text-red-300/80 mt-1">This fan is at risk of churning. Send a personal message or exclusive offer before their renewal date.</p>
                </div>
              )}
              {/* DM Script Generator — Pro */}
              {isPro && (() => {
                const firstName = selected.name.split(" ")[0];
                const cs = churnScore(selected);
                const daysMsg = selected.last_message_at ? Math.floor((Date.now() - new Date(selected.last_message_at).getTime()) / 86400000) : null;
                const daysRenewal = selected.renewal_date ? Math.floor((new Date(selected.renewal_date).getTime() - Date.now()) / 86400000) : null;
                const spent = selected.total_spent || 0;

                const highChurn = [
                  `hey ${firstName} 💕 haven't heard from u in a bit, miss talking to u! got some new stuff coming that i think you'd really like.. wanna see? 👀`,
                  `${firstName}!! where have u been 😩 i miss u fr. i just dropped something i think you'd love, wanna check it out?`,
                  `hey ${firstName} 🥺 it's been a minute! just wanted to say i've been thinking about u. got something special coming up, wanna be first to see?`,
                  `hiii ${firstName}! i noticed u haven't been around much and i miss our chats 💗 everything okay? i'd love to catch up`,
                  `${firstName} heyy 💫 it's been too quiet without u lol. i've got some exclusive stuff dropping soon, thought of u first`,
                ];

                const renewal = [
                  `hey ${firstName} 💗 just wanted to say thank u so much for being here, it means everything. ur renewal's coming up and i have some really good stuff planned for u 😘`,
                  `${firstName}!! ur renewal is soon and i just wanna say i appreciate u sm 🥹 anything specific u wanna see? i gotchu`,
                  `hiii ${firstName} 💕 tysm for sticking around, u literally make my day. got some fire content coming ur way, stay tuned babe 🔥`,
                  `hey ${firstName} 🫶 renewal's coming up and i wanted u to know i see u and appreciate u! got any requests? i wanna spoil u a lil`,
                ];

                const whale = [
                  `${firstName} 😍 u are literally one of my fav people here and i just had to tell u. ur support means the world to me 💎 got something exclusive just for my top supporters, want in?`,
                  `hey ${firstName}!! just thinking about how grateful i am for u 🥹💗 u deserve something special.. i'm putting together something just for my VIPs, u interested?`,
                  `${firstName} omg i just wanted to say ur amazing and i appreciate u so much 💕 i'm doing a little something extra for my top supporters this week, u in? 👀`,
                  spent > 500 ? `hey ${firstName} 🫶 not everyone gets this msg but u've been such an incredible supporter. i wanna do something special just for u, any ideas? literally anything 💎` : `${firstName}!! ur literally the best 💗 i have a surprise for my top ppl coming soon and obv u made the list 😘`,
                ];

                const welcome = [
                  `hiii ${firstName}!! welcome 🎉💕 i'm so happy u're here!! don't be shy, my dms are always open. what kind of content are u most into? i wanna make sure u love it here 🥰`,
                  `${firstName}!! hey babe welcome 💗 tysm for subscribing, it means a lot fr. feel free to dm me anytime! what would u love to see more of?`,
                  `omg ${firstName} hii!! so glad u found me 🫶 i love chatting w my subs so don't be a stranger okay? lmk if there's anything specific u wanna see!`,
                  `welcome ${firstName}!! 🥳💕 i always like to personally say hi to new ppl. what made u subscribe? i'd love to get to know u!`,
                ];

                const reEngage = [
                  `hey ${firstName}! it's been a min since we talked, how are u? 💕 i posted some new stuff i think u'd really like, check it out when u get a chance!`,
                  `${firstName} hiii 👋 just checking in on u! hope everything's good. been posting a lot lately, would love to hear what u think 💗`,
                  `heyy ${firstName}! miss chatting w u 🥺 what have u been up to? i've got some new content i think is right up ur alley`,
                  `${firstName}! hey babe, been thinking about u 💫 how's ur week going? i dropped some stuff recently that i'm really proud of, lmk what u think!`,
                ];

                const casual = [
                  `hey ${firstName} 💕 just wanted to check in and say hi! how's ur day going? anything fun happening?`,
                  `${firstName}!! hiii 😊 what's good? just thinking about u and wanted to say hey 💗`,
                  `heyy ${firstName} 🫶 hope ur having an amazing day! just popping in to say hi and that i appreciate u being here`,
                  `${firstName} hey babe! 💫 how are u doing? i love hearing from u, tell me something good!`,
                  `hiii ${firstName}! just wanted to drop in and say ur awesome 💕 anything on ur mind?`,
                ];

                let scripts: string[] = [];
                let category = "";
                if (cs >= 60) { scripts = highChurn; category = "Win-Back"; }
                else if (daysRenewal !== null && daysRenewal >= 0 && daysRenewal <= 3) { scripts = renewal; category = "Renewal"; }
                else if (selected.tag === "whale") { scripts = whale; category = "VIP / Whale"; }
                else if (daysMsg === null) { scripts = welcome; category = "Welcome"; }
                else if (daysMsg > 7) { scripts = reEngage; category = "Re-Engage"; }
                else { scripts = casual; category = "Check-In"; }

                return (
                  <div className="rounded-lg border border-brand-500/20 bg-brand-500/5 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-brand-400">DM Scripts</p>
                        <span className="rounded-full bg-brand-500/20 px-1.5 py-0.5 text-[9px] font-medium text-brand-400">{category}</span>
                      </div>
                      <span className="text-[10px] text-[var(--muted)]">Pick one to copy</span>
                    </div>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {scripts.map((s, i) => (
                        <div key={i} className={`group relative rounded-lg border p-3 transition cursor-pointer hover:border-brand-500/40 ${copiedId === `dm-${i}` ? "border-green-500/40 bg-green-500/5" : "border-[var(--border)] bg-[var(--bg)]"}`}
                          onClick={() => { navigator.clipboard.writeText(s); setCopiedId(`dm-${i}`); setTimeout(() => setCopiedId(""), 2000); }}>
                          <p className="text-xs text-[var(--muted)] leading-relaxed pr-12">{s}</p>
                          <span className={`absolute top-2.5 right-2.5 rounded px-2 py-0.5 text-[10px] font-medium transition ${copiedId === `dm-${i}` ? "bg-green-500/20 text-green-300" : "bg-brand-500/20 text-brand-400 opacity-0 group-hover:opacity-100"}`}>
                            {copiedId === `dm-${i}` ? "Copied!" : "Copy"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              <div className="flex gap-3 pt-2">
                <button onClick={() => markMessaged(selected.id, selected.name)} className="flex-1 rounded-lg bg-green-500/20 border border-green-500/30 py-2 text-sm font-medium text-green-300 hover:bg-green-500/30 transition">
                  ✓ Mark Messaged
                </button>
              </div>
              <div className="flex gap-3">
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
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-[var(--card)] border border-[var(--border)] p-6 animate-[scaleIn_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
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
                <label className="block text-sm text-[var(--muted)] mb-1">Platform</label>
                <select value={fanForm.platform} onChange={(e) => setFanForm({ ...fanForm, platform: e.target.value as Platform })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 transition">
                  <option value="">Not specified</option>
                  <option value="onlyfans">OnlyFans</option>
                  <option value="fansly">Fansly</option>
                  <option value="patreon">Patreon</option>
                  <option value="twitch">Twitch</option>
                  <option value="youtube">YouTube</option>
                  <option value="instagram">Instagram</option>
                  <option value="twitter">Twitter / X</option>
                  <option value="tiktok">TikTok</option>
                  <option value="other">Other</option>
                </select>
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

      {/* Revenue Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setShowGoalModal(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative w-full max-w-sm rounded-xl bg-[var(--card)] border border-[var(--border)] p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Set Revenue Goal</h2>
            <p className="text-sm text-[var(--muted)] mb-4">Set a lifetime revenue target to track your progress.</p>
            <div className="relative mb-4">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">$</span>
              <input type="number" value={goalInput} onChange={(e) => setGoalInput(e.target.value)}
                placeholder="e.g. 10000"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] pl-7 pr-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 transition"
                min="1" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowGoalModal(false)} className="flex-1 rounded-lg border border-[var(--border)] py-2.5 text-sm font-medium text-[var(--muted)] hover:text-white transition">Cancel</button>
              <button onClick={() => saveRevenueGoal(goalInput)} disabled={!goalInput || parseFloat(goalInput) <= 0}
                className="flex-1 rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50">
                Save Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Hint */}
      <div className="hidden sm:flex fixed bottom-4 right-4 z-30 items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[10px] text-[var(--muted)] shadow-lg">
        <span><kbd className="rounded border border-[var(--border)] bg-[var(--bg)] px-1 py-0.5 font-mono">/</kbd> Search</span>
        <span><kbd className="rounded border border-[var(--border)] bg-[var(--bg)] px-1 py-0.5 font-mono">N</kbd> New fan</span>
        <span><kbd className="rounded border border-[var(--border)] bg-[var(--bg)] px-1 py-0.5 font-mono">T</kbd> Templates</span>
        <span><kbd className="rounded border border-[var(--border)] bg-[var(--bg)] px-1 py-0.5 font-mono">Esc</kbd> Close</span>
      </div>

      {/* Spotlight / Command Palette (Cmd+K) */}
      {showSpotlight && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] px-4" onClick={() => setShowSpotlight(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-2xl overflow-hidden animate-[slideUp_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
              <svg className="h-5 w-5 text-[var(--muted)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                autoFocus
                type="text"
                placeholder="Search fans, actions..."
                value={spotlightQuery}
                onChange={(e) => setSpotlightQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") setShowSpotlight(false); }}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
              />
              <kbd className="hidden sm:inline rounded border border-[var(--border)] bg-white/5 px-1.5 py-0.5 text-[10px] text-[var(--muted)]">ESC</kbd>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {/* Quick actions */}
              {!spotlightQuery.trim() && (
                <div className="mb-1">
                  <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Quick Actions</p>
                  {[
                    { label: "Add Fan", icon: "+", action: () => { setShowSpotlight(false); openAddModal(); }, kbd: "N" },
                    { label: "Message Templates", icon: "✉", action: () => { setShowSpotlight(false); setShowTemplates(true); }, kbd: "T" },
                    ...(isPro ? [
                      { label: "Batch Message", icon: "📨", action: () => { setShowSpotlight(false); setBatchMessage(""); setShowBatchComposer(true); }, kbd: "" },
                      { label: "Export CSV", icon: "↓", action: () => { setShowSpotlight(false); exportCSV(); }, kbd: "" },
                      { label: "Analytics", icon: "📊", action: () => { setShowSpotlight(false); router.push("/analytics"); }, kbd: "" },
                    ] : []),
                    { label: "Keyboard Shortcuts", icon: "⌨", action: () => { setShowSpotlight(false); setShowShortcuts(true); }, kbd: "?" },
                    { label: "Settings", icon: "⚙", action: () => { setShowSpotlight(false); router.push("/settings"); }, kbd: "" },
                    { label: "Help", icon: "?", action: () => { setShowSpotlight(false); router.push("/help"); }, kbd: "" },
                  ].map((a) => (
                    <button key={a.label} onClick={a.action}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--muted)] hover:bg-white/5 hover:text-white transition text-left">
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/5 border border-[var(--border)] text-xs shrink-0">{a.icon}</span>
                      <span className="flex-1">{a.label}</span>
                      {a.kbd && <kbd className="rounded border border-[var(--border)] bg-white/5 px-1.5 py-0.5 text-[10px] text-[var(--muted)]">{a.kbd}</kbd>}
                    </button>
                  ))}
                </div>
              )}
              {/* Fan search results */}
              {spotlightQuery.trim() && (() => {
                const q = spotlightQuery.toLowerCase();
                const matches = fans.filter(f => f.name.toLowerCase().includes(q)).slice(0, 8);
                return matches.length > 0 ? (
                  <div>
                    <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Fans</p>
                    {matches.map(f => (
                      <button key={f.id} onClick={() => { setShowSpotlight(false); setSelected(f); }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-white/5 transition text-left">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold shrink-0 ${TAG_COLORS[f.tag]}`}>
                          {f.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{f.name}</p>
                          <p className="text-xs text-[var(--muted)]">{TAG_LABELS[f.tag]} · ${f.total_spent.toLocaleString()}</p>
                        </div>
                        <span className="text-xs text-[var(--muted)] shrink-0">{daysAgo(f.last_message_at)}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-8 text-center">
                    <p className="text-sm text-[var(--muted)]">No fans matching &ldquo;{spotlightQuery}&rdquo;</p>
                  </div>
                );
              })()}
            </div>
            <div className="border-t border-[var(--border)] px-4 py-2 flex items-center justify-between text-[10px] text-[var(--muted)]">
              <span>Type to search fans</span>
              <div className="flex items-center gap-2">
                <span><kbd className="rounded border border-[var(--border)] bg-white/5 px-1 py-0.5">↑↓</kbd> navigate</span>
                <span><kbd className="rounded border border-[var(--border)] bg-white/5 px-1 py-0.5">↵</kbd> select</span>
              </div>
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

            {/* Custom Templates Section — Pro */}
            {isPro && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-400">Your Templates</h3>
                  {!showNewTemplateForm && (
                    <button onClick={() => setShowNewTemplateForm(true)}
                      className="rounded-lg bg-brand-500/20 border border-brand-500/30 px-2.5 py-1 text-xs font-medium text-brand-400 hover:bg-brand-500/30 transition">
                      + New Template
                    </button>
                  )}
                </div>
                {showNewTemplateForm && (
                  <div className="rounded-lg border border-brand-500/30 bg-brand-500/5 p-4 mb-3">
                    <input type="text" value={newTemplateTitle} onChange={e => setNewTemplateTitle(e.target.value)}
                      placeholder="Template name..."
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-white outline-none focus:border-brand-500 transition mb-2" />
                    <textarea value={newTemplateMsg} onChange={e => setNewTemplateMsg(e.target.value)}
                      placeholder="Write your message template..."
                      rows={3}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-white outline-none focus:border-brand-500 transition resize-none mb-2" />
                    <div className="flex gap-2">
                      <button onClick={saveCustomTemplate} disabled={!newTemplateTitle.trim() || !newTemplateMsg.trim()}
                        className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 transition disabled:opacity-50">
                        Save Template
                      </button>
                      <button onClick={() => { setShowNewTemplateForm(false); setNewTemplateTitle(""); setNewTemplateMsg(""); }}
                        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white transition">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {customTemplates.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {customTemplates.map(t => (
                      <div key={t.id} className="rounded-lg border border-brand-500/20 bg-brand-500/5 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{t.title}</span>
                            <span className="rounded-full bg-brand-500/20 border border-brand-500/30 px-2 py-0.5 text-[10px] font-medium text-brand-400">Custom</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => copyMessage(t.id, t.msg)}
                              className={`shrink-0 rounded px-2.5 py-1 text-xs font-medium transition ${copiedId === t.id ? "bg-green-500/20 text-green-300 border border-green-500/30" : "bg-brand-500/20 text-brand-400 border border-brand-500/30 hover:bg-brand-500/30"}`}>
                              {copiedId === t.id ? "Copied!" : "Copy"}
                            </button>
                            <button onClick={() => deleteCustomTemplate(t.id)}
                              className="rounded px-1.5 py-1 text-xs text-[var(--muted)] hover:text-red-400 transition">
                              &times;
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-[var(--muted)] leading-relaxed">{t.msg}</p>
                      </div>
                    ))}
                  </div>
                ) : !showNewTemplateForm && (
                  <p className="text-xs text-[var(--muted)] mb-4">No custom templates yet. Create one to save messages you use often.</p>
                )}
                <div className="border-t border-[var(--border)] pt-3 mb-1">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Built-in Templates</h3>
                </div>
              </div>
            )}

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

      {/* Keyboard Shortcuts Help */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setShowShortcuts(false)}>
          <div className="absolute inset-0 bg-black/60 animate-[fadeIn_0.2s_ease-out]" />
          <div className="relative w-full max-w-sm rounded-xl bg-[var(--card)] border border-[var(--border)] p-6 animate-[scaleIn_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowShortcuts(false)} className="absolute top-4 right-4 text-[var(--muted)] hover:text-white text-lg">&times;</button>
            <h2 className="text-lg font-bold mb-4">Keyboard Shortcuts</h2>
            <div className="space-y-2">
              {[
                { keys: ["/ ", "S"], desc: "Search fans" },
                { keys: ["N"], desc: "Add new fan" },
                { keys: ["T"], desc: "Open message templates" },
                { keys: ["Cmd", "K"], desc: "Command palette" },
                { keys: ["?"], desc: "Show this help" },
                { keys: ["Esc"], desc: "Close any panel" },
              ].map(shortcut => (
                <div key={shortcut.desc} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-[var(--muted)]">{shortcut.desc}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((k, i) => (
                      <span key={i}>
                        <kbd className="rounded border border-[var(--border)] bg-white/5 px-2 py-0.5 text-xs font-mono">{k}</kbd>
                        {i < shortcut.keys.length - 1 && <span className="text-[10px] text-[var(--muted)] mx-0.5">+</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Batch Message Composer — Pro */}
      {showBatchComposer && isPro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setShowBatchComposer(false)}>
          <div className="absolute inset-0 bg-black/60 animate-[fadeIn_0.2s_ease-out]" />
          <div className="relative w-full max-w-lg rounded-xl bg-[var(--card)] border border-[var(--border)] p-6 animate-[scaleIn_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowBatchComposer(false)} className="absolute top-4 right-4 text-[var(--muted)] hover:text-white text-lg">&times;</button>
            <h2 className="text-lg font-bold mb-2">Batch Message Composer</h2>
            <p className="text-xs text-[var(--muted)] mb-4">
              Write a message once, copy personalized versions for {filtered.length} fan{filtered.length !== 1 ? "s" : ""} in your current view.
            </p>
            <div className="mb-4">
              <label className="block text-sm text-[var(--muted)] mb-1">
                Message Template <span className="text-[10px]">(use {"{name}"} for fan name)</span>
              </label>
              <textarea
                value={batchMessage}
                onChange={(e) => setBatchMessage(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 transition"
                rows={3}
                placeholder="Hey {name}! Just wanted to check in..."
              />
            </div>
            {batchMessage.trim() && (
              <div className="mb-4 max-h-48 overflow-y-auto space-y-1.5">
                <p className="text-xs font-medium text-[var(--muted)] mb-2">Preview ({Math.min(filtered.length, 5)} of {filtered.length}):</p>
                {filtered.slice(0, 5).map(fan => (
                  <div key={fan.id} className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-2">
                    <span className="text-xs font-medium shrink-0">{fan.name}:</span>
                    <span className="text-xs text-[var(--muted)] truncate">{batchMessage.replace(/\{name\}/gi, fan.name.split(" ")[0])}</span>
                    <button onClick={() => { navigator.clipboard.writeText(batchMessage.replace(/\{name\}/gi, fan.name.split(" ")[0])); setCopiedId(fan.id); setTimeout(() => setCopiedId(""), 2000); }}
                      className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-medium transition ${copiedId === fan.id ? "bg-green-500/20 text-green-300" : "bg-brand-500/20 text-brand-400 hover:bg-brand-500/30"}`}>
                      {copiedId === fan.id ? "Copied!" : "Copy"}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => {
                if (!batchMessage.trim()) return;
                const all = filtered.map(f => `${f.name}: ${batchMessage.replace(/\{name\}/gi, f.name.split(" ")[0])}`).join("\n\n");
                navigator.clipboard.writeText(all);
                setToast(`${filtered.length} personalized messages copied!`);
                setShowBatchComposer(false);
              }} className="flex-1 rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50" disabled={!batchMessage.trim()}>
                Copy All {filtered.length} Messages
              </button>
              <button onClick={() => setShowBatchComposer(false)} className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted)] hover:text-white transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile FAB — Add Fan */}
      {!showAddModal && !selected && (
        <button
          onClick={openAddModal}
          disabled={atLimit}
          className="fixed bottom-6 right-6 z-30 sm:hidden flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg shadow-brand-500/30 hover:bg-brand-600 active:scale-95 transition disabled:opacity-50"
          aria-label="Add fan"
        >
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      )}

      {/* Floating keyboard shortcut hint */}
      <button
        onClick={() => setShowShortcuts(true)}
        className="fixed bottom-4 right-4 z-30 hidden sm:flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white transition shadow-lg"
      >
        <kbd className="rounded border border-[var(--border)] bg-[var(--bg)] px-1 py-0.5 text-[10px] font-mono">?</kbd>
        <span>Shortcuts</span>
      </button>
    </div>
  );
}
