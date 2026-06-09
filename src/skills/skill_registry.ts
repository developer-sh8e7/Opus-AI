import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Guild, GuildMember, TextChannel } from 'discord.js';
import type { ChannelContext, WorkflowStep } from '../intelligence/context_engine.js';

export type SkillCategory =
  | 'moderation'
  | 'channel_management'
  | 'role_management'
  | 'permissions'
  | 'community'
  | 'music'
  | 'automation'
  | 'analytics'
  | 'utility'
  | 'welcome'
  | 'tickets'
  | 'logging'
  | 'anti_spam'
  | 'voice_management'
  | 'bot_management'
  | 'leveling'
  | 'economy'
  | 'invites';

export interface SkillSchema {
  type: 'object';
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface SkillExample {
  input: string;
  args: Record<string, unknown>;
}

export interface SkillParams {
  guild: Guild;
  channel: TextChannel;
  user: GuildMember;
  args: Record<string, any>;
  context: ChannelContext;
}

export interface SkillResult {
  success: boolean;
  message: string;
  messageAr?: string;
  data?: unknown;
  followUpActions?: WorkflowStep[];
}

export interface SkillDefinition {
  id: string;
  name: string;
  nameAr?: string;
  category: SkillCategory;
  description: string;
  descriptionAr?: string;
  triggers: string[];
  triggersAr?: string[];
  requiredPermissions: bigint[];
  execute: (params: SkillParams) => Promise<SkillResult>;
  schema: SkillSchema;
  examples: SkillExample[];
}

type ToolAdapter = (
  toolName: string,
  args: Record<string, any>,
  params: SkillParams
) => Promise<any>;

export class SkillRegistry {
  private static skills = new Map<string, SkillDefinition>();
  private static categoryIndex = new Map<SkillCategory, string[]>();
  private static loadedDirectories = new Set<string>();
  private static toolAdapter?: ToolAdapter;

  static register(skill: SkillDefinition): void {
    if (!skill.id || this.skills.has(skill.id)) return;
    this.skills.set(skill.id, skill);
    const categorySkills = this.categoryIndex.get(skill.category) ?? [];
    categorySkills.push(skill.id);
    this.categoryIndex.set(skill.category, categorySkills);
  }

  static configureToolAdapter(adapter: ToolAdapter): void {
    this.toolAdapter = adapter;
  }

  static async executeToolAdapter(
    toolName: string,
    args: Record<string, any>,
    params: SkillParams
  ): Promise<SkillResult> {
    if (!this.toolAdapter) {
      return { success: false, message: 'Skill tool adapter is not configured.' };
    }
    const result = await this.toolAdapter(toolName, args, params);
    return {
      success: result?.success !== false,
      message: result?.message ?? 'Action completed.',
      messageAr: result?.message,
      data: result,
    };
  }

  static async loadDirectory(directory: string): Promise<number> {
    const resolved = path.resolve(directory);
    if (this.loadedDirectories.has(resolved)) return this.skills.size;
    this.loadedDirectories.add(resolved);

    const files = await this.findSkillFiles(resolved);
    for (const file of files) {
      const module = await import(pathToFileURL(file).href);
      const imported = module.default ?? module.skills;
      const exported = imported?.default ?? imported;
      const definitions = Array.isArray(exported) ? exported : [exported];
      for (const definition of definitions) {
        if (definition?.id) this.register(definition);
      }
    }
    console.log(`[SkillRegistry] Loaded ${this.skills.size} executable skills.`);
    return this.skills.size;
  }

  static get(id: string): SkillDefinition | undefined {
    return this.skills.get(id);
  }

  static getByCategory(category: SkillCategory): SkillDefinition[] {
    return (this.categoryIndex.get(category) ?? [])
      .map((id) => this.skills.get(id))
      .filter((skill): skill is SkillDefinition => Boolean(skill));
  }

  static getTotalCount(): number {
    return this.skills.size;
  }

  static buildSkillManifestForAI(): string {
    if (this.skills.size === 0) return '[EXECUTABLE_SKILLS]\nnone loaded';
    const lines = ['[EXECUTABLE_SKILLS]'];
    for (const [category, ids] of this.categoryIndex) {
      lines.push(`${category}: ${ids.join(', ')}`);
    }
    return lines.join('\n');
  }

  private static async findSkillFiles(directory: string): Promise<string[]> {
    const output: string[] = [];
    let entries;
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      return output;
    }
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) output.push(...await this.findSkillFiles(fullPath));
      else if (entry.name.endsWith('.skill.js') || entry.name.endsWith('.skill.ts')) output.push(fullPath);
    }
    return output;
  }
}

export function createToolSkill(config: Omit<SkillDefinition, 'execute'> & {
  toolName: string;
  mapArgs?: (args: Record<string, any>) => Record<string, any>;
}): SkillDefinition {
  const { toolName, mapArgs, ...definition } = config;
  return {
    ...definition,
    execute: (params) => SkillRegistry.executeToolAdapter(
      toolName,
      mapArgs ? mapArgs(params.args) : params.args,
      params
    ),
  };
}
