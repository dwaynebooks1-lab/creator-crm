import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog — CreatorCRM",
  description: "See what's new in CreatorCRM. We ship updates every week to help creators manage fans better.",
};

const UPDATES = [
  {
    date: "Nov 2024",
    tag: "New",
    items: [
      "AI-powered DM scripts — personalized messages generated for each fan based on spending and risk level",
      "Best Time to Message — see when your fans are most active for optimal engagement",
      "Review system — leave feedback right from your dashboard",
      "Weekly email digest with fan stats, revenue trends, and action items",
    ],
  },
  {
    date: "Oct 2024",
    tag: "New",
    items: [
      "Revenue analytics dashboard with 6-month trend charts",
      "Saved segments — save your most-used filter combos and load them in one click",
      "Custom message templates — create and save your own DM templates (Pro)",
      "CSV import for bulk fan upload",
    ],
  },
  {
    date: "Sep 2024",
    tag: "Launch",
    items: [
      "Smart Action Center with priority-ranked alerts",
      "8 built-in message templates for common scenarios",
      "Fan tagging system (Whale, VIP, Regular, New, At-Risk)",
      "Churn risk scoring for every fan",
      "Renewal alerts with ready-to-send messages",
      "Multi-platform support (10+ platforms)",
      "Two-factor authentication (TOTP)",
      "Free tier: up to 25 fans, forever free",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen">
      <nav className="border-b border-[var(--border)] px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Creator<span className="text-brand-500">CRM</span>
          </Link>
          <Link href="/signup" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold mb-2">Changelog</h1>
        <p className="text-[var(--muted)] mb-12">What&apos;s new in CreatorCRM. We ship updates regularly.</p>

        <div className="space-y-12">
          {UPDATES.map((update) => (
            <div key={update.date} className="relative pl-8 border-l-2 border-[var(--border)]">
              <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-brand-500 bg-[var(--bg)]" />
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-semibold">{update.date}</h2>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                  update.tag === "Launch"
                    ? "bg-brand-500/20 border-brand-500/30 text-brand-400"
                    : "bg-green-500/20 border-green-500/30 text-green-400"
                }`}>
                  {update.tag}
                </span>
              </div>
              <ul className="space-y-2">
                {update.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-[var(--muted)]">
                    <span className="text-brand-400 shrink-0 mt-0.5">+</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-[var(--muted)] mb-4">Want to try these features?</p>
          <Link href="/signup" className="inline-block rounded-lg bg-brand-500 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition">
            Start Free
          </Link>
        </div>
      </main>
    </div>
  );
}
