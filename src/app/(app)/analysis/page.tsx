export default function AnalysisPage() {
  return (
    <>
      <header className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-bold text-on-surface tracking-tight">Analysis</h2>
          <p className="text-on-surface-variant mt-1 text-sm">
            Deep-dive tactical breakdowns and match analysis.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        <div
          className="bg-background rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-64"
          style={{ boxShadow: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)' }}
        >
          <span
            className="material-symbols-outlined text-5xl text-primary mb-4"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            analytics
          </span>
          <h3 className="text-lg font-semibold text-on-surface mb-2">Analysis coming soon</h3>
          <p className="text-sm text-on-surface-variant">
            Deep-dive tactical breakdowns and match-level insights will live here.
          </p>
        </div>
      </div>
    </>
  );
}
