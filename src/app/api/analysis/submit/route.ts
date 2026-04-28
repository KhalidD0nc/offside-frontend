import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2 } from '@/lib/r2/client';
import { getSupabaseService } from '@/lib/supabase/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// TODO: Implement user auth to dynamically get team ID instead of hardcoding
const TEAM_ID = 2932;
const PRIMARY_TEAM = 'Al-Hilal Saudi FC';
const ACTIVE_STATUSES = new Set(['queued', 'downloading', 'inferencing', 'cleaning', 'analysing', 'saving']);
const MODAL_SUBMIT_URL =
  process.env.MODAL_SUBMIT_URL ??
  'https://khalidald4z--coachai-video-analysis-submit.modal.run';

type SubmitBody = {
  r2Key?: unknown;
  homeTeam?: unknown;
  awayTeam?: unknown;
  competition?: unknown;
  matchDate?: unknown;
  primaryTeam?: unknown;
};

type MatchRow = {
  id: string;
  status: string | null;
  pipeline_stage: string | null;
  modal_job_id: string | null;
};

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function isValidR2Key(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('matches/') &&
    value.endsWith('.mp4') &&
    !value.includes('..')
  );
}

function asOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeTeam(value: string) {
  return value.trim().toLowerCase();
}

async function getExistingMatch(r2Key: string): Promise<MatchRow | null> {
  const supabaseService = getSupabaseService();
  const { data, error } = await supabaseService
    .from('matches')
    .select('id, status, pipeline_stage, modal_job_id')
    .eq('r2_key', r2Key)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as MatchRow | null;
}

async function createOrResetMatch({
  existing,
  r2Key,
  homeTeam,
  awayTeam,
  competition,
  matchDate,
  primaryTeam,
}: {
  existing: MatchRow | null;
  r2Key: string;
  homeTeam: string;
  awayTeam: string;
  competition: string | null;
  matchDate: string | null;
  primaryTeam: string;
}) {
  const supabaseService = getSupabaseService();
  const submittedAt = new Date().toISOString();
  const row = {
    team_id: TEAM_ID,
    r2_key: r2Key,
    status: 'queued',
    pipeline_stage: 'queued',
    submitted_at: submittedAt,
    completed_at: null,
    error_message: null,
    modal_job_id: null,
    home_team: normalizeTeam(homeTeam),
    away_team: normalizeTeam(awayTeam),
    competition,
    match_date: matchDate,
    primary_team: normalizeTeam(primaryTeam),
  };

  if (existing) {
    const { data, error } = await supabaseService
      .from('matches')
      .update(row)
      .eq('id', existing.id)
      .select('id')
      .single();

    if (error) throw error;
    return data.id as string;
  }

  const { data, error } = await supabaseService
    .from('matches')
    .insert(row)
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function POST(request: Request) {
  try {
    // TODO: Implement rate limiting to prevent abuse (e.g., max 10 submissions per minute per team)
    const body = (await request.json()) as SubmitBody;
    const supabaseService = getSupabaseService();

    if (!isValidR2Key(body.r2Key)) {
      return jsonError('r2Key must be a matches/*.mp4 object key.', 400);
    }
    if (typeof body.homeTeam !== 'string' || !body.homeTeam.trim()) {
      return jsonError('homeTeam is required.', 400);
    }
    if (typeof body.awayTeam !== 'string' || !body.awayTeam.trim()) {
      return jsonError('awayTeam is required.', 400);
    }

    const r2Key = body.r2Key;
    const homeTeam = body.homeTeam.trim();
    const awayTeam = body.awayTeam.trim();
    const competition = asOptionalString(body.competition);
    const matchDate = asOptionalString(body.matchDate);
    const primaryTeam = asOptionalString(body.primaryTeam) ?? PRIMARY_TEAM;

    const existing = await getExistingMatch(r2Key);
    if (existing?.status === 'completed') {
      return Response.json({
        matchId: existing.id,
        modalJobId: existing.modal_job_id,
        status: 'completed',
      });
    }

    const activeState = existing?.pipeline_stage ?? existing?.status;
    if (existing && activeState && ACTIVE_STATUSES.has(activeState)) {
      return Response.json({
        matchId: existing.id,
        modalJobId: existing.modal_job_id,
        status: 'queued',
      });
    }

    const videoUrl = await getSignedUrl(
      r2,
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME ?? 'hilal-match-videos',
        Key: r2Key,
      }),
      { expiresIn: 7200 },
    );

    const matchId = await createOrResetMatch({
      existing,
      r2Key,
      homeTeam,
      awayTeam,
      competition,
      matchDate,
      primaryTeam,
    });

    const modalResponse = await fetch(MODAL_SUBMIT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_url: videoUrl,
        match_id: matchId,
        save_to_db: true,
        team_id: String(TEAM_ID),
        home_team: homeTeam,
        away_team: awayTeam,
        competition,
        match_date: matchDate,
        primary_team: primaryTeam,
      }),
    });

    const modalData = (await modalResponse.json().catch(() => null)) as {
      status?: string;
      job_id?: string;
      message?: string;
    } | null;

    if (!modalResponse.ok || modalData?.status === 'error' || !modalData?.job_id) {
      await supabaseService
        .from('matches')
        .update({
          status: 'failed',
          pipeline_stage: 'failed',
          completed_at: new Date().toISOString(),
          error_message: modalData?.message ?? 'Modal submit failed',
        })
        .eq('id', matchId);

      return jsonError(modalData?.message ?? 'Could not submit analysis job.', 502);
    }

    await supabaseService
      .from('matches')
      .update({ modal_job_id: modalData.job_id })
      .eq('id', matchId);

    return Response.json({
      matchId,
      modalJobId: modalData.job_id,
      status: 'queued',
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Analysis submit failed.', 500);
  }
}
