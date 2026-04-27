'use client';

import { useState, useCallback } from 'react';

interface Props {
  onPhaseChange: (phase: 0 | 1 | 2) => void;
}

const PHASES = [
  { label: "0-30': Build-up Focus", start: 0, end: 30 },
  { label: "30-60': High Press Transition", start: 30, end: 60 },
  { label: "60-90': Low Block Consolidation", start: 60, end: 90 },
] as const;

function minuteToPhase(minute: number): 0 | 1 | 2 {
  if (minute < 30) return 0;
  if (minute < 60) return 1;
  return 2;
}

export default function TimelineScrubber({ onPhaseChange }: Props) {
  const [minute, setMinute] = useState(5);
  const currentPhase = minuteToPhase(minute);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const m = Number(e.target.value);
      setMinute(m);
      onPhaseChange(minuteToPhase(m));
    },
    [onPhaseChange],
  );

  // Active segment width as percentage
  const activeWidth = (minute / 90) * 100;

  return (
    <div
      className="bg-surface rounded-xl p-6"
      style={{ boxShadow: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)' }}
    >
      {/* Minute labels */}
      <div className="flex justify-between text-xs font-semibold text-on-surface-variant mb-3 px-1">
        <span>0′ (Kickoff)</span>
        <span>30′</span>
        <span>60′</span>
        <span>90′ (FT)</span>
      </div>

      {/* Custom slider track */}
      <div className="relative w-full h-8 flex items-center">
        {/* Inset track */}
        <div
          className="absolute w-full h-3 bg-surface rounded-full"
          style={{ boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)' }}
        />
        {/* Filled active segment */}
        <div
          className="absolute h-3 rounded-l-full"
          style={{
            width: `${activeWidth}%`,
            backgroundColor: 'rgba(99,102,241,0.2)',
            transition: 'width 0.1s',
          }}
        />
        {/* Segment dividers at 30 and 60 */}
        <div className="absolute w-full flex pointer-events-none" style={{ paddingLeft: '33.33%', paddingRight: '33.33%' }}>
          <div className="w-px h-3 bg-outline-variant" />
          <div className="flex-1" />
          <div className="w-px h-3 bg-outline-variant" />
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
          className="absolute w-6 h-6 bg-primary rounded-full flex items-center justify-center pointer-events-none"
          style={{
            left: `calc(${activeWidth}% - 12px)`,
            boxShadow: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)',
            transition: 'left 0.1s',
            zIndex: 15,
          }}
        >
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
      </div>

      {/* Phase legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs font-medium">
        {PHASES.map((p, idx) => {
          const active = currentPhase === idx;
          return (
            <div key={p.label} className={`flex items-center gap-2 ${active ? 'text-primary' : 'text-on-surface-variant'}`}>
              <div
                className="w-3 h-3 rounded-full"
                style={
                  active
                    ? { backgroundColor: '#6366f1', boxShadow: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)' }
                    : { backgroundColor: '#e8eaf0', boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)' }
                }
              />
              {p.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
