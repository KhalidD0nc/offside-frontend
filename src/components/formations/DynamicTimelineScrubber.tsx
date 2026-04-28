'use client';

import { useState, useCallback, useMemo } from 'react';
import type { TacticalShift } from '@/lib/ai/opponent-analyst';
import { buildMatchPhases } from './matchPhases';

interface Props {
  shifts?: TacticalShift[];
  onPhaseChange: (phaseIndex: number) => void;
}

function minuteToPhase(minute: number, phases: ReturnType<typeof buildMatchPhases>): number {
  for (let i = 0; i < phases.length; i++) {
    if (minute >= phases[i].start && minute < phases[i].end) {
      return i;
    }
  }
  return phases.length - 1;
}

export default function DynamicTimelineScrubber({ shifts, onPhaseChange }: Props) {
  const [minute, setMinute] = useState(5);
  const phases = useMemo(() => buildMatchPhases(shifts), [shifts]);

  const currentPhase = minuteToPhase(minute, phases);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const m = Number(e.target.value);
      setMinute(m);
      onPhaseChange(minuteToPhase(m, phases));
    },
    [onPhaseChange, phases],
  );

  const activeWidth = (minute / 90) * 100;

  const phaseBoundaries = phases.map((p) => ({
    left: (p.start / 90) * 100,
    right: (p.end / 90) * 100,
  }));

  return (
    <div
      className="overflow-hidden rounded-2xl border border-white/50 bg-surface p-5"
      style={{ boxShadow: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)' }}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Live match script</p>
          <h3 className="text-lg font-black text-on-surface">
            {minute}&apos; · {phases[currentPhase]?.label}
          </h3>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-black text-white"
          style={{ backgroundColor: phases[currentPhase]?.accent }}
        >
          {phases[currentPhase]?.tempo}
        </span>
      </div>

      {/* Minute labels */}
      <div className="flex justify-between text-xs font-semibold text-on-surface-variant mb-3 px-1">
        <span>0&apos;</span>
        <span>HT</span>
        <span>90&apos;</span>
      </div>

      {/* Custom slider track */}
      <div className="relative flex h-10 w-full items-center">
        {/* Inset track */}
        <div
          className="absolute h-4 w-full rounded-full bg-surface"
          style={{ boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)' }}
        />
        <div className="absolute flex h-4 w-full overflow-hidden rounded-full">
          {phases.map((p) => (
            <div
              key={`${p.label}-${p.start}`}
              title={`${p.label}: ${p.start}'-${p.end}'`}
              style={{
                width: `${((p.end - p.start) / 90) * 100}%`,
                backgroundColor: p.accent,
                opacity: 0.28,
              }}
            />
          ))}
        </div>
        {/* Filled active segment */}
        <div
          className="absolute h-4 rounded-l-full"
          style={{
            width: `${activeWidth}%`,
            background: `linear-gradient(90deg, ${phases[0]?.accent}, ${phases[currentPhase]?.accent})`,
            opacity: 0.9,
            transition: 'width 0.1s',
          }}
        />
        {/* Segment dividers at phase boundaries */}
        <div className="absolute w-full flex pointer-events-none">
          {phaseBoundaries.slice(0, -1).map((boundary, idx) => (
            <div
              key={idx}
              className="h-4 w-px bg-white/70"
              style={{ position: 'absolute', left: `${boundary.right}%` }}
            />
          ))}
        </div>
        {/* Native range input — invisible but interactive */}
        <input
          type="range"
          min={0}
          max={90}
          step={1}
          value={minute}
          onChange={handleChange}
          className="absolute w-full opacity-0 cursor-pointer h-8"
          style={{ zIndex: 20 }}
        />
        {/* Custom thumb */}
        <div
          className="pointer-events-none absolute flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-on-surface"
          style={{
            left: `calc(${activeWidth}% - 16px)`,
            boxShadow: '0 12px 24px rgba(0,0,0,0.22)',
            transition: 'left 0.1s',
            zIndex: 15,
          }}
        >
          <div className="h-2.5 w-2.5 rounded-full bg-white" />
        </div>
      </div>

      {/* Phase legend */}
      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
        {phases.map((p, idx) => {
          const active = currentPhase === idx;
          return (
            <div
              key={p.label}
              title={p.dataReason ?? p.cue}
              className={`rounded-2xl border p-3 transition-all ${
                active ? 'scale-[1.02] border-white bg-white/55 text-on-surface' : 'border-outline-variant/60 bg-surface-container-low/60 text-on-surface-variant'
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.accent }} />
                <span className="text-[10px] font-black">{p.start}&apos;-{p.end}&apos;</span>
              </div>
              <p className="text-xs font-black leading-tight">{p.label}</p>
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug">{p.cue}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
