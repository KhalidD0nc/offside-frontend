// Image component not used - using regular img tag for logos

interface Props {
  myTeamName: string;
  myTeamLogo: string | null;
  opponentName: string;
  opponentLogo: string | null;
  date: string;
  venue: string;
  competition?: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function MatchHeader({ myTeamName, myTeamLogo, opponentName, opponentLogo, date, venue, competition }: Props) {
  return (
    <div
      className="bg-surface rounded-xl p-8 mb-8"
      style={{ boxShadow: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)' }}
    >
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Teams */}
        <div className="flex items-center gap-8 flex-1 justify-center">
          {/* My Team */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden">
              {myTeamLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={myTeamLogo} alt={myTeamName} className="w-full h-full object-contain" />
              ) : (
                <span className="text-2xl font-bold text-on-surface-variant">
                  {myTeamName
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 3)
                    .toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-on-surface text-center">{myTeamName}</p>
          </div>

          {/* VS */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-4xl font-bold text-primary">VS</span>
          </div>

          {/* Opponent */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden">
              {opponentLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={opponentLogo} alt={opponentName} className="w-full h-full object-contain" />
              ) : (
                <span className="text-2xl font-bold text-on-surface-variant">
                  {opponentName
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 3)
                    .toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-on-surface text-center">{opponentName}</p>
          </div>
        </div>

        {/* Match Info */}
        <div className="flex flex-col items-end gap-2 min-w-[200px]">
          {competition && (
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
              <span className="material-symbols-outlined text-primary text-sm">emoji_events</span>
              <span className="text-xs font-semibold text-primary">{competition}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-sm">calendar_month</span>
            <span className="text-sm text-on-surface">{formatDate(date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-sm">
              {venue === 'Home' ? 'home' : 'location_on'}
            </span>
            <span className="text-sm text-on-surface">{venue}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
