'use client';

import type { MatchLineup, LineupPlayer } from '@/lib/queries/formations';
import type { TacticalShift } from '@/lib/ai/opponent-analyst';
import { buildMatchPhases } from './matchPhases';

interface Props {
  myLineup: MatchLineup | null;
  oppLineup: MatchLineup | null;
  phase: number;
  shifts?: TacticalShift[];
}

const FALLBACK_HOME_KIT = '#2563eb';
const FALLBACK_AWAY_KIT = '#ef4444';

function safeKitColor(color: string | null | undefined, fallback: string): string {
  if (!color) return fallback;
  const normalized = color.trim();

  if (/^#[0-9a-f]{3}$/i.test(normalized) || /^#[0-9a-f]{6}$/i.test(normalized)) {
    return normalized;
  }

  return fallback;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map((char) => char + char).join('') : value;

  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

function textColorFor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? '#111827' : '#ffffff';
}

// Convert "row:col" grid string to percentage coordinates on the pitch.
// My team: GK (row 1) near bottom (~85% from top), forwards near top (~8%).
// Opponent: mirrored — GK near top (~8%), forwards near bottom (~85%).
function gridToPercent(
  grid: string,
  allPlayers: LineupPlayer[],
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

  return {
    x: (col / (colsInRow + 1)) * 100,
    y: Math.max(2, Math.min(94, baseY)),
  };
}

function tacticalMovement(
  phase: number,
  row: number,
  col: number,
  colsInRow: number,
  maxRow: number,
  isOpponent: boolean,
): { x: number; y: number } {
  if (row === 1) {
    return { x: 0, y: 0 };
  }

  const isBackLine = row === 2;
  const isForwardLine = row >= maxRow - 1;
  const isWideLeft = col === 1 && colsInRow > 2;
  const isWideRight = col === colsInRow && colsInRow > 2;
  const isCentral = !isWideLeft && !isWideRight;
  const forward = isOpponent ? 1 : -1;
  const compact = isWideLeft ? 1 : isWideRight ? -1 : 0;

  const movements = [
    { x: isWideRight ? 2 : isWideLeft ? -1 : 0, y: isForwardLine ? 1 : 0 },
    { x: compact * 2, y: isForwardLine ? forward * 4 : isBackLine ? 0 : forward * 2 },
    { x: isWideRight ? 7 : isWideLeft ? -1 : isCentral ? 2 : 0, y: isWideRight || isForwardLine ? forward * 8 : isBackLine ? 0 : forward * 3 },
    { x: compact * 3, y: isBackLine ? forward * 1 : 0 },
    { x: isCentral ? 1 : compact * 2, y: isForwardLine ? forward * 5 : forward * 2 },
    { x: isWideRight ? 8 : isWideLeft ? 0 : 2, y: isWideRight || isForwardLine ? forward * 7 : isBackLine ? 0 : forward * 3 },
    { x: isWideLeft ? -3 : isWideRight ? 4 : 0, y: isBackLine ? -forward * 2 : -forward * 1 },
    { x: isWideLeft ? -5 : isWideRight ? 6 : isCentral ? 2 : 0, y: isBackLine ? -forward * 4 : isForwardLine ? forward * 4 : 0 },
    { x: isWideLeft ? -4 : isWideRight ? 4 : 0, y: isBackLine ? -forward * 6 : isForwardLine ? forward * 6 : -forward * 2 },
  ];

  return movements[phase] ?? { x: 0, y: 0 };
}

interface PlayerNodeProps {
  player: LineupPlayer;
  allPlayers: LineupPlayer[];
  phase: number;
  isOpponent?: boolean;
  kitColor: string;
}

function PlayerNode({ player, allPlayers, phase, isOpponent = false, kitColor }: PlayerNodeProps) {
  const row = Number(player.grid.split(':')[0]);
  const col = Number(player.grid.split(':')[1]);
  const maxRow = Math.max(...allPlayers.map((p) => Number(p.grid.split(':')[0])));
  const colsInRow = allPlayers.filter((p) => Number(p.grid.split(':')[0]) === row).length;
  const base = gridToPercent(player.grid, allPlayers, isOpponent);
  const movement = tacticalMovement(phase, row, col, colsInRow, maxRow, isOpponent);
  const x = Math.max(3, Math.min(97, base.x + movement.x));
  const y = Math.max(3, Math.min(94, base.y + movement.y));

  const label = player.playerPos || player.playerName.slice(0, 3).toUpperCase();
  const textColor = textColorFor(kitColor);

  return (
    <div
      title={player.playerName}
      className="group"
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        width: 38,
        height: 38,
        borderRadius: '50%',
        background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.38), transparent 30%), ${kitColor}`,
        color: textColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 900,
        border: '2px solid rgba(255,255,255,0.82)',
        boxShadow: isOpponent ? '0 8px 18px rgba(15,23,42,0.18)' : '0 12px 24px rgba(15,23,42,0.25)',
        opacity: isOpponent ? 0.82 : 1,
        transition: 'top 0.48s cubic-bezier(0.2, 0.8, 0.2, 1), left 0.48s cubic-bezier(0.2, 0.8, 0.2, 1)',
        zIndex: isOpponent ? 1 : 2,
        cursor: 'default',
        userSelect: 'none',
      }}
    >
      {player.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={player.photoUrl} alt={player.playerName} className="h-full w-full rounded-full object-cover" />
      ) : (
        <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
          sports_soccer
        </span>
      )}
      <span
        className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 rounded-full bg-white px-1.5 py-0.5 text-[9px] font-black text-on-surface shadow-sm"
      >
        {label}
      </span>
      <span
        className="pointer-events-none absolute left-1/2 top-full mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-on-surface px-2 py-1 text-[10px] font-bold text-white shadow-lg group-hover:block"
        style={{ zIndex: 30 }}
      >
        {label} · {player.playerName}
      </span>
    </div>
  );
}

export default function TacticalPitch({ myLineup, oppLineup, phase, shifts = [] }: Props) {
  const myPlayers = myLineup?.players ?? [];
  const oppPlayers = oppLineup?.players ?? [];
  const phases = buildMatchPhases(shifts);
  const currentPhase = phases[Math.min(phase, phases.length - 1)] ?? phases[0];
  const myKitColor = safeKitColor(myLineup?.kitPrimary, FALLBACK_HOME_KIT);
  const oppKitColor = safeKitColor(oppLineup?.kitPrimary, FALLBACK_AWAY_KIT);

  const lbPlayer = myPlayers.find((p) => p.playerPos === 'D' && p.grid.startsWith('2:1'));
  const arrowCoords = lbPlayer
    ? (() => {
        const { x, y } = gridToPercent(lbPlayer.grid, myPlayers);
        return { x1: x, y1: y, x2: x + 8, y2: y - 12 };
      })()
    : null;

  return (
    <div
      className="relative flex min-h-[520px] flex-1 flex-col overflow-hidden rounded-2xl border border-white/55 bg-surface p-5"
      style={{
        boxShadow: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 12% 18%, rgba(34,197,94,0.15), transparent 24%), radial-gradient(circle at 88% 10%, rgba(239,68,68,0.12), transparent 22%), linear-gradient(135deg, rgba(255,255,255,0.28), transparent)',
        }}
      />

      <div className="relative z-10 mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-2 flex-wrap">
          <span
            className="rounded-full px-3 py-1 text-xs font-black text-white shadow-sm"
            style={{ backgroundColor: currentPhase?.accent }}
          >
            {currentPhase?.start}&apos;-{currentPhase?.end}&apos; · {currentPhase?.label}
          </span>
          <span
            className="px-3 py-1 bg-surface text-on-surface-variant rounded-full text-xs font-black"
            style={{ boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)' }}
          >
            Shape: {currentPhase?.formation ?? myLineup?.formation ?? '—'}
          </span>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-white/45 px-3 py-2">
          <span className="flex items-center gap-1 text-[11px] font-black text-on-surface">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: myKitColor }} />
            Us
          </span>
          <span className="flex items-center gap-1 text-[11px] font-black text-on-surface">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: oppKitColor }} />
            Opp
          </span>
        </div>
      </div>

      <div
        className="relative flex-1 overflow-hidden rounded-[1.25rem]"
        style={{
          boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)',
          background:
            'repeating-linear-gradient(90deg, rgba(34,197,94,0.13) 0 9%, rgba(34,197,94,0.20) 9% 18%), linear-gradient(180deg, #d9f99d, #86efac)',
          border: '2px solid rgba(255,255,255,0.4)',
          minHeight: 340,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            width: '100%',
            height: 2,
            backgroundColor: 'rgba(255,255,255,0.72)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 90,
            height: 90,
            border: '2px solid rgba(255,255,255,0.72)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 180,
            height: 72,
            border: '2px solid rgba(255,255,255,0.72)',
            borderTop: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 180,
            height: 72,
            border: '2px solid rgba(255,255,255,0.72)',
            borderBottom: 'none',
          }}
        />

        {oppPlayers.map((p) => (
          <PlayerNode key={`opp-${p.grid}`} player={p} allPlayers={oppPlayers} phase={phase} isOpponent kitColor={oppKitColor} />
        ))}
        {myPlayers.map((p) => (
          <PlayerNode key={`my-${p.grid}`} player={p} allPlayers={myPlayers} phase={phase} kitColor={myKitColor} />
        ))}

        {arrowCoords && (
          <svg
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}
          >
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill={currentPhase?.accent ?? myKitColor} />
              </marker>
            </defs>
            <path
              d={`M ${arrowCoords.x1}% ${arrowCoords.y1}% Q ${arrowCoords.x1 + 5}% ${(arrowCoords.y1 + arrowCoords.y2) / 2}% ${arrowCoords.x2}% ${arrowCoords.y2}%`}
              fill="none"
              stroke={currentPhase?.accent ?? myKitColor}
              strokeWidth="2"
              strokeDasharray="5"
              markerEnd="url(#arrowhead)"
            />
          </svg>
        )}

        {myPlayers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-on-surface-variant">No lineup data for this fixture</p>
          </div>
        )}
      </div>
    </div>
  );
}
