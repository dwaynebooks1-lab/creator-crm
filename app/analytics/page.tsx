"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
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
  created_at?: string;
};

const TAG_LABELS: Record<Tag, string> = {
  whale: "Whale", vip: "VIP", regular: "Regular", new: "New", "at-risk": "At Risk",
};
const TAG_BAR_COLORS: Record<string, string> = {
  whale: "bg-purple-500", vip: "bg-amber-500", regular: "bg-blue-500", new: "bg-green-500", "at-risk": "bg-red-500",
};
const TAG_TEXT_COLORS: Record<string, string> = {
  whale: "text-purple-400", vip: "text-amber-400", regular: "text-blue-400", new: "text-green-400", "at-risk": "text-red-400",
};

export default function Analytics() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [fans, setFans] = useState<Fan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [timeRange, setTimeRange] = useState<"30d" | "90d" | "6m" | "1y">("6m");

  const loadFans = useCallback(async () => {
    const { data } = await supabase.from("fans").select("*").order("created_at", { ascending: false });
    if (data) setFans(data);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
      const { data } = await supabase.from("creators").select("plan").eq("id", u.id).single();
      setIsPro(data?.plan === "pro");
      setLoading(false);
      loadFans();
    });
  }, [router, loadFans]);

  const totalRevenue = fans.reduce((s, f) => s + (f.total_spent || 0), 0);
  const avgSpend = fans.length > 0 ? totalRevenue / fans.length : 0;

  const timeRangeDays = timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : timeRange === "6m" ? 180 : 365;

  const revenueTrend = useMemo(() => {
    const buckets = timeRange === "30d" ? 4 : timeRange === "90d" ? 6 : timeRange === "6m" ? 6 : 12;
    const daysPerBucket = Math.ceil(timeRangeDays / buckets);
    const months: { label: string; revenue: number; fans: number; cumRevenue: number }[] = [];
    let cumRevenue = 0;

    for (let i = buckets - 1; i >= 0; i--) {
      const end = new Date();
      end.setDate(end.getDate() - i * daysPerBucket);
      const start = new Date(end);
      start.setDate(start.getDate() - daysPerBucket);
      const label = end.toLocaleDateString("en-US", { month: "short", day: timeRange === "30d" ? "numeric" : undefined });

      const bucketFans = fans.filter(f => {
        if (!f.created_at) return i === 0;
        const t = new Date(f.created_at).getTime();
        return t >= start.getTime() && t < end.getTime();
      });
      const rev = bucketFans.reduce((s, f) => s + (f.total_spent || 0), 0);
      cumRevenue += rev;
      months.push({ label, revenue: rev, fans: bucketFans.length, cumRevenue });
    }
    return months;
  }, [fans, timeRange, timeRangeDays]);

  const fanGrowth = useMemo(() => {
    const buckets = timeRange === "30d" ? 30 : timeRange === "90d" ? 12 : timeRange === "6m" ? 6 : 12;
    const daysPerBucket = Math.ceil(timeRangeDays / buckets);
    const data: { label: string; count: number; cumulative: number }[] = [];
    let cum = 0;

    for (let i = buckets - 1; i >= 0; i--) {
      const end = new Date();
      end.setDate(end.getDate() - i * daysPerBucket);
      const start = new Date(end);
      start.setDate(start.getDate() - daysPerBucket);
      const label = timeRange === "30d"
        ? end.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : end.toLocaleDateString("en-US", { month: "short" });

      const count = fans.filter(f => {
        if (!f.created_at) return i === 0;
        const t = new Date(f.created_at).getTime();
        return t >= start.getTime() && t < end.getTime();
      }).length;
      cum += count;
      data.push({ label, count, cumulative: cum });
    }
    return data;
  }, [fans, timeRange, timeRangeDays]);

  const tagBreakdown = useMemo(() => {
    const tags: Tag[] = ["whale", "vip", "regular", "new", "at-risk"];
    return tags.map(tag => {
      const tagFans = fans.filter(f => f.tag === tag);
      return {
        tag,
        count: tagFans.length,
        revenue: tagFans.reduce((s, f) => s + (f.total_spent || 0), 0),
        avgSpend: tagFans.length > 0 ? tagFans.reduce((s, f) => s + (f.total_spent || 0), 0) / tagFans.length : 0,
        pct: fans.length > 0 ? (tagFans.length / fans.length) * 100 : 0,
      };
    }).filter(t => t.count > 0);
  }, [fans]);

  const engagementMetrics = useMemo(() => {
    const now = Date.now();
    const d7 = now - 7 * 86400000;
    const d30 = now - 30 * 86400000;
    const messaged7d = fans.filter(f => f.last_message_at && new Date(f.last_message_at).getTime() >= d7).length;
    const messaged30d = fans.filter(f => f.last_message_at && new Date(f.last_message_at).getTime() >= d30).length;
    const neverMessaged = fans.filter(f => !f.last_message_at).length;
    const avgDaysSinceMsg = fans.filter(f => f.last_message_at).length > 0
      ? Math.round(fans.filter(f => f.last_message_at).reduce((s, f) => s + Math.floor((now - new Date(f.last_message_at!).getTime()) / 86400000), 0) / fans.filter(f => f.last_message_at).length)
      : 0;
    return { messaged7d, messaged30d, neverMessaged, avgDaysSinceMsg };
  }, [fans]);

  const churnRisk = useMemo(() => {
    function score(fan: Fan): number {
      let s = 0;
      if (fan.last_message_at) {
        const d = Math.floor((Date.now() - new Date(fan.last_message_at).getTime()) / 86400000);
        if (d > 14) s += 35; else if (d > 7) s += 25; else if (d > 3) s += 10;
      } else s += 20;
      if (fan.tag === "at-risk") s += 30; else if (fan.tag === "new") s += 10;
      if (fan.total_spent < 20) s += 15; else if (fan.total_spent < 50) s += 5;
      if (fan.renewal_date) {
        const d = Math.floor((new Date(fan.renewal_date).getTime() - Date.now()) / 86400000);
        if (d <= 1) s += 20; else if (d <= 3) s += 10;
      }
      return Math.min(100, s);
    }
    const high = fans.filter(f => score(f) >= 60);
    const medium = fans.filter(f => score(f) >= 35 && score(f) < 60);
    const low = fans.filter(f => score(f) < 35);
    return {
      high: { count: high.length, revenue: high.reduce((s, f) => s + (f.total_spent || 0), 0) },
      medium: { count: medium.length, revenue: medium.reduce((s, f) => s + (f.total_spent || 0), 0) },
      low: { count: low.length, revenue: low.reduce((s, f) => s + (f.total_spent || 0), 0) },
    };
  }, [fans]);

  const topFans = useMemo(() =>
    [...fans].sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0)).slice(0, 10),
  [fans]);

  const spendingDistribution = useMemo(() => {
    const brackets = [
      { label: "$0-$25", min: 0, max: 25 },
      { label: "$25-$100", min: 25, max: 100 },
      { label: "$100-$500", min: 100, max: 500 },
      { label: "$500-$1k", min: 500, max: 1000 },
      { label: "$1k-$5k", min: 1000, max: 5000 },
      { label: "$5k+", min: 5000, max: Infinity },
    ];
    return brackets.map(b => ({
      ...b,
      count: fans.filter(f => (f.total_spent || 0) >= b.min && (f.total_spent || 0) < b.max).length,
    })).filter(b => b.count > 0);
  }, [fans]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="text-[var(--muted)]">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="min-h-screen">
        <nav className="border-b border-[var(--border)] px-4 py-4">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <Link href="/" className="text-xl font-bold">Creator<span className="text-brand-500">CRM</span></Link>
            <Link href="/dashboard" className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white transition">Dashboard</Link>
          </div>
        </nav>
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/20 border border-brand-500/30">
            <svg className="h-8 w-8 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-3">Analytics is a Pro Feature</h1>
          <p className="text-[var(--muted)] mb-8">Upgrade to Pro to unlock detailed revenue analytics, fan growth charts, engagement metrics, churn risk analysis, and more.</p>
          <button onClick={async () => {
            const { data: { session: authSession } } = await supabase.auth.getSession();
            const res = await fetch("/api/checkout", { method: "POST", headers: { Authorization: `Bearer ${authSession?.access_token}` } });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
          }} className="rounded-lg bg-brand-500 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition">
            Upgrade to Pro — $29/mo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <nav className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold">Creator<span className="text-brand-500">CRM</span></Link>
            <span className="rounded-full bg-brand-500/20 border border-brand-500/30 px-2.5 py-1 text-xs font-medium text-brand-400">Analytics</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white transition">Dashboard</Link>
            <Link href="/settings" className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white transition">Settings</Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-sm text-[var(--muted)]">{fans.length} fans tracked &middot; ${totalRevenue.toLocaleString()} lifetime revenue</p>
          </div>
          <div className="flex gap-1 rounded-lg border border-[var(--border)] p-0.5">
            {(["30d", "90d", "6m", "1y"] as const).map(r => (
              <button key={r} onClick={() => setTimeRange(r)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${timeRange === r ? "bg-brand-500 text-white" : "text-[var(--muted)] hover:text-white"}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-xs text-[var(--muted)] mb-1">Total Revenue</p>
            <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-[var(--muted)] mt-1">lifetime tracked</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-xs text-[var(--muted)] mb-1">Avg Fan Value</p>
            <p className="text-2xl font-bold">${Math.round(avgSpend).toLocaleString()}</p>
            <p className="text-xs text-[var(--muted)] mt-1">per fan lifetime</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-xs text-[var(--muted)] mb-1">Engagement (7d)</p>
            <p className={`text-2xl font-bold ${engagementMetrics.messaged7d / Math.max(fans.length, 1) >= 0.5 ? "text-green-400" : "text-amber-400"}`}>
              {fans.length > 0 ? Math.round((engagementMetrics.messaged7d / fans.length) * 100) : 0}%
            </p>
            <p className="text-xs text-[var(--muted)] mt-1">{engagementMetrics.messaged7d} of {fans.length} messaged</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-xs text-[var(--muted)] mb-1">At Risk Revenue</p>
            <p className="text-2xl font-bold text-red-400">${churnRisk.high.revenue.toLocaleString()}</p>
            <p className="text-xs text-[var(--muted)] mt-1">{churnRisk.high.count} high-risk fans</p>
          </div>
        </div>

        {/* Revenue Trend Chart */}
        <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-sm font-semibold mb-6">Revenue Over Time</h2>
          <div className="flex items-end gap-2 h-40">
            {(() => {
              const maxRev = Math.max(...revenueTrend.map(m => m.revenue), 1);
              return revenueTrend.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-[var(--muted)] font-medium">
                    ${m.revenue > 999 ? `${(m.revenue / 1000).toFixed(1)}k` : m.revenue.toLocaleString()}
                  </span>
                  <div className="w-full flex justify-center">
                    <div
                      className={`w-full max-w-[48px] rounded-t-md transition-all ${i === revenueTrend.length - 1 ? "bg-brand-500" : "bg-brand-500/50"}`}
                      style={{ height: `${Math.max(4, (m.revenue / maxRev) * 120)}px` }}
                    />
                  </div>
                  <span className="text-[10px] text-[var(--muted)]">{m.label}</span>
                  <span className="text-[9px] text-[var(--muted)]">{m.fans} fans</span>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Fan Growth + Engagement */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Fan Growth */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-sm font-semibold mb-6">Fan Growth</h2>
            <div className="flex items-end gap-1.5 h-32">
              {(() => {
                const maxCount = Math.max(...fanGrowth.map(m => m.count), 1);
                return fanGrowth.map((m, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-[var(--muted)]">{m.count}</span>
                    <div className="w-full flex justify-center">
                      <div
                        className="w-full max-w-[32px] rounded-t-md bg-green-500/60 transition-all"
                        style={{ height: `${Math.max(4, (m.count / maxCount) * 100)}px` }}
                      />
                    </div>
                    <span className="text-[9px] text-[var(--muted)] truncate max-w-full">{m.label}</span>
                  </div>
                ));
              })()}
            </div>
            <p className="mt-4 text-xs text-[var(--muted)]">Total: {fans.length} fans</p>
          </div>

          {/* Engagement Overview */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-sm font-semibold mb-6">Engagement Overview</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted)]">Messaged (7 days)</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-green-500" style={{ width: `${fans.length > 0 ? (engagementMetrics.messaged7d / fans.length) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{engagementMetrics.messaged7d}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted)]">Messaged (30 days)</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${fans.length > 0 ? (engagementMetrics.messaged30d / fans.length) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{engagementMetrics.messaged30d}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted)]">Never messaged</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-red-500" style={{ width: `${fans.length > 0 ? (engagementMetrics.neverMessaged / fans.length) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{engagementMetrics.neverMessaged}</span>
                </div>
              </div>
              <div className="border-t border-[var(--border)] pt-3 flex items-center justify-between">
                <span className="text-sm text-[var(--muted)]">Avg days since last message</span>
                <span className={`text-sm font-bold ${engagementMetrics.avgDaysSinceMsg <= 3 ? "text-green-400" : engagementMetrics.avgDaysSinceMsg <= 7 ? "text-amber-400" : "text-red-400"}`}>
                  {engagementMetrics.avgDaysSinceMsg}d
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tag Breakdown + Churn Risk */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Revenue by Tag */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-sm font-semibold mb-4">Revenue by Tag</h2>
            <div className="space-y-3">
              {tagBreakdown.sort((a, b) => b.revenue - a.revenue).map(t => (
                <div key={t.tag}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${TAG_BAR_COLORS[t.tag]}`} />
                      <span className={`text-sm font-medium ${TAG_TEXT_COLORS[t.tag]}`}>{TAG_LABELS[t.tag]}</span>
                      <span className="text-xs text-[var(--muted)]">{t.count} fans</span>
                    </div>
                    <span className="text-sm font-medium">${t.revenue.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className={`h-full rounded-full ${TAG_BAR_COLORS[t.tag]} transition-all`}
                      style={{ width: `${totalRevenue > 0 ? (t.revenue / totalRevenue) * 100 : 0}%` }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-[var(--muted)]">{t.pct.toFixed(1)}% of fans</span>
                    <span className="text-[10px] text-[var(--muted)]">avg ${Math.round(t.avgSpend).toLocaleString()}/fan</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Churn Risk Analysis */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-sm font-semibold mb-4">Churn Risk Analysis</h2>
            <div className="space-y-4">
              {[
                { label: "High Risk (60+)", ...churnRisk.high, color: "bg-red-500", textColor: "text-red-400" },
                { label: "Medium Risk (35-59)", ...churnRisk.medium, color: "bg-amber-500", textColor: "text-amber-400" },
                { label: "Low Risk (<35)", ...churnRisk.low, color: "bg-green-500", textColor: "text-green-400" },
              ].map(tier => (
                <div key={tier.label} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${tier.color}`} />
                      <span className={`text-sm font-medium ${tier.textColor}`}>{tier.label}</span>
                    </div>
                    <span className="text-sm font-bold">{tier.count} fans</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mr-3">
                      <div className={`h-full rounded-full ${tier.color}`}
                        style={{ width: `${fans.length > 0 ? (tier.count / fans.length) * 100 : 0}%` }} />
                    </div>
                    <span className="text-xs text-[var(--muted)] shrink-0">${tier.revenue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--muted)]">Overall Retention Rate</span>
                  <span className={`text-lg font-bold ${
                    fans.length > 0 && (churnRisk.low.count + churnRisk.medium.count) / fans.length >= 0.8 ? "text-green-400" : "text-amber-400"
                  }`}>
                    {fans.length > 0 ? Math.round(((fans.length - churnRisk.high.count) / fans.length) * 100) : 100}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Spending Distribution + Top Fans */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Spending Distribution */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-sm font-semibold mb-4">Spending Distribution</h2>
            <div className="space-y-2">
              {(() => {
                const maxCount = Math.max(...spendingDistribution.map(b => b.count), 1);
                return spendingDistribution.map(b => (
                  <div key={b.label} className="flex items-center gap-3">
                    <span className="text-xs text-[var(--muted)] w-16 shrink-0 text-right">{b.label}</span>
                    <div className="flex-1 h-6 rounded bg-white/5 overflow-hidden">
                      <div className="h-full rounded bg-brand-500/60 flex items-center transition-all"
                        style={{ width: `${(b.count / maxCount) * 100}%` }}>
                        <span className="text-[10px] font-medium text-white px-2">{b.count}</span>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Top 10 Fans */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-sm font-semibold mb-4">Top 10 Fans by Revenue</h2>
            <div className="space-y-2">
              {topFans.map((fan, i) => {
                const medals = ["🥇", "🥈", "🥉"];
                const pct = totalRevenue > 0 ? ((fan.total_spent || 0) / totalRevenue * 100) : 0;
                return (
                  <div key={fan.id} className="flex items-center gap-3">
                    <span className="text-sm w-6 text-center shrink-0">{medals[i] || `#${i + 1}`}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{fan.name}</span>
                        <span className={`text-[10px] ${TAG_TEXT_COLORS[fan.tag]}`}>{TAG_LABELS[fan.tag]}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-semibold text-brand-400">${(fan.total_spent || 0).toLocaleString()}</span>
                      <span className="text-[10px] text-[var(--muted)] ml-1">({pct.toFixed(1)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Platform Breakdown */}
        {fans.some(f => (f as Record<string, unknown>).platform) && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-sm font-semibold mb-4">Platform Breakdown</h2>
            <div className="space-y-3">
              {(() => {
                const platformMap: Record<string, { count: number; revenue: number }> = {};
                fans.forEach(f => {
                  const p = ((f as Record<string, unknown>).platform as string) || "unknown";
                  if (!platformMap[p]) platformMap[p] = { count: 0, revenue: 0 };
                  platformMap[p].count++;
                  platformMap[p].revenue += f.total_spent || 0;
                });
                const pLabels: Record<string, string> = {
                  onlyfans: "OnlyFans", fansly: "Fansly", patreon: "Patreon", twitch: "Twitch",
                  youtube: "YouTube", instagram: "Instagram", twitter: "Twitter/X", tiktok: "TikTok",
                  other: "Other", unknown: "Not specified", "": "Not specified",
                };
                const pColors: Record<string, string> = {
                  onlyfans: "bg-blue-500", fansly: "bg-pink-500", patreon: "bg-orange-500", twitch: "bg-purple-500",
                  youtube: "bg-red-500", instagram: "bg-pink-400", twitter: "bg-sky-500", tiktok: "bg-teal-500",
                  other: "bg-gray-500", unknown: "bg-gray-600", "": "bg-gray-600",
                };
                return Object.entries(platformMap)
                  .sort((a, b) => b[1].revenue - a[1].revenue)
                  .map(([p, data]) => (
                    <div key={p}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{pLabels[p] || p}</span>
                        <span className="text-xs text-[var(--muted)]">{data.count} fan{data.count !== 1 ? "s" : ""} · ${data.revenue.toLocaleString()}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div className={`h-full rounded-full ${pColors[p] || "bg-gray-500"}`} style={{ width: `${totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ));
              })()}
            </div>
          </div>
        )}

        {/* Revenue Concentration */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-sm font-semibold mb-4">Revenue Concentration</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(() => {
              const sorted = [...fans].sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0));
              const top10pct = sorted.slice(0, Math.max(1, Math.ceil(fans.length * 0.1)));
              const top20pct = sorted.slice(0, Math.max(1, Math.ceil(fans.length * 0.2)));
              const top50pct = sorted.slice(0, Math.max(1, Math.ceil(fans.length * 0.5)));
              const revTop10 = top10pct.reduce((s, f) => s + (f.total_spent || 0), 0);
              const revTop20 = top20pct.reduce((s, f) => s + (f.total_spent || 0), 0);
              const revTop50 = top50pct.reduce((s, f) => s + (f.total_spent || 0), 0);
              return [
                { label: "Top 10% of fans", value: totalRevenue > 0 ? Math.round((revTop10 / totalRevenue) * 100) : 0, revenue: revTop10 },
                { label: "Top 20% of fans", value: totalRevenue > 0 ? Math.round((revTop20 / totalRevenue) * 100) : 0, revenue: revTop20 },
                { label: "Top 50% of fans", value: totalRevenue > 0 ? Math.round((revTop50 / totalRevenue) * 100) : 0, revenue: revTop50 },
                { label: "Bottom 50%", value: totalRevenue > 0 ? Math.round(((totalRevenue - revTop50) / totalRevenue) * 100) : 0, revenue: totalRevenue - revTop50 },
              ].map(stat => (
                <div key={stat.label} className="text-center rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4">
                  <p className="text-2xl font-bold text-brand-400">{stat.value}%</p>
                  <p className="text-xs text-[var(--muted)] mt-1">{stat.label}</p>
                  <p className="text-[10px] text-[var(--muted)]">${stat.revenue.toLocaleString()}</p>
                </div>
              ));
            })()}
          </div>
          <p className="mt-3 text-xs text-[var(--muted)]">
            {(() => {
              const sorted = [...fans].sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0));
              const top10pct = sorted.slice(0, Math.max(1, Math.ceil(fans.length * 0.1)));
              const revTop10 = top10pct.reduce((s, f) => s + (f.total_spent || 0), 0);
              const pct = totalRevenue > 0 ? Math.round((revTop10 / totalRevenue) * 100) : 0;
              return pct >= 50
                ? `Your top ${top10pct.length} fan${top10pct.length !== 1 ? "s" : ""} generate ${pct}% of revenue. Focus on keeping them happy!`
                : "Your revenue is well-distributed across fans. Great diversification!";
            })()}
          </p>
        </div>
      </div>
    </div>
  );
}
