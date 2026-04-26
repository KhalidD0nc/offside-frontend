const NEO_RAISED = '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)';

export default function OverviewLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex justify-between items-center mb-10">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-surface-variant rounded-lg opacity-40" />
          <div className="h-4 w-56 bg-surface-variant rounded-lg opacity-30" />
        </div>
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-background rounded-2xl p-6 h-32"
            style={{ boxShadow: NEO_RAISED }}
          />
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="bg-background rounded-2xl h-72"
            style={{ boxShadow: NEO_RAISED }}
          />
        ))}
      </div>

      {/* Tactical insights skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-background rounded-xl h-40"
            style={{ boxShadow: NEO_RAISED }}
          />
        ))}
      </div>

      {/* Table skeleton */}
      <div
        className="bg-background rounded-2xl h-80"
        style={{ boxShadow: NEO_RAISED }}
      />
    </div>
  );
}
