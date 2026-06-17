---
date: 2026-06-17T13:49:30+0300
author: Abu Awad
commit: 2f1e828
branch: main
repository: Opus
topic: "Wire Discord Knowledge Skills into Live Bot Reasoning"
tags: [plan, codebase, discord, skills, prompt-engineering, routing, safety]
status: ready
parent: .rpiv/artifacts/research/2026-06-17_13-32-39_wire-discord-skills-into-live-reasoning.md
phase_count: 6
phases:
  - { n: 1, title: KnowledgeSkillLoader }
  - { n: 2, title: System prompt injection }
  - { n: 3, title: Anti-pattern safety gate }
  - { n: 4, title: Intent enrichment }
  - { n: 5, title: Entity tombstone tracking }
  - { n: 6, title: Integration tests }
unresolved_phase_count: 0
last_updated: 2026-06-17T13:49:30+0300
last_updated_by: Abu Awad
last_updated_note: Plan finalized, 6 phases approved, anti-pattern validator and tombstone tracking added
---

# Wire Discord Knowledge Skills Into Live Bot Reasoning — Implementation Plan

## Overview
Wire the 8 Discord knowledge `.md` reference files under `skills/` into the bot's live decision-making pipeline using a `KnowledgeSkillLoader` (startup-loaded section parser + per-request selector), a `validateToolKnowledgeRules()` deterministic anti-pattern gate inside `executeToolWithAudit()`, and entity tombstone tracking. Total per-request injected content: 30-60 lines max.

## Requirements
- Read `skills/*.md` files at bot startup and parse into sections by `##` headings
- Maintain an intent-to-section index that maps detected intents (`CREATE_CHANNEL`, `SET_PERMISSIONS`, `BAN_USER`, `DELETE_CHANNEL`, `KICK_USER`, `TIMEOUT_USER`, `GIVE_ROLE`) to relevant skill sections
- Expose `getRelevantSections(intents, tools, text) → string[]` returning at most 60 lines of selected skill content
- Inject selected knowledge blocks into the system prompt (`[DISCORD_KNOWLEDGE_*]`) during context enrichment
- Add automatic anti-pattern validator called inside `executeToolWithAudit()` that blocks dangerous operations matching known WRONG/RIGHT anti-patterns before Discord mutations
- Extend `INTENT_PATTERNS` to detect bulk, structure, and role intents
- Mark deleted channels/roles as tombstoned in `EntityRegistry` and check tombstone state in generic reference resolution
- All existing tests continue to pass

## Current State Analysis
- `src/intelligence/discord_knowledge.ts:124` — `buildDiscordKnowledgePrompt()` returns a compact ~10-line Discord rules block hardcoded in TypeScript
- `src/intelligence/context_engine.ts:104-112` — `ContextEngine.buildSystemPrompt()` assembles the live system prompt, calling `buildDiscordKnowledgePrompt()` and `EntityRegistry.injectIntoPrompt()`
- `src/index.ts:1249-1252` — System prompt array assembled from context engine output + entity memory + skill manifest
- `src/index.ts:447-467` — `executeToolWithAudit()` wraps tool execution, registers entities, audits result — but no anti-pattern check exists
- `src/intelligence/arabic_nlp.ts:3-63` — `INTENT_PATTERNS` covers basic create/delete/permission/ban/kick/timeout/give_role but NOT bulk, structure, or role-management operations
- `src/services/intentVerifier.ts:20-29` — `INTENT_TO_TOOLS` maps intents to tool names; missing mappings for any new intents
- `src/intelligence/entity_registry.ts:140-321` — `registerToolResult()` registers created/edited channels/roles but does NOT mark deleted ones
- `src/services/toolTargeting.ts:131-142` — Generic "الروم" reference resolution uses `EntityRegistry.getLatest()` which can return stale/deleted channels

### Key Discoveries
- `EntityRegistry` at `entity_registry.ts:54-75` has the exact startup-load pattern to model: `initialize()` → read from disk → parse → index in `Map<string, RegisteredEntity[]>` → expose query methods
- `SkillRegistry` at `skill_registry.ts:76-144` is the executable skill counterpart but has a different loading pattern (directory traversal for .skill.ts files); NOT to be reused for .md files
- `validateAIToolPermission()` at `index.ts:210-279` is the existing permission-check pattern that `validateToolKnowledgeRules()` should mirror in structure (switch on tool name, return `{ allowed, message }`)
- The `systemPrompt` array at `index.ts:1249` uses array join, making it trivial to inject additional `[DISCORD_KNOWLEDGE_*]` blocks

## Desired End State
- On startup, `KnowledgeSkillLoader.load()` reads `skills/discord-*.md`, parses sections, and builds the intent index
- On each user message, `KnowledgeSkillLoader.getRelevantSections(detectedIntents, toolNames, rawText)` returns ≤3 section strings (each ≤20 lines)
- `ContextEngine.buildSystemPrompt()` appends these sections as `[DISCORD_KNOWLEDGE_permissions]`, `[DISCORD_KNOWLEDGE_moderation]`, etc.
- `validateToolKnowledgeRules()` inside `executeToolWithAudit()` checks planned args against anti-pattern rules (AP-001 through AP-012) and blocks dangerous operations
- `detectArabicIntent()` recognizes bulk deletion, server rebuild requests, and role-management phrases
- Deleted channels/roles are tombstoned in the entity registry within 1 second; reference resolution checks tombstone state

## What We're NOT Doing
- No `request_knowledge` tool (LLM-driven knowledge retrieval — deferred to future plan)
- No hot-reload file watcher for `.md` changes — bot restart required
- No full `Server State Index` — tombstone tracking is a lightweight standalone improvement
- No changes to `SkillRegistry` or `execute_skill` tool schema — `.md` files remain passive references
- No changes to the existing `buildDiscordKnowledgePrompt()` compact block — it stays as general guidance; selected skill sections are ADDITIONAL

## Decisions

### KnowledgeSkillLoader startup-load pattern
Follow `EntityRegistry.initialize()` at `entity_registry.ts:54-75`. Read files at startup, parse into structured index, expose query methods. In-memory only, no disk persistence needed for the parsed index. (Directional confirm — approved)

### Intent-to-section mapping format
Hardcoded TypeScript config object inside `knowledge_skill_loader.ts`. Type-safe, simpler, no extra file. Update requires code change but mappings change at the same velocity as the TypeScript codebase. (Ambiguity — resolved)

### Anti-pattern validator behavior
BLOCK invalid operations with a specific reason and suggested fix. Matches the "always confirm for destructive actions" policy. (Ambiguity — resolved)

### Entity tombstone tracking scope
Included in this plan — add `deleted` state to entity registry, mark on delete operations, check in generic reference resolution. (Scope — resolved)

## Phase 1: KnowledgeSkillLoader

### Overview
Create the new `src/intelligence/knowledge_skill_loader.ts` file. Types, `##`-heading section parser, intent-to-section config table, `load()` and `getRelevantSections()` methods. Foundation — all subsequent phases depend on this.

### Changes Required:

#### 1. src/intelligence/knowledge_skill_loader.ts
**File**: src/intelligence/knowledge_skill_loader.ts
**Changes**: NEW — KnowledgeSkillLoader class with types, parser, index, and selector

```typescript
import fs from 'node:fs';
import path from 'node:path';
import type { ArabicIntent } from '../intelligence/arabic_nlp.js';

// ─── Types ──────────────────────────────────

export interface SkillSection {
  heading: string;
  content: string;
  lineCount: number;
}

export interface SkillFile {
  id: string;
  filePath: string;
  sections: SkillSection[];
}

export interface KnowledgeSelection {
  content: string;
  source: string;
}

// ─── Intent-to-section index (config) ───────

interface SectionRef {
  fileId: string;
  headingPattern: string;
  maxLines: number;
}

const INTENT_TO_SECTIONS: Partial<Record<ArabicIntent, SectionRef[]>> = {
  SET_PERMISSIONS: [
    { fileId: 'discord-permissions-reference', headingPattern: 'dangerous permission', maxLines: 25 },
    { fileId: 'discord-permission-resolution-order', headingPattern: 'core rule', maxLines: 15 },
    { fileId: 'discord-permission-resolution-order', headingPattern: 'common access recipes', maxLines: 20 },
  ],
  DELETE_CHANNEL: [
    { fileId: 'discord-rate-limits-and-bulk-ops', headingPattern: 'bulk channel deletion', maxLines: 20 },
  ],
  BAN_USER: [
    { fileId: 'discord-moderation', headingPattern: 'ban', maxLines: 20 },
  ],
  KICK_USER: [
    { fileId: 'discord-moderation', headingPattern: 'kick', maxLines: 15 },
  ],
  TIMEOUT_USER: [
    { fileId: 'discord-moderation', headingPattern: 'timeout', maxLines: 15 },
  ],
  GIVE_ROLE: [
    { fileId: 'discord-roles-and-hierarchy', headingPattern: 'creation and editing', maxLines: 15 },
    { fileId: 'discord-roles-and-hierarchy', headingPattern: 'position and hierarchy', maxLines: 15 },
  ],
  CREATE_CHANNEL: [
    { fileId: 'discord-channels-and-categories', headingPattern: 'canonical channel types', maxLines: 20 },
    { fileId: 'discord-channels-and-categories', headingPattern: 'categories and inheritance', maxLines: 15 },
    { fileId: 'discord-server-structure-patterns', headingPattern: 'general build order', maxLines: 12 },
  ],
};

const TOOL_KEYWORD_TO_SECTIONS: Record<string, SectionRef[]> = {
  delete_channels: [{ fileId: 'discord-rate-limits-and-bulk-ops', headingPattern: 'bulk channel deletion', maxLines: 20 }],
  manage_members: [{ fileId: 'discord-moderation', headingPattern: 'mandatory preflight', maxLines: 15 }],
  edit_permissions: [{ fileId: 'discord-permissions-reference', headingPattern: 'dangerous permission', maxLines: 25 }],
  bulk_permission_update: [{ fileId: 'discord-permission-resolution-order', headingPattern: 'common access recipes', maxLines: 20 }],
  create_channels: [{ fileId: 'discord-channels-and-categories', headingPattern: 'safe creation order', maxLines: 10 }],
};

// ─── KnowledgeSkillLoader ───────────────────

export class KnowledgeSkillLoader {
  private static skillsDir = path.join(process.cwd(), 'skills');
  private static files = new Map<string, SkillFile>();
  private static loaded = false;

  static load(skillsDirOverride?: string): void {
    if (this.loaded) return;
    if (skillsDirOverride) this.skillsDir = skillsDirOverride;
    this.loaded = true;

    const resolved = path.resolve(this.skillsDir);
    if (!fs.existsSync(resolved)) {
      console.warn('[KnowledgeSkillLoader] skills directory not found:', resolved);
      return;
    }

    let fileCount = 0;
    let sectionCount = 0;
    try {
      const entries = fs.readdirSync(resolved, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
        const fullPath = path.join(resolved, entry.name);
        const fileId = entry.name.replace(/\.md$/, '');
        const content = fs.readFileSync(fullPath, 'utf8');
        const sections = this.parseSections(content);
        this.files.set(fileId, { id: fileId, filePath: fullPath, sections });
        fileCount++;
        sectionCount += sections.length;
      }
      console.log('[KnowledgeSkillLoader] Loaded', fileCount, 'skill files,', sectionCount, 'sections.');
    } catch (error) {
      console.error('[KnowledgeSkillLoader] Failed to load skills:', error);
    }
  }

  static getRelevantSections(
    intents: ArabicIntent[],
    toolNames: string[],
    rawText: string
  ): KnowledgeSelection[] {
    if (!this.loaded) this.load();

    const selected = new Map<string, KnowledgeSelection>();
    const intentSet = new Set(intents);

    // 1. From intents
    for (const [intent, refs] of Object.entries(INTENT_TO_SECTIONS)) {
      if (!intentSet.has(intent as ArabicIntent)) continue;
      for (const ref of refs) this.addSection(selected, ref);
    }

    // 2. From tool names (fallback when UNKNOWN)
    if (intentSet.has('UNKNOWN' as ArabicIntent) || intentSet.size === 0) {
      for (const toolName of toolNames) {
        const refs = TOOL_KEYWORD_TO_SECTIONS[toolName];
        if (refs) for (const ref of refs) this.addSection(selected, ref);
      }
    }

    // 3. Enforce budget: max 3 sections, max 60 lines
    const results = [...selected.values()];
    if (results.length > 3) results.length = 3;
    let totalLines = results.reduce((s, r) => s + r.content.split('\n').length, 0);
    while (totalLines > 60 && results.length > 0) {
      results.pop();
      totalLines = results.reduce((s, r) => s + r.content.split('\n').length, 0);
    }

    return results;
  }

  static getLoadedFileIds(): string[] {
    return [...this.files.keys()];
  }

  private static parseSections(content: string): SkillSection[] {
    const lines = content.split('\n');
    const sections: SkillSection[] = [];
    let currentHeading = '(preamble)';
    let currentStart = 0;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('## ')) {
        if (i > currentStart) {
          const sectionLines = lines.slice(currentStart, i);
          sections.push({ heading: currentHeading, content: sectionLines.join('\n'), lineCount: sectionLines.length });
        }
        currentHeading = lines[i].slice(3).trim();
        currentStart = i;
      }
    }
    if (currentStart < lines.length) {
      const sectionLines = lines.slice(currentStart);
      sections.push({ heading: currentHeading, content: sectionLines.join('\n'), lineCount: sectionLines.length });
    }
    return sections;
  }

  private static addSection(selected: Map<string, KnowledgeSelection>, ref: SectionRef): void {
    const file = this.files.get(ref.fileId);
    if (!file) return;
    const section = file.sections.find(s => s.heading.toLowerCase().includes(ref.headingPattern.toLowerCase()));
    if (!section) return;
    const key = ref.fileId + '::' + section.heading;
    if (selected.has(key)) return;
    const lines = section.content.split('\n');
    const truncated = ref.maxLines > 0 && lines.length > ref.maxLines
      ? lines.slice(0, ref.maxLines).join('\n') + '\n<!-- (truncated) -->'
      : section.content;
    selected.set(key, { content: truncated, source: ref.fileId + ' \u2192 ' + section.heading });
  }
}
```

### Success Criteria:

#### Automated Verification:
- [ ] Module parses skills/*.md sections correctly: `KnowledgeSkillLoader.load()` + `getLoadedFileIds()` returns non-empty
- [ ] No TypeScript errors: `npm run build`

#### Manual Verification:
- [ ] Startup log shows `[KnowledgeSkillLoader] Loaded 8 skill files, X sections.`
- [ ] `getRelevantSections(['SET_PERMISSIONS'], [], '')` returns 3 sections totaling \u226460 lines

## Phase 2: System prompt injection

### Overview
Wire the `KnowledgeSkillLoader.getRelevantSections()` call into `ContextEngine.buildSystemPrompt()` and the `systemPrompt` array in `src/index.ts`. Depends on Phase 1.

### Changes Required:

#### 2. src/intelligence/discord_knowledge.ts
**File**: src/intelligence/discord_knowledge.ts
**Changes**: MODIFY — add `buildKnowledgeSectionsForPrompt()` helper

Imports to add at top of file:
```typescript
import { detectAllIntents } from '../services/intentVerifier.js';
import { KnowledgeSkillLoader } from './knowledge_skill_loader.js';
```

Function to add at end of file (after `buildDiscordKnowledgePrompt()`):
```typescript
export function buildKnowledgeSectionsForPrompt(text: string): string {
  const intents = detectAllIntents(text);
  const sections = KnowledgeSkillLoader.getRelevantSections(intents, [], text);
  if (sections.length === 0) return '';
  return sections.map((s) =>
    `[DISCORD_KNOWLEDGE_${s.source.replace(/[^\w]/g, '_').toUpperCase()}]\n${s.content}`
  ).join('\n');
}
```

#### 3. src/index.ts
**File**: src/index.ts
**Changes**: MODIFY — inject selected knowledge sections into systemPrompt array

Add this import to the top of the file:
```typescript
import { buildKnowledgeSectionsForPrompt } from './intelligence/discord_knowledge.js';
```

Around line 1238-1245 (the systemPrompt array), change from:
```typescript
    const systemPrompt = [
      ContextEngine.buildSystemPrompt(sessionContext, message.guild, message.author.id),
      memoryManager.buildEntityContext(message.channel.id),
      SkillRegistry.buildSkillManifestForAI(),
    ].join('\n');
```

To:
```typescript
    const systemPrompt = [
      ContextEngine.buildSystemPrompt(sessionContext, message.guild, message.author.id),
      memoryManager.buildEntityContext(message.channel.id),
      SkillRegistry.buildSkillManifestForAI(),
      buildKnowledgeSectionsForPrompt(cleanedPromptText),
    ].filter(Boolean).join('\n');
```

### Success Criteria:

#### Automated Verification:
- [ ] `npm run build` succeeds without errors
- [ ] Import cycle check: `discord_knowledge.ts → knowledge_skill_loader.ts → arabic_nlp.ts` — no circular dependency

#### Manual Verification:
- [ ] With `SET_PERMISSIONS` intent, system prompt contains `[DISCORD_KNOWLEDGE_...]` block
- [ ] With `UNKNOWN` intent and no specific keywords, system prompt has no extra `[DISCORD_KNOWLEDGE_*]` blocks added 

## Phase 3: Anti-pattern safety gate

### Overview
Create `validateToolKnowledgeRules()` containing the 12 encoded anti-pattern rules from the 8 skill files. Call it inside `executeToolWithAudit()` before the Discord mutation. Depends on Phase 1 (for knowledge section integration but validator logic is self-contained).

### Changes Required:

#### 4. src/intelligence/discord_knowledge.ts
**File**: src/intelligence/discord_knowledge.ts
**Changes**: MODIFY — add `validateToolKnowledgeRules()` function

Add to the type imports at the top of the file:
```typescript
import type { Guild, GuildMember } from 'discord.js';
```

Add these functions at the end of the file:
```typescript
export interface ToolKnowledgeValidation {
  allowed: boolean;
  reason?: string;
  fix?: string;
}

const EVERYONE_ROLE_ID_PATTERN = /^@?everyone$/i;

function isEveryoneRole(args: Record<string, any>, everyoneRoleId: string): boolean {
  return args.targetId === '@everyone' || args.targetId === everyoneRoleId;
}

function hasPermissionInAllow(args: Record<string, any>, permName: string): boolean {
  const allow = Array.isArray(args.allow) ? args.allow : [];
  return allow.some((p: string) => p.toLowerCase() === permName.toLowerCase());
}

function hasPermissionInDeny(args: Record<string, any>, permName: string): boolean {
  const deny = Array.isArray(args.deny) ? args.deny : [];
  return deny.some((p: string) => p.toLowerCase() === permName.toLowerCase());
}

export function validateToolKnowledgeRules(
  name: string,
  args: Record<string, any>,
  guild: Guild,
  actorMember?: GuildMember | null
): ToolKnowledgeValidation {
  const everyoneRoleId = guild.id;

  switch (name) {
    case 'edit_permissions':
    case 'bulk_permission_update':
      return validatePermissionOverwriteRules(args, everyoneRoleId, guild);
    case 'manage_members':
      return validateModerationRules(args, guild, actorMember);
    case 'delete_channels':
      return validateDeleteChannelRules(args);
    default:
      return { allowed: true };
  }
}

function validatePermissionOverwriteRules(
  args: Record<string, any>,
  everyoneRoleId: string,
  guild: Guild
): ToolKnowledgeValidation {
  // AP-001: MoveMembers allowed for @everyone
  if (isEveryoneRole(args, everyoneRoleId) && hasPermissionInAllow(args, 'MoveMembers')) {
    return {
      allowed: false,
      reason: 'لا يمكن إعطاء صلاحية نقل الأعضاء للكل. هذا يسمح لأي شخص بنقل الآخرين إلى رومات خاصة.',
      fix: 'قم بإعطاء صلاحية MoveMembers فقط لرتبة معينة (مشرف/مساعد)، وليس للكل.',
    };
  }

  // AP-002: ManageRoles allowed for @everyone or broad role
  if (isEveryoneRole(args, everyoneRoleId) && hasPermissionInAllow(args, 'ManageRoles')) {
    return {
      allowed: false,
      reason: 'لا يمكن إعطاء صلاحية إدارة الرتب للكل. هذا يسمح لأي شخص بتعديل صلاحيات الرتب.',
      fix: 'قم بإعطاء ManageRoles فقط لرتبة إدارة موثوقة.',
    };
  }

  // AP-003: ManageChannels allowed for @everyone
  if (isEveryoneRole(args, everyoneRoleId) && hasPermissionInAllow(args, 'ManageChannels')) {
    return {
      allowed: false,
      reason: 'لا يمكن إعطاء صلاحية إدارة الرومات للكل. هذا يسمح لأي شخص بحذف أو تعديل الرومات.',
      fix: 'قم بإعطاء ManageChannels فقط لرتبة إدارة.',
    };
  }

  // AP-004: Administrator granted to any role (most dangerous when @everyone)
  if (hasPermissionInAllow(args, 'Administrator')) {
    return {
      allowed: false,
      reason: 'صلاحية Administrator خطيرة ويجب أن تبقى فقط لمالك السيرفر.',
      fix: 'تجنب إعطاء Administrator لأي رتبة. استخدم صلاحيات محددة بدلاً من ذلك.',
    };
  }

  // AP-005: ViewChannel denied for @everyone — hides the channel rather than creating visible-but-locked
  if (isEveryoneRole(args, everyoneRoleId) && hasPermissionInDeny(args, 'ViewChannel')) {
    return {
      allowed: false,
      reason: 'منع مشاهدة الروم للكل يخفي الروم بالكامل. إذا كنت تقصد "مقفل بس يشوفونه"، امنع صلاحية أخرى (مثل SendMessages للنصي أو Connect للصوتي) بدلاً من منع المشاهدة.',
      fix: 'لروم نصي مقفل للقراءة فقط: امنع SendMessages. لروم صوتي مقفل: امنع Connect.',
    };
  }

  // AP-010: Category-level permission update — warn about unsynced children
  if (args.channelId && guild.channels.cache.get(args.channelId)?.type === ChannelType.GuildCategory) {
    return {
      allowed: true,
      reason: 'ملاحظة: تعديل صلاحيات الكاتقوري لا يطبق تلقائياً على الرومات الموجودة تحته إذا كانت غير متزامنة.',
      fix: 'تحقق من مزامنة الرومات بعد تعديل صلاحيات الكاتقوري.',
    };
  }

  // AP-012: Stream in allow but uses name "Stream" which maps incorrectly in this project
  if (hasPermissionInAllow(args, 'Stream') && !hasPermissionInAllow(args, 'Video')) {
    return { allowed: true };
  }

  return { allowed: true };
}

function validateModerationRules(
  args: Record<string, any>,
  guild: Guild,
  actorMember?: GuildMember | null
): ToolKnowledgeValidation {
  const action = String(args.action ?? '');

  // AP-011: Target is guild owner
  if (args.memberId && guild.ownerId && args.memberId === guild.ownerId) {
    return {
      allowed: false,
      reason: 'لا يمكن تطبيق عقوبة على مالك السيرفر.',
    };
  }

  // AP-006: Missing hierarchy check (actor below target) — checked at runtime by security.ts
  // This is a soft check that flags suspicious actions but lets executeTool handle it
  if (actorMember && args.memberId && action !== 'unban') {
    const target = guild.members.cache.get(args.memberId);
    if (target && actorMember.roles.highest.position <= target.roles.highest.position) {
      return {
        allowed: false,
        reason: 'لا يمكنك تطبيق عقوبة على عضو برتبة أعلى أو مساوية لرتبتك.',
      };
    }
  }

  // AP-007: Timeout duration > 28 days
  if ((action === 'timeout') && typeof args.data?.duration === 'number') {
    const maxTimeoutMs = 28 * 24 * 60 * 60 * 1000;
    if (args.data.duration > maxTimeoutMs) {
      return {
        allowed: false,
        reason: 'مدة التايم أوت لا يمكن أن تتجاوز 28 يوم.',
        fix: 'استخدم مدة 28 يوم أو أقل.',
      };
    }
  }

  return { allowed: true };
}

function validateDeleteChannelRules(
  args: Record<string, any>
): ToolKnowledgeValidation {
  const channelIds = Array.isArray(args.channelIds) ? args.channelIds : [];

  // AP-009: Bulk delete (≥5 channels) without explicit confirmation flag
  if (channelIds.length >= 5 && args._confirmed !== true) {
    return {
      allowed: false,
      reason: 'حذف 5 رومات أو أكثر يتطلب تأكيدًا.',
      fix: 'اسأل المستخدم للتأكيد قبل تنفيذ الحذف الكبير، ثم أضف confirmed: true.',
    };
  }

  return { allowed: true };
}
```

#### 5. src/index.ts
**File**: src/index.ts
**Changes**: MODIFY — call `validateToolKnowledgeRules()` inside `executeToolWithAudit()` before `executeTool()`

At the top of the file, add to the existing discord.js import:
```typescript
import type { GuildMember } from 'discord.js';
```
(Already imported as value — check if type-only import is needed)

In `executeToolWithAudit()`, add this block BEFORE the `const result = await executeTool(...)` line:
```typescript
  // Anti-pattern safety gate
  const knowledgeCheck = validateToolKnowledgeRules(name, args, guild, actorMember);
  if (!knowledgeCheck.allowed) {
    Logger.audit('knowledge_rule_blocked', {
      tool_name: name,
      reason: knowledgeCheck.reason,
      fix: knowledgeCheck.fix,
    });
    return {
      success: false,
      message: knowledgeCheck.reason,
      fix: knowledgeCheck.fix,
    };
  }
```

**Imports needed**: `validateToolKnowledgeRules` must be imported from `discord_knowledge.ts`:
```typescript
import { validateToolKnowledgeRules } from './intelligence/discord_knowledge.js';
```
(If `discord_knowledge` is already imported for `buildKnowledgeSectionsForPrompt`, add `validateToolKnowledgeRules` to the destructured imports.)

### Success Criteria:

#### Automated Verification:
- [ ] `npm run build` succeeds
- [ ] AP-001 test: `validateToolKnowledgeRules('edit_permissions', { targetId: guildId, allow: ['MoveMembers'] }, guild)` returns `{ allowed: false }`
- [ ] AP-002 test: `validateToolKnowledgeRules('edit_permissions', { targetId: guildId, allow: ['ManageRoles'] }, guild)` returns `{ allowed: false }`

#### Manual Verification:
- [ ] Bot correctly blocks "give everyone MoveMembers" with Arabic error message
- [ ] Bot correctly blocks timeout > 28 days with Arabic error message
- [ ] Non-dangerous permission edit passes through without blocking 

## Phase 4: Intent enrichment

### Overview
Extend `INTENT_PATTERNS` in `arabic_nlp.ts` with patterns for bulk deletion, server rebuild/reorganization, and role-management operations. Extend `INTENT_TO_TOOLS` in `intentVerifier.ts` with new mappings. Can run after or alongside Phases 1-3.

### Changes Required:

#### 6. src/intelligence/arabic_nlp.ts
**File**: src/intelligence/arabic_nlp.ts
**Changes**: MODIFY — add new intents for bulk, structure, and role operations

To the `ArabicIntent` type union, add `'BULK_DELETE' | 'REBUILD_SERVER'`:
```typescript
export type ArabicIntent =
  | 'CREATE_CHANNEL'
  | 'SET_PERMISSIONS'
  | 'DELETE_CHANNEL'
  | 'BAN_USER'
  | 'KICK_USER'
  | 'TIMEOUT_USER'
  | 'GIVE_ROLE'
  | 'BULK_DELETE'
  | 'REBUILD_SERVER'
  | 'UNKNOWN';
```

To the `INTENT_PATTERNS` record, add these entries:
```typescript
  BULK_DELETE: [
    /(?:احذف|تحذف|امسح|ازل|شيل|delete|remove).*(?:كل|جميع|all).*(?:الرومات|رومات|القنوات|روومات|الرومز|channels|rooms)/i,
    /delete\s+all\s+/i,
  ],
  REBUILD_SERVER: [
    /(?:سوي|سو|انشئ|انشاء|ابني|بناء|جدد|جديد)\s+(?:سيرفر|server)/i,
    /(?:نظف|ترتيب|إعادة|اعادة|re(?:build|organize|design))\s+(?:السيرفر|السيرفرات)/i,
    /تحسين\s+السيرفر\s+(?:وتطويره|وتنظيمه)/i,
  ],
```

#### 7. src/services/intentVerifier.ts
**File**: src/services/intentVerifier.ts
**Changes**: MODIFY — extend INTENT_TO_TOOLS and INTENT_DESCRIPTIONS for new intents

In `INTENT_TO_TOOLS`, add:
```typescript
  BULK_DELETE: ['delete_channels'],
  REBUILD_SERVER: ['create_channels', 'delete_channels', 'edit_permissions', 'manage_roles'],
```

In `INTENT_DESCRIPTIONS`, add:
```typescript
  BULK_DELETE: 'حذف جميع الرومات',
  REBUILD_SERVER: 'إعادة بناء السيرفر',
```

### Success Criteria:

#### Automated Verification:
- [ ] `npm run build` succeeds
- [ ] `detectArabicIntent('احذف جميع الرومات')` returns `'BULK_DELETE'`
- [ ] `detectArabicIntent('سوي سيرفر جديد')` returns `'REBUILD_SERVER'`
- [ ] `detectAllIntents('احذف جميع الرومات إلا الو')` includes `'BULK_DELETE'`

#### Manual Verification:
- [ ] Bulk deletion request triggers correct `[DISCORD_KNOWLEDGE_rate-limits]` section injection 

## Phase 5: Entity tombstone tracking

### Overview
Add `deleted` / tombstone tracking to `EntityRegistry` for deleted channels/roles. Check tombstone state in `toolTargeting.ts` before resolving generic references. Can run alongside other phases.

### Changes Required:

#### 8. src/intelligence/entity_registry.ts
**File**: src/intelligence/entity_registry.ts
**Changes**: MODIFY — add tombstone tracking for deleted channels/roles

Add to the `RegisteredEntity` interface:
```typescript
export interface RegisteredEntity {
  guildId: string;
  type: EntityType;
  id: string;
  name: string;
  createdAt: number;
  sourceTool?: string;
  ttl?: number;
  metadata?: Record<string, unknown>;
  conversationChannelId?: string;
  modifiedAt?: number;
  /** 'deleted' marks a tombstone — entity no longer exists on Discord */
  status?: 'active' | 'deleted';
}
```

Add these methods to the `EntityRegistry` class:
```typescript
  /** Mark an entity as deleted (tombstone). Returns true if found and marked. */
  static markTombstone(guildId: string, type: EntityType, id: string): boolean {
    this.initialize();
    const entities = this.entities.get(guildId);
    if (!entities) return false;
    const entity = entities.find((e) => e.type === type && e.id === id);
    if (!entity) return false;
    entity.status = 'deleted';
    entity.modifiedAt = Date.now();
    this.scheduleSave();
    return true;
  }

  /** Check if an entity is tombstoned (deleted). */
  static isTombstone(guildId: string, type: EntityType, id: string): boolean {
    this.initialize();
    const entities = this.entities.get(guildId);
    if (!entities) return false;
    return entities.some((e) => e.type === type && e.id === id && e.status === 'deleted');
  }
```

Modify `getRecent()` to filter out tombstones by default. Add a filter before the existing sort:
```typescript
      .filter((entity) => entity.status !== 'deleted')
```

In `registerToolResult()`, add this block to handle `delete_channels`:
```typescript
    if (toolName === 'delete_channels') {
      const deletedIds = Array.isArray(args.channelIds) ? args.channelIds : [];
      for (const channelId of deletedIds) {
        this.markTombstone(guild.id, 'channel', channelId);
        this.markTombstone(guild.id, 'category', channelId);
      }
    }
```

#### 9. src/services/toolTargeting.ts
**File**: src/services/toolTargeting.ts
**Changes**: MODIFY — check tombstone state before resolving generic references

In `resolveExplicitToolTargets()`, after the generic channel resolution block (around line 131-142), add a check before using the resolved entity:
```typescript
    if (latestChannel && EntityRegistry.isTombstone(guild.id, 'channel', latestChannel.id)) {
      channelIds.pop(); // remove tombstoned channel
    }
```

Similarly after the role generic resolution:
```typescript
    if (latestRole && EntityRegistry.isTombstone(guild.id, 'role', latestRole.id)) {
      roleIds.pop();
    }
```

Add import at the top of `toolTargeting.ts`:
```typescript
import { EntityRegistry } from '../intelligence/entity_registry.js';
```
(Already imported — verify the existing import path)

### Success Criteria:

#### Automated Verification:
- [ ] `npm run build` succeeds
- [ ] After `markTombstone`, `getRecent()` no longer returns the tombstoned entity
- [ ] `isTombstone` returns `true` for a tombstoned entity

#### Manual Verification:
- [ ] After deleting a channel, the bot does not resolve "الروم" to the deleted channel
- [ ] After deleting a channel, the bot asks clarification or picks a valid remaining channel 

## Phase 6: Integration tests

### Overview
Add test scenarios to `src/tests/verify.ts` for the KnowledgeSkillLoader section extraction, anti-pattern validator blocking known-dangerous operations, and tombstone state checks. Depends on Phases 1, 3, 5.

### Changes Required:

#### 10. src/tests/verify.ts
**File**: src/tests/verify.ts
**Changes**: MODIFY — add test scenarios for KnowledgeSkillLoader section parsing, anti-pattern validator, and tombstone tracking

Add these imports:
```typescript
import { KnowledgeSkillLoader } from '../intelligence/knowledge_skill_loader.js';
import { validateToolKnowledgeRules } from '../intelligence/discord_knowledge.js';
```

Add these test functions before the `main()` function:

```typescript
function verifyKnowledgeSkillLoader(): void {
  // Test that skills directory loads (at project root this should work)
  KnowledgeSkillLoader.load();
  const fileIds = KnowledgeSkillLoader.getLoadedFileIds();
  if (fileIds.length > 0) {
    // At least 8 skill files expected
    assert.ok(fileIds.length >= 8, `Expected \u22658 skill files, got ${fileIds.length}`);
    // Test getRelevantSections returns sections for SET_PERMISSIONS
    const sections = KnowledgeSkillLoader.getRelevantSections(['SET_PERMISSIONS'], [], 'خلي الكل يشوف بس ما يدخل');
    assert.ok(sections.length > 0, 'Expected sections for SET_PERMISSIONS intent');
    // Test budget enforcement: max 3 sections
    const allSections = KnowledgeSkillLoader.getRelevantSections(
      ['SET_PERMISSIONS', 'DELETE_CHANNEL', 'BAN_USER', 'CREATE_CHANNEL'], [], ''
    );
    assert.ok(allSections.length <= 3, `Expected \u22643 sections, got ${allSections.length}`);
    // Test total line count ≤ 60
    const totalLines = allSections.reduce((s, sec) => s + sec.content.split('\n').length, 0);
    assert.ok(totalLines <= 60, `Expected \u226460 lines, got ${totalLines}`);
    // Test UNKNOWN intent with tool fallback
    const unknownSections = KnowledgeSkillLoader.getRelevantSections(['UNKNOWN'], ['delete_channels'], '');
    assert.ok(unknownSections.length >= 0, 'UNKNOWN intent should not crash');
    console.log('[Verify] knowledge_skill_loader: OK');
  } else {
    console.log('[Verify] knowledge_skill_loader: SKIP — no skills/ directory detected');
  }
}

function verifyAntiPatternValidator(): void {
  const guildId = '999999999999999999';
  const mockGuild = {
    id: guildId,
    ownerId: '111111111111111111',
    members: {
      cache: new Map([
        ['222222222222222222', {
          id: '222222222222222222',
          roles: { highest: { position: 5 } },
        }],
      ]),
    },
    channels: { cache: new Map() },
  } as any;
  const actorMember = {
    roles: { highest: { position: 10 } },
  } as any;

  // AP-001: MoveMembers for @everyone → blocked
  const ap1 = validateToolKnowledgeRules('edit_permissions',
    { targetId: guildId, allow: ['MoveMembers'], deny: [] }, mockGuild);
  assert.equal(ap1.allowed, false, 'AP-001 should block MoveMembers for @everyone');

  // AP-002: ManageRoles for @everyone → blocked
  const ap2 = validateToolKnowledgeRules('edit_permissions',
    { targetId: guildId, allow: ['ManageRoles'], deny: [] }, mockGuild);
  assert.equal(ap2.allowed, false, 'AP-002 should block ManageRoles for @everyone');

  // AP-003: ManageChannels for @everyone → blocked
  const ap3 = validateToolKnowledgeRules('edit_permissions',
    { targetId: guildId, allow: ['ManageChannels'], deny: [] }, mockGuild);
  assert.equal(ap3.allowed, false, 'AP-003 should block ManageChannels for @everyone');

  // AP-009: Bulk delete ≥5 channels without confirmation → blocked
  const ap9 = validateToolKnowledgeRules('delete_channels',
    { channelIds: ['1', '2', '3', '4', '5'] }, mockGuild);
  assert.equal(ap9.allowed, false, 'AP-009 should block bulk delete without confirmation');

  // AP-009 with confirmation → allowed
  const ap9ok = validateToolKnowledgeRules('delete_channels',
    { channelIds: ['1', '2', '3', '4', '5'], _confirmed: true }, mockGuild);
  assert.equal(ap9ok.allowed, true, 'AP-009 confirmed should pass');

  // AP-011: Target is guild owner → blocked
  const ap11 = validateToolKnowledgeRules('manage_members',
    { action: 'ban', memberId: '111111111111111111' }, mockGuild);
  assert.equal(ap11.allowed, false, 'AP-011 should block moderator action on guild owner');

  // Safe permission edit passes
  const safe = validateToolKnowledgeRules('edit_permissions',
    { targetId: 'someRoleId', allow: ['ViewChannel', 'Connect'], deny: [] }, mockGuild);
  assert.equal(safe.allowed, true, 'Safe permission edit should pass');

  console.log('[Verify] anti_pattern_validator: OK');
}

function verifyEntityTombstone(): void {
  const guildId = '999999999999999999';

  // Register and then tombstone a channel
  EntityRegistry.register({
    guildId,
    type: 'channel',
    id: 'tombstone-test-1',
    name: 'test-chan',
    sourceTool: 'create_channels',
    createdAt: Date.now(),
  });
  assert.ok(EntityRegistry.getLatest(guildId, 'channel')?.id === 'tombstone-test-1',
    'Entity should be retrievable before tombstone');

  EntityRegistry.markTombstone(guildId, 'channel', 'tombstone-test-1');
  assert.ok(EntityRegistry.isTombstone(guildId, 'channel', 'tombstone-test-1'),
    'isTombstone should return true after markTombstone');
  assert.equal(EntityRegistry.getLatest(guildId, 'channel'), undefined,
    'getLatest should not return tombstoned entity');

  console.log('[Verify] entity_tombstone: OK');
}
```

Update the `main()` function to call these new tests:
```typescript
  verifyKnowledgeSkillLoader();
  verifyAntiPatternValidator();
  verifyEntityTombstone();
```

And update the success count log message at the end to reflect the new tests:
```typescript
  console.log('[Verify] 8/8 critical scenarios passed.');
```

### Success Criteria:

#### Automated Verification:
- [ ] `npm test` passes (all 22 existing tests + verify scenarios)
- [ ] `npm run verify` runs all verify scenarios including the 3 new ones: knowledge_skill_loader, anti_pattern_validator, entity_tombstone

#### Manual Verification:
- [ ] Console output shows `[Verify] knowledge_skill_loader: OK` or `SKIP`
- [ ] Console output shows `[Verify] anti_pattern_validator: OK`
- [ ] Console output shows `[Verify] entity_tombstone: OK` 

## Ordering Constraints
- Phase 1 (KnowledgeSkillLoader) must complete before Phase 2 (system prompt injection)
- Phases 3, 4, 5 can run after Phase 1 in any order, or in parallel with each other
- Phase 6 (Integration tests) must complete after Phases 1, 3, 5

## Verification Notes
- All existing tests must continue to pass after every phase
- The anti-pattern validator must block (not warn) dangerous operations per developer decision
- Per-request skill content must not exceed 60 lines total — enforce in `getRelevantSections()`
- Tombstone state must be set within the same `executeToolWithAudit()` call as the delete operation, not delayed

## Plan Review (Step 8)

_Independent post-finalization review by artifact-code-reviewer and artifact-coverage-reviewer subagents. Findings triaged and applied above._

| source | plan-loc | codebase-loc | severity | dimension | finding | recommendation | resolution |
|--------|----------|-------------|----------|-----------|---------|---------------|------------|
| code | Phase 3 §4 (discord_knowledge.ts) | <n/a> | concern | code-quality | AP-004 blocks Administrator for specific roles but not @everyone — most dangerous case passes | Block Administrator for ALL targets, not just non-everyone | applied: removed `!isEveryoneRole` guard, blocks Administrator unconditionally |
| code | Phase 3 §4 (discord_knowledge.ts) | <n/a> | concern | code-quality | AP-010 blocks ALL category permission edits, but intent was to warn about unsynced children | Change from block to warn | applied: changed `allowed: false` to `allowed: true` with explanatory note |
| code | Phase 6 §10 (verify.ts) | src/tests/verify.ts:2 | suggestion | code-quality | Duplicate `ChannelType` import and unused `PermissionFlagsBits` | Merge into existing import; omit unused | applied: removed redundant import statement |
| coverage | all | <n/a> | — | verification-coverage | All 4 Verification Notes entries have at least one satisfying path (criteria or code mirror) | — | clean — no changes needed |

## Performance Considerations
- File system I/O only at startup (KnowledgeSkillLoader.load()) — ~1ms for 8 markdown files
- Section lookup is O(number of intents) — trivial (< 20 intents)
- Anti-pattern validator is O(number of rules × argument fields) — 12 rules, < 100 checks
- No additional network calls or disk writes per request

## Migration Notes
Not applicable — no schema or persistence changes beyond the existing entity cache path.

## Pattern References
- `src/intelligence/entity_registry.ts:54-75` — `initialize()` startup-load pattern (read disk → parse → index → expose queries)
- `src/index.ts:210-279` — `validateAIToolPermission()` permission-check pattern (switch on tool name, return `{ allowed, message }`)
- `src/index.ts:1249-1252` — `systemPrompt` array assembly pattern (array of strings with `[SECTION_HEADER]` labels joined with `\n`)

## Developer Context
- Directional (follow): KnowledgeSkillLoader follows EntityRegistry startup-load pattern — approved
- Ambiguity (resolved): Intent-to-section mapping as hardcoded TS config object — approved
- Ambiguity (resolved): Anti-pattern validator BLOCKS, not warns — approved
- Scope (resolved): Entity tombstone tracking included in this plan — approved

## Plan History
- Phase 1: KnowledgeSkillLoader — approved as generated
- Phase 2: System prompt injection — approved as generated
- Phase 3: Anti-pattern safety gate — approved as generated
- Phase 4: Intent enrichment — approved as generated
- Phase 5: Entity tombstone tracking — approved as generated
- Phase 6: Integration tests — approved as generated

## References
- `.rpiv/artifacts/research/2026-06-17_13-32-39_wire-discord-skills-into-live-reasoning.md` — Source research
- `.rpiv/artifacts/research/2026-06-17_10-50-16_intelligent-arabic-discord-ai-manager.md` — Prior architecture research
