import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — CreatorCRM",
  description: "Privacy Policy for CreatorCRM. We never sell your data.",
};

export default function Privacy() {
  return (
    <div className="min-h-screen">
      <nav className="border-b border-[var(--border)] px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="text-xl font-bold">Creator<span className="text-brand-500">CRM</span></Link>
          <Link href="/" className="text-sm text-[var(--muted)] hover:text-white transition">Back to Home</Link>
        </div>
      </nav>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        <div className="space-y-6 text-sm text-[var(--muted)] leading-relaxed">
          <p><strong className="text-white">Last updated:</strong> November 2026</p>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Information We Collect</h2>
            <p><strong className="text-white">Account information:</strong> When you sign up, we collect your name, email address, and password (encrypted).</p>
            <p className="mt-2"><strong className="text-white">Fan data:</strong> Information you enter about your fans including names, tags, spending amounts, renewal dates, and notes. This data belongs to you.</p>
            <p className="mt-2"><strong className="text-white">Payment information:</strong> Processed securely by Stripe. We never store your credit card details on our servers.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. How We Use Your Information</h2>
            <p>We use your information to: provide and maintain the Service, process payments, send important updates about the Service, and improve our product. We do not use your data for advertising.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Data Storage and Security</h2>
            <p>Your data is stored securely using Supabase (built on PostgreSQL) with row-level security enabled. This means your fan data is isolated — no other user can access it. All data is transmitted over HTTPS encryption.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Data Sharing</h2>
            <p>We do not sell, trade, or rent your personal information to third parties. We only share data with: Stripe (for payment processing) and Supabase (for data hosting). Both are industry-leading platforms with strong privacy practices.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Your Rights</h2>
            <p>You have the right to: access your data at any time, export your data as CSV, request deletion of your account and all associated data, and opt out of non-essential communications.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Cookies</h2>
            <p>We use essential cookies only for authentication (keeping you logged in). We do not use tracking cookies or third-party analytics cookies.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">7. Data Retention</h2>
            <p>We retain your data for as long as your account is active. If you delete your account, we will delete all your data within 30 days. Backups are purged within 90 days.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">8. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of material changes via email. Your continued use of the Service constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">9. Contact</h2>
            <p>If you have questions about this Privacy Policy or want to exercise your data rights, please contact us through the Service.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
