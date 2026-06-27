---
date: 2026-06-27T00:00:00+0300
author: Pi
commit: 477b540
branch: main
repository: Opus
topic: "Entity Ledger, Context Resolution, Arabic NLP Stability"
tags: [plan, codebase, discord, memory, entity-ledger, arabic-nlp, safety, ai-routing]
status: ready
parent: .rpiv/artifacts/research/2026-06-27_entity-ledger-context-and-arabic-nlp-stability.md
phase_count: 8
phases:
  - { n: 1, title: Shared Arabic duration parser }
  - { n: 2, title: Clean user-facing errors and language sanitizer }
  - { n: 3, title: Ambiguity and create-vs-existing guard }
  - { n: 4, title: Move/reorder/logging deterministic routing }
  - { n: 5, title: Entity Ledger foundation }
  - { n: 6, title: Conversation summary V2 and prompt injection }
  - { n: 7, title: Tool result metadata and skill integration }
  - { n: 8, title: Tests, validation, rollout }
unresolved_phase_count: 0
last_updated: 2026-06-27T00:00:00+0300
last_updated_by: Pi
last_updated_note: Blueprint generated from research artifact; P0 can proceed without user decisions
---

# Entity Ledger, Context Resolution, Arabic NLP Stability — Implementation Blueprint

## Overview

This plan stabilizes HumanGuard AI against the live failures documented in the research artifact:

- follow-up references losing the just-created entity;
- `سو نظام لوقات` / `رتب السيرفر` being misread;
- existing channels being duplicated instead of moved/modified;
- Arabic timeout durations such as `يوم` being applied as 10 minutes;
- raw English/technical errors leaking to Discord;
- ambiguous management commands being guessed instead of clarified;
- non-Arabic filler such as `cosa` appearing in Arabic replies.

The implementation is split into immediate P0 correctness fixes and a P1 ledger/context architecture pass. P0 does not require more user decisions.

## Requirements

### Functional requirements

1. Parse Arabic durations robustly and cap Discord timeouts at 28 days.
2. Never show `failed العملية`, `AI request limit reached`, provider status codes, raw function/tool names, or English stack/status text to users.
3. Always treat `لوقات/لوق/logs/logging/سجل أحداث` as a Discord management intent.
4. For `رتب/نظم السيرفر`, ask one clarification if the request could mean reorder existing vs create new.
5. If a command references an existing channel/role/category by ID/name/ledger, operate on that entity; do not create a duplicate.
6. Resolve follow-up references using a canonical context pass before handlers/tools run.
7. Add an entity ledger with current state + chronological events.
8. Inject compact ledger context and conversation summary into every AI request.
9. Filter non-Arabic foreign filler from Arabic replies.

### Non-functional requirements

- Preserve existing tests and command behavior unless it was unsafe/incorrect.
- Keep local-first JSON persistence for now.
- Do not introduce DB dependencies in P0.
- Keep prompt injection compact.
- Do not bypass permission preflight or confirmation gates.

## Current state summary

- `MemoryManager` already persists bounded per-channel messages, recent actions, session entities, last IDs, pending plans, and language.
- `EntityRegistry` already stores recent guild entities and tombstones but is a TTL cache, not a full ledger.
- `ContextEngine` injects recent turns and `EntityRegistry.injectIntoPrompt()` but lacks a durable action narrative.
- `src/index.ts` has several direct deterministic handlers, but they parse independently before a single canonical resolution pass exists.
- Some error sanitation exists in `sanitizeUserFacingText()` and `formatUserError()`, but raw messages can still pass through tool result paths and direct replies.
- The current Arabic duration parser is local to `src/index.ts` and duplicated in `admin_action_suite.skill.ts`.

## Desired end state

- Every incoming management message first becomes a `RequestResolution` object containing:
  - normalized text;
  - management/social classification;
  - explicit channel/role/member/category targets;
  - ledger/live source of each target;
  - pending approval/clarification/workflow state;
  - ambiguity status and one clarification question if needed.
- Entity lookup order:
  1. explicit mention/raw ID;
  2. live Discord exact name;
  3. ledger exact/alias match;
  4. current session last reference only for pronouns (`الروم`, `هذا الشانل`, `الرتبة`);
  5. ask clarification.
- All tool results update both the old compatibility `EntityRegistry` and the new ledger.
- AI prompt includes:
  - `[ENTITY_LEDGER]` compact entity state;
  - `[CONVERSATION_SUMMARY]` compact durable summary;
  - existing permission/safety knowledge.
- Replies pass through one user-facing sanitizer path before Discord send.

## What we're NOT doing in this blueprint

- No SQLite/Postgres yet.
- No broad slash-command rewrite.
- No removal of old `EntityRegistry` during first ledger pass.
- No LLM-based summarizer in P0/P1; summary is deterministic.
- No risky silent execution for ambiguous/destructive actions.

---

# Phase 1 — Shared Arabic duration parser

## Goal

Move duration parsing into a reusable utility and make timeout durations correct for Gulf/Arabic phrases.

## Files

- New: `src/utils/duration.ts`
- Modify: `src/index.ts`
- Modify: `src/skills/catalog/admin_action_suite.skill.ts`
- Modify: `src/utils/discordTools.ts`
- Tests: `test/intelligence.test.js` or new `test/duration.test.js`

## Implementation

### 1. Add `src/utils/duration.ts`

Exports:

```ts
export interface ParsedDuration {
  ms: number;
  originalMs: number;
  capped: boolean;
  normalizedLabelAr: string;
  unit: 'second' | 'minute' | 'hour' | 'day' | 'week';
  amount: number;
}

export function normalizeArabicDigits(input: string): string;

export function parseArabicDuration(text: string, options?: {
  fallbackMs?: number;
  maxMs?: number;
}): ParsedDuration | undefined;
```

Rules:

- Arabic-Indic digits: `٠١٢٣٤٥٦٧٨٩` and `۰۱۲۳۴۵۶۷۸۹` → western digits.
- seconds: `ثانية`, `ثانيتين`, `ثواني`, `ثوان`, `sec`, `second`.
- minutes: `دقيقة`, `دقيقتين`, `دقايق`, `دقائق`, `min`, `minute`.
- hours: `ساعة`, `ساعتين`, `ساعات`, `hour`.
- days: `يوم`, `يومين`, `أيام`, `ايام`, `day`.
- weeks: `أسبوع`, `اسبوع`, `أسبوعين`, `اسبوعين`, `أسابيع`, `اسابيع`, `week`.
- if no number and singular unit → amount = 1.
- if no number and dual form → amount = 2.
- if number present → multiply by unit.
- cap at `options.maxMs` if supplied; for Discord timeout use `28 * 24 * 60 * 60 * 1000`.
- return `capped: true` and label such as `28 يوم` if capped.

### 2. Replace local parsers

- In `src/index.ts`, remove/replace `parseArabicDurationMs()` calls with `parseArabicDuration(..., { fallbackMs: 10 * 60_000, maxMs: DISCORD_TIMEOUT_MAX_MS })`.
- In `src/skills/catalog/admin_action_suite.skill.ts`, replace `parseDurationMs()` with shared parser.

### 3. Update `manageMembers()` result

In `src/utils/discordTools.ts` for timeout:

- include `durationMs`, `durationLabelAr`, `capped` in return object.
- message should say if capped: `المدة المطلوبة تتجاوز حد ديسكورد، طبقت الحد الأقصى 28 يوم.`

## Tests

Add tests:

- `تايم اوت يوم` → `86400000`.
- `تايم اوت ساعتين` → `7200000`.
- `تايم اوت 3 أيام` → `259200000`.
- `تايم اوت أسبوع` → `604800000`.
- `تايم اوت 10 دقايق` → `600000`.
- `تايم اوت يومين` → `172800000`.
- `تايم اوت أسبوعين` → `1209600000`.
- `تايم اوت ٣ أيام` → `259200000`.
- `تايم اوت 60 ثانية` → `60000`.
- `تايم اوت 40 يوم` → capped to `2419200000`.

## Acceptance

- Direct moderation command `تايم اوت @user يوم` uses one day.
- Admin suite custom timeout uses the same parser.
- Build/test pass.

---

# Phase 2 — Clean user-facing errors and language sanitizer

## Goal

No raw provider/tool/English technical strings reach Discord users; Arabic replies do not contain foreign filler like `cosa`.

## Files

- New: `src/utils/languageSanitizer.ts`
- Modify: `src/index.ts`
- Modify: `src/services/aiCatalog.ts`
- Optional modify: `src/services/ai.ts`
- Tests: add user error and language sanitizer tests.

## Implementation

### 1. Add `src/utils/languageSanitizer.ts`

Exports:

```ts
export interface LanguageSanitizerResult {
  text: string;
  changed: boolean;
  flags: string[];
}

export function sanitizeArabicReplyLanguage(text: string): LanguageSanitizerResult;
```

Initial replacements:

- `cosa` → `شيء`
- `por favor` → `لو سمحت`
- `gracias` → `شكراً`
- `bueno` → `طيب`
- Arabic text with standalone `ok/okay` → `تمام`

Allowlist examples:

- `ID`, `URL`, `Discord`, `HumanGuard`, `AI`, known command prefixes, URLs, mentions, channel/role names preserved.

### 2. Centralize outbound sanitization

In `src/index.ts`:

- update `sanitizeUserFacingText()` to strip any `failed العملية:` prefix and then sanitize the remainder.
- call `sanitizeArabicReplyLanguage()` inside `sendLongMessage()` after `AIResponseParser.formatResponseCard()` and before embed classification.
- add a small helper for direct replies where practical:

```ts
async function replyPlain(message: Message, content: string) {
  await message.reply(sanitizeUserFacingText(sanitizeArabicReplyLanguage(content).text)).catch(() => null);
}
```

Do not convert all social chat to embeds; keep conversational replies as plain text.

### 3. Patch raw leak paths

Search targets:

- `failed العملية`
- `AI request limit reached`
- `Try again after`
- `err.message`
- `error.message`
- `String(error)` used inside returned user messages

Required behavior:

- rate limit → `البوت مشغول، جرب بعد X ثانية 🕐`
- AI down → `البوت ما يرد الحين، جرب بعد شوي`
- unknown → `صار خطأ غير متوقع، جرب مرة ثانية`
- permission/hierarchy → clean Arabic reason.

Keep English logs in console/audit; only sanitize Discord messages.

### 4. Strengthen system prompt

In `src/services/aiCatalog.ts` under `LANGUAGE & TONE` add:

```text
- Arabic replies must be Gulf Arabic only. Do not use Spanish/Italian/foreign filler words. Say "شيء" not "cosa".
```

## Tests

- `sanitizeUserFacingText('failed العملية: AI request limit reached. Try again after 54 seconds.')` returns Arabic rate-limit text.
- `sanitizeArabicReplyLanguage('هل تبي أي cosa ثانية؟')` returns text with `شيء`.
- `formatUserError(new Error('AI request limit reached. Try again after 54 seconds.'))` returns Arabic.

## Acceptance

- No direct user path shows raw English rate-limit/provider strings.
- Arabic AI output does not contain `cosa` after sanitizer.

---

# Phase 3 — Ambiguity and create-vs-existing guard

## Goal

Prevent wrong guesses and duplicate channels/roles. If intent is ambiguous, ask one targeted question before any tool call.

## Files

- New: `src/services/requestResolution.ts`
- Modify: `src/index.ts`
- Modify: `src/services/toolTargeting.ts`
- Modify: `src/intelligence/compound_planner.ts`
- Tests: ambiguity and existing entity tests.

## Implementation

### 1. Add request resolution helper

Create `src/services/requestResolution.ts`:

```ts
export type ManagementIntentKind =
  | 'social'
  | 'logging_setup'
  | 'create_channel'
  | 'move_channel'
  | 'reorder_existing'
  | 'modify_existing'
  | 'delete_existing'
  | 'moderation'
  | 'ambiguous'
  | 'unknown_management';

export interface RequestResolution {
  normalizedText: string;
  isManagementIntent: boolean;
  kind: ManagementIntentKind;
  explicitTargets: ExplicitToolTargets;
  existingChannelIds: string[];
  existingCategoryIds: string[];
  existingRoleIds: string[];
  requestedCreateName?: string;
  duplicateRisk?: boolean;
  clarificationQuestion?: string;
}

export function resolveRequestContext(params: {
  guild: Guild;
  channelId: string;
  userId: string;
  text: string;
  sessionEntities: SessionEntity[];
}): RequestResolution;
```

This function initially wraps existing `resolveExplicitToolTargets()` and adds deterministic classification.

### 2. Ambiguity rules

Before direct handlers and before `planCompoundDiscordRequest` in `src/index.ts`:

- If `kind === 'ambiguous'`, reply with `clarificationQuestion` and return.

Initial ambiguity:

```text
رتب/نظم + السيرفر/الرومات/القنوات + no explicit create words
→ تقصد أرتب الرومات الحالية بترتيب منطقي؟ أو تبي أضيف رومات جديدة؟
```

Only one question per turn.

### 3. Duplicate guard

If request has create wording and an exact live/ledger channel/role/category name exists:

- Do not execute create.
- Ask:

```text
فيه روم/رتبة بنفس الاسم موجودة: X. تبي أعدل الموجود ولا أنشئ واحد جديد باسم مختلف؟
```

If user explicitly says `جديد` or supplies a different name, allow create.

### 4. Existing entity wins

Any command containing:

- raw channel ID;
- channel mention;
- exact channel name in live cache;
- ledger exact alias;

must route to modify/move/delete for that entity, not create.

## Tests

- `رتب لي السيرفر` → returns clarification, no tool call.
- Existing channel `شات-عام`; text `تشوف روم شات-عام انقله لكاتقوري X` → `channel_operations: channel_set_parent`.
- Existing channel `rules`; text `سو روم اسمه rules` → clarification about duplicate.
- `سو نظام لوقات` → management/logging, not social.

## Acceptance

- Ambiguous server organization no longer creates channels.
- Existing channel references no longer create duplicates.

---

# Phase 4 — Move/reorder/logging deterministic routing

## Goal

Add deterministic workflows for high-frequency Arabic management commands so they do not depend on LLM guessing.

## Files

- Modify: `src/intelligence/compound_planner.ts`
- Modify: `src/services/toolIntent.ts`
- Modify: `src/services/ai.ts`
- Modify: `src/index.ts`
- Optional: new skill in `src/skills/catalog/admin_action_suite.skill.ts`

## Implementation

### 1. Move existing channel to category

Pattern examples:

- `انقل روم شات-عام لكاتقوري X`
- `حط قناة rules في قسم info`
- `ود الشات العام لكاتقوري 123...`

Workflow:

```ts
{
  id: 'move_channel_to_category',
  tool: 'channel_operations',
  args: { action: 'channel_set_parent', channelId, categoryId }
}
```

Use `RequestResolution` targets.

### 2. Reorder existing channels

For `رتب الرومات الحالية` after user clarification, initial safe implementation:

- Do not reorder automatically unless target ordering is clear.
- If user asks generally: return an informational plan/list, ask for confirmation or exact order.
- Later P2 can implement actual position sorting.

### 3. Logging setup as skill/tool

Move direct `handleDirectLoggingSystemRequest()` logic into a skill:

- `setup_logging_system`
- category: `logging`
- triggersAr: `سو نظام لوقات`, `لوقات`, `سجل الأحداث`, `logs`
- required permissions: `ManageChannels`, optionally `ManageRoles` if permission overwrites are set.
- execute creates category + log channels with @everyone deny ViewChannel.

Keep direct handler as a thin wrapper that executes the skill/tool.

### 4. Tool selection

Ensure `toolIntent` and `ai.ts` select relevant tools:

- logging → `create_channels`, `edit_permissions`, `channel_operations`, `analytics_operations`.
- move channel → `channel_operations`, `get_server_info`.
- reorder → `channel_operations`, `get_server_info`.

## Tests

- `سو نظام لوقات` triggers logging setup skill/direct path.
- `لوق` is never treated as `لطافة`/social.
- `انقل روم X لكاتقوري Y` produces `channel_set_parent`.

## Acceptance

- Logging setup is executable and audited.
- Existing channel move is deterministic.

---

# Phase 5 — Entity Ledger foundation

## Goal

Add a durable ledger while keeping current `EntityRegistry` compatibility.

## Files

- New: `src/intelligence/entity_ledger.ts`
- Modify: `src/intelligence/entity_registry.ts`
- Modify: `src/index.ts`
- Modify: `src/services/toolTargeting.ts`
- Tests: ledger persistence/resolution tests.

## Implementation

### 1. Add `entity_ledger.ts`

Types:

```ts
export type LedgerEntityStatus = 'active' | 'deleted' | 'unknown';
export type LedgerEventType = 'created' | 'modified' | 'moved' | 'renamed' | 'permission_updated' | 'deleted' | 'failed' | 'referenced';

export interface LedgerEntity { ... }
export interface LedgerEvent { ... }
export interface LedgerLastRefs { ... }
```

Storage:

- `data/entity_ledger.json`
- JSON initially.
- Keep active entity state indefinitely.
- Keep events last 90 days or last 1000 per guild in first implementation.

### 2. APIs

Implement:

- `initialize()`
- `save()` / debounced save
- `recordToolResult({ guild, conversationChannelId, userId, toolName, args, result })`
- `recordReference(...)`
- `resolveReference(...)`
- `findExistingByName(...)`
- `buildPromptContext(guildId, conversationChannelId, userId)`
- `markDeleted(...)`

### 3. Wire execution boundary

In `src/index.ts executeToolWithAudit`:

- after tool result (success or failure), call `EntityLedger.recordToolResult(...)`.
- still call `EntityRegistry.registerToolResult(...)` until ledger has replaced all readers.

### 4. Rebuild `EntityRegistry.lastCreated`

In `EntityRegistry.initialize()`:

- after loading entities, sort by `createdAt` and rebuild `lastCreated` map for active entities.

### 5. Prompt context

Add to runtime prompts:

```ts
EntityLedger.buildPromptContext(message.guild.id, message.channel.id, message.author.id)
```

Keep old entity context for one release, then reduce duplication.

## Tests

- Record create result → ledger has active entity and event.
- Record rename/move permission edit → entity updates and event appended.
- Record delete → status deleted and not resolved as active.
- Restart load from JSON → last refs and active entities restore.

## Acceptance

- Ledger file is created/updated.
- Follow-up references can be resolved from ledger.
- Existing tests remain green.

---

# Phase 6 — Conversation summary V2 and prompt injection

## Goal

Inject a compact durable narrative of what happened into every AI request.

## Files

- Modify: `src/intelligence/memory_manager.ts`
- Modify: `src/index.ts`
- Modify: `src/intelligence/context_engine.ts`
- Tests: summary update/prompt tests.

## Implementation

### 1. Add summary type

In `MemoryManager`:

```ts
export interface ConversationSummaryV2 {
  version: 1;
  updatedAt: number;
  turnCount: number;
  language: SessionLanguagePreference;
  facts: string[];
  completedActions: Array<{
    at: number;
    tool: string;
    summary: string;
    entityRefs: Array<{ type: EntityType; id: string; name: string }>;
  }>;
  openQuestions: string[];
  pendingActions: Array<{
    id: string;
    type: 'approval' | 'clarification' | 'workflow';
    summary: string;
    expiresAt?: number;
  }>;
  lastUserGoal?: string;
}
```

Add `conversationSummaryV2?: ConversationSummaryV2` to `MemoryEntry`.

### 2. Deterministic updates

Add methods:

- `rememberCompletedAction(channelId, action)`
- `rememberOpenQuestion(channelId, question)`
- `clearOpenQuestion(channelId, id?)`
- `rememberPendingAction(channelId, pending)`
- `clearPendingAction(channelId, id)`
- `buildConversationSummaryContext(channelId)`

### 3. Injection point

Create one helper in `src/index.ts`:

```ts
function buildRuntimeSystemPrompt(params): string {
  return [
    ContextEngine.buildSystemPrompt(...),
    memoryManager.buildEntityContext(...),
    memoryManager.buildConversationSummaryContext(...),
    memoryManager.buildUserPreferenceContext(...),
    memoryManager.buildPendingPlanContext(...),
    EntityLedger.buildPromptContext(...),
    SkillRegistry.buildSkillManifestForAI(),
    buildKnowledgeSectionsForPrompt(...),
  ].filter(Boolean).join('\n');
}
```

Replace all repeated prompt arrays in `src/index.ts` with this helper.

### 4. Pending approval integration

When `createApprovalGate()` returns pending:

- store pending summary in `conversationSummaryV2.pendingActions`.

When approval consumed/cancelled/expires:

- clear pending summary.

## Tests

- After successful `create_channels`, summary has completed action with entity ID.
- Summary context includes last action and pending action.
- Prompt builder includes summary in main/verify/follow-up prompts.

## Acceptance

- Every AI call sees `[CONVERSATION_SUMMARY]`.
- Summary survives restart through `persistent_memory.json`.

---

# Phase 7 — Tool result metadata and skill integration

## Goal

Make all mutations return enough structured data for ledger/summary and keep skill behavior consistent.

## Files

- Modify: `src/utils/discordTools.ts`
- Modify: `src/utils/advancedDiscordActions.ts`
- Modify: `src/tools/community_builder.ts`
- Modify: `src/skills/catalog/admin_action_suite.skill.ts`
- Optional: `src/tools/voice_manager.ts`

## Implementation

### 1. `discordTools.ts`

- `manageMembers()` returns member/action/duration metadata.
- `manageRoles()` returns role id/name/action.
- `editPermissions()` returns channel id/name, target id/name, allow/deny.
- `bulkPermissionUpdate()` returns updated channel ids and summary.
- `deleteChannels()` returns deleted ids + names, not names only.

### 2. `advancedDiscordActions.ts`

For actions that mutate a channel/role/guild, return `data` with IDs:

- `channel_rename` → `{ id, name }`
- `channel_set_parent` → `{ id, parentId }`
- `channel_move` → `{ id, position }`
- `channel_lock/unlock` → `{ id, overwritesChanged: true }`
- `role_set_*` → `{ roleId, name }`

### 3. `community_builder.ts`

Ensure builder returns `createdEntities` for every created category/channel/role.

### 4. Admin suite skills

- Replace local duration parsing.
- Use `setup_logging_system` skill if added.

## Tests

- `EntityRegistry.registerToolResult` and ledger receive IDs for move/rename/role edit.
- Skill custom timeout uses shared parser.

## Acceptance

- Ledger can reconstruct state from tool results.
- No regression in current skill load count.

---

# Phase 8 — Tests, validation, rollout

## Goal

Validate correctness and prevent regressions.

## Tests to add

### Duration

- All listed duration cases.
- Cap >28 days.

### Error sanitation

- raw rate limit string becomes Arabic.
- `failed العملية:` is stripped.
- provider errors become clean Arabic.

### Language sanitizer

- `cosa` becomes `شيء`.
- allowed IDs/URLs are preserved.

### Intent/ambiguity

- `سو نظام لوقات` → logging setup.
- `رتب لي السيرفر` → clarification.
- `رتب الرومات الحالية` → no create.
- existing channel name + move phrase → `channel_set_parent`.
- existing channel name + create phrase → duplicate clarification.

### Ledger

- create/edit/delete tool results update ledger.
- tombstone not resolved.
- restart load restores current state.

### Conversation summary

- summary context includes latest action.
- pending approval appears and clears.

## Commands

Run:

```bash
npm run build
npm test
PORT=3001 timeout 15s npm run dev
```

Expected startup line:

```text
[SkillRegistry] Loaded 724 executable skills.
```

or higher if `setup_logging_system` is added as a new skill.

## Rollout

1. Implement P0 phases 1–4 first.
2. Run tests and push.
3. Implement P1 phases 5–6.
4. Run tests and push.
5. Implement P2 phase 7.
6. Run tests and push.

---

# Implementation order

## Commit 1 — P0 visible production fixes

- `duration.ts`
- language sanitizer
- error sanitation
- ambiguity gate
- create-vs-existing guard
- deterministic move/logging routing updates
- tests

Suggested commit message:

```text
Fix Arabic durations, ambiguity handling, and clean user replies
```

## Commit 2 — P1 ledger and summary

- `entity_ledger.ts`
- prompt context
- summary V2
- execution boundary recording
- target resolver integration
- tests

Suggested commit message:

```text
Add entity ledger and durable conversation summaries
```

## Commit 3 — P2 structured tool metadata

- richer mutation results
- logging skill integration
- community builder created entities
- tests

Suggested commit message:

```text
Return structured mutation metadata for ledger tracking
```

---

# Risk assessment

## Risk: duplicate context sections bloat prompts

Mitigation: keep ledger prompt compact and eventually remove redundant old entity context after tests pass.

## Risk: ambiguity gate blocks intended quick create requests

Mitigation: only trigger ambiguity when text lacks explicit create words and has broad `رتب/نظم` wording.

## Risk: ledger JSON grows too large

Mitigation: prune events to 90 days/1000 per guild; keep current entity state.

## Risk: direct handlers bypass sanitizer

Mitigation: add a wrapper and gradually replace direct `message.reply()` paths, prioritizing tool/error paths.

## Risk: existing tests assume exact approval phrase only

Current tests already passed after allowing simple confirmations except `تمام`; keep `تمام` as cancellation unless explicitly changed.

---

# Acceptance checklist

- [ ] `تايم اوت يوم` applies one day.
- [ ] `تايم اوت ساعتين` applies two hours.
- [ ] `تايم اوت أسبوع` applies seven days.
- [ ] `سو نظام لوقات` creates/uses logging setup, never social apology.
- [ ] `رتب لي السيرفر` asks one clarification, no channel creation.
- [ ] Existing channel references move/modify existing channel, no duplicate.
- [ ] Raw rate-limit/provider strings never appear in Discord replies.
- [ ] `cosa` is removed/replaced in Arabic output.
- [ ] Ledger records create/modify/delete events.
- [ ] Conversation summary appears in every AI prompt.
- [ ] `npm test` passes.
- [ ] Dev startup is clean.

## Ready-to-run next step

P0 can be implemented immediately with no more decisions:

```txt
/skill:implement .rpiv/artifacts/plans/2026-06-27_entity-ledger-context-and-arabic-nlp-stability.md --phase P0
```
