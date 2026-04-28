import { ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2 } from '@/lib/r2/client';
import { supabase } from '@/lib/supabase/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MatchVideo {
  key: string;
  filename: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string | null;
  awayTeamLogo: string | null;
  homeScore: number;
  awayScore: number;
  competition: string;
  round: string;
  sortOrder: number;
  sizeBytes: number;
  uploadedAt: Date;
  analysisStatus: 'completed' | 'queued' | 'failed' | 'not_started';
  matchId: string | null;
  previewUrl: string | null;
}

export interface MatchStatus {
  id: string;
  status: 'completed' | 'queued' | 'failed' | 'not_started' | string;
  pipelineStage: string | null;
  errorMessage: string | null;
}

export interface TacticalPhase {
  id: string;
  startTimestamp: string;
  endTimestamp: string;
  startSeconds: number;
  endSeconds: number;
  phaseOfPlay: string;
  possessionTeam: string;
  defendingTeam: string;
  pitchZone: string;
  eventType: string;
  tacticalDescription: string;
  attackRating: number;
  defenseRating: number;
  keyInsight: string;
  coachAdvice: string;
  perspective: 'opportunity' | 'threat' | 'neutral';
}

export interface MatchDetail {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string | null;
  awayTeamLogo: string | null;
  matchDate: string;
  competition: string;
  videoSource: string | null;
  inferenceEventCount: number;
  pipelineDurationSeconds: number;
  comprehensiveAnalysisMd: string;
  phases: TacticalPhase[];
}

// ---------------------------------------------------------------------------
// Filename parser
// ---------------------------------------------------------------------------

// Pattern: "{HomeTeam}_{HomeScore}-{AwayScore}_{AwayTeam}_{Competition}_{Round}.mp4"
const FILENAME_RE = /^matches\/(.+?)_(\d+)-(\d+)_(.+?)_(Roshn-League|Kings-Cup)_(.+?)\.mp4$/;

function normalizeCompetition(raw: string): string {
  if (raw === 'Kings-Cup') return "King's Cup";
  return raw.replace(/-/g, ' ');
}

function normalizeRound(raw: string): string {
  return raw.replace(/-/g, ' ');
}

function roundSortKey(round: string): number {
  const m = round.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 999;
}

function parseFilename(
  key: string,
): Omit<MatchVideo, 'sizeBytes' | 'uploadedAt' | 'analysisStatus' | 'matchId' | 'previewUrl'> | null {
  const m = FILENAME_RE.exec(key);
  if (!m) return null;
  const [, homeTeam, homeScore, awayScore, awayTeam, competition, round] = m;
  const normalizedRound = normalizeRound(round);
  return {
    key,
    filename: key.replace('matches/', ''),
    homeTeam,
    awayTeam,
    homeTeamLogo: null,
    awayTeamLogo: null,
    homeScore: parseInt(homeScore, 10),
    awayScore: parseInt(awayScore, 10),
    competition: normalizeCompetition(competition),
    round: normalizedRound,
    sortOrder: roundSortKey(normalizedRound),
  };
}

// ---------------------------------------------------------------------------
// R2 fetch
// ---------------------------------------------------------------------------

async function fetchMatchesFromR2(): Promise<MatchVideo[]> {
  const command = new ListObjectsV2Command({
    Bucket: process.env.R2_BUCKET_NAME ?? 'hilal-match-videos',
    Prefix: 'matches/',
    MaxKeys: 100,
  });

  const response = await r2.send(command);
  const objects = response.Contents ?? [];

  const matches: MatchVideo[] = [];
  for (const obj of objects) {
    if (!obj.Key || !obj.Key.endsWith('.mp4')) continue;
    const parsed = parseFilename(obj.Key);
    if (!parsed) continue;
    matches.push({
      ...parsed,
      sizeBytes: obj.Size ?? 0,
      uploadedAt: obj.LastModified ?? new Date(),
      analysisStatus: 'not_started',
      matchId: null,
      previewUrl: null,
    });
  }

  return matches.sort((a, b) => a.sortOrder - b.sortOrder);
}

// ---------------------------------------------------------------------------
// Supabase analysis status
// ---------------------------------------------------------------------------

async function fetchAnalysisStatuses(keys: string[]): Promise<Map<string, { id: string; status: string }>> {
  if (keys.length === 0) return new Map();

  const { data, error } = await supabase
    .from('matches')
    .select('id, r2_key, status')
    .in('r2_key', keys);

  if (error) return new Map();

  const map = new Map<string, { id: string; status: string }>();
  for (const row of data ?? []) {
    if (row.r2_key) map.set(row.r2_key, { id: row.id, status: row.status ?? 'queued' });
  }
  return map;
}

function toAnalysisStatus(status: string | undefined): MatchVideo['analysisStatus'] {
  if (status === 'completed' || status === 'failed' || status === 'not_started') return status;
  if (status === 'queued') return 'queued';
  return 'queued';
}

async function fetchTeamLogos(teamNames: string[]): Promise<Map<string, string>> {
  if (teamNames.length === 0) return new Map();

  const { data, error } = await supabase
    .from('ref_teams')
    .select('team_name, logo_url')
    .in('team_name', teamNames);

  if (error) return new Map();

  const map = new Map<string, string>();
  for (const row of data ?? []) {
    if (row.team_name && row.logo_url) {
      map.set(row.team_name, row.logo_url);
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Presigned URLs
// ---------------------------------------------------------------------------

async function generatePreviewUrls(
  keys: string[],
): Promise<Map<string, string>> {
  const entries = await Promise.allSettled(
    keys.map(async (key) => {
      const url = await getSignedUrl(
        r2,
        new GetObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME ?? 'hilal-match-videos',
          Key: key,
        }),
        { expiresIn: 3600 },
      );
      return [key, url] as [string, string];
    }),
  );
  const map = new Map<string, string>();
  for (const result of entries) {
    if (result.status === 'fulfilled') map.set(result.value[0], result.value[1]);
  }
  return map;
}

export async function generateR2VideoUrl(r2Key: string): Promise<string | null> {
  try {
    return await getSignedUrl(
      r2,
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME ?? 'hilal-match-videos',
        Key: r2Key,
      }),
      { expiresIn: 7200 }, // 2-hour expiry for the detail view
    );
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Match detail (single analysed match + tactical phases)
// ---------------------------------------------------------------------------

export async function fetchMatchDetail(matchId: string, r2Key?: string): Promise<MatchDetail | null> {
  const [matchResult, phasesResult] = await Promise.allSettled([
    supabase
      .from('matches')
      .select(
        'id, home_team, away_team, match_date, competition, video_source, inference_event_count, pipeline_duration_seconds, comprehensive_analysis_md',
      )
      .eq('id', matchId)
      .single(),
    supabase
      .from('tactical_phases')
      .select(
        'id, start_timestamp, end_timestamp, start_seconds, end_seconds, phase_of_play, possession_team, defending_team, pitch_zone, event_type, tactical_description, attacking_team_execution_rating, defending_team_execution_rating, key_tactical_insight, coach_actionable_advice, primary_team_perspective',
      )
      .eq('match_id', matchId)
      .order('start_seconds'),
  ]);

  if (matchResult.status === 'rejected' || matchResult.value.error) return null;
  const m = matchResult.value.data;
  if (!m) return null;

  // Fetch logos — search by the last meaningful word in each slug so hyphens/spaces
  // don't matter: "al-hilal" → keyword "hilal", "al-shabab" → keyword "shabab".
  const homeDisplay = capitalize(m.home_team);
  const awayDisplay = capitalize(m.away_team);
  const homeKeyword = m.home_team.split('-').filter(Boolean).pop() ?? m.home_team; // "hilal"
  const awayKeyword = m.away_team.split('-').filter(Boolean).pop() ?? m.away_team; // "shabab"

  const { data: logoData } = await supabase
    .from('ref_teams')
    .select('team_name, logo_url')
    .or(`team_name.ilike.%${homeKeyword}%,team_name.ilike.%${awayKeyword}%`);

  // Build map: keyword → logo_url
  const homeLogoUrl =
    logoData?.find((r) => r.team_name.toLowerCase().includes(homeKeyword))?.logo_url ?? null;
  const awayLogoUrl =
    logoData?.find((r) => r.team_name.toLowerCase().includes(awayKeyword))?.logo_url ?? null;

  // Prefer a fresh R2 presigned URL (same CDN as the list page).
  // Fall back to Supabase video_source if no R2 key is provided.
  let freshVideoUrl: string | null = null;
  if (r2Key) {
    freshVideoUrl = await generateR2VideoUrl(r2Key);
  }
  if (!freshVideoUrl) {
    freshVideoUrl = m.video_source ?? null;
  }

  const rawPhases =
    phasesResult.status === 'fulfilled' ? (phasesResult.value.data ?? []) : [];

  const phases: TacticalPhase[] = rawPhases.map((p) => ({
    id: p.id,
    startTimestamp: p.start_timestamp ?? '00:00',
    endTimestamp: p.end_timestamp ?? '00:00',
    startSeconds: p.start_seconds ?? 0,
    endSeconds: p.end_seconds ?? 0,
    phaseOfPlay: p.phase_of_play ?? '',
    possessionTeam: p.possession_team ?? '',
    defendingTeam: p.defending_team ?? '',
    pitchZone: p.pitch_zone ?? '',
    eventType: p.event_type ?? '',
    tacticalDescription: p.tactical_description ?? '',
    attackRating: p.attacking_team_execution_rating ?? 5,
    defenseRating: p.defending_team_execution_rating ?? 5,
    keyInsight: p.key_tactical_insight ?? '',
    coachAdvice: p.coach_actionable_advice ?? '',
    perspective: (p.primary_team_perspective ?? 'neutral') as TacticalPhase['perspective'],
  }));

  return {
    id: m.id,
    homeTeam: homeDisplay,
    awayTeam: awayDisplay,
    homeTeamLogo: homeLogoUrl,
    awayTeamLogo: awayLogoUrl,
    matchDate: m.match_date ?? '',
    competition: m.competition ?? '',
    videoSource: freshVideoUrl,
    inferenceEventCount: m.inference_event_count ?? 0,
    pipelineDurationSeconds: Number(m.pipeline_duration_seconds ?? 0),
    comprehensiveAnalysisMd: m.comprehensive_analysis_md ?? '',
    phases,
  };
}

export async function fetchMatchStatus(matchId: string): Promise<MatchStatus | null> {
  const { data, error } = await supabase
    .from('matches')
    .select('id, status, pipeline_stage, error_message')
    .eq('id', matchId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    status: data.status ?? 'not_started',
    pipelineStage: data.pipeline_stage ?? null,
    errorMessage: data.error_message ?? null,
  };
}

function capitalize(s: string): string {
  return s
    .split(/[-\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ---------------------------------------------------------------------------
// Master function
// ---------------------------------------------------------------------------

export async function fetchAnalysisPageData(): Promise<MatchVideo[]> {
  const [r2Result] = await Promise.allSettled([fetchMatchesFromR2()]);

  const matches = r2Result.status === 'fulfilled' ? r2Result.value : [];
  if (matches.length === 0) return [];

  const keys = matches.map((m) => m.key);
  const teamNames = Array.from(new Set(matches.flatMap((m) => [m.homeTeam, m.awayTeam])));

  const [statusMap, previewMap, logoMap] = await Promise.all([
    fetchAnalysisStatuses(keys).catch(() => new Map<string, { id: string; status: string }>()),
    generatePreviewUrls(keys).catch(() => new Map<string, string>()),
    fetchTeamLogos(teamNames).catch(() => new Map<string, string>()),
  ]);

  return matches.map((m) => {
    const record = statusMap.get(m.key);
    return {
      ...m,
      homeTeamLogo: logoMap.get(m.homeTeam) ?? null,
      awayTeamLogo: logoMap.get(m.awayTeam) ?? null,
      matchId: record?.id ?? null,
      analysisStatus: record ? toAnalysisStatus(record.status) : 'not_started',
      previewUrl: previewMap.get(m.key) ?? null,
    };
  });
}
