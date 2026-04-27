# Plan: Playful Async Analysis UX + Cross-Page Persistence

## Context

The video analysis pipeline (CoachAI on Modal) takes 2–4 minutes. The "Start Analysis" button in `MatchCard.tsx` has no handler. When a user starts an analysis there is no progress feedback, no way to leave and come back, and no results page. This plan wires the full loop: submit → live stage updates → persistent cross-page indicator → results view.

**Scope note:** This plan is for local development / prototype wiring. It is acceptable to use a local `.env.local` service key and a locally running Next.js route, but do not treat that route as production-safe until auth, team authorization, rate limiting, and key validation are added.

**Repo note:** Frontend changes live in this repo (`/Users/khalidr/Desktop/Offside-Workspace/Offside-frontend`). CoachAI / Modal changes live in `/Users/khalidr/Desktop/Video-Analysis-Agent-CoachAi`.

---

## Implementation Sequence

### Step 1 — SQL Migration

Run against the Supabase project (`ajsgxobgepftegpxecij`):

```sql
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS modal_job_id       text,
  ADD COLUMN IF NOT EXISTS pipeline_stage     text,
  ADD COLUMN IF NOT EXISTS submitted_at       timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at       timestamptz,
  ADD COLUMN IF NOT EXISTS error_message      text;

-- r2_key already queried by the frontend; make sure it exists
ALTER TABLE matches ADD COLUMN IF NOT EXISTS r2_key text;

-- Status default (frontend reads this)
ALTER TABLE matches ALTER COLUMN status SET DEFAULT 'not_started';

-- Required for Supabase Realtime row-level filters
ALTER TABLE matches REPLICA IDENTITY FULL;

CREATE INDEX IF NOT EXISTS matches_r2_key_idx ON matches (r2_key);
```

**Local-dev idempotency note:** Before inserting a new row, the submit route should look up an existing `matches` row by `r2_key`.
- If the row is `queued`, `downloading`, `inferencing`, `cleaning`, `analysing`, or `saving`, return the existing `matchId` instead of submitting another Modal job.
- If the row is `completed`, return the existing `matchId` and let the UI navigate to results.
- If the row is `failed`, reuse the same row for retry by resetting `status`, `pipeline_stage`, `submitted_at`, `completed_at`, and `error_message`.

Do not add a hard unique constraint on `r2_key` until the desired long-term data model is decided, because this prototype currently treats one R2 object as one analysis record.

Also enable Realtime for `matches` in the Supabase Dashboard → Database → Replication.

---

### Step 2 — CoachAI: Stage Reporter (new file)

**File:** `/Users/khalidr/Desktop/Video-Analysis-Agent-CoachAi/src/coachai/memory/stage_reporter.py`

Creates a `report_stage(match_id, stage)` helper that does a Supabase UPDATE on the `matches` row. Non-fatal — logs warnings on failure. Uses existing `get_client()` from `coachai.memory.supabase_client`.

Stage values (maps to `pipeline_stage` column):
`queued → downloading → inferencing → cleaning → analysing → saving → completed | failed`

Terminal stage rule:
- `completed` must also set `status='completed'`, `completed_at=now()`, and `error_message=NULL`.
- `failed` must also set `status='failed'`, `completed_at=now()`, and `error_message=<short failure reason>`.
- Non-terminal stages should keep `status='queued'` for compatibility with the current frontend's `analysisStatus` union, while `pipeline_stage` carries the granular progress state.

---

### Step 3 — CoachAI: Pipeline + Writer Changes

**`/Users/khalidr/Desktop/Video-Analysis-Agent-CoachAi/src/coachai/pipeline.py`** — Add `match_id: str | None = None` param to `run()`. Inject `report_stage()` calls at each stage boundary:

| Location in pipeline.py | Stage to report |
|---|---|
| Before `download_video()` starts | `"downloading"` |
| Before `run_inference()` loop | `"inferencing"` |
| Before `merge_and_clean()` | `"cleaning"` |
| Before `run_gemini_analysis()` | `"analysing"` |
| Before `save_match_to_db()` | `"saving"` |
| After `save_match_to_db()` succeeds | `"completed"` |
| Any exception that prevents completion | `"failed"` |

Wrap the full pipeline body in a failure reporter, not only the `MemoryWriteError` block, so download, inference, cleaning, Gemini, and DB-write failures all move the frontend out of the in-progress state.

**`/Users/khalidr/Desktop/Video-Analysis-Agent-CoachAi/src/coachai/memory/writer.py`** — Add `match_id: str | None = None` param to `save_match_to_db()`. When `match_id` is provided, do `UPDATE ... WHERE id = match_id` instead of `INSERT` (frontend pre-creates the row). Fall back to INSERT when `match_id` is None for backward-compatible local runs. When updating, delete/recreate `tactical_phases` for that `match_id` or make the phase write idempotent, so retries do not duplicate phase rows.

**`/Users/khalidr/Desktop/Video-Analysis-Agent-CoachAi/modal_app.py`** — Thread `match_id` from the `/submit` request body through `run_pipeline.spawn()` call to `pipeline.run()`.

---

### Step 4 — Next.js API Route

**File:** `src/app/api/analysis/submit/route.ts`

Server-only route that:
1. Validates the request body shape and requires `r2Key` to start with `matches/` and end with `.mp4`
2. Looks up an existing `matches` row by `r2_key` and applies the local-dev idempotency rules from Step 1
3. Generates a 2-hour presigned R2 URL (reuses `r2` client from `@/lib/r2/client`)
4. INSERTs or UPDATEs a `matches` row (`r2_key`, `status='queued'`, `pipeline_stage='queued'`, `submitted_at`, team metadata) via `SUPABASE_SERVICE_KEY`
5. POSTs to `${MODAL_API_URL}/submit` with `video_url`, `match_id`, and the metadata the current Modal API expects (`save_to_db`, `team_id`, `home_team`, `away_team`, `competition`, `primary_team`)
6. Stores returned `modal_job_id` on the row
7. Returns `{ matchId, modalJobId, status: 'queued' }`

Because this is local development, full auth can wait. Still keep the service-key route server-only, never expose `SUPABASE_SERVICE_KEY` with a `NEXT_PUBLIC_` prefix, and keep the R2 key allowlist check so accidental broad object signing is avoided.

**New env vars needed in `.env.local`:**
```
SUPABASE_SERVICE_KEY=...   # Never NEXT_PUBLIC_
MODAL_API_URL=https://khalidald4z--coachai-video-analysis
```

---

### Step 5 — Realtime Hook

**File:** `src/hooks/useMatchStatus.ts`

```typescript
export function useMatchStatus(matchId: string | null): {
  status: string;
  pipelineStage: PipelineStage | null;
  errorMessage: string | null;
  isLoading: boolean;
}
```

- Does an initial `SELECT status, pipeline_stage, error_message` on mount
- Subscribes to `postgres_changes` on `matches` with `filter: id=eq.${matchId}`
- Calls `supabase.removeChannel()` on unmount
- Uses the existing anon-key client from `@/lib/supabase/client`

---

### Step 6 — Global Jobs Context

**File:** `src/contexts/ActiveJobsContext.tsx`

React Context + `localStorage` (mirrors how `AppShell.tsx` already persists `navCollapsed`). Exposes:
```typescript
{ jobs: ActiveJob[], addJob(job), removeJob(matchId) }
```

On provider mount, reconcile `localStorage` with Supabase:
- Drop jobs whose `status` is `completed` or `failed`.
- Keep only jobs updated/submitted within a reasonable local-dev TTL, for example 6 hours.
- Subscribe to each active job and remove it from storage when a terminal status arrives.

**Wire into** `src/app/(app)/layout.tsx` by wrapping `<AppShell>` in `<ActiveJobsProvider>`.

---

### Step 7 — Progress UI

**File:** `src/components/analysis/pipeline-stages.ts`

Stage definitions with football metaphors:

| pipeline_stage | Icon | Label | Description |
|---|---|---|---|
| `queued` | `sports_soccer` | Pre-Match | Warming up the engine… |
| `downloading` | `video_file` | Video Feed | Fetching match footage |
| `inferencing` | `visibility` | Scouting | AI scanning every frame |
| `cleaning` | `auto_fix_high` | VAR Review | Verifying detected events |
| `analysing` | `psychology` | Coach Debrief | Building tactical report |
| `saving` | `save` | Filing Report | Storing to team memory |
| `completed` | `emoji_events` | Full Time | Analysis complete! |

**`src/components/analysis/AnalysisProgressBar.tsx`** — Two modes:
- **Full** (used on analysis page / modal): horizontal stepper, 7 stage nodes, NEO_INSET for completed, `animate-pulse` on active, stage description + "~N min remaining" estimate
- **Compact** (used in sidebar): single line — icon + label + pulsing dot

**`src/components/analysis/AnalysisProgressModal.tsx`** — Overlay card that slides up from the MatchCard footer after submit. Uses `useMatchStatus` internally. Auto-navigates to `/analysis/[matchId]` when `status === 'completed'`. Has a "Dismiss — I'll check back later" link.

---

### Step 8 — Sidebar Indicator

**`AppShell.tsx`** — Read `jobs.length` from `useActiveJobs()`. Pass `activeJobCount` down to `<SideNav>`.

**`SideNav.tsx`** — On the Analysis nav item:
- Expanded: badge pill `sports_soccer {count}` with `animate-pulse` and `bg-primary text-on-primary`
- Collapsed: 8px amber dot (`absolute top-2 right-2`) with `animate-pulse`

---

### Step 9 — Results Page

**`src/lib/queries/matchResult.ts`** — `fetchMatchResult(matchId)` — queries `matches` + `tactical_phases WHERE match_id = matchId ORDER BY start_seconds`.

Before implementing this page, verify the live Supabase schema matches the CoachAI writer output. The current writer in `/Users/khalidr/Desktop/Video-Analysis-Agent-CoachAi/src/coachai/memory/writer.py` writes:
- `matches.comprehensive_analysis_md`
- `matches.timeline_csv`
- `matches.inference_event_count`
- `matches.pipeline_duration_seconds`
- `tactical_phases.start_seconds`
- `tactical_phases.end_seconds`
- tactical phase text/rating fields

**`src/app/(app)/analysis/[matchId]/page.tsx`** — Server component. If status is not `completed`, shows `AnalysisProgressBar` in full mode with live Realtime (via a client sub-component). If completed, shows three tabs:

- **Report** — renders `comprehensive_analysis_md` as Markdown + stats chip (event count, pipeline duration)
- **Timeline** — parses `timeline_csv` into event objects, renders with a `TimelineScrubber` (reuse existing component from `src/components/formations/TimelineScrubber.tsx`)
- **Tactical Phases** — scrollable list of `tactical_phases` rows as NEO_RAISED cards

**`src/app/(app)/analysis/[matchId]/loading.tsx`** — animate-pulse skeleton matching final layout.

---

### Step 10 — MatchCard + Analysis Page Wiring

**`MatchCard.tsx`** — Add props:
```typescript
onStartAnalysis?: (match: MatchVideo) => void;
isSubmitting?: boolean;
```
Wire "Start Analysis" and "Retry" buttons to `onStartAnalysis`. Wire "View Analysis" to `router.push('/analysis/${match.matchId}')`. Show spinner on button when `isSubmitting`.

**New:** `src/components/analysis/AnalysisPageClient.tsx` — `'use client'` wrapper that holds submit state, calls `/api/analysis/submit`, manages `AnalysisProgressModal` visibility, and calls `addJob()` / `removeJob()` on the context.

**`src/app/(app)/analysis/page.tsx`** — Stays a server component. Replace the MatchCard grid with `<AnalysisPageClient matches={matches} />`.

---

## Files Modified / Created

### CoachAI (Python)
- `/Users/khalidr/Desktop/Video-Analysis-Agent-CoachAi/src/coachai/memory/stage_reporter.py` ← **new**
- `/Users/khalidr/Desktop/Video-Analysis-Agent-CoachAi/src/coachai/pipeline.py` ← add `match_id` param + `report_stage()` calls
- `/Users/khalidr/Desktop/Video-Analysis-Agent-CoachAi/src/coachai/memory/writer.py` ← add `match_id` param + UPDATE vs INSERT logic
- `/Users/khalidr/Desktop/Video-Analysis-Agent-CoachAi/modal_app.py` ← thread `match_id` through spawn call

### Frontend (TypeScript)
- `src/app/api/analysis/submit/route.ts` ← **new**
- `src/hooks/useMatchStatus.ts` ← **new**
- `src/contexts/ActiveJobsContext.tsx` ← **new**
- `src/components/analysis/pipeline-stages.ts` ← **new**
- `src/components/analysis/AnalysisProgressBar.tsx` ← **new**
- `src/components/analysis/AnalysisProgressModal.tsx` ← **new**
- `src/components/analysis/AnalysisPageClient.tsx` ← **new**
- `src/app/(app)/analysis/[matchId]/page.tsx` ← **new**
- `src/app/(app)/analysis/[matchId]/loading.tsx` ← **new**
- `src/lib/queries/matchResult.ts` ← **new**
- `src/app/(app)/layout.tsx` ← wrap with `ActiveJobsProvider`
- `src/components/AppShell.tsx` ← read `jobs.length`, pass to SideNav
- `src/components/SideNav.tsx` ← add `activeJobCount` prop + badge UI
- `src/components/analysis/MatchCard.tsx` ← add `onStartAnalysis`, `isSubmitting` props
- `src/app/(app)/analysis/page.tsx` ← delegate grid to `AnalysisPageClient`
- `.env.local` ← add `SUPABASE_SERVICE_KEY`, `MODAL_API_URL`

### Reused Without Changes
- `src/components/formations/TimelineScrubber.tsx` — reused on results Timeline tab
- `src/lib/r2/client.ts` — reused in submit API route for presigned URL
- `src/lib/supabase/client.ts` — reused in `useMatchStatus` hook

---

## Verification

1. **Schema** — Check Supabase Table Editor: `matches` has all new columns; Realtime is enabled
2. **CoachAI stage updates** — Run `python run_modal_api.py` with a short test clip and `save_to_db=True` + a known `match_id`. Watch Supabase → `matches` row update `pipeline_stage` live in the Table Editor
3. **Submit route** — `curl -X POST /api/analysis/submit` with a valid `r2Key`. Confirm row appears in `matches` with `status='queued'` and `modal_job_id` gets populated
4. **Realtime** — Open two browser tabs on `/analysis`. Submit from one; confirm the other's MatchCard status dot updates without a page refresh
5. **Cross-page** — Submit an analysis, navigate to `/overview`. Confirm sidebar "Analysis" item shows the animated badge. Navigate back to `/analysis` and confirm progress is shown
6. **Results page** — After a completed analysis, navigate to `/analysis/[matchId]`. Confirm all three tabs render with real data
7. **Leave and return** — Submit an analysis, close the tab, reopen. Confirm the in-progress job is still shown (from localStorage) and the Realtime subscription re-attaches
