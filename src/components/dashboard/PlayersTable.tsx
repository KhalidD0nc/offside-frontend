'use client';

import Link from 'next/link';
import React from 'react';
import type { PlayerRow } from '@/lib/queries/dashboard';

const NEO_RAISED = '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)';
const NEO_INSET = 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)';
const CELL_INSET = 'inset 0 2px 4px rgba(0,0,0,0.02)';

const positionColor: Record<string, string> = {
  G: 'text-amber-600',
  GK: 'text-amber-600',
  D: 'text-secondary',
  CB: 'text-secondary',
  LB: 'text-secondary',
  RB: 'text-secondary',
  M: 'text-tertiary',
  CM: 'text-tertiary',
  CDM: 'text-tertiary',
  CAM: 'text-tertiary',
  LM: 'text-tertiary',
  RM: 'text-tertiary',
  F: 'text-primary',
  ST: 'text-primary',
  LW: 'text-primary',
  RW: 'text-primary',
  CF: 'text-primary',
};

const trendConfig = {
  up: { icon: 'trending_up', color: 'text-emerald-500', fill: true },
  flat: { icon: 'trending_flat', color: 'text-outline', fill: false },
  down: { icon: 'trending_down', color: 'text-error', fill: true },
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const COLUMNS = [
  'Player',
  'Pos',
  'Apps',
  'Avg Rating',
  'Goals',
  'Assists',
  'Top Weakness',
  'Trend',
  'Actions',
];

export default function PlayersTable({ players }: { players: PlayerRow[] }) {
  return (
    <section
      className="bg-background rounded-2xl p-8"
      style={{ boxShadow: NEO_RAISED }}
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-xl font-semibold text-on-surface">Player Performance Analysis</h3>
          <p className="text-sm text-on-surface-variant mt-1">
            Individual metrics and weakness indicators
          </p>
        </div>
        <button
          className="px-5 py-2.5 rounded-xl bg-background text-primary font-medium flex items-center gap-2 transition-opacity hover:opacity-80"
          style={{ boxShadow: NEO_RAISED }}
        >
          <span className="material-symbols-outlined text-sm">download</span>
          Export
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              {COLUMNS.map((col, i) => (
                <th
                  key={col}
                  className={`py-4 px-4 text-xs font-semibold text-on-surface-variant border-b-2 border-surface-variant opacity-50 uppercase tracking-wider ${
                    i >= 2 && i <= 5 ? 'text-center' : i === 7 ? 'text-center' : ''
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="h-4" colSpan={COLUMNS.length} />
            </tr>
            {players.map((player, idx) => {
              const trend = trendConfig[player.trendDirection];
              const posColor = positionColor[player.position] ?? 'text-on-surface-variant';
              const weaknessPct =
                player.topWeaknessValue > 1
                  ? player.topWeaknessValue.toFixed(0)
                  : (player.topWeaknessValue * 100).toFixed(0);

              return (
                <React.Fragment key={player.playerId}>
                  <tr className="group">
                    {/* Player */}
                    <td
                      className="py-4 px-4 rounded-l-xl bg-background"
                      style={{ boxShadow: CELL_INSET }}
                    >
                      <div className="flex items-center gap-3">
                        {player.photoUrl ? (
                          <img
                            src={player.photoUrl}
                            alt={player.name}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            style={{ boxShadow: NEO_RAISED }}
                          />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-sm font-bold text-primary flex-shrink-0"
                            style={{ boxShadow: NEO_RAISED }}
                          >
                            {getInitials(player.name)}
                          </div>
                        )}
                        <span className="font-semibold text-on-surface whitespace-nowrap">
                          {player.name}
                        </span>
                      </div>
                    </td>

                    {/* Position */}
                    <td className="py-4 px-4 bg-background" style={{ boxShadow: CELL_INSET }}>
                      <span
                        className={`px-3 py-1 rounded-lg bg-background text-xs font-semibold ${posColor}`}
                        style={{ boxShadow: NEO_INSET }}
                      >
                        {player.position}
                      </span>
                    </td>

                    {/* Apps */}
                    <td
                      className="py-4 px-4 text-center text-on-surface font-medium bg-background"
                      style={{ boxShadow: CELL_INSET }}
                    >
                      {player.apps}
                    </td>

                    {/* Avg Rating */}
                    <td
                      className="py-4 px-4 text-center bg-background"
                      style={{ boxShadow: CELL_INSET }}
                    >
                      <span
                        className="inline-block w-14 text-center py-1 rounded-lg bg-background font-bold text-on-surface"
                        style={{ boxShadow: NEO_INSET }}
                      >
                        {player.avgRating.toFixed(2)}
                      </span>
                    </td>

                    {/* Goals */}
                    <td
                      className="py-4 px-4 text-center text-on-surface font-medium bg-background"
                      style={{ boxShadow: CELL_INSET }}
                    >
                      {player.goals}
                    </td>

                    {/* Assists */}
                    <td
                      className="py-4 px-4 text-center text-on-surface font-medium bg-background"
                      style={{ boxShadow: CELL_INSET }}
                    >
                      {player.assists}
                    </td>

                    {/* Top Weakness */}
                    <td className="py-4 px-4 bg-background" style={{ boxShadow: CELL_INSET }}>
                      {player.topWeaknessLabel !== '—' ? (
                        <>
                          <span className="text-sm text-error font-medium">
                            {player.topWeaknessLabel}
                          </span>
                          <span className="text-xs text-on-surface-variant ml-1">
                            ({weaknessPct}%)
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-on-surface-variant">—</span>
                      )}
                    </td>

                    {/* Trend */}
                    <td
                      className="py-4 px-4 text-center bg-background"
                      style={{ boxShadow: CELL_INSET }}
                    >
                      <span
                        className={`material-symbols-outlined ${trend.color} bg-background rounded-full p-1`}
                        style={{
                          boxShadow: NEO_RAISED,
                          ...(trend.fill ? { fontVariationSettings: "'FILL' 1" } : {}),
                        }}
                      >
                        {trend.icon}
                      </span>
                    </td>

                    {/* Actions */}
                    <td
                      className="py-4 px-4 rounded-r-xl bg-background"
                      style={{ boxShadow: CELL_INSET }}
                    >
                      <Link
                        href="/analysis"
                        className="px-3 py-1.5 rounded-lg bg-background text-xs font-medium text-primary transition-opacity hover:opacity-70"
                        style={{ boxShadow: NEO_RAISED }}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                  {idx < players.length - 1 && (
                    <tr>
                      <td className="h-3" colSpan={COLUMNS.length} />
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
