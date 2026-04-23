---
**Project:** AI Coaching Platform **Version:** 1.0 **Status:** Draft **Last Updated:** April 16, 2026
---
## **1\. Project Overview**

An AI-powered football coaching platform that democratizes access to elite-level tactical intelligence. All match footage is pre-stored in Cloudflare R2, meaning coaches do not need to upload videos. Coaches can browse available matches, view previews, and initiate analysis. The system automatically extracts tactical phases, generates actionable insights, and seeds a persistent team memory database. This memory serves as the foundation for team performance tracking, drill generation, dynamic pre-match formations, and interactive AI-driven tactical planning — capabilities previously exclusive to professional clubs with dedicated analytics departments.

---

## **2\. Problem Statement**

| Problem                                                          | Impact                                        |
| ---------------------------------------------------------------- | --------------------------------------------- |
| Manual video review averages 2.5 hours per hour of footage       | Coaches spend time on extraction, not insight |
| Basic stats describe what happened, not why                      | No diagnostic value for tactical improvement  |
| High-quality analytics tools require professional infrastructure | Grassroots and amateur clubs are locked out   |
| Coaching intelligence lives in spreadsheets and notebooks        | No persistent, queryable team memory          |

---

## **3\. Goals**

**Primary Goal** Transform raw match footage into a persistent, queryable team memory that coaches can use to make data-driven tactical decisions.

**Secondary Goals**

* Reduce video analysis time by 50% vs manual review
* Give amateur coaches access to professional-grade tactical intelligence
* Build a compounding knowledge base — the more matches analyzed, the smarter the system gets

---

## **4\. Non-Goals (V1)**

* Real-time match analysis (post-match only)
* Player tracking with biometric data
* Public player database for scouting (V2)
* Mobile app (web first)
* Multi-language support

---

## **5\. Users**

| Actor              | Description                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| **Coach**    | Primary user. Browses matches, initiates analysis, reviews analysis, manages squad, queries AI assistant |
| **Pipeline** | Async system actor. Processes video, writes to DB                                                        |

---

## **6\. System Architecture (High Level)**

The system is organized into four distinct logical layers to separate fast client interactions from heavy async video processing.

### 1. Client Layer (Frontend)

* **Tech Stack:** React / Next.js
* **Role:** Renders the UI (Dashboard, Match Library, Chat). Makes lightweight requests to the backend to fetch stats or trigger Edge Functions.

### 2. Core Backend & DB (Supabase)

* **PostgreSQL DB:** The single source of truth for all structured data (`teams`, `team_memory`, `player_performance_mart`, etc.).
* **Auth:** Handles user login and permissions.
* **Edge Functions (AI Agent Layer):** Hosts the "Data-Fed Agents". Executes predefined SQL queries to grab JSON stats and passes them to the Gemini API to generate insights for the Interactive AI Coach Chat and Pre-Match Opponent Analysis.

### 3. Video Storage Layer (Cloudflare R2)

* **Role:** A massive object storage bucket holding all pre-stored `.mp4` match videos. No video is stored in the core DB.

### 4. Heavy Compute Pipeline (Modal)

* **Tech Stack:** Serverless GPU platform (Modal) + Python + T-DEED + Gemini.
* **Role:** The "Slow Path". When an analysis is triggered, a webhook hits Modal. Modal pulls the video from Cloudflare R2, runs the heavy T-DEED extraction, executes Gemini Stages 3 & 4, and writes the final JSON analysis directly back to the Supabase DB.

---

### **UC1 — Dashboard (Player Stats) - Offside AI**

**Actor:** Coach **Goal:** Overview of squad performance, team memory, and centralized roster management

**Flow:**

1. Coach navigates to the Dashboard
2. Views overall team performance charts and weakness breakdowns
3. Views the Players Table for quick stats and trends
4. Can create or update player profiles directly (assigns position, attributes, strengths, weaknesses)
5. System stores and displays the updated roster

**UI Sections:**

**Top — 2 Charts:**

* Chart 1: Team performance rating trend across matches (line chart)
* Chart 2: Weakness frequency breakdown (bar chart)

**Bottom — Players Table:**

| Player  | Position | Matches | Avg Rating | Top Weakness       | Trend | Actions |
| ------- | -------- | ------- | ---------- | ------------------ | ----- | ------- |
| Dembele | ST       | 8       | 7.2        | Defensive tracking | ↑    | Edit    |

**Outputs & Data Sources:**

* `team_memory` table — not recomputed on load for charts and stats
* Player profiles linked to match analyses and performance tracking

---

### **UC2 — Select and Analyze Match**

**Actor:** Coach **Goal:** Browse pre-stored matches and trigger or view the analysis pipeline

**Pre-condition:** Matches are pre-stored in Cloudflare R2 and their metadata is available in the system.

**Flow:**

1. Coach navigates to the Match Library.
2. System displays all available matches with their details (Teams, Date, Competition) and a match preview.
3. If the match has already been analyzed:
   * Coach sees a "View Analysis" button.
   * Clicking it opens the AI Coach interface (UC3) with the match context loaded, or updates the Dashboard (UC1) with the match data.
4. If the match has not been analyzed:
   * Coach sees a "Start Analysis" button.
   * Coach clicks the button.
   * `match_analyses` record created with `status: queued`
   * Pipeline triggered asynchronously using the pre-stored Cloudflare R2 video:
     * T-DEED → `timeline.csv`
     * Gemini Stage 3 → `phases[]` written to DB
     * Gemini Stage 4 → `summary`, `drills`, `patterns` written to DB
     * `team_memory` aggregator runs for `primary_team_id`
   * Status updated to `completed`
   * Coach notified — analysis ready

**Error Cases:**

| Error             | Handling                                             |
| ----------------- | ---------------------------------------------------- |
| Video unavailable | Disable "Start Analysis" and show error state        |
| Pipeline failure  | Status →`failed`, coach notified, retry available |

---

### **UC3 — Interact With AI Coach**

**Actor:** Coach **Goal:** Query match data and team history through natural language

**Pre-condition:** At least one completed match analysis exists

**Flow:**

1. Coach opens chat interface
2. Submits natural language query
3. System queries `team_memory`, `phases`, `patterns`, `drills`
4. AI returns evidence-based response citing specific matches and phases
5. Coach can refine with follow-up queries

**Examples:**

* "What are our most recurring defensive weaknesses?"
* "Generate a drill plan for this week based on our last 3 matches"
* "How does Al-Nasser typically attack from wide areas?"

---

### **UC4 — Pre-Match Formation & Opponent Analysis**

**Actor:** Coach **Goal:** Generate a dynamic tactical plan and starting formation for an upcoming match.

**Pre-condition:** The opponent team exists in the database with historical data/matches available for analysis.

**Flow (Data-Fed Agent Architecture):**

1. Coach views an upcoming match widget on the Dashboard and clicks "Start Analysis" for the upcoming opponent.
2. **Deterministic Fetching:** Backend executes predefined SQL queries against statistical tables (`team_scoring_profile`, `match_lineups`, `player_performance_mart`, etc.) to pull raw opponent stats as a JSON payload.
3. **LLM Transformation:** The raw JSON payload is fed directly to the AI Agent (avoiding risky Text-to-SQL logic). The Agent is prompted to synthesize weaknesses, identify danger men, and suggest formations/shifts based purely on the provided data.
4. System maps out the recommended starting formation and "suggested shifts" (e.g., "Shift to 5-back at 60' due to opponent's late-game scoring patterns").
5. Coach reviews the dynamic formation and tactical shifts in the "Formations & Opponent Analysis" view.

**UI Sections (Formations & Opponent Analysis View):**

* **Match Header:** Upcoming opponent, date, competition.
* **Dynamic Formation:** Visual pitch displaying the recommended starting XI and their tactical roles.
* **Opponent Key Insights:** Bulleted list of the opponent's most frequent attacking patterns and defensive vulnerabilities.
* **Suggested Shifts:** Timeline or scenario-based tactical adjustments (e.g., "If leading at 60', shift to 5-4-1").

---

## **7\. Data Model Strategy (Dual-Database)**

The platform employs a strict separation between quantitative statistical data and qualitative AI-generated data. This ensures the "Data-Fed Agent" can query deterministic facts without complex transformations.

### **1. Analytics Tables (Read-Only / External Source of Truth)**

These ~14 tables contain structured statistical data and are **never mutated** by the CoachAI application layer. They provide the quantitative backbone for the Dashboard charts and Pre-Match Analysis.

* `upcoming_fixtures`
* `squad_availability`
* `player_performance_mart`
* `match_team_performance`
* `ref_leagues`
* `match_summary`
* `team_performance_summary`
* `leaderboards`
* `player_season_summary`
* `match_events`
* `match_lineups`
* `team_scoring_profile`
* `team_discipline_profile`
* `ref_teams`

### **2. Application Tables (Read/Write / CoachAI State)**

These tables are owned by the CoachAI platform. They are actively written to by the Async Pipeline (Modal) and store the AI-extracted qualitative insights, team memories, and app state. *(Note: The number of application tables will increase as new platform features are developed based on needs).*

* `matches` (The pipeline execution record and metadata)
* `tactical_phases` (The AI-generated insights, timestamps, and tactical descriptions)

---

## **8\. Non-Functional Requirements**

| Category          | Requirement                                     |
| ----------------- | ----------------------------------------------- |
| Video Processing  | 10-min clip processed within 3-5 minutes        |
| Dashboard Load    | Renders within 2-3 seconds                      |
| AI Coach Response | Generated within 5-10 seconds                   |
| Onboarding        | Core features navigable in under 15 minutes     |
| Data Model        | Schema supports new metrics without refactoring |

---

## **9\. Out of Scope (V1)**

* Real-time analysis
* Mobile app
* Public player database
* Biometric / wearable data integration
* Multi-coach team collaboration (V2)
* Multi-language

---

This is the living document. Every decision we make updates it.
