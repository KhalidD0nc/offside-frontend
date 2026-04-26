export const dynamic = 'force-dynamic';

import { fetchAnalysisPageData } from '@/lib/queries/analysis';
import MatchCard from '@/components/analysis/MatchCard';

export default async function AnalysisPage() {
  const matches = await fetchAnalysisPageData();

  const analyzed = matches.filter((m) => m.analysisStatus === 'completed').length;
  const queued = matches.filter((m) => m.analysisStatus === 'queued').length;
  const notStarted = matches.filter((m) => m.analysisStatus === 'not_started').length;

  return (
    <>
      <header className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-bold text-on-surface tracking-tight">Analysis</h2>
          <p className="text-on-surface-variant mt-1 text-sm">
            Al-Hilal Saudi FC — {matches.length} Matches Available
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Summary bar */}
        <div className="flex items-center gap-6 flex-wrap">
          <StatPill
            icon="check_circle"
            label="Analyzed"
            value={analyzed}
            color="text-green-600"
          />
          <StatPill
            icon="schedule"
            label="Processing"
            value={queued}
            color="text-amber-500"
          />
          <StatPill
            icon="radio_button_unchecked"
            label="Not Started"
            value={notStarted}
            color="text-on-surface-variant"
          />
        </div>

        {/* Match grid */}
        {matches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches.map((m) => (
              <MatchCard key={m.key} match={m} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </>
  );
}

function StatPill({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background"
      style={{ boxShadow: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)' }}
    >
      <span
        className={`material-symbols-outlined text-base ${color}`}
        style={{ fontVariationSettings: "'FILL' 1", fontSize: '18px' }}
      >
        {icon}
      </span>
      <span className="text-sm font-bold text-on-surface">{value}</span>
      <span className="text-xs text-on-surface-variant">{label}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-64 bg-background"
      style={{ boxShadow: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)' }}
    >
      <span
        className="material-symbols-outlined text-5xl text-primary mb-4"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        video_library
      </span>
      <h3 className="text-lg font-semibold text-on-surface mb-2">No matches found</h3>
      <p className="text-sm text-on-surface-variant">
        Could not load matches from storage. Check your R2 configuration.
      </p>
    </div>
  );
}
