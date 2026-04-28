import { getOpenAIClient, getCoachModel } from '@/lib/ai/openai';
import type {
  OpponentRecentMatch,
  OpponentSeasonProfile,
  OpponentKeyPlayer,
  HeadToHeadMatch,
  OpponentTacticalPattern,
  OpponentFormationStats,
} from '@/lib/queries/opponent-analysis';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TacticalShift {
  timeRange: string;
  label: string;
  formation: string;
  instructions: string[];
  dataReason: string;
}

export interface OpponentAnalysisReport {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  keyThreats: Array<{
    player: string;
    position: string;
    reason: string;
    mitigation: string;
  }>;
  tacticalPatterns: Array<{
    phase: string;
    description: string;
    counter: string;
  }>;
  recommendedFormation: string;
  formationReasoning: string;
  suggestedShifts: TacticalShift[];
  scoringThreatZones: Array<{
    timeRange: string;
    goalPercentage: number;
    label: string;
  }>;
}

const opponentAnalysisSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'summary',
    'strengths',
    'weaknesses',
    'keyThreats',
    'tacticalPatterns',
    'recommendedFormation',
    'formationReasoning',
    'suggestedShifts',
    'scoringThreatZones',
  ],
  properties: {
    summary: { type: 'string' },
    strengths: { type: 'array', items: { type: 'string' } },
    weaknesses: { type: 'array', items: { type: 'string' } },
    keyThreats: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['player', 'position', 'reason', 'mitigation'],
        properties: {
          player: { type: 'string' },
          position: { type: 'string' },
          reason: { type: 'string' },
          mitigation: { type: 'string' },
        },
      },
    },
    tacticalPatterns: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['phase', 'description', 'counter'],
        properties: {
          phase: { type: 'string' },
          description: { type: 'string' },
          counter: { type: 'string' },
        },
      },
    },
    recommendedFormation: { type: 'string' },
    formationReasoning: { type: 'string' },
    suggestedShifts: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['timeRange', 'label', 'formation', 'instructions', 'dataReason'],
        properties: {
          timeRange: { type: 'string' },
          label: { type: 'string' },
          formation: { type: 'string' },
          instructions: { type: 'array', items: { type: 'string' } },
          dataReason: { type: 'string' },
        },
      },
    },
    scoringThreatZones: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['timeRange', 'goalPercentage', 'label'],
        properties: {
          timeRange: { type: 'string' },
          goalPercentage: { type: 'number' },
          label: { type: 'string' },
        },
      },
    },
  },
} as const;

// ---------------------------------------------------------------------------
// Data aggregation
// ---------------------------------------------------------------------------

interface AnalysisPayload {
  opponentName: string;
  myTeamName: string;
  recentMatches: OpponentRecentMatch[];
  seasonProfile: OpponentSeasonProfile | null;
  keyPlayers: OpponentKeyPlayer[];
  headToHead: HeadToHeadMatch[];
  tacticalPatterns: OpponentTacticalPattern[];
  formations: OpponentFormationStats[];
}

function buildPrompt(payload: AnalysisPayload): string {
  const { opponentName, myTeamName, recentMatches, seasonProfile, keyPlayers, headToHead, tacticalPatterns, formations } = payload;

  const recentMatchesStr = recentMatches
    .map(
      (m) =>
        `- ${m.date}: ${m.opponent} (${m.homeAway}) | Result: ${m.result} ${m.goalsFor}-${m.goalsAgainst} | Formation: ${m.formation || 'N/A'} | Possession: ${m.possession ?? 'N/A'}% | xG: ${m.xG ?? 'N/A'}`
    )
    .join('\n');

  const seasonStr = seasonProfile
    ? `
League Position: ${seasonProfile.leaguePosition ?? 'N/A'}
Record: ${seasonProfile.wins ?? 0}W-${seasonProfile.draws ?? 0}D-${seasonProfile.losses ?? 0}L
Goals: ${seasonProfile.goalsFor ?? 0} scored, ${seasonProfile.goalsAgainst ?? 0} conceded
Form (last 5): ${seasonProfile.last5Form ?? 'N/A'}
Home Record: ${seasonProfile.homeRecord?.wins}W-${seasonProfile.homeRecord?.draws}D-${seasonProfile.homeRecord?.losses}L
Away Record: ${seasonProfile.awayRecord?.wins}W-${seasonProfile.awayRecord?.draws}D-${seasonProfile.awayRecord?.losses}L
Scoring Profile:
  - Early (0-25'): ${seasonProfile.scoringProfile?.earlyGoals ?? 0} goals
  - Mid (25-70'): ${seasonProfile.scoringProfile?.midGoals ?? 0} goals
  - Late (70-90'): ${seasonProfile.scoringProfile?.lateGoals ?? 0} goals
  - Stoppage: ${seasonProfile.scoringProfile?.stoppageGoals ?? 0} goals
  - Open Play: ${seasonProfile.scoringProfile?.openPlayGoals ?? 0} | Penalties: ${seasonProfile.scoringProfile?.penaltyGoals ?? 0}
Discipline:
  - Total Cards: ${seasonProfile.disciplineProfile?.totalCards ?? 0} (${seasonProfile.disciplineProfile?.cardsPerMatch ?? 0} per match)
  - Early Yellows: ${seasonProfile.disciplineProfile?.earlyYellows ?? 0} | Late Yellows: ${seasonProfile.disciplineProfile?.lateYellows ?? 0}
  - Early Reds: ${seasonProfile.disciplineProfile?.earlyReds ?? 0} | Late Reds: ${seasonProfile.disciplineProfile?.lateReds ?? 0}`
    : 'No season data available';

  const playersStr = keyPlayers
    .map(
      (p) =>
        `- ${p.name} (${p.position}) | Rating: ${p.avgRating?.toFixed(1) ?? 'N/A'} | Goals: ${p.goals ?? 0} | Assists: ${p.assists ?? 0} | Duel Win: ${p.duelWinRate ?? 'N/A'}%
  Recent form: ${p.recentForm.map((r) => `${r.rating?.toFixed(1) ?? '?'} vs ${r.opponent}`).join(', ')}`
    )
    .join('\n');

  const h2hStr = headToHead
    .map((m) => `- ${m.date}: ${m.homeTeam} ${m.homeGoals}-${m.awayGoals} ${m.awayTeam} | Winner: ${m.winner ?? 'Draw'}`)
    .join('\n');

  const formationsStr = formations
    .map((f) => `- ${f.formation}: Used ${f.timesUsed} times | Win Rate: ${f.winRate}% | Avg Goals: ${f.avgGoalsFor.toFixed(1)} scored, ${f.avgGoalsAgainst.toFixed(1)} conceded`)
    .join('\n');

  const tacticsStr = tacticalPatterns
    .map(
      (t) =>
        `- ${t.phaseOfPlay}: ${t.count} occurrences | Attack Rating: ${t.avgAttackRating?.toFixed(1) ?? 'N/A'}/10 | Zones: ${t.commonZones.join(', ') || 'N/A'} | Events: ${t.commonEvents.join(', ') || 'N/A'}`
    )
    .join('\n');

  return `You are an elite football tactical analyst. Analyze the following opponent data and provide actionable insights for ${myTeamName}'s coaching staff.

OPPONENT: ${opponentName}

RECENT MATCHES (Last ${recentMatches.length}):
${recentMatchesStr}

SEASON PROFILE:
${seasonStr}

KEY PLAYERS (Top ${keyPlayers.length}):
${playersStr}

HEAD-TO-HEAD HISTORY (Last ${headToHead.length} meetings):
${h2hStr || 'No previous meetings found'}

TACTICAL PATTERNS (from video analysis):
${tacticsStr || 'No tactical data available'}

TYPICAL FORMATIONS:
${formationsStr || 'No formation data available'}

---

Provide your analysis in the following JSON format. Be specific, data-driven, and actionable. Focus on patterns and trends, not just raw stats.

{
  "summary": "2-3 sentence overview of opponent's playing style and key characteristics",
  "strengths": ["3-5 key strengths based on data"],
  "weaknesses": ["3-5 exploitable weaknesses based on data"],
  "keyThreats": [
    {
      "player": "Player name",
      "position": "Position",
      "reason": "Why they're dangerous (data-backed)",
      "mitigation": "Specific tactical instruction to neutralize them"
    }
  ],
  "tacticalPatterns": [
    {
      "phase": "Phase of play (e.g., 'Early Attack', 'Counter-Attack', 'Set Pieces')",
      "description": "What they do in this phase",
      "counter": "How to counter it"
    }
  ],
  "recommendedFormation": "Your recommended formation for ${myTeamName} (e.g., '4-2-3-1', '3-5-2')",
  "formationReasoning": "Why this formation is optimal against this opponent (data-backed)",
  "suggestedShifts": [
    {
      "timeRange": "Time range (e.g., '0-8', '8-18', '18-30', '30-42', '42-45', '45-56', '56-68', '68-80', '80-90')",
      "label": "Short football-specific label for this phase",
      "formation": "Suggested formation for this phase",
      "instructions": ["2-3 specific tactical instructions"],
      "dataReason": "Data-driven reason for this shift (e.g., 'Opponent scores 40% of goals in first 25 mins')"
    }
  ],
  "scoringThreatZones": [
    {
      "timeRange": "Time range (e.g., '0-8')",
      "goalPercentage": Percentage of goals in this period (0-100),
      "label": "Threat level label (e.g., 'High Threat', 'Medium Threat', 'Low Threat')"
    }
  ]
}

IMPORTANT:
- Base ALL recommendations on the provided data
- Be specific and actionable, not generic
- suggestedShifts should have 6-10 football-realistic phases based on opponent's scoring patterns, momentum windows, half-time restart, fatigue, and late game state
- scoringThreatZones should cover the full match (0-90) with 6-10 zones
- Return ONLY valid JSON, no markdown, no explanations`;
}

// ---------------------------------------------------------------------------
// Main analysis function
// ---------------------------------------------------------------------------

export async function generateOpponentAnalysis(payload: AnalysisPayload): Promise<OpponentAnalysisReport> {
  const client = getOpenAIClient();
  if (!client) {
    throw new Error('OpenAI client not initialized');
  }

  const prompt = buildPrompt(payload);

  const response = await client.responses.create({
    model: getCoachModel(),
    input: prompt,
    max_output_tokens: 3200,
    store: false,
    text: {
      format: {
        type: 'json_schema',
        name: 'opponent_analysis_report',
        strict: true,
        schema: opponentAnalysisSchema,
      },
    },
  });

  const outputText = response.output_text ?? '';

  try {
    const parsed = JSON.parse(outputText) as OpponentAnalysisReport;
    return parsed;
  } catch (error) {
    console.error('Failed to parse opponent analysis:', error);
    console.error('Raw response:', outputText);

    return {
      summary: 'Unable to generate analysis. Please review opponent data manually.',
      strengths: [],
      weaknesses: [],
      keyThreats: [],
      tacticalPatterns: [],
      recommendedFormation: '4-3-3',
      formationReasoning: 'Default formation - analysis failed',
      suggestedShifts: [],
      scoringThreatZones: [],
    };
  }
}
