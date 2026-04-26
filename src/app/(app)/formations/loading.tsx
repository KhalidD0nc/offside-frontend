export default function FormationsLoading() {
  return (
    <>
      <header className="flex justify-between items-center mb-10">
        <div>
          <div className="h-9 w-72 bg-surface-container-high rounded-lg animate-pulse" />
          <div className="h-4 w-56 bg-surface-container rounded mt-2 animate-pulse" />
        </div>
        <div className="h-12 w-32 bg-surface-container-high rounded-xl animate-pulse" />
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left panel skeleton */}
        <aside className="xl:col-span-3 flex flex-col gap-6">
          <div
            className="bg-surface rounded-xl p-5 animate-pulse"
            style={{ boxShadow: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)' }}
          >
            <div className="h-4 w-32 bg-surface-container-high rounded mb-4" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-surface-container-highest" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-surface-container-high rounded w-24" />
                  <div className="h-3 bg-surface-container rounded w-16" />
                </div>
              </div>
            ))}
          </div>

          <div
            className="bg-surface rounded-xl p-5 flex-1 animate-pulse"
            style={{ boxShadow: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)' }}
          >
            <div className="h-4 w-28 bg-surface-container-high rounded mb-4" />
            <div className="space-y-4">
              <div className="h-10 bg-surface-container rounded-lg" />
              <div className="h-16 bg-surface-container rounded-lg" />
              <div className="h-16 bg-surface-container rounded-lg" />
            </div>
          </div>
        </aside>

        {/* Right panel skeleton */}
        <section className="xl:col-span-9 flex flex-col gap-6">
          <div
            className="bg-surface rounded-xl p-6 animate-pulse"
            style={{
              boxShadow: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)',
              minHeight: 480,
            }}
          >
            <div className="flex gap-2 mb-4">
              <div className="h-6 w-28 bg-primary/30 rounded-full" />
              <div className="h-6 w-20 bg-surface-container rounded-full" />
            </div>
            <div className="h-full min-h-72 bg-surface-container rounded-lg" />
          </div>
          <div
            className="bg-surface rounded-xl p-6 animate-pulse"
            style={{ boxShadow: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)' }}
          >
            <div className="h-3 bg-surface-container rounded w-full mb-4" />
            <div className="h-8 bg-surface-container-high rounded-full" />
          </div>
        </section>
      </div>
    </>
  );
}
