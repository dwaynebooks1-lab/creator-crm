"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);

    const { error: insertError } = await supabase
      .from("support_tickets")
      .insert({ name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() });

    setSending(false);

    if (insertError) {
      setError("Something went wrong. Please try again.");
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="min-h-screen">
        <nav className="border-b border-[var(--border)] px-4 py-4">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              Creator<span className="text-brand-500">CRM</span>
            </Link>
            <div className="flex gap-3">
              <Link href="/help" className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white transition">
                Help
              </Link>
            </div>
          </div>
        </nav>

        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 border border-green-500/30">
            <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-3">Message sent!</h1>
          <p className="text-[var(--muted)] mb-8">
            Thanks for reaching out. We&apos;ll get back to you as soon as possible.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition">
              Back to Home
            </Link>
            <Link href="/help" className="rounded-lg border border-[var(--border)] px-6 py-2.5 text-sm font-medium text-[var(--muted)] hover:text-white transition">
              View FAQ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b border-[var(--border)] px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Creator<span className="text-brand-500">CRM</span>
          </Link>
          <div className="flex gap-3">
            <Link href="/help" className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white transition">
              Help
            </Link>
            <Link href="/dashboard" className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white transition">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
        <p className="text-[var(--muted)] mb-8">
          Have a question, bug report, or feature request? We&apos;d love to hear from you.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-500 transition placeholder:text-[var(--muted)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-500 transition placeholder:text-[var(--muted)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Subject</label>
            <select
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-500 transition"
            >
              <option value="">Select a topic...</option>
              <option value="General Question">General Question</option>
              <option value="Bug Report">Bug Report</option>
              <option value="Feature Request">Feature Request</option>
              <option value="Billing & Subscription">Billing & Subscription</option>
              <option value="Account Issue">Account Issue</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Message</label>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what's on your mind..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-500 transition placeholder:text-[var(--muted)] resize-none"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-lg bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send Message"}
          </button>
        </form>

        <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-sm font-semibold mb-3">Before you write...</h2>
          <ul className="space-y-2 text-sm text-[var(--muted)]">
            <li className="flex items-start gap-2">
              <span className="text-brand-400 mt-0.5">?</span>
              <span>Check our <Link href="/help" className="text-brand-400 hover:underline">FAQ</Link> — most questions are answered there.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-400 mt-0.5">?</span>
              <span>For billing, go to <Link href="/settings" className="text-brand-400 hover:underline">Settings</Link> and click &quot;Manage Subscription.&quot;</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-400 mt-0.5">?</span>
              <span>We typically respond within 24 hours.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
