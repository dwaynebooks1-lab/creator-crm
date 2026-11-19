"use client";
import Link from "next/link";
import { useState } from "react";

type Tag = "whale" | "vip" | "regular" | "new" | "at-risk";

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

const PLATFORM_LABELS: Record<string, { label: string; color: string }> = {
  onlyfans: { label: "OnlyFans", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  fansly: { label: "Fansly", color: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
  patreon: { label: "Patreon", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
};

const DEMO_FANS = [
  { id: "1", name: "Alex Thompson", tag: "whale" as Tag, total_spent: 2340, renewal: "12 days", lastMsg: "2d ago", platform: "onlyfans", notes: "Top tipper. Loves exclusive content." },
  { id: "2", name: "Sam Kim", tag: "vip" as Tag, total_spent: 890, renewal: "5 days", lastMsg: "1d ago", platform: "fansly", notes: "Loyal subscriber since day one." },
  { id: "3", name: "Jordan Peters", tag: "at-risk" as Tag, total_spent: 60, renewal: "Tomorrow!", lastMsg: "12d ago", platform: "onlyfans", notes: "No engagement in 10 days. Renewal tomorrow!" },
  { id: "4", name: "Riley Nash", tag: "new" as Tag, total_spent: 15, renewal: "28 days", lastMsg: "Today", platform: "patreon", notes: "Just subscribed yesterday." },
  { id: "5", name: "Morgan Chen", tag: "vip" as Tag, total_spent: 1250, renewal: "8 days", lastMsg: "3d ago", platform: "onlyfans", notes: "Buys every PPV. High value." },
  { id: "6", name: "Taylor Reed", tag: "at-risk" as Tag, total_spent: 45, renewal: "2 days", lastMsg: "15d ago", platform: "fansly", notes: "Hasn't opened messages in 2 weeks." },
  { id: "7", name: "Casey Brooks", tag: "regular" as Tag, total_spent: 320, renewal: "18 days", lastMsg: "5d ago", platform: "onlyfans", notes: "Consistent subscriber." },
  { id: "8", name: "Jamie Lee", tag: "whale" as Tag, total_spent: 4100, renewal: "3 days", lastMsg: "Today", platform: "fansly", notes: "Highest spender. Custom content buyer." },
];

const ACTIONS = [
  { icon: "🚨", label: "Jordan Peters renews TOMORROW — send a message now!", color: "border-red-500/40 bg-red-500/5" },
  { icon: "⚠️", label: "Taylor Reed hasn't engaged in 15 days — at risk of canceling", color: "border-amber-500/40 bg-amber-500/5" },
  { icon: "🎉", label: "Jamie Lee renews in 3 days — send a VIP thank you!", color: "border-green-500/40 bg-green-500/5" },
  { icon: "💬", label: "Riley Nash just subscribed — send a welcome message", color: "border-blue-500/40 bg-blue-500/5" },
];

const TEMPLATES = [
  { title: "Welcome New Fan", msg: "Hey {name}! So glad you're here 💕 I post new content every [schedule]. DM me anytime — I love chatting with my subscribers!" },
  { title: "Renewal Reminder", msg: "Hey {name}! Just wanted to say I really appreciate your support 🥰 I've got some amazing content coming soon that I think you'll love…" },
  { title: "Win Back At-Risk", msg: "Hey {name}, I noticed I haven't heard from you in a while! Just wanted to check in — is there anything specific you'd like to see? I miss chatting with you 💕" },
  { title: "VIP Appreciation", msg: "Hey {name}! I just want you to know how much I appreciate you 🥰 You're one of my absolute favorites. I have something special coming just for my VIPs…" },
];

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
      <p className="text-xs sm:text-sm text-[var(--muted)]">{label}</p>
      <p className={`mt-1 text-xl sm:text-2xl font-bold ${accent || ""}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-[var(--muted)]">{sub}</p>}
    </div>
  );
}

export default function Demo() {
  const [filter, setFilter] = useState<Tag | "all">("all");
  const [selectedFan, setSelectedFan] = useState<typeof DEMO_FANS[0] | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [copied, setCopied] = useState("");
  const [showCTA, setShowCTA] = useState(false);

  const filtered = filter === "all" ? DEMO_FANS : DEMO_FANS.filter(f => f.tag === filter);

  const totalRevenue = DEMO_FANS.reduce((s, f) => s + f.total_spent, 0);
  const atRiskCount = DEMO_FANS.filter(f => f.tag === "at-risk").length;
  const whaleCount = DEMO_FANS.filter(f => f.tag === "whale" || f.tag === "vip").length;

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(""), 2000);
  }

  function handleDemoAction() {
    setShowCTA(true);
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-white">
      {/* Demo banner */}
      <div className="bg-brand-500 text-white text-center py-2.5 px-4 text-sm font-medium sticky top-0 z-50">
        You&apos;re viewing a live demo — <Link href="/signup" className="underline font-bold">Create your free account</Link> to start managing your fans
      </div>

      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-bold">Creator<span className="text-brand-500">CRM</span></Link>
            <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 text-xs text-amber-300 font-medium">DEMO</span>
          </div>
          <Link href="/signup" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition">
            Start Free →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard label="Total Fans" value="8" sub="2 added this week" />
          <StatCard label="Revenue" value={`$${totalRevenue.toLocaleString()}`} sub="Lifetime value" accent="text-green-400" />
          <StatCard label="At Risk" value={String(atRiskCount)} sub="Need attention now" accent="text-red-400" />
          <StatCard label="Whales & VIPs" value={String(whaleCount)} sub="Your top earners" accent="text-purple-400" />
        </div>

        {/* Action Center */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 mb-6">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/20 text-brand-400 text-xs">⚡</span>
            Action Center
          </h2>
          <div className="space-y-2">
            {ACTIONS.map((a, i) => (
              <button key={i} onClick={handleDemoAction} className={`w-full flex items-center gap-3 rounded-lg border ${a.color} p-3 text-left text-sm hover:brightness-125 transition`}>
                <span className="text-lg">{a.icon}</span>
                <span className="flex-1">{a.label}</span>
                <span className="text-xs text-[var(--muted)]">Act →</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters & Templates */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {(["all", "whale", "vip", "regular", "new", "at-risk"] as const).map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition ${filter === t ? "bg-brand-500/20 border-brand-500/50 text-brand-300" : "border-[var(--border)] text-[var(--muted)] hover:text-white"}`}>
              {t === "all" ? "All Fans" : TAG_LABELS[t]}
              {t !== "all" && <span className="ml-1 opacity-60">({DEMO_FANS.filter(f => f.tag === t).length})</span>}
            </button>
          ))}
          <button onClick={() => setShowTemplates(!showTemplates)}
            className="ml-auto rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] hover:text-white transition">
            📋 DM Templates
          </button>
        </div>

        {/* Templates panel */}
        {showTemplates && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 mb-4">
            <h3 className="text-sm font-semibold mb-3">Ready-Made DM Templates</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {TEMPLATES.map((t, i) => (
                <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-brand-400">{t.title}</span>
                    <button onClick={() => handleCopy(t.msg, `tpl-${i}`)} className="text-xs text-[var(--muted)] hover:text-white transition">
                      {copied === `tpl-${i}` ? "✓ Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">{t.msg}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fan table */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted)] text-xs">
                  <th className="text-left p-3 font-medium">Fan</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Platform</th>
                  <th className="text-left p-3 font-medium">Tag</th>
                  <th className="text-right p-3 font-medium">Spent</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Renewal</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Last Message</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(fan => (
                  <tr key={fan.id} onClick={() => setSelectedFan(fan)}
                    className="border-b border-[var(--border)] hover:bg-white/[0.02] cursor-pointer transition">
                    <td className="p-3 font-medium">{fan.name}</td>
                    <td className="p-3 hidden sm:table-cell">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${PLATFORM_LABELS[fan.platform]?.color}`}>
                        {PLATFORM_LABELS[fan.platform]?.label}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${TAG_COLORS[fan.tag]}`}>
                        {TAG_LABELS[fan.tag]}
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium text-green-400">${fan.total_spent.toLocaleString()}</td>
                    <td className={`p-3 hidden md:table-cell text-xs ${fan.renewal.includes("Tomorrow") || fan.renewal.includes("2 days") ? "text-red-400 font-medium" : "text-[var(--muted)]"}`}>
                      {fan.renewal}
                    </td>
                    <td className="p-3 hidden lg:table-cell text-xs text-[var(--muted)]">{fan.lastMsg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenue chart placeholder */}
        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="text-sm font-semibold mb-4">Revenue Over Time</h3>
          <div className="flex items-end gap-2 h-32">
            {[35, 42, 38, 55, 48, 62, 58, 71, 65, 80, 75, 92].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t bg-brand-500/60 hover:bg-brand-500 transition" style={{ height: `${h}%` }} />
                <span className="text-[9px] text-[var(--muted)]">{["J","F","M","A","M","J","J","A","S","O","N","D"][i]}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Fan detail modal */}
      {selectedFan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedFan(null)}>
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{selectedFan.name}</h3>
              <button onClick={() => setSelectedFan(null)} className="text-[var(--muted)] hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${TAG_COLORS[selectedFan.tag]}`}>{TAG_LABELS[selectedFan.tag]}</span>
                <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${PLATFORM_LABELS[selectedFan.platform]?.color}`}>{PLATFORM_LABELS[selectedFan.platform]?.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-[var(--muted)] text-xs">Total Spent</span><p className="font-bold text-green-400">${selectedFan.total_spent.toLocaleString()}</p></div>
                <div><span className="text-[var(--muted)] text-xs">Renewal</span><p className="font-bold">{selectedFan.renewal}</p></div>
                <div><span className="text-[var(--muted)] text-xs">Last Message</span><p>{selectedFan.lastMsg}</p></div>
              </div>
              <div>
                <span className="text-[var(--muted)] text-xs">Notes</span>
                <p className="text-sm mt-1">{selectedFan.notes}</p>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-[var(--border)]">
              <Link href="/signup" className="block w-full rounded-lg bg-brand-500 py-2.5 text-center text-sm font-medium text-white hover:bg-brand-600 transition">
                Sign Up Free to Manage Your Fans →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* CTA modal */}
      {showCTA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowCTA(false)}>
          <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/20 border border-brand-500/30">
              <span className="text-2xl">🚀</span>
            </div>
            <h3 className="text-lg font-bold mb-2">Ready to take action?</h3>
            <p className="text-sm text-[var(--muted)] mb-5">Create your free account to start tracking your fans and saving subscribers.</p>
            <Link href="/signup" className="block w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition mb-3">
              Create Free Account
            </Link>
            <button onClick={() => setShowCTA(false)} className="text-xs text-[var(--muted)] hover:text-white transition">
              Keep exploring demo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
