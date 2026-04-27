export default function MatchAnalysisLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-pulse">
      <div className="h-5 w-28 rounded-full bg-surface-container-high" />
      <div className="rounded-2xl bg-background p-6 space-y-5">
        <div className="h-8 w-72 rounded-xl bg-surface-container-high" />
        <div className="h-40 rounded-2xl bg-surface-container-high" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="h-56 rounded-2xl bg-surface-container-high" />
        <div className="h-56 rounded-2xl bg-surface-container-high" />
      </div>
    </div>
  );
}
