---
date: 2026-06-17T10:50:16+0300
author: Abu Awad
commit: caeda6d
branch: main
repository: Opus
topic: "Build an Intelligent Arabic Discord AI Manager"
tags: [research, codebase, discord, arabic, ai-assistant, permissions, moderation, safety]
status: ready
last_updated: 2026-06-17T10:50:16+0300
last_updated_by: Abu Awad
---

# Research: Build an Intelligent Arabic Discord AI Manager

## Research Question
How should this Discord bot be upgraded from a weak command/tool executor into an intelligent Arabic AI assistant for Discord server management, without implementing yet?

The research inspected `prompt.md`, `Talk.md`, the current codebase, Discord/discord.js permission behavior, and the architecture needed for a safe tool-using assistant that understands Arabic intent, Discord entities, permissions, memory, multi-step plans, destructive safety, and natural Arabic replies.

## Summary
The root problem is not one missing regex or one weak prompt. The bot has several intelligence pieces, but they are fragmented: deterministic regex planners, prompt-only LLM instructions, post-hoc missing-intent checks, target resolution, memory, and Discord tools all operate in separate partial lanes.

The `Talk.md` failure shows the core issue: the first request contained delete + preserve + create + permission semantics, but `planCompoundDiscordRequest()` selected one create workflow and returned before the AI loop and missing-intent verification. Later turns exposed raw `<tool_call>` text because the normalizer only handles `<function>` syntax and final reply safety does not block unknown tool tags.

Recommended architecture: replace the current first-match regex workflow path with an LLM-produced structured plan, then run deterministic validators for entity resolution, Discord permission planning, destructive confirmations, role hierarchy, execution, verification, and Arabic summarization. Regex remains useful for normalization and high-confidence extraction, but it should not be the primary compound planner.

## Executive Summary
- Current deterministic workflows can silently drop subtasks because `src/intelligence/compound_planner.ts:64-100` returns the first matching workflow and `src/index.ts:1270-1334` returns before verification.
- Raw internal tool syntax can leak because `src/utils/functionTagNormalizer.ts:79-85` only recovers `<function>` tags, while `Talk.md:84-93` contains `<tool_call>` / `<parameter>` syntax that is sent as normal content.
- Discord permission tools are mostly expressive enough, but semantic mapping is inconsistent: `src/services/ai.ts:221` says `Stream`, `src/intelligence/arabic_nlp.ts:41` outputs `Stream`, while `src/utils/discordTools.ts:52` only maps `Video` to Discord `Stream`.
- Memory tracks recent entities but not groups, deleted entities, preserved entities, semantic aliases, or pending plans; this breaks references like “استبدلها”, “الروم الخاص”, and “ارجع المحادثة اقراء وطبق”.
- Safety is permission-gated but not confirmation-gated. User decision: confirmation must be mandatory for every destructive action.
- Moderation validates actor permissions and bot-vs-target hierarchy, but lacks actor-vs-target hierarchy, explicit bot capability checks, ambiguous member resolution, and confirmation.
- Tests cover parser/planner helpers but not the live `src/index.ts` execution/safety path, raw tag leakage, destructive confirmation, or moderation hierarchy.

## Top Root Causes
1. **First-match planning drops compound intent** — `src/intelligence/compound_planner.ts:64-87` handles multi-room creation and returns before the delete-preserve branch at `src/intelligence/compound_planner.ts:93-100`.
2. **Verification is bypassed** — deterministic workflow replies return at `src/index.ts:1323-1334`; verification only runs later in the AI path at `src/index.ts:1553-1588`.
3. **Raw tool syntax normalization is too narrow** — `src/utils/functionTagNormalizer.ts:79-85` only detects `<function>`, not `<tool_call>` or parameter tags.
4. **Tool schema and generated raw syntax diverge** — canonical `create_channels` expects `names` and `permissions` at `src/services/ai.ts:337-363`, but `Talk.md:84-93` leaked `name` and `permission_overwrites`.
5. **Permission meaning is split across prompt, parser, and executor** — `src/services/ai.ts:219-225`, `src/intelligence/arabic_nlp.ts:30-47`, and `src/utils/discordTools.ts:26-52` disagree on `Stream`/`Video`.
6. **Entity memory is object-level, not plan/reference-level** — `src/intelligence/entity_registry.ts:18-28` and `src/intelligence/memory_manager.ts:311-400` store entities but not batches, deleted objects, aliases, or pending workflows.
7. **Destructive safety has no central confirmation state** — high-risk execution routes exist at `src/index.ts:381-400`, but confirmation is not enforced at `executeToolWithAudit()` / `executeTool()`.
8. **Moderation resolution is exact-ID oriented** — `manage_members` requires exact `memberId` at `src/services/ai.ts:433`; `src/services/toolTargeting.ts:72-167` resolves channels/categories/roles but not members.

## Talk.md Failure Table

| Talk line | User message / bot reply | Correct interpretation | Actual behavior | Missing step | Root cause | Priority |
|---|---|---|---|---|---|---|
| `Talk.md:2` | User asks to create 3 rooms, one private/visible/locked, and first delete all rooms except `الو`. | Multi-step destructive workflow: confirm delete-all-except, preserve `الو`, create 3 channels, apply private-room permissions, summarize. | `Talk.md:7` replies only “تم إنشاء 3 قناة بنجاح.” | Delete/preserve omitted; permission detail not explained. | `compound_planner.ts:64-87` returns create workflow before delete branch; `index.ts:1334` skips verification. | P0 |
| `Talk.md:9` | “استبدلها ب فويس”. | Resolve “ها” to previously created group and convert/recreate as voice channels. | Bot describes intended plan and asks if correct at `Talk.md:14-24`. | No execution; no strong group memory. | Entity memory lacks batch/group reference; “ها” not resolved in `toolTargeting.ts:140-146`. | P1 |
| `Talk.md:26` | “صحيح”. | Confirmation should execute pending confirmed plan. | Bot says it will execute, then asks another question at `Talk.md:31-49`. | Pending plan not executed. | No durable pending-plan/confirmation state wired into `src/index.ts`. | P0 |
| `Talk.md:51` | User wants private room entrants to talk and open Video/screen share. | Apply voice overwrite: allow `ViewChannel`, `Connect`, `Speak`, `Stream` as appropriate. | Bot claims success at `Talk.md:56`, unverified. | Screen share may be dropped. | `Stream` is not in `permissionMap`; no verification of final overwrites. | P0 |
| `Talk.md:60` | “ارجع المحادثة اقراء وطبق”. | Reconstruct previous plan, identify missed steps, ask/execute safely. | Bot restates history and asks confirmation again at `Talk.md:65-73`. | Does not recover missed execution. | No correction/reapply intent; no plan memory. | P1 |
| `Talk.md:75` | “صحيح”. | Execute confirmed destructive + creation + permissions plan. | Bot leaks `<tool_call>` and `<parameter>` tags at `Talk.md:84-93`. | Tool calls not normalized/executed. | Normalizer only handles `<function>`; final send path does not block unknown tool tags. | P0 |
| `Talk.md:95` | “ابدا”. | Start execution if a pending plan exists, with destructive confirmation semantics. | Bot claims everything was done at `Talk.md:100-110`. | No verified execution results. | Confirmation-only turns can proceed without tools; reply not grounded in `completedToolResults`. | P0 |

## Detailed Findings

### Current Architecture Map
- **Discord entrypoint**: `src/index.ts:1012` registers `Events.MessageCreate`; `src/index.ts:1014-1109` filters messages, strips mentions/`!humanguard`, and checks authorization.
- **Context enrichment**: `src/index.ts:1177-1261` runs `ContextAnalyzer`, resolves explicit targets, builds system prompt, injects memory via `memoryManager.buildEntityContext()`, and stores conversation history.
- **Direct Arabic permission shortcut**: `src/index.ts:1123-1148` calls `buildArabicPermissionOperations()` and executes permission operations before the general AI path.
- **Deterministic workflow path**: `src/index.ts:1270-1334` calls `planCompoundDiscordRequest()`, executes `WorkflowEngine`, sends a reply, and returns early.
- **LLM/tool-call path**: `src/index.ts:1337-1467` normalizes limited raw tags, executes structured `tool_calls`, applies explicit targets, and stores tool results.
- **Final reply path**: `src/index.ts:1476-1615` asks the model for natural language after tools, optionally runs missing-intent verification, then sends `finalContent`.
- **Tool definitions/provider calls**: `src/services/ai.ts:265-471` defines canonical tools; request construction occurs at `src/services/ai.ts:822-839`; provider calls at `src/services/ai.ts:984-1021`; response orchestration at `src/services/ai.ts:1026-1044`.
- **Discord tools**: `src/utils/discordTools.ts` implements creation/deletion/permissions/moderation; permission map at `src/utils/discordTools.ts:26-52`.
- **Arabic NLP**: `src/intelligence/arabic_nlp.ts:3-210` detects regex intents and builds Arabic permission operations.
- **Targeting/memory**: `src/services/toolTargeting.ts:72-252`, `src/intelligence/entity_registry.ts:18-321`, and `src/intelligence/memory_manager.ts:311-400` resolve recent objects and inject memory context.
- **Safety/moderation**: `src/index.ts:204-310` checks actor permissions; `src/utils/security.ts:52-88` checks bot-vs-target hierarchy; `src/utils/discordTools.ts:556-668` executes moderation.
- **Tests**: `test/intelligence.test.js` and `src/tests/verify.ts` cover parsing/planning helpers but not the full message execution loop.

### Why Multi-Step Arabic Requests Miss Parts
`planCompoundDiscordRequest()` is first-match, not plan-composition. For the first Talk request, the multi-room create branch at `src/intelligence/compound_planner.ts:64-87` matches and returns a single `create_channels` step. The delete-preserve-create branch at `src/intelligence/compound_planner.ts:93-100` never runs.

Because `src/index.ts:1323-1334` sends the workflow reply and returns, the later missing-intent verifier at `src/index.ts:1553-1588` never compares requested intents against executed tools. Even in the AI path, `findMissingIntents()` only checks broad tool categories at `src/services/intentVerifier.ts:20-29` and cannot verify exact counts, names, channel types, exception clauses, or permission state.

### Why Replies Are Generic or Ungrounded
Workflow replies are produced by `workflowEngine.describeResults()` at `src/index.ts:1323-1326`, which only summarizes the executed workflow steps, not the original request or skipped subtasks. In the LLM path, final content can be set from model text at `src/index.ts:1602-1607`; if no verified tool results exist, the bot can still claim success as seen in `Talk.md:100-110`.

The reply layer needs to summarize from an execution ledger: requested actions, confirmations, executed tools, skipped actions, failures, and verified final state. It should never report success from prose alone.

### Why Raw Internal Function Syntax Leaks
Canonical tools use OpenAI-style `AIMessage.tool_calls` at `src/services/ai.ts:7-18`. The execution loop only runs if `aiResponse.tool_calls` exists at `src/index.ts:1346`.

When a provider emits raw tags as normal content, `normalizeFunctionTags()` is the recovery path, but it only checks for `<function>` at `src/utils/functionTagNormalizer.ts:79-85`. `Talk.md:84-93` uses `<tool_call>`, `<arg_key>`, `<arg_value>`, and `<parameter>`, so it bypasses normalization and reaches `sendLongMessage()` unchanged at `src/index.ts:1614-1649`.

### Discord Permission Research Summary
Current Discord API behavior confirms the permission semantics this bot must model:
- `VIEW_CHANNEL` allows viewing a channel; for voice/stage it includes seeing/joining context, while `CONNECT` controls joining voice/stage.
- `SEND_MESSAGES` controls sending in text-like channels.
- `CONNECT`, `SPEAK`, and `STREAM` control voice join, speaking, and going live/screen share.
- Permission overwrites apply in order: base permissions, `@everyone` overwrite, role overwrites, member overwrite.
- Denying `VIEW_CHANNEL` implicitly denies other channel usage; denying `CONNECT` in voice/stage implicitly blocks other voice interactions.
- Discord hierarchy restricts bots/users by highest role; `@everyone` starts at role position 0.
- discord.js exposes member capability properties such as `kickable`, `manageable`, and `moderatable` that should be used for preflight checks.

Current code partially models this:
- `src/utils/discordTools.ts:26-52` maps permission strings to `PermissionFlagsBits`.
- `src/intelligence/arabic_nlp.ts:30-47` maps Arabic phrases to permission intents.
- `src/utils/discordTools.ts:441-490` applies overwrites via `permissionOverwrites.edit()`.

Main gap: `Stream`/`Video` inconsistency. `src/services/ai.ts:221` and `src/intelligence/arabic_nlp.ts:41` use `Stream`, but `src/utils/discordTools.ts:52` maps only `Video` to `PermissionFlagsBits.Stream`. Therefore “سكرين شير” can be parsed and then silently dropped at execution.

### Arabic Intent Understanding Design
The bot should use a hybrid system, but with clear ownership:
1. **Normalization layer**: normalize Arabic variants, common misspellings, Saudi/Gulf dialect, Discord slang, and mixed Arabic/English. Existing sources include `src/intelligence/dialect_engine.ts:113-191`, but they are not unified with `arabic_nlp.ts`.
2. **LLM semantic interpretation layer**: user decision: use LLM-produced structured plans plus deterministic validators. The LLM should output a typed plan with intents, entities, missing information, destructive flags, and confidence.
3. **Deterministic entity resolver**: resolve channels, roles, members, categories, recent entities, groups, aliases, and preserved/deleted references using guild state + memory + fuzzy matching.
4. **Discord permission planner**: centralize text/voice/forum/category permission semantics and convert natural requests into canonical overwrite operations.
5. **Safety layer**: enforce mandatory confirmations for destructive actions before execution.
6. **Execution verifier**: verify each requested subtask against tool results and Discord final state.
7. **Reply layer**: produce Arabic replies grounded only in the execution ledger.

Regex should remain for high-confidence extraction and safety checks, not as the primary multi-step planner.

### Entity and Reference Resolution Findings
`RegisteredEntity` at `src/intelligence/entity_registry.ts:18-28` stores `type`, `id`, `name`, `sourceTool`, timestamps, metadata, and optional `conversationChannelId`. `MemoryManager.rememberEntities()` at `src/intelligence/memory_manager.ts:311-345` deduplicates entities and stores latest channel/role/category IDs. `buildEntityContext()` at `src/intelligence/memory_manager.ts:385-400` injects recent entities into the prompt.

This is useful for “the last channel,” but insufficient for Talk-style references:
- No batch/group memory for “the 3 rooms I just created”.
- No tombstones for deleted channels from `delete_channels`.
- No preserved-channel memory for “except الو”.
- No semantic aliases like “الروم الخاص”, “المقفل”, “اللي يشوفونه بس ما يدخلونه”.
- No pending plan/correction memory for “ارجع المحادثة اقراء وطبق”.
- `resolveExplicitToolTargets()` at `src/services/toolTargeting.ts:140-146` can map generic “الروم” to latest channel, but not pronouns like “ها” or operation groups.

### Safety and Moderation Findings
Actor authorization exists:
- `hasAnyPermission()` accepts `Administrator` or required permissions at `src/index.ts:204-207`.
- `validateAIToolPermission()` maps tools to required Discord permissions at `src/index.ts:210-279`.
- `manage_members` action-specific permission mapping occurs at `src/index.ts:242-260`.

But destructive safety is not centralized:
- `delete_channels` directly calls `deleteChannels()` at `src/index.ts:381-382`.
- `deleteChannels()` deletes each ID and can return success even with partial failures at `src/utils/discordTools.ts:221-255`.
- Active-channel delete filtering exists only in the raw AI loop at `src/index.ts:1394-1407`, not inside `executeTool()` or `deleteChannels()`.
- Mass target expansion occurs in `src/services/toolTargeting.ts:134-138` and is then treated like ordinary deletion.

Moderation implementation:
- `manageMembers()` executes kick/ban/timeout/etc. at `src/utils/discordTools.ts:556-668`.
- Bot-vs-target hierarchy is checked by `validateMemberHierarchy()` at `src/utils/security.ts:52-88`.
- Skill wrappers map ban/kick/timeout to `manage_members` at `src/skills/moderation/ban.skill.ts:13-18`, `kick.skill.ts:13-18`, and `timeout.skill.ts:13-22`.

Moderation gaps:
- No actor-vs-target role hierarchy check.
- No explicit bot permission/capability preflight using discord.js `bannable`, `kickable`, `moderatable`, or `manageable`.
- No ambiguous member resolver.
- No confirmation for ban/kick/timeout.
- No test coverage for moderation hierarchy or destructive confirmation.

## Proposed Architecture

### A. Intent Understanding Layer
Input Arabic message → normalized text + dialect/slang annotations + LLM structured interpretation.

The structured plan should include:
- `userIntent`
- `actions[]` with type, target descriptors, destructive flag, dependencies, and confidence
- `entities[]` with unresolved/resolved status
- `missingInformation[]`
- `requiresConfirmation`
- `replyTone`
- `sourceEvidence` referencing user text spans

### B. Entity Resolution Layer
Resolve descriptors into Discord IDs using:
- guild cache/API state
- exact mentions/IDs
- fuzzy Arabic/English name matching
- recent entities
- recent batches/groups
- deleted/preserved tombstones
- semantic aliases such as private/locked/visible-only
- ambiguity thresholds that trigger clarification

### C. Discord Permission Planner
Centralize permission logic. It should translate:
- “visible but locked” text: allow `ViewChannel`, deny `SendMessages`.
- “visible but cannot enter” voice: allow `ViewChannel`, deny `Connect`.
- “can enter/talk/screen share” voice: allow `ViewChannel`, `Connect`, `Speak`, `Stream`.
- “hidden except role”: deny `ViewChannel` for `@everyone`, allow required permissions for role.
- category inheritance vs child overwrites.

### D. Operation Planner
Convert resolved intents into ordered steps:
- destructive confirmations first
- delete except preserved targets
- create category before children
- create channels before editing permissions
- create role before assigning/overwriting
- moderation preflight before action
- verification after each action group

### E. Safety Layer
User decision: always require confirmation for destructive actions.

Mandatory confirmations should cover:
- deleting channels/categories
- deleting all except X
- banning/kicking/timing out members
- mass role changes
- overwriting category permissions
- bulk message deletion
- advanced destructive actions such as mass invite deletion, automod deletion, role mass assign/remove

This gate belongs at the central execution boundary where final expanded args, actor, guild, and tool name are available: before `executeToolWithAudit()` executes the mutation.

### F. Reply Layer
Replies must be generated from a verified execution ledger, not generic model text.

Good final reply format should include:
- completed action names and counts
- exact channel/role/member names
- preserved/skipped targets
- failures with reasons
- final permission behavior in plain Arabic
- whether any action is pending confirmation or clarification

### G. Test Layer
Tests should cover paraphrases and live execution boundaries, not only helper functions.

## Code References
- `Talk.md:2` — Initial multi-step Arabic request with delete/preserve/create/permission semantics.
- `Talk.md:7` — Bot only reports 3 created channels.
- `Talk.md:84-93` — Raw `<tool_call>` / `<parameter>` syntax leaked to Discord.
- `Talk.md:100-110` — Bot claims success without verified execution.
- `src/index.ts:1012-1109` — Main message event handling, filtering, targeting, authorization.
- `src/index.ts:1123-1148` — Direct Arabic permission operation shortcut.
- `src/index.ts:1248-1261` — System prompt, target context, memory injection.
- `src/index.ts:1270-1334` — Deterministic workflow execution and early return.
- `src/index.ts:1337-1467` — Tool-call normalization and execution loop.
- `src/index.ts:1394-1407` — Active conversation channel delete filtering, raw-loop only.
- `src/index.ts:1553-1588` — Missing-intent verification pass.
- `src/services/ai.ts:265-471` — Canonical tool schema definitions.
- `src/services/ai.ts:822-839` — Provider request body and tool selection.
- `src/services/ai.ts:984-1021` — Groq/Cerebras provider calls.
- `src/utils/functionTagNormalizer.ts:73-126` — Raw `<function>` recovery only.
- `src/intelligence/compound_planner.ts:23-160` — Deterministic compound planner.
- `src/services/intentVerifier.ts:51-88` — Multi-intent detection and missing-intent checks.
- `src/intelligence/arabic_nlp.ts:30-210` — Arabic permission phrase parser and operation builder.
- `src/utils/discordTools.ts:26-52` — Permission string map.
- `src/utils/discordTools.ts:441-532` — Permission overwrite execution.
- `src/services/toolTargeting.ts:72-252` — Explicit target resolution and delete-all-except expansion.
- `src/intelligence/entity_registry.ts:18-321` — Entity registration from tool results.
- `src/intelligence/memory_manager.ts:311-400` — Session entity memory and prompt context.
- `src/index.ts:204-310` — Actor permission validation.
- `src/utils/security.ts:52-88` — Bot-vs-target member hierarchy validation.
- `src/utils/discordTools.ts:556-668` — Moderation actions.
- `src/utils/discordTools.ts:761-782` — Bulk message deletion.
- `test/intelligence.test.js:205-316` — Existing helper coverage for compound workflows, permissions, and delete-all-except targeting.
- `src/tests/verify.ts:45-90` — Verify script coverage for Arabic permissions and atomic create workflow.

## Integration Points

### Inbound References
- `src/index.ts:1012` — Discord `MessageCreate` is the primary inbound path for user requests.
- `src/skills/moderation/ban.skill.ts:13-18` — Skill wrapper maps ban to `manage_members`.
- `src/skills/moderation/kick.skill.ts:13-18` — Skill wrapper maps kick to `manage_members`.
- `src/skills/moderation/timeout.skill.ts:13-22` — Skill wrapper maps timeout to `manage_members`.
- `test/intelligence.test.js:205-316` — Tests depend on planner/targeting helper behavior.

### Outbound Dependencies
- `src/index.ts:176-181` — AI calls are rate-limited through `getAIResponse()`.
- `src/services/ai.ts:984-1021` — Groq and Cerebras chat completion APIs.
- `src/utils/discordTools.ts:189-195` — Channel creation applies permission overwrites.
- `src/utils/discordTools.ts:490` — Permission overwrite mutation via Discord.js.
- `src/utils/discordTools.ts:584-603` — Discord moderation API calls for kick/ban/timeout.

### Infrastructure Wiring
- `package.json:5` — Runtime entry is `dist/index.js`.
- `package.json:8-11` — Build/test scripts compile with `tsc` and run node tests + verify script.
- `package.json:31` — Discord.js dependency is `^14.15.3`.
- `tsconfig.json:7-15` — Source root is `src`, output is `dist`.

## Architecture Insights
- The current system is an uneven hybrid: regex shortcuts, LLM tool calls, prompt annotations, memory injection, and post-hoc verification all exist, but no single structured plan is authoritative.
- Permission handling should be centralized because Discord semantics are cross-cutting and easy to misapply when split between prompt text and tool args.
- Entity resolution needs to model user references, not just Discord objects.
- Safety should be a deterministic gate between plan and execution, not a prompt instruction.
- Verification should compare the original structured plan against the execution ledger and final Discord state.

## Exact Files / Functions to Modify Later
Do not implement yet; these are the likely change surfaces for the next design/blueprint.

### P0
- `src/index.ts` — replace early deterministic workflow return with plan/validate/confirm/execute/verify pipeline; centralize destructive gate before mutations.
- `src/intelligence/compound_planner.ts` — demote or replace first-match regex planner with structured LLM plan support.
- `src/utils/functionTagNormalizer.ts` — block/recover `<tool_call>` / `<parameter>` raw syntax or prevent it from being sent.
- `src/utils/discordTools.ts` — align permission names, especially `Stream`; centralize permission resolver errors.
- `src/services/ai.ts` — tool schema/prompt should require structured plan/tool calls and not encourage raw tags.

### P1
- `src/intelligence/entity_registry.ts` — add batch groups, deleted tombstones, preserved targets, semantic aliases, and plan metadata.
- `src/intelligence/memory_manager.ts` — store pending plans, confirmations, corrections, recent groups, and references.
- `src/services/toolTargeting.ts` — add member resolution, pronoun/group resolution, ambiguity handling.
- `src/utils/security.ts` — add actor-vs-target hierarchy and explicit bot capability checks.

### P2
- `src/intelligence/arabic_nlp.ts`, `src/intelligence/dialect_engine.ts`, `src/intelligence/context_analyzer.ts` — unify Arabic normalization/dialect extraction into one routed pipeline.
- `src/services/intentVerifier.ts` — upgrade from broad tool category checks to structured subtask verification.

### P3
- Reply generation around `src/index.ts:1476-1615` — generate final Arabic summary from execution ledger.
- Tests under `test/` and `src/tests/verify.ts` — add scenario and live-boundary coverage.

## P0 / P1 / P2 / P3 Fix Plan

### P0 — Must fix before claiming intelligence
- Mandatory confirmation gate for all destructive actions.
- Structured plan before execution, with LLM interpretation + deterministic validators.
- Prevent raw tool syntax leakage.
- Fix `Stream`/screen-share permission mapping.
- Ensure deterministic workflow path cannot skip verification.
- Never claim success without tool/execution ledger evidence.

### P1 — Core assistant behavior
- Plan memory and correction handling for “ارجع المحادثة اقراء وطبق”.
- Batch/group entity memory for “استبدلها”.
- Deleted/preserved entity memory.
- Central permission planner for text/voice/category/forum semantics.
- Member resolver and moderation hierarchy checks.

### P2 — Robust Arabic understanding
- Unified Arabic normalization and dialect pipeline.
- Fuzzy matching with confidence and ambiguity clarification.
- Multi-intent/subtask verifier.
- Current-state verification for permissions and channel structures.

### P3 — UX polish and breadth
- Warmer Arabic reply tone with names/counts/failures.
- Broader Saudi/Gulf slang and mixed Arabic-English tests.
- Richer audit logs and diagnostics.
- Historical artifact cleanup after new architecture stabilizes.

## Testing Strategy
Add tests in layers:

1. **Plan parsing tests**
   - Arabic paraphrases for delete-all-except + create + permissions.
   - Mixed Arabic/English permission words: `Video`, `screen`, `سكرين شير`.
   - Corrections and confirmations: “صحيح”, “ابدا”, “ارجع المحادثة”.

2. **Permission planner tests**
   - Text visible-but-locked: `ViewChannel` allow + `SendMessages` deny.
   - Voice visible-but-cannot-enter: `ViewChannel` allow + `Connect` deny.
   - Voice can enter/talk/stream: `Connect`, `Speak`, `Stream` allow.
   - Category inheritance vs child overrides.

3. **Entity/memory tests**
   - Recent channel, role, category.
   - Recent batch: “استبدلها”.
   - Preserved channel: “لا تحذف روم الو”.
   - Deleted-channel tombstone and stale references.
   - Ambiguous names trigger clarification.

4. **Safety tests**
   - Mass delete requires confirmation.
   - Ban/kick/timeout require confirmation.
   - Active channel cannot be deleted from any execution path.
   - Role mass assign/remove requires confirmation.

5. **Moderation tests**
   - Actor lacks permission.
   - Bot lacks permission.
   - Bot lower than target.
   - Actor lower than target.
   - Ambiguous member resolution.
   - `bannable`, `kickable`, `moderatable` preflight.

6. **Leakage/reply tests**
   - Raw `<function>` and `<tool_call>` syntax never reaches Discord.
   - Final success reply requires verified execution ledger.
   - Generic summaries are replaced with names/counts/skipped/failures.

## Implementation Phases
1. **P0 safety and leakage hardening** — block raw tool syntax, central destructive confirmation, fix `Stream`, ensure all paths verify before success replies.
2. **Structured planning layer** — introduce LLM structured plan output and validators; demote regex planner to helper/high-confidence extraction.
3. **Entity and permission intelligence** — add plan memory, batch references, semantic aliases, member resolver, and central permission planner.
4. **Moderation and hierarchy** — actor/bot hierarchy, capability preflight, confirmations, and moderation summaries.
5. **Verification and reply ledger** — verify subtasks against Discord state and generate Arabic replies from execution facts.
6. **Test expansion** — cover Talk.md failures, paraphrases, destructive actions, permission edge cases, and raw-tag leakage.

## Precedents & Lessons
Similar changes already happened in this repository:
- `.rpiv/artifacts/research/2026-06-16_22-36-37_discord-ai-bot-failures.md` — prior research on routing, targeting, memory, and prompt failures.
- `.rpiv/artifacts/plans/2026-06-16_23-01-29_discord-ai-bot-improvements.md` — prior plan that required not exposing raw function syntax and resolving permissions from session memory.
- `RESEARCH_RESULTS.md` — prior recommendations to centralize permission checks and audit logs.
- `backups/AI_LEGACY_BACKUP.md` — legacy AI backup is encoding-damaged and should not be restored wholesale.

### Composite Lessons
- Prior work improved pieces of the system, but the remaining bug class is architectural: no authoritative structured plan and execution ledger.
- Prompt rules alone are insufficient for safety; destructive and permission behavior must be deterministic.
- Restoring legacy AI code would be risky; mine it for tested ideas only.

## Historical Context (from `.rpiv/artifacts/`)
- `.rpiv/artifacts/research/2026-06-16_22-36-37_discord-ai-bot-failures.md` — prior bot failure research.
- `.rpiv/artifacts/plans/2026-06-16_23-01-29_discord-ai-bot-improvements.md` — prior improvement plan.

## Developer Context
**Q (`src/index.ts:381-382`, `src/services/toolTargeting.ts:134-138`): should confirmation be mandatory for every destructive action, or can trusted admins bypass some confirmations?**
A: Always confirm. Mark confirmation mandatory for destructive actions regardless of admin status.

**Q (`src/intelligence/compound_planner.ts:64-100`, `src/index.ts:1270-1334`): should the future architecture use LLM structured planning plus deterministic validators, or keep expanding the deterministic planner?**
A: Use LLM plan + validators. Regex should not remain the primary compound planner.

## User Decisions Needed Before Coding
- Exact confirmation UX: Arabic wording, timeout, and whether confirmation should show a compact action summary or full diff.
- Which destructive actions require typed confirmation versus simple yes/no.
- Whether to support undo/rollback for failed multi-step operations where Discord permits it.
- Preferred Arabic tone: formal, Saudi casual, or adaptive per user tone.
- Whether the bot should ask clarification proactively when confidence is low, or only when multiple concrete targets exist.
- Whether member moderation should require confirmation for every single ban/kick/timeout or only after the bot resolves the member and shows the target.

## Related Research
- None created during this run beyond the historical artifacts listed above.

## Open Questions
- Should destructive confirmations be persisted per guild/channel/user, and for how long?
- What is the exact threshold for “ambiguous enough to ask clarification” in fuzzy Arabic entity matching?
- Should forum/announcement channel permissions be part of the first implementation phase or deferred after text/voice/category stability?
- Should the assistant store recent plans only in memory, or also in a durable per-guild audit store?

## External References
- Discord API Permissions — `https://discord.com/developers/docs/topics/permissions`
- discord.js PermissionFlagsBits — `https://discord.js.org/docs/packages/discord.js/stable/PermissionFlagsBits:Variable`
- discord.js PermissionOverwrites — `https://discord.js.org/docs/packages/discord.js/stable/PermissionOverwrites:Class`
- discord.js GuildMember — `https://discord.js.org/docs/packages/discord.js/stable/GuildMember:Class`

## Recommended Next Command
`/skill:blueprint .rpiv/artifacts/research/2026-06-17_10-50-16_intelligent-arabic-discord-ai-manager.md`
