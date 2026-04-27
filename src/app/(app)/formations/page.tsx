export const dynamic = 'force-dynamic';

import { fetchUpcomingFixtures, fetchMatchLineup, fetchOpponentIntel } from '@/lib/queries/formations';
import UpcomingFixturesList from '@/components/formations/UpcomingFixturesList';
import OpponentIntelCard from '@/components/formations/OpponentIntelCard';
import FormationPanel from '@/components/formations/FormationPanel';

const AL_HILAL_ID = 2932;

interface PageProps {
  searchParams: Promise<{ fixture?: string }>;
}

export default async function FormationsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const fixtures = await fetchUpcomingFixtures(AL_HILAL_ID).catch(() => []);
  if (fixtures.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-on-surface-variant">No upcoming fixtures found.</p>
      </div>
    );
  }

  const selectedId = params.fixture ? Number(params.fixture) : fixtures[0].fixtureId;
  const selectedFixture = fixtures.find((f) => f.fixtureId === selectedId) ?? fixtures[0];

  const isHome = selectedFixture.homeTeamId === AL_HILAL_ID;
  const opponentId = isHome ? selectedFixture.awayTeamId : selectedFixture.homeTeamId;
  const opponentName = isHome ? selectedFixture.awayTeamName : selectedFixture.homeTeamName;

  const [myLineup, oppLineup, opponentIntel] = await Promise.all([
    fetchMatchLineup(selectedFixture.fixtureId, AL_HILAL_ID).catch(() => null),
    fetchMatchLineup(selectedFixture.fixtureId, opponentId).catch(() => null),
    fetchOpponentIntel(opponentName).catch(() => ({ keyThreat: null, exploitableWeakness: null })),
  ]);

  return (
    <>
      <header className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-bold text-on-surface tracking-tight">Match Formations &amp; Analysis</h2>
          <p className="text-on-surface-variant mt-1 text-sm">
            Interactive tactical planning for upcoming fixtures.
          </p>
        </div>
        <button
          className="bg-surface text-primary px-6 py-3 rounded-xl font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
          style={{ boxShadow: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)' }}
        >
          <span className="material-symbols-outlined">save</span>
          Save Setup
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left column */}
        <aside className="xl:col-span-3 flex flex-col gap-6">
          <UpcomingFixturesList
            fixtures={fixtures}
            selectedId={selectedFixture.fixtureId}
            myTeamId={AL_HILAL_ID}
          />
          <OpponentIntelCard
            oppLineup={oppLineup}
            opponentIntel={opponentIntel}
            opponentName={opponentName}
          />
        </aside>

        {/* Right column */}
        <section className="xl:col-span-9">
          <FormationPanel myLineup={myLineup} oppLineup={oppLineup} />
        </section>
      </div>
    </>
  );
}
