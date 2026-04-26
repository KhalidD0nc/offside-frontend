'use client';

import type { MatchLineup, LineupPlayer } from '@/lib/queries/formations';

interface Props {
  myLineup: MatchLineup | null;
  oppLineup: MatchLineup | null;
  phase: 0 | 1 | 2;
}

const PHASE_LABELS = ['Build-up', 'High Press', 'Low Block'] as const;

const ROLE_SHIFTS: Record<number, { from: string; to: string }[]> = {
  0: [
    { from: 'LB', to: 'LWB' },
    { from: 'CDM', to: 'CB (Drop)' },
  ],
  1: [
    { from: 'LW', to: 'Press Trigger' },
    { from: 'CM', to: 'Box-to-Box' },
  ],
  2: [
    { from: 'CM', to: 'Shield DM' },
    { from: 'ST', to: '2nd Striker' },
  ],
};

// Convert "row:col" grid string to percentage coordinates on the pitch.
// My team: GK (row 1) near bottom (~85% from top), forwards near top (~8%).
// Opponent: mirrored — GK near top (~8%), forwards near bottom (~85%).
function gridToPercent(
  grid: string,
  allPlayers: LineupPlayer[],
  phaseYOffset: number,
  flipY = false,
): { x: number; y: number } {
  const parts = grid.split(':').map(Number);
  const row = parts[0] ?? 1;
  const col = parts[1] ?? 1;

  const rows = allPlayers.map((p) => Number(p.grid.split(':')[0]));
  const maxRow = Math.max(...rows, 1);

  const colsInRow = allPlayers.filter((p) => Number(p.grid.split(':')[0]) === row).length;

  // Normal: GK at bottom, ST at top
  const baseY = flipY
    ? 8 + ((row - 1) / maxRow) * 80   // flipped: GK at top, ST at bottom
    : 8 + ((maxRow - row) / maxRow) * 80; // normal

  // GK row never shifts with phase
  const y = row === 1 ? baseY : baseY + (flipY ? -phaseYOffset : phaseYOffset);

  return {
    x: (col / (colsInRow + 1)) * 100,
    y: Math.max(2, Math.min(94, y)),
  };
}

// Phase 1: mids/forwards shift up (−5%), phase 2: all lines except GK shift down (+8%)
function phaseOffset(phase: 0 | 1 | 2, row: number, maxRow: number): number {
  if (phase === 0) return 0;
  if (phase === 1) return row >= Math.ceil(maxRow / 2) ? -5 : 0; // top half pushes up
  return 5; // everyone drops for low block
}

interface PlayerNodeProps {
  player: LineupPlayer;
  allPlayers: LineupPlayer[];
  phase: 0 | 1 | 2;
  isOpponent?: boolean;
}

function PlayerNode({ player, allPlayers, phase, isOpponent = false }: PlayerNodeProps) {
  const row = Number(player.grid.split(':')[0]);
  const maxRow = Math.max(...allPlayers.map((p) => Number(p.grid.split(':')[0])));
  const offset = phaseOffset(phase, row, maxRow);
  const { x, y } = gridToPercent(player.grid, allPlayers, offset, isOpponent);

  const label = player.playerPos || player.playerName.slice(0, 3).toUpperCase();

  return (
    <div
      title={player.playerName}
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        width: 32,
        height: 32,
        borderRadius: '50%',
        backgroundColor: isOpponent ? '#dc2626' : '#6366f1',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 600,
        boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
        opacity: isOpponent ? 0.65 : 1,
        transition: 'top 0.4s ease, left 0.4s ease',
        zIndex: isOpponent ? 1 : 2,
        cursor: 'default',
        userSelect: 'none',
      }}
    >
      {label}
    </div>
  );
}

export default function TacticalPitch({ myLineup, oppLineup, phase }: Props) {
  const myPlayers = myLineup?.players ?? [];
  const oppPlayers = oppLineup?.players ?? [];

  // Draw dashed movement arrow only in phase 0 (LB → LWB)
  const showArrow = phase === 0 && myPlayers.length > 0;

  // Find LB player for arrow start
  const lbPlayer = myPlayers.find((p) => p.playerPos === 'D' && p.grid.startsWith('2:1'));
  const arrowCoords = lbPlayer
    ? (() => {
        const { x, y } = gridToPercent(lbPlayer.grid, myPlayers, 0);
        return { x1: x, y1: y, x2: x + 8, y2: y - 12 };
      })()
    : null;

  return (
    <div
      className="flex-1 bg-surface rounded-xl p-6 flex flex-col relative"
      style={{
        boxShadow: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)',
        minHeight: 480,
      }}
    >
      {/* Subtle pitch tint */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{ backgroundColor: 'rgba(129,140,248,0.06)' }}
      />

      {/* Header row */}
      <div className="flex justify-between items-center mb-4 relative z-10">
        <div className="flex gap-2 flex-wrap">
          <span className="px-3 py-1 bg-primary text-on-primary rounded-full text-xs font-semibold shadow-sm">
            Phase: {PHASE_LABELS[phase]}
          </span>
          <span
            className="px-3 py-1 bg-surface text-on-surface-variant rounded-full text-xs font-semibold"
            style={{ boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)' }}
          >
            Shape: {myLineup?.formation ?? '—'}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
            style={{ boxShadow: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)' }}
          >
            <span className="material-symbols-outlined text-sm">zoom_in</span>
          </button>
          <button
            className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
            style={{ boxShadow: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)' }}
          >
            <span className="material-symbols-outlined text-sm">draw</span>
          </button>
        </div>
      </div>

      {/* Pitch */}
      <div
        className="flex-1 rounded-lg relative"
        style={{
          boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)',
          backgroundColor: '#e8eaf0',
          border: '2px solid rgba(255,255,255,0.4)',
          minHeight: 340,
        }}
      >
        {/* Pitch lines */}
        {/* Center line */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            width: '100%',
            height: 2,
            backgroundColor: 'rgba(255,255,255,0.4)',
          }}
        />
        {/* Center circle */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 90,
            height: 90,
            border: '2px solid rgba(255,255,255,0.4)',
            borderRadius: '50%',
          }}
        />
        {/* Penalty area top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 180,
            height: 72,
            border: '2px solid rgba(255,255,255,0.4)',
            borderTop: 'none',
          }}
        />
        {/* Penalty area bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 180,
            height: 72,
            border: '2px solid rgba(255,255,255,0.4)',
            borderBottom: 'none',
          }}
        />

        {/* Player nodes — opponent first so ours render on top */}
        {oppPlayers.map((p) => (
          <PlayerNode key={`opp-${p.grid}`} player={p} allPlayers={oppPlayers} phase={phase} isOpponent />
        ))}
        {myPlayers.map((p) => (
          <PlayerNode key={`my-${p.grid}`} player={p} allPlayers={myPlayers} phase={phase} />
        ))}

        {/* SVG movement arrow (LB → LWB, phase 0 only) */}
        {showArrow && arrowCoords && (
          <svg
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}
          >
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
              </marker>
            </defs>
            <path
              d={`M ${arrowCoords.x1}% ${arrowCoords.y1}% Q ${arrowCoords.x1 + 4}% ${(arrowCoords.y1 + arrowCoords.y2) / 2}% ${arrowCoords.x2}% ${arrowCoords.y2}%`}
              fill="none"
              stroke="#6366f1"
              strokeWidth="2"
              strokeDasharray="4"
              markerEnd="url(#arrowhead)"
            />
          </svg>
        )}

        {/* Role shifts panel */}
        <div
          className="absolute right-3 top-1/2 bg-surface rounded-xl p-3 w-44"
          style={{
            transform: 'translateY(-50%)',
            boxShadow: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)',
            zIndex: 10,
          }}
        >
          <h4 className="text-xs font-bold text-on-surface-variant uppercase pb-1 mb-2 border-b border-outline-variant">
            Role Shifts ({phase === 0 ? '0-30′' : phase === 1 ? '30-60′' : '60-90′'})
          </h4>
          <ul className="space-y-1">
            {ROLE_SHIFTS[phase].map((shift) => (
              <li key={shift.from} className="text-xs text-on-surface flex items-center gap-1 font-medium">
                <span>{shift.from}</span>
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 10 }}>
                  arrow_forward
                </span>
                <span className="text-on-surface-variant">{shift.to}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Empty state */}
        {myPlayers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-on-surface-variant">No lineup data for this fixture</p>
          </div>
        )}
      </div>
    </div>
  );
}
