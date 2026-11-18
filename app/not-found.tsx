import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-6 text-7xl font-bold text-brand-500">404</div>
        <h1 className="text-2xl font-bold mb-3">This page doesn&apos;t exist</h1>
        <p className="text-[var(--muted)] mb-8">
          Looks like this page went the way of an unrenewed subscriber. Let&apos;s get you back to managing your fans.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard" className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition">
            Go to Dashboard
          </Link>
          <Link href="/" className="rounded-lg border border-[var(--border)] px-6 py-2.5 text-sm font-medium text-[var(--muted)] hover:text-white transition">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
