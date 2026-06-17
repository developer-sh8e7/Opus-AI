---
date: 2026-06-17T13:32:39+0300
author: Abu Awad
commit: 2f1e828
branch: main
repository: Opus
topic: "Wire Discord Knowledge Skills into Live Bot Reasoning"
tags: [research, codebase, discord, skills, prompt-engineering, routing, safety, permissions]
status: ready
last_updated: 2026-06-17T13:32:39+0300
last_updated_by: Abu Awad
---

# Research: Wire Discord Knowledge Skills into Live Bot Reasoning

## Research Question
How should the 8 Discord knowledge reference files under `skills/` be connected into the bot's actual decision-making pipeline (system prompt construction, intent/permission/operation planning, and post-action verification) so the AI uses real documented Discord knowledge instead of guessing — WITHOUT dumping all 8 files' full content into every single request?

Do NOT implement yet. Research only.

## Summary
The 8 skill files (`discord-channels-and-categories.md`, `discord-permissions-reference.md`, `discord-permission-resolution-order.md`, `discord-roles-and-hierarchy.md`, `discord-moderation.md`, `discord-server-structure-patterns.md`, `discord-sync-events.md`, `discord-rate-limits-and-bulk-ops.md`) are currently inert reference documents. The bot already has a compact Discord rules injection point at `src/intelligence/discord_knowledge.ts:124` (`buildDiscordKnowledgePrompt()`) that feeds into `src/intelligence/context_engine.ts:104-112` and then into the system prompt at `src/index.ts:1249-1252`. This existing block is ~30-50 lines. The 8 skill files total ~1,000+ lines — injecting all of them unconditionally would blow the token budget for every request.

The recommended approach is a **hybrid three-tier routing system**:

1. **Deterministic intent-to-skill index** — maps detected intents (from `src/intelligence/arabic_nlp.ts:63`, `src/services/intentVerifier.ts:51`) to skill file IDs. This produces a shortlist of 1-3 relevant skills per request at near-zero cost.
2. **Section-level extraction** — within each selected skill file, inject only the relevant section (e.g., the `Stream` section from permissions-reference, not the entire permission flag list). Each selected section averages 10-20 lines.
3. **Anti-pattern safety gate** — the WRONG/RIGHT examples from the skill files become deterministic pre-execution validators that check planned tool arguments against known-dangerous patterns before the tool call reaches `executeToolWithAudit()`.

Total per-request skill content added: **30-60 lines** (not 1,000). This fits within the existing prompt budget with room to spare.

The injection point should be a new `SkillContextSelector` module that sits between `ContextEngine.buildSystemPrompt()` and `src/index.ts:1249-1252`. It reads the skill files at startup into a structured index, selects relevant sections per request, and injects minimal labeled blocks (`[DISCORD_KNOWLEDGE_permissions]`, `[DISCORD_KNOWLEDGE_moderation]`, etc.) that the AI can reference.

Anti-pattern gates go in a deterministic `validateToolAgainstSkillRules()` layer called inside `executeToolWithAudit()` at `src/index.ts:447`, before the actual Discord mutation. This catches dangerous combinations (e.g., granting `MoveMembers` to `@everyone`) even if the LLM proposes them.

## Executive Summary
- Current injection point exists at `src/intelligence/discord_knowledge.ts:124` and `src/index.ts:1249-1252` but is a single compact block; the 8 skill files must be selectively loaded.
- The skill registry (`src/skills/skill_registry.ts:76-144`) handles executable `.skill.ts` files only; `.md` knowledge files need a separate loader and should NOT appear in `[EXECUTABLE_SKILLS]` or the `execute_skill` tool schema.
- Deterministic intent-to-skill mapping is the most reliable routing method for this codebase because the bot already has working intent detection (`src/intelligence/arabic_nlp.ts:63`, `src/services/intentVerifier.ts:51`) that can be extended with a skill index table.
- LLM-based skill selection is secondary and optional — the model can suggest additional knowledge during planning, but the deterministic pre-filter must run first to guarantee safety-critical knowledge (moderation, permissions, bulk-ops) is always loaded for relevant requests.
- Per-request skill content budget: 30-60 lines (~400-800 tokens). This is realistic given current prompt size and Groq context windows.
- Anti-pattern WRONG/RIGHT examples should become automated pre-execution validators, not just prompt text. The validation layer checks planned permission overwrites against known-dangerous shapes before mutating Discord state.
- Staleness handling of entity/state memory can reference `skills/discord-sync-events.md` principles without loading the full file; a compact 10-line stale-state heuristic block can be injected unconditionally.
- Skill file updates should be loaded at bot startup (read `skills/` directory, parse into knowledge index). Hot-reload is possible with a watcher but not P0; ship restart-based loading first.

## Top Findings

### 1. Current Prompt-Building Inspection

The Discord knowledge injection path:

- `src/intelligence/discord_knowledge.ts:124` — `buildDiscordKnowledgePrompt()` produces a compact block (~30-50 lines) of Discord rules including Danger Zone warnings, server structure guidance, and base permission definitions. This is already dense but incomplete compared to the 8 skill files.
- `src/intelligence/context_engine.ts:104-112` — `ContextEngine.buildSystemPrompt()` calls the above and builds the knowledge context block.
- `src/index.ts:1249-1252` — The systemPrompt array is assembled: target context, system prompt, entity memory, skill manifest. The Discord knowledge block is one entry in this array.
- `src/services/ai.ts:822-845` — `buildCompletionBody()` packs system messages + history + tools into the provider request.

Current system prompt size analysis (from source inspection):
- Base SYSTEM_PROMPT at `src/services/ai.ts:153`: ~80-100 lines.
- Discord knowledge block: ~30-50 lines.
- Entity context: ~5-15 lines depending on memory.
- Skill manifest: variable, ~10-30 lines for executable skills.
- Conversation history grows with turns.
- Total system content before user message: ~150-250 lines (~2,000-3,500 tokens).

**Room for injection**: Adding 30-60 lines (~400-800 tokens) of selected skill content per request is realistic. The existing Groq context windows (8K-32K depending on model) can handle this. Dumping all 8 files (~1,000 lines, ~14,000 tokens) would not be sustainable — selective loading is mandatory.

### 2. Skill Registry Semantics (Executable vs Reference)

The existing skill system at `src/skills/skill_registry.ts:76-144`:
- `SkillRegistry.loadDirectory()` at `src/skills/skill_registry.ts:112-126` loads `.skill.ts` files from subdirectories under `skills/`.
- `SkillRegistry.buildSkillManifestForAI()` at `src/skills/skill_registry.ts:144` builds an `[EXECUTABLE_SKILLS]` block listing executable skills with name + description.
- `execute_skill` tool schema at `src/services/ai.ts:500-515` lets the AI call executable skills by name.

The 8 `.md` knowledge files under `skills/` MUST NOT appear in the executable skill manifest — the AI would try to call them as functions. They need a separate loading mechanism:

**Recommended**: A new `KnowledgeSkillLoader` class (separate from `SkillRegistry`) that:
- Reads `skills/*.md` files at startup.
- Parses sections by `##` headings for granular extraction.
- Builds an intent-to-section index.
- Exposes `getRelevantSections(intents, tools, text)` for per-request selection.
- Does NOT register anything in `[EXECUTABLE_SKILLS]`.

Location: `src/intelligence/knowledge_skill_loader.ts` (new file).

### 3. Skill Selection / Routing Logic

**Recommended: deterministic intent-to-skill index (primary) + optional LLM refinement (secondary).**

Why deterministic first is more reliable for this codebase:
- The bot already detects intents via `detectArabicIntent()` at `src/intelligence/arabic_nlp.ts:63` and `detectAllIntents()` at `src/services/intentVerifier.ts:51`. These return typed intents (`CREATE_CHANNEL`, `DELETE_CHANNEL`, `SET_PERMISSIONS`, `BAN_USER`, `KICK_USER`, `TIMEOUT_USER`, `GIVE_ROLE`, `UNKNOWN`).
- A deterministic index table adds no latency, no extra API call, and no risk of the LLM selecting poorly.
- Safety-critical knowledge (e.g., moderation rules before banning) must be loaded regardless of what the LLM prefers.
- The existing intent detection already maps to these categories.

Proposed **Intent-to-Skill Index**:

| Intent(s) | Skill file(s) | Sections | Priority |
|---|---|---|---|
| `SET_PERMISSIONS`, permission phrases | `discord-permissions-reference.md`, `discord-permission-resolution-order.md` | `Stream` flag, dangerous combos, overwrite order, `@everyone` deny behavior, category sync | P0 |
| `BAN_USER`, `KICK_USER`, `TIMEOUT_USER` | `discord-moderation.md` | Preflight model, ban flow, kick flow, timeout duration, actor hierarchy, bot capability | P0 |
| `DELETE_CHANNEL`, bulk deletion phrases | `discord-rate-limits-and-bulk-ops.md` | Bulk channel deletion safe approach, sequencing templates | P0 |
| `CREATE_CHANNEL`, server build phrases | `discord-channels-and-categories.md`, `discord-server-structure-patterns.md` | Channel types, category inheritance, build order, ticket/lobby patterns | P1 |
| `GIVE_ROLE`, role phrases | `discord-roles-and-hierarchy.md` | Position/hierarchy, creation, permission sets, `editable` | P1 |
| Rebuild/clean/reorganize phrases | `discord-server-structure-patterns.md`, `discord-rate-limits-and-bulk-ops.md` | Server clean/rebuild workflow, sequencing templates | P1 |
| Entity follow-up ("الروم اللي سويته") | `discord-sync-events.md` | Channel events, tombstones, state sync principles | P2 |
| `UNKNOWN` but tools present | All permissions + moderation files at minimum | Compact (10-line each) general guidance | P2 |

**Secondary LLM refinement**: After deterministic selection, if the planning step detects additional needs, the model can request more knowledge via a `request_knowledge` tool with a topic string. This is optional and P2.

### 4. Injection Point Mapped to Architecture Layers

Mapping onto the proposed architecture from the prior research:

| Layer | Skills to inject | When | How |
|---|---|---|---|
| Intent Understanding | (none — this layer feeds the selector) | Before planning | Intent output drives the selector |
| Entity Resolution | `discord-sync-events.md` (state freshness rules) | During memory assembly | Add 10-line stale-state heuristic to `buildEntityContext()` |
| Permission Planner | `discord-permissions-reference.md`, `discord-permission-resolution-order.md`, `discord-channels-and-categories.md`, `discord-roles-and-hierarchy.md` | During planning, before tool args are shaped | Inject selected sections into system prompt; also feed anti-pattern validator |
| Operation Planner | `discord-moderation.md`, `discord-server-structure-patterns.md`, `discord-rate-limits-and-bulk-ops.md` | During planning | Inject sequencing rules, confirmation requirements, build order knowledge |
| Safety Layer | `discord-permissions-reference.md` (dangerous combos), `discord-moderation.md` (preflight model), `discord-rate-limits-and-bulk-ops.md` (bulk safety) | Before tool execution | Deterministic anti-pattern validator in `executeToolWithAudit()` |
| Reply Layer | (none directly — reply content comes from execution ledger) | After execution | Reply quality improves indirectly from better planning |

### 5. Token Budget Strategy

**Recommended: section-level extraction, max 60 lines per request.**

Rules:
1. **Section extraction within files**: Each skill file is structured with `##` headings. The loader parses these into named sections. Only the matching section(s) for the current request are injected — not the full file.
2. **Per-request cap**: Max 3 skill files selected, max 20 lines per file, total max 60 lines (~800 tokens). This is enforced by the selector.
3. **Compact unconditional block**: A 10-line general-discord-rules block (existing `buildDiscordKnowledgePrompt()`) stays in every request regardless. The selected skill sections are ADDITIONAL, not replacements.
4. **Fallback for UNKNOWN**: If intent is UNKNOWN but tools are present, inject a 10-line combined block with the most critical safety rules from permissions + moderation + bulk-ops.

Estimated budget impact:
- Current: ~150-250 lines system content.
- With selected skills: ~180-310 lines system content.
- Worst case (3 skills, 20 lines each): +60 lines, still well within 8K token context.

### 6. Safety Pattern Matching — Automated Anti-Pattern Gate

The WRONG/RIGHT examples in each skill file document real bugs this project has shipped. They should become **deterministic pre-execution validators**, not just prompt text.

**Recommended design**: A `validateToolKnowledgeRules()` function called inside `executeToolWithAudit()` at `src/index.ts:447`, before the tool call reaches `deleteChannels()`, `manageMembers()`, `editPermissions()`, etc.

Anti-pattern rules to encode (from the 8 skill files):

| Rule ID | Trigger | Check | Action |
|---|---|---|---|
| `AP-001` | Permission overwrite tool | `MoveMembers` allowed for `@everyone` | Block and suggest dedicated role |
| `AP-002` | Permission overwrite tool | `ManageRoles` allowed for `@everyone` or broad role | Block with explanation |
| `AP-003` | Permission overwrite tool | `ManageChannels` allowed for `@everyone` or broad role | Block with explanation |
| `AP-004` | Permission overwrite tool | `Administrator` granted to non-owner role | Require admin confirmation |
| `AP-005` | Permission overwrite tool | `ViewChannel` denied when user asked "visible but locked/read-only" | Block and suggest correct deny pattern |
| `AP-006` | Moderation tool | Missing hierarchy check (actor below target) | Block |
| `AP-007` | Moderation tool | `timeout` duration > 28 days | Cap or reject |
| `AP-008` | Delete channels tool | Active command channel in delete list | Remove from list; require separate confirmation if intentional |
| `AP-009` | Delete channels tool | Bulk delete (≥5 channels) without explicit confirmation flag | Require confirmation |
| `AP-010` | Bulk permission tool | Category overwrite update without child sync check | Add child sync step or warn |
| `AP-011` | Member moderation | Target is guild owner | Block immediately |
| `AP-012` | Edit permissions tool | `Stream` in allow but `permissionMap` entry is `Video` | Fix permission name mapping |

The validator function:
- Receives: tool name, resolved args, guild, actor, confirmed flag, request intent.
- Returns: `{ allowed: boolean, reason?: string, fix?: string, requiresConfirmation?: boolean }`.
- Called inside `executeToolWithAudit()` before the Discord mutation.
- For rule violations with a known fix (e.g., AP-001), the fix is returned so the bot can retry with corrected args.

### 7. Staleness Handling

`skills/discord-sync-events.md` covers when cached entity state may be stale. The recommended approach is not to inject the full file but to add a **compact stale-state heuristic block** (~10 lines) unconditionally to the system prompt:

```
[STATE_FRESHNESS] After you create/delete/edit channels, roles, or permissions, Discord events update state. Do not assume cached channel/role/member data is fresh across turns. If a user refers to a channel created in a previous turn, verify it still exists by ID or name. Deleted channels are NOT returned by guild.channels.cache. Use current guild state, not memory.
```

Additionally, the entity registry at `src/intelligence/entity_registry.ts:140-148` should be enhanced to add tombstone tracking:
- On channel/role delete: mark the entity as `deleted` or remove it from active memory.
- Follow-up resolution at `src/services/toolTargeting.ts:131-142` should check tombstone state before resolving "الروم".

This can work as a standalone improvement right now without a separate Server State Index.

### 8. Maintainability

**Recommended: startup-load, not hot-reload (P0).**

Approach:
1. On bot startup, `KnowledgeSkillLoader` reads `skills/*.md` files.
2. Parses into structured index: `{ fileId, sections: [{ heading, content, lines }] }`.
3. Builds intent-to-section index using a small config map (hardcoded or loaded from `skills/index.json`).
4. Keeps index in memory for the lifetime of the process.
5. If a skill file is edited, restart the bot. This is simple and avoids stale-knowledge risk.

**Hot-reload (P2) enhancement**: Add a file watcher that re-reads changed `.md` files and updates the in-memory index. This is useful during development but not required for correctness.

**Why not code-change-only**: Requiring code changes for skill file edits would mean every Discord API update (permission flag additions, channel type changes) needs a bot release. Loading `.md` files at startup means documentation and knowledge can be updated independently.

### 9. Integration Architecture Summary

```
User message
    │
    ▼
src/index.ts:1012 — MessageCreate handler
    │
    ▼
src/index.ts:1177-1261 — Context enrichment
    ├── ContextAnalyzer.analyze() → intent
    ├── KnowledgeSkillLoader.getRelevantSections(intent, tools, text)
    │     └── Returns selected section strings from skills/*.md
    ├── systemPrompt array
    │     ├── [DISCORD_KNOWLEDGE] (existing compact block)
    │     ├── [DISCORD_KNOWLEDGE_permissions] (if SET_PERMISSIONS)
    │     ├── [DISCORD_KNOWLEDGE_moderation] (if BAN_USER etc.)
    │     ├── [DISCORD_KNOWLEDGE_bulkops] (if bulk delete/create)
    │     └── [STATE_FRESHNESS] (unconditional compact block)
    │
    ▼
src/index.ts:1270-1467 — AI planning / tool call loop
    │
    ▼
executeToolWithAudit() at src/index.ts:447
    ├── validateToolKnowledgeRules() — deterministic anti-pattern check
    │     └── Blocks or flags dangerous operations
    ├── executeTool() — actual Discord mutation
    └── registerToolResult() — entity registration
    │
    ▼
src/index.ts:1553-1588 — Verification
    └── findMissingIntents() — compare request against execution
```

## Code References

### Skill files (new, created this session)
- `skills/discord-channels-and-categories.md` — All channel types, settings, category inheritance, creation order, Arabic concept mapping.
- `skills/discord-permissions-reference.md` — Every permission flag, dangerous combos, WRONG/RIGHT examples.
- `skills/discord-permission-resolution-order.md` — Exact overwrite resolution order, implicit behavior, category sync.
- `skills/discord-roles-and-hierarchy.md` — Role object, hierarchy constraints, bot capability, actor hierarchy.
- `skills/discord-moderation.md` — Preflight model, ban/kick/timeout/voice mute flows, audit requirements.
- `skills/discord-server-structure-patterns.md` — Tickets, verification, shop, lobby/private, category organization.
- `skills/discord-sync-events.md` — Channel/role/member events, state sync, bulk operation sync.
- `skills/discord-rate-limits-and-bulk-ops.md` — Rate limits, bulk delete/create/role/permission sequencing.

### Existing injection points (to modify)
- `src/intelligence/discord_knowledge.ts:124` — `buildDiscordKnowledgePrompt()`; keep condensed block, do not replace.
- `src/intelligence/context_engine.ts:104-112` — `ContextEngine.buildSystemPrompt()`; integrate selected skill content.
- `src/index.ts:1249-1252` — Main system prompt assembly point; add selected knowledge blocks here.
- `src/services/ai.ts:822-845` — `buildCompletionBody()`; verify system messages fit token budget.

### Intent detection surfaces (for routing)
- `src/intelligence/arabic_nlp.ts:3-63` — `detectArabicIntent()`, `INTENT_PATTERNS`.
- `src/services/intentVerifier.ts:51-88` — `detectAllIntents()`, `findMissingIntents()`.
- `src/intelligence/context_analyzer.ts:108-162` — `ContextAnalyzer.analyze()`.

### Safety execution boundary (anti-pattern gate)
- `src/index.ts:447-467` — `executeToolWithAudit()`; insert `validateToolKnowledgeRules()` here.
- `src/index.ts:210-279` — `validateAIToolPermission()`; actor permission checks.
- `src/utils/security.ts:52-88` — `validateMemberHierarchy()`; bot-vs-target hierarchy.

### Entity and state invalidation
- `src/intelligence/entity_registry.ts:18-321` — Registered entity model, registration, and delete tracking.
- `src/intelligence/memory_manager.ts:311-400` — Entity memory, `buildEntityContext()`.
- `src/services/toolTargeting.ts:72-252` — Explicit target resolution, delete-all-except expansion.

### Existing skill registry (not to be reused for .md files)
- `src/skills/skill_registry.ts:76-144` — Executable skill loader; do not load .md knowledge files here.
- `src/services/ai.ts:500-515` — `execute_skill` tool schema; knowledge files must not appear here.

## Integration Points

### Inbound (what reads the skill files)
- New `KnowledgeSkillLoader` at `src/intelligence/knowledge_skill_loader.ts` — reads `skills/*.md` at startup, parses sections, builds intent index.
- `src/index.ts:1249-1252` — consumes selected sections per request.
- `src/intelligence/context_engine.ts:104-112` — optionally orchestrates knowledge selection.

### Outbound (what the knowledge affects)
- `src/index.ts:447-467` — anti-pattern validator gates mutations.
- `src/intelligence/arabic_nlp.ts:144-210` — permission operation construction (permission knowledge feeds correct flag usage).
- `src/intelligence/compound_planner.ts:23-160` — structured workflow planning (server-structure and bulk-ops knowledge shapes plan).
- `src/index.ts:1553-1588` — verification pass (knowledge improves missing-intent detection).

## Architecture Insights
- The existing `buildDiscordKnowledgePrompt()` at `src/intelligence/discord_knowledge.ts:124` should be refactored to source some of its content from the skill files, rather than duplicating hardcoded strings. This makes the prompt file the source of truth.
- The `execute_skill` tool schema at `src/services/ai.ts:500-515` should NOT be extended to include `.md` files. Knowledge files are passive references. If the AI needs to "ask for more knowledge," a separate `request_knowledge` tool (string topic → returns selected section) could serve that purpose.
- The WRONG/RIGHT anti-pattern gate in `validateToolKnowledgeRules()` is likely the single highest-value change in this plan. It catches bugs the LLM cannot reason about reliably, including ones that have already shipped in this project.

## Precedents & Lessons
No prior artifact directly addresses wiring knowledge `.md` files into live bot reasoning. The prior research at `.rpiv/artifacts/research/2026-06-17_10-50-16_intelligent-arabic-discord-ai-manager.md` provides the overall architecture layers and the structured-plan-plus-validators design approach. The precedent sweep showed prior fixes to permission hazards (`MoveMembers`, `ManageRoles`) were reactive — adding this anti-pattern gate would make them proactive.

## Developer Context
No developer checkpoint questions needed; the user explicitly stated "كمل" (continue) and the design choices are well-constrained by existing code structure.

## Priority Implications

### P0 — Must implement before this integration is useful
- `src/intelligence/knowledge_skill_loader.ts` — Create new file for parsing skills/*.md at startup and building intent-to-section index.
- `src/services/ai.ts:822-845` — Add selected knowledge blocks to system messages based on the selector output.
- `src/index.ts:447-467` — Insert `validateToolKnowledgeRules()` in `executeToolWithAudit()` before Discord mutations.
- `src/intelligence/discord_knowledge.ts:124` — Refactor to source content from skill files where possible.

### P1 — Core routing and selection
- `src/intelligence/arabic_nlp.ts:63` — Extend `detectArabicIntent()` with additional intent patterns for bulk, structure, and role operations.
- `src/services/intentVerifier.ts:51-88` — Extend `detectAllIntents()` and `findMissingIntents()` with bulk/role/structure intents.
- `src/index.ts:1249-1252` — Integrate `KnowledgeSkillLoader.getRelevantSections()` into the system prompt assembly.
- Entity tombstone tracking in `src/intelligence/entity_registry.ts:140-204` — Mark deleted channels/roles as deleted.

### P2 — Completion and polish
- `src/services/ai.ts:500-515` — Optionally add `request_knowledge` tool for LLM-driven knowledge retrieval.
- `src/services/toolTargeting.ts:131-142` — Check entity tombstone state before resolving generic references.
- File watcher hot-reload for skill file changes during development.

### P3 — Testing
- `test/intelligence.test.js` — Add tests for `KnowledgeSkillLoader` section extraction.
- `src/tests/verify.ts` — Add test cases for anti-pattern validator on dangerous permission combinations.
- Integration test: "request triggers skill knowledge injection, AI references section content in plan."

## Exact Files/Functions to Modify Later (Do Not Implement Yet)

### New file
- `src/intelligence/knowledge_skill_loader.ts` — Parse skills/*.md, build intent-to-section index, expose `getRelevantSections()`.

### Modified files
- `src/intelligence/discord_knowledge.ts` — Refactor `buildDiscordKnowledgePrompt()` to source from skill files.
- `src/intelligence/context_engine.ts` — `buildSystemPrompt()` should accept or request selected skill sections.
- `src/index.ts:447-467` — `executeToolWithAudit()` — add `validateToolKnowledgeRules()` call.
- `src/index.ts:1249-1252` — System prompt assembly — add selected skill knowledge blocks.
- `src/intelligence/arabic_nlp.ts:3-63` — Extend `INTENT_PATTERNS` for bulk/role/structure.
- `src/services/intentVerifier.ts:20-29` — Extend `INTENT_TO_TOOLS` map.
- `src/intelligence/entity_registry.ts:140-204` — Add tombstone state on delete operations.
- `src/services/toolTargeting.ts:131-142` — Check tombstone state.
- `src/services/ai.ts:822-845` — Integrate selected knowledge blocks into system messages.
- `test/intelligence.test.js` — Tests for knowledge loader.
- `src/tests/verify.ts` — Tests for anti-pattern validator.

## Design Decisions Made Without Asking
- **Section extraction by `##` headings**: Each skill file uses markdown `##` for section headers. The loader parses by these headings. If a file doesn't use consistent headings, it fails gracefully (loads the whole file as one section).
- **File index at startup, not first request**: Prevents latency from file I/O during a user message.
- **Anti-pattern gate in `executeToolWithAudit()` not in `executeTool()`**: The audit wrapper is the last common path before all mutations, making it the ideal single enforcement point.
- **`request_knowledge` tool is P2**: The deterministic selector covers the primary case; LLM-originated knowledge requests are secondary and can be deferred.
- **No `[EXECUTABLE_SKILLS]` exposure**: Knowledge files are passive. Never add them to the skill manifest.

## Separate Follow-Up Note
Integrating these skill files into live bot reasoning is a distinct step from creating them. The skill files are now safe reference documents. Wiring them into the prompt-building/safety/planning pipeline as described above must go through the normal research → blueprint → implement pipeline. This research artifact provides the architecture, routing logic, token budget, safety gate design, and file-level modification plan for that follow-up.

## Open Questions
- Should the `KnowledgeSkillLoader` maintain a `skills/index.json` with explicit intent-to-section mappings, or should it derive mappings from a config object in code? The latter is simpler for startup and can be in the source tree; the former allows non-developers to update mappings.
- Should the anti-pattern validator block invalid operations or only warn (allowing an override flag)? This depends on trust level for authorized users. The always-confirm policy from the prior research suggests blocking is safer, with an explicit "override" flag for exceptional cases.

## Related Research
- `.rpiv/artifacts/research/2026-06-17_10-50-16_intelligent-arabic-discord-ai-manager.md` — Prior architecture research establishing layers, LLM+validators approach, confirmation policy.

## Recommended Next Command
`/skill:blueprint .rpiv/artifacts/research/2026-06-17_13-32-39_wire-discord-skills-into-live-reasoning.md`
