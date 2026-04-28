import { NextResponse } from 'next/server';
import {
  fetchOpponentRecentMatches,
  fetchOpponentSeasonProfile,
  fetchOpponentKeyPlayers,
  fetchHeadToHeadHistory,
  fetchOpponentTacticalPatterns,
  fetchOpponentFormations,
} from '@/lib/queries/opponent-analysis';
import { generateOpponentAnalysis } from '@/lib/ai/opponent-analyst';

const AL_HILAL_NAME = 'Al Hilal';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { opponentName } = body;

    if (!opponentName) {
      return NextResponse.json({ error: 'opponentName is required' }, { status: 400 });
    }

    const [recentMatches, seasonProfile, keyPlayers, headToHead, tacticalPatterns, formations] = await Promise.all([
      fetchOpponentRecentMatches(opponentName, 10),
      fetchOpponentSeasonProfile(opponentName),
      fetchOpponentKeyPlayers(opponentName, 5),
      fetchHeadToHeadHistory(AL_HILAL_NAME, opponentName, 5),
      fetchOpponentTacticalPatterns(opponentName),
      fetchOpponentFormations(opponentName),
    ]);

    const analysis = await generateOpponentAnalysis({
      opponentName,
      myTeamName: AL_HILAL_NAME,
      recentMatches,
      seasonProfile,
      keyPlayers,
      headToHead,
      tacticalPatterns,
      formations,
    });

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Opponent analysis error:', error);
    return NextResponse.json({ error: 'Failed to generate opponent analysis' }, { status: 500 });
  }
}
