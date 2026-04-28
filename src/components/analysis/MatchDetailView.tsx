'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { MatchDetail, TacticalPhase } from '@/lib/queries/analysis';

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const NEO_RAISED = '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)';
const NEO_INSET = 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)';

const PERSPECTIVE_COLOR: Record<TacticalPhase['perspective'], string> = {
  opportunity: '#22c55e',
  threat: '#ef4444',
  neutral: '#9ca3af',
};

const PERSPECTIVE_BG: Record<TacticalPhase['perspective'], string> = {
  opportunity: 'bg-green-100 text-green-700',
  threat: 'bg-red-100 text-red-700',
  neutral: 'bg-gray-100 text-gray-600',
};

const PERSPECTIVE_LABEL: Record<TacticalPhase['perspective'], string> = {
  opportunity: 'Opportunity',
  threat: 'Threat',
  neutral: 'Neutral',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// ---------------------------------------------------------------------------
// Execution Rating Ring (SVG)
// ---------------------------------------------------------------------------
function RatingRing({ label, value }: { label: string; value: number }) {
  const r = 20;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(10, value)) / 10;
  const dash = pct * circumference;
  const color = value >= 7 ? '#22c55e' : value >= 5 ? '#f59e0b' : '#ef4444';

  return (
    <div
      className="flex flex-col items-center gap-1 p-3 rounded-xl bg-background"
      style={{ boxShadow: NEO_INSET }}
    >
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="5" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
        />
        <text
          x="28"
          y="33"
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fill="currentColor"
        >
          {value}
        </text>
      </svg>
      <span className="text-xs text-on-surface-variant whitespace-nowrap">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Team Logo
// ---------------------------------------------------------------------------
function TeamLogo({ name, logoUrl, size = 56 }: { name: string; logoUrl: string | null; size?: number }) {
  if (logoUrl) {
    return (
      <div
        className="relative rounded-full bg-background flex-shrink-0 flex items-center justify-center overflow-hidden"
        style={{ width: size, height: size, boxShadow: NEO_INSET }}
      >
        <Image src={logoUrl} alt={`${name} logo`} fill sizes={`${size}px`} className="object-contain p-2" />
      </div>
    );
  }
  return (
    <div
      className="rounded-full bg-background text-xs font-bold text-on-surface-variant flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, boxShadow: NEO_INSET }}
    >
      {name.split(' ').slice(0, 2).map((w) => w[0]).join('')}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat Pill
// ---------------------------------------------------------------------------
function StatPill({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background"
      style={{ boxShadow: NEO_RAISED }}
    >
      <span
        className="material-symbols-outlined text-primary"
        style={{ fontVariationSettings: "'FILL' 1", fontSize: '16px' }}
      >
        {icon}
      </span>
      <span className="text-sm font-bold text-on-surface">{value}</span>
      <span className="text-xs text-on-surface-variant">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phase Timeline
// ---------------------------------------------------------------------------
function PhaseTimeline({
  phases,
  onSelect,
}: {
  phases: TacticalPhase[];
  onSelect: (index: number) => void;
}) {
  if (phases.length === 0) return null;

  // Use duration-based flex weights so segments always fill 100% of the bar.
  // Fall back to equal weights if all durations are 0.
  const durations = phases.map((p) => Math.max(1, p.endSeconds - p.startSeconds));
  const totalDuration = durations.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-widest">
        Match Phases
      </h3>
      <div
        className="rounded-2xl p-4 bg-background"
        style={{ boxShadow: NEO_INSET }}
      >
        {/* Bar — flex so segments always fill full width */}
        <div className="flex h-10 rounded-xl overflow-hidden gap-0.5 w-full">
          {phases.map((phase, i) => (
            <button
              key={phase.id}
              title={`${phase.phaseOfPlay} — ${phase.startTimestamp} → ${phase.endTimestamp}`}
              onClick={() => onSelect(i)}
              className="h-full transition-opacity hover:opacity-75 active:opacity-50 group relative"
              style={{
                flex: durations[i] / totalDuration,
                backgroundColor: PERSPECTIVE_COLOR[phase.perspective],
                minWidth: 0,
              }}
            >
              {/* Phase number badge on hover */}
              <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity">
                {i + 1}
              </span>
            </button>
          ))}
        </div>

        {/* Labels — same flex proportions */}
        <div className="flex mt-2 gap-0.5 w-full">
          {phases.map((phase, i) => (
            <div
              key={phase.id}
              className="overflow-hidden min-w-0"
              style={{ flex: durations[i] / totalDuration }}
            >
              <p
                className="text-[9px] font-semibold text-on-surface-variant truncate leading-tight"
                title={phase.phaseOfPlay}
              >
                {i + 1}. {phase.phaseOfPlay}
              </p>
              <p className="text-[9px] text-on-surface-variant/60 tabular-nums">
                {phase.startTimestamp}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {(['opportunity', 'threat', 'neutral'] as const).map((p) => (
          <div key={p} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: PERSPECTIVE_COLOR[p] }}
            />
            <span className="text-xs text-on-surface-variant capitalize">{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phase Card
// ---------------------------------------------------------------------------
function PhaseCard({ phase, index }: { phase: TacticalPhase; index: number }) {
  const color = PERSPECTIVE_COLOR[phase.perspective];

  return (
    <div
      id={`phase-${index}`}
      className="rounded-2xl bg-background p-6 flex flex-col gap-4 relative overflow-hidden"
      style={{ boxShadow: NEO_RAISED }}
    >
      {/* Left accent */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ backgroundColor: color }}
      />

      {/* Top row */}
      <div className="flex items-start justify-between gap-3 pl-3">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-base font-bold text-on-surface leading-tight">
            {phase.phaseOfPlay}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed">
              {phase.eventType}
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PERSPECTIVE_BG[phase.perspective]}`}
            >
              {PERSPECTIVE_LABEL[phase.perspective]}
            </span>
          </div>
        </div>
        <span className="text-xs font-mono text-on-surface-variant whitespace-nowrap">
          #{index + 1}
        </span>
      </div>

      {/* Time + Zone */}
      <div className="flex items-center gap-3 pl-3 flex-wrap">
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background"
          style={{ boxShadow: NEO_INSET }}
        >
          <span
            className="material-symbols-outlined text-on-surface-variant"
            style={{ fontSize: '14px' }}
          >
            schedule
          </span>
          <span className="text-xs font-mono font-semibold text-on-surface">
            {phase.startTimestamp} → {phase.endTimestamp}
          </span>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background"
          style={{ boxShadow: NEO_INSET }}
        >
          <span
            className="material-symbols-outlined text-on-surface-variant"
            style={{ fontSize: '14px' }}
          >
            location_on
          </span>
          <span className="text-xs font-medium text-on-surface-variant truncate max-w-40">
            {phase.pitchZone}
          </span>
        </div>
      </div>

      {/* Execution Ratings */}
      <div className="flex items-center gap-4 pl-3">
        <RatingRing label="Attack" value={phase.attackRating} />
        <RatingRing label="Defense" value={phase.defenseRating} />
        <p className="text-xs text-on-surface-variant leading-relaxed flex-1 italic">
          {phase.tacticalDescription}
        </p>
      </div>

      {/* Key Insight */}
      <div
        className="pl-4 border-l-2 ml-3"
        style={{ borderColor: color }}
      >
        <p className="text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
          Key Insight
        </p>
        <p className="text-sm text-on-surface italic leading-relaxed">{phase.keyInsight}</p>
      </div>

      {/* Coach Advice */}
      <div className="flex items-start gap-2 bg-primary-fixed/30 rounded-xl px-4 py-3 ml-3">
        <span
          className="material-symbols-outlined text-primary flex-shrink-0 mt-0.5"
          style={{ fontVariationSettings: "'FILL' 1", fontSize: '16px' }}
        >
          lightbulb
        </span>
        <p className="text-xs text-on-surface leading-relaxed">{phase.coachAdvice}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Comprehensive Analysis (markdown parser)
// ---------------------------------------------------------------------------
interface AnalysisSection {
  number: number;
  title: string;
  body: string;
}

function parseAnalysisMd(md: string): AnalysisSection[] {
  const sections: AnalysisSection[] = [];
  const parts = md.split(/^####\s+/m).filter(Boolean);
  parts.forEach((part, i) => {
    const newline = part.indexOf('\n');
    const title = newline >= 0 ? part.slice(0, newline).trim() : part.trim();
    const body = newline >= 0 ? part.slice(newline + 1).trim() : '';
    // Strip the leading "1. " or "2. " numbering from title if present
    const cleanTitle = title.replace(/^\d+\.\s*/, '');
    sections.push({ number: i + 1, title: cleanTitle, body });
  });
  return sections;
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function AnalysisSectionCard({ section }: { section: AnalysisSection }) {
  const lines = section.body.split('\n').filter((l) => l.trim());
  const bullets: string[] = [];
  const prose: string[] = [];

  for (const line of lines) {
    if (line.trim().startsWith('*') || line.trim().startsWith('-')) {
      bullets.push(line.replace(/^\s*[*-]\s*/, ''));
    } else {
      prose.push(line);
    }
  }

  return (
    <div
      className="rounded-2xl bg-background p-6 flex flex-col gap-4"
      style={{ boxShadow: NEO_RAISED }}
    >
      {/* Title row */}
      <div className="flex items-center gap-3">
        <div
          className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0"
          style={{ boxShadow: NEO_RAISED }}
        >
          <span className="text-xs font-black text-on-primary">{section.number}</span>
        </div>
        <h4 className="text-sm font-bold text-on-surface leading-tight">{section.title}</h4>
      </div>

      {/* Prose paragraphs */}
      {prose.length > 0 && (
        <div className="space-y-2">
          {prose.map((p, i) => (
            <p key={i} className="text-sm text-on-surface-variant leading-relaxed">
              {renderInline(p)}
            </p>
          ))}
        </div>
      )}

      {/* Bullets */}
      {bullets.length > 0 && (
        <ul className="space-y-2">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-on-surface-variant leading-relaxed">
              <span
                className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2"
              />
              <span>{renderInline(b)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------
export default function MatchDetailView({ data }: { data: MatchDetail }) {
  function scrollToPhase(index: number) {
    const el = document.getElementById(`phase-${index}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const analysisSections = parseAnalysisMd(data.comprehensiveAnalysisMd);

  return (
    <div className="max-w-5xl mx-auto space-y-10">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="space-y-6">
        {/* Back + competition */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Link
            href="/analysis"
            className="flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              arrow_back
            </span>
            Analysis
          </Link>
          <span className="inline-flex items-center gap-1.5 bg-primary-fixed text-on-primary-fixed rounded-full px-3 py-1 text-xs font-semibold">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1", fontSize: '14px' }}
            >
              emoji_events
            </span>
            {data.competition}
          </span>
        </div>

        {/* Match title card */}
        <div
          className="rounded-2xl bg-background p-6"
          style={{ boxShadow: NEO_RAISED }}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Home team */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <TeamLogo name={data.homeTeam} logoUrl={data.homeTeamLogo} size={68} />
              <div>
                <p className="text-xl font-bold text-primary leading-tight">{data.homeTeam}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">Home</p>
              </div>
            </div>

            {/* VS badge */}
            <div
              className="px-6 py-4 rounded-2xl bg-background text-center flex-shrink-0"
              style={{ boxShadow: NEO_INSET }}
            >
              <p className="text-sm font-black text-on-surface-variant uppercase tracking-widest">vs</p>
              <p className="text-xs text-on-surface-variant mt-1">{formatDate(data.matchDate)}</p>
            </div>

            {/* Away team */}
            <div className="flex items-center gap-4 flex-1 min-w-0 justify-end text-right">
              <div>
                <p className="text-xl font-bold text-on-surface leading-tight">{data.awayTeam}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">Away</p>
              </div>
              <TeamLogo name={data.awayTeam} logoUrl={data.awayTeamLogo} size={68} />
            </div>
          </div>
        </div>

        {/* Stat pills */}
        <div className="flex items-center gap-4 flex-wrap">
          <StatPill icon="analytics" label="Events Analyzed" value={String(data.inferenceEventCount)} />
          <StatPill icon="timer" label="Pipeline" value={formatDuration(data.pipelineDurationSeconds)} />
          <StatPill icon="layers" label="Tactical Phases" value={String(data.phases.length)} />
        </div>
      </div>

      {/* ── Video ─────────────────────────────────────────────────── */}
      {data.videoSource && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-widest">
            Match Footage
          </h3>
          <div
            className="rounded-2xl overflow-hidden bg-black"
            style={{ boxShadow: NEO_INSET }}
          >
            <video
              src={data.videoSource}
              controls
              preload="auto"
              className="w-full aspect-video object-contain bg-black"
              style={{ display: 'block' }}
            />
          </div>
        </div>
      )}

      {/* ── Phase Timeline ────────────────────────────────────────── */}
      {data.phases.length > 0 && (
        <PhaseTimeline phases={data.phases} onSelect={scrollToPhase} />
      )}

      {/* ── Phase Cards ───────────────────────────────────────────── */}
      {data.phases.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-widest">
            Phase Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.phases.map((phase, i) => (
              <PhaseCard key={phase.id} phase={phase} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* ── Comprehensive Analysis ────────────────────────────────── */}
      {analysisSections.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-widest">
              Comprehensive Analysis
            </h3>
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-background text-xs font-medium text-on-surface-variant"
              style={{ boxShadow: NEO_INSET }}
            >
              <span
                className="material-symbols-outlined text-primary"
                style={{ fontVariationSettings: "'FILL' 1", fontSize: '13px' }}
              >
                auto_awesome
              </span>
              AI Generated
            </div>
          </div>
          <div className="space-y-4">
            {analysisSections.map((section) => (
              <AnalysisSectionCard key={section.number} section={section} />
            ))}
          </div>
        </div>
      )}

      {/* ── Pipeline Footer ───────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 pb-6">
        <span
          className="material-symbols-outlined text-on-surface-variant"
          style={{ fontVariationSettings: "'FILL' 1", fontSize: '14px' }}
        >
          check_circle
        </span>
        <p className="text-xs text-on-surface-variant text-center">
          Offside AI Match Engine v1.0
          <span className="mx-2 opacity-40">•</span>
          {data.inferenceEventCount} Events Processed
          <span className="mx-2 opacity-40">•</span>
          Analysis Complete
        </p>
      </div>

    </div>
  );
}
