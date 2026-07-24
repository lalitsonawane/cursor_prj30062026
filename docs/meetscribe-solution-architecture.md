# MeetScribe — Solution Architecture

**Product:** MeetScribe  
**Purpose:** Capture Microsoft Teams meeting conversations and notes, then produce a detailed Minutes of Meeting (MoM) with participant-specific action items.  
**Audience:** Solution architects, product owners, engineering leads, and Microsoft 365 admins evaluating build vs buy.

---

## 1. Product vision

MeetScribe turns every eligible Teams meeting into a trustworthy, searchable record of decisions and work — without asking people to take notes by hand.

**One-line promise:** *After a Teams meeting ends, every participant gets a clear MoM and only the action items that apply to them.*

**Problems solved**

| Pain | Today | With MeetScribe |
| --- | --- | --- |
| Notes are incomplete or biased | One person scribbles; others forget | Speaker-attributed transcript → structured MoM |
| Action items vanish in chat | Buried in meeting chat / email | Owned, dated, tracked tasks per person |
| Follow-up is manual | Organizer writes and chases | Auto-draft MoM, review loop, push to Planner / To Do / Jira |
| Knowledge is siloed | Recording sits in Stream unused | Searchable meeting memory with retention controls |

---

## 2. Personas and jobs-to-be-done

| Persona | Primary job |
| --- | --- |
| **Meeting organizer** | Leave the call knowing decisions and owners are captured |
| **Participant / assignee** | See only my actions, due dates, and context |
| **Program / project manager** | Track open actions across many meetings |
| **Team lead / exec** | Skim decisions and risks without watching the recording |
| **M365 / security admin** | Control consent, retention, residency, and audit |

---

## 3. Product principles

1. **Teams-native first** — Live inside Outlook calendar, Teams meeting stage, and Teams chat; avoid a separate “go login elsewhere” habit for core flows.
2. **Human-in-the-loop by default** — AI drafts; organizer (or delegated scribe) publishes.
3. **Attribution with privacy** — Prefer speaker-attributed transcripts when tenant policy allows; degrade gracefully when it does not.
4. **Least privilege** — Scope Graph access per tenant policy; never retain audio longer than required for transcription quality.
5. **Actionable output** — MoM without owners/dates is incomplete; action items are first-class entities.

---

## 4. Capability map

### 4.1 Capture

- Subscribe to Teams online meeting lifecycle (scheduled + channel meetings).
- Prefer **Microsoft Teams built-in transcription / recording** via Microsoft Graph (no custom media bot required for MVP).
- Optional **in-meeting notes** capture: chat messages, shared whiteboard text (where licensed), organizer “pinned decisions” via bot adaptive card.
- Optional **live assist** (phase 2): meeting bot that posts “decision captured” confirmations mid-call.

### 4.2 Understand

- Normalize transcript (VTT → utterances with speaker, timestamp, confidence).
- Enrich with calendar metadata: title, agenda, attendees, optional docs from invite.
- LLM pipeline: summarize, extract decisions, risks, open questions, and action items with assignee resolution against Graph users.

### 4.3 Produce MoM

- Structured MoM document (JSON schema → Word / OneNote / Loop / PDF / Teams Adaptive Card).
- Sections: attendees, purpose, discussion highlights, decisions, action items, parking lot, next meeting.
- Confidence flags on low-certainty extractions for reviewer focus.

### 4.4 Distribute & track

- Post MoM to meeting chat + organizer mailbox + SharePoint/OneDrive folder.
- Create / update tasks in Microsoft Planner, Microsoft To Do, or external trackers (Jira, Azure DevOps, Linear, Asana) via connectors.
- Personal digests: “Your action items from today’s meetings.”
- Reminder / SLA nudges before due dates.

### 4.5 Govern

- Tenant onboarding, admin consent, application access policy guidance.
- Retention, eDiscovery-friendly export, audit log, DLP hooks, regional data residency options.

---

## 5. High-level architecture

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                         Microsoft 365 Tenant                             │
│  Teams Meetings │ Calendar │ Chat │ Stream/OneDrive │ Planner/To Do     │
└─────────────┬───────────────────────┬───────────────────┬────────────────┘
              │ Graph webhooks / API  │ Graph tasks/files │ Bot Framework
              ▼                       ▼                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        MeetScribe Control Plane                          │
│  Tenant registry │ Auth (Entra ID) │ Policy │ Billing │ Admin console    │
└─────────────┬────────────────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         MeetScribe Data Plane                            │
│                                                                          │
│  Ingest ──► Normalize ──► AI MoM Engine ──► Review API ──► Publish       │
│    │            │              │                │             │          │
│    │            │              │                │             ├─ MoM docs │
│    │            │              │                │             ├─ Tasks    │
│    │            │              │                │             └─ Notify   │
│    ▼            ▼              ▼                ▼                        │
│  Object store   Transcript DB   Prompt/model    Draft MoM store          │
│  (encrypted)    + embeddings    gateway         + audit events           │
└──────────────────────────────────────────────────────────────────────────┘
```

### Logical services

| Service | Responsibility |
| --- | --- |
| **Meeting Ingress** | Graph change notifications for transcripts/recordings; calendar sync |
| **Media & Transcript Worker** | Download transcript/recording content; store encrypted blobs; parse VTT |
| **Identity Resolver** | Map speaker labels / emails to Entra users and guest identities |
| **MoM Orchestrator** | Durable workflow: ingest → extract → draft → review → publish |
| **AI Gateway** | Prompt templates, model routing, PII redaction hooks, cost/latency limits |
| **Review & Edit API** | Organizer UI / Teams task module for approve-edit-publish |
| **Action Item Service** | CRUD, ownership, due dates, status sync with task systems |
| **Publisher** | Chat posts, email, SharePoint, Planner/To Do, webhooks |
| **Search Index** | Meeting memory search (ACL-aware) |
| **Admin & Compliance** | Retention jobs, audit export, tenant settings |

---

## 6. End-to-end meeting flow

```text
Before meeting
  Organizer enables MeetScribe on series/meeting (or tenant auto-policy)
  Bot / tab confirms transcription policy OK
  Optional: attach agenda + pre-reads

During meeting
  Teams records/transcribes per tenant meeting policy
  Optional: participants mark “decision” / “action” via bot message
  Chat messages tagged as notes are queued

Meeting ends
  Graph fires transcript/recording available notification
  Ingress validates meeting is in scope + consent present
  Worker fetches transcript (prefer text/vtt with speaker tags)
  Orchestrator starts durable MoM job

Generation (minutes, not hours)
  Chunk transcript by time / topic boundaries
  Extract: topics, decisions, actions, owners, due dates, risks
  Resolve owners against attendee list (fuzzy match + confirmation)
  Compose draft MoM + per-participant action pack
  Store draft; notify organizer in Teams

Review
  Organizer opens Adaptive Card / Task Module
  Edit owners, due dates, wording; drop false positives
  Approve → Publish

After publish
  MoM posted to meeting chat + saved to configured library
  Tasks created for assignees
  Assignees receive personal Adaptive Card / email digest
  Status sync keeps MeetScribe and Planner (etc.) aligned
```

**Target SLA (MVP):** Draft MoM available within **5 minutes** of transcript availability for meetings ≤ 60 minutes.

---

## 7. Microsoft Graph integration design

### 7.1 Preferred capture strategy (MVP)

Use **native Teams transcription** and Graph APIs rather than a custom Calling Bot that joins the call. Reasons: lower media complexity, better tenant policy alignment, fewer compliance objections, faster time-to-value.

Key Graph surfaces:

- Online meeting metadata: `/users/{id}/onlineMeetings/{id}`
- List / get transcripts: `.../transcripts`, `.../transcripts/{id}/content`
- List / get recordings: `.../recordings`, `.../recordings/{id}/content`
- Change notifications (webhooks) for transcript/recording created events where supported; otherwise poll after calendar end + buffer
- Users, calendar, chat messages for context and distribution
- Planner / To Do APIs for task creation (or Graph Tasks where applicable)

### 7.2 Permissions (illustrative least set)

**Delegated (early pilots / user-install):**

- `OnlineMeetings.Read`
- `OnlineMeetingTranscript.Read.All`
- `OnlineMeetingRecording.Read.All` (if audio/video reprocess needed)
- `Chat.Read` / `ChatMessage.Send` (notes + posting MoM)
- `Calendars.Read`
- `User.Read`
- `Tasks.ReadWrite` / Planner scopes as needed

**Application (tenant-wide production):**

- `OnlineMeetings.Read.All`
- `OnlineMeetingTranscript.Read.All`
- `OnlineMeetingRecording.Read.All`
- Chat / Channel message send as app or via RSC
- Files / Sites write for MoM library (scoped)

**Admin prerequisite:** For app-only transcript access, tenant admins typically must create and grant a **CsApplicationAccessPolicy** to authorized users/organizers. MeetScribe’s admin setup wizard must document and (where possible) validate this.

### 7.3 Fallback / advanced capture (phase 2+)

- **Teams Media Bot** joins as participant for live captions when native transcript is disabled.
- Store short-lived encrypted audio only if re-transcription quality requires it; default delete after successful MoM publish.

---

## 8. AI MoM engine

### 8.1 MoM canonical schema

```json
{
  "meetingId": "string",
  "title": "string",
  "start": "ISO-8601",
  "end": "ISO-8601",
  "organizer": { "id": "aad-oid", "displayName": "", "email": "" },
  "attendees": [],
  "purpose": "string",
  "agendaCoverage": [{ "item": "", "covered": true, "notes": "" }],
  "discussionHighlights": [{ "topic": "", "summary": "", "timestamps": [] }],
  "decisions": [{ "text": "", "owners": [], "evidenceUtteranceIds": [] }],
  "actionItems": [{
    "id": "uuid",
    "text": "",
    "assignee": { "id": "", "displayName": "", "email": "", "confidence": 0.0 },
    "dueDate": "YYYY-MM-DD|null",
    "priority": "low|medium|high",
    "status": "proposed|approved|synced|done|cancelled",
    "evidenceUtteranceIds": []
  }],
  "openQuestions": [],
  "risks": [],
  "parkingLot": [],
  "nextMeeting": { "proposed": "", "owners": [] },
  "reviewState": "draft|in_review|published",
  "modelMeta": { "promptVersion": "", "model": "", "generatedAt": "" }
}
```

### 8.2 Extraction pipeline

1. **Preprocess** — Speaker diarization labels, language detect, PII scrubbing (optional tenant policy).
2. **Segment** — Topic segmentation (embedding + LLM boundary pass).
3. **Extract (structured output)** — Force JSON schema; require evidence utterance IDs for decisions/actions.
4. **Resolve people** — Match “Alex”, “finance team”, “@Priya” to attendee directory; leave unresolved for human pick-list.
5. **Quality gate** — Drop actions below confidence threshold into “needs review”; block publish if critical fields empty.
6. **Personalize** — Generate per-participant packs: *your decisions you own*, *your actions*, *optional FYI summary*.

### 8.3 Prompt / model guidance

- Use a strong reasoning model for extraction; cheaper model for final prose polish.
- Temperature low for structured extract; cite transcript spans to reduce hallucination.
- Tenant-configurable glossary (product names, acronyms) improves accuracy.
- Support multi-language meetings: detect per segment; MoM language = organizer preference.

---

## 9. Experience surfaces

| Surface | Role |
| --- | --- |
| **Teams personal app + meeting tab** | Configure meeting, review draft, browse history |
| **Bot (1:1 and meeting chat)** | Notifications, Adaptive Card approve/edit, personal action digests |
| **Outlook add-in (optional)** | Enable MeetScribe from calendar event |
| **Web admin portal** | Tenant settings, retention, connectors, cost/usage |
| **Web review UI** | Richer editing than Adaptive Cards for long MoMs |

**Organizer review card (minimum fields):** title, decisions list, action table (assignee, due date, edit/remove), Publish / Request changes / Discard.

---

## 10. Action item lifecycle

```text
proposed (AI) → approved (human) → synced (task system) → in_progress → done
                                      ↘ cancelled / deferred
```

Rules:

- Assignees only receive items marked **approved** (or auto-approved under tenant policy for trusted series).
- Each action stores provenance: meeting link, transcript timestamps, MoM paragraph.
- Status sync is bidirectional where the target system allows (Planner ↔ MeetScribe).
- Escalation: overdue items notify assignee + organizer after configurable SLA.

---

## 11. Data model (core entities)

- `Tenant` — Entra tenant id, plan, policies, connectors
- `MeetingBinding` — Graph onlineMeeting id, series master, capture mode
- `Artifact` — transcript / recording blob refs, checksum, retention
- `Utterance` — speaker, start/end, text
- `MomDocument` — versions (draft, published), schema payload
- `ActionItem` — ownership, due date, external task ids
- `ConsentEvent` / `AuditEvent` — who enabled, who published, who accessed
- `Delivery` — chat/email/task publish receipts

Storage recommendation:

- **Postgres** (or Cosmos + relational) for entities and workflow state  
- **Object storage** for transcripts/recordings (CMEK where required)  
- **Vector index** for meeting search (ACL filtered)  
- **Durable workflow** (e.g. Temporal / Azure Durable Functions / Vercel Workflow) for MoM orchestration

---

## 12. Security, privacy, and compliance

| Control | Approach |
| --- | --- |
| AuthN/Z | Entra ID OAuth2/OIDC; app + delegated; Teams SSO |
| Secrets | Managed identity / Key Vault; no long-lived secrets in code |
| Encryption | TLS in transit; AES-256 at rest; optional customer-managed keys |
| Access | MoM ACL mirrors meeting attendees + explicit shares; search respects ACL |
| Retention | Configurable (e.g. 30/90/365 days); hard delete of media after MoM optional |
| Audit | Immutable log of ingest, generate, edit, publish, export |
| DLP | Optional Microsoft Purview labels on exported Word/PDF; block external publish |
| Residency | Deploy regional (EU / US / APAC) processing + storage |
| AI policy | No training on customer data by default; prompt/response logging redacted |
| Guest users | Include in MoM distribution only if organizer policy allows |

Legal note for product packaging: disclose that meeting recording/transcription must already be allowed by tenant Teams meeting policies and local consent laws; MeetScribe should surface a pre-meeting consent banner where required.

---

## 13. Deployment topology

**SaaS multi-tenant (default)**

- Control plane + regional data planes
- Per-tenant isolation via tenant_id row security + separate storage prefixes
- Hosted on Azure (natural Graph proximity) or hybrid: Azure for Graph workers + Vercel/Node for web/API

**Single-tenant / private cloud (enterprise SKU)**

- Customer subscription deployment
- Private endpoints to Graph and storage
- Customer-managed keys and VNet integration

**Recommended MVP stack (pragmatic)**

| Layer | Choice |
| --- | --- |
| App registration | Entra ID multi-tenant app |
| Teams app | Bot + Tab + Message extensions |
| API | Node/TypeScript or .NET on Azure Functions / App Service |
| Workflow | Azure Durable Functions or equivalent |
| DB | Azure PostgreSQL Flexible Server |
| Blobs | Azure Blob Storage |
| AI | Azure OpenAI / AI Foundry (tenant data zone) |
| Tasks | Planner + To Do first; Jira connector next |
| Observability | OpenTelemetry → App Insights |

---

## 14. Phased delivery

### Phase 0 — Foundation

- Entra app, Teams app skeleton, tenant install + admin consent checklist
- Transcript pull for a single organizer pilot
- Manual MoM draft in Teams Adaptive Card (no task sync)

### Phase 1 — MVP (sellable)

- Webhook/poll ingest for scheduled meetings
- Full MoM schema + organizer review/publish
- Post to meeting chat + email PDF/Word
- Action items → Microsoft Planner / To Do
- Personal assignee cards
- Basic admin: retention, enable/disable per team, audit export

### Phase 2 — Scale & quality

- Channel meetings, recurring series defaults
- Glossary / custom vocab; multi-language MoM
- Bidirectional task sync; reminders
- Meeting memory search
- Outlook enablement; SharePoint MoM library templates

### Phase 3 — Differentiation

- Live mid-meeting decision capture bot
- CRM / ITSM connectors (Dynamics, ServiceNow)
- Program rollups (“all open actions for Project X”)
- Quality analytics (hallucination rate, edit distance, time-to-publish)
- Private cloud SKU

---

## 15. Non-functional targets (MVP)

| Attribute | Target |
| --- | --- |
| Draft latency | ≤ 5 min after transcript ready (≤ 60 min meeting) |
| Extraction precision (actions) | ≥ 85% accepted without edit in pilot |
| Availability | 99.9% control/data plane |
| Supported meeting size | Up to 250 attendees metadata; transcript processing up to ~3 hours |
| Concurrency | Horizontal workers; queue-backed ingest |

---

## 16. Success metrics

- % of enabled meetings with published MoM within 24h  
- Median time transcript-ready → published  
- Action item acceptance rate (approved / proposed)  
- % actions completed by due date  
- Organizer edit distance (lower = better extraction)  
- Weekly active organizers / tenants  
- Support tickets related to Graph permissions (lower via better setup wizard)

---

## 17. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Graph app-only access blocked without access policy | Setup wizard + PowerShell scripts + health check |
| Speaker attribution disabled by tenant | Unattributed extract + attendee pick-lists; clarity in UI |
| Hallucinated owners/dates | Evidence spans + confidence gates + mandatory review default |
| Recording retention / privacy concerns | Prefer transcript-only mode; short media TTL; CMEK |
| Long meetings blow token limits | Hierarchical summarize-then-extract; map-reduce by segment |
| Guests / external tenants | Explicit sharing policy; watermarked exports |
| Competing Microsoft Copilot features | Differentiate on **action lifecycle**, multi-tracker sync, review workflow, and cross-meeting program views |

---

## 18. Competitive positioning

MeetScribe is not “another summary bot.” Positioning:

1. **Governed MoM object** with versioning and audit — not a disposable chat reply.  
2. **Participant-applicable actions** as the primary artifact, with sync into work systems.  
3. **Organizer-grade review UX** that makes publishing safe for regulated teams.  
4. **Works with Teams native transcripts** first — lower friction than media bots.

---

## 19. Open decisions for product/engineering

1. Transcript-only MVP vs also store recordings for re-ASR quality.  
2. Auto-publish for low-risk internal series vs always-review.  
3. Primary task system of record: Planner vs To Do vs customer Jira.  
4. MoM canonical file format for SharePoint: Loop vs Word vs Markdown.  
5. Whether live bot assist is worth Phase 2 given Copilot overlap.  
6. Pricing: per organizer seat vs per meeting hour processed.

---

## 20. Recommended next build steps

1. Validate Graph transcript access in a pilot tenant (delegated + app-only with access policy).  
2. Define MoM JSON schema as the contract between AI and clients.  
3. Build durable “meeting ended → draft ready” workflow with one happy-path Teams Adaptive Card.  
4. Instrument edit analytics from day one (feeds model quality).  
5. Package Teams app + admin setup runbook before widening the pilot.

---

## Appendix A — Example published MoM outline

1. **Meeting:** Q3 Launch Sync — 24 Jul 2026, 10:00–10:45 IST  
2. **Attendees:** … (present / absent)  
3. **Purpose:** Align launch blockers and owners  
4. **Decisions:** Pricing freeze until Aug 5; Beta cohort capped at 50  
5. **Action items**

   | Action | Owner | Due | Source |
   | --- | --- | --- | --- |
   | Finalize FAQ for support | Priya N. | 28 Jul | 00:18:42 |
   | Confirm Azure quota increase | Alex R. | 25 Jul | 00:31:10 |

6. **Open questions / risks**  
7. **Next meeting**

## Appendix B — Glossary

| Term | Meaning |
| --- | --- |
| MoM | Minutes of Meeting |
| Graph | Microsoft Graph API |
| RSC | Resource-specific consent (Teams) |
| Utterance | Timestamped spoken unit in a transcript |
| Application access policy | Teams policy authorizing an app to access online meeting artifacts for a user |
