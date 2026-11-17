"use client";
import Link from "next/link";

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
];

const PRICING = [
  {
    name: "Starter",
    price: "$0",
    period: "/forever",
    fans: "Up to 25 fans",
    features: [
      "Fan tags & notes",
      "Renewal alerts",
      "Churn risk scoring",
      "Action center",
      "Message templates",
    ],
    cta: "Start Free — No Card Needed",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    fans: "Unlimited fans",
    features: [
      "Everything in Starter",
      "Unlimited fan tracking",
      "Revenue analytics & charts",
      "CSV import & export",
      "Retention dashboard",
      "Priority support",
    ],
    cta: "Start 7-Day Free Trial",
    highlight: true,
  },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Add your fans", desc: "Import from CSV or add manually. Takes 2 minutes." },
  { step: "2", title: "Get action items", desc: "CreatorCRM tells you exactly who to message today and gives you the words." },
  { step: "3", title: "Watch revenue grow", desc: "Fans stay longer, spend more, and you save hours every day." },
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
          <p className="mt-4 text-sm text-[var(--muted)]">Free forever for up to 25 fans. Pro is $29/mo.</p>
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

      {/* How It Works */}
      <section className="px-4 py-20">
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
      <section className="border-t border-[var(--border)] bg-[var(--card)] px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <h3 className="mb-4 text-center text-3xl font-bold">Everything you need to keep fans paying</h3>
          <p className="mb-12 text-center text-[var(--muted)]">Built by creators who were tired of losing subscribers they could have saved.</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6">
                <div className="mb-3 text-3xl">{f.icon}</div>
                <h4 className="mb-2 text-lg font-semibold">{f.title}</h4>
                <p className="text-sm text-[var(--muted)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h3 className="mb-4 text-3xl font-bold">The math is simple</h3>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8">
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
                <span className="font-medium">$29/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-green-400">You save</span>
                <span className="font-bold text-green-400 text-lg">$46-221/mo</span>
              </div>
            </div>
            <p className="mt-6 text-sm text-[var(--muted)]">Save just 2 subscribers and CreatorCRM pays for itself.</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-[var(--border)] bg-[var(--card)] px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <h3 className="mb-4 text-center text-3xl font-bold">Simple, honest pricing</h3>
          <p className="mb-12 text-center text-[var(--muted)]">
            Free to start. Upgrade when you outgrow 25 fans.
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
                  href="/signup"
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

      {/* Final CTA */}
      <section className="px-4 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <h3 className="mb-4 text-3xl font-bold">Stop losing fans you could save</h3>
          <p className="mb-8 text-[var(--muted)]">
            Every day without a CRM is money walking out the door. Set up in 2 minutes, free forever.
          </p>
          <Link href="/signup" className="rounded-lg bg-brand-500 px-8 py-3 text-lg font-semibold text-white hover:bg-brand-600 transition">
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] px-4 py-8">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--muted)]">
          <p>CreatorCRM — Built for creators, by creators.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-white transition">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
