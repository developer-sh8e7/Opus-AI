import fs from 'node:fs';
import path from 'node:path';
import type { ArabicIntent } from './arabic_nlp.js';

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
    selected.set(key, { content: truncated, source: ref.fileId + ' → ' + section.heading });
  }
}
