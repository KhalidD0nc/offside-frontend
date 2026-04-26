'use client';

import { useState, useCallback } from 'react';
import TacticalPitch from './TacticalPitch';
import TimelineScrubber from './TimelineScrubber';
import type { MatchLineup } from '@/lib/queries/formations';

interface Props {
  myLineup: MatchLineup | null;
  oppLineup: MatchLineup | null;
}

export default function FormationPanel({ myLineup, oppLineup }: Props) {
  const [phase, setPhase] = useState<0 | 1 | 2>(0);

  const handlePhaseChange = useCallback((p: 0 | 1 | 2) => {
    setPhase(p);
  }, []);

  return (
    <div className="flex flex-col gap-6 h-full">
      <TacticalPitch myLineup={myLineup} oppLineup={oppLineup} phase={phase} />
      <TimelineScrubber onPhaseChange={handlePhaseChange} />
    </div>
  );
}
