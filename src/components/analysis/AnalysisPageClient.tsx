'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AnalysisProgressModal from '@/components/analysis/AnalysisProgressModal';
import MatchCard from '@/components/analysis/MatchCard';
import { useActiveJobs } from '@/contexts/ActiveJobsContext';
import type { MatchVideo } from '@/lib/queries/analysis';

export default function AnalysisPageClient({ matches }: { matches: MatchVideo[] }) {
  const router = useRouter();
  const { addJob } = useActiveJobs();
  const [localMatches, setLocalMatches] = useState(matches);
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ matchId: string; r2Key: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      analyzed: localMatches.filter((m) => m.analysisStatus === 'completed').length,
      queued: localMatches.filter((m) => m.analysisStatus === 'queued').length,
      notStarted: localMatches.filter((m) => m.analysisStatus === 'not_started').length,
    }),
    [localMatches],
  );

  async function startAnalysis(match: MatchVideo) {
    setSubmittingKey(match.key);
    setError(null);

    try {
      const response = await fetch('/api/analysis/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          r2Key: match.key,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          competition: match.competition,
          primaryTeam: 'Al-Hilal Saudi FC',
        }),
      });

      const data = (await response.json()) as {
        matchId?: string;
        modalJobId?: string | null;
        status?: 'queued' | 'completed' | 'failed';
        error?: string;
      };

      if (!response.ok || !data.matchId) {
        throw new Error(data.error ?? 'Could not submit analysis.');
      }

      setLocalMatches((current) =>
        current.map((item) =>
          item.key === match.key
            ? {
                ...item,
                matchId: data.matchId ?? item.matchId,
                analysisStatus: data.status === 'completed' ? 'completed' : 'queued',
              }
            : item,
        ),
      );

      if (data.status === 'completed') {
        router.push(`/analysis/${data.matchId}?key=${encodeURIComponent(match.key)}`);
        return;
      }

      addJob({
        matchId: data.matchId,
        r2Key: match.key,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        submittedAt: new Date().toISOString(),
      });
      setProgress({ matchId: data.matchId, r2Key: match.key });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit analysis.');
    } finally {
      setSubmittingKey(null);
    }
  }

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-6 flex-wrap">
          <StatPill icon="check_circle" label="Analyzed" value={counts.analyzed} color="text-green-600" />
          <StatPill icon="schedule" label="Processing" value={counts.queued} color="text-amber-500" />
          <StatPill
            icon="radio_button_unchecked"
            label="Not Started"
            value={counts.notStarted}
            color="text-on-surface-variant"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-error/40 bg-error-container px-4 py-3 text-sm font-medium text-on-error-container">
            {error}
          </div>
        )}

        {localMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {localMatches.map((match) => (
              <MatchCard
                key={match.key}
                match={match}
                onStartAnalysis={startAnalysis}
                isSubmitting={submittingKey === match.key}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>

      <AnalysisProgressModal
        matchId={progress?.matchId ?? null}
        r2Key={progress?.r2Key ?? null}
        onDismiss={() => setProgress(null)}
      />
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
