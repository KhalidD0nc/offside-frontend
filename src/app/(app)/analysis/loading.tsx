export default function AnalysisLoading() {
  return (
    <>
      <header className="flex justify-between items-center mb-10">
        <div>
          <div className="h-9 w-40 rounded-lg bg-surface-container-high animate-pulse" />
          <div className="h-4 w-56 rounded-lg bg-surface-container-high animate-pulse mt-2" />
        </div>
      </header>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Summary bar skeleton */}
        <div className="flex items-center gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-9 w-32 rounded-xl bg-surface-container-high animate-pulse"
            />
          ))}
        </div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-background p-6 flex flex-col gap-5"
              style={{ boxShadow: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)' }}
            >
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="h-6 w-28 rounded-full bg-surface-container-high animate-pulse" />
                <div className="h-4 w-16 rounded-lg bg-surface-container-high animate-pulse" />
              </div>
              {/* Score row */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-3/4 rounded bg-surface-container-high animate-pulse" />
                  <div className="h-3 w-8 rounded bg-surface-container-high animate-pulse" />
                </div>
                <div className="h-12 w-24 rounded-xl bg-surface-container-high animate-pulse" />
                <div className="flex-1 space-y-1.5 items-end flex flex-col">
                  <div className="h-4 w-3/4 rounded bg-surface-container-high animate-pulse" />
                  <div className="h-3 w-8 rounded bg-surface-container-high animate-pulse" />
                </div>
              </div>
              {/* Footer */}
              <div className="flex items-center justify-between pt-1 border-t border-outline-variant">
                <div className="h-4 w-24 rounded bg-surface-container-high animate-pulse" />
                <div className="h-8 w-28 rounded-xl bg-surface-container-high animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
