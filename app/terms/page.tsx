import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — CreatorCRM",
  description: "Terms of Service for CreatorCRM fan management platform.",
};

export default function Terms() {
  return (
    <div className="min-h-screen">
      <nav className="border-b border-[var(--border)] px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="text-xl font-bold">Creator<span className="text-brand-500">CRM</span></Link>
          <Link href="/" className="text-sm text-[var(--muted)] hover:text-white transition">Back to Home</Link>
        </div>
      </nav>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
        <div className="space-y-6 text-sm text-[var(--muted)] leading-relaxed">
          <p><strong className="text-white">Last updated:</strong> November 2026</p>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using CreatorCRM (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Description of Service</h2>
            <p>CreatorCRM is a fan management tool for content creators. We provide tools to track, organize, and manage your fan relationships. The Service is provided &quot;as is&quot; and &quot;as available.&quot;</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Accounts</h2>
            <p>You are responsible for maintaining the security of your account and password. You are responsible for all activities that occur under your account. You must notify us immediately of any unauthorized use.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Subscriptions and Billing</h2>
            <p>Some features require a paid subscription. Subscriptions are billed monthly. You can cancel at any time, and your access will continue until the end of the current billing period. Refunds are handled on a case-by-case basis.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Your Data</h2>
            <p>You retain ownership of all data you enter into CreatorCRM. We do not sell your data to third parties. You can export or delete your data at any time.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Acceptable Use</h2>
            <p>You agree not to use the Service for any unlawful purpose, to harass or harm others, to distribute malware, or to attempt to gain unauthorized access to the Service or its systems.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">7. Limitation of Liability</h2>
            <p>CreatorCRM shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service. Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">8. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. We will notify users of material changes via email or through the Service. Continued use after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">9. Contact</h2>
            <p>If you have questions about these Terms, please contact us through the Service.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
