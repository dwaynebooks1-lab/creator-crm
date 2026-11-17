import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-brand-500 mb-4">404</p>
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="text-[var(--muted)] mb-8">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition">
            Go Home
          </Link>
          <Link href="/dashboard" className="rounded-lg border border-[var(--border)] px-6 py-2.5 text-sm font-medium text-[var(--muted)] hover:text-white transition">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
