import { supabase } from '@/lib/supabase/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UpcomingFixture {
  fixtureId: number;
  date: string;
  roundName: string;
  homeTeamId: number;
  homeTeamName: string;
  homeTeamLogo: string | null;
  awayTeamId: number;
  awayTeamName: string;
  awayTeamLogo: string | null;
  venueName: string | null;
}

export interface LineupPlayer {
  playerName: string;
  playerPos: string;
  grid: string;
  playerNumber: number | null;
}

export interface MatchLineup {
  formation: string;
  players: LineupPlayer[];
}

export interface OpponentPlayer {
  name: string;
  position: string;
  avgRating: number;
  goals: number;
  photoUrl: string | null;
}

export interface OpponentIntel {
  keyThreat: OpponentPlayer | null;
  exploitableWeakness: { name: string; position: string; duelWinRate: number } | null;
}

// ---------------------------------------------------------------------------
// Fetch functions
// ---------------------------------------------------------------------------

export async function fetchUpcomingFixtures(teamId: number): Promise<UpcomingFixture[]> {
  const { data, error } = await supabase
    .from('upcoming_fixtures')
    .select(
      'fixture_id, fixture_date, round_name, home_team_id, home_team_name, home_team_logo, away_team_id, away_team_name, away_team_logo, venue_name',
    )
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .eq('status_short', 'NS')
    .order('fixture_date', { ascending: true })
    .limit(5);

  if (error) throw error;
  return (data ?? []).map((row) => ({
    fixtureId: row.fixture_id,
    date: row.fixture_date,
    roundName: row.round_name ?? '',
    homeTeamId: row.home_team_id,
    homeTeamName: row.home_team_name ?? '',
    homeTeamLogo: row.home_team_logo ?? null,
    awayTeamId: row.away_team_id,
    awayTeamName: row.away_team_name ?? '',
    awayTeamLogo: row.away_team_logo ?? null,
    venueName: row.venue_name ?? null,
  }));
}

export async function fetchMatchLineup(fixtureId: number, teamId: number): Promise<MatchLineup | null> {
  const { data, error } = await supabase
    .from('match_lineups')
    .select('formation, player_name, player_pos, grid, player_number')
    .eq('fixture_id', fixtureId)
    .eq('team_id', teamId)
    .eq('lineup_bucket', 'start_xi')
    .order('grid', { ascending: true });

  if (error || !data || data.length === 0) return null;

  const formation = data[0].formation ?? '';
  const players: LineupPlayer[] = data
    .filter((row) => row.grid != null)
    .map((row) => ({
      playerName: row.player_name ?? '',
      playerPos: row.player_pos ?? '',
      grid: row.grid as string,
      playerNumber: row.player_number != null ? Math.round(row.player_number) : null,
    }));

  return { formation, players };
}

export async function fetchOpponentIntel(opponentTeamName: string): Promise<OpponentIntel> {
  const { data: playerData } = await supabase
    .from('player_season_summary')
    .select('player_id, player_name, position, avg_rating, season_goals, duel_win_rate')
    .eq('team_name', opponentTeamName)
    .order('avg_rating', { ascending: false, nullsFirst: false })
    .limit(15);

  const players = playerData ?? [];

  // Fetch photos for these players
  const playerIds = players.map((p) => p.player_id).filter(Boolean);
  const photoMap = new Map<number, string>();
  if (playerIds.length > 0) {
    const { data: photoData } = await supabase
      .from('leaderboards')
      .select('player_id, player_photo_url')
      .in('player_id', playerIds);
    for (const row of photoData ?? []) {
      if (row.player_photo_url) photoMap.set(row.player_id, row.player_photo_url);
    }
  }

  // Key threat: top player by avg_rating
  const topPlayer = players[0] ?? null;
  const keyThreat: OpponentPlayer | null = topPlayer
    ? {
        name: topPlayer.player_name ?? 'Unknown',
        position: topPlayer.position ?? '—',
        avgRating: topPlayer.avg_rating ?? 0,
        goals: topPlayer.season_goals ?? 0,
        photoUrl: photoMap.get(topPlayer.player_id) ?? null,
      }
    : null;

  // Exploitable weakness: player with lowest duel_win_rate (among those with data)
  const withDuelData = players.filter((p) => p.duel_win_rate != null);
  withDuelData.sort((a, b) => (a.duel_win_rate ?? 0) - (b.duel_win_rate ?? 0));
  const weakest = withDuelData[0] ?? null;
  const exploitableWeakness = weakest
    ? {
        name: weakest.player_name ?? 'Unknown',
        position: weakest.position ?? '—',
        duelWinRate: Math.round((weakest.duel_win_rate ?? 0) * 100),
      }
    : null;

  return { keyThreat, exploitableWeakness };
}
