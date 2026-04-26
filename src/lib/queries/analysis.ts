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

async function fetchAnalysisStatuses(
  keys: string[],
): Promise<Map<string, { id: string; status: string }>> {
  if (keys.length === 0) return new Map();

  const { data, error } = await supabase
    .from('matches')
    .select('id, r2_key, status')
    .in('r2_key', keys);

  if (error) return new Map();

  const map = new Map<string, { id: string; status: string }>();
  for (const row of data ?? []) {
    if (row.r2_key) map.set(row.r2_key, { id: row.id, status: row.status });
  }
  return map;
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
      analysisStatus: (record?.status as MatchVideo['analysisStatus']) ?? 'not_started',
      previewUrl: previewMap.get(m.key) ?? null,
    };
  });
}
