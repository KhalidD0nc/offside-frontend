export const dynamic = 'force-dynamic';

import { fetchUpcomingFixtures, fetchMatchLineup, fetchFormationCandidates } from '@/lib/queries/formations';
import { fetchOpponentSeasonProfile, fetchOpponentKeyPlayers, fetchHeadToHeadHistory, fetchOpponentFormations } from '@/lib/queries/opponent-analysis';
import MatchHeader from '@/components/formations/MatchHeader';
import FormationAnalysisClient from '@/components/formations/FormationAnalysisClient';

const AL_HILAL_ID = 2932;
const AL_HILAL_NAME = 'Al Hilal';

export default async function FormationsPage() {
  const fixtures = await fetchUpcomingFixtures(AL_HILAL_ID).catch(() => []);
  
  if (fixtures.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-on-surface-variant">No upcoming fixtures found.</p>
      </div>
    );
  }

  const selectedFixture = fixtures[0];
  const isHome = selectedFixture.homeTeamId === AL_HILAL_ID;
  const opponentId = isHome ? selectedFixture.awayTeamId : selectedFixture.homeTeamId;
  const opponentName = isHome ? selectedFixture.awayTeamName : selectedFixture.homeTeamName;
  const opponentLogo = isHome ? selectedFixture.awayTeamLogo : selectedFixture.homeTeamLogo;
  const venue = isHome ? 'Home' : 'Away';

  const [myLineup, oppLineup, seasonProfile, keyPlayers, headToHead, formations, formationCandidates] = await Promise.all([
    fetchMatchLineup(selectedFixture.fixtureId, AL_HILAL_ID).catch(() => null),
    fetchMatchLineup(selectedFixture.fixtureId, opponentId).catch(() => null),
    fetchOpponentSeasonProfile(opponentName).catch(() => null),
    fetchOpponentKeyPlayers(opponentName, 5).catch(() => []),
    fetchHeadToHeadHistory(AL_HILAL_NAME, opponentName, 5).catch(() => []),
    fetchOpponentFormations(opponentName).catch(() => []),
    fetchFormationCandidates('Al-Hilal Saudi FC').catch(() => []),
  ]);

  return (
    <>
      <MatchHeader
        myTeamName={AL_HILAL_NAME}
        myTeamLogo={fixtures[0]?.homeTeamLogo ?? null}
        opponentName={opponentName}
        opponentLogo={opponentLogo}
        date={selectedFixture.date}
        venue={venue}
        competition={selectedFixture.roundName}
      />

      <FormationAnalysisClient
        opponentName={opponentName}
        myLineup={myLineup}
        oppLineup={oppLineup}
        seasonProfile={seasonProfile}
        keyPlayers={keyPlayers}
        headToHead={headToHead}
        formations={formations}
        formationCandidates={formationCandidates}
      />
    </>
  );
}
