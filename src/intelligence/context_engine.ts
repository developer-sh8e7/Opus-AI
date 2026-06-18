import type { Guild } from 'discord.js';
import { EntityRegistry, EntityType } from './entity_registry.js';
import { buildDiscordKnowledgePrompt } from './discord_knowledge.js';
import { getUserPermissions, type RankPermissions } from './rank_system.js';

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
  /** Track what was accomplished in this turn */
  accomplishments?: string[];
}

export interface WorkflowStep {
  id: string;
  tool: string;
  args: Record<string, unknown>;
  dependsOn?: string | string[];
}

export interface ChannelContext {
  channelId: string;
  guildId: string;
  turns: ConversationTurn[];
  activeWorkflow?: string;
  pendingActions?: WorkflowStep[];
  userLanguages: Map<string, ConversationLanguage>;
  /** Rolling history of detected languages per user (last 10 turns) for majority vote */
  userLanguageHistory: Map<string, ConversationLanguage[]>;
  sessionStart: number;
  lastActivity: number;
  /** Track recent accomplishments for context */
  recentAccomplishments: string[];
  /** Track pending multi-step operations */
  pendingOperations: string[];
  /** User permissions cache */
  userPermissions: Map<string, RankPermissions>;
  /** Last tool call result summary (for context continuity) */
  lastToolResult?: string;
  /** Last created entity ID and type (for implicit reference resolution) */
  lastCreatedEntity?: { type: EntityType; id: string; name: string };
}

const MAX_TURNS = 30;
const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour instead of 30 min
const MAX_ACCOMPLISHMENTS = 10;
const MAX_PENDING_OPERATIONS = 5;

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
      userLanguageHistory: new Map(),
      sessionStart: now,
      lastActivity: now,
      recentAccomplishments: [],
      pendingOperations: [],
      userPermissions: new Map(),
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
      const detected = this.detectLanguage(turn.content);
      context.userLanguages.set(turn.userId, detected);
      // Track language history for majority vote (keep last 10)
      const history = context.userLanguageHistory.get(turn.userId) ?? [];
      history.push(detected);
      context.userLanguageHistory.set(turn.userId, history.slice(-10));
      // Update user permissions cache
      const perms = getUserPermissions(turn.userId);
      context.userPermissions.set(turn.userId, perms);
    }
    // Track accomplishments from assistant turns
    if (turn.role === 'assistant' && turn.accomplishments) {
      context.recentAccomplishments.push(...turn.accomplishments);
      context.recentAccomplishments = context.recentAccomplishments.slice(-MAX_ACCOMPLISHMENTS);
    }
  }

  static detectLanguage(content: string): ConversationLanguage {
    const arabic = (content.match(/[\u0600-\u06FF]/g) ?? []).length;
    const latin = (content.match(/[A-Za-z]/g) ?? []).length;
    if (arabic > 0 && latin > 0 && Math.min(arabic, latin) / Math.max(arabic, latin) > 0.25) return 'mixed';
    return arabic >= latin ? 'ar' : 'en';
  }

  static getDominantLanguage(context: ChannelContext, userId?: string): 'ar' | 'en' {
    // Prefer the latest detected language for the active user. This prevents
    // sticky Arabic/English behavior when the user intentionally switches.
    if (userId) {
      const latest = context.userLanguages.get(userId);
      if (latest) return latest === 'en' ? 'en' : 'ar';
    }

    // Fallback: use the latest user turn in the channel, not a majority vote.
    const latestUserTurn = [...context.turns].reverse().find((turn) => turn.role === 'user');
    if (latestUserTurn) {
      return this.detectLanguage(latestUserTurn.content) === 'en' ? 'en' : 'ar';
    }

    return 'ar';
  }

  static summarizeForPrompt(context: ChannelContext): string {
    // New user / empty session — provide a helpful welcome context
    if (context.turns.length === 0) {
      return [
        'No previous conversation in this session.',
        'This is a new conversation. Greet the user and ask how you can help manage their server.',
        'Available capabilities: create/delete channels, manage roles, set permissions, build server structure.',
      ].join('\n');
    }
    
    const lines: string[] = [];
    
    // Add last created entity for quick reference
    if (context.lastCreatedEntity) {
      const e = context.lastCreatedEntity;
      lines.push('[LAST_CREATED_ENTITY]');
      lines.push(`${e.type}:${e.name}:${e.id}`);
      lines.push('');
    }
    
    // Add last tool result for continuity
    if (context.lastToolResult) {
      lines.push('[LAST_TOOL_RESULT]');
      lines.push(context.lastToolResult);
      lines.push('');
    }
    
    // Add recent accomplishments
    if (context.recentAccomplishments.length > 0) {
      lines.push('[RECENT_ACCOMPLISHMENTS]');
      context.recentAccomplishments.forEach(a => lines.push(`- ${a}`));
      lines.push('');
    }
    
    // Add pending operations
    if (context.pendingOperations.length > 0) {
      lines.push('[PENDING_OPERATIONS]');
      context.pendingOperations.forEach(o => lines.push(`- ${o}`));
      lines.push('');
    }
    
    // Add conversation history
    lines.push('[CONVERSATION_HISTORY]');
    lines.push(context.turns.slice(-10).map((turn) => {
      const speaker = turn.role === 'user' ? 'User' : 'Bot';
      const accomplishments = turn.accomplishments?.length ? ` [Accomplished: ${turn.accomplishments.join(', ')}]` : '';
      const entities = turn.extractedEntities?.length
        ? ` [Entities: ${turn.extractedEntities.map(e => `${e.type}:${e.name}${e.id ? ':' + e.id : ''}`).join(', ')}]`
        : '';
      const tools = turn.toolsUsed?.length ? ` [Tools: ${turn.toolsUsed.join(', ')}]` : '';
      return `${speaker}: ${turn.content.replace(/\s+/g, ' ').slice(0, 250)}${accomplishments}${entities}${tools}`;
    }).join('\n'));
    
    return lines.join('\n');
  }

  static buildSystemPrompt(context: ChannelContext, guild: Guild, userId?: string): string {
    const language = this.getDominantLanguage(context, userId);
    const userPerms = userId ? context.userPermissions.get(userId) : undefined;
    
    const permissionLines = userPerms ? [
      `[USER_PERMISSIONS]`,
      `canPlayMusic=${userPerms.canPlayMusic}`,
      `canCreateChannels=${userPerms.canCreateChannels}`,
      `canDeleteChannels=${userPerms.canDeleteChannels}`,
      `canManageRoles=${userPerms.canManageRoles}`,
      `canKickMembers=${userPerms.canKickMembers}`,
      `canBanMembers=${userPerms.canBanMembers}`,
      `canTimeoutMembers=${userPerms.canTimeoutMembers}`,
      `canBuildServer=${userPerms.canBuildServer}`,
      `canChangeBotName=${userPerms.canChangeBotName}`,
      `maxChannelsPerCommand=${userPerms.maxChannelsPerCommand}`,
      `maxRolesPerCommand=${userPerms.maxRolesPerCommand}`,
      `rankTitle=${userPerms.titleAr}`,
    ] : [];
    
    return [
      'You are Opus Ai, a specialized Discord server administration assistant.',
      `Reply in ${language === 'ar' ? 'Arabic using the user dialect' : 'English'}.`,
      '[SERVER_CONTEXT]',
      `name=${guild.name}`,
      `id=${guild.id}`,
      `members=${guild.memberCount}`,
      `current_channel=${context.channelId}`,
      EntityRegistry.injectIntoPrompt(guild.id, context.channelId),
      buildDiscordKnowledgePrompt(),
      ...permissionLines,
      '[CONVERSATION_CONTEXT]',
      this.summarizeForPrompt(context),
      '[CONTINUITY_RULES]',
      'Use exact IDs from RECENT_ENTITIES for follow-up references such as "the room" or "the role".',
      'For compound create-and-configure requests, complete all required tool steps.',
      'The active conversation channel is not the requested target unless the user explicitly says so.',
      'Never invent an ID. Ask one short clarification if no unique target can be resolved.',
      'Return tool calls only for actions. TypeScript validates authorization and Discord permissions.',
      '',
      '[ENTITY_RESOLUTION_RULES]',
      'After every successful tool call, SESSION_ENTITIES contains real Discord IDs.',
      'Always use the last_created ID for each type to resolve implicit references.',
      'Example: If you created "روم فويس اسمه Room1" → Room1 ID appears in SESSION_ENTITIES.',
      'User says ".room1" or "الروم" → use the ID from SESSION_ENTITIES, never fabricate.',
      'Compound requests (create + configure): create first, then use the returned ID immediately.',
      'Track lastToolResult and lastCreatedEntity so follow-up turns can reference them.',
      '[INTELLIGENCE_RULES]',
      'Track what you accomplished in each response using the accomplishments array.',
      'When user refers to something you just did, use the RECENT_ACCOMPLISHMENTS context.',
      'When user asks for multiple operations, plan them as a compound workflow.',
      'Always respond in the same language the user uses (Arabic if they speak Arabic).',
      'Use natural, conversational tone - not robotic responses.',
      'When user makes implicit requests (e.g., "غير اسمك" after a build), understand the context.',
      'When user refers to "الروم" / "الرتبة" / "هذا الشانل", resolve via last_created from SESSION_ENTITIES.'
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

  /**
   * Add accomplishment to context
   */
  static addAccomplishment(channelId: string, accomplishment: string): void {
    const context = this.contexts.get(channelId);
    if (!context) return;
    context.recentAccomplishments.push(accomplishment);
    context.recentAccomplishments = context.recentAccomplishments.slice(-MAX_ACCOMPLISHMENTS);
  }

  /**
   * Get recent accomplishments (newest first)
   */
  static getRecentAccomplishments(channelId: string, count = 3): string[] {
    const context = this.contexts.get(channelId);
    if (!context) return [];
    return [...context.recentAccomplishments].reverse().slice(0, count);
  }

  /**
   * Add pending operation
   */
  static addPendingOperation(channelId: string, operation: string): void {
    const context = this.contexts.get(channelId);
    if (!context) return;
    context.pendingOperations.push(operation);
    context.pendingOperations = context.pendingOperations.slice(-MAX_PENDING_OPERATIONS);
  }

  /**
   * Clear pending operations
   */
  static clearPendingOperations(channelId: string): void {
    const context = this.contexts.get(channelId);
    if (!context) return;
    context.pendingOperations = [];
  }
}
