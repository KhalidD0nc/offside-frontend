import type { TacticalShift } from '@/lib/ai/opponent-analyst';

export interface MatchPhase {
  label: string;
  start: number;
  end: number;
  tempo: string;
  cue: string;
  accent: string;
  dataReason?: string;
  instructions: string[];
  formation?: string;
}

const DEFAULT_PHASES: MatchPhase[] = [
  {
    label: 'Kickoff Scan',
    start: 0,
    end: 8,
    tempo: 'Probe',
    cue: 'Read their press before forcing vertical balls.',
    accent: '#22c55e',
    instructions: ['Two safe exits before the first risky switch', 'Fullbacks hold until their winger commits'],
  },
  {
    label: 'Press Trap',
    start: 8,
    end: 18,
    tempo: 'Hunt',
    cue: 'Invite the pass wide, then lock the touchline.',
    accent: '#f59e0b',
    instructions: ['Wide players squeeze inside', 'Near 8 jumps on backward pass', 'Opposite winger blocks recycle'],
  },
  {
    label: 'First Wave',
    start: 18,
    end: 30,
    tempo: 'Punch',
    cue: 'Right side attacks the channel while the left side keeps the rest defence locked.',
    accent: '#ef4444',
    instructions: ['RB/RW overload goes high', 'Left back stays connected', '9 pins centre-backs'],
  },
  {
    label: 'Control Spell',
    start: 30,
    end: 42,
    tempo: 'Cool',
    cue: 'Slow the game and make them chase the ball.',
    accent: '#06b6d4',
    instructions: ['Wide players narrow to protect counters', 'Recycle through the 6', 'Keep rest defence as 2+3'],
  },
  {
    label: 'Half-Time Sting',
    start: 42,
    end: 45,
    tempo: 'Steal',
    cue: 'Last action before the break should be ours.',
    accent: '#a855f7',
    instructions: ['Target second balls around the D', 'Counter-press for five seconds after loss'],
  },
  {
    label: 'Restart Blitz',
    start: 45,
    end: 56,
    tempo: 'Shock',
    cue: 'Restart with a right-lane surge before they reset their distances.',
    accent: '#fb7185',
    instructions: ['Right side jumps early', 'Left side holds cover', 'Shoot if block retreats'],
  },
  {
    label: 'Bench Window',
    start: 56,
    end: 68,
    tempo: 'Refresh',
    cue: 'Use fresh legs before the duel quality drops.',
    accent: '#84cc16',
    instructions: ['Prepare winger or 8 substitution', 'Keep one runner high during possession'],
  },
  {
    label: 'Chaos Minutes',
    start: 68,
    end: 80,
    tempo: 'Break',
    cue: 'The game stretches. Right side runs, left side protects the counter lane.',
    accent: '#f97316',
    instructions: ['Right runner attacks space', 'Left back delays release', 'Protect central counter lane'],
  },
  {
    label: 'Game State Lock',
    start: 80,
    end: 90,
    tempo: 'Close',
    cue: 'Choose the right ending: kill it or overload the box.',
    accent: '#2563eb',
    instructions: ['If leading, defend crosses with back-post cover', 'If chasing, add a second box runner'],
  },
];

function parseTimeRange(timeRange: string): { start: number; end: number } | null {
  const [startStr, endStr] = timeRange.split('-');
  const start = Number.parseInt(startStr, 10);
  const end = Number.parseInt(endStr, 10);

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return null;
  }

  return { start, end };
}

function overlaps(a: MatchPhase, b: { start: number; end: number }) {
  return Math.max(a.start, b.start) < Math.min(a.end, b.end);
}

export function buildMatchPhases(shifts?: TacticalShift[]): MatchPhase[] {
  if (!shifts || shifts.length === 0) {
    return DEFAULT_PHASES;
  }

  return DEFAULT_PHASES.map((phase) => {
    const matchingShift = shifts.find((shift) => {
      const range = parseTimeRange(shift.timeRange);
      return range ? overlaps(phase, range) : false;
    });

    if (!matchingShift) {
      return phase;
    }

    return {
      ...phase,
      dataReason: matchingShift.dataReason,
      formation: matchingShift.formation,
      instructions: matchingShift.instructions.length > 0 ? matchingShift.instructions : phase.instructions,
    };
  });
}
