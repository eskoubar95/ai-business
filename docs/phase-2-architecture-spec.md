# Phase 2 — Architecture Specification

**Dato:** 30. april 2026  
**Kilde:** Grill-Me session (17 beslutninger)  
**Scope:** Cursor SDK-integration, database-skemaændringer, agent-konfigurationsmodel, tasks, skills, webhooks og UX-flow

---

## Oversigt

Phase 2 transformerer platformen fra en funktionel prototype til et brugbart AI-orchestration-system. Kerneopgaverne er:

1. **Cursor SDK-integration** — agenter kan faktisk køre via `@cursor/sdk`
2. **Heartbeat-system** — agenter har en defineret arbejdscyklus
3. **Database-skemaændringer** — 6 nye/ændrede tabeller
4. **UX-redesign** — business-selector, nav, dashboard, agent-konfiguration
5. **Tasks-system** — erstat/suppler approvals med et fuldt task-hierarki

---

## 1. Cursor SDK — Eksekveringsmodel

### Model: Local execution via `@cursor/sdk`

```typescript
import { Agent } from "@cursor/sdk";

const agent = await Agent.create({
  apiKey: userSettings.cursorApiKey, // fra userSettings-tabel
  model: { id: "composer-2" },
  local: { cwd: business.localPath }, // lokal sti fra business-konfiguration
});

const run = await agent.send(heartbeatPrompt);

for await (const event of run.stream()) {
  // log til orchestration_events
}
```

**Fremtidigt:** Samme SDK understøtter cloud execution (`cloud: { repos: [...] }`) og self-hosted workers. Arkitekturen er den samme — kun execution target skifter.

### GitHub-authentication

**MVP:** Arv lokal maskines credentials. Agenter kører lokalt og arver automatisk:

- `git` credentials fra maskinen
- GitHub MCP fra `.cursor/mcp.json`
- `gh` CLI authentication

**Fase 3 (cloud-support):** GitHub PAT gemmes krypteret per business i databasen og injiceres som `GITHUB_TOKEN`.

---

## 2. Database-skemaændringer

### 2.1 `businesses` — tilføj felter

```sql
ALTER TABLE businesses ADD COLUMN description text;
ALTER TABLE businesses ADD COLUMN github_repo_url text;       -- fx https://github.com/org/repo
ALTER TABLE businesses ADD COLUMN local_path text;            -- fx C:\Users\Nicklas\Github\mercflow
```

`github_repo_url` og `local_path` er nullable — de sættes i settings, ikke nødvendigvis under onboarding.

---

### 2.2 `user_settings` — ny tabel

Holder bruger-niveau konfiguration. Cursor API-nøgle er den primære use case.

```sql
CREATE TABLE user_settings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text NOT NULL UNIQUE,
  cursor_api_key_encrypted  jsonb,   -- AES-krypteret, samme mønster som mcp_credentials
  cursor_api_key_iv         text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

**Rationale:** Cursor API-nøglen er knyttet til én Cursor-konto, ikke til et projekt. Sættes én gang, bruges på tværs af alle businesses.

---

### 2.3 `agent_documents` — ny tabel (erstatter `instructions`-kolonnen)

En agent har et fil-træ af markdown-dokumenter. Tre standard-filer oprettes automatisk ved agent-oprettelse.

```sql
CREATE TABLE agent_documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id    uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  slug        text NOT NULL,      -- 'soul', 'tools', 'heartbeat' (eller brugerdefineret)
  filename    text NOT NULL,      -- 'soul.md', 'tools.md', 'heartbeat.md'
  content     text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, slug)
);
```

**Standard-filer per ny agent:**


| Slug        | Filename       | Formål                                                   |
| ----------- | -------------- | -------------------------------------------------------- |
| `soul`      | `soul.md`      | Hvem er agenten. Identitet, værdier, arbejdsprincipper.  |
| `tools`     | `tools.md`     | Hvad kan agenten. MCPs, skills, kommandoer den må bruge. |
| `heartbeat` | `heartbeat.md` | Hvordan arbejder agenten. Template for heartbeat-prompt. |


`instructions`-kolonnen på `agents`-tabellen **deprecates** og fjernes i denne migration.

---

### 2.4 `tasks` — ny tabel

```sql
CREATE TYPE task_status AS ENUM (
  'backlog', 'in_progress', 'blocked', 'in_review', 'done'
);

CREATE TABLE tasks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  team_id         uuid REFERENCES teams(id) ON DELETE SET NULL,
  agent_id        uuid REFERENCES agents(id) ON DELETE SET NULL,
  parent_task_id  uuid REFERENCES tasks(id) ON DELETE SET NULL,
  title           text NOT NULL,
  description     text NOT NULL DEFAULT '',   -- markdown
  status          task_status NOT NULL DEFAULT 'backlog',
  blocked_reason  text,
  approval_id     uuid REFERENCES approvals(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tasks_business_id_idx ON tasks(business_id);
CREATE INDEX tasks_agent_id_idx ON tasks(agent_id);
CREATE INDEX tasks_team_id_idx ON tasks(team_id);
CREATE INDEX tasks_parent_task_id_idx ON tasks(parent_task_id);
CREATE INDEX tasks_status_idx ON tasks(status);
```

**Ejerskab:** Task oprettes altid på business-niveau. `team_id` og `agent_id` er begge nullable og uafhængige. En task kan have:

- Ingen tilknytning (ren backlog)
- Kun team (delegeres af lead-agent)
- Kun agent (direkte tildeling)
- Begge (agent i et bestemt team)

**Hierarki:** `parent_task_id` muliggør at en lead-agents heartbeat bryder en opgave ned i sub-tasks der distribueres til team-members.

---

### 2.5 `task_logs` — ny tabel

Aktivitetsfeed per task. Viser agent-opdateringer og menneskelige kommentarer i kronologisk rækkefølge.

```sql
CREATE TYPE task_log_author_type AS ENUM ('agent', 'human');

CREATE TABLE task_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_type  task_log_author_type NOT NULL,
  author_id    text NOT NULL,    -- agentId (uuid som text) eller userId
  content      text NOT NULL,    -- markdown
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX task_logs_task_id_idx ON task_logs(task_id);
```

`**@agent`-mention mekanik:** Når en human skriver en kommentar der indeholder `@<agentNavn>`, registreres det som en **soft heartbeat trigger** — agenten vækkes og modtager opgaven med log-tråden som ekstra kontekst.

---

### 2.6 `skill_files` — ny tabel (erstatter `markdown`-kolonnen på `skills`)

En skill er en mappe, ikke én fil. Indeholder `SKILL.md` + evt. `reference/`-undermapper og scripts.

```sql
CREATE TABLE skill_files (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id   uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  path       text NOT NULL,      -- fx 'SKILL.md', 'reference/adapt.md', 'scripts/search.py'
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (skill_id, path)
);

CREATE INDEX skill_files_skill_id_idx ON skill_files(skill_id);
```

`markdown`-kolonnen på `skills`-tabellen **deprecates** og fjernes.

---

### 2.7 MCP credentials — flyt fra agent til business

**Nuværende:** `mcp_credentials.agent_id` — credentials er per agent.  
**Ny model:** Credentials er per business (bibliotek). Agenter opt-in via junction-tabel.

```sql
-- Ændr eksisterende tabel:
ALTER TABLE mcp_credentials DROP COLUMN agent_id;
ALTER TABLE mcp_credentials ADD COLUMN business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE;

-- Ny junction-tabel:
CREATE TABLE agent_mcp_access (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id            uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  mcp_credential_id   uuid NOT NULL REFERENCES mcp_credentials(id) ON DELETE CASCADE,
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, mcp_credential_id)
);
```

**Rationale:** MCP-credentials (Neon, GitHub, Notion, osv.) sættes op én gang per business under Settings. Agenter aktiveres individuelt for de MCPs de har brug for. Mere sikkert og nemmere at administrere.

---

### 2.8 `agent_archetypes` — ny tabel (platform-managed)

Platform-definerede presets der injicerer specialiseret domæneviden i agenter. Toggleable per agent.

```sql
CREATE TABLE agent_archetypes (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                 text NOT NULL UNIQUE,   -- fx 'vertical-fullstack', 'harness-engineer'
  name                 text NOT NULL,
  description          text NOT NULL,
  soul_addendum        text NOT NULL DEFAULT '',        -- injiceres i soul-kontekst
  tools_addendum       text NOT NULL DEFAULT '',        -- injiceres i tools-kontekst
  heartbeat_addendum   text NOT NULL DEFAULT '',        -- injiceres i heartbeat-prompt
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- Agenter kan have én arketype (nullable):
ALTER TABLE agents ADD COLUMN archetype_id uuid REFERENCES agent_archetypes(id) ON DELETE SET NULL;
```

**Launch-presets:**


| Slug                 | Navn                          | Kerneprincipper                                                                                                                |
| -------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `vertical-fullstack` | Vertical Full Stack Developer | Tager en feature fra top til bund i ét kontekstvindue. Frontend og backend er ét problem.                                      |
| `harness-engineer`   | Harness Engineer              | Optimeret til small context windows. Ved hvornår ny session skal startes. Smart zone-bevidst. Skriver tests på kritiske paths. |


---

## 3. Heartbeat-system

### 3.1 Definition

En "heartbeat" er det signal der vækker en agent fra dvale og sætter den i arbejde.

**Fire trigger-typer:**


| Type            | Mekanik                                                         |
| --------------- | --------------------------------------------------------------- |
| **Task-status** | Task skifter til `unblocked` eller ny task assignes til agenten |
| **@mention**    | Human skriver `@agentNavn` i en task log-kommentar              |
| **Manuel**      | Bruger klikker "Run Heartbeat" i UI'en                          |
| **Scheduled**   | Cron-baseret rutine (konfigureres per agent)                    |


Alle trigger-typer skriver en event til `orchestration_events`-tabellen. En worker poller tabellen og kalder `@cursor/sdk`.

### 3.2 Heartbeat-prompt opbygning

Platformen sammensætter prompten dynamisk ved heartbeat-tidspunktet:

```
[Agent soul.md]
[Agent heartbeat.md template]
[Archetype addendum hvis sat]

--- KONTEKST (runtime-injiceret) ---
Business: [business navn + soul markdown]
Åbne tasks: [liste over in_progress/unblocked tasks med titel + beskrivelse]
Nylige log-entries: [seneste 5 entries fra relevante task logs]
Pending approvals: [tasks der afventer human approval]
```

**Smart zone-princip:** Platformen injicerer KUN hvad der er relevant for den aktuelle heartbeat. Historiske data, fulde chat-logs og irrelevante business-kontekster holdes ude af kontekstvinduet.

### 3.3 Token tracking

`@cursor/sdk` returnerer token-forbrug per run. Gemmes i `orchestration_events.payload`:

```json
{
  "agentId": "...",
  "trigger": "manual | task_status | mention | cron",
  "tokensIn": 4821,
  "tokensOut": 1203,
  "model": "composer-2",
  "durationMs": 45200
}
```

---

## 4. Skills-installation

**To installationsmetoder til MVP:**

### Upload

Brugeren uploader en zip-fil eller individuelle filer. Platformen udpakker og gemmer i `skills` + `skill_files`.

### GitHub-link

Brugeren indsætter en GitHub-URL til en mappe:

```
https://github.com/nicklaseskou/skills/tree/main/postgres-drizzle
```

Platformen fetcher mappeindholdet rekursivt via GitHub API (arver lokal `gh`-auth) og gemmer fil for fil i `skill_files`.

**Fase 3:** NPX install fra skills.sh (`npx skills add <navn>`).

---

## 5. Webhooks — Indgående

**MVP: Kun indgående webhooks.**

Udgående notifikationer håndteres allerede af MCP-servere (Slack MCP, GitHub MCP, osv.).

```
POST /api/webhooks/[businessId]/receive
```

**Krav:**

- HMAC-signatur-verificering (secret per business)
- Idempotency-key i header (`X-Idempotency-Key`)
- Event skrives til `orchestration_events` → trigger heartbeat på relevant agent
- Response < 200ms (HTTP 202 Accepted, async processing)

**Filtering:** En webhook-endpoint kan konfigureres med event-type filtrering — kun bestemte event-typer trigger heartbeat.

---

## 6. Grill-Me — Onboarding-flow

### To indgangsveje

**Sti A: Eksisterende business**
Brugeren har et produkt der allerede kører og vil effektivisere med AI-agenter. Grill-Me fokuserer på: nuværende stack, eksisterende workflows, bottlenecks, hvad de vil automatisere.

**Sti B: Nyt projekt**
Brugeren starter et nyt projekt AI-first. Grill-Me fokuserer på: hvad de vil bygge, målgruppe, teknologivalg, MVP-scope.

### Output: Business Soul Markdown

Sessionen producerer et `memory`-dokument på business-niveau med sektionerne:

```markdown
# [Business navn] — Soul

## Hvad vi bygger
## Vores mål lige nu
## Arbejdsmetode & værdier
## Teknisk kontekst
## Hvad vi IKKE gør
## Åbne spørgsmål
```

**Prompt-base:** Matt Pococks Grill-Me-prompt, justeret til business-onboarding-kontekst med de to stier.

---

## 7. Settings-arkitektur

### Hvad hører til Settings (ikke onboarding):


| Setting                      | Niveau   | Tabel                               |
| ---------------------------- | -------- | ----------------------------------- |
| Cursor API-nøgle             | Bruger   | `user_settings`                     |
| GitHub lokal sti per projekt | Business | `businesses.local_path`             |
| MCP credentials-bibliotek    | Business | `mcp_credentials` (businessId)      |
| Webhook secrets              | Business | ny `webhook_configs`-tabel (fase 3) |


### Hvad hører til Onboarding:

- Business navn
- Business type (eksisterende / nyt)
- GitHub repo URL
- Grill-Me session → soul markdown

---

## 8. Prioriteret implementeringsplan

### Sprint 1 — Fundament (blokerende)

- Database-migration: `user_settings`, `agent_documents`, `tasks`, `task_logs`, `skill_files`, ændring af `mcp_credentials`
- `agents.instructions` → `agent_documents` migration
- `skills.markdown` → `skill_files` migration
- Business-selector → `<select>` dropdown (P0 UX)
- Nav aktiv state (P0 UX)
- Settings-side: Cursor API-nøgle + lokal sti

### Sprint 2 — Heartbeat MVP

- `@cursor/sdk` installeres og konfigureres
- Server action: `runHeartbeat(agentId)` — bygger prompt + kalder SDK
- Manuel "Run Heartbeat"-knap på agent-siden
- Token-logging i `orchestration_events`
- Agent-konfiguration: tre tabs (Soul / Tools / Heartbeat)

### Sprint 3 — Tasks + Approvals

- Tasks CRUD (opret, vis, opdater status)
- Task log-feed med kommentarer
- `@mention` → soft heartbeat trigger
- Task → approval link (in_review status)
- Tasks-visning på dashboard

### Sprint 4 — Skills + Webhooks

- Skills: upload-flow + GitHub-link-flow
- Indgående webhook endpoint med HMAC-verificering
- Webhook → heartbeat trigger
- MCP credentials: flyt til business settings + agent opt-in UI

### Sprint 5 — Polish + Arketype-presets

- Agent arketype-presets (Vertical Full Stack + Harness Engineer)
- Grill-Me: to-sti onboarding + opdateret prompt
- Brand accent-farve + UI-polish (fra UI/UX-rapporten)
- Cron-baseret heartbeat

---

## 9. Skemaoversigt — ændringer samlet


| Tabel              | Handling                      | Nøgleændring                                   |
| ------------------ | ----------------------------- | ---------------------------------------------- |
| `businesses`       | Tilføj kolonner               | `description`, `github_repo_url`, `local_path` |
| `user_settings`    | Ny                            | Cursor API-nøgle (krypteret) per bruger        |
| `agents`           | Tilføj kolonne, fjern kolonne | Tilføj `archetype_id`, fjern `instructions`    |
| `agent_documents`  | Ny                            | Fil-træ: soul/tools/heartbeat per agent        |
| `agent_archetypes` | Ny                            | Platform-definerede presets                    |
| `tasks`            | Ny                            | Business-niveau med hierarki og status-flow    |
| `task_logs`        | Ny                            | Aktivitetsfeed per task                        |
| `skill_files`      | Ny                            | Fil-træ per skill                              |
| `skills`           | Fjern kolonne                 | Fjern `markdown`                               |
| `mcp_credentials`  | Ændr FK                       | Fra `agent_id` til `business_id`               |
| `agent_mcp_access` | Ny                            | Junction: agent ↔ mcp opt-in                   |


---

*Spec genereret på baggrund af 17-spørgsmåls grill-me session, 30. april 2026.*  
*Se `docs/phase-2-ui-ux-review.md` for UI/UX-beslutninger der supplerer denne spec.*