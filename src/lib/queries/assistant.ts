import { supabase } from '@/lib/supabase/client';

export const ASSISTANT_TEAM_ID = 2932;
export const ASSISTANT_TEAM_NAME = 'Al-Hilal Saudi FC';

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 12;

type Row = Record<string, unknown>;

export interface AssistantToolResult {
  teamId: number;
  teamName: string;
  source: string;
  data: unknown;
}

function clampLimit(value: unknown, fallback = DEFAULT_LIMIT) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(1, Math.min(MAX_LIMIT, Math.floor(value)));
}

function stripEmpty(row: unknown) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return {};
  return Object.fromEntries(
    Object.entries(row as Row).filter(([, value]) => value !== null && value !== undefined && value !== ''),
  );
}

function compactRows(rows: unknown) {
  return Array.isArray(rows) ? rows.map(stripEmpty) : [];
}

function result(source: string, data: unknown): AssistantToolResult {
  return {
    teamId: ASSISTANT_TEAM_ID,
    teamName: ASSISTANT_TEAM_NAME,
    source,
    data,
  };
}

export async function fetchAssistantTeamOverview() {
  const [teamResult, summaryResult, recentResult] = await Promise.allSettled([
    supabase
      .from('ref_teams')
      .select('team_id, team_name, country, logo_url')
      .eq('team_id', ASSISTANT_TEAM_ID)
      .single(),
    supabase
      .from('team_performance_summary')
      .select(
        [
          'standing_rank',
          'points',
          'matches_played',
          'wins',
          'draws',
          'losses',
          'goals_diff',
          'last_5_form',
          'goals_scored',
          'goals_per_match',
          'clean_sheets_total',
          'failed_to_score_total',
          'total_cards',
          'cards_per_match',
        ].join(','),
      )
      .eq('team_id', ASSISTANT_TEAM_ID)
      .single(),
    supabase
      .from('match_team_performance')
      .select(
        [
          'fixture_date',
          'round_name',
          'home_team_name',
          'away_team_name',
          'home_goals',
          'away_goals',
          'winner',
          'home_away',
          'opponent_name',
          'ball_possession_pct',
          'total_shots',
          'shots_on_goal',
          'expected_goals',
          'passes_pct',
        ].join(','),
      )
      .eq('team_id', ASSISTANT_TEAM_ID)
      .order('fixture_date', { ascending: false })
      .limit(5),
  ]);

  return result('team_overview', {
    team:
      teamResult.status === 'fulfilled' && !teamResult.value.error
        ? stripEmpty(teamResult.value.data)
        : null,
    summary:
      summaryResult.status === 'fulfilled' && !summaryResult.value.error
        ? stripEmpty(summaryResult.value.data)
        : null,
    recentMatches:
      recentResult.status === 'fulfilled' && !recentResult.value.error
        ? compactRows(recentResult.value.data)
        : [],
  });
}

export async function fetchAssistantRecentMatches(args: { limit?: number } = {}) {
  const limit = clampLimit(args.limit, 6);
  const { data, error } = await supabase
    .from('match_team_performance')
    .select(
      [
        'fixture_id',
        'fixture_date',
        'round_name',
        'home_team_name',
        'away_team_name',
        'home_goals',
        'away_goals',
        'winner',
        'home_away',
        'opponent_name',
        'ball_possession_pct',
        'total_shots',
        'shots_on_goal',
        'expected_goals',
        'corner_kicks',
        'fouls',
        'yellow_cards',
        'red_cards',
        'passes_accurate',
        'total_passes',
        'passes_pct',
        'goalkeeper_saves',
      ].join(','),
    )
    .eq('team_id', ASSISTANT_TEAM_ID)
    .order('fixture_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return result('recent_match_performance', compactRows(data));
}

export async function fetchAssistantScoringDiscipline() {
  const [scoringResult, disciplineResult] = await Promise.allSettled([
    supabase
      .from('team_scoring_profile')
      .select(
        [
          'matches_played',
          'goals_scored',
          'open_play_goals',
          'penalty_goals',
          'early_goals',
          'mid_goals',
          'late_goals',
          'stoppage_goals',
          'goals_per_match',
          'penalty_goal_ratio',
        ].join(','),
      )
      .eq('team_id', ASSISTANT_TEAM_ID)
      .single(),
    supabase
      .from('team_discipline_profile')
      .select(
        [
          'matches_played',
          'total_cards',
          'cards_per_match',
          'early_yellows',
          'mid_yellows',
          'late_yellows',
          'stoppage_yellows',
          'early_reds',
          'mid_reds',
          'late_reds',
          'stoppage_reds',
          'red_card_rate',
          'yellow_card_rate',
        ].join(','),
      )
      .eq('team_id', ASSISTANT_TEAM_ID)
      .single(),
  ]);

  return result('scoring_and_discipline', {
    scoring:
      scoringResult.status === 'fulfilled' && !scoringResult.value.error
        ? stripEmpty(scoringResult.value.data)
        : null,
    discipline:
      disciplineResult.status === 'fulfilled' && !disciplineResult.value.error
        ? stripEmpty(disciplineResult.value.data)
        : null,
  });
}

export async function fetchAssistantPlayers(args: { playerName?: string; limit?: number } = {}) {
  const limit = clampLimit(args.limit, 8);
  let query = supabase
    .from('player_season_summary')
    .select(
      [
        'player_id',
        'player_name',
        'position',
        'matches_played',
        'starts',
        'total_minutes',
        'season_goals',
        'season_assists',
        'season_key_passes',
        'season_tackles',
        'season_interceptions',
        'season_duels',
        'season_duels_won',
        'avg_rating',
        'goals_per_90',
        'assists_per_90',
        'duel_win_rate',
        'dribble_success_rate',
        'shot_accuracy',
      ].join(','),
    )
    .eq('team_name', ASSISTANT_TEAM_NAME)
    .order('avg_rating', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (args.playerName) {
    query = query.ilike('player_name', `%${args.playerName}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return result('player_season_summary', compactRows(data));
}

export async function fetchAssistantRecentPlayerPerformances(
  args: { playerName?: string; limit?: number } = {},
) {
  const limit = clampLimit(args.limit, 8);
  let query = supabase
    .from('player_performance_mart')
    .select(
      [
        'player_id',
        'player_name',
        'position',
        'fixture_date',
        'round_name',
        'opponent_name',
        'match_result',
        'rating',
        'minutes_played',
        'shots_total',
        'shots_on_target',
        'goals_total',
        'assists',
        'passes_total',
        'passes_accuracy',
        'key_passes',
        'dribbles_attempted',
        'dribbles_success',
        'duels_total',
        'duels_won',
        'tackles_total',
        'interceptions',
        'blocks',
        'yellow_cards',
        'red_cards',
      ].join(','),
    )
    .eq('team_id', ASSISTANT_TEAM_ID)
    .order('fixture_date', { ascending: false })
    .limit(limit);

  if (args.playerName) {
    query = query.ilike('player_name', `%${args.playerName}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return result('recent_player_performance', compactRows(data));
}

export async function fetchAssistantTacticalPhases(
  args: { phaseOfPlay?: string; perspective?: string; limit?: number } = {},
) {
  const limit = clampLimit(args.limit, 8);
  let query = supabase
    .from('tactical_phases')
    .select(
      [
        'match_id',
        'start_timestamp',
        'end_timestamp',
        'start_seconds',
        'phase_of_play',
        'possession_team',
        'defending_team',
        'pitch_zone',
        'event_type',
        'tactical_description',
        'attacking_team_execution_rating',
        'defending_team_execution_rating',
        'key_tactical_insight',
        'coach_actionable_advice',
        'primary_team_perspective',
      ].join(','),
    )
    .eq('team_id', ASSISTANT_TEAM_ID)
    .limit(limit);

  if (args.phaseOfPlay) {
    query = query.ilike('phase_of_play', `%${args.phaseOfPlay}%`);
  }
  if (args.perspective) {
    query = query.eq('primary_team_perspective', args.perspective);
  }

  const { data, error } = await query;
  if (error) throw error;
  return result('tactical_phases', compactRows(data));
}

export async function fetchAssistantMatchEvents(args: { eventType?: string; limit?: number } = {}) {
  const limit = clampLimit(args.limit, 10);
  let query = supabase
    .from('match_events')
    .select(
      [
        'fixture_id',
        'event_minute',
        'event_extra_minute',
        'team_name',
        'player_name',
        'assist_player_name',
        'event_type',
        'event_detail',
        'event_comments',
      ].join(','),
    )
    .eq('team_id', ASSISTANT_TEAM_ID)
    .order('fixture_id', { ascending: false })
    .limit(limit);

  if (args.eventType) {
    query = query.ilike('event_type', `%${args.eventType}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return result('match_events', compactRows(data));
}

export async function fetchAssistantLineups(args: { limit?: number } = {}) {
  const limit = clampLimit(args.limit, 11);
  const { data, error } = await supabase
    .from('match_lineups')
    .select(
      [
        'fixture_id',
        'formation',
        'coach_name',
        'player_name',
        'player_number',
        'player_pos',
        'grid',
        'lineup_bucket',
      ].join(','),
    )
    .eq('team_id', ASSISTANT_TEAM_ID)
    .order('fixture_id', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return result('match_lineups', compactRows(data));
}
