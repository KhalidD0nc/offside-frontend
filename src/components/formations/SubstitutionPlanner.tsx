'use client';

import type { MatchLineup, LineupPlayer } from '@/lib/queries/formations';
import type { TacticalShift } from '@/lib/ai/opponent-analyst';
import { buildMatchPhases } from './matchPhases';

interface Props {
  lineup: MatchLineup | null;
  shifts?: TacticalShift[];
  phase: number;
}

function roleGroup(position: string) {
  const normalized = position.toUpperCase();

  if (['G', 'GK'].includes(normalized)) return 'Keeper';
  if (['D', 'DF', 'CB', 'LB', 'RB', 'LWB', 'RWB'].includes(normalized)) return 'Back line';
  if (['M', 'MF', 'CM', 'DM', 'CDM', 'AM', 'CAM', 'LM', 'RM'].includes(normalized)) return 'Midfield';
  if (['F', 'FW', 'ST', 'CF', 'LW', 'RW'].includes(normalized)) return 'Attack';

  return 'Utility';
}

function pickSuggestedSub(substitutes: LineupPlayer[], phase: number) {
  if (substitutes.length === 0) return null;

  const preferredGroups =
    phase < 5
      ? ['Midfield', 'Attack', 'Utility']
      : phase < 7
        ? ['Attack', 'Midfield', 'Utility']
        : ['Attack', 'Back line', 'Midfield', 'Utility'];

  return (
    preferredGroups
      .map((group) => substitutes.find((player) => roleGroup(player.playerPos) === group))
      .find(Boolean) ?? substitutes[0]
  );
}

function pickPlayerToManage(players: LineupPlayer[], phase: number) {
  if (players.length === 0) return null;

  const targets =
    phase < 5
      ? ['M', 'CM', 'DM', 'CDM', 'AM']
      : phase < 7
        ? ['LW', 'RW', 'F', 'FW', 'ST', 'CF']
        : ['D', 'DF', 'LB', 'RB', 'CB'];

  return players.find((player) => targets.includes(player.playerPos.toUpperCase())) ?? players[players.length - 1];
}

export default function SubstitutionPlanner({ lineup, shifts, phase }: Props) {
  const substitutes = lineup?.substitutes ?? [];
  const starters = lineup?.players ?? [];
  const phases = buildMatchPhases(shifts);
  const currentPhase = phases[Math.min(phase, phases.length - 1)] ?? phases[0];
  const suggestedSub = pickSuggestedSub(substitutes, phase);
  const managedStarter = pickPlayerToManage(starters, phase);
  const windowLabel = phase < 5 ? 'Prepare only' : phase < 7 ? 'Best window' : 'Game-state call';
  const suggestionText =
    suggestedSub && managedStarter
      ? `${suggestedSub.playerName} for ${managedStarter.playerName}`
      : 'Bench data not available';

  return (
    <section
      className="overflow-hidden rounded-2xl border border-white/55 bg-surface p-5"
      style={{ boxShadow: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)' }}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Substitution board</p>
          <h3 className="text-lg font-black text-on-surface">{windowLabel}</h3>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-black text-white"
          style={{ backgroundColor: currentPhase?.accent }}
        >
          {currentPhase?.start}&apos;-{currentPhase?.end}&apos;
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_1.35fr]">
        <div className="rounded-2xl bg-white/55 p-4">
          <p className="text-xs font-bold text-on-surface-variant">Suggested change</p>
          <p className="mt-1 text-base font-black text-on-surface">{suggestionText}</p>
          <p className="mt-2 text-xs font-semibold leading-relaxed text-on-surface-variant">
            {phase < 5
              ? 'Keep him warm. The model expects the first useful lever after the restart or when duel quality drops.'
              : currentPhase?.cue}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {substitutes.length > 0 ? (
            substitutes.slice(0, 8).map((player) => (
              <div key={`${player.playerName}-${player.playerNumber}`} className="rounded-2xl bg-surface-container-low/70 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-on-surface text-white shadow-sm">
                    {player.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={player.photoUrl} alt={player.playerName} className="h-full w-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-base" aria-hidden="true">
                        sports_soccer
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wide text-on-surface-variant">
                        {roleGroup(player.playerPos)}
                      </span>
                      <span className="text-[10px] font-black text-on-surface">#{player.playerNumber ?? '-'}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs font-black text-on-surface">{player.playerName}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full rounded-2xl bg-surface-container-low/70 p-4 text-sm font-semibold text-on-surface-variant">
              Add substitute rows to `match_lineups` to unlock bench cards and swap suggestions.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
