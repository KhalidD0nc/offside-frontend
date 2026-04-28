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
  photoUrl: string | null;
}

export interface MatchLineup {
  formation: string;
  kitPrimary: string | null;
  players: LineupPlayer[];
  substitutes: LineupPlayer[];
}

export interface FormationCandidate {
  playerName: string;
  playerPos: string;
  playerNumber: number | null;
  photoUrl: string | null;
  avgRating: number;
  goals: number;
  assists: number;
  apps: number;
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

function normalizePlayerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchPlayerPhotoMap(playerNames: string[]): Promise<Map<string, string>> {
  const names = [...new Set(playerNames.filter(Boolean))];
  const photoMap = new Map<string, string>();

  if (names.length === 0) {
    return photoMap;
  }

  const { data: playerData } = await supabase
    .from('player_season_summary')
    .select('player_id, player_name')
    .in('player_name', names);

  const playerIds = (playerData ?? []).map((player) => player.player_id).filter(Boolean);

  if (playerIds.length === 0) {
    return photoMap;
  }

  const { data: photoData } = await supabase
    .from('leaderboards')
    .select('player_id, player_photo_url')
    .in('player_id', playerIds);

  const photosById = new Map<number, string>();
  for (const row of photoData ?? []) {
    if (row.player_photo_url) {
      photosById.set(row.player_id, row.player_photo_url);
    }
  }

  for (const player of playerData ?? []) {
    const photoUrl = photosById.get(player.player_id);
    if (player.player_name && photoUrl) {
      photoMap.set(normalizePlayerName(player.player_name), photoUrl);
    }
  }

  return photoMap;
}

function mapSeasonPosition(position: string | null): string {
  const normalized = (position ?? '').toUpperCase();

  if (['G', 'GK', 'GOALKEEPER'].includes(normalized)) return 'GK';
  if (['D', 'DF', 'DEFENDER', 'CB', 'LB', 'RB', 'LWB', 'RWB'].includes(normalized)) return 'D';
  if (['M', 'MF', 'MIDFIELDER', 'CM', 'DM', 'CDM', 'AM', 'CAM', 'LM', 'RM'].includes(normalized)) return 'M';
  if (['F', 'FW', 'FORWARD', 'ATTACKER', 'ST', 'CF', 'LW', 'RW'].includes(normalized)) return 'F';

  return normalized.includes('DEF') ? 'D' : normalized.includes('MID') ? 'M' : normalized.includes('FOR') ? 'F' : 'M';
}

export async function fetchFormationCandidates(teamName = 'Al-Hilal Saudi FC'): Promise<FormationCandidate[]> {
  const { data, error } = await supabase
    .from('player_season_summary')
    .select('player_id, player_name, position, matches_played, avg_rating, season_goals, season_assists')
    .eq('team_name', teamName)
    .order('avg_rating', { ascending: false, nullsFirst: false })
    .limit(26);

  if (error || !data || data.length === 0) {
    return [];
  }

  const playerIds = data.map((player) => player.player_id).filter(Boolean);
  const photoMap = new Map<number, string>();

  if (playerIds.length > 0) {
    const { data: photoData } = await supabase
      .from('leaderboards')
      .select('player_id, player_photo_url')
      .in('player_id', playerIds);

    for (const row of photoData ?? []) {
      if (row.player_photo_url) {
        photoMap.set(row.player_id, row.player_photo_url);
      }
    }
  }

  return data.map((player) => ({
    playerName: player.player_name ?? 'Unknown',
    playerPos: mapSeasonPosition(player.position),
    playerNumber: null,
    photoUrl: photoMap.get(player.player_id) ?? null,
    avgRating: player.avg_rating ?? 0,
    goals: player.season_goals ?? 0,
    assists: player.season_assists ?? 0,
    apps: player.matches_played ?? 0,
  }));
}

export async function fetchMatchLineup(fixtureId: number, teamId: number): Promise<MatchLineup | null> {
  const { data, error } = await supabase
    .from('match_lineups')
    .select('formation, player_name, player_pos, grid, player_number, lineup_bucket, kit_primary')
    .eq('fixture_id', fixtureId)
    .eq('team_id', teamId)
    .in('lineup_bucket', ['start_xi', 'substitutes', 'substitute', 'bench'])
    .order('grid', { ascending: true });

  if (error || !data || data.length === 0) return null;

  const starters = data.filter((row) => row.lineup_bucket === 'start_xi');
  const bench = data.filter((row) => row.lineup_bucket !== 'start_xi');
  const sourceRows = starters.length > 0 ? starters : data;
  const formation = sourceRows[0]?.formation ?? '';
  const kitPrimary = sourceRows.find((row) => row.kit_primary)?.kit_primary ?? null;
  const photoMap = await fetchPlayerPhotoMap(data.map((row) => row.player_name ?? ''));
  const players: LineupPlayer[] = data
    .filter((row) => row.lineup_bucket === 'start_xi' && row.grid != null)
    .map((row) => ({
      playerName: row.player_name ?? '',
      playerPos: row.player_pos ?? '',
      grid: row.grid as string,
      playerNumber: row.player_number != null ? Math.round(row.player_number) : null,
      photoUrl: photoMap.get(normalizePlayerName(row.player_name ?? '')) ?? null,
    }));

  const substitutes: LineupPlayer[] = bench.map((row, index) => ({
    playerName: row.player_name ?? '',
    playerPos: row.player_pos ?? 'SUB',
    grid: row.grid ?? `bench:${index + 1}`,
    playerNumber: row.player_number != null ? Math.round(row.player_number) : null,
    photoUrl: photoMap.get(normalizePlayerName(row.player_name ?? '')) ?? null,
  }));

  return { formation, kitPrimary, players, substitutes };
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
