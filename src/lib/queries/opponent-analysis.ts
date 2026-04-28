import { supabase } from '@/lib/supabase/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OpponentRecentMatch {
  fixtureId: number;
  date: string;
  opponent: string;
  homeAway: 'home' | 'away';
  result: 'W' | 'D' | 'L';
  goalsFor: number;
  goalsAgainst: number;
  formation: string;
  possession: number | null;
  xG: number | null;
  shots: number | null;
  shotsOnTarget: number | null;
}

export interface OpponentSeasonProfile {
  teamName: string;
  leaguePosition: number | null;
  points: number | null;
  matchesPlayed: number | null;
  wins: number | null;
  draws: number | null;
  losses: number | null;
  goalsFor: number | null;
  goalsAgainst: number | null;
  goalDifference: number | null;
  last5Form: string | null;
  homeRecord: { wins: number | null; draws: number | null; losses: number | null; goalsFor: number | null; goalsAgainst: number | null } | null;
  awayRecord: { wins: number | null; draws: number | null; losses: number | null; goalsFor: number | null; goalsAgainst: number | null } | null;
  scoringProfile: {
    earlyGoals: number | null;
    midGoals: number | null;
    lateGoals: number | null;
    stoppageGoals: number | null;
    openPlayGoals: number | null;
    penaltyGoals: number | null;
    goalsPerMatch: number | null;
  } | null;
  disciplineProfile: {
    totalCards: number | null;
    cardsPerMatch: number | null;
    earlyYellows: number | null;
    midYellows: number | null;
    lateYellows: number | null;
    stoppageYellows: number | null;
    earlyReds: number | null;
    midReds: number | null;
    lateReds: number | null;
    stoppageReds: number | null;
  } | null;
}

export interface OpponentKeyPlayer {
  playerId: number;
  name: string;
  position: string;
  avgRating: number | null;
  goals: number | null;
  assists: number | null;
  matchesPlayed: number | null;
  minutesPlayed: number | null;
  duelWinRate: number | null;
  photoUrl: string | null;
  recentForm: Array<{
    date: string;
    opponent: string;
    rating: number | null;
    goals: number | null;
    minutesPlayed: number | null;
  }>;
}

export interface HeadToHeadMatch {
  fixtureId: number;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  winner: string | null;
}

export interface OpponentTacticalPattern {
  phaseOfPlay: string;
  count: number;
  avgAttackRating: number | null;
  avgDefenseRating: number | null;
  commonZones: string[];
  commonEvents: string[];
}

export interface OpponentFormationStats {
  formation: string;
  timesUsed: number;
  winRate: number;
  avgGoalsFor: number;
  avgGoalsAgainst: number;
}

// ---------------------------------------------------------------------------
// Fetch functions
// ---------------------------------------------------------------------------

export async function fetchOpponentRecentMatches(opponentName: string, limit = 10): Promise<OpponentRecentMatch[]> {
  const { data: matchData, error } = await supabase
    .from('match_summary')
    .select(
      'fixture_id, fixture_date, home_team_id, home_team_name, away_team_id, away_team_name, home_goals, away_goals, status_short'
    )
    .or(`home_team_name.eq.${opponentName},away_team_name.eq.${opponentName}`)
    .neq('status_short', 'NS')
    .order('fixture_date', { ascending: false })
    .limit(limit);

  if (error || !matchData || matchData.length === 0) return [];

  const fixtureIds = matchData.map((m) => m.fixture_id);

  const { data: performanceData } = await supabase
    .from('match_team_performance')
    .select('fixture_id, team_id, team_name, home_away, ball_possession_pct, expected_goals, total_shots, shots_on_goal, goals_scored')
    .in('fixture_id', fixtureIds);

  const { data: lineupData } = await supabase
    .from('match_lineups')
    .select('fixture_id, team_id, formation')
    .in('fixture_id', fixtureIds)
    .eq('lineup_bucket', 'start_xi');

  const perfMap = new Map<string, Partial<{
    fixture_id: number;
    team_id: number;
    team_name: string;
    home_away: string;
    ball_possession_pct: number | null;
    expected_goals: number | null;
    total_shots: number | null;
    shots_on_goal: number | null;
    goals_scored: number | null;
  }>>();
  if (performanceData) {
    performanceData.forEach((p) => {
      const key = `${p.fixture_id}-${p.team_id}`;
      perfMap.set(key, p);
    });
  }

  const lineupMap = new Map<string, string>();
  if (lineupData) {
    lineupData.forEach((l) => {
      const key = `${l.fixture_id}-${l.team_id}`;
      if (!lineupMap.has(key)) {
        lineupMap.set(key, l.formation ?? '');
      }
    });
  }

  return matchData.map((m) => {
    const isHome = m.home_team_name === opponentName;
    const teamId = isHome ? m.home_team_id : m.away_team_id;
    const goalsFor = (isHome ? m.home_goals : m.away_goals) ?? 0;
    const goalsAgainst = (isHome ? m.away_goals : m.home_goals) ?? 0;
    const result: 'W' | 'D' | 'L' =
      goalsFor > goalsAgainst ? 'W' : goalsFor === goalsAgainst ? 'D' : 'L';

    const perfKey = `${m.fixture_id}-${teamId}`;
    const perf = perfMap.get(perfKey) || {};
    const formation = lineupMap.get(perfKey) || '';

    return {
      fixtureId: m.fixture_id,
      date: m.fixture_date,
      opponent: isHome ? m.away_team_name : m.home_team_name,
      homeAway: isHome ? 'home' : 'away',
      result,
      goalsFor,
      goalsAgainst,
      formation,
      possession: perf.ball_possession_pct ?? null,
      xG: perf.expected_goals ?? null,
      shots: perf.total_shots ?? null,
      shotsOnTarget: perf.shots_on_goal ?? null,
    };
  });
}

export async function fetchOpponentSeasonProfile(opponentName: string): Promise<OpponentSeasonProfile | null> {
  const { data: teamData } = await supabase
    .from('ref_teams')
    .select('team_id, team_name')
    .eq('team_name', opponentName)
    .single();

  if (!teamData) return null;

  const { data: performanceData } = await supabase
    .from('team_performance_summary')
    .select(
      'standing_rank, points, matches_played, wins, draws, losses, goals_diff, last_5_form, home_win, home_draw, home_lose, home_goals_for, home_goals_against, away_win, away_draw, away_lose, away_goals_for, away_goals_against'
    )
    .eq('team_id', teamData.team_id)
    .single();

  const { data: scoringData } = await supabase
    .from('team_scoring_profile')
    .select('early_goals, mid_goals, late_goals, stoppage_goals, open_play_goals, penalty_goals, goals_per_match')
    .eq('team_id', teamData.team_id)
    .single();

  const { data: disciplineData } = await supabase
    .from('team_discipline_profile')
    .select('total_cards, cards_per_match, early_yellows, mid_yellows, late_yellows, stoppage_yellows, early_reds, mid_reds, late_reds, stoppage_reds')
    .eq('team_id', teamData.team_id)
    .single();

  return {
    teamName: teamData.team_name,
    leaguePosition: performanceData?.standing_rank ?? null,
    points: performanceData?.points ?? null,
    matchesPlayed: performanceData?.matches_played ?? null,
    wins: performanceData?.wins ?? null,
    draws: performanceData?.draws ?? null,
    losses: performanceData?.losses ?? null,
    goalsFor: performanceData?.home_goals_for && performanceData?.away_goals_for
      ? performanceData.home_goals_for + performanceData.away_goals_for
      : null,
    goalsAgainst: performanceData?.home_goals_against && performanceData?.away_goals_against
      ? performanceData.home_goals_against + performanceData.away_goals_against
      : null,
    goalDifference: performanceData?.goals_diff ?? null,
    last5Form: performanceData?.last_5_form ?? null,
    homeRecord: performanceData
      ? {
          wins: performanceData.home_win,
          draws: performanceData.home_draw,
          losses: performanceData.home_lose,
          goalsFor: performanceData.home_goals_for,
          goalsAgainst: performanceData.home_goals_against,
        }
      : null,
    awayRecord: performanceData
      ? {
          wins: performanceData.away_win,
          draws: performanceData.away_draw,
          losses: performanceData.away_lose,
          goalsFor: performanceData.away_goals_for,
          goalsAgainst: performanceData.away_goals_against,
        }
      : null,
    scoringProfile: scoringData
      ? {
          earlyGoals: scoringData.early_goals,
          midGoals: scoringData.mid_goals,
          lateGoals: scoringData.late_goals,
          stoppageGoals: scoringData.stoppage_goals,
          openPlayGoals: scoringData.open_play_goals,
          penaltyGoals: scoringData.penalty_goals,
          goalsPerMatch: scoringData.goals_per_match,
        }
      : null,
    disciplineProfile: disciplineData
      ? {
          totalCards: disciplineData.total_cards,
          cardsPerMatch: disciplineData.cards_per_match,
          earlyYellows: disciplineData.early_yellows,
          midYellows: disciplineData.mid_yellows,
          lateYellows: disciplineData.late_yellows,
          stoppageYellows: disciplineData.stoppage_yellows,
          earlyReds: disciplineData.early_reds,
          midReds: disciplineData.mid_reds,
          lateReds: disciplineData.late_reds,
          stoppageReds: disciplineData.stoppage_reds,
        }
      : null,
  };
}

export async function fetchOpponentKeyPlayers(opponentName: string, limit = 5): Promise<OpponentKeyPlayer[]> {
  const { data: playerData } = await supabase
    .from('player_season_summary')
    .select(
      'player_id, player_name, position, avg_rating, season_goals, season_assists, matches_played, total_minutes, duel_win_rate'
    )
    .eq('team_name', opponentName)
    .order('avg_rating', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (!playerData || playerData.length === 0) return [];

  const playerIds = playerData.map((p) => p.player_id).filter(Boolean);

  const { data: photoData } = await supabase
    .from('leaderboards')
    .select('player_id, player_photo_url')
    .in('player_id', playerIds);

  const photoMap = new Map<number, string>();
  if (photoData) {
    photoData.forEach((p) => {
      if (p.player_photo_url) {
        photoMap.set(p.player_id, p.player_photo_url);
      }
    });
  }

  const players = await Promise.all(
    playerData.map(async (p) => {
      const { data: recentMatches } = await supabase
        .from('player_performance_mart')
        .select('fixture_date, opponent_name, rating, goals_total, minutes_played')
        .eq('player_id', p.player_id)
        .eq('team_name', opponentName)
        .order('fixture_date', { ascending: false })
        .limit(5);

      return {
        playerId: p.player_id,
        name: p.player_name ?? 'Unknown',
        position: p.position ?? '—',
        avgRating: p.avg_rating ?? null,
        goals: p.season_goals ?? null,
        assists: p.season_assists ?? null,
        matchesPlayed: p.matches_played ?? null,
        minutesPlayed: p.total_minutes ?? null,
        duelWinRate: p.duel_win_rate != null ? Math.round(p.duel_win_rate * 100) : null,
        photoUrl: photoMap.get(p.player_id) ?? null,
        recentForm: (recentMatches ?? []).map((m) => ({
          date: m.fixture_date,
          opponent: m.opponent_name ?? 'Unknown',
          rating: m.rating ?? null,
          goals: m.goals_total ?? null,
          minutesPlayed: m.minutes_played ?? null,
        })),
      };
    })
  );

  return players;
}

export async function fetchHeadToHeadHistory(myTeamName: string, opponentName: string, limit = 5): Promise<HeadToHeadMatch[]> {
  const { data, error } = await supabase
    .from('match_summary')
    .select('fixture_id, fixture_date, home_team_name, away_team_name, home_goals, away_goals')
    .or(
      `and(home_team_name.eq.${myTeamName},away_team_name.eq.${opponentName}),and(home_team_name.eq.${opponentName},away_team_name.eq.${myTeamName})`
    )
    .neq('status_short', 'NS')
    .order('fixture_date', { ascending: false })
    .limit(limit);

  if (error || !data || data.length === 0) return [];

  return data.map((m) => ({
    fixtureId: m.fixture_id,
    date: m.fixture_date,
    homeTeam: m.home_team_name ?? '',
    awayTeam: m.away_team_name ?? '',
    homeGoals: m.home_goals ?? 0,
    awayGoals: m.away_goals ?? 0,
    winner:
      m.home_goals > m.away_goals
        ? m.home_team_name
        : m.away_goals > m.home_goals
        ? m.away_team_name
        : null,
  }));
}

export async function fetchOpponentTacticalPatterns(opponentName: string): Promise<OpponentTacticalPattern[]> {
  const { data: matchesData } = await supabase
    .from('matches')
    .select('id')
    .or(`home_team.eq.${opponentName},away_team.eq.${opponentName}`);

  if (!matchesData || matchesData.length === 0) return [];

  const matchIds = matchesData.map((m) => m.id);

  const { data: phasesData } = await supabase
    .from('tactical_phases')
    .select('phase_of_play, pitch_zone, event_type, attacking_team_execution_rating, defending_team_execution_rating, possession_team')
    .in('match_id', matchIds)
    .eq('possession_team', opponentName);

  if (!phasesData || phasesData.length === 0) return [];

  const patternMap = new Map<string, OpponentTacticalPattern>();

  phasesData.forEach((phase) => {
    const key = phase.phase_of_play;
    if (!patternMap.has(key)) {
      patternMap.set(key, {
        phaseOfPlay: key,
        count: 0,
        avgAttackRating: null,
        avgDefenseRating: null,
        commonZones: [],
        commonEvents: [],
      });
    }

    const pattern = patternMap.get(key)!;
    pattern.count += 1;

    const ratings = pattern.avgAttackRating != null ? [pattern.avgAttackRating, phase.attacking_team_execution_rating] : [phase.attacking_team_execution_rating];
    pattern.avgAttackRating = ratings.reduce((a, b) => a + (b ?? 0), 0) / ratings.filter(Boolean).length || null;

    if (phase.pitch_zone && !pattern.commonZones.includes(phase.pitch_zone)) {
      pattern.commonZones.push(phase.pitch_zone);
    }
    if (phase.event_type && !pattern.commonEvents.includes(phase.event_type)) {
      pattern.commonEvents.push(phase.event_type);
    }
  });

  return Array.from(patternMap.values()).sort((a, b) => b.count - a.count);
}

export async function fetchOpponentFormations(opponentName: string): Promise<OpponentFormationStats[]> {
  const { data: lineupData } = await supabase
    .from('match_lineups')
    .select('fixture_id, team_id, team_name, formation')
    .eq('team_name', opponentName)
    .eq('lineup_bucket', 'start_xi');

  if (!lineupData || lineupData.length === 0) return [];

  const formationMap = new Map<string, { count: number; wins: number; goalsFor: number; goalsAgainst: number }>();

  const fixtureIds = [...new Set(lineupData.map((l) => l.fixture_id))];

  const { data: matchData } = await supabase
    .from('match_summary')
    .select('fixture_id, home_team_name, away_team_name, home_goals, away_goals')
    .in('fixture_id', fixtureIds);

  const matchMap = new Map<number, Partial<{
    fixture_id: number;
    home_team_name: string;
    away_team_name: string;
    home_goals: number | null;
    away_goals: number | null;
  }>>();
  if (matchData) {
    matchData.forEach((m) => matchMap.set(m.fixture_id, m));
  }

  lineupData.forEach((l) => {
    const formation = l.formation ?? 'Unknown';
    if (!formationMap.has(formation)) {
      formationMap.set(formation, { count: 0, wins: 0, goalsFor: 0, goalsAgainst: 0 });
    }

    const stats = formationMap.get(formation)!;
    stats.count += 1;

    const match = matchMap.get(l.fixture_id);
    if (match) {
      const isHome = match.home_team_name === opponentName;
      const goalsFor = (isHome ? match.home_goals : match.away_goals) ?? 0;
      const goalsAgainst = (isHome ? match.away_goals : match.home_goals) ?? 0;
      stats.goalsFor += goalsFor;
      stats.goalsAgainst += goalsAgainst;
      if (goalsFor > goalsAgainst) stats.wins += 1;
    }
  });

  return Array.from(formationMap.entries())
    .map(([formation, stats]) => ({
      formation,
      timesUsed: stats.count,
      winRate: stats.count > 0 ? Math.round((stats.wins / stats.count) * 100) : 0,
      avgGoalsFor: stats.count > 0 ? stats.goalsFor / stats.count : 0,
      avgGoalsAgainst: stats.count > 0 ? stats.goalsAgainst / stats.count : 0,
    }))
    .sort((a, b) => b.timesUsed - a.timesUsed);
}
