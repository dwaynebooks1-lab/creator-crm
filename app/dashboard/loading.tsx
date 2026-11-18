export default function DashboardLoading() {
  return (
    <div className="min-h-screen">
      <nav className="border-b border-[var(--border)] px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="h-7 w-32 animate-pulse rounded bg-white/10" />
          <div className="flex gap-2">
            <div className="h-8 w-20 animate-pulse rounded-lg bg-white/10" />
            <div className="h-8 w-16 animate-pulse rounded-lg bg-white/10" />
          </div>
        </div>
      </nav>
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="h-3 w-16 animate-pulse rounded bg-white/10 mb-2" />
              <div className="h-6 w-12 animate-pulse rounded bg-white/10" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex gap-3 mb-4">
            <div className="h-9 flex-1 animate-pulse rounded-lg bg-white/10" />
            <div className="h-9 w-24 animate-pulse rounded-lg bg-white/10" />
          </div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3 border-t border-[var(--border)] py-3">
              <div className="h-4 w-4 animate-pulse rounded bg-white/10" />
              <div className="h-4 flex-1 animate-pulse rounded bg-white/10" />
              <div className="h-5 w-14 animate-pulse rounded-full bg-white/10" />
              <div className="h-4 w-16 animate-pulse rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
