import type { ResponseCreateParams } from 'openai/resources/responses/responses';
import {
  fetchAssistantLineups,
  fetchAssistantMatchEvents,
  fetchAssistantPlayers,
  fetchAssistantRecentMatches,
  fetchAssistantRecentPlayerPerformances,
  fetchAssistantScoringDiscipline,
  fetchAssistantTacticalPhases,
  fetchAssistantTeamOverview,
} from '@/lib/queries/assistant';

type ToolArgs = Record<string, unknown>;

export const coachTools = [
  {
    type: 'function',
    name: 'get_team_overview',
    description:
      'Get Al-Hilal season overview, standings, form, and a compact list of recent match metrics.',
    strict: false,
    parameters: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'get_recent_matches',
    description:
      'Get recent Al-Hilal match performance rows including possession, shots, xG, cards, passing, and opponent.',
    strict: false,
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'integer', minimum: 1, maximum: 12 },
      },
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'get_scoring_discipline',
    description: 'Get Al-Hilal scoring timing profile and discipline/card profile.',
    strict: false,
    parameters: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'get_players',
    description:
      'Get top Al-Hilal season player stats, or one player by name, including goals, assists, ratings, duels, dribbles, and shot accuracy.',
    strict: false,
    parameters: {
      type: 'object',
      properties: {
        playerName: { type: 'string' },
        limit: { type: 'integer', minimum: 1, maximum: 12 },
      },
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'get_recent_player_performances',
    description:
      'Get recent match-level player performances for Al-Hilal, optionally filtered by player name.',
    strict: false,
    parameters: {
      type: 'object',
      properties: {
        playerName: { type: 'string' },
        limit: { type: 'integer', minimum: 1, maximum: 12 },
      },
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'get_tactical_phases',
    description:
      'Get AI-generated tactical phase observations for Al-Hilal with timestamps, zones, insights, and coach advice.',
    strict: false,
    parameters: {
      type: 'object',
      properties: {
        phaseOfPlay: { type: 'string' },
        perspective: { type: 'string', enum: ['opportunity', 'threat', 'neutral'] },
        limit: { type: 'integer', minimum: 1, maximum: 12 },
      },
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'get_match_events',
    description:
      'Get recent Al-Hilal match events such as goals, cards, substitutions, and assists.',
    strict: false,
    parameters: {
      type: 'object',
      properties: {
        eventType: { type: 'string' },
        limit: { type: 'integer', minimum: 1, maximum: 12 },
      },
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'get_lineups',
    description: 'Get recent Al-Hilal lineup rows including formation, player position, and grid.',
    strict: false,
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'integer', minimum: 1, maximum: 12 },
      },
      additionalProperties: false,
    },
  },
] satisfies NonNullable<ResponseCreateParams['tools']>;

function asObject(value: unknown): ToolArgs {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as ToolArgs)
    : {};
}

function stringArg(args: ToolArgs, key: string) {
  return typeof args[key] === 'string' ? args[key] : undefined;
}

function numberArg(args: ToolArgs, key: string) {
  return typeof args[key] === 'number' ? args[key] : undefined;
}

export async function executeCoachTool(name: string, rawArgs: unknown) {
  const args = asObject(rawArgs);

  switch (name) {
    case 'get_team_overview':
      return fetchAssistantTeamOverview();
    case 'get_recent_matches':
      return fetchAssistantRecentMatches({ limit: numberArg(args, 'limit') });
    case 'get_scoring_discipline':
      return fetchAssistantScoringDiscipline();
    case 'get_players':
      return fetchAssistantPlayers({
        playerName: stringArg(args, 'playerName'),
        limit: numberArg(args, 'limit'),
      });
    case 'get_recent_player_performances':
      return fetchAssistantRecentPlayerPerformances({
        playerName: stringArg(args, 'playerName'),
        limit: numberArg(args, 'limit'),
      });
    case 'get_tactical_phases':
      return fetchAssistantTacticalPhases({
        phaseOfPlay: stringArg(args, 'phaseOfPlay'),
        perspective: stringArg(args, 'perspective'),
        limit: numberArg(args, 'limit'),
      });
    case 'get_match_events':
      return fetchAssistantMatchEvents({
        eventType: stringArg(args, 'eventType'),
        limit: numberArg(args, 'limit'),
      });
    case 'get_lineups':
      return fetchAssistantLineups({ limit: numberArg(args, 'limit') });
    default:
      throw new Error(`Unknown coach tool: ${name}`);
  }
}
