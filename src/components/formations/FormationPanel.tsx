'use client';

import { useState, useCallback } from 'react';
import TacticalPitch from './TacticalPitch';
import DynamicTimelineScrubber from './DynamicTimelineScrubber';
import SubstitutionPlanner from './SubstitutionPlanner';
import CoachCueStrip from './CoachCueStrip';
import type { FormationCandidate, LineupPlayer, MatchLineup } from '@/lib/queries/formations';
import type { OpponentAnalysisReport } from '@/lib/ai/opponent-analyst';

interface Props {
  myLineup: MatchLineup | null;
  oppLineup: MatchLineup | null;
  analysis: OpponentAnalysisReport | null;
  formationCandidates: FormationCandidate[];
}

function normalizeFormation(formation: string | null | undefined): number[] {
  const lines = formation
    ?.match(/\d+/g)
    ?.map((line) => Number.parseInt(line, 10))
    .filter((line) => Number.isFinite(line) && line > 0);

  return lines && lines.length > 0 ? lines : [4, 2, 3, 1];
}

function positionForLine(lineIndex: number, lineCount: number): 'D' | 'M' | 'F' {
  if (lineIndex === 0) return 'D';
  if (lineIndex === lineCount - 1) return 'F';
  return 'M';
}

function scoreCandidate(candidate: FormationCandidate): number {
  return candidate.avgRating * 10 + candidate.apps * 0.08 + candidate.goals * 0.7 + candidate.assists * 0.55;
}

function pickCandidates(
  candidates: FormationCandidate[],
  position: 'GK' | 'D' | 'M' | 'F',
  count: number,
  selected: Set<string>,
): FormationCandidate[] {
  const exact = candidates
    .filter((candidate) => candidate.playerPos === position && !selected.has(candidate.playerName))
    .sort((a, b) => scoreCandidate(b) - scoreCandidate(a));
  const fallback = candidates
    .filter((candidate) => !selected.has(candidate.playerName) && !exact.includes(candidate))
    .sort((a, b) => scoreCandidate(b) - scoreCandidate(a));
  const picked = [...exact, ...fallback].slice(0, count);

  picked.forEach((candidate) => selected.add(candidate.playerName));
  return picked;
}

function createSlotPlayer(candidate: FormationCandidate | undefined, playerPos: string, grid: string, index: number): LineupPlayer {
  return {
    playerName: candidate?.playerName ?? `Recommended ${playerPos}${index}`,
    playerPos,
    grid,
    playerNumber: candidate?.playerNumber ?? null,
    photoUrl: candidate?.photoUrl ?? null,
  };
}

function createAgentLineup(formation: string, candidates: FormationCandidate[]): MatchLineup {
  const lines = normalizeFormation(formation);
  const selected = new Set<string>();
  const goalkeeper = pickCandidates(candidates, 'GK', 1, selected)[0];
  const players: LineupPlayer[] = [createSlotPlayer(goalkeeper, 'GK', '1:1', 1)];

  lines.forEach((count, lineIndex) => {
    const position = positionForLine(lineIndex, lines.length);
    const lineCandidates = pickCandidates(candidates, position, count, selected);

    for (let col = 1; col <= count; col += 1) {
      players.push(createSlotPlayer(lineCandidates[col - 1], position, `${lineIndex + 2}:${col}`, players.length + 1));
    }
  });

  const substitutes = candidates
    .filter((candidate) => !selected.has(candidate.playerName))
    .sort((a, b) => scoreCandidate(b) - scoreCandidate(a))
    .slice(0, 8)
    .map((candidate, index) => createSlotPlayer(candidate, candidate.playerPos, `bench:${index + 1}`, index + 1));

  return {
    formation,
    kitPrimary: null,
    players,
    substitutes,
  };
}

export default function FormationPanel({ myLineup, oppLineup, analysis, formationCandidates }: Props) {
  const [phase, setPhase] = useState(0);

  const handlePhaseChange = useCallback((p: number) => {
    setPhase(p);
  }, []);

  const shifts = analysis?.suggestedShifts ?? [];
  const hasLineupData = (myLineup?.players.length ?? 0) > 0 || (oppLineup?.players.length ?? 0) > 0;

  if (!hasLineupData && !analysis) {
    return null;
  }

  const displayMyLineup =
    (myLineup?.players.length ?? 0) > 0
      ? myLineup
      : analysis
        ? createAgentLineup(analysis.recommendedFormation, formationCandidates)
        : null;
  const displayOppLineup = (oppLineup?.players.length ?? 0) > 0 ? oppLineup : null;

  return (
    <div className="flex flex-col gap-6 h-full">
      <TacticalPitch 
        myLineup={displayMyLineup} 
        oppLineup={displayOppLineup} 
        phase={phase}
        shifts={shifts}
      />
      <CoachCueStrip phase={phase} shifts={shifts} />
      <DynamicTimelineScrubber 
        shifts={shifts}
        onPhaseChange={handlePhaseChange} 
      />
      <SubstitutionPlanner lineup={displayMyLineup} shifts={shifts} phase={phase} />
    </div>
  );
}
