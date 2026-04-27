'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { UpcomingFixture } from '@/lib/queries/formations';

interface Props {
  fixtures: UpcomingFixture[];
  selectedId: number;
  myTeamId: number;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
}

export default function UpcomingFixturesList({ fixtures, selectedId, myTeamId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function selectFixture(fixtureId: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('fixture', String(fixtureId));
    router.push(`/formations?${params.toString()}`);
  }

  return (
    <section
      className="bg-surface rounded-xl p-5"
      style={{ boxShadow: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)' }}
    >
      <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-base">calendar_month</span>
        Upcoming Fixtures
      </h3>

      <div className="space-y-3">
        {fixtures.map((f, idx) => {
          const isSelected = f.fixtureId === selectedId;
          const isHome = f.homeTeamId === myTeamId;
          const opponent = isHome ? f.awayTeamName : f.homeTeamName;
          const opponentLogo = isHome ? f.awayTeamLogo : f.homeTeamLogo;
          const venue = isHome ? 'Home' : 'Away';

          return (
            <button
              key={f.fixtureId}
              onClick={() => selectFixture(f.fixtureId)}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-surface text-left transition-all duration-200"
              style={
                isSelected
                  ? { boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)' }
                  : undefined
              }
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden flex-shrink-0">
                  {opponentLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={opponentLogo} alt={opponent} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-xs font-bold text-on-surface-variant">{initials(opponent)}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface leading-tight">{opponent}</p>
                  <p className="text-xs text-on-surface-variant">
                    {formatDate(f.date)}, {venue}
                  </p>
                </div>
              </div>
              <span
                className={`material-symbols-outlined text-lg ${idx === 0 ? 'text-tertiary' : 'text-outline'}`}
                title={idx === 0 ? 'Next fixture' : 'Upcoming'}
              >
                {idx === 0 ? 'warning' : 'info'}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
