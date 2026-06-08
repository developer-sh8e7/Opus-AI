import type { Guild } from 'discord.js';
import { EntityRegistry, EntityType } from './entity_registry.js';
import { buildDiscordKnowledgePrompt } from './discord_knowledge.js';

export type ConversationLanguage = 'ar' | 'en' | 'mixed';

export interface ExtractedEntity {
  type: EntityType | 'permission';
  name: string;
  id?: string;
  mentioned: boolean;
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  userId: string;
  extractedEntities?: ExtractedEntity[];
  toolsUsed?: string[];
  intent?: string;
}

export interface WorkflowStep {
  id: string;
  tool: string;
  args: Record<string, unknown>;
  dependsOn?: string;
}

export interface ChannelContext {
  channelId: string;
  guildId: string;
  turns: ConversationTurn[];
  activeWorkflow?: string;
  pendingActions?: WorkflowStep[];
  userLanguages: Map<string, ConversationLanguage>;
  sessionStart: number;
  lastActivity: number;
}

const MAX_TURNS = 20;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export class ContextEngine {
  private static contexts = new Map<string, ChannelContext>();

  static getOrCreate(channelId: string, guildId: string): ChannelContext {
    const now = Date.now();
    this.cleanup(now);
    const existing = this.contexts.get(channelId);
    if (existing && existing.guildId === guildId && now - existing.lastActivity < SESSION_TIMEOUT_MS) {
      existing.lastActivity = now;
      return existing;
    }

    const fresh: ChannelContext = {
      channelId,
      guildId,
      turns: [],
      userLanguages: new Map(),
      sessionStart: now,
      lastActivity: now,
    };
    this.contexts.set(channelId, fresh);
    return fresh;
  }

  static addTurn(channelId: string, turn: ConversationTurn): void {
    const context = this.contexts.get(channelId);
    if (!context) return;
    context.turns.push(turn);
    context.turns = context.turns.slice(-MAX_TURNS);
    context.lastActivity = Date.now();
    if (turn.role === 'user') {
      context.userLanguages.set(turn.userId, this.detectLanguage(turn.content));
    }
  }

  static detectLanguage(content: string): ConversationLanguage {
    const arabic = (content.match(/[\u0600-\u06FF]/g) ?? []).length;
    const latin = (content.match(/[A-Za-z]/g) ?? []).length;
    if (arabic > 0 && latin > 0 && Math.min(arabic, latin) / Math.max(arabic, latin) > 0.25) return 'mixed';
    return arabic >= latin ? 'ar' : 'en';
  }

  static getDominantLanguage(context: ChannelContext, userId?: string): 'ar' | 'en' {
    if (userId) {
      const language = context.userLanguages.get(userId);
      if (language) return language === 'en' ? 'en' : 'ar';
    }
    const latestUserTurn = [...context.turns].reverse().find((turn) => turn.role === 'user');
    return latestUserTurn && this.detectLanguage(latestUserTurn.content) === 'en' ? 'en' : 'ar';
  }

  static summarizeForPrompt(context: ChannelContext): string {
    if (context.turns.length === 0) return 'No previous conversation in this session.';
    return context.turns.slice(-8).map((turn) => {
      const speaker = turn.role === 'user' ? 'User' : 'Bot';
      return `${speaker}: ${turn.content.replace(/\s+/g, ' ').slice(0, 220)}`;
    }).join('\n');
  }

  static buildSystemPrompt(context: ChannelContext, guild: Guild, userId?: string): string {
    const language = this.getDominantLanguage(context, userId);
    return [
      'You are Opus Ai, a specialized Discord server administration assistant.',
      `Reply in ${language === 'ar' ? 'Arabic using the user dialect' : 'English'}.`,
      '[SERVER_CONTEXT]',
      `name=${guild.name}`,
      `id=${guild.id}`,
      `members=${guild.memberCount}`,
      `current_channel=${context.channelId}`,
      EntityRegistry.injectIntoPrompt(guild.id),
      buildDiscordKnowledgePrompt(),
      '[CONVERSATION_CONTEXT]',
      this.summarizeForPrompt(context),
      '[CONTINUITY_RULES]',
      'Use exact IDs from RECENT_ENTITIES for follow-up references such as "the room" or "the role".',
      'For compound create-and-configure requests, complete all required tool steps.',
      'The active conversation channel is not the requested target unless the user explicitly says so.',
      'Never invent an ID. Ask one short clarification if no unique target can be resolved.',
      'Return tool calls only for actions. TypeScript validates authorization and Discord permissions.',
    ].join('\n');
  }

  static setWorkflow(channelId: string, workflowId: string, steps: WorkflowStep[]): void {
    const context = this.contexts.get(channelId);
    if (!context) return;
    context.activeWorkflow = workflowId;
    context.pendingActions = steps;
    context.lastActivity = Date.now();
  }

  static clearWorkflow(channelId: string): void {
    const context = this.contexts.get(channelId);
    if (!context) return;
    delete context.activeWorkflow;
    delete context.pendingActions;
  }

  static cleanup(now = Date.now()): number {
    let removed = 0;
    for (const [channelId, context] of this.contexts) {
      if (now - context.lastActivity >= SESSION_TIMEOUT_MS) {
        this.contexts.delete(channelId);
        removed++;
      }
    }
    return removed;
  }

  static clear(channelId: string): void {
    this.contexts.delete(channelId);
  }
}
