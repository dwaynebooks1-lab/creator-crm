"use client";
import Link from "next/link";

const FEATURES = [
  {
    icon: "🏷️",
    title: "Smart Fan Tags",
    desc: "Auto-categorize fans as Whales, VIPs, At-Risk, or New. Know exactly who deserves your attention.",
  },
  {
    icon: "⏰",
    title: "Renewal Alerts",
    desc: "See which fans renew in the next 1-3 days. One personal message can save a $20/mo subscriber.",
  },
  {
    icon: "📊",
    title: "Revenue Tracking",
    desc: "Track lifetime spend per fan. Know who your top earners are and treat them right.",
  },
  {
    icon: "⚠️",
    title: "Churn Prevention",
    desc: "Fans who haven't engaged in 7+ days get flagged. Reach out before they leave.",
  },
  {
    icon: "📝",
    title: "Fan Notes",
    desc: "Remember preferences, kinks, conversation history. Personal touch at scale.",
  },
  {
    icon: "📅",
    title: "Message Scheduler",
    desc: "Plan your DMs and mass messages. Post at optimal times when fans are online.",
  },
];

const PRICING = [
  { name: "Starter", price: "$0", period: "/forever", fans: "Up to 25 fans", features: ["Fan tags & notes", "Renewal alerts", "Basic analytics"], cta: "Start Free", highlight: false },
  { name: "Pro", price: "$49", period: "/month", fans: "Unlimited fans", features: ["Everything in Starter", "Churn prevention alerts", "Message scheduler", "Revenue analytics", "Priority support"], cta: "Start 7-Day Free Trial", highlight: true },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-[var(--border)] px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-xl font-bold">
            Creator<span className="text-brand-500">CRM</span>
          </h1>
          <div className="flex gap-3">
            <Link href="/dashboard" className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] hover:text-white transition">
              Log In
            </Link>
            <Link href="/dashboard" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-block rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs text-brand-400">
            Built for content creators
          </div>
          <h2 className="mb-6 text-4xl font-bold leading-tight md:text-5xl">
            Stop losing fans you{" "}
            <span className="text-brand-500">could have saved</span>
          </h2>
          <p className="mb-8 text-lg text-[var(--muted)] md:text-xl">
            CreatorCRM tells you exactly who to message, when to message them, and
            tracks what converts. The fan management tool that pays for itself in
            one saved subscription.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/dashboard"
              className="rounded-lg bg-brand-500 px-8 py-3 text-lg font-semibold text-white hover:bg-brand-600 transition"
            >
              Start Free — No Card Needed
            </Link>
            <p className="text-sm text-[var(--muted)]">Free tier forever. Pro is $49/mo.</p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-y border-[var(--border)] bg-[var(--card)] px-4 py-10">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <p className="text-2xl font-bold">4+ hrs</p>
            <p className="text-sm text-[var(--muted)]">saved per day on average</p>
          </div>
          <div>
            <p className="text-2xl font-bold">23%</p>
            <p className="text-sm text-[var(--muted)]">less subscriber churn</p>
          </div>
          <div>
            <p className="text-2xl font-bold">$1,200+</p>
            <p className="text-sm text-[var(--muted)]">extra monthly revenue per creator</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <h3 className="mb-12 text-center text-3xl font-bold">Everything you need to manage fans</h3>
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

      {/* Pricing */}
      <section className="border-t border-[var(--border)] bg-[var(--card)] px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <h3 className="mb-4 text-center text-3xl font-bold">Simple pricing</h3>
          <p className="mb-12 text-center text-[var(--muted)]">
            Free to start. Upgrade when you&apos;re ready.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            {PRICING.map((p) => (
              <div
                key={p.name}
                className={`rounded-xl border p-8 ${
                  p.highlight
                    ? "border-brand-500 bg-brand-500/5"
                    : "border-[var(--border)]"
                }`}
              >
                {p.highlight && (
                  <div className="mb-4 inline-block rounded-full bg-brand-500 px-3 py-1 text-xs font-medium text-white">
                    Most Popular
                  </div>
                )}
                <h4 className="text-xl font-bold">{p.name}</h4>
                <div className="mt-2 mb-1">
                  <span className="text-4xl font-bold">{p.price}</span>
                  <span className="text-[var(--muted)]">{p.period}</span>
                </div>
                <p className="mb-6 text-sm text-[var(--muted)]">{p.fans}</p>
                <ul className="mb-8 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <span className="text-green-400">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/dashboard"
                  className={`block rounded-lg px-6 py-3 text-center font-medium transition ${
                    p.highlight
                      ? "bg-brand-500 text-white hover:bg-brand-600"
                      : "border border-[var(--border)] text-[var(--muted)] hover:text-white"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
        <p>CreatorCRM — Built for creators, by creators.</p>
      </footer>
    </div>
  );
}
