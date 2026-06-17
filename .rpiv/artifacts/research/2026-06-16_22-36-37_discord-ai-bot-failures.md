---
date: 2026-06-16T22:36:37+0300
author: Abu Awad
commit: 36d2348
branch: main
repository: Opus
topic: "Talk.md Discord AI bot failure root causes"
tags: [research, discord-bot, ai-routing, memory, tool-execution, arabic-nlp]
status: ready
last_updated: 2026-06-16T22:36:37+0300
last_updated_by: Abu Awad
last_updated_note: "Added follow-up research for generic/useless answers and context-ignored analysis"
---

# Research: Talk.md Discord AI bot failure root causes

## Research Question
Analyze the full conversation between the user and the Discord AI bot in Talk.md. Identify why the bot feels stupid, unhelpful, unnatural, or bad at conversation. Find root causes in code/prompt design. Produce improvement plan.

## Summary
12 root causes found across 4 layers: **AI routing** (deterministic overrides bypass personality), **tool targeting** (name/normalization mismatch), **memory/context** (no summarization, fragile entity pointers), and **prompt design** (weak permission resolution instructions, no `<function>`-tag normalization). The dominant failure pattern is that the deterministic tool-reply builder (`buildToolExecutionReply`, `index.ts:495`) intercepts the AI's ability to produce natural Arabic replies after tool execution by breaking the AI loop before the AI can respond. Secondary pattern: the AI produces raw `<function>permissionOverwrites.edit</function>` plaintext (Talk.md:36) that is never normalized into a real `edit_permissions` tool call.

## Detailed Findings

### Finding 1: Deterministic tool replies bypass AI personality

**Root cause of robotic replies** shown at Talk.md:7, :15, :29 ("تم إنشاء 3 قناة بنجاح.").

After each AI tool-call loop iteration, `buildToolExecutionReply()` (`src/index.ts:495-558`) checks for deterministic results. If any exist, the reply is sent **and the loop breaks** at `src/index.ts:1434`:

```
src/index.ts:1428 — const deterministicReply = buildToolExecutionReply(...)
src/index.ts:1432 — if (deterministicReply) {
src/index.ts:1433 —   await sendLongMessage(message, deterministicReply);
src/index.ts:1434 —   finalResponseSent = true;
src/index.ts:1435 —   break;
```

The AI never gets to wrap the result in natural language. The reply comes from `src/utils/discordTools.ts:210` (create message: "تم إنشاء N قناة بنجاح") or `src/utils/discordTools.ts:249` (delete message: "تم حذف N قناة بنجاح"). These success messages are purely functional — no warmth, no acknowledgement of user intent, no personality.

The system prompt instructs at `src/services/ai.ts:178`: "After tool results, summarize exactly what changed and use the names returned by the tools." But the deterministic code path bypasses this instruction entirely.

**Impact**: Every multi-tool request gets a canned line. The AI never learns from feedback because its own response loop is interrupted.

### Finding 2: Raw `<function>` syntax reaches user as plaintext

**Root cause of Talk.md:36** (`<function>permissionOverwrites.edit</function>{"channel_id":"...","overwrite":{...}}`).

The final-assistant-reply path at `src/index.ts:1457-1464` sends `aiResponse.content` directly to the user:

```
src/index.ts:1457 — if (channelOk && aiResponse.content) {
src/index.ts:1458 —   await sendLongMessage(message, aiResponse.content);
```

The system prompt says at `src/services/ai.ts:180-186`: "Never expose internal tool names in the final user-facing reply." Despite this, when the provider returns `<function>permissionOverwrites.edit</function>` as **plain content** (not as `tool_calls`), it goes straight to Discord.

The tool loop check at `src/index.ts:1324` only matches `aiResponse.tool_calls`:
```
while (aiResponse.tool_calls && aiResponse.tool_calls.length > 0 && loopCount < maxLoops)
```

There is **no normalization step** that detects `<function>` tags in content and converts them to tool calls. Three possible sub-failures:
- The provider/model didn't return tool_calls, only function-style text in content
- The tool selection at `src/services/ai.ts:704-746` (via `selectToolNames()`) excluded `edit_permissions` because the user message "روم الخاص ابيه الي يدخله يقدر يتكلم ويفتح Video" didn't match keyword patterns for permission tools
- The `edit_permissions` tool schema at `src/services/ai.ts:381-390` accepts channelId, targetId, targetType but the model tried to use `permissionOverwrites.edit` instead

### Finding 3: Arabic permission direct shortcut requires snowflake channel ID

**Root cause of Talk.md:31-36 failure** — the direct permission shortcut at `src/index.ts:1111-1135` runs BEFORE the AI path, but can only handle messages with `<#channelId>` or raw snowflake:

```
src/intelligence/arabic_nlp.ts:144-151 — extracts channelId from <#id> or raw number
src/intelligence/arabic_nlp.ts:148-151 — if no valid channel ID, returns []
```

"روم الخاص ابيه..." has no channel mention/snowflake, so `buildArabicPermissionOperations()` returns empty. The AI path then runs, but the model doesn't produce a valid `edit_permissions` tool call — it produces function-style text.

### Finding 4: Follow-up target resolution fallback uses definite article only

**Failure to resolve "روم الخاص"** as follow-up to "خاص" channel created earlier.

`src/services/toolTargeting.ts:140-144` — latest-session-entity fallback only triggers on:
```
/(?:الروم|القناة|الشانل|the\s+(?:room|channel))/i
```

"روم الخاص" starts with **bare** "روم" not "الروم", so the regex doesn't match. The named-matching path at `src/services/toolTargeting.ts:34` (`findNamedMatches()`) requires all normalized entity-name words to appear in user text. A channel named "خاص" would match the word "خاص" in the user text, BUT this depends on both the entity being remembered AND the name-normalization succeeding.

Additionally, `normalizeWords()` at `src/services/toolTargeting.ts:22` strips leading `ال` for words > 4 chars, but "خاص" is 3 chars so `الخاص` wouldn't be stripped — though the user wrote "خاص" not "الخاص".

### Finding 5: Tool selection regex may exclude `edit_permissions` mid-conversation

At `src/services/ai.ts:730`, the tool selection regex for channels/permissions:
```
if (/(channel|room|روم|قناة|قنوات|برمشن|permission|visibility|يشوف|اخف|إخف)/i.test(content)) {
```

The follow-up "روم الخاص ابيه الي يدخله يقدر يتكلم ويفتح Video" does NOT contain the explicit permission keywords `برمشن|permission|visibility|يشوف|اخف|إخف`. It contains "روم" which triggers `TOOL_GROUPS.channels`, but `edit_permissions` IS in that group (`src/services/ai.ts:514-519`):

```
channels: [
  'get_server_info',
  'create_channels',
  'delete_channels',
  'edit_permissions',
  ...
]
```

So `edit_permissions` should be available. The failure at Talk.md:36 is more likely a provider/model issue where the AI returned permission syntax as content text rather than as a structured tool call.

### Finding 6: Memory truncation without summarization

`MemoryManager.trimMessages()` (`src/intelligence/memory_manager.ts:302`) drops oldest messages when exceeding `MAX_MESSAGES_PER_CHANNEL = 60` (`src/intelligence/memory_manager.ts:67`). It does NOT summarize them first. After several tool-call cycles (user message + assistant tool_calls + tool results + assistant reply = 4+ messages per turn), 60 slots fill quickly.

ContextEngine limits to 20 turns (`context_engine.ts:MAX_TURNS`) and only includes 8 in the prompt (`context_engine.ts:summarizeForPrompt()`). Early conversation context about why rooms were created or what "خاص" means can be lost.

### Finding 7: No conversational warmth in deterministic replies

`buildToolExecutionReply()` at `src/index.ts:495-558` is pure Arabic template strings:
- `"تم إنشاء N قناة بنجاح."`
- `"تم حذف N قناة بنجاح."`
- `"تم تحديث صلاحيات روم \"{name}\" للرتبة/العضو \"{target}\" بنجاح."`

There is no decorator layer to add context-aware warmth: no "تمام، تم!" prefix options, no emoji, no variation based on user relationship, no re-stating what was accomplished in user's own terms.

The `getConversationReply()` at `src/services/conversation.ts:58` handles warm chat, but it returns `null` (bypassing to AI) as soon as `hasActionIntent()` triggers on action terms. So any message with action intent gets zero conversational warmth.

### Finding 8: Message max length check for conversation (120 chars) discards context

`getConversationReply()` at `src/services/conversation.ts:58` returns null if `text.length > 120`. Most action messages exceed this, so the function never fires for them. This is intentional (action requests should go to AI), but the side effect is: no warm prefix is ever prepended to action replies because getConversationReply is the only warmth layer.

### Finding 9: Compound request detection may skip steps

The first turn at Talk.md:2 combines "delete all rooms except hello" + "create a simple store" — two compound operations. The system prompt says at `ai.ts:174` "For a compound request, continue until every requested step succeeds." But:
1. The tool loop at `index.ts:1324` processes AI responses in sequence, requiring the AI to emit tools for each step
2. There's no verification layer that all requested steps were addressed before breaking
3. The active-channel protection at `index.ts:1372` only protects against deletion, not against partial execution

The result at Talk.md:7-8 shows 2 creation messages — likely only the store was created, not the deletion+preservation.

### Finding 10: Entity TTL of 30 minutes is fragile for resumed conversations

`src/intelligence/memory_manager.ts:72-73` — session entities have 30-minute TTL and max 100. If the user returns after 30 minutes (Talk.md spans 2 days: June 12 → June 13), the `خاص` channel entity may be expired. `buildEntityContext()` at `src/intelligence/memory_manager.ts:385` filters expired entities. So by Talk.md:24 (next day), `خاص` as a remembered entity may not exist.

### Finding 11: `resolveExplicitToolTargets()` only checks session entities + live guild cache — not message history names

`src/services/toolTargeting.ts:87-93` builds `namedChannels` from guild channels + session entities only. It does NOT scan the message history for channel names the user mentioned previously. If the channel was created in a previous turn but not remembered as a session entity (entity registration failure), the name match can't find it.

### Finding 12: System prompt has no explicit tool-name list for single-permission operations

The system prompt at `src/services/ai.ts:153-249` has an "Absolute Discord permission knowledge" section with Discord permission flag names (VIEW_CHANNEL, CONNECT, SPEAK, etc.) and examples ("الكل يشوف ما يدخل means..."), but it does NOT mention the tool name `edit_permissions` or map "permission phrases → use edit_permissions tool". The model must infer this from the tool schema alone, which lacks Arabic context.

The prompt also lacks a section like: "For permission phrases like 'يدخل يتكلم سكرين', use the edit_permissions tool with allow/deny arrays." Instead, this logic lives in `applyArabicPermissionsToToolArgs()` at `src/intelligence/arabic_nlp.ts:84`, which only runs AFTER the AI emits a tool call — it can't help the AI decide to use the tool in the first place.

## Code References
- `src/index.ts:495-558` — `buildToolExecutionReply()`: deterministic reply builder (robotic output)
- `src/index.ts:1105-1135` — Direct permission shortcut requiring snowflake channel ID
- `src/index.ts:1324-1439` — AI tool-call loop (breaks on deterministic reply before AI responds)
- `src/index.ts:1455-1464` — Final content sender (sends raw `<function>` tags as text)
- `src/services/ai.ts:153-249` — SYSTEM_PROMPT (no `edit_permissions` tool mapping)
- `src/services/ai.ts:704-746` — `selectToolNames()`: tool selection by regex
- `src/services/ai.ts:730` — Channel/permission keyword regex for tool inclusion
- `src/services/ai.ts:774-790` — `compactTools()`: excludes tools not in selected set
- `src/services/toolIntent.ts:41-49` — Action pattern detection regex
- `src/services/toolIntent.ts:60-80` — `currentMessageAllowsTools()` gate
- `src/services/toolTargeting.ts:34-41` — `findNamedMatches()`: entity name matching
- `src/services/toolTargeting.ts:140-144` — Latest-entity fallback (uses definite article only)
- `src/intelligence/arabic_nlp.ts:70-82` — `parseArabicPermissions()` permission phrase parsing
- `src/intelligence/arabic_nlp.ts:84-108` — `applyArabicPermissionsToToolArgs()` permission injection
- `src/intelligence/arabic_nlp.ts:144-151` — `buildArabicPermissionOperations()` direct permission shortcut
- `src/intelligence/memory_manager.ts:67` — MAX_MESSAGES_PER_CHANNEL = 60
- `src/intelligence/memory_manager.ts:72-73` — Entity TTL 30 min, max 100
- `src/intelligence/memory_manager.ts:205-256` — `getHistory()` / `addMessage()`
- `src/intelligence/memory_manager.ts:302` — `trimMessages()` (drops without summary)
- `src/intelligence/context_engine.ts` — MAX_TURNS=20, summarizeForPrompt=8
- `src/services/conversation.ts:58` — `getConversationReply()` warmth layer (bypassed on action intent)
- `src/utils/discordTools.ts:210` — Create channel success message template
- `src/utils/discordTools.ts:249` — Delete channel success message template

## Integration Points

### Inbound References
- `Talk.md:2` — User sends "delete all except hello + create store": enters via `index.ts` message handler
- `Talk.md:10` — User correction "I said keep hello not create it": enters same handler
- `Talk.md:24` — "create 3 rooms, one named خاص": enters same handler
- `Talk.md:31` — "خاص room permissions": enters same handler
- `Talk.md:36` — Raw function output received as plaintext

### Outbound Dependencies
- `src/services/ai.ts` → `src/services/toolIntent.ts` for tool selection
- `src/services/ai.ts` → `src/intelligence/compound_planner.ts` for workflow planning
- `src/intelligence/arabic_nlp.ts` → `src/intelligence/entity_registry.ts` for entity resolution
- `src/intelligence/memory_manager.ts` → `src/intelligence/context_engine.ts` for context building
- `src/services/toolTargeting.ts` → `src/intelligence/entity_registry.ts` and `MemoryManager` for entity/target data

### Infrastructure Wiring
- `src/index.ts:172` — `AIRequestLimiter(5, 20, 60000)` rate limiter
- `src/index.ts:455-463` — `executeToolWithAudit()` tool execution with entity registration
- `src/index.ts:1164` — `ContextAnalyzer.analyze()` Arabic intent detection
- `src/index.ts:1236-1240` — System prompt assembly (ContextEngine + EntityContext + SkillManifest)

## Architecture Insights

The system has a three-layer architecture:
1. **Deterministic pre-processing** (getConversationReply, buildArabicPermissionOperations, buildToolExecutionReply) — fast paths for known patterns, but they truncate the AI's ability to add personality
2. **Tool targeting / entity resolution** (resolveExplicitToolTargets, EntityRegistry, MemoryManager) — rich but fragile to naming/normalization mismatches
3. **AI augmentation** (runAIRequest, AI tool loop) — powerful but repeatedly short-circuited by deterministic overrides

The key tension: deterministic code exists for speed and reliability, but it systematically strips conversational warmth and prevents the AI from handling ambiguous follow-ups naturally.

## Precedents & Lessons
**Commit(s)**: (no git search available — new repository)
No precedent commits found for these files.

## Developer Context
**Q (src/intelligence/memory_manager.ts:67): MAX_MESSAGES_PER_CHANNEL=60 fills fast with 4-message tool cycles. Is there a summarization strategy planned?**
A: (not yet asked — new research area)

**Q (src/services/toolTargeting.ts:140): The "الروم" fallback regex doesn't match "روم الخاص". Was this intentional or an oversight?**
A: (not yet asked — new research area)

## Open Questions
1. Should `buildToolExecutionReply()` pass tool results through the AI for natural-language wrapping instead of sending canned templates?
2. Should a `<function>`-tag normalizer be added before the tool-call loop to convert raw function syntax into tool calls?
3. Should the Arabic permission direct shortcut be enhanced to resolve entity names from session memory (like "روم الخاص") instead of requiring snowflake/channel mention?
4. Should entity memory be augmented with historical name lookups from message history?
5. Should the system prompt include explicit tool-to-Arabic-phrase mappings for edit_permissions?

## Related Research
(No prior research documents found)

## Follow-up Research 2026-06-16T22:36:37+0300

### Topic: Where the bot gave generic or useless answers

### Analysis

Every single bot reply in Talk.md falls into the generic/useless category for distinct reasons. The pattern is consistent: **the bot reports WHAT it did but never the DETAILS the user needs to verify or act on the result.**

#### Talk.md:7-8 — "تم إنشاء 1 قناة بنجاح.\nتم إنشاء 1 قناة بنجاح."

**User asked**: "delete all rooms except الو + create a simple store" — a compound request with 3 steps (delete-all, preserve-one, create-store).

**Why generic/useless**:
- The deletion step was **silently skipped** — user has no idea only half the request was executed
- "1 قناة" x2 doesn't say what channels were created, what names, what type (text/voice/category), or how they form a "store"
- A "متجر بسيط" implies multiple structured channels (orders, chat, announcements?) — zero detail about the store layout
- No mention of what channels still exist or what was deleted

**Root cause**: `buildToolExecutionReply()` (`index.ts:495`) strips entity names. The `createChannels()` function returns `createdEntities` with names and IDs (`discordTools.ts:203`), but `buildToolExecutionReply()` ignores them and uses the generic success message from the tool result's `.message` field (`discordTools.ts:210`).

#### Talk.md:15 — "تم حذف 7 قناة بنجاح."

**User correction**: "I said delete all rooms and keep only الو, I didn't say create الو, I said KEEP it, you ox" — angry, frustrated.

**Why generic/useless**:
- No apology or acknowledgment of the error — emotional tone is completely ignored
- No list of WHICH 7 channels were deleted — user can't verify الو survived
- No summary of the post-deletion state — "بقي: الو" would be useful
- The word "ياثور" (ox/stupid) is a strong Arabic insult — the bot doesn't even acknowledge the user's frustration

**Root cause**: System prompt says "Never argue with a user correction" (`ai.ts:160`) but has **no instruction to acknowledge errors or apologize**. The deterministic reply path (`index.ts:1428-1439`) breaks the AI loop before any personality can respond to the user's emotional state.

#### Talk.md:22 — "تم حذف 1 قناة بنجاح."

**User**: "احذف 1514766293436334191" (delete this channel ID)

**Why generic**:
- Acceptable for a direct ID command, but still doesn't say what channel NAME was deleted
- User has to trust the ID was correct — confirming "تم حذف قناة \"صوت-الالعاب\"" would build trust

**Root cause**: `buildToolExecutionReply()` at `index.ts:536-553` maps results by tool name and returns `result.message` — which is the generic template from `discordTools.ts:249`. The deleted channel names ARE available in the tool result (`discordTools.ts:241` collects `channelName`) but are not exposed in the reply.

#### Talk.md:29 — "تم إنشاء 3 قناة بنجاح."

**User asked**: "Create 3 rooms, all public except one named خاص, everyone can see it but can't enter, locked but visible" — very specific configuration.

**Why generic/useless**:
- No room names given — user asked for "خاص" as a name, zero confirmation it was created with that name
- No room types mentioned — text? voice? category?
- The permission constraint (visible but locked) was **completely ignored** — "مقفل ولكن يشوفونة" requires permission setup, not just channel creation
- User must send a follow-up just to get the permissions right

**Root cause**: `createChannels()` at `discordTools.ts:130-218` creates channels but doesn't handle permissions. The permission setup is a separate `edit_permissions` call. The AI should emit a multi-step workflow (create + edit_permissions) but the deterministic reply breaks after creation before the AI can emit the second step.

#### Talk.md:36 — `<function>permissionOverwrites.edit</function>{...}`

**User asked**: "خاص room — I want whoever enters it to be able to speak and open Video = screen share"

**Why useless**:
- Raw internal function syntax — completely unusable to a Discord user
- No Arabic text at all
- Exposes internal implementation (`permissionOverwrites.edit`) which the system prompt explicitly prohibits (`ai.ts:180-186`)

**Root cause**: Provider returned function-style text as `content` not `tool_calls`, and `index.ts:1457-1458` sends the raw content directly. No `<function>`-tag normalizer exists.

### Cross-cutting pattern: 5 types of generic/useless

| Type | Occurrences | Root cause |
|------|-------------|-----------|
| No entity names in reply | Talk.md:7, :15, :29 | `buildToolExecutionReply()` drops names from tool results |
| No state summary after mutation | Talk.md:7, :15, :29 | No post-action channel inventory displayed |
| Emotional tone ignored | Talk.md:15 | System prompt lacks apology/acknowledgment instructions |
| Partial execution undetected | Talk.md:7 | No verification loop that all requested steps completed |
| Raw internal exposure | Talk.md:36 | No `<function>`-tag normalization before content send |

### Additional files referenced
- `src/index.ts:536-553` — `buildToolExecutionReply()` result mapping (drops entity names)
- `src/utils/discordTools.ts:203` — `createdEntities` with names available but unused in reply
- `src/utils/discordTools.ts:241` — `channelName` collected during deletion but unused in reply
- `src/utils/discordTools.ts:210-249` — Generic Arabic template strings without entity details
- `src/intelligence/compound_planner.ts:23-107` — Compound workflow planner (not invoked for channel+permission combos)
- `src/services/ai.ts:160` — "Never argue with a user correction" (no apology instruction)
- `src/services/ai.ts:178` — "summarize exactly what changed" (instruction exists but is bypassed by deterministic code)

### Additional recommended fixes

**P1: Include entity names in deterministic replies**
- `buildToolExecutionReply()` at `index.ts:536` should read `createdEntities` from `createChannels` results and include names: "تم إنشاء 3 قنوات: عام-1, عام-2, خاص"
- For deletions, include `channelName` from delete results: "تم حذف قناة \"{name}\" بنجاح"
- **Files**: `src/index.ts:495-558`, `src/utils/discordTools.ts:210-249`

**P1: Post-mutation state summary**
- After bulk delete/create, the AI should receive a tool result with current channel inventory (from `get_server_info` or the existing entity registry) and summarize: "بقي: الو, عام — تم حذف: صوت-العاب, دردشة, ..."
- **Files**: `src/index.ts:1428-1439` (AI loop should re-query state)

**P2: Add emotional acknowledgment to system prompt**
- Add to `ai.ts:160-165`: "If the user expresses frustration, apologizes for a mistake, use your own words to acknowledge before explaining what happened."
- **Files**: `src/services/ai.ts:160-165`

**P2: Compound-step completeness check**
- After the tool loop exits, verify that all requested action types were addressed. The compound_planner should detect "create X + configure Y" as a multi-step need and emit both tool calls.
- **Files**: `src/intelligence/compound_planner.ts:23-107`

## Follow-up Research 2026-06-16T22:36:37+0300

### Topic: Where the bot ignored context

### Analysis

The bot systematically ignored available context at every turn. Each ignored-context instance falls into one of 6 categories: **compound-request step-dropping**, **permission-constraint dropping**, **cross-turn reference resolution failure**, **correction learning failure**, **emotional context blindness**, **cross-session amnesia**.

#### Fail 1: Compound request — deletion context dropped (Talk.md:2 → :7-8)

**Available context**: The user's message "احذف كال رومات الموجود بس ابق الو + سو لي متجر بسيط" contains **3 distinct subtasks**: (a) delete all rooms, (b) preserve الو, (c) create a store. The "+" connector explicitly joins all three.

**What happened**: Only creation happened (2 channels). Deletion was completely skipped. Preservation was inverted — instead of keeping الو, the system (later at :15) deleted 7 channels without confirming الو survived.

**Code root cause**: The AI emitted tool calls for only the create-store part. The tool loop at `index.ts:1324` processes whatever `tool_calls` the AI returns — **there is no verification step** that maps the user's original intent against completed actions. The compound_planner at `compound_planner.ts:23` is supposed to detect multi-step workflows, but its regex patterns are too narrow: `/سو.*كاتقوري|فئه.*روم.*تكست.*رتبه|رول/` — it only fires for full category+text+voice+role structures, not for "delete all except X + create Y".

```typescript
// compound_planner.ts:80-82 — too narrow, misses "delete+create" patterns
const requestsCategory = /(?:سو|سوي|انشئ|اصنع).*(?:كاتقوري|فئه)/i.test(clean);
const requestsText = /(?:روم|قناه)\s+(?:تكست|نصي)/i.test(clean);
// ... returns [] unless ALL three match + a role match
```

#### Fail 2: Permission constraint dropped (Talk.md:24 → :29)

**Available context**: The user explicitly described a permission setup: "الكل يشوفة بس مايقدرون يدخلونه مقفل ولكن يشوفونة" (everyone can see it but can't enter, locked but visible). This is a canonical "كل يشوف مايدخل" pattern — @everyone allow ViewChannel, deny Connect.

**What happened**: The bot created 3 unnamed channels with no permission setup. The user had to send a separate follow-up to configure permissions. The bot didn't even confirm which channel was "خاص".

**Code root cause**: The compound_planner at `compound_planner.ts:36-73` DOES have a pattern for "create channel + set permissions in one step":
```typescript
const singleChannel = clean.match(
  /(?:سو|سوي|انشئ|أنشئ|اصنع)\s+(?:لي\s+)?(?:روم|قناه)\s+(تكست|نصي|فويس|صوتي)\s+(?:اسمه|اسمها|باسم)\s+([^\s،,]+)/
);
```

But this regex requires the user to specify the channel TYPE (تكست/نصي/فويس/صوتي) **between** "سوي" and "اسمه". The user's message "سو لي 3 رومات كلهم عام الا واحد بس يكون اسمه خاص..." doesn't specify a type at all (3 rooms, possibly mixed types), and the "3 رومات" (plural) doesn't match the single-channel regex. So `planCompoundDiscordRequest()` returns `[]`, the compound workflow is skipped, and the AI must handle it — which it does by only creating channels.

**Also**: The `create_channels` tool schema at `ai.ts:328-359` accepts a `permissions` array in args, but `createChannels()` at `discordTools.ts:130-218` doesn't process permissions during creation. The schema accepts the field but the implementation ignores it.

#### Fail 3: Cross-turn entity reference missed (Talk.md:31 → :36)

**Available context**: The user says "روم الخاص" — referring to the channel named "خاص" that was created 1 minute earlier at Talk.md:29. Three context sources should make this resolvable:
1. `MemoryManager.getRecentEntities()` should contain a channel entity named "خاص" (TTL 30 min, created 1 min ago)
2. `ContextEngine.summarizeForPrompt()` should show the previous turn where "خاص" was created
3. `MemoryManager.buildEntityContext()` should inject `last_channel_id` pointing to "خاص"

**What happened**: Bot returned raw `<function>permissionOverwrites.edit</function>` — either the AI didn't use the available entity context, or the context was incomplete.

**Code root cause (three sub-failures)**:
1. **Entity registration runs, but deterministic reply may race with it**: The `executeToolWithAudit()` at `index.ts:455-463` calls `EntityRegistry.registerToolResult()` and `memoryManager.rememberEntities()` inside the tool execution. But `buildToolExecutionReply()` at `index.ts:1428-1434` breaks the loop BEFORE the AI can respond. Even though entities ARE remembered in the tool execution, the AI follow-up response at the next user message should have access to them — so this isn't the main failure here.
2. **The real issue: AI emits `<function>` syntax instead of `edit_permissions` tool call**: At `index.ts:1324`, only `aiResponse.tool_calls` triggers tool execution. The model returned function text as `content` instead. The entity context was available but never reached the tool execution path because the model failed to call the tool.
3. **Why the model failed**: The `compactTools()` at `ai.ts:774` selects which tools are available to the model. The keyword check at `ai.ts:730` tests for `(channel|room|روم|قناة|...يشوف|اخف|إخف)`. "روم الخاص ابيه الي يدخله يقدر يتكلم ويفتح Video = سكرين شير" MATCHES "روم", so `edit_permissions` should be in the channel group. But if the model still produces `<function>` text, it's a **provider/model issue** — the model learned function-call syntax from its training data and outputs it as plaintext instead of using the provided tool schema. The code has no safety net for this.

#### Fail 4: Correction not learned (Talk.md:10 → :15 and beyond)

**Available context**: User's correction "ماقلتلك انشئ الو قلتلك ابق" (I didn't tell you to create الو, I said keep it). This is an explicit "I said X not Y" pattern — the strongest possible correction signal.

**What happened**: The bot deleted 7 channels without confirming الو survived. No acknowledgment of the mistake. No adjustment in future behavior — when the user later creates "خاص" and follows up, the same pattern of half-execution repeats.

**Code root cause**: 
1. The system prompt at `ai.ts:160` says "Never argue with a user correction" — this is defensive (don't argue), but has NO proactive instruction like "When corrected, acknowledge what went wrong and verify the corrected state."
2. The deterministic reply at `index.ts:1428` breaks the AI loop, so the AI NEVER gets to respond to the correction with natural language. Even if the AI had a perfect correction response ready, `buildToolExecutionReply()` would suppress it.
3. The `findExcludedChannelIds()` at `toolTargeting.ts:42` relies on name matching for preservation. "الو" as a channel name may or may not match depending on exact naming, normalization, and whether the entity is in session memory.

#### Fail 5: Emotional context blindness (throughout)

**Available context**: 
- Turn 1 begins with "ياحياتي اسمع" (affectionate/lit. "my life, listen") — warm, familiar tone
- Turn 2 ends with "ياثور" (ox/stupid) — angry, insulting after bot messed up
- The user is clearly frustrated but still engaging

**What happened**: The bot never adjusted tone. Both "تم إنشاء 1 قناة بنجاح" and "تم حذف 7 قناة بنجاح" have the exact same robotic delivery — no acknowledgment of frustration, no apology, no change in warmth.

**Code root cause**: 
- `getConversationReply()` at `conversation.ts:58` can only handle known greeting/thanks patterns — it has no emotional-tone detection or apology templates
- The system prompt at `ai.ts:153-249` has "Keep ordinary chat warm, concise, and natural" but zero instructions for handling frustration, mistakes, or apologies
- The deterministic reply path at `index.ts:495-558` is emotional-tone-blind by design — it's a pure function mapping tool results to Arabic strings

#### Fail 6: Cross-session amnesia (June 12 → June 13, Talk.md:2-22 → :24-36)

**Available context**: On June 12, the user deleted channels including a specific ID (`1514766293436334191`). The user's intent patterns (create, delete, preserve) were established.

**What happened**: On June 13, the bot starts fresh — no reference to الو, no memory of the deletion incident, no adjustment to handling complex requests. The same "create without permissions" pattern repeats.

**Code root cause**: 
- `MemoryManager` stores messages per-channel in an in-memory `Map` (`memory_manager.ts`). If the bot restarts between days, all context is lost.
- `MAX_MESSAGES_PER_CHANNEL = 60` at `memory_manager.ts:67` — even without restart, 60 messages fills quickly with tool-call cycles (4-6 messages per turn), and `trimMessages()` at `memory_manager.ts:450` drops the OLDEST messages without summarization. After ~10-15 turns, day 1 context is physically removed.
- `Entity TTL = 30 minutes` at `memory_manager.ts:72` — even without restart, entities from day 1 are expired by day 2.
- `ContextEngine` turns are capped at 20 (`MAX_TURNS`) and only 8 are shown in the prompt — day 1 context is gone.

### Cross-cutting context-loss diagram

```
User: "delete all rooms except الو + create store"
  ↓
AI emits: [create_channels tool call]  ← deletion step silently dropped
  ↓
Tool loop: creates channels
  ↓
buildToolExecutionReply() interrupts → "تم إنشاء 1 قناة بنجاح"
  ↓
AI NEVER responds → no opportunity to say "I missed the deletion part"
  ↓ [user corrects angrily]
AI emits: [delete_channels tool call]
  ↓
Tool loop: deletes 7 channels
  ↓
buildToolExecutionReply() interrupts → "تم حذف 7 قناة بنجاح"
  ↓
AI NEVER responds → no apology, no "الو still exists?" check
  ↓ [next day — all context lost]
User: "create 3 rooms..." (same pattern as day 1)
  ↓
Same failure repeats: creates without permissions
```

The diagram shows the **two-layer context loss**: (1) intra-turn — the AI loop is interrupted before it can contextualize results, (2) inter-turn — memory trimming + TTL + bot restarts erase context between days.

### Additional code references
- `src/intelligence/compound_planner.ts:36-73` — Single-channel permission regex (too narrow for "3 رومات")
- `src/intelligence/compound_planner.ts:80-82` — Compound detection logic (returns [] for delete+create combos)
- `src/intelligence/memory_manager.ts:67` — MAX_MESSAGES_PER_CHANNEL=60 (hard cap, no summarization)
- `src/intelligence/memory_manager.ts:72` — Entity TTL=30min (cross-session context loss)
- `src/intelligence/memory_manager.ts:450-470` — `trimMessages()` drops oldest, no summarization
- `src/intelligence/context_engine.ts` — 20-turn cap, 8-turn prompt window
- `src/index.ts:1324-1439` — AI tool loop (no compound-step verification)
- `src/services/ai.ts:160` — "Never argue with correction" (no apology/acknowledgment instruction)
- `src/services/conversation.ts:1-68` — `getConversationReply()` greeting/thanks patterns (no emotional tone)

### Additional fixes

**P0: Compound-step verification after tool loop**
- After the tool loop exits, compare completed tool names against the user's `ArabicIntent` from `ContextAnalyzer.analyze()`. If a requested intent type (DELETE_CHANNEL, SET_PERMISSIONS) produced no tool call, flag it to the AI for follow-up.
- **Files**: `src/index.ts:1424-1439`, `src/intelligence/arabic_nlp.ts:3-10` (ArabicIntent types)

**P1: Broaden compound_planner regex for multi-room + permission patterns**
- Add patterns for: "N رومات + واحد اسمه X + everyone visibility" → `create_channels` with `permissions` field + follow-up `edit_permissions`
- Add patterns for: "احذف X + ابق Y + سو Z" → sequential workflow with preserved-channel tracking
- **Files**: `src/intelligence/compound_planner.ts:23-107`

**P1: Add apology/acknowledgment instruction to system prompt**
- Add: "If the user corrects you or expresses frustration, acknowledge what went wrong AND describe what you did differently in 1-2 sentences before stating the result."
- **Files**: `src/services/ai.ts:160-165`

**P2: Post-mutation state snapshot for verification**
- After delete_channels or create_channels, append a current channel inventory to the tool result so the AI (or deterministic reply) can say what exists now.
- **Files**: `src/intelligence/memory_manager.ts:385-397`, `src/index.ts:1390-1410`

**P2: Extend entity TTL or add persistent entity store**
- Increase TTL to 24h for user-important entities (channels the user named explicitly). Or add a persistent entity file store that survives restarts.
- **Files**: `src/intelligence/memory_manager.ts:72-73`

**P3: Emotional tone awareness**
- Add a simple emotional-tone tag during `ContextAnalyzer.analyze()`: detect frustration markers (`ياثور|غبي|خرا|زق`) and affection markers (`ياحياتي|ياقلبي|روحي`). Inject as `[USER_TONE: frustrated|warm|neutral]` in the enriched prompt.
- **Files**: `src/services/ai.ts` (in prompt building section), `src/index.ts:1164` (ContextAnalyzer.analyze)

# Improvement Plan

Priority order (P0=critical, P1=high, P2=medium, P3=low):

## P0: Fix the AI personality bypass in tool replies

**Problem**: `buildToolExecutionReply()` at `src/index.ts:495` sends canned Arabic templates and breaks the AI loop at `src/index.ts:1432-1435`, preventing the AI from adding warmth or context.

**Fix**: Instead of breaking the loop, feed the deterministic reply as a tool result back to the AI for natural-language wrapping. Or: add a decorator layer that prepends a warm Arabic phrase (randomized from a pool) to the deterministic reply.

**Files**: `src/index.ts:1428-1439`, `src/index.ts:495-558`

## P0: Normalize `<function>` tags before the tool-call loop

**Problem**: When the AI returns `<function>permissionOverwrites.edit</function>...` as plain content (Talk.md:36), it's sent directly to the user. There's no normalization step.

**Fix**: Before the tool-call loop at `src/index.ts:1324`, parse `aiResponse.content` for `<function>toolName</function>...` patterns. If found, extract the tool name and JSON args, convert them into a `tool_calls` entry, clear the content, and let the loop execute them.

**Files**: `src/index.ts:1310-1324`

## P1: Enhance Arabic permission resolution from session memory

**Problem**: `buildArabicPermissionOperations()` at `src/index.ts:1111` requires explicit channel mention/snowflake. "روم الخاص" can't be resolved.

**Fix**: Enhance `buildArabicPermissionOperations()` to:
1. Accept a `sessionEntities` parameter
2. Look for entity-name matches ("خاص" matches session channel named "خاص")
3. Fall back to `last_channel_id` from memory manager
4. Only return empty if none of these resolve

**Files**: `src/intelligence/arabic_nlp.ts:144-151`, `src/index.ts:1111-1135`

## P1: Fix follow-up target resolution to match bare "روم" not just "الروم"

**Problem**: `src/services/toolTargeting.ts:140-144` fallback regex uses `الروم|القناة` but "روم الخاص" starts with bare "روم".

**Fix**: Add `روم` to the regex, with a check that bare "روم" without definite article is also a valid follow-up reference.

**Files**: `src/services/toolTargeting.ts:140-144`

## P1: Add system prompt section mapping Arabic permission phrases to `edit_permissions` tool

**Problem**: The system prompt at `src/services/ai.ts:153-249` has "Absolute Discord permission knowledge" for Discord permission flags but no Arabic-to-tool-name mapping.

**Fix**: Add a section: "For permission requests like 'يدخل يتكلم سكرين شير', 'الكل يشوف مايدخل', call the edit_permissions tool with allow/deny arrays."

**Files**: `src/services/ai.ts:180-190`

## P2: Replace deterministic replies with AI-wrapped responses

**Problem**: Every tool result response feels robotic because the AI never gets to respond after tool execution.

**Fix**: After the tool loop completes, if only one tool was executed (simple case), send the deterministic reply. For 2+ tools (compound), let the AI generate a summary response that adds personality. Add a varied reply pool for simple cases.

**Files**: `src/index.ts:1428-1439`, `src/utils/discordTools.ts:210-249`

## P2: Context summarization before trimming

**Problem**: `trimMessages()` at `src/intelligence/memory_manager.ts:302` drops oldest messages without summarizing them. After 60 messages, early context is lost.

**Fix**: When trimming, summarize the dropped block into a compact string and prepend it to the next remaining message as system context. Or: add a rolling summary field that's updated every N messages.

**Files**: `src/intelligence/memory_manager.ts:67`, `src/intelligence/memory_manager.ts:302-305`

## P2: Increase ContextEngine turns and inject more history

**Problem**: ContextEngine limits to 20 turns and only shows recent 8. Early conversation context (why rooms were created, what names were chosen) is lost.

**Fix**: Increase MAX_TURNS to 40. In `summarizeForPrompt()`, include last 12 instead of 8 with more per-turn context.

**Files**: `src/intelligence/context_engine.ts`

## P2: Add `get_server_info` auto-call for destructive operations

**Problem**: The system prompt says "For 'delete everything except X', fetch server information first" at `ai.ts:175`, but there's no deterministic enforcement.

**Fix**: Before executing `delete_channels` without explicit channel IDs, auto-call `get_server_info` if not already done in the current cycle, and inject channel names/IDs into the next AI prompt.

**Files**: `src/index.ts:1372-1384`, `src/services/ai.ts:175`

## P2: Better tool selection regex for permission phrases

**Problem**: At `src/services/ai.ts:730`, key permission phrases like `يدخل`, `يتكلم`, `سكرين` aren't in the keyword check.

**Fix**: Add Arabic action terms to the permission/channel group check:
```
/(يدخل|يخش|يتكلم|سكرين شير|يشارك|يتصل|صلاحية|صلاحيات)/i.test(content)
```

**Files**: `src/services/ai.ts:730`, `src/services/toolIntent.ts:94`

## P3: Extend entity lifetime or add entity re-registration on follow-up

**Problem**: Entity TTL is 30 minutes (`memory_manager.ts:72`). Talk.md spans 2 days, so "خاص" entity expires between sessions.

**Fix**: Extend TTL to 24h for recently mentioned entities, or add a "stale entity re-registration" step that checks entity names against live guild data when a named reference is detected.

**Files**: `src/intelligence/memory_manager.ts:72-73`

## P3: Add warm punctuation/emoji variation to deterministic replies

**Problem**: All replies are purely functional Arabic without any personality markers.

**Fix**: Add a small pool of prefixes ("تمام ✅", "تم يا باشا ✅", "خلصت ✅") and randomly select one for each deterministic reply. Add channel names to delete/create messages.

**Files**: `src/index.ts:495-558`, `src/utils/discordTools.ts:210-249`

## P3: Better conversational warmth before action execution

**Problem**: `getConversationReply()` at `src/services/conversation.ts:58` bypasses to AI for any message with action intent. Users never get a warm acknowledgment before actions.

**Fix**: Add a light prefix injector between `getConversationReply()` and the AI path: "تمام ✓ خليني أشوف... / Got it, let me handle that..." when action intent is detected.

**Files**: `src/index.ts:1105-1135`

## P3: Add Arabic debug logging for AI responses

**Problem**: When the AI generates bad responses like `<function>` tags, there's no visible logging to help debug whether it's a tool selection issue, a provider issue, or a prompt issue.

**Fix**: Add structured logging in the AI response handler at `src/index.ts:1260-1270` that logs: tool selection result, number of tools available, the first 200 chars of AI response, and whether content was sent as plaintext.

**Files**: `src/index.ts:1260-1270`, `src/index.ts:1455-1464`

---

## Summary of fixes by category

| # | Area | Fix | Priority |
|---|------|-----|----------|
| 1 | Robotic replies | Don't break AI loop after deterministic reply | P0 |
| 2 | `<function>` exposure | Normalize `<function>` tags into tool calls | P0 |
| 3 | Permission resolution | Enhance arabic_nlp with session memory | P1 |
| 4 | Target fallback | Fix "روم" definite article requirement | P1 |
| 5 | Prompt weakness | Add edit_permissions tool mapping in prompt | P1 |
| 6 | Context loss | Summarize before trimming messages | P2 |
| 7 | Tool selection | Add permission keywords to regex | P2 |
| 8 | AI-wrapped replies | Let AI summarize multi-tool results | P2 |
| 9 | Destructive safety | Auto-call get_server_info for bulk delete | P2 |
| 10 | Entity TTL | Extend or re-register stale entities | P3 |
| 11 | Warmth | Add emoji/prefixes to deterministic replies | P3 |
| 12 | Debug logging | Log AI response structure for debugging | P3 |
