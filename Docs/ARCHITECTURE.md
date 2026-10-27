# Offside architecture

## Application boundaries

| Layer | Code | Responsibility |
| --- | --- | --- |
| Pages | `src/app/(app)/` | Render the coaching workspace |
| UI | `src/components/` | Charts, match views, pitch interactions, and chat |
| Data access | `src/lib/queries/` | Query existing Supabase tables and views |
| AI | `src/lib/ai/` | Tool-assisted coaching and opponent analysis |
| Submission | `src/app/api/analysis/submit/route.ts` | Validate object keys, create match records, and submit jobs |
| Storage | `src/lib/r2/client.ts` | Access R2 through the S3-compatible SDK |
| Status | `src/hooks/useMatchStatus.ts` | Read initial status and subscribe to Supabase Realtime |

## Analysis submission

1. The dashboard selects an existing video object under `matches/`.
2. The server route validates the object key and records or resets the match job.
3. It signs a temporary R2 URL and submits it to the configured Modal endpoint.
4. Modal returns a job identifier, which the route saves in Supabase.
5. The UI watches database changes to display progress.

The [companion service](https://github.com/KhalidD0nc/Video-Agent-Analysis-Service) returns its timeline and reports through a separate status endpoint. This frontend does not include the worker that polls that endpoint, persists report data, and advances database stages. Provision that bridge as part of your deployment.

## Coaching assistant

The Next.js chat route delegates to `coach-agent.ts`. The agent uses predefined football data tools rather than arbitrary SQL, limits tool rounds, and requests a structured answer containing evidence, citations, follow-up questions, and tool names. OpenAI credentials stay in server environment variables.

## Data prerequisites

The Supabase project must already contain the football dataset and analytics views consumed by `src/lib/queries/`. Examples include:

- Team and match data: `ref_teams`, `matches`, `upcoming_fixtures`, `match_lineups`.
- Performance views: `team_performance_summary`, `match_team_performance`, `team_scoring_profile`.
- Player data: `player_season_summary`, `player_performance_mart`, `leaderboards`.
- Tactical findings: `tactical_phases`.

This is an illustrative list; the query modules are the source of truth for columns and additional relations. The checked-in migration adds asynchronous analysis fields to `matches`. It does not bootstrap these relations, seed data, configure access policies, or enable the Realtime publication.

## Environment separation

Use independent database/storage/model settings for development, staging, and production. Keep `NODE_ENV` managed by Next.js; do not use `NODE_ENV=staging`. Public `NEXT_PUBLIC_` values are embedded during the build, so build each environment with the intended public settings.

The source branches do not create deployments. Configure preview hosting and the analysis service explicitly, and verify the integration against the correct backend before promoting a release.

## Current constraints

- Team identifiers and names are fixed to Al-Hilal in several modules.
- Authentication for analysis submission is an explicit TODO in the route handler.
- The analytics schema and status/persistence worker are external prerequisites.
- `Video-Analysis-Agent-CoachAi/` is recorded as a Git link without a checked-in `.gitmodules` mapping; the dashboard does not require it to build. Use the standalone companion repository for service setup.
