# CoachAI Video Analysis — API Reference

**Service:** `coachAI-video-analysis` · **Workspace:** `khalidald4z` · **Status:** 🟢 Deployed

| Endpoint | URL |
|---|---|
| `POST /submit` | `https://khalidald4z--coachai-video-analysis-submit.modal.run` |
| `GET /status` | `https://khalidald4z--coachai-video-analysis-status.modal.run` |
| `POST /analyze` | `https://khalidald4z--coachai-video-analysis-analyze.modal.run` |
| `GET /health` | `https://khalidald4z--coachai-video-analysis-health.modal.run` |

> Interactive Swagger docs: append `/docs` to any endpoint URL.

---

## Overview

CoachAI takes a raw video URL, runs **T-DEED** action-spotting on a serverless GPU, and returns a structured JSON tactical report powered by **Gemini**.

| Method | Path | Mode | Use when |
|--------|------|------|----------|
| `POST` | `/submit` | **Async** | Production — all videos |
| `GET` | `/status` | **Poll** | Check a submitted job |
| `POST` | `/analyze` | **Sync** | Short clips / local testing only |
| `GET` | `/health` | — | Liveness check |

---

## Authentication

No API key is required from the caller. Gemini and Supabase credentials are injected server-side via Modal Secrets.

---

## Endpoints

---

### `POST /submit` — Submit an async job

Starts a GPU job in the background and immediately returns a `job_id`. **Always use this for production.**

**URL:** `https://khalidald4z--coachai-video-analysis-submit.modal.run`

#### Request body (`application/json`)

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `video_url` | `string` | ✅ (or `video_path`) | — | Public URL to the match video (YouTube, direct MP4, etc.) |
| `video_path` | `string` | ✅ (or `video_url`) | — | Path to a video already on the Modal volume |
| `inference_threshold` | `float` | ❌ | `0.3` | T-DEED confidence cutoff (0.0–1.0). Lower = more events detected, higher = fewer but more confident. |
| `skip_gemini` | `boolean` | ❌ | `false` | `true` = return raw T-DEED action-spotting events only, skip Gemini tactical analysis |
| `primary_team` | `string` | ❌ | `""` | Team name to frame coaching advice around. Empty = neutral analysis. |
| `save_to_db` | `boolean` | ❌ | `false` | Persist results to Supabase |
| `team_id` | `string` | ❌ | `""` | Supabase team UUID — required when `save_to_db=true` |
| `home_team` | `string` | ❌ | `""` | Home team name — used for report labeling and DB storage |
| `away_team` | `string` | ❌ | `""` | Away team name |
| `match_date` | `string` | ❌ | `null` | ISO 8601 date, e.g. `"2026-04-27"` |
| `competition` | `string` | ❌ | `null` | Competition name, e.g. `"Saudi Pro League"` |

#### Example request

```bash
curl -X POST https://khalidald4z--coachai-video-analysis-submit.modal.run \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://www.youtube.com/watch?v=EXAMPLE",
    "home_team": "Al-Hilal",
    "away_team": "Al-Shabab",
    "primary_team": "Al-Hilal",
    "competition": "Saudi Pro League",
    "match_date": "2026-04-27",
    "inference_threshold": 0.3
  }'
```

#### Response `200 OK`

```json
{
  "status": "submitted",
  "job_id": "fc-abc123xyz",
  "message": "Poll GET /status?job_id=<job_id> for results."
}
```

---

### `GET /status` — Poll for job result

**URL:** `https://khalidald4z--coachai-video-analysis-status.modal.run`

#### Query parameters

| Param | Type | Required | Description |
|---|---|---|---|
| `job_id` | `string` | ✅ | The `job_id` returned by `/submit` |

#### Example request

```bash
curl "https://khalidald4z--coachai-video-analysis-status.modal.run?job_id=fc-abc123xyz"
```

#### Responses

**`200 OK` — completed**
```json
{
  "status": "completed",
  "result": [ ... ]
}
```

**`202 Accepted` — still running**
```json
{
  "status": "pending",
  "message": "Job is still processing..."
}
```

**`200 OK` — error**
```json
{
  "status": "error",
  "message": "Descriptive error message here"
}
```

> **Polling strategy:** call `/status` every **5–10 seconds**.  
> A typical 5–10 min clip finishes in **60–120 s** on a T4 GPU.

---

### `POST /analyze` — Synchronous analysis ⚠️

**URL:** `https://khalidald4z--coachai-video-analysis-analyze.modal.run`

Same request body as `/submit` but **blocks until complete**.

> **Warning:** Only safe for clips under ~2 minutes. Longer videos will hit HTTP proxy timeouts. Use `/submit` + `/status` for everything else.

#### Example request

```bash
curl -X POST https://khalidald4z--coachai-video-analysis-analyze.modal.run \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://example.com/short_clip.mp4"
  }'
```

Returns the full pipeline result directly — same shape as the `result` field from `/status`.

---

### `GET /health` — Health check

**URL:** `https://khalidald4z--coachai-video-analysis-health.modal.run`

```bash
curl https://khalidald4z--coachai-video-analysis-health.modal.run
```

**Live response:**
```json
{
  "status": "healthy",
  "service": "CoachAI Video Analysis Agent",
  "models": ["SoccerNet_small", "SoccerNetBall_challenge1"],
  "timestamp": "2026-04-27T13:22:33.391100"
}
```

---

## Response Schema

The pipeline result is a **JSON array** — one object per detected tactical event.

| Field | Type | Description |
|---|---|---|
| `start_timestamp` | `string` | Clip start time `"MM:SS"` |
| `end_timestamp` | `string` | Clip end time `"MM:SS"` |
| `phase_of_play` | `string` | e.g. `"Build-up"`, `"Defensive Transition"`, `"Final Third Attack"` |
| `possession_team` | `string` | Team in possession during this event |
| `pitch_zone` | `string` | e.g. `"Middle Third - Central"`, `"Right Wing / Box"` |
| `event_type` | `string` | T-DEED action label, e.g. `"Pass"`, `"Cross"`, `"Counter-Attack"` |
| `tactical_description` | `string` | Gemini's detailed description of the phase |
| `attacking_team_execution_rating` | `integer` | 1–10 rating for the attacking team |
| `defending_team_execution_rating` | `integer` | 1–10 rating for the defending team |
| `key_tactical_insight` | `string` | One-line coaching takeaway |
| `coach_actionable_advice` | `string` | Specific drill or instruction for the coaching staff |
| `primary_team_perspective` | `string` | `"neutral"` · `"opportunity"` · `"threat"` |

### `primary_team_perspective` values

| Value | Meaning |
|---|---|
| `"opportunity"` | This event is an advantage for your team |
| `"threat"` | This event is a danger to your team |
| `"neutral"` | No `primary_team` set, or event is balanced |

### Full example event

```json
{
  "start_timestamp": "03:12",
  "end_timestamp": "03:18",
  "phase_of_play": "Final Third Attack",
  "possession_team": "White/Al-Hilal",
  "pitch_zone": "Right Wing / Box",
  "event_type": "Cross",
  "tactical_description": "Al-Hilal effectively exploited the right wide channel. A deep cross bypassed the first line of defenders, finding Mohamed Kanno who utilized his height and late-arrival timing to head the ball home. Al-Shabab's markers were caught ball-watching.",
  "attacking_team_execution_rating": 9,
  "defending_team_execution_rating": 5,
  "key_tactical_insight": "Aggressive wing play combined with late midfield runs consistently overloads the opponent's back four.",
  "coach_actionable_advice": "Continue to isolate the opposition full-backs 1v1 to generate high-quality crossing opportunities from deep areas.",
  "primary_team_perspective": "opportunity"
}
```

---

## Python Integration (Copy-Paste Ready)

```python
import time
import requests

# ── Config ─────────────────────────────────────────────────────────────────
SUBMIT_URL  = "https://khalidald4z--coachai-video-analysis-submit.modal.run"
STATUS_URL  = "https://khalidald4z--coachai-video-analysis-status.modal.run"
ANALYZE_URL = "https://khalidald4z--coachai-video-analysis-analyze.modal.run"
HEALTH_URL  = "https://khalidald4z--coachai-video-analysis-health.modal.run"

# ── Async helper (recommended for production) ───────────────────────────────
def analyze_match(
    video_url: str,
    primary_team: str = "",
    home_team: str = "",
    away_team: str = "",
    competition: str = "",
    match_date: str = "",
    inference_threshold: float = 0.3,
    save_to_db: bool = False,
    team_id: str = "",
    poll_interval: int = 10,
) -> list[dict]:
    """Submit a video for analysis and poll until complete."""

    payload = {
        "video_url": video_url,
        "primary_team": primary_team,
        "home_team": home_team,
        "away_team": away_team,
        "competition": competition or None,
        "match_date": match_date or None,
        "inference_threshold": inference_threshold,
        "save_to_db": save_to_db,
        "team_id": team_id,
    }

    # 1. Submit
    resp = requests.post(SUBMIT_URL, json=payload, timeout=30)
    resp.raise_for_status()
    job_id = resp.json()["job_id"]
    print(f"✅ Job submitted: {job_id}")

    # 2. Poll
    while True:
        poll = requests.get(STATUS_URL, params={"job_id": job_id}, timeout=30)
        data = poll.json()
        status = data["status"]

        if status == "completed":
            print("✅ Analysis complete")
            return data["result"]
        elif status == "error":
            raise RuntimeError(f"Pipeline error: {data['message']}")
        else:
            print(f"⏳ {data['message']} — retrying in {poll_interval}s")
            time.sleep(poll_interval)


# ── Usage ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    events = analyze_match(
        video_url="https://www.youtube.com/watch?v=EXAMPLE",
        primary_team="Al-Hilal",
        home_team="Al-Hilal",
        away_team="Al-Shabab",
        competition="Saudi Pro League",
        match_date="2026-04-27",
    )

    for e in events:
        perspective_icon = {"opportunity": "🟢", "threat": "🔴", "neutral": "⚪"}.get(
            e["primary_team_perspective"], "⚪"
        )
        print(
            f"{perspective_icon} [{e['start_timestamp']}–{e['end_timestamp']}] "
            f"{e['event_type']} | {e['key_tactical_insight']}"
        )
```

---

## Error Reference

| `status` value | HTTP code | Cause |
|---|---|---|
| `"submitted"` | `200` | Job accepted — use `job_id` to poll |
| `"pending"` | `202` | Job still running — keep polling |
| `"completed"` | `200` | Result ready in `result` field |
| `"error"` | `200` | Missing required field or pipeline failure |

---

## Service Limits

| Parameter | Value |
|---|---|
| GPU options | T4 → L4 → A10G (auto-selected) |
| Max job timeout | 900 s (15 min) |
| Max concurrent jobs | 3 |
| Container idle scale-down | 300 s |
| `/analyze` safe max video length | ~2 min |
| `/submit` + `/status` safe max video length | ~90 min |
| Active models | `SoccerNet_small`, `SoccerNetBall_challenge1` |
