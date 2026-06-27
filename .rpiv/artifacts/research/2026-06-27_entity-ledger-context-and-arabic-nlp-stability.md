# Research — Entity Ledger, Context Resolution, Arabic NLP Stability

## Scope

This artifact covers the next stability pass for HumanGuard AI after the 724-skill expansion and confirmation-gate work. It focuses on the reported production failures:

1. Memory/context still not strong enough for follow-up references.
2. Management commands are sometimes misread as social chat or as create-new requests.
3. Arabic duration parsing is incomplete.
4. Raw English/technical errors can still leak to Discord users.
5. Ambiguous management requests are executed instead of clarified.
6. Non-Arabic words such as `cosa` can appear in Arabic replies.

## 1. Current conversation memory architecture

### Existing components

#### `src/intelligence/memory_manager.ts`

Current durable file: `data/persistent_memory.json`.

Per channel it stores:

- `messages`: bounded chat/tool history.
- `summary`: structured fields such as `topics`, `lastMusicQuery`, `lastBuildRequest`, `userPreferences`, `languagePreference`, `interactionCount`, `musicHistory`, `errorHistory`, `lastActions`.
- `entities`: session entities created/touched by tools.
- `lastEntityIds`: `last_channel_id`, `last_role_id`, `last_category_id`.
- `lastReferencedEntityId`.
- `pendingMultiStepPlan`.
- `turnCounter`, `createdAt`, `lastAccessed`.

Important functions:

- `addMessage(channelId, message)` updates history, language, music/build hints, tool error/music histories, trims old messages, saves to disk.
- `rememberEntities(channelId, entities)` records entities returned by `EntityRegistry.registerToolResult`.
- `getRecentEntities(channelId, type?)` returns recent entities in reverse chronological order.
- `buildEntityContext(channelId)` injects `[SESSION_ENTITIES]`, last IDs, last referenced entity, and recent actions.
- `rememberAction(channelId, actionSummary)` stores recent action summaries.
- `setPendingPlan/getPendingPlan/buildPendingPlanContext/clearPendingPlan` exists for multi-step continuity.

What works now:

- Created entities are persisted for follow-up references.
- Last channel/role/category pointers exist.
- Recent actions are injected into AI runtime context.
- Language preference is tracked.
- Pending multi-step plan storage exists.

What is missing:

- `SUMMARY_THRESHOLD` exists but no full natural-language rolling summary is generated when the threshold is reached. The current summary is mostly field-based plus lastActions.
- The memory does not store an explicit, canonical "what happened so far" summary such as: "created Room1 id=..., set @everyone deny Connect...".
- There is no single pre-processing `RequestResolution` object that all handlers must use before acting.
- Pending approval actions are stored only in `approval_flow.ts` in-memory, not in durable `MemoryManager`/ledger.
- Session entities are channel-scoped; `EntityRegistry` is guild-scoped. They overlap but are not exposed through one unified API.

#### `src/intelligence/entity_registry.ts`

Current durable file: `data/entity_cache.json`.

It stores recent guild entities with:

- `guildId`
- `type`
- `id`
- `name`
- `createdAt`
- `sourceTool`
- `ttl`
- `metadata`
- `conversationChannelId`
- `modifiedAt`
- `status: active | deleted`

Important functions:

- `register(entity)` stores/upserts an entity.
- `getRecent(guildId, type?, conversationChannelId?)` returns recent non-deleted entities.
- `getLatest(...)` returns latest entity.
- `findByName(guildId, type, name)` exact/unique-partial lookup.
- `resolveById(guildId, id)`.
- `resolveLastCreated(...)`.
- `injectIntoPrompt(...)` emits `[RECENT_ENTITIES]` and reference guide.
- `registerToolResult(guild, toolName, args, result, conversationChannelId)` centralizes entity extraction after tool execution.
- `markTombstone(...)` marks deleted channel/category/role.

What works now:

- Guild-level recent entities are available beyond one channel session.
- Tombstones prevent stale deleted entities from being reused.
- Tool results are registered centrally in `executeToolWithAudit`.

What is missing:

- It is a cache, not a full ledger. It loses old events after TTL/max limit.
- It does not store a chronological event history per entity: created, renamed, moved, permission-edited, deleted, failed actions.
- It lacks strong indexes for aliases/normalized names/parent category.
- `lastCreated` map is not reconstructed from disk during `initialize()`, so prompt highlighting may be incomplete after restart until a new entity is registered.
- It does not record pending action references.

#### `src/intelligence/context_engine.ts`

Current in-memory per-channel context:

- last 30 turns
- user language maps/history
- recent accomplishments
- pending operations
- user permissions
- last tool result
- last created entity

Important functions:

- `buildSystemPrompt(context, guild, userId?)` injects server context, `EntityRegistry.injectIntoPrompt`, Discord knowledge, conversation context, continuity/entity resolution rules.
- `summarizeForPrompt(context)` injects recent turns, accomplishments, pending operations.

What works now:

- Runtime prompt includes recent context and entity rules.
- Latest message language controls Arabic/English.

What is missing:

- Context is not durable.
- `lastCreatedEntity` is present but not consistently set by tool execution; most continuity comes from MemoryManager/EntityRegistry instead.
- There is no ambiguity resolution state machine before tool execution.

#### `src/index.ts` message flow

Current order, simplified:

1. Ignore bots/non-guild/no-member.
2. Safety filters/autoresponder/manual commands.
3. Determine targeted/auth.
4. Strip mention/prefix.
5. Consume/cancel pending approval.
6. Direct deterministic handlers:
   - bulk channel delete + store
   - logging system request
   - why-did-you-say request
   - conversation small talk
   - bot nickname
   - direct moderation
   - voice room request
   - permission operations
   - mention sweep
7. Resolve explicit targets with `resolveExplicitToolTargets`.
8. Build AI runtime prompt with ContextEngine + MemoryManager + SkillRegistry + knowledge sections.
9. Deterministic compound planner or AI tool loop.
10. Tool execution through `executeToolWithAudit`.
11. Register entities and remember actions.

What works now:

- Central tool execution boundary exists.
- Confirmation gate blocks risky tools unless `_approved` is trusted.
- Some direct Arabic commands bypass LLM.

What is missing:

- Direct handlers run before a single canonical context/intent resolution object is built.
- `resolveExplicitToolTargets` is called only later for several paths; some direct handlers do their own parsing.
- There is no mandatory "existing entity check" before `create_channels`.
- There is no universal ambiguity gate.

## 2. Proposed Entity Ledger design

### Goal

Replace/extend `EntityRegistry` cache with an event ledger that knows:

- every entity touched by the bot,
- current entity state,
- aliases and normalized names,
- parent/category relationships,
- last references per conversation/user,
- pending actions that refer to an entity,
- and a compact prompt view.

### Storage format

File: `data/entity_ledger.json` initially. SQLite can come later.

Recommended shape:

```json
{
  "version": 1,
  "guilds": {
    "GUILD_ID": {
      "entities": {
        "ENTITY_ID": {
          "guildId": "GUILD_ID",
          "type": "channel|category|role|member|thread|webhook|invite|auto_mod_rule",
          "id": "ENTITY_ID",
          "name": "Room1",
          "normalizedName": "room1",
          "aliases": ["room1", "روم1"],
          "status": "active|deleted|unknown",
          "parentId": "CATEGORY_ID|null",
          "channelType": "text|voice|category|forum|announcement|null",
          "sourceTool": "create_channels",
          "createdAt": 1710000000000,
          "lastSeenAt": 1710000000000,
          "lastModifiedAt": 1710000000000,
          "conversationChannelId": "DISCORD_CHANNEL_ID",
          "createdByUserId": "USER_ID",
          "metadata": {}
        }
      },
      "events": [
        {
          "eventId": "timestamp-random",
          "at": 1710000000000,
          "type": "created|modified|moved|renamed|permission_updated|deleted|failed|referenced",
          "entityId": "ENTITY_ID",
          "entityType": "channel",
          "toolName": "create_channels",
          "args": {},
          "resultSummary": "تم إنشاء Room1",
          "conversationChannelId": "CHANNEL_ID",
          "userId": "USER_ID"
        }
      ],
      "lastRefs": {
        "conversation:CHANNEL_ID": {
          "channel": "LAST_CHANNEL_ID",
          "role": "LAST_ROLE_ID",
          "category": "LAST_CATEGORY_ID",
          "member": "LAST_MEMBER_ID",
          "updatedAt": 1710000000000
        },
        "user:USER_ID": {
          "channel": "LAST_CHANNEL_ID"
        }
      }
    }
  }
}
```

### Retrieval API

Add or evolve `src/intelligence/entity_registry.ts` into `entity_ledger.ts` with:

```ts
resolveReference(params: {
  guild: Guild;
  conversationChannelId: string;
  userId: string;
  text: string;
  expectedTypes?: EntityType[];
  liveRequired?: boolean;
}): Promise<{
  status: 'resolved' | 'ambiguous' | 'missing';
  entity?: LedgerEntity;
  matches?: LedgerEntity[];
  source: 'mention' | 'raw_id' | 'exact_name' | 'ledger_last_ref' | 'live_discord' | 'session_entity';
  reason?: string;
}>;
```

```ts
entityExistsByRequestedName(params: {
  guild: Guild;
  text: string;
  type: 'channel' | 'role' | 'category';
}): Promise<LedgerEntity | undefined>;
```

```ts
recordToolResult(params: {
  guild: Guild;
  conversationChannelId: string;
  userId: string;
  toolName: string;
  args: Record<string, any>;
  result: Record<string, any>;
}): LedgerEvent[];
```

```ts
buildPromptContext(guildId: string, conversationChannelId: string, userId: string): string;
```

```ts
buildResolutionContext(...): RequestResolution;
```

### Update points in code

Modify these locations:

1. `src/index.ts` → `executeToolWithAudit`
   - After successful/failed tool execution, call ledger `recordToolResult`.
   - Keep current `EntityRegistry.registerToolResult` temporarily for backward compatibility.

2. `src/utils/discordTools.ts`
   - Ensure every mutation returns stable IDs, not only names.
   - `createChannels` already returns `createdEntities`; extend role/channel operations similarly.
   - `manageMembers` should return `memberId`, action, durationMs where relevant.

3. `src/utils/advancedDiscordActions.ts`
   - Return IDs for rename/move/lock/etc. currently many return only message.
   - For channel rename/move/clone, include `{ id, name, parentId, action }`.

4. `src/services/toolTargeting.ts`
   - Replace internal ad-hoc matching with ledger `resolveReference`.
   - Keep live Discord exact name matching as a source.

5. `src/intelligence/arabic_nlp.ts`
   - For permission operations, resolve channel/role through ledger first, then live cache.

6. `src/intelligence/compound_planner.ts`
   - Before `CREATE_CHANNEL` workflow, consult ledger/live state to prevent duplicate creation.
   - Add MOVE/REORDER workflows when existing entity is referenced.

7. `src/index.ts` direct handlers
   - `handleDirectLoggingSystemRequest`, `handleDirectModerationRequest`, `handleDirectVoiceRoomRequest`, `handleDirectBulkChannelDeleteAndStore` should accept a shared `RequestResolution` object instead of reparsing text.

### Prompt injection

Replace two separate sections:

- `[SESSION_ENTITIES]` from `MemoryManager.buildEntityContext`
- `[RECENT_ENTITIES]` from `EntityRegistry.injectIntoPrompt`

with one compact ledger context:

```text
[ENTITY_LEDGER]
last.channel=Room1:151...:voice:parent=VIP:source=create_channels:conversation=current
last.category=Logs:151...
mentioned.channel=شات-عام:151...:source=live_discord
recent:
- channel:Room1:151...:active:voice:parent=151...
- role:VIP:151...:active
rules:
- If user references an existing name/ID, modify/move/delete it; do not create duplicate.
- If create wording conflicts with existing exact name, ask one clarification.
[/ENTITY_LEDGER]
```

## 3. Proposed Conversation Summary design

### Current issue

The bot keeps messages and field summaries, but the AI does not consistently see a short durable narrative of what happened. Current `[RECENT_ACTIONS]` helps, but it is not structured enough for multi-turn admin work.

### Proposed summary object

Add to `MemoryEntry`:

```ts
conversationSummaryV2?: {
  version: 1;
  updatedAt: number;
  turnCount: number;
  language: 'ar' | 'en';
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
};
```

### When to summarize

Trigger summary update:

1. Every 10 user turns, or when `messages.length > 30`.
2. After successful tool execution.
3. After failed tool execution that needs user correction.
4. When pending approval/clarification is created or cleared.

Implementation options:

- P0: deterministic summarizer only, no LLM. Use tool results + direct message snippets.
- P2: optional LLM summarizer when Groq is available, but never block execution.

### Summary format injected into AI

```text
[CONVERSATION_SUMMARY]
language=ar
last_goal=تنظيم الرومات وضبط اللوقات
completed:
- أنشأت كاتقوري Logs id=151... وفيه mod-logs/message-logs/voice-logs.
- أنشأت Room1 id=151... كفويس داخل VIP.
open:
- المستخدم لم يحدد هل "رتب السيرفر" يعني ترتيب الرومات الحالية أو إنشاء هيكلة جديدة.
pending:
- approval ban member Omar expires=...
[/CONVERSATION_SUMMARY]
```

### Injection point

Modify system prompt assembly in `src/index.ts`:

- Current places building prompt:
  - main AI call around `systemPrompt = [...]`.
  - missing intent repair prompt.
  - verification prompt.
  - secondary AI loop prompt.

Add `memoryManager.buildConversationSummaryContext(message.channel.id)` to all of them, or wrap prompt building in one helper:

```ts
function buildRuntimePrompt(message, sessionContext, explicitTargetsContext) { ... }
```

## 4. Arabic NLP gaps

### A. Create vs modify/move

Current gaps:

- `planCompoundDiscordRequest` heavily recognizes create flows and store templates.
- `resolveExplicitToolTargets` can find existing channels, but `create_channels` is not prevented when text contains existing names.
- `رتب لي السيرفر` can match build/rebuild/organize and produce creation instead of asking.
- `تشوف روم شات-عام انقله لكاتقوري X` must be channel move, not create.

Required fix:

Add an `action classifier` before planning:

```ts
classifyManagementIntent(text, resolvedTargets):
  | { kind: 'create_channel'; confidence; requestedName; existingEntity? }
  | { kind: 'move_channel'; channelId; categoryId }
  | { kind: 'reorder_channels'; scope }
  | { kind: 'logging_setup' }
  | { kind: 'ambiguous'; question }
```

Rules:

- If text has `انقل|حرك|ود|وديه|حطه في كاتقوري` + existing channel + category → `channel_operations: channel_set_parent`.
- If text has `رتب السيرفر|نظم السيرفر` without explicit `سو/انشئ رومات جديدة` → ask: `تقصد أرتب الرومات الحالية بترتيب منطقي؟ أو تبي أضيف رومات جديدة؟`
- If text has a live channel name/ID and a create verb, ask before duplicate creation.
- If exact entity exists, default to modify/move/delete, not create.

### B. Logging intent

Already partially fixed:

- `src/services/conversation.ts` includes `لوقات`, `لوق`, `logs`, `log`, `سجل`, `سجلات`, `audit` in `ACTION_TERMS`.
- `src/services/toolIntent.ts` includes logging terms.
- `src/services/ai.ts` includes logging terms for tool selection.
- `src/index.ts` has `handleDirectLoggingSystemRequest`.

Remaining improvement:

- Move logging setup from `src/index.ts` direct ad-hoc function into a skill/tool: `setup_logging_system` so it can be audited, tested, and used by workflows.
- Ledger should record created log category/channels and mark them as system channels.

### C. `رتب` ambiguity

Current risk:

- `رتب` appears in action/social/intent patterns and can be interpreted as build/reorganize/create.

Fix:

- Add ambiguity gate in `src/index.ts` before compound planner:

```ts
if (/رتب|نظم/.test(text) && /السيرفر|الرومات|القنوات/.test(text) && !/(انشئ|سو|اضف|جديد)/.test(text)) {
  askClarification('تقصد أرتب الرومات الحالية بترتيب منطقي؟ أو تبي أضيف رومات جديدة؟');
  return;
}
```

### D. Duration parsing

Current state:

- `src/index.ts` has `parseArabicDurationMs`, but it is local, not reusable.
- It handles basic singular/plural keywords with digits.
- It does not robustly handle Arabic dual forms such as `ساعتين`, `يومين`, `أسبوعين`.
- It does not handle Arabic-Indic digits (`٣ أيام`).
- It does not return metadata that duration was capped.
- `src/skills/catalog/admin_action_suite.skill.ts` has a separate `parseDurationMs`, causing duplication.

Required design:

Create `src/utils/duration.ts`:

```ts
export interface ParsedDuration {
  ms: number;
  originalMs: number;
  capped: boolean;
  normalizedLabelAr: string;
  unit: 'second' | 'minute' | 'hour' | 'day' | 'week';
  amount: number;
}

export function parseArabicDuration(text: string, options?: {
  fallbackMs?: number;
  maxMs?: number;
}): ParsedDuration | undefined;
```

Rules:

- Arabic-Indic digits → western digits.
- `ثانية|ثواني|ثوان|ث` = seconds.
- `دقيقة|دقايق|دقائق|د` = minutes.
- `ساعة|ساعات` = hours.
- `ساعتين|ساعتان` = 2 hours.
- `يوم|أيام` = days.
- `يومين|يومان` = 2 days.
- `أسبوع|اسبوع|أسابيع` = weeks.
- `أسبوعين|اسبوعين` = 2 weeks.
- If no number: singular defaults to 1, dual defaults to 2.
- Cap timeout max at 28 days.

Required tests:

- `تايم اوت يوم` → `86400000`.
- `تايم اوت ساعتين` → `7200000`.
- `تايم اوت 3 أيام` → `259200000`.
- `تايم اوت أسبوع` → `604800000`.
- `تايم اوت 10 دقايق` → `600000`.
- Add also `تايم اوت يومين`, `تايم اوت أسبوعين`, `تايم اوت ٣ أيام`, `تايم اوت 60 ثانية`, `تايم اوت 40 يوم` → capped to 28d.

Update points:

- `src/index.ts` direct moderation handler.
- `src/skills/catalog/admin_action_suite.skill.ts` custom timeout skill.
- Any timeout parsing in `src/skills/catalog/preset_recipes.skill.ts` if natural text is added later.
- `src/utils/discordTools.ts manageMembers` result should include duration label and cap notice.

### E. Non-Arabic word leakage (`cosa`)

Current state:

- `src/services/aiCatalog.ts` system prompt says Arabic input → Arabic reply.
- `MemoryManager.buildUserPreferenceContext` enforces language.
- No post-processing filter exists for Spanish/Italian random words.

Fix:

Add `src/utils/languageSanitizer.ts`:

```ts
export function sanitizeArabicReplyLanguage(text: string): {
  text: string;
  changed: boolean;
  flags: string[];
}
```

Initial deterministic replacements:

- `cosa` → `شيء`
- `por favor` → `لو سمحت`
- `gracias` → `شكراً`
- `bueno` → `طيب`
- `okay/ok` can stay only if the user used English; otherwise `تمام`.

Detection:

- If Arabic reply has low-frequency Latin token not in allowlist (`ID`, `URL`, `Discord`, `HumanGuard`, command/tool names hidden, channel names, role names), flag and replace/remove.

Apply in:

- `sendLongMessage` before classification/embed.
- direct `message.reply` conversational paths? Prefer central `sendUserText` wrapper for all bot replies.
- `AIResponseParser.formatResponseCard` or immediately after it.

System prompt strengthening:

In `src/services/aiCatalog.ts` `LANGUAGE & TONE` add:

- `Arabic replies must contain no Spanish/Italian/foreign filler words. Use Gulf Arabic only; examples: say "شيء" not "cosa".`

## 5. Exact files/functions to modify

### P0 files

1. `src/utils/duration.ts` — new shared Arabic duration parser.
2. `test/intelligence.test.js` or new `test/duration.test.js` — duration parser tests.
3. `src/index.ts`
   - Replace local `parseArabicDurationMs` with shared parser.
   - Add pre-AI ambiguity gate for `رتب/نظم السيرفر`.
   - Add create-vs-existing guard before `planCompoundDiscordRequest` and before direct create paths.
   - Ensure all direct reply paths use `sendLongMessage`/new send wrapper when they can include tool/error output.
4. `src/services/conversation.ts`
   - Keep logging terms as action terms.
   - Add ambiguity terms so social handler never swallows management commands.
5. `src/services/toolIntent.ts`
   - Add/strengthen move/reorder/logging intent selection.
6. `src/intelligence/compound_planner.ts`
   - Add move/reorder detection.
   - Avoid create plan if resolved existing entity conflicts.
7. `src/services/aiCatalog.ts`
   - Strengthen language rule and create-vs-modify rule.
8. `src/utils/languageSanitizer.ts` — new.
9. `src/utils/discordTools.ts`
   - Include duration/capped info in timeout result.
   - Ensure returned data has `memberId`, `durationMs`, `durationLabelAr`.

### P1 files

1. `src/intelligence/entity_ledger.ts` — new or major refactor of `entity_registry.ts`.
2. `src/intelligence/entity_registry.ts`
   - Either wrap ledger or deprecate after migration.
   - Rebuild `lastCreated` from disk during initialize.
3. `src/services/toolTargeting.ts`
   - Use ledger resolver.
4. `src/index.ts executeToolWithAudit`
   - Record ledger events after success/failure.
   - Use ledger prompt context.
5. `src/intelligence/memory_manager.ts`
   - Add `conversationSummaryV2` and builder.
6. `src/intelligence/context_engine.ts`
   - Use summary/ledger context; remove duplicate entity prompt if needed.

### P2 files

1. `src/skills/catalog/admin_action_suite.skill.ts`
   - Use shared duration parser.
   - Convert logging setup into a registered executable skill if not moved elsewhere.
2. `src/utils/advancedDiscordActions.ts`
   - Return structured IDs and action metadata for all channel/role/guild actions.
3. `src/tools/community_builder.ts`
   - Ensure created role/channel IDs are returned in `createdEntities` consistently.
4. `src/tools/voice_manager.ts`
   - Return clean Arabic errors or allow wrapper to sanitize all messages.

### P3 files

1. Documentation (`README.md`, `ANALYSIS.md`) documenting ledger/safety behavior.
2. Optional migration script for `data/entity_cache.json` → `data/entity_ledger.json`.
3. Optional SQLite adapter.

## 6. Priorities

### P0 — Production correctness / visible bugs

1. Shared robust Arabic duration parser and tests.
2. Stop raw English/technical errors at every Discord reply path.
3. Add ambiguity clarification gate for `رتب/نظم السيرفر`.
4. Add create-vs-existing guard for channels/roles/categories.
5. Add language sanitizer for `cosa` and strengthen prompt.

### P1 — Context architecture

1. Implement Entity Ledger or evolve EntityRegistry into ledger.
2. Build a single `RequestResolution` pass before all handlers.
3. Add durable conversation summary V2 and inject it into every AI request.
4. Migrate explicit target resolution to ledger API.

### P2 — Tool result quality

1. Ensure all mutation tools return structured IDs and metadata.
2. Convert direct logging setup into a skill/tool for consistent execution and tests.
3. Add tests for move existing channel, logging setup, reorder ambiguity, and pending action continuation.

### P3 — Long-term polish

1. SQLite/Postgres persistence.
2. Dashboard/admin review of ledger events.
3. More Gulf dialect aliases and typo handling.
4. More reply formatting consolidation.

## 7. What needs your decision before implementation

No decision is needed for P0; the best implementation is straightforward and should be done immediately.

Decisions needed before P1/P2 architecture expansion:

1. Persistence backend:
   - Start with JSON `data/entity_ledger.json` now, or jump directly to SQLite?
   - Recommendation: JSON now, SQLite later.

2. Ledger retention:
   - Keep all events forever, or prune after N days?
   - Recommendation: keep current entity state forever, keep detailed events 30–90 days.

3. `رتب لي السيرفر` default:
   - Always ask clarification, or default to "reorder existing"?
   - Recommendation: always ask once because it caused real damage/duplicates.

4. Logging system template:
   - Fixed channels only (`mod-logs`, `message-logs`, `voice-logs`, `member-logs`, `audit-logs`) or also create separate role/channel permission audit logs?
   - Recommendation: fixed minimal template now.

5. Confirmation bypass phrase:
   - Keep allowing `باند مباشر بدون سؤال` / `واكد` to skip confirmation?
   - Recommendation: keep only for administrators, log explicitly, and maybe disable later if production misuse happens.

## Recommended next command

```txt
/skill:blueprint .rpiv/artifacts/research/2026-06-27_entity-ledger-context-and-arabic-nlp-stability.md
```
