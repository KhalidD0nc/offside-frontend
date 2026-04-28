'use client';

import type { TacticalShift } from '@/lib/ai/opponent-analyst';
import { buildMatchPhases } from './matchPhases';

interface Props {
  phase: number;
  shifts?: TacticalShift[];
}

export default function CoachCueStrip({ phase, shifts = [] }: Props) {
  const phases = buildMatchPhases(shifts);
  const currentPhase = phases[Math.min(phase, phases.length - 1)] ?? phases[0];

  return (
    <section
      className="rounded-2xl border border-white/60 bg-surface px-5 py-4"
      style={{ boxShadow: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)' }}
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white"
              style={{ backgroundColor: currentPhase?.accent }}
            >
              Coach cue
            </span>
            <span className="text-xs font-black text-on-surface-variant">
              {currentPhase?.start}&apos;-{currentPhase?.end}&apos; · {currentPhase?.label}
            </span>
          </div>
          <p className="text-sm font-black leading-snug text-on-surface">{currentPhase?.cue}</p>
          {currentPhase?.dataReason && (
            <p className="mt-1 line-clamp-1 text-xs font-semibold text-on-surface-variant">{currentPhase.dataReason}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 xl:max-w-[54%] xl:justify-end">
          {currentPhase?.instructions.slice(0, 3).map((instruction) => (
            <span key={instruction} className="rounded-full bg-on-surface px-3 py-1.5 text-[11px] font-bold text-white">
              {instruction}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
