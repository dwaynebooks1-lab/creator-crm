"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const FEATURES = [
  {
    icon: "⚡",
    title: "Smart Action Center",
    desc: "Know exactly who to message and when. AI-powered suggestions tell you which fans need attention right now — before they leave.",
  },
  {
    icon: "📋",
    title: "Ready-Made Messages",
    desc: "8 proven message templates for every situation — welcome, renewal, re-engagement, VIP appreciation. Copy, paste, send. Done in seconds.",
  },
  {
    icon: "🔥",
    title: "Churn Risk Scoring",
    desc: "Every fan gets a risk score. See who's about to cancel before it happens. One message can save a $20/mo subscriber.",
  },
  {
    icon: "⏰",
    title: "Renewal Alerts",
    desc: "See which fans renew in the next 1-3 days with ready-to-send messages. Never miss a renewal window again.",
  },
  {
    icon: "📊",
    title: "Revenue Analytics",
    desc: "Track lifetime spend per fan, revenue by tag, retention rate, and revenue at risk. Know your numbers cold.",
  },
  {
    icon: "🏷️",
    title: "Smart Fan Tags",
    desc: "Categorize fans as Whales, VIPs, At-Risk, or New. Prioritize who gets your attention and treat top spenders right.",
  },
  {
    icon: "📈",
    title: "Revenue Trends",
    desc: "See your 6-month revenue growth at a glance. Compare this month vs last across new fans, revenue, and engagement.",
  },
  {
    icon: "✉️",
    title: "Custom Templates",
    desc: "Create and save your own message templates for DMs you send often. Pro users build a personal message library.",
  },
  {
    icon: "🔖",
    title: "Saved Segments",
    desc: "Save custom filter combos like 'Whales not messaged in 7 days.' One click to load your most-used fan views.",
  },
  {
    icon: "🌐",
    title: "Platform Tracking",
    desc: "Track which platform each fan comes from — OnlyFans, Fansly, Patreon, Twitch, and more. See revenue by platform.",
  },
  {
    icon: "📊",
    title: "Weekly Digest",
    desc: "Get a weekly summary of your fan activity, growth, engagement rate, and actionable highlights to keep you on track.",
  },
  {
    icon: "🤖",
    title: "AI DM Scripts",
    desc: "Get personalized DM scripts generated for each fan based on their spending, activity, and risk level. Copy and paste into your DMs.",
  },
  {
    icon: "🕐",
    title: "Best Time to Message",
    desc: "See when your fans are most active so you know the best time to send DMs for maximum engagement.",
  },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Add your fans", desc: "Import from CSV or add manually. Takes 2 minutes." },
  { step: "2", title: "Get action items", desc: "CreatorCRM tells you exactly who to message today and gives you the words." },
  { step: "3", title: "Watch revenue grow", desc: "Fans stay longer, spend more, and you save hours every day." },
];

export default function LandingPage() {
  const [annual, setAnnual] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadStatus, setLeadStatus] = useState<"" | "sending" | "done" | "error">("");
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/dashboard");
      } else {
        setCheckingAuth(false);
      }
    });
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-[var(--border)] px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-xl font-bold">
            Creator<span className="text-brand-500">CRM</span>
          </h1>
          <div className="flex gap-3">
            <Link href="/login" className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] hover:text-white transition">
              Log In
            </Link>
            <Link href="/signup" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-block rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs text-brand-400">
            The CRM built for content creators
          </div>
          <h2 className="mb-6 text-4xl font-bold leading-tight md:text-5xl">
            Your fans are leaving.{" "}
            <span className="text-brand-500">CreatorCRM stops them.</span>
          </h2>
          <p className="mb-8 text-lg text-[var(--muted)] md:text-xl">
            CreatorCRM tells you exactly which fans to message, when to message them,
            and gives you the words to say. One saved subscriber pays for a whole month.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="rounded-lg bg-brand-500 px-8 py-3 text-lg font-semibold text-white hover:bg-brand-600 transition"
            >
              Start Free — No Card Needed
            </Link>
          </div>
          <p className="mt-4 text-sm text-[var(--muted)]">Free forever for up to 25 fans. Pro starts at $20.75/mo billed annually.</p>
        </div>
      </section>

      {/* Product Showcase */}
      <section className="px-4 py-16 overflow-hidden">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-3 text-center text-2xl font-bold sm:text-3xl">See what&apos;s inside</h2>
          <p className="mb-10 text-center text-sm text-[var(--muted)]">A real look at the dashboard creators use every day to save fans and grow revenue.</p>

          {/* Screenshot 1: Dashboard Overview */}
          <div className="mb-12 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-1 shadow-2xl shadow-brand-500/5">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[var(--border)]">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
              <span className="ml-2 text-[10px] text-[var(--muted)]">CreatorCRM — Dashboard</span>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  { label: "Total Fans", value: "247", accent: "" },
                  { label: "Total Revenue", value: "$18,420", accent: "" },
                  { label: "At Risk", value: "3", accent: "text-red-400" },
                  { label: "Renewals ≤3d", value: "8", accent: "text-amber-400" },
                ].map(s => (
                  <div key={s.label} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
                    <p className="text-[10px] text-[var(--muted)]">{s.label}</p>
                    <p className={`text-lg font-bold ${s.accent}`}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-3 py-2 text-[10px] font-medium text-[var(--muted)] border-b border-[var(--border)]">
                  <span>Fan</span><span>Tag</span><span className="hidden sm:block">Spent</span><span>Renewal</span>
                </div>
                {[
                  { name: "Alex T.", tag: "Whale", tagColor: "bg-purple-500/20 text-purple-300", spent: "$2,340", renewal: "2 days" },
                  { name: "Sam K.", tag: "VIP", tagColor: "bg-amber-500/20 text-amber-300", spent: "$890", renewal: "5 days" },
                  { name: "Jordan P.", tag: "At Risk", tagColor: "bg-red-500/20 text-red-300", spent: "$60", renewal: "Tomorrow!" },
                  { name: "Riley N.", tag: "New", tagColor: "bg-green-500/20 text-green-300", spent: "$15", renewal: "28 days" },
                ].map(f => (
                  <div key={f.name} className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center px-3 py-2.5 text-xs border-b border-[var(--border)] last:border-0">
                    <span className="font-medium">{f.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${f.tagColor}`}>{f.tag}</span>
                    <span className="hidden sm:block text-[var(--muted)]">{f.spent}</span>
                    <span className="text-[var(--muted)]">{f.renewal}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Two-column: Action Center + Message Templates */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Screenshot 2: Action Center */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-1 shadow-2xl shadow-brand-500/5">
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[var(--border)]">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                <span className="ml-2 text-[10px] text-[var(--muted)]">Action Center</span>
              </div>
              <div className="p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/20 text-[10px] font-bold text-red-400">3</span>
                  Fans need attention
                </h3>
                {[
                  { name: "Jordan P.", reason: "Renews tomorrow!", color: "border-red-500/30 bg-red-500/5" },
                  { name: "Alex T.", reason: "VIP — keep engaged", color: "border-amber-500/30 bg-amber-500/5" },
                  { name: "Casey R.", reason: "No contact in 10d", color: "border-blue-500/30 bg-blue-500/5" },
                ].map(a => (
                  <div key={a.name} className={`rounded-lg border p-3 ${a.color}`}>
                    <p className="text-xs font-medium">{a.name}</p>
                    <p className="text-[10px] text-[var(--muted)] mt-0.5">{a.reason}</p>
                    <div className="mt-2 flex gap-2">
                      <span className="rounded bg-brand-500/80 px-2 py-0.5 text-[10px] font-medium text-white">Copy Message</span>
                      <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-[var(--muted)]">View Fan</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Screenshot 3: Message Templates */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-1 shadow-2xl shadow-brand-500/5">
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[var(--border)]">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                <span className="ml-2 text-[10px] text-[var(--muted)]">Message Templates</span>
              </div>
              <div className="p-4 space-y-3">
                <h3 className="text-sm font-semibold">Copy, paste, send</h3>
                <p className="text-[10px] text-[var(--muted)]">8 proven templates for every situation. One click to copy.</p>
                {[
                  { cat: "Retention", title: "Renewal Reminder", preview: "Hey babe! Just wanted to let you know your renewal is coming up soon..." },
                  { cat: "Win-back", title: "Win Back Lapsed Fan", preview: "Hey! I noticed you've been away for a bit and I miss you!..." },
                  { cat: "VIP", title: "Whale Appreciation", preview: "I wanted to take a moment to tell you how much I appreciate..." },
                  { cat: "Upsell", title: "Custom Content Offer", preview: "I'm doing something special this week — custom content for my..." },
                ].map(t => (
                  <div key={t.title} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{t.title}</span>
                      <span className="rounded-full bg-brand-500/20 px-1.5 py-0.5 text-[9px] font-medium text-brand-400">{t.cat}</span>
                    </div>
                    <p className="text-[10px] text-[var(--muted)] line-clamp-2">{t.preview}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-[var(--muted)]">
            All this for <span className="font-semibold text-white">$0/month</span> with up to 25 fans.{" "}
            <Link href="/signup" className="text-brand-400 hover:text-brand-300 transition font-medium">Try it free →</Link>
          </p>
        </div>
      </section>

      {/* Value Props */}
      <section className="border-y border-[var(--border)] bg-[var(--card)] px-4 py-10">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 text-center md:grid-cols-4">
          <div>
            <p className="text-2xl font-bold">2 min</p>
            <p className="text-sm text-[var(--muted)]">setup time</p>
          </div>
          <div>
            <p className="text-2xl font-bold">8</p>
            <p className="text-sm text-[var(--muted)]">ready-made DM templates</p>
          </div>
          <div>
            <p className="text-2xl font-bold">$0</p>
            <p className="text-sm text-[var(--muted)]">to start — free up to 25 fans</p>
          </div>
          <div>
            <p className="text-2xl font-bold">10+</p>
            <p className="text-sm text-[var(--muted)]">platforms supported</p>
          </div>
        </div>
      </section>

      {/* Platform Compatibility */}
      <section className="px-4 py-14">
        <div className="mx-auto max-w-4xl text-center">
          <h3 className="mb-3 text-2xl font-bold">Works with every platform</h3>
          <p className="mb-8 text-sm text-[var(--muted)]">CreatorCRM works alongside your existing workflow. Copy a message, paste it into your DMs. That simple.</p>
          <div className="flex flex-wrap justify-center gap-4">
            {["OnlyFans", "Fansly", "Patreon", "Twitch", "YouTube", "Instagram", "Twitter / X", "TikTok"].map(p => (
              <div key={p} className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-5 py-2.5 text-sm font-medium">{p}</div>
            ))}
          </div>
          <p className="mt-5 text-xs text-[var(--muted)]">No integrations needed. No API keys. Just copy, paste, and send.</p>
        </div>
      </section>

      {/* Pain Points */}
      <section className="border-t border-[var(--border)] bg-[var(--card)] px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h3 className="mb-3 text-center text-3xl font-bold">Sound familiar?</h3>
          <p className="mb-10 text-center text-[var(--muted)]">CreatorCRM was built to solve the problems every creator deals with</p>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                problem: "You don't know which fans are about to leave",
                solution: "Churn risk scoring flags at-risk fans before they cancel, so you can reach out in time.",
              },
              {
                problem: "You spend hours figuring out who to DM",
                solution: "The Action Center tells you exactly who needs a message today and gives you the words to say.",
              },
              {
                problem: "Fans expire without you even noticing",
                solution: "Renewal alerts show who expires in the next 1-3 days with ready-to-send messages.",
              },
              {
                problem: "You're tracking fans in a spreadsheet (or not at all)",
                solution: "Import your fans in 2 minutes. CreatorCRM organizes, tags, and prioritizes them for you.",
              },
              {
                problem: "You never know what to say in DMs",
                solution: "8 proven message templates for every situation — welcome, renewal, win-back, VIP. Copy, paste, done.",
              },
              {
                problem: "You have no idea how much each fan is worth",
                solution: "Track lifetime spend, revenue by tag, and see which fans are your biggest earners at a glance.",
              },
            ].map((t) => (
              <div key={t.problem} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
                <p className="text-sm font-semibold text-red-400 mb-2 flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">&#10005;</span>
                  {t.problem}
                </p>
                <p className="text-sm text-[var(--muted)] leading-relaxed flex items-start gap-2">
                  <span className="text-green-400 shrink-0 mt-0.5">&#10003;</span>
                  {t.solution}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-3xl">
          <h3 className="mb-4 text-center text-3xl font-bold">Why creators switch to CreatorCRM</h3>
          <p className="mb-10 text-center text-[var(--muted)]">See how we compare to what you&apos;re doing now</p>
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--card)]">
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Feature</th>
                  <th className="px-4 py-3 text-center font-medium text-[var(--muted)]">Spreadsheet</th>
                  <th className="px-4 py-3 text-center font-medium text-[var(--muted)]">No CRM</th>
                  <th className="px-4 py-3 text-center font-medium text-brand-400">CreatorCRM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {[
                  ["Knows who to message today", "❌", "❌", "✅"],
                  ["Churn risk scoring", "❌", "❌", "✅"],
                  ["Renewal alerts", "❌", "❌", "✅"],
                  ["Ready-made DM templates", "❌", "❌", "✅"],
                  ["Revenue per fan analytics", "Manual", "❌", "✅"],
                  ["Platform tracking", "Manual", "❌", "✅"],
                  ["AI-generated DM scripts", "❌", "❌", "✅"],
                  ["Setup time", "Hours", "N/A", "2 min"],
                  ["Daily time spent", "1-3 hrs", "30 min guessing", "15 min"],
                  ["Monthly cost", "Free", "Free", "$0-29"],
                ].map(([feature, spreadsheet, noCrm, crm]) => (
                  <tr key={feature} className="hover:bg-[var(--card)]/50">
                    <td className="px-4 py-3 font-medium">{feature}</td>
                    <td className="px-4 py-3 text-center text-[var(--muted)]">{spreadsheet}</td>
                    <td className="px-4 py-3 text-center text-[var(--muted)]">{noCrm}</td>
                    <td className="px-4 py-3 text-center font-medium text-green-400">{crm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-[var(--border)] bg-[var(--card)] px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <h3 className="mb-4 text-center text-3xl font-bold">How it works</h3>
          <p className="mb-12 text-center text-[var(--muted)]">Set up in 2 minutes. Start saving fans today.</p>
          <div className="grid gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/20 border border-brand-500/30 text-xl font-bold text-brand-400">
                  {s.step}
                </div>
                <h4 className="mb-2 text-lg font-semibold">{s.title}</h4>
                <p className="text-sm text-[var(--muted)]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <h3 className="mb-4 text-center text-3xl font-bold">Everything you need to keep fans paying</h3>
          <p className="mb-12 text-center text-[var(--muted)]">Built by creators who were tired of losing subscribers they could have saved.</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
                <div className="mb-3 text-3xl">{f.icon}</div>
                <h4 className="mb-2 text-lg font-semibold">{f.title}</h4>
                <p className="text-sm text-[var(--muted)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="border-t border-[var(--border)] bg-[var(--card)] px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h3 className="mb-4 text-3xl font-bold">The math is simple</h3>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-8">
            <div className="space-y-4 text-left max-w-md mx-auto">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted)]">Average subscriber value</span>
                <span className="font-medium">$15-25/mo</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted)]">Fans you lose per month without a CRM</span>
                <span className="font-medium text-red-400">5-10 fans</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted)]">Revenue lost per month</span>
                <span className="font-medium text-red-400">$75-250/mo</span>
              </div>
              <div className="border-t border-[var(--border)] pt-4 flex justify-between text-sm">
                <span className="text-[var(--muted)]">CreatorCRM Pro cost</span>
                <span className="font-medium">{annual ? "$20.75/mo" : "$29/mo"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-green-400">You save</span>
                <span className="font-bold text-green-400 text-lg">{annual ? "$54-229/mo" : "$46-221/mo"}</span>
              </div>
            </div>
            <p className="mt-6 text-sm text-[var(--muted)]">Save just 2 subscribers and CreatorCRM pays for itself.</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h3 className="mb-4 text-center text-3xl font-bold">Simple, honest pricing</h3>
          <p className="mb-6 text-center text-[var(--muted)]">
            Free to start. Upgrade when you outgrow 25 fans.
          </p>

          {/* Billing Toggle */}
          <div className="mb-10 flex items-center justify-center gap-3">
            <span className={`text-sm font-medium ${!annual ? "text-white" : "text-[var(--muted)]"}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative h-7 w-12 rounded-full transition-colors ${annual ? "bg-brand-500" : "bg-[var(--border)]"}`}
              aria-label="Toggle annual billing"
            >
              <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform ${annual ? "translate-x-5.5 left-0.5" : "left-0.5"}`}
                style={{ transform: annual ? "translateX(22px)" : "translateX(0px)" }}
              />
            </button>
            <span className={`text-sm font-medium ${annual ? "text-white" : "text-[var(--muted)]"}`}>Annual</span>
            {annual && <span className="rounded-full bg-green-500/20 border border-green-500/30 px-2 py-0.5 text-xs font-medium text-green-400">Save 28%</span>}
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Starter */}
            <div className="rounded-xl border border-[var(--border)] p-8">
              <h4 className="text-xl font-bold">Starter</h4>
              <div className="mt-2 mb-1">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-[var(--muted)]">/forever</span>
              </div>
              <p className="mb-6 text-sm text-[var(--muted)]">Up to 25 fans</p>
              <ul className="mb-8 space-y-2">
                {[
                  "Fan tags & notes",
                  "Renewal alerts",
                  "Churn risk scoring",
                  "Action center",
                  "Message templates",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <span className="text-green-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block rounded-lg px-6 py-3 text-center font-medium transition border border-[var(--border)] text-[var(--muted)] hover:text-white"
              >
                Start Free — No Card Needed
              </Link>
            </div>

            {/* Pro Monthly / Annual */}
            <div className="rounded-xl border-2 border-brand-500 bg-brand-500/5 p-8 relative">
              <div className="mb-4 inline-block rounded-full bg-brand-500 px-3 py-1 text-xs font-medium text-white">
                Most Popular
              </div>
              <h4 className="text-xl font-bold">Pro</h4>
              <div className="mt-2 mb-1">
                <span className="text-4xl font-bold">{annual ? "$20.75" : "$29"}</span>
                <span className="text-[var(--muted)]">/month</span>
              </div>
              {annual && <p className="text-xs text-brand-400 font-medium mb-1">$249 billed annually — save $99/year</p>}
              <p className="mb-6 text-sm text-[var(--muted)]">Unlimited fans</p>
              <ul className="mb-8 space-y-2">
                {[
                  "Everything in Starter",
                  "Unlimited fan tracking",
                  "Revenue analytics & trend charts",
                  "Monthly performance comparison",
                  "Custom message templates",
                  "Saved fan segments & filters",
                  "CSV import & export",
                  "Platform tracking (OF, Fansly, Patreon...)",
                  "Revenue milestones & celebrations",
                  "Fan lifetime value estimator",
                  "AI DM script generator",
                  "Best time to message insights",
                  "Retention dashboard & heatmap",
                  "Weekly digest & insights",
                  "Priority support",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <span className="text-green-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block rounded-lg bg-brand-500 px-6 py-3 text-center font-medium text-white hover:bg-brand-600 transition"
              >
                Start 7-Day Free Trial
              </Link>
            </div>

            {/* Pro Annual (highlighted when toggle is off — shows savings) */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8">
              <div className="mb-4 inline-block rounded-full bg-green-500/20 border border-green-500/30 px-3 py-1 text-xs font-medium text-green-400">
                Best Value
              </div>
              <h4 className="text-xl font-bold">Pro Annual</h4>
              <div className="mt-2 mb-1">
                <span className="text-4xl font-bold">$249</span>
                <span className="text-[var(--muted)]">/year</span>
              </div>
              <p className="text-xs text-green-400 font-medium mb-1">That&apos;s $20.75/mo — save $99 vs monthly</p>
              <p className="mb-6 text-sm text-[var(--muted)]">Unlimited fans, billed once</p>
              <ul className="mb-8 space-y-2">
                {[
                  "Everything in Pro",
                  "Locked-in pricing for 12 months",
                  "Save $99 per year",
                  "Priority support",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <span className="text-green-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block rounded-lg px-6 py-3 text-center font-medium transition border border-green-500/50 text-green-400 hover:bg-green-500/10"
              >
                Start Annual Plan
              </Link>
            </div>
          </div>
          {/* Trust Signals */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {[
              { icon: "🔒", text: "No credit card required" },
              { icon: "↩️", text: "7-day money-back guarantee" },
              { icon: "✕", text: "Cancel anytime, no questions" },
              { icon: "🛡️", text: "Encrypted & secure" },
            ].map(t => (
              <div key={t.text} className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5">
                <span className="text-sm">{t.icon}</span>
                <span className="text-xs text-[var(--muted)]">{t.text}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-[var(--muted)]">All plans include a 7-day free trial. Cancel anytime. No questions asked.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-[var(--border)] bg-[var(--card)] px-4 py-20">
        <div className="mx-auto max-w-2xl">
          <h3 className="mb-10 text-center text-3xl font-bold">Frequently asked questions</h3>
          <div className="space-y-4">
            {[
              { q: "Is my data safe and private?", a: "Absolutely. Your data is encrypted, stored with row-level security, and no one — not even other CreatorCRM users — can access your fan list. We support two-factor authentication and never sell your data." },
              { q: "Do I need to connect my OnlyFans / Fansly account?", a: "No. CreatorCRM is a standalone CRM. You copy messages from CreatorCRM and paste them into your platform's DMs. No API keys, no account linking, no risk to your platform account." },
              { q: "What happens after the free trial?", a: "After your 7-day Pro trial, you can keep using CreatorCRM free forever with up to 25 fans. If you want unlimited fans and premium analytics, Pro is $29/month or $249/year — cancel anytime from Settings." },
              { q: "How is this different from a spreadsheet?", a: "A spreadsheet doesn't tell you who to message today, doesn't score churn risk, and doesn't give you ready-made messages. CreatorCRM does all of that automatically — saving you hours every day." },
              { q: "Can I switch between monthly and annual?", a: "Yes! You can switch from monthly to annual anytime from your Settings page. When you switch to annual, you'll immediately start saving $99/year. You can also switch back to monthly at the end of your annual term." },
              { q: "What platforms does CreatorCRM work with?", a: "CreatorCRM works with every platform — OnlyFans, Fansly, Patreon, Twitch, YouTube, Instagram, Twitter/X, TikTok, and more. It's a standalone CRM that doesn't require any integrations." },
            ].map(item => (
              <details key={item.q} className="group rounded-xl border border-[var(--border)] bg-[var(--bg)]">
                <summary className="cursor-pointer px-5 py-4 text-sm font-medium flex items-center justify-between list-none">
                  <span>{item.q}</span>
                  <svg className="h-4 w-4 text-[var(--muted)] shrink-0 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-4 text-sm text-[var(--muted)] leading-relaxed border-t border-[var(--border)] pt-3">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Email Capture */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-xl text-center">
          <h3 className="mb-2 text-2xl font-bold">Not ready to sign up yet?</h3>
          <p className="mb-6 text-sm text-[var(--muted)]">Drop your email and we&apos;ll send you creator tips and product updates. No spam, unsubscribe anytime.</p>
          {leadStatus === "done" ? (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              You&apos;re in! We&apos;ll keep you posted.
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setLeadStatus("sending");
                try {
                  const res = await fetch("/api/leads", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: leadEmail }),
                  });
                  if (res.ok) setLeadStatus("done");
                  else setLeadStatus("error");
                } catch { setLeadStatus("error"); }
              }}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm text-white outline-none focus:border-brand-500 transition"
              />
              <button
                type="submit"
                disabled={leadStatus === "sending"}
                className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50 whitespace-nowrap"
              >
                {leadStatus === "sending" ? "Joining..." : "Keep Me Posted"}
              </button>
            </form>
          )}
          {leadStatus === "error" && <p className="mt-2 text-xs text-red-400">Something went wrong. Try again.</p>}
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-[var(--border)] bg-[var(--card)] px-4 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <h3 className="mb-4 text-3xl font-bold">Stop losing fans you could save</h3>
          <p className="mb-8 text-[var(--muted)]">
            Every day without a CRM is money walking out the door. Set up in 2 minutes, free forever.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/signup" className="rounded-lg bg-brand-500 px-8 py-3 text-lg font-semibold text-white hover:bg-brand-600 transition">
              Get Started Free
            </Link>
          </div>
          <p className="mt-4 text-xs text-[var(--muted)]">Free forever for up to 25 fans. Set up in 2 minutes.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] px-4 py-8">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--muted)]">
          <p>CreatorCRM — Built for creators, by creators.</p>
          <div className="flex gap-6">
            <Link href="/help" className="hover:text-white transition">Help</Link>
            <Link href="/contact" className="hover:text-white transition">Contact</Link>
            <Link href="/terms" className="hover:text-white transition">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
