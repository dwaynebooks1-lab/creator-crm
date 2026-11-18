import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Help & FAQ — CreatorCRM" };

const FAQ = [
  {
    q: "What is CreatorCRM?",
    a: "CreatorCRM is a fan management tool built specifically for content creators. It helps you track your fans, know who to message and when, prevent churn, and grow your revenue. Think of it as a personal assistant that tells you exactly which fans need attention today.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes! CreatorCRM is free forever for up to 25 fans. You get access to fan tags, notes, renewal alerts, churn risk scoring, the action center, and message templates. No credit card required.",
  },
  {
    q: "What does Pro include?",
    a: "Pro ($29/month) gives you unlimited fan tracking, revenue analytics and charts, CSV import and export, retention dashboard, engagement heatmap, spending distribution, leaderboard, smart tag suggestions, personalized growth tips, and priority support.",
  },
  {
    q: "How does the churn risk score work?",
    a: "Every fan gets a score from 0-100 based on how recently you messaged them, their tag, spending history, and upcoming renewal date. High risk (60+) means you should reach out immediately. The Action Center automatically surfaces your highest-priority fans.",
  },
  {
    q: "Can I import my existing fans?",
    a: "Yes! Click 'Import CSV' on the dashboard. Your CSV needs at least a 'Name' column. We'll also look for 'Tag', 'Spent' (or 'Revenue'/'Amount'), and 'Notes' columns automatically. Free users can import up to 25 fans total.",
  },
  {
    q: "How do message templates work?",
    a: "We provide 8 proven message templates for common situations: welcome, renewal reminder, win-back, whale appreciation, re-engagement, upsell, thank you, and casual check-in. Click 'Copy' and paste directly into your DMs. The Action Center also generates personalized messages for each fan that needs attention.",
  },
  {
    q: "Is my data safe?",
    a: "Absolutely. Your data is stored securely using Supabase (powered by PostgreSQL) with row-level security — meaning no other user can ever access your fan data. All connections use TLS encryption, and we support two-factor authentication (2FA). We never sell your data.",
  },
  {
    q: "Can I export my data?",
    a: "Yes, Pro users can export all fan data as a CSV file at any time from the dashboard or Settings page. Your data belongs to you.",
  },
  {
    q: "How do I cancel my subscription?",
    a: "Go to Settings → Subscription → Manage Subscription. This takes you to Stripe's customer portal where you can cancel, update payment info, or view invoices. Cancellation takes effect at the end of your current billing period.",
  },
  {
    q: "What are keyboard shortcuts?",
    a: "Press '/' to search, 'N' to add a new fan, 'T' to open message templates, and 'Esc' to close any panel. These work from anywhere on the dashboard.",
  },
  {
    q: "How do I delete my account?",
    a: "Go to Settings → scroll to Danger Zone → Delete My Account. This permanently removes all your data including fan records and cannot be undone. We recommend exporting your data first.",
  },
  {
    q: "What tags can I use for fans?",
    a: "CreatorCRM has 5 built-in tags: Whale (top spenders, $500+), VIP (loyal fans, $150+), Regular (consistent fans), New (just subscribed), and At-Risk (may leave). Smart Suggestions will recommend tag changes based on spending and activity.",
  },
];

export default function Help() {
  return (
    <div className="min-h-screen">
      <nav className="border-b border-[var(--border)] px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Creator<span className="text-brand-500">CRM</span>
          </Link>
          <div className="flex gap-3">
            <Link href="/dashboard" className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white transition">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Help & FAQ</h1>
        <p className="text-[var(--muted)] mb-8">Everything you need to know about CreatorCRM.</p>

        <div className="space-y-4">
          {FAQ.map((item, i) => (
            <details key={i} className="group rounded-xl border border-[var(--border)] bg-[var(--card)]">
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

        <div className="mt-12 rounded-xl border border-brand-500/30 bg-brand-500/5 p-6 text-center">
          <h2 className="text-lg font-bold mb-2">Still need help?</h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            Can&apos;t find what you&apos;re looking for? Send us a message and we&apos;ll get back to you.
          </p>
          <Link href="/contact" className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition">
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
