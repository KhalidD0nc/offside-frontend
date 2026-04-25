import { supabase } from '@/lib/supabase/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KpiData {
  rank: number;
  points: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsPerMatch: number;
  cleanSheets: number;
  last5Form: string;
}

export interface MatchPerformancePoint {
  round: string;
  possession: number;
  shotsOnGoal: number;
}

export interface GoalTimingPoint {
  period: string;
  goals: number;
}

export interface TeamInfo {
  teamId: number;
  teamName: string;
  logoUrl: string | null;
}

export interface PlayerRow {
  playerId: number;
  name: string;
  position: string;
  apps: number;
  avgRating: number;
  goals: number;
  assists: number;
  topWeaknessLabel: string;
  topWeaknessValue: number;
  trendDirection: 'up' | 'down' | 'flat';
  photoUrl: string | null;
}

export interface TacticalInsightCard {
  phaseOfPlay: string;
  eventType: string;
  insight: string;
  advice: string;
  perspective: 'opportunity' | 'threat' | 'neutral';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shortenRound(name: string): string {
  const match = name.match(/\d+/);
  return match ? `R${match[0]}` : name.slice(0, 4);
}

function deriveWeakness(
  shotAccuracy: number | null,
  duelWinRate: number | null,
  dribbleSuccessRate: number | null,
): { label: string; value: number } {
  const candidates: { label: string; value: number }[] = [];
  if (shotAccuracy != null) candidates.push({ label: 'Shot Acc.', value: shotAccuracy });
  if (duelWinRate != null) candidates.push({ label: 'Duel Win', value: duelWinRate });
  if (dribbleSuccessRate != null) candidates.push({ label: 'Dribble', value: dribbleSuccessRate });
  if (candidates.length === 0) return { label: '—', value: 0 };
  return candidates.reduce((min, c) => (c.value < min.value ? c : min));
}

// ---------------------------------------------------------------------------
// Individual fetch functions
// ---------------------------------------------------------------------------

async function fetchTeamInfo(teamId: number): Promise<TeamInfo> {
  const { data, error } = await supabase
    .from('ref_teams')
    .select('team_id, team_name, logo_url')
    .eq('team_id', teamId)
    .single();
  if (error) throw error;
  return { teamId: data.team_id, teamName: data.team_name, logoUrl: data.logo_url ?? null };
}

async function fetchKpiData(teamId: number): Promise<KpiData> {
  const { data, error } = await supabase
    .from('team_performance_summary')
    .select(
      'standing_rank, points, matches_played, wins, draws, losses, goals_per_match, clean_sheets_total, last_5_form',
    )
    .eq('team_id', teamId)
    .single();

  if (error) throw error;
  return {
    rank: data.standing_rank,
    points: data.points,
    matchesPlayed: data.matches_played,
    wins: data.wins,
    draws: data.draws,
    losses: data.losses,
    goalsPerMatch: data.goals_per_match,
    cleanSheets: data.clean_sheets_total,
    last5Form: data.last_5_form ?? '',
  };
}

async function fetchMatchPerformanceTrend(teamId: number): Promise<MatchPerformancePoint[]> {
  const { data, error } = await supabase
    .from('match_team_performance')
    .select('fixture_date, round_name, ball_possession_pct, shots_on_goal')
    .eq('team_id', teamId)
    .order('fixture_date', { ascending: false })
    .limit(10);

  if (error) throw error;
  return (data ?? [])
    .reverse()
    .map((row) => ({
      round: shortenRound(row.round_name ?? ''),
      possession: row.ball_possession_pct ?? 0,
      shotsOnGoal: row.shots_on_goal ?? 0,
    }));
}

async function fetchGoalTimingProfile(teamId: number): Promise<GoalTimingPoint[]> {
  const { data, error } = await supabase
    .from('team_scoring_profile')
    .select('early_goals, mid_goals, late_goals, stoppage_goals')
    .eq('team_id', teamId)
    .single();

  if (error) throw error;
  return [
    { period: "0-30'", goals: data.early_goals ?? 0 },
    { period: "31-60'", goals: data.mid_goals ?? 0 },
    { period: "61-90'", goals: data.late_goals ?? 0 },
    { period: "90+'", goals: data.stoppage_goals ?? 0 },
  ];
}

async function fetchPlayerSeasonData(teamId: number): Promise<PlayerRow[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90); // wider window — 30 days likely empty
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const [seasonResult, recentResult] = await Promise.allSettled([
    supabase
      .from('player_season_summary')
      .select(
        'player_id, player_name, position, matches_played, avg_rating, season_goals, season_assists, duel_win_rate, shot_accuracy, dribble_success_rate',
      )
      .eq('team_name', 'Al-Hilal Saudi FC')
      .order('avg_rating', { ascending: false, nullsFirst: false })
      .limit(20),
    supabase
      .from('player_performance_mart')
      .select('player_id, fixture_date, rating')
      .eq('team_id', teamId)
      .gte('fixture_date', cutoffStr),
  ]);

  const seasonData =
    seasonResult.status === 'fulfilled' ? (seasonResult.value.data ?? []) : [];

  // Fetch player photos from leaderboards
  const playerIds = seasonData.map((p) => p.player_id);
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

  // Build map: playerId → recent ratings[]
  const recentMap = new Map<number, number[]>();
  if (recentResult.status === 'fulfilled' && recentResult.value.data) {
    for (const row of recentResult.value.data) {
      if (row.rating == null) continue;
      const arr = recentMap.get(row.player_id) ?? [];
      arr.push(row.rating);
      recentMap.set(row.player_id, arr);
    }
  }

  return seasonData.map((p) => {
    const seasonAvg = p.avg_rating ?? 0;
    const recentRatings = recentMap.get(p.player_id) ?? [];
    const recentAvg =
      recentRatings.length > 0
        ? recentRatings.reduce((a, b) => a + b, 0) / recentRatings.length
        : seasonAvg;

    let trendDirection: 'up' | 'down' | 'flat' = 'flat';
    if (recentRatings.length > 0) {
      if (recentAvg > seasonAvg + 0.1) trendDirection = 'up';
      else if (recentAvg < seasonAvg - 0.1) trendDirection = 'down';
    }

    const weakness = deriveWeakness(p.shot_accuracy, p.duel_win_rate, p.dribble_success_rate);

    return {
      playerId: p.player_id,
      name: p.player_name ?? 'Unknown',
      position: p.position ?? '—',
      apps: p.matches_played ?? 0,
      avgRating: seasonAvg,
      goals: p.season_goals ?? 0,
      assists: p.season_assists ?? 0,
      topWeaknessLabel: weakness.label,
      topWeaknessValue: weakness.value,
      trendDirection,
      photoUrl: photoMap.get(p.player_id) ?? null,
    };
  });
}

async function fetchTacticalInsights(): Promise<TacticalInsightCard[]> {
  const { data, error } = await supabase
    .from('tactical_phases')
    .select(
      'phase_of_play, event_type, primary_team_perspective, key_tactical_insight, coach_actionable_advice',
    );

  if (error) throw error;
  return (data ?? []).map((row) => ({
    phaseOfPlay: row.phase_of_play ?? '',
    eventType: row.event_type ?? '',
    insight: row.key_tactical_insight ?? '',
    advice: row.coach_actionable_advice ?? '',
    perspective: (row.primary_team_perspective ?? 'neutral') as TacticalInsightCard['perspective'],
  }));
}

// ---------------------------------------------------------------------------
// Master function
// ---------------------------------------------------------------------------

export async function fetchDashboardData(teamId = 2932) {
  const [teamInfo, kpi, trend, goalTiming, players, tactics] = await Promise.allSettled([
    fetchTeamInfo(teamId),
    fetchKpiData(teamId),
    fetchMatchPerformanceTrend(teamId),
    fetchGoalTimingProfile(teamId),
    fetchPlayerSeasonData(teamId),
    fetchTacticalInsights(),
  ]);

  return {
    teamInfo: teamInfo.status === 'fulfilled' ? teamInfo.value : null,
    kpi: kpi.status === 'fulfilled' ? kpi.value : null,
    trend: trend.status === 'fulfilled' ? trend.value : null,
    goalTiming: goalTiming.status === 'fulfilled' ? goalTiming.value : null,
    players: players.status === 'fulfilled' ? players.value : null,
    tactics: tactics.status === 'fulfilled' ? tactics.value : null,
  };
}
