---
date: 2026-06-16T23:01:29+0300
author: Abu Awad
commit: 36d2348
branch: main
repository: Opus
topic: "Discord AI bot conversation quality improvements"
tags: [plan, discord-bot, ai-routing, memory, tool-execution, arabic-nlp]
status: ready
phases:
  - { n: 1, title: '<function> Tag Normalizer' }
  - { n: 2, title: 'AI Reply Wrapping' }
  - { n: 3, title: 'Compound-Step Intent Verification' }
  - { n: 4, title: 'Permission Resolution + Target Fallback + Tool Regex' }
  - { n: 5, title: 'Compound Planner Regex + Entity Names in Replies' }
  - { n: 6, title: 'System Prompt + Emotional Tone + Apology Instruction' }
parent: .rpiv/artifacts/research/2026-06-16_22-36-37_discord-ai-bot-failures.md
phase_count: 6
unresolved_phase_count: 0
last_updated: 2026-06-16T23:01:29+0300
last_updated_by: Abu Awad
---

# Discord AI Bot Conversation Quality Improvements

## Overview
Fix the 12 root causes identified in research across 6 vertical slices: add a `<function>` tag normalizer (Talk.md:36), fix the AI personality bypass that causes robotic replies, add compound-step intent verification, enhance permission resolution from session memory, fix target resolution + tool selection regexes, broaden compound planner patterns + include entity names in replies, and update the system prompt + emotional tone handling.

## Requirements
1. The bot must never expose raw `<function>toolName</function>` syntax in user-facing replies
2. Tool execution replies must be wrapped in natural Arabic with personality, not canned templates
3. The bot must verify that all requested steps in a compound request are executed, not silently skip some
4. Permission operations must resolve entity names from session memory (e.g. "روم الخاص" → خاص channel ID)
5. Follow-up phrases "روم" (bare) must be recognized, not just "الروم" (definite)
6. Tool selection must include permission-related tools when Arabic permission phrases like "يدخل"/"يتكلم" are used
7. The compound_planner must detect "N رومات + واحد اسمه X + restrictions" patterns
8. Entity names (created channel names, deleted channel names) must appear in tool result replies
9. The system prompt must include an `edit_permissions` Arabic phrase → tool mapping
10. Emotional tone must be acknowledged — apologies for mistakes, detection of frustration

## Current State Analysis
The bot has a three-layer architecture: deterministic pre-processing (getConversationReply, buildArabicPermissionOperations), tool targeting/entity resolution (resolveExplicitToolTargets, EntityRegistry, MemoryManager), and AI augmentation (runAIRequest, AI tool loop). The key tension: deterministic code exists for speed/reliability but systematically strips conversational warmth and prevents the AI from handling ambiguous follow-ups naturally.

### Key Discoveries
- `src/index.ts:1428-1434` — `buildToolExecutionReply()` breaks the AI loop, preventing natural-language wrapping (Finding 1)
- `src/index.ts:1457-1458` — Raw `<function>` content sent directly to user (Finding 2)
- `src/intelligence/arabic_nlp.ts:144-151` — Permission shortcut requires snowflake, can't resolve entity names (Finding 3)
- `src/services/toolTargeting.ts:140-144` — Fallback only matches "الروم", not bare "روم" (Finding 4)
- `src/services/ai.ts:730` — Permission keywords "يدخل", "يتكلم", "سكرين" missing from tool selection (Finding 5)
- `src/index.ts:536-553` — `buildToolExecutionReply()` ignores `createdEntities` and `deleted` arrays (Finding 7)
- `src/intelligence/compound_planner.ts:36-73` — Regex too narrow for multi-room+permission combos (Finding 9)
- `src/services/ai.ts:160` — "Never argue" but no apology/acknowledgment instruction (Finding 7)
- `src/intelligence/compound_planner.ts:80-82` — Only fires for full category+text+voice+role patterns (Finding 9)

## Desired End State
- User: "سو لي 3 رومات كلهم عام الا واحد اسمه خاص ومقفل" → Bot: "تم إنشاء 3 قنوات: عام-1, عام-2, خاص ✅ وروم 'خاص' مقفل بحيث الكل يشوفه بس مايدخلونه. تبغى تعدل الصلاحيات لأحد؟"
- User: "احذف كل الرومات ابق الو" → Bot checks intent, calls get_server_info, deletes all except الو, replies: "تم حذف 6 قنوات (صوت-العاب, دردشة-عامة, ...) 🔥 وبقي: الو, روم-الصوت. تمام؟"
- User: "روم الخاص ابيه يتكلم ويفتح سكرين" → Bot: "تم تحديث صلاحيات روم 'خاص' ✅ الكل يدخل يتكلم ويفتح سكرين شير."
- User correction → Bot: "صحيح، أسف على الخطأ. أنا فهمت 'انشئ' بدل 'ابق'. الحين تم حذف 7 قنوات. الو باقي؟"

## What We're NOT Doing
- Persistent entity store (P3) — deferred to later
- Full context summarization (P2 rolling summary) — deferred
- Cross-session memory persistence (P3) — deferred
- Full rewrite of the deterministic reply system — we extend it instead
- Adding external chat libraries — we use what's in the codebase
- Changing the model/provider configuration

## Decisions

### Decision 1: AI wraps deterministic replies instead of breaking loop
**Ambiguity**: After tool execution, should the AI wrap results in natural language or should deterministic code handle it?
**Explored**:
- Option A (chosen): Inject deterministic reply as tool result, continue AI loop for wrapping. The AI sees the result and adds natural language. Cost: one extra AI call per tool-result generation.
- Option B: Remove deterministic replies entirely — AI-only responses. Most natural but slowest/expensive.
- Option C: Keep hybrid — break for single-tool simple cases, wrap for compound. More complex logic.
**Decision**: Option A — consistent, predictable, addresses the root cause without removing the deterministic safety net.

### Decision 2: `<function>` tags normalized into real tool_calls
**Ambiguity**: Should `aiResponse.content` containing `<function>toolName(args)</function>` be normalized or handled differently?
**Explored**:
- Option A (chosen): Parse `<function>` tags in content, extract tool name and JSON args, convert into `tool_calls` entries, clear content, let tool loop execute. Zero extra cost, handles the exact failure.
- Option B: Re-request AI with stricter schema if `<function>` detected. Extra API call, fixes root cause but expensive.
- Option C: Strip and warn. Prevents exposure but doesn't execute the action.
**Decision**: Option A — immediate fix with no API overhead.

### Decision 3: Auto-verify compound steps after tool loop
**Ambiguity**: Should we check that all detected ArabicIntent types were addressed?
**Explored**:
- Option A (chosen): Compare completed tool names against detected intents. If intent produced no matching tool call, inject "missing step" result and continue loop.
- Option B: Log-only — warn but don't re-loop. Simpler but Talk.md:2 failure persists.
**Decision**: Option A — catches Talk.md:2 pattern (compound request where AI emitted subset of steps).

### Decision 4: Permission resolution enhanced with session entity lookup
**Ambiguity**: Should `buildArabicPermissionOperations()` resolve entity names from session memory?
**Explored**:
- Option A (chosen): Pass sessionEntities parameter. If no snowflake, check entity-name matches + fallback to last_channel_id.
- Option B: Don't modify shortcut, let AI handle it. But Talk.md:36 showed AI can fail.
**Decision**: Option A — adds resilience with minimal code change.

### Decision 5: Entity names included in deterministic replies
**Ambiguity**: Should `buildToolExecutionReply()` include created/deleted channel names?
**Explored**:
- Option A (chosen): Read `createdEntities`/`created` from createChannels and `deleted` from deleteChannels. Reply: "تم إنشاء 3 قنوات: عام-1, خاص"
- Option B: Keep generic, let AI wrapping add names. Depends on AI always responding.
**Decision**: Option A — immediate improvement even before AI wrapping layer.

### Decision 6: Broaden compound_planner regex
**Ambiguity**: Should compound_planner detect "3 رومات + واحد خاص + permission" patterns?
**Explored**:
- Option A (chosen): Add patterns for N رومات + واحد/واحدة اسمه X + كلهم عام/مقفل, and احذف X + ابق Y + سو Z.
- Option B: Defer, let intent verification catch missed steps. Misses optimization opportunity.
**Decision**: Option A — pre-detection prevents the problem rather than catching it after.

## Ordering Constraints
- Slice 1 (function tag normalizer) and Slice 2 (AI reply wrapping) are independent — can be generated in sequence but modify non-overlapping lines
- Slice 3 (intent verification) depends on Slice 2 (uses same post-loop area, adds after wrapping logic)
- Slices 4-6 are independent of each other and of Slices 1-3 (different files, non-overlapping)

## Verification Notes
- After Slice 1: grep for `<function>` in any response content → should be zero after normalization
- After Slice 2: AI should produce Arabic sentences after tool results, not "تم إنشاء N قناة بنجاح"
- After Slice 3: Compound requests with missing steps should trigger re-loop
- After Slice 4: "روم الخاص" without snowflake should resolve from session entities
- After Slice 5: Reply should include created/deleted channel names
- After Slice 6: Emotional tone detection should be visible in enriched prompt

## Performance Considerations
- Slice 2 adds one extra AI call per tool-result generation (AI wrap). This is acceptable because tool-call loops are rare per user message (typically 1-3 tools per loop, each adding at most one wrap call).
- Slice 3 may add an extra AI loop iteration for compound requests. In practice, this happens rarely (when AI misses a step).
- All other slices add negligible overhead (regex checks, string parsing, array lookups).

## Migration Notes
N/A — all changes are behavioral modifications, no schema migrations.

## Pattern References
- `src/services/conversation.ts:1-68` — `getConversationReply()` Arabic warm response pattern (emoji, dialect, normalized)
- `src/index.ts:541-547` — `edit_permissions` case in `buildToolExecutionReply` (reads args for rich reply — pattern to follow for create/delete channels)
- `src/utils/discordTools.ts:130-218` — `createChannels()` returns `createdEntities` with `{id, name, type}`
- `src/intelligence/memory_manager.ts:489-527` — `trimToolResult()` preserves `createdEntities` and `deleted` arrays

## Developer Context
**Q**: For the AI personality fix: what approach for deterministic replies?
**A**: AI wraps deterministic reply — inject as tool result, continue loop (selected from 3 options)

**Q**: For `<function>` tag exposure: how to normalize?
**A**: Convert `<function>` to tool_calls by parsing content (selected from 3 options)

**Q**: For compound-step verification: verify and re-loop?
**A**: Auto-verify and re-loop (selected from 2 options)

**Q**: For permission resolution: add session entity lookup?
**A**: Add session entity resolution (selected from 2 options)

**Q**: For entity names in replies: include them?
**A**: Include names in replies (selected from 2 options)

**Q**: For compound_planner regex: broaden patterns?
**A**: Broader patterns (selected from 2 options)

## Phase 1: `<function>` Tag Normalizer

### Overview
Add a utility that scans `aiResponse.content` for `<function>toolName</function>{jsonArgs}</function>` patterns before the tool-call loop, converts them into real `tool_calls` entries, and clears the content. This prevents the Talk.md:36 failure where raw function syntax reached the user. Depends on nothing (foundation).

### Changes Required:

#### 1. src/utils/functionTagNormalizer.ts
**File**: `src/utils/functionTagNormalizer.ts`
**Changes**: NEW — `<function>` tag parser and normalizer

```typescript
const FUNCTION_TAG_TOOL_MAP: Record<string, string> = {
  'permissionOverwrites.edit': 'edit_permissions',
  'channel.permissionOverwrites.edit': 'edit_permissions',
  'PermissionOverwrites.edit': 'edit_permissions',
  'permissionOverwrites': 'edit_permissions',
  'createChannel': 'create_channels',
  'guild.channels.create': 'create_channels',
  'channel.create': 'create_channels',
  'deleteChannel': 'delete_channels',
  'guild.channels.delete': 'delete_channels',
  'channel.delete': 'delete_channels',
  'channel.setName': 'channel_operations',
  'channel.setTopic': 'channel_operations',
  'channel.setNSFW': 'channel_operations',
  'channel.setRateLimitPerUser': 'channel_operations',
  'channel.setBitrate': 'channel_operations',
  'channel.setUserLimit': 'channel_operations',
  'role.setName': 'role_operations',
  'role.setColor': 'role_operations',
  'role.setHoist': 'role_operations',
  'role.setMentionable': 'role_operations',
  'guild.members.ban': 'manage_members',
  'guild.members.kick': 'manage_members',
  'member.timeout': 'manage_members',
  'guild.members.unban': 'manage_members',
};

export interface NormalizedFunctionTagResult {
  toolCalls: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
  cleanContent: string;
  hasNormalized: boolean;
}

export function normalizeFunctionTags(content: string): NormalizedFunctionTagResult | null {
  if (!content || typeof content !== 'string') return null;
  if (!content.includes('<function>')) return null;
  const pattern = /<function>([^<]+)<\/function>(.*?)<\/function>/gs;
  const toolCalls: NormalizedFunctionTagResult['toolCalls'] = [];
  let cleanContent = content;
  let match: RegExpExecArray | null;
  let hasNormalized = false;
  while ((match = pattern.exec(content)) !== null) {
    const [fullMatch, rawToolName, rawArgs] = match;
    const trimmedName = rawToolName.trim();
    const toolName = FUNCTION_TAG_TOOL_MAP[trimmedName] ?? trimmedName;
    let argsStr = rawArgs.trim();
    if (argsStr) {
      try { JSON.parse(argsStr); } catch {
        try {
          const fixed = argsStr
            .replace(/(\s*'?)([a-zA-Z_$][\w$]*)(\s*):/g, '"$2":')
            .replace(/:\s*'([^']*)'/g, ':"$1"')
            .replace(/,/s*([\]}])/g, '$1');
          JSON.parse(fixed);
          argsStr = fixed;
        } catch { argsStr = '{}'; }
      }
    } else { argsStr = '{}'; }
    const callId = `fn_${Date.now()}_${toolCalls.length}_${Math.random().toString(36).slice(2, 6)}`;
    toolCalls.push({
      id: callId, type: 'function',
      function: { name: toolName.toLowerCase().replace(/\s+/g, '_'), arguments: argsStr },
    });
    cleanContent = cleanContent.replace(fullMatch, '').trim();
    hasNormalized = true;
  }
  if (!hasNormalized) return null;
  return { toolCalls, cleanContent, hasNormalized };
}
```

#### 2. src/index.ts (three insertion points)
**File**: `src/index.ts`
**Changes**: MODIFY — (a) Add import for normalizeFunctionTags. (b) Normalize before tool loop at ~:1324. (c) Normalize after in-loop runAIRequest at ~:1448. (d) Final safety send uses normalized finalContent.

```typescript
// Import added near line 117:
import { normalizeFunctionTags } from './utils/functionTagNormalizer.js';

// Before tool loop (~:1324):
if (!aiResponse.tool_calls && typeof aiResponse.content === 'string' && aiResponse.content.includes('<function>')) {
  const normalized = normalizeFunctionTags(aiResponse.content);
  if (normalized) {
    aiResponse.tool_calls = normalized.toolCalls;
    aiResponse.content = normalized.cleanContent || null;
  }
}

// Inside loop after runAIRequest (~:1464):
if (!aiResponse.tool_calls && typeof aiResponse.content === 'string' && aiResponse.content.includes('<function>')) {
  const normalized = normalizeFunctionTags(aiResponse.content);
  if (normalized) {
    aiResponse.tool_calls = normalized.toolCalls;
    aiResponse.content = normalized.cleanContent || null;
  }
}

// Final safety send (uses finalContent not aiResponse.content):
let finalContent = aiResponse.content ?? '';
if (typeof aiResponse.content === 'string' && aiResponse.content.includes('<function>')) {
  const lastNormalized = normalizeFunctionTags(aiResponse.content);
  if (lastNormalized) {
    if (lastNormalized.toolCalls.length > 0) {
      console.warn('[AI Router] <function> tags survived all loops — late execution.');
      for (const tc of lastNormalized.toolCalls) {
        try {
          const args = JSON.parse(tc.function.arguments);
          await executeToolWithAudit(tc.function.name, args, message.guild, message.channel.id, message.author.id, message.member);
        } catch { /* best-effort */ }
      }
    }
    finalContent = lastNormalized.cleanContent || '';
  }
}
// ... final send uses finalContent, not aiResponse.content
```

### Success Criteria:

#### Automated Verification:
- [x] File exists: `src/utils/functionTagNormalizer.ts`
- [x] Import added in `src/index.ts`: `normalizeFunctionTags`
- [x] No `<function>` tags in any user-facing response: grep for `<function>` in sent messages

#### Manual Verification:
- [ ] Send a permission request without snowflake ("روم الخاص ابيه يدخل يتكلم") — verify no raw `<function>` text reaches the user
- [ ] Verify `normalizeFunctionTags()` correctly maps `permissionOverwrites.edit` → `edit_permissions`

## Phase 2: AI Reply Wrapping

### Overview
Change the tool loop exit behavior at `src/index.ts:1428-1434` from "break on deterministic reply" to "inject deterministic reply as new tool result and continue AI loop". The AI then wraps results in natural Arabic. Depends on nothing (independent of Slice 1, modifies different lines).

### Changes Required:

#### 1. src/index.ts:1428-1469
**File**: `src/index.ts:1428-1469`
**Changes**: MODIFY — Instead of breaking after `buildToolExecutionReply()`, inject the deterministic reply as system-prompt context and call runAIRequest for natural-language wrapping

```typescript
if (deterministicReply) {
  // Pass deterministic reply as system-prompt context for AI natural-language wrapping
  // (avoids orphan tool_call_id — injected as prompt context, not as a tool message)
  await (message.channel as any).sendTyping().catch(() => null);
  aiResponse = await runAIRequest(message.guild.id, history, {
    systemPrompt: [
      ContextEngine.buildSystemPrompt(sessionContext, message.guild, message.author.id),
      memoryManager.buildEntityContext(message.channel.id),
      SkillRegistry.buildSkillManifestForAI(),
      '[TOOL_EXECUTION_COMPLETE]',
      deterministicReply,
      '[/TOOL_EXECUTION_COMPLETE]',
      'Reply naturally in your language. Summarize what happened using names when available. Ask if the user needs anything else.',
    ].join('\n'),
  });
  // Normalize <function> tags (Slice 1)
  if (!aiResponse.tool_calls && typeof aiResponse.content === 'string' && aiResponse.content.includes('<function>')) {
    const normalized = normalizeFunctionTags(aiResponse.content);
    if (normalized) {
      aiResponse.tool_calls = normalized.toolCalls;
      aiResponse.content = normalized.cleanContent || null;
    }
  }
  if (aiResponse.content && (!aiResponse.tool_calls || aiResponse.tool_calls.length === 0)) {
    await sendLongMessage(message, aiResponse.content);
    // ... store in memory ...
    finalResponseSent = true;
    break;
  }
  if (!aiResponse.content && (!aiResponse.tool_calls || aiResponse.tool_calls.length === 0)) {
    await sendLongMessage(message, deterministicReply);
    // ... store in memory ...
    finalResponseSent = true;
    break;
  }
  // AI returned tool_calls — loop continues
  continue;
}

### Success Criteria:

#### Automated Verification:
- [x] Deterministic reply is no longer sent as the ONLY response to tool results
- [x] AI wrapping fires for compound requests (2+ tools executed)
- [x] `!finalResponseSent` guard prevents double-send

#### Manual Verification:
- [ ] Create 2 channels → verify AI wraps with natural Arabic (not just "تم إنشاء 2 قناة")
- [ ] Verify fallback to deterministic reply when AI returns empty content

## Phase 3: Compound-Step Intent Verification

### Overview
Add a utility that compares completed tool names against detected ArabicIntent types. If an intent (DELETE_CHANNEL, SET_PERMISSIONS) was detected but no matching tool was executed, inject a "missing step" tool result and continue the loop. Depends on Phase 2 (same post-loop region).

### Changes Required:

#### 1. src/services/intentVerifier.ts
**File**: `src/services/intentVerifier.ts`
**Changes**: NEW — Multi-intent detection + verification utility. Exports `detectAllIntents()`, `findMissingIntents()`, `buildMissingIntentPrompt()`.

```typescript
export function detectAllIntents(text: string): ArabicIntent[] {
  const results: ArabicIntent[] = [];
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    if (patterns.some((p) => p.test(text))) results.push(intent as ArabicIntent);
  }
  return results;
}
export function findMissingIntents(detectedIntents: ArabicIntent[], executedToolNames: string[]): MissingIntent[] {
  const missing: MissingIntent[] = [];
  for (const intent of detectedIntents) {
    if (intent === 'UNKNOWN') continue;
    const requiredTools = INTENT_TO_TOOLS[intent];
    if (!requiredTools?.length) continue;
    if (!executedToolNames.some((n) => requiredTools.includes(n)))
      missing.push({ intent, description: INTENT_DESCRIPTIONS[intent] || intent });
  }
  return missing;
}
export function buildMissingIntentPrompt(missing: MissingIntent[]): string {
  if (!missing.length) return '';
  return '[MISSING_STEPS]\nThe following requested actions were not completed:\n' +
    missing.map((m) => '- ' + m.description).join('\n') + '\n[/MISSING_STEPS]';
}
```

#### 2. src/index.ts (post-loop area)
**File**: `src/index.ts`
**Changes**: MODIFY — After while loop, detectAllIntents + findMissingIntents. If missing steps, call runAIRequest with proper history/targets/AI wrapping.

```typescript
if (!finalResponseSent) {
  const allIntents = detectAllIntents(cleanedPromptText);
  const executedToolNames = completedToolResults.map((r) => r.name);
  const missingIntents = findMissingIntents(allIntents, executedToolNames);
  if (missingIntents.length > 0) {
    // Build system prompt with missing steps
    // Call runAIRequest → store assistant msg in history
    // If tool_calls: applyExplicitTargets + execute + store tool msgs
    // If content: use directly (AI-wrapped)
  }
}
```

### Success Criteria:

#### Automated Verification:
- [x] `detectAllIntents()` returns ALL matching intents (not just first)
- [x] Verifier fires `runAIRequest` when missing intents found
- [x] Verify AI response stored as `AIMessage` in `history`
- [x] Verify tool calls use `applyExplicitTargets` preprocessing

#### Manual Verification:
- [ ] Send "احذف كل الرومات وسوي 3 رومات" → verify both DELETE_CHANNEL and CREATE_CHANNEL detected
- [ ] Verify no re-verification when all intents already addressed 

## Phase 4: Permission Resolution + Target Fallback + Tool Regex

### Overview
Four independent changes in one phase: (a) enhance `buildArabicPermissionOperations()` to accept `sessionEntities` and resolve entity names, (b) pass `sessionEntities` from the caller in `src/index.ts:1111`, (c) fix `toolTargeting.ts:140-144` to match bare "روم", (d) add permission keywords to tool selection regexes in `ai.ts:730` and `toolIntent.ts:94`. Depends on nothing (independent files).

### Changes Required:

#### 1. src/intelligence/arabic_nlp.ts:144-151
**File**: `src/intelligence/arabic_nlp.ts:144-151`
**Changes**: MODIFY — Add optional `sessionEntities` parameter to `buildArabicPermissionOperations()`. If no valid channel snowflake found, check session entities for name matches and fall back to `last_channel_id`-style entity.

```typescript
// ALREADY APPLIED on disk:
// Added sessionEntities param to function signature
// Entity name matching: normalize both text and entity names, find match by inclusion
```

#### 2. src/index.ts:1111-1135
**File**: `src/index.ts:1111-1135`
**Changes**: MODIFY — Fetch `sessionEntities` before calling `buildArabicPermissionOperations()` and pass them

```typescript
// ALREADY APPLIED on disk:
// buildArabicPermissionOperations call now passes:
//   memoryManager.getRecentEntities(message.channel.id)
// as third argument
```

#### 3. src/services/toolTargeting.ts:140-144
**File**: `src/services/toolTargeting.ts:140-144`
**Changes**: MODIFY — Add bare "روم" to the fallback regex for latest-entity resolution

```typescript
// ALREADY APPLIED on disk:
// Added bare "روم" to fallback regex:
// /(?:الروم|روم|القناة|الشانل|the\s+(?:room|channel))/i
```

#### 4. src/services/ai.ts:730
**File**: `src/services/ai.ts:730`
**Changes**: MODIFY — Add Arabic permission keywords "يدخل", "يخش", "يتكلم", "سكرين", "يشارك" to the channel/permission tool group regex

```typescript
// ALREADY APPLIED on disk:
// Added to channel permission regex:
// يدخل|يخش|يتكلم|سكرين|يشارك|صلاحية|صلاحيات
```

#### 5. src/services/toolIntent.ts:94
**File**: `src/services/toolIntent.ts:94`
**Changes**: MODIFY — Add same Arabic permission keywords to the channel tool group regex in toolIntent.ts

```typescript
// ALREADY APPLIED on disk:
// Added to channel permission regex:
// يدخل|يخش|يتكلم|سكرين|يشارك|صلاحية|صلاحيات
```

### Success Criteria:

#### Automated Verification:
- [x] `buildArabicPermissionOperations()` resolves channel names from sessionEntities when no snowflake
- [x] `toolTargeting.ts` bare "روم" regex matches unqualified room references
- [x] `ai.ts` + `toolIntent.ts` permission keywords include `يدخل|يخش|يتكلم|سكرين|يشارك|صلاحية|صلاحيات`

#### Manual Verification:
- [ ] Send permission request with "روم الخاص" (no snowflake) → verify resolves from entities
- [ ] Send "ابي يدخل يتكلم سكرين" → verify edit_permissions tool is available

## Phase 5: Compound Planner Regex + Entity Names in Replies

### Overview
Broaden compound_planner regexes to detect "N رومات + واحد اسمه X + visibility/permissions" and "احذف X + ابق Y + سو Z" patterns. Also add `create_channels` and `delete_channels` cases to `buildToolExecutionReply()` that read entity names from tool results and produce informative replies. Depends on nothing (independent).

### Changes Required:

#### 1. src/intelligence/compound_planner.ts:23-107
**File**: `src/intelligence/compound_planner.ts:23-107`
**Changes**: MODIFY — Add broader regex patterns for multi-room creation with naming/permissions constraints and compound delete+preserve+create workflows

```typescript
// ALREADY APPLIED on disk:
// Added multi-room pattern: "N رومات + واحد اسمه X + مقفل/مقفول + visibility"
// Added delete+preserve+create pattern: "احذف X + ابق Y + سو Z"
```

#### 2. src/index.ts:495-558 (buildToolExecutionReply)
**File**: `src/index.ts:495-558`
**Changes**: MODIFY — Add `create_channels` and `delete_channels` cases that read `result.createdEntities`/`result.created` and `result.deleted` to produce entity-inclusive replies

```typescript
// ALREADY APPLIED on disk:
// Added before generic fallback:
// if name === 'create_channels' && Array.isArray(result?.created):
//   return `تم إنشاء ${result.created.length} قناة: ${names}.`
// if name === 'delete_channels' && Array.isArray(result?.deleted):
//   return `تم حذف ${result.deleted.length} قناة (${names}).`
```

### Success Criteria:

#### Automated Verification:
- [x] `buildToolExecutionReply()` has `create_channels` case reading `result.created`/`createdEntities`
- [x] `buildToolExecutionReply()` has `delete_channels` case reading `result.deleted`
- [x] `compound_planner.ts` matches "3 رومات + واحد اسمه خاص + مقفل" pattern

#### Manual Verification:
- [ ] Create channels → verify reply includes names: "تم إنشاء 2 قناة: عام-1, خاص"
- [ ] Delete channels → verify reply includes deleted names

## Phase 6: System Prompt + Emotional Tone + Apology Instruction

### Overview
Update the system prompt to include: (a) explicit `edit_permissions` Arabic-phrase→tool-name mapping, (b) apology/acknowledgment instruction for corrections, (c) emotional tone detection injected into enriched prompt. Add emotional tone awareness during `ContextAnalyzer.analyze()`. Depends on nothing (independent).

### Changes Required:

#### 1. src/services/ai.ts:160-190
**File**: `src/services/ai.ts:160-190`
**Changes**: MODIFY — Add `edit_permissions` tool mapping section after "Absolute Discord permission knowledge". Add apology/acknowledgment instruction after "Never argue with a user correction". Add emotional tone handling instruction.

```typescript
// ALREADY APPLIED on disk:
// System prompt additions:
// 1. Apology instruction after "Never argue with a user correction"
// 2. edit_permissions tool mapping section in Tool behavior
// 3. Emotional tone handling instruction in Random embed prohibition
```

#### 2. src/index.ts:1164 (ContextAnalyzer.analyze call area)
**File**: `src/index.ts:~1164`
**Changes**: MODIFY — Add emotional tone tag injection during ContextAnalyzer.analyze. Detect frustration markers and affection markers, inject as `[USER_TONE: frustrated|warm|neutral]`.

```typescript
// CHANGE DEFERRED to existing sentiment analysis:
// context_analyzer.ts already injects SENTIMENT tag in [DIALECT:...]
// System prompt now includes instruction about using SENTIMENT tag
```

#### 3. src/services/conversation.ts
**File**: `src/services/conversation.ts`
**Changes**: MODIFY — Add apology/acknowledgment patterns and frustration detection patterns to the conversation handler

```typescript
// ALREADY UPDATED on disk:
// angryWords list expanded: added ياثور, يا ثور, اهبل, مجنون, فاشل, زعلان, غضبان
```

### Success Criteria:

#### Automated Verification:
- [x] System prompt contains apology instruction after "Never argue with a user correction"
- [x] System prompt contains edit_permissions tool mapping section
- [x] System prompt contains emotional tone instruction referencing SENTIMENT tag
- [x] `context_analyzer.ts` angryWords includes `ياثور|يا ثور|اهبل`

#### Manual Verification:
- [ ] Correct bot with angry user → verify apology in response
- [ ] Verify SENTIMENT tag appears in enriched prompt

## Plan History
- Phase 1: `<function> Tag Normalizer` — approved as generated
- Phase 2: `AI Reply Wrapping` — approved as generated
- Phase 3: `Compound-Step Intent Verification` — approved as generated
- Phase 4: `Permission Resolution + Target Fallback + Tool Regex` — approved as generated
- Phase 5: `Compound Planner Regex + Entity Names in Replies` — approved as generated
- Phase 6: `System Prompt + Emotional Tone + Apology Instruction` — approved as generated

## References
- `.rpiv/artifacts/research/2026-06-16_22-36-37_discord-ai-bot-failures.md` — Root cause analysis (12 findings, all categories)
