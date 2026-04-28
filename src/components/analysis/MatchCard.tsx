'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { MatchVideo } from '@/lib/queries/analysis';

const NEO_RAISED = '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)';
const NEO_INSET = 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)';

const AL_HILAL = 'Al-Hilal Saudi FC';

const STATUS_CONFIG = {
  completed: { dot: '#22c55e', label: 'Analyzed' },
  queued:    { dot: '#f59e0b', label: 'Processing...' },
  failed:    { dot: '#ef4444', label: 'Failed' },
  not_started: { dot: '#9ca3af', label: 'Not Analyzed' },
};

interface Props {
  match: MatchVideo;
  onStartAnalysis?: (match: MatchVideo) => void;
  isSubmitting?: boolean;
}

export default function MatchCard({ match, onStartAnalysis, isSubmitting = false }: Props) {
  const {
    homeTeam,
    awayTeam,
    homeTeamLogo,
    awayTeamLogo,
    homeScore,
    awayScore,
    competition,
    round,
    analysisStatus,
  } = match;
  const status = STATUS_CONFIG[analysisStatus];
  const isHilalHome = homeTeam === AL_HILAL;
  const isHilalAway = awayTeam === AL_HILAL;

  return (
    <div
      className="rounded-2xl bg-background p-6 flex flex-col gap-5"
      style={{ boxShadow: NEO_RAISED }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 bg-primary-fixed text-on-primary-fixed rounded-full px-3 py-1 text-xs font-semibold">
          <span
            className="material-symbols-outlined text-sm"
            style={{ fontVariationSettings: "'FILL' 1", fontSize: '14px' }}
          >
            emoji_events
          </span>
          {competition}
        </span>
        <span className="text-xs font-medium text-on-surface-variant">{round}</span>
      </div>

      {/* Video preview */}
      {match.previewUrl && (
        <div className="rounded-xl overflow-hidden -mx-1" style={{ boxShadow: NEO_INSET }}>
          <video
            src={match.previewUrl}
            preload="metadata"
            controls
            className="w-full h-56 md:h-64 object-cover bg-surface-container-highest"
            style={{ display: 'block' }}
          />
        </div>
      )}

      {/* Teams & score */}
      <div className="flex items-center justify-between gap-4">
        {/* Home team */}
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <TeamLogo name={homeTeam} logoUrl={homeTeamLogo} />
          <div className="min-w-0">
            <p
              className={`text-sm font-semibold truncate ${isHilalHome ? 'text-primary' : 'text-on-surface'}`}
            >
              {homeTeam}
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">Home</p>
          </div>
        </div>

        {/* Score */}
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background"
          style={{ boxShadow: NEO_INSET }}
        >
          <span className="text-2xl font-black text-on-surface tabular-nums">{homeScore}</span>
          <span className="text-sm font-bold text-on-surface-variant">–</span>
          <span className="text-2xl font-black text-on-surface tabular-nums">{awayScore}</span>
        </div>

        {/* Away team */}
        <div className="flex-1 min-w-0 flex items-center justify-end gap-3 text-right">
          <div className="min-w-0">
            <p
              className={`text-sm font-semibold truncate ${isHilalAway ? 'text-primary' : 'text-on-surface'}`}
            >
              {awayTeam}
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">Away</p>
          </div>
          <TeamLogo name={awayTeam} logoUrl={awayTeamLogo} />
        </div>
      </div>

      {/* Footer: status + action */}
      <div className="flex items-center justify-between pt-1 border-t border-outline-variant">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: status.dot }}
          />
          <span className="text-xs text-on-surface-variant font-medium">{status.label}</span>
        </div>

        {analysisStatus === 'completed' ? (
          <Link
            href={`/analysis/${match.matchId}?key=${encodeURIComponent(match.key)}`}
            className="text-xs font-semibold text-on-primary bg-primary rounded-xl px-4 py-2 transition-opacity hover:opacity-90 inline-flex items-center gap-1.5"
            style={{ boxShadow: NEO_RAISED }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1", fontSize: '14px' }}
            >
              analytics
            </span>
            View Analysis
          </Link>
        ) : analysisStatus === 'queued' ? (
          <button
            disabled
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant rounded-xl px-4 py-2 opacity-60 cursor-not-allowed"
            style={{ boxShadow: NEO_INSET }}
          >
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            Queued...
          </button>
        ) : analysisStatus === 'failed' ? (
          <button
            type="button"
            onClick={() => onStartAnalysis?.(match)}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-error border border-error rounded-xl px-4 py-2 transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <span className="h-2 w-2 rounded-full bg-error animate-pulse" />}
            Retry
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onStartAnalysis?.(match)}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary rounded-xl px-4 py-2 transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
            {isSubmitting ? 'Starting...' : 'Start Analysis'}
          </button>
        )}
      </div>
    </div>
  );
}

function TeamLogo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  if (logoUrl) {
    return (
      <div
        className="relative h-12 w-12 md:h-14 md:w-14 rounded-full bg-background p-2 flex items-center justify-center overflow-hidden flex-shrink-0"
        style={{ boxShadow: NEO_INSET }}
      >
        <Image
          src={logoUrl}
          alt={`${name} logo`}
          fill
          sizes="56px"
          className="object-contain p-2"
        />
      </div>
    );
  }

  return (
    <div
      className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-background text-xs font-bold text-on-surface-variant flex items-center justify-center flex-shrink-0"
      style={{ boxShadow: NEO_INSET }}
      aria-label={`${name} logo unavailable`}
    >
      {name
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')}
    </div>
  );
}
