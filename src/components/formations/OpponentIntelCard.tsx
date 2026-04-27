import type { MatchLineup, OpponentIntel } from '@/lib/queries/formations';

interface Props {
  oppLineup: MatchLineup | null;
  opponentIntel: OpponentIntel;
  opponentName: string;
}

export default function OpponentIntelCard({ oppLineup, opponentIntel, opponentName }: Props) {
  const { keyThreat, exploitableWeakness } = opponentIntel;
  const abbrev = opponentName.split(/\s+/).map((w) => w[0]).join('').slice(0, 3).toUpperCase();

  return (
    <section
      className="bg-surface rounded-xl p-5 flex-1"
      style={{ boxShadow: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)' }}
    >
      <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-base">analytics</span>
        Opponent Intel ({abbrev})
      </h3>

      <div className="space-y-5">
        {/* Defensive shape */}
        <div>
          <p className="text-xs text-on-surface-variant mb-1">Typical Defensive Shape</p>
          <div
            className="p-3 rounded-lg bg-surface font-semibold text-primary text-center text-sm"
            style={{ boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)' }}
          >
            {oppLineup?.formation ?? '—'}
          </div>
        </div>

        {/* Key threat */}
        <div>
          <p className="text-xs text-on-surface-variant mb-1">Key Threat</p>
          <div
            className="flex items-center gap-3 p-3 rounded-lg bg-surface"
            style={{ boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)' }}
          >
            {keyThreat ? (
              <>
                <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden flex-shrink-0">
                  {keyThreat.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={keyThreat.photoUrl} alt={keyThreat.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-error text-xl">sports_martial_arts</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface leading-tight">
                    {keyThreat.name}
                    <span className="text-on-surface-variant font-normal"> ({keyThreat.position})</span>
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {keyThreat.goals} goals · {keyThreat.avgRating.toFixed(1)} avg rating
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-on-surface-variant">No data available</p>
            )}
          </div>
        </div>

        {/* Exploitable weakness */}
        <div>
          <p className="text-xs text-on-surface-variant mb-1">Exploitable Weakness</p>
          <div
            className="flex items-center gap-3 p-3 rounded-lg bg-surface"
            style={{ boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)' }}
          >
            {exploitableWeakness ? (
              <>
                <span
                  className="material-symbols-outlined text-tertiary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  target
                </span>
                <div>
                  <p className="text-sm font-semibold text-on-surface leading-tight">{exploitableWeakness.name}</p>
                  <p className="text-xs text-on-surface-variant">
                    Low duel win rate ({exploitableWeakness.duelWinRate}%)
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-on-surface-variant">No data available</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
