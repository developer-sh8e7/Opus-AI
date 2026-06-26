---
date: 2026-06-18T09:27:09+0300
author: Abu Awad
commit: no-commit
branch: no-branch
repository: unknown
topic: "FABLE5_PROBLEM_REPORT.md"
tags: [research, codebase, discord-bot, arabic-nlp, ai-tools, skills]
status: ready
last_updated: 2026-06-18T09:27:09+0300
last_updated_by: Abu Awad
---

# Research: FABLE5_PROBLEM_REPORT.md

## Research Question
Research `FABLE5_PROBLEM_REPORT.md` as current failing behavior in the Opus/Fable 5 Discord bot codebase, tracing the reported failures through live code paths for memory continuity, target resolution, compound workflows, Arabic permissions, moderation tools, AI fallback, conversation language, and executable skills.

## Summary
The live code contains several deterministic repair paths for failures described in the report, but under the developer-provided framing those should be treated as still-failing or fragile until runtime-verified. Newly created channels should flow from `createChannels()` into `EntityRegistry` and `MemoryManager`, then back into `resolveExplicitToolTargets()` for follow-up references like “الروم”; failures now concentrate around cache misses, name ambiguity, implicit-reference gaps, and AI final-response contradiction. Arabic permission handling is channel-overwrite based and can correctly express “see but cannot enter”, but compound create+configure is regex-fragile and only recognizes narrow name-marker forms. AI reliability issues have a shared root: provider failures from initial calls, result wrapping, or missing-intent verification all collapse to the same generic Arabic temporary error, while language/personality consistency is weakened by split prompt sources. Skills are discoverable and executable only through a full registry/manifest/tool-selection/permission chain; adding skill files alone does not make them affect live reasoning.

## Detailed Findings

### 1. Created room continuity and follow-up target resolution
- `createChannels()` returns both entity objects and first-channel shortcut data: `src/utils/discordTools.ts:140-142` declares `createdEntities`/`channelId`, `src/utils/discordTools.ts:203-204` pushes created channel entities, and `src/utils/discordTools.ts:216-217` returns `channelId: createdEntities[0]?.id`.
- `executeToolWithAudit()` is the handoff point: after `executeTool()`, it registers tool-created entities and remembers them in the active conversation at `src/index.ts:479-487`.
- `EntityRegistry.registerToolResult()` reads `result.createdEntities`, falls back to names, resolves Discord channels, and registers channel/category entities at `src/intelligence/entity_registry.ts:156-181`.
- `MemoryManager.rememberEntities()` converts registry entities to session entities, deduplicates by guild/type/id, and updates `last_channel_id` for channels/threads at `src/intelligence/memory_manager.ts:314-349`.
- `MemoryManager.buildEntityContext()` exposes `[SESSION_ENTITIES]`, `last_channel_id=...`, and exact IDs to the AI prompt at `src/intelligence/memory_manager.ts:388-401`; `src/index.ts:1518-1524` includes this context in the AI system prompt.
- Follow-up target recovery happens twice: pre-AI via `memoryManager.getRecentEntities()` and `resolveExplicitToolTargets()` at `src/index.ts:1373-1378`, then again in the AI path at `src/index.ts:1456-1461`.
- `resolveExplicitToolTargets()` can recover implicit room references only if text contains room/channel words and memory/registry has a latest channel: `src/services/toolTargeting.ts:157-162`.
- If a wrong/missing/stale `channelId` reaches the final Discord tool, `editPermissions()` returns “القناة المطلوبة غير موجودة في السيرفر.” at `src/utils/discordTools.ts:451-453`.

### 2. Named, implied, and ID-only channel targeting
- Name matching normalizes Arabic and separators via `normalizeWords()` / `normalizeText()` at `src/services/toolTargeting.ts:22-31` and `src/services/toolTargeting.ts:57-59`.
- `findNamedMatches()` tries exact normalized phrase matching first, keeps only the longest normalized match when possible, and then falls back to word-set matching at `src/services/toolTargeting.ts:34-53`.
- `resolveExplicitToolTargets()` extracts mentions, raw snowflakes, named channel/category/role matches, and session entities at `src/services/toolTargeting.ts:89-173`.
- Raw channel IDs are accepted only if present in `guild.channels.cache` at `src/services/toolTargeting.ts:129-135`; this can make valid uncached IDs invisible to resolver logic.
- `applyExplicitTargets()` injects a single resolved channel into `edit_permissions`, but returns clarification errors for multiple channel/role matches at `src/services/toolTargeting.ts:199-220`.
- ID-only continuations are handled by `buildPendingPermissionPrompt()`: it requires an ID-only message, cached non-category channel, and a recent permission-like prompt at `src/index.ts:696-704`.
- A misleading “ما عدلت شيء” can be introduced after successful execution because `src/index.ts:1734-1748` builds a deterministic success reply but asks the AI to wrap it, and `src/index.ts:1761-1766` sends the AI wrapper when present.

### 3. Compound create-and-configure workflow
- `planCompoundDiscordRequest()` recognizes the single-room compound form only when the normalized text matches a regex requiring `اسمه|اسمها|باسم` before the name at `src/intelligence/compound_planner.ts:25-27`.
- For matching text with `الكل/الجميع/everyone`, it calls `parseArabicPermissions()` and embeds permissions directly into a single `create_channels` step at `src/intelligence/compound_planner.ts:28-53`.
- The workflow branch bypasses a normal AI request when a deterministic workflow is found: `src/index.ts:1541-1548`.
- `WorkflowEngine.execute()` enforces declared dependencies and resolves references before each step at `src/intelligence/workflow_engine.ts:49-77`.
- `$create_category.channelId` references are resolved by walking prior step results in `WorkflowEngine.resolveReferences()` at `src/intelligence/workflow_engine.ts:96-115`.
- Multi-step planner output creates category/text/voice/role/configure steps, including `categoryId: '$create_category.channelId'`, at `src/intelligence/compound_planner.ts:114-164`.
- Fragility: `configure_role` depends on `create_role` but not explicitly on `create_category` at `src/intelligence/compound_planner.ts:150-154`; sequential execution usually masks this, but dependency failure semantics do not.
- Successful workflow tool results re-enter entity/memory registration through `executeToolWithAudit()` or skill inline registration at `src/index.ts:1592-1599` and `src/index.ts:1604-1611`.

### 4. Arabic permission extraction and channel-overwrite semantics
- Arabic permission phrases map directly to Discord permission names in `PERMISSION_PHRASES`: examples include `ViewChannel`, `Connect`, `Stream`, `ManageChannels`, `MoveMembers`, `MuteMembers`, and `DeafenMembers` at `src/intelligence/arabic_nlp.ts:51-61`.
- Deny wins over allow because `permissionNames()` builds a deny set and filters denied permissions from allow at `src/intelligence/arabic_nlp.ts:143-159`.
- `buildArabicPermissionOperations()` requires a concrete non-category channel from mention, raw ID, or exact recent entity name at `src/intelligence/arabic_nlp.ts:164-187`.
- For everyone-targeted permission requests, it creates an `edit_permissions` operation targeting the guild ID as the `@everyone` role at `src/intelligence/arabic_nlp.ts:197-204`.
- The direct permission block strips dangerous `@everyone` allows for `ManageChannels`, `ManageRoles`, and `Administrator` at `src/index.ts:1389-1397`.
- `editPermissions()` fetches the channel, validates role/member hierarchy, builds overwrite booleans, and calls `channel.permissionOverwrites.edit(...)` at `src/utils/discordTools.ts:450-493`.
- Permission names are resolved through `permissionMap` and `resolvePermission()` at `src/utils/discordTools.ts:26-83`.
- The AI catalog explicitly says “لا تعدل الرتبة، عدل برمشنات الروم” means channel permission overwrites only at `src/services/aiCatalog.ts:121`, and the tool schema describes `edit_permissions` as one channel overwrite at `src/services/aiCatalog.ts:245`.

### 5. Category-wide mention permission sweep
- `handleDirectMentionSweepRequest()` requires mention-removal wording plus category-wide wording at `src/index.ts:765-768`.
- The direct handler uses the first resolved category ID and, if absent, asks for a category mention/ID at `src/index.ts:770-773`.
- It forces `includeEveryone`, `includeRoles`, and `includeMembers` to `true` when building `sweep_permission_overwrites` args at `src/index.ts:776-782`.
- AI-generated sweep calls can also receive explicit category injection through `applyExplicitTargets()` at `src/services/toolTargeting.ts:239-245`.
- `sweepPermissionOverwrites()` expands `categoryId` into cached child channels at `src/utils/discordTools.ts:565-569`.
- Candidate collection includes `@everyone`, role/member overwrites that currently allow the target permission, and base guild roles whose permissions include `MentionEveryone` at `src/utils/discordTools.ts:594-611`.
- The sweep writes channel-level deny overwrites with `channel.permissionOverwrites.edit(...)` at `src/utils/discordTools.ts:615-624`; it does not remove base permissions from the role object.
- Therefore, the report case where `@everyone` was fixed but a role like “مشتري” retained mention permission is addressed only if execution reaches the sweep path, not if the AI chooses plain `edit_permissions` or `bulk_permission_update`.

### 6. Voice disconnect and voice user-limit handling
- AI catalog rules distinguish voice disconnect from server kick: `src/services/aiCatalog.ts:119` says “طرد من الروم / دسكنوكت” means `manage_members` action `voicekick`, and `src/services/aiCatalog.ts:120` says voice user limits use `channel_operations` action `voice_set_user_limit`.
- The deterministic voice handler detects disconnect and limit requests at `src/index.ts:707-713`.
- ID-only voice continuations are bridged by `buildPendingVoicePrompt()` at `src/index.ts:686-693`.
- `resolveMemberIdFromText()` accepts user mentions/raw snowflakes while skipping IDs known to be channels or roles at `src/index.ts:652-661`.
- Voicekick direct execution builds `{ action: 'voicekick', memberId, data: { reason } }` and calls `manage_members` at `src/index.ts:732-737`.
- Voice user-limit direct execution uses the requesting member’s current voice channel, not `resolveExplicitToolTargets()`, then calls `channel_operations` at `src/index.ts:715-747`.
- `validateAIToolPermission()` maps `voicekick` to `MoveMembers`, not `KickMembers`, at `src/index.ts:246-257`.
- `manageMembers()` skips member hierarchy validation for voice-state actions and calls `member.voice.disconnect()` for `voicekick` at `src/utils/discordTools.ts:667-718`.
- `voice_set_user_limit` routes through `executeAdvancedDiscordAction()` / `executeChannelAction()`, requires channel-management capability, and calls `channel.setUserLimit(...)` at `src/utils/advancedDiscordActions.ts:246-252` and `src/utils/advancedDiscordActions.ts:318-321`.

### 7. Arabic conversation and language consistency
- Before any conversation reply, the handler cleans the prompt and updates user profile language preference at `src/index.ts:1344-1359`.
- `getConversationReply()` short-circuits matched small-talk before AI at `src/index.ts:1361-1365`.
- Conversation normalization and action-term exclusion live in `src/services/conversation.ts:41-60`; “كيف حالك/كيفك/شلونك...” returns a fixed warm Arabic reply at `src/services/conversation.ts:62-63`.
- Even short-circuited replies are remembered by `rememberDirectInteraction()` in memory/context at `src/index.ts:523-546`.
- `ContextEngine.detectLanguage()` counts Arabic/Latin and can return `mixed`, while `getDominantLanguage()` collapses anything not exactly English to Arabic at `src/intelligence/context_engine.ts:80-94`.
- `MemoryManager.buildUserPreferenceContext()` emits `preferred_language` and message count, but this is advisory prompt text rather than deterministic routing at `src/intelligence/memory_manager.ts:417-424`.
- `SYSTEM_PROMPT` has stronger Arabic/personality rules at `src/services/aiCatalog.ts:45-51`, but the main AI path builds a custom system prompt instead at `src/index.ts:1518-1525`.
- OpenAI-compatible requests use `options.systemPrompt ?? SYSTEM_PROMPT`, so the custom prompt overrides `SYSTEM_PROMPT` at `src/services/ai.ts:614-631`.
- The primary Qwen/Anthropic body appears to collect system messages from the message array without injecting `options.systemPrompt` at `src/services/ai.ts:85-166`, weakening prompt consistency for non-short-circuited Arabic chat.

### 8. AI tool availability, raw tool-call normalization, and generic failures
- `selectToolNames()` returns no tools unless `currentMessageAllowsTools()` approves the latest user message at `src/services/ai.ts:505-507`.
- When tools are allowed, `execute_skill` is always added, and tool groups are selected by server/channel/role/profile regexes at `src/services/ai.ts:510-542`.
- OpenAI-compatible request bodies include only selected compact tools and `tool_choice: 'auto'` when tools exist at `src/services/ai.ts:614-631`.
- Anthropic/Qwen responses are normalized from `tool_use` blocks into internal tool calls at `src/services/ai.ts:194-216`.
- Stored invalid tool-call JSON is silently replaced with `{}` by `AIPromptBuilder.sanitizeMessages()` at `src/services/ai.ts:303-325`.
- Raw `<function>` / `<tool_call>` text is normalized before the main tool loop, after wrapping calls, during continuation, and in final cleanup at `src/index.ts:1628-1634`, `src/index.ts:1752-1759`, `src/index.ts:1811-1818`, and `src/index.ts:1822-1838`.
- The main tool loop also falls back to `{}` on JSON parse failure at `src/index.ts:1650-1656`, which converts malformed model output into missing-argument tool failures rather than a distinct parse error.
- Missing-intent verification detects unexecuted intents and may trigger another provider call at `src/index.ts:1841-1857`.
- `generateAIResponse()` tries multiple providers and throws `AI_TEMPORARY_ERROR_MESSAGE` if all fail at `src/services/ai.ts:813-881`; the message text is defined at `src/services/ai.ts:380`.
- The outer catch uses offline fallback or `formatUserError()` at `src/index.ts:1922-1929`, and `formatUserError()` maps the temporary AI error to the same generic Arabic response at `src/index.ts:1984-1989`.
- This explains why complex multi-operation requests and simple nickname-change failures can surface as the same “تعذر تشغيل الذكاء الاصطناعي مؤقتًا...” message.

### 9. Skills/capabilities surface
- `SkillRegistry` is a static in-memory registry keyed by skill ID with category indexing and a tool adapter at `src/skills/skill_registry.ts:76-80`.
- Startup loads skills from `path.join(__dirname, 'skills')` at `src/index.ts:1193-1198`.
- `SkillRegistry.loadDirectory()` recursively imports only `.skill.js` / `.skill.ts` files, accepts `default` or `skills` exports, and registers objects with an `id` at `src/skills/skill_registry.ts:111-123` and `src/skills/skill_registry.ts:153-164`.
- `buildSkillManifestForAI()` emits only `[EXECUTABLE_SKILLS]` category-to-ID lines, not descriptions, triggers, schemas, or examples, at `src/skills/skill_registry.ts:144-150`.
- The manifest is injected into the main AI prompt, wrapping prompt, continuation prompt, and missing-intent verification prompt at `src/index.ts:1518-1524`, `src/index.ts:1741-1748`, `src/index.ts:1802-1808`, and `src/index.ts:1847-1853`.
- The fixed `execute_skill` tool takes only `skillId` and generic `args` at `src/services/aiCatalog.ts:257`; per-skill schemas are not exposed to the model.
- Tool selection adds `execute_skill` only after tool intent passes at `src/services/ai.ts:505-510`.
- `validateAIToolPermission()` checks `execute_skill` by resolving the skill and requiring `hasAnyPermission(actorMember, skill.requiredPermissions)` at `src/index.ts:285-289`.
- Because `hasAnyPermission()` is `Administrator || permissions.some(...)`, empty `requiredPermissions` denies non-admin users at `src/index.ts:206-209`.
- The live `execute_skill` branch resolves the skill, validates active channel/member shape, and calls `skill.execute()` with guild/channel/user/args/context at `src/index.ts:431-445`.
- `CommandParser` exists separately at `src/skills/command_parser.ts:20-292`, but live message listeners manually route `!humanguard`/mentions through manual command handlers at `src/index.ts:1298-1313` and `src/index.ts:3403-3418`; it does not expose skills to AI by itself.

## Code References
- `src/utils/discordTools.ts:132-219` — `createChannels()` result shape, permission overwrites, `createdEntities`, and `channelId`.
- `src/index.ts:453-490` — audited tool execution, entity registration, memory registration, and audit logging.
- `src/intelligence/entity_registry.ts:143-181` — tool-result entity registration for created channels/categories.
- `src/intelligence/memory_manager.ts:314-401` — session entity storage and `[SESSION_ENTITIES]` prompt context.
- `src/services/toolTargeting.ts:22-245` — normalized target matching, implicit recent-room fallback, and explicit target injection.
- `src/intelligence/compound_planner.ts:23-164` — deterministic compound planner and workflow references.
- `src/intelligence/workflow_engine.ts:49-115` — sequential workflow execution and `$step.path` resolution.
- `src/intelligence/arabic_nlp.ts:51-239` — Arabic permission phrases and direct permission operation generation.
- `src/utils/discordTools.ts:442-493` — channel permission overwrite editing.
- `src/utils/discordTools.ts:554-641` — category permission-overwrite sweep.
- `src/utils/discordTools.ts:649-766` — member moderation including voicekick.
- `src/utils/advancedDiscordActions.ts:246-321` — voice/channel action permission and `voice_set_user_limit` execution.
- `src/services/conversation.ts:41-63` — small-talk short-circuit and Arabic reply.
- `src/intelligence/context_engine.ts:80-123` — language detection and runtime system prompt.
- `src/services/aiCatalog.ts:45-121` — global system prompt and Arabic Discord tool rules.
- `src/services/ai.ts:505-631` — tool selection and OpenAI-compatible request body.
- `src/services/ai.ts:813-881` — provider fallback and generic AI temporary error.
- `src/index.ts:1628-1889` — tool-call normalization, tool loop, deterministic replies, and missing-intent verification.
- `src/skills/skill_registry.ts:76-180` — skill registry, loading, manifest, and tool-backed skill adapter.
- `src/index.ts:1193-1198` — startup skill loading.
- `src/index.ts:431-445` — live `execute_skill` router.

## Integration Points

### Inbound References
- `src/index.ts:1298-1313` — manual command/message entry recognizes `!humanguard` and bot mentions before AI routing.
- `src/index.ts:1361-1419` — deterministic pre-AI handlers for conversation and direct Arabic permissions.
- `src/index.ts:1374-1379` — explicit target resolution feeds mention-sweep direct handling.
- `src/index.ts:1456-1489` — AI path target resolution and memory reinforcement.
- `src/index.ts:1541-1611` — deterministic compound workflow and audited tool execution.
- `src/index.ts:1637-1727` — AI tool calls execute through the central tool loop.
- `src/index.ts:1841-1889` — missing-intent verifier can trigger additional tool execution.
- `src/index.ts:3403-3418` — secondary manual command parser hook bypasses `CommandParser`.

### Outbound Dependencies
- `discord.js` channel/member/permission APIs are used by `src/utils/discordTools.ts:196-201`, `src/utils/discordTools.ts:490-493`, `src/utils/discordTools.ts:622-624`, `src/utils/discordTools.ts:717`, and `src/utils/advancedDiscordActions.ts:320`.
- AI providers are called through `getAIResponse()` / `generateAIResponse()` in `src/services/ai.ts:813-888`.
- Session/prompt state is shared through `ContextEngine` and `MemoryManager` at `src/index.ts:523-546`, `src/index.ts:1518-1525`, and `src/intelligence/memory_manager.ts:388-424`.
- Tool-backed skills depend on `SkillRegistry.executeToolAdapter()` at `src/skills/skill_registry.ts:170-180` and adapter wiring at `src/index.ts:510-516`.

### Infrastructure Wiring
- Skill loading is wired on `ClientReady` at `src/index.ts:1193-1198`.
- Skill tool adapter is configured at `src/index.ts:510-516`.
- AI prompt assembly wires entity context, user preferences, skill manifest, and knowledge blocks at `src/index.ts:1518-1525`.
- The global AI catalog defines Discord tool schemas, including `edit_permissions`, `sweep_permission_overwrites`, and `execute_skill`, at `src/services/aiCatalog.ts:245-257`.

## Architecture Insights
- The bot relies on deterministic pre-handlers for high-confidence Arabic Discord operations, then falls back to an AI tool loop for broader cases.
- Entity continuity is intentionally dual-layered: `EntityRegistry` is guild-level/latest-known, while `MemoryManager` is channel/session-level conversational memory.
- Channel permission operations are consistently designed as channel overwrites; base role edits are separate and should not be used for “برمشنات الروم”.
- Compound workflows can model linked transactions, but current deterministic recognition is regex-specific and dependency metadata is incomplete for some cross-step references.
- AI response wrapping is a risk point: deterministic tool success can be contradicted by the model-generated final message.
- Tool-call malformed JSON is normalized to `{}` in multiple places, which favors resilience but hides a distinct class of model-output failures.
- The skills layer is ID-manifest driven, not schema-manifest driven; this limits the model’s ability to discover correct arguments for new skills.

## Precedents & Lessons
Git history unavailable (`commit: no-commit`), so no commit precedents were analyzed.

### Lessons from docs
- `.rpiv/artifacts/research/2026-06-16_22-36-37_discord-ai-bot-failures.md` — related prior research document located by scope tracer.
- `.rpiv/artifacts/research/2026-06-17_10-50-16_intelligent-arabic-discord-ai-manager.md` — related prior research document located by scope tracer.
- `.rpiv/artifacts/research/2026-06-17_13-32-39_wire-discord-skills-into-live-reasoning.md` — related prior research document located by scope tracer.
- `.rpiv/artifacts/plans/2026-06-17_13-49-30_wire-discord-skills-into-live-reasoning.md` — related prior plan located by scope tracer.
- `.rpiv/artifacts/validation/2026-06-17_10-05-56_discord-ai-bot-conversation-quality-improvements.md` — related validation artifact located by scope tracer.

### Composite Lessons
- Treat deterministic pre-handlers as the best template for high-value Arabic moderation workflows because they avoid provider failure, prompt drift, and raw tool-call leakage.
- Any fix plan should preserve the `executeToolWithAudit()` memory/audit spine so newly created rooms remain available to follow-up references.
- For reported current failures, runtime verification should distinguish “code path exists” from “the user’s exact Arabic phrasing reaches that path.”

## Historical Context (from `.rpiv/artifacts/`)
- `.rpiv/artifacts/research/2026-06-16_22-36-37_discord-ai-bot-failures.md` — prior research on Discord AI bot failures.
- `.rpiv/artifacts/research/2026-06-17_10-50-16_intelligent-arabic-discord-ai-manager.md` — prior research on Arabic Discord AI management.
- `.rpiv/artifacts/research/2026-06-17_13-32-39_wire-discord-skills-into-live-reasoning.md` — prior research on executable skills and live reasoning.
- `.rpiv/artifacts/plans/2026-06-17_13-49-30_wire-discord-skills-into-live-reasoning.md` — implementation plan related to skill wiring.
- `.rpiv/artifacts/validation/2026-06-17_10-05-56_discord-ai-bot-conversation-quality-improvements.md` — validation artifact related to conversation quality.

## Developer Context
**Q (`src/intelligence/compound_planner.ts:25-27`): This regex only matches compound room creation when Arabic includes `اسمه/اسمها/باسم`, while `FABLE5_PROBLEM_REPORT.md` examples include looser phrases like “سو روم فويس X...”. Should the research treat the report as current failing behavior or as a historical transcript where some failures may already be fixed?**
A: Current failures.

**Q (scan checkpoint): Scan complete — write the doc, or adjust first?**
A: Write the doc.

## Related Research
- `.rpiv/artifacts/research/2026-06-16_22-36-37_discord-ai-bot-failures.md`
- `.rpiv/artifacts/research/2026-06-17_10-50-16_intelligent-arabic-discord-ai-manager.md`
- `.rpiv/artifacts/research/2026-06-17_13-32-39_wire-discord-skills-into-live-reasoning.md`

## Open Questions
- Are the report examples from a runtime that includes the current deterministic pre-handlers, or from an older deployment/build?
- Which exact Arabic phrasings must be accepted for compound room creation without requiring `اسمه/اسمها/باسم`?
- Should AI result wrapping be removed or constrained for successful tool executions to prevent contradictory final replies?
- Should skill manifests expose descriptions/triggers/schemas, or should new skills be reachable primarily through deterministic pre-handlers?
