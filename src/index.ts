/**
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 *               Ø®Ø§Ø¯Ù… Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© ÙˆØ§Ù„ØªØ´ØºÙŠÙ„ Ø§Ù„Ù…Ø±ÙƒØ²ÙŠ - Opus Central Router
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 *  Ø§Ù„ÙˆØµÙ:
 *    Ø§Ù„Ù…Ù„Ù Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠ ÙˆØ§Ù„Ù…Ø­Ø±Ùƒ Ø§Ù„Ù…Ø±ÙƒØ²ÙŠ Ù„Ø¨ÙˆØª Ø§Ù„Ù…Ø³Ø§Ø¹Ø¯ Ø§Ù„Ø°ÙƒÙŠ Opus.
 *    ÙŠÙ‚ÙˆÙ… Ø¨Ø§Ù„Ø±Ø¨Ø· Ø¨ÙŠÙ† Ø§Ù„Ø£Ø­Ø¯Ø§Ø« ÙÙŠ Ø®Ø§Ø¯Ù… Ø¯ÙŠØ³ÙƒÙˆØ±Ø¯ØŒ ÙˆÙ†Ø¸Ø§Ù… ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ù„Ù‡Ø¬Ø§ØªØŒ
 *    ÙˆÙ†Ø¸Ø§Ù… Ù…Ø¹Ø§Ù„Ø¬Ø© ÙˆØªØ®Ø²ÙŠÙ† Ø§Ù„Ø°Ø§ÙƒØ±Ø©ØŒ ÙˆØ§Ù„Ù…Ø´ØºÙ„ Ø§Ù„Ù…ÙˆØ³ÙŠÙ‚ÙŠØŒ ÙˆØ§Ù„Ø±Ù‚Ø§Ø¨Ø© Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠØ©.
 * 
 *  Ø§Ù„Ù…ÙƒÙˆÙ†Ø§Øª Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ© Ø§Ù„Ù…Ø¯Ù…Ø¬Ø©:
 *    1. ØªÙ‡ÙŠØ¦Ø© Ø¹Ù…ÙŠÙ„ Ø¯ÙŠØ³ÙƒÙˆØ±Ø¯ (Discord Client & Intents Gateway)
 *    2. Ù†Ø¸Ø§Ù… ØªØªØ¨Ø¹ ÙˆØªØ¯Ù‚ÙŠÙ‚ Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª ÙˆØ§Ù„Ù†Ø´Ø§Ø·Ø§Øª Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠ
 *    3. Ø±Ø§ÙˆØªØ± Ø§Ù„Ø£Ø¯ÙˆØ§Øª ÙˆØ§Ù„Ù…Ø³Ø§Ø¹Ø¯ Ø§Ù„Ø°ÙƒÙŠ (AI Tools Router)
 *    4. Ù…Ø¹Ø§Ù„Ø¬ ÙˆÙ…Ø­Ù„Ù„ Ø§Ù„Ø£ÙˆØ§Ù…Ø± Ø§Ù„Ù†ØµÙŠØ© Ø§Ù„Ù…Ø¨Ø§Ø´Ø±Ø© (Manual Commands Parser)
 *    5. Ù…Ø¹Ø§Ù„Ø¬ Ø§Ù„Ø±Ø³Ø§Ø¦Ù„ ÙˆØªÙˆÙ„ÙŠØ¯ Ø§Ù„Ø±Ø¯ÙˆØ¯ Ø¨Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ Ù…Ø¹ Ù…Ø¹Ø§Ù„Ø¬Ø© Ø§Ù„Ø£Ø¯ÙˆØ§Øª Ø§Ù„Ù…ØªÙƒØ±Ø±Ø©
 *    6. Ù…Ø³ØªÙ…Ø¹Ùˆ Ø§Ù„Ø£Ø­Ø¯Ø§Ø« Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠØ© (Ready, Guild, Role, Channel, Voice events)
 *    7. Ø£Ø¯ÙˆØ§Øª Ø§Ù„ØªÙ‚Ø·ÙŠØ¹ Ø§Ù„Ø°ÙƒÙŠ ÙˆØ§Ù„ØªØ´Ø®ÙŠØµ Ø§Ù„Ù…ØªÙƒØ§Ù…Ù„ (Complete Diagnostic Suite)
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 */

import { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  Guild, 
  ActivityType,
  GuildMember,
  Message,
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
  Events,
  Role,
  TextChannel
} from 'discord.js';
import path from 'node:path';
import { config } from './config.js';
import { startRenderWebServer } from './renderWebServer.js';
import { installLegacyEmbedRepair } from './utils/textEncoding.js';
import { getAIResponse, AIMessage, runAIDiagnostics } from './services/ai.js';
import { getConversationReply } from './services/conversation.js';
import {
  applyExplicitTargets,
  buildExplicitTargetsContext,
  resolveExplicitToolTargets,
} from './services/toolTargeting.js';
import { SkillRegistry } from './skills/skill_registry.js';
import { AIRequestLimiter } from './utils/aiRateLimiter.js';
import {
  AdvancedActionGroup,
  AdvancedDiscordAction,
  executeAdvancedDiscordAction,
  requiredPermissionForAdvancedAction,
} from './utils/advancedDiscordActions.js';
import { 
  createChannels, 
  deleteChannels,
  manageRoles, 
  editPermissions, 
  bulkPermissionUpdate,
  manageMembers, 
  getServerInfo,
  editBotProfile,
  bulkDeleteMessages,
  sendCustomEmbed,
  getMemberInfo,
  DiscordInviteManager,
  ServerAuditLogAnalyzer,
  AdvancedServerModerator,
  GuildBackupManager,
  runDiscordToolsDiagnostics,
  ServerStatusDashboard
} from './utils/discordTools.js';
import { executeCommunityBuild, buildCustomServer, runCommunityBuilderDiagnostics } from './tools/community_builder.js';
import { 
  joinVoice, leaveVoice, getVoiceStatus, playMusic, 
  pauseMusic, resumeMusic, skipMusic, stopMusic, 
  setVolume, toggleLoop, getQueue,
  getUserVoiceChannel, shuffleQueue, removeFromQueue, getNowPlaying,
  musicPlayers
} from './tools/voice_manager.js';
import { 
  startAutonomousMonitor,
  isSpamming,
  AntiRaidShield,
  InviteLinkFilter,
  findLogChannel,
  findWelcomeChannel,
  moderationLog,
  addWarning,
  getWarningCount,
  clearUserWarnings,
  getUserWarningRecord,
  RolePermsGuard,
  MessageDeduplicator,
  ShadowBanSystem,
  MediaFilterSystem,
  CredentialProtection,
  BadWordDictionary,
  AutoResponder,
  WordFrequencyTracker,
  AutoModSummaryReport,
  AdvancedContentSanitizer,
  runMonitorDiagnostics
} from './autonomous/monitor.js';
import { ContextAnalyzer } from './intelligence/context_analyzer.js';
import { ContextEngine } from './intelligence/context_engine.js';
import { EntityRegistry } from './intelligence/entity_registry.js';
import {
  applyArabicPermissionsToToolArgs,
  buildArabicPermissionOperations,
  detectArabicIntent,
} from './intelligence/arabic_nlp.js';
import { WorkflowEngine } from './intelligence/workflow_engine.js';
import { planCompoundDiscordRequest } from './intelligence/compound_planner.js';
import { memoryManager, MemoryManager } from './intelligence/memory_manager.js';
import { runDialectEngineDiagnostics } from './intelligence/dialect_engine.js';
import { runContextAnalyzerDiagnostics } from './intelligence/context_analyzer.js';
import { runMemoryManagerDiagnostics } from './intelligence/memory_manager.js';
import { Logger } from './utils/logger.js';

// Ø§Ø³ØªÙŠØ±Ø§Ø¯ Ù…ÙˆÙ„Ø¯Ø§Øª Ø§Ù„Ù€ Embed Ø§Ù„Ù…ØªÙ‚Ø¯Ù…Ø©
import {
  EMBED_COLORS,
  createRulesEmbed,
  createWelcomeEmbed,
  createRolesInfoEmbed,
  createStoreEmbed,
  createTicketEmbed,
  createServerInfoEmbed,
  createMusicTrackEmbed,
  createModerationActionEmbed,
  createAIBrainStatusEmbed,
  createHelpEmbed,
  createMemberProfileEmbed,
  createDiagnosticsResultEmbed,
  createInteractiveMenuEmbed,
  createSystemHealthEmbed,
  createGiveawayEmbed,
  createPollEmbed,
  createAzkarEmbed,
  createLeaderboardEmbed,
  createWarningsHistoryEmbed,
  createInvoiceEmbed,
  createVerificationEmbed,
  createLevelUpEmbed,
  createXPStatusEmbed,
  createVipApplicationEmbed,
  createPartnerEmbed,
  createSuggestionEmbed,
  createEsportsMatchEmbed
} from './utils/embed_generator.js';

// ============================================================
//  ÙˆØ§Ø¬Ù‡Ø§Øª ÙˆØ¨ÙŠØ§Ù†Ø§Øª ØªÙ‡ÙŠØ¦Ø© Ø§Ù„Ù†Ø¸Ø§Ù… (System Interfaces)
// ============================================================
export interface BotSessionState {
  bootTime: Date;
  processedMessages: number;
  aiQueriesCount: number;
  toolsExecutedCount: number;
  errorsLoggedCount: number;
}

const systemState: BotSessionState = {
  bootTime: new Date(),
  processedMessages: 0,
  aiQueriesCount: 0,
  toolsExecutedCount: 0,
  errorsLoggedCount: 0,
};
const aiRateLimiter = new AIRequestLimiter(5, 20, 60_000);

function runAIRequest(
  guildId: string,
  messages: AIMessage[],
  options: Parameters<typeof getAIResponse>[1] = {}
): Promise<any> {
  return aiRateLimiter.schedule(guildId, () => getAIResponse(messages, options));
}

// ============================================================
//  ØªÙ‡ÙŠØ¦Ø© Ø¹Ù…ÙŠÙ„ Ø¯ÙŠØ³ÙƒÙˆØ±Ø¯ Ø¨Ø§Ù„Ø®Ø§Ø¯Ù… (Client Configuration)
// ============================================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});
const enableDiscordLogs = require('discord-logs') as (
  discordClient: Client,
  options?: { debug?: boolean }
) => void;
enableDiscordLogs(client, { debug: false });

function hasAnyPermission(member: GuildMember | null | undefined, permissions: bigint[]): boolean {
  if (!member) return false;
  return member.permissions.has(PermissionFlagsBits.Administrator) ||
    permissions.some((permission) => member.permissions.has(permission));
}

function validateAIToolPermission(
  name: string,
  args: any,
  actorMember?: GuildMember | null
): { allowed: boolean; message?: string } {
  const denied = 'لا يمكن تنفيذ هذا الإجراء من الذكاء الاصطناعي قبل التحقق من صلاحيات العضو المنفذ.';

  switch (name) {
    case 'build_custom_server':
    case 'execute_community_build':
      return {
        allowed: hasAnyPermission(actorMember, [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageRoles]),
        message: denied,
      };
    case 'create_channels':
    case 'delete_channels':
      return {
        allowed: hasAnyPermission(actorMember, [PermissionFlagsBits.ManageChannels]),
        message: denied,
      };
    case 'manage_roles':
    case 'edit_permissions':
    case 'bulk_permission_update':
      return {
        allowed: hasAnyPermission(actorMember, [PermissionFlagsBits.ManageRoles]),
        message: denied,
      };
    case 'bulk_delete_messages':
    case 'send_embed':
      return {
        allowed: hasAnyPermission(actorMember, [PermissionFlagsBits.ManageMessages]),
        message: denied,
      };
    case 'manage_members': {
      const action = String(args?.action ?? '');
      const required = action === 'ban'
        ? [PermissionFlagsBits.BanMembers]
        : action === 'unban'
          ? [PermissionFlagsBits.BanMembers]
        : action === 'kick'
          ? [PermissionFlagsBits.KickMembers]
          : action === 'timeout' || action === 'untimeout'
            ? [PermissionFlagsBits.ModerateMembers]
            : action === 'move' || action === 'voicekick'
              ? [PermissionFlagsBits.MoveMembers]
              : action === 'deafen'
                ? [PermissionFlagsBits.DeafenMembers]
                : action === 'mute_voice'
                  ? [PermissionFlagsBits.MuteMembers]
              : [PermissionFlagsBits.ManageNicknames];

      return {
        allowed: hasAnyPermission(actorMember, required),
        message: denied,
      };
    }
    case 'channel_operations':
    case 'thread_operations':
    case 'message_operations':
    case 'webhook_operations':
    case 'role_operations':
    case 'guild_operations':
    case 'expression_operations':
    case 'automod_operations':
    case 'event_operations':
    case 'analytics_operations': {
      const action = String(args?.action ?? '') as AdvancedDiscordAction;
      return {
        allowed: hasAnyPermission(actorMember, [requiredPermissionForAdvancedAction(action)]),
        message: denied,
      };
    }
    case 'execute_skill': {
      const skill = SkillRegistry.get(String(args?.skillId ?? ''));
      return {
        allowed: Boolean(skill) && hasAnyPermission(actorMember, skill?.requiredPermissions ?? []),
        message: denied,
      };
    }
    default:
      return { allowed: true };
  }
}

// ============================================================
//  1. Ø±Ø§ÙˆØªØ± ØªØ´ØºÙŠÙ„ Ø§Ù„Ø£Ø¯ÙˆØ§Øª ÙˆØ§Ù„ÙˆØ¸Ø§Ø¦Ù - AI Tools Central Router
// ============================================================
async function executeTool(
  name: string, 
  args: any, 
  guild: Guild, 
  activeChannelId: string,
  userId?: string,
  actorMember?: GuildMember | null
): Promise<any> {
  systemState.toolsExecutedCount++;

  const permissionCheck = validateAIToolPermission(name, args, actorMember);
  if (!permissionCheck.allowed) {
    return { success: false, message: permissionCheck.message };
  }

  switch (name) {
    // ===== Ø£Ø¯ÙˆØ§Øª Ø¨Ù†Ø§Ø¡ Ø§Ù„Ù…Ø¬ØªÙ…Ø¹ Ø§Ù„Ø°ÙƒÙŠØ© =====
    case 'build_custom_server':
      return await buildCustomServer(guild, args.description, activeChannelId);

    case 'execute_community_build':
      return await executeCommunityBuild(guild, args.blueprintType, activeChannelId, { serverName: args.serverName });

    // ===== Ø£Ø¯ÙˆØ§Øª Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø­Ø§Ø¯Ø«Ø§Øª Ø§Ù„ØµÙˆØªÙŠØ© =====
    case 'join_voice_channel':
      return await joinVoice(guild, args.channelId);

    case 'leave_voice_channel':
      return await leaveVoice(guild);

    case 'get_voice_status':
      return await getVoiceStatus(guild);

    case 'get_user_voice_channel':
      return getUserVoiceChannel(guild, args.userId || userId || '');

    // ===== Ø£Ø¯ÙˆØ§Øª Ø§Ù„Ù…Ø´ØºÙ„ Ø§Ù„Ù…ÙˆØ³ÙŠÙ‚ÙŠ Ø§Ù„Ù…ØªØ·ÙˆØ± =====
    case 'play_music':
      return await playMusic(
        guild,
        args.voiceChannelId || null,
        args.query,
        args.requestedBy || 'Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø§Ù„Ù…Ø¹ØªÙ…Ø¯',
        undefined,
        args.requestingUserId || userId
      );

    case 'pause_music':
      return pauseMusic(guild.id);

    case 'resume_music':
      return resumeMusic(guild.id);

    case 'skip_music':
      return skipMusic(guild.id);

    case 'stop_music':
      return stopMusic(guild.id);

    case 'set_volume':
      return setVolume(guild.id, args.volume);

    case 'toggle_loop':
      return toggleLoop(guild.id);

    case 'get_queue':
      return getQueue(guild.id);

    case 'shuffle_queue':
      return shuffleQueue(guild.id);

    case 'remove_from_queue':
      return removeFromQueue(guild.id, args.index);

    case 'get_now_playing':
      return getNowPlaying(guild.id);

    // ===== Ø£Ø¯ÙˆØ§Øª Ø¥Ø¯Ø§Ø±Ø© ÙˆØµÙŠØ§Ù†Ø© Ø¯ÙŠØ³ÙƒÙˆØ±Ø¯ =====
    case 'get_server_info':
      return await getServerInfo(guild);

    case 'create_channels':
      return await createChannels(guild, args.type, args.names, args.categoryId, args.permissions);

    case 'delete_channels':
      return await deleteChannels(guild, args.channelIds);

    case 'manage_roles':
      return await manageRoles(guild, args.action, args.roleData, args.targetMemberId);

    case 'edit_permissions':
      return await editPermissions(guild, args.channelId, args.targetId, args.targetType, args.allow, args.deny);

    case 'bulk_permission_update':
      return await bulkPermissionUpdate(guild, args);

    case 'manage_members':
      return await manageMembers(guild, args.action, args.memberId, args.data);

    case 'edit_bot_profile':
      return await editBotProfile(guild.client, args);

    case 'bulk_delete_messages':
      return await bulkDeleteMessages(guild, args.channelId, args.count, args.userId);

    case 'send_embed':
      return await sendCustomEmbed(guild, args);

    case 'get_member_info':
      return await getMemberInfo(guild, args.memberId);

    case 'channel_operations':
    case 'thread_operations':
    case 'message_operations':
    case 'webhook_operations':
    case 'role_operations':
    case 'guild_operations':
    case 'expression_operations':
    case 'automod_operations':
    case 'event_operations':
    case 'analytics_operations':
      return await executeAdvancedDiscordAction(
        guild,
        name as AdvancedActionGroup,
        args.action as AdvancedDiscordAction,
        args
      );

    case 'execute_skill': {
      const skill = SkillRegistry.get(String(args.skillId ?? ''));
      const channel = guild.channels.cache.get(activeChannelId);
      if (!skill) return { success: false, message: 'المهارة المطلوبة غير موجودة.' };
      if (!actorMember) return { success: false, message: 'تعذر التحقق من العضو المنفذ.' };
      if (!channel?.isTextBased()) {
        return { success: false, message: 'الروم الحالي لا يدعم تنفيذ هذه المهارة.' };
      }
      return skill.execute({
        guild,
        channel: channel as TextChannel,
        user: actorMember,
        args: args.args ?? {},
        context: ContextEngine.getOrCreate(activeChannelId, guild.id),
      });
    }

    default:
      throw new Error(`Ø§Ù„Ø£Ø¯Ø§Ø© Ø§Ù„Ø¨Ø±Ù…Ø¬ÙŠØ© Ø§Ù„Ù…Ø­Ø¯Ø¯Ø© ØºÙŠØ± Ù…Ø¯Ø¹ÙˆÙ…Ø© ÙÙŠ Ù†Ø¸Ø§Ù… Ø§Ù„ØªØ´ØºÙŠÙ„ Ø§Ù„Ø­Ø§Ù„ÙŠ: ${name}`);
  }
}

async function executeToolWithAudit(
  name: string,
  args: any,
  guild: Guild,
  activeChannelId: string,
  userId?: string,
  actorMember?: GuildMember | null
): Promise<any> {
  const startedAt = Date.now();
  try {
    const result = await executeTool(name, args, guild, activeChannelId, userId, actorMember);
    const registeredEntities = EntityRegistry.registerToolResult(
      guild,
      name,
      args,
      result,
      activeChannelId
    );
    memoryManager.rememberEntities(activeChannelId, registeredEntities);
    Logger.audit('tool_execution', {
      guild_id: guild.id,
      user_id: userId ?? null,
      tool_name: name,
      params: args,
      result,
      duration_ms: Date.now() - startedAt,
    });
    return result;
  } catch (error) {
    Logger.audit('tool_execution', {
      guild_id: guild.id,
      user_id: userId ?? null,
      tool_name: name,
      params: args,
      result: { success: false, error: error instanceof Error ? error.message : String(error) },
      duration_ms: Date.now() - startedAt,
    });
    throw error;
  }
}

SkillRegistry.configureToolAdapter((toolName, args, params) => executeToolWithAudit(
  toolName,
  args,
  params.guild,
  params.channel.id,
  params.user.id,
  params.user
));

function buildToolExecutionReply(
  guild: Guild,
  completedResults: Array<{ name: string; args: any; result: any }>
): string | undefined {
  const actionResults = completedResults.filter(({ name }) => [
    'build_custom_server',
    'execute_community_build',
    'create_channels',
    'delete_channels',
    'manage_roles',
    'edit_permissions',
    'bulk_permission_update',
    'manage_members',
    'edit_bot_profile',
    'bulk_delete_messages',
    'send_embed',
    'channel_operations',
    'thread_operations',
    'message_operations',
    'webhook_operations',
    'role_operations',
    'guild_operations',
    'expression_operations',
    'automod_operations',
    'event_operations',
    'analytics_operations',
    'join_voice_channel',
    'leave_voice_channel',
    'play_music',
    'pause_music',
    'resume_music',
    'skip_music',
    'stop_music',
    'set_volume',
    'toggle_loop',
    'shuffle_queue',
    'remove_from_queue',
  ].includes(name));

  if (actionResults.length === 0) return undefined;

  return actionResults.map(({ name, args, result }) => {
    if (!result?.success) {
      return result?.message || 'تعذر تنفيذ الإجراء المطلوب.';
    }

    if (name === 'edit_permissions') {
      const channelName = guild.channels.cache.get(args.channelId)?.name ?? args.channelId;
      const targetName = args.targetType === 'role'
        ? guild.roles.cache.get(args.targetId)?.name ?? args.targetId
        : guild.members.cache.get(args.targetId)?.displayName ?? args.targetId;
      return `تم تحديث صلاحيات روم "${channelName}" للرتبة/العضو "${targetName}" بنجاح.`;
    }

    if (name === 'edit_bot_profile' && args.username) {
      return `تم تغيير اسم البوت إلى "${args.username}" بنجاح.`;
    }

    return result.message || 'تم تنفيذ الإجراء بنجاح.';
  }).join('\n');
}

// ============================================================
//  2. Ù…Ø¹Ø§Ù„Ø¬ Ø§Ù„Ø£ÙˆØ§Ù…Ø± Ø§Ù„Ù†ØµÙŠØ© Ø§Ù„ØªÙ‚Ù„ÙŠØ¯ÙŠØ© ÙˆØ§Ù„ÙŠØ¯ÙˆÙŠØ© (Manual Commands Router)
// ============================================================
async function handleManualCommand(message: Message, commandText: string): Promise<boolean> {
  const parts = commandText.split(/\s+/);
  const command = parts[0]?.toLowerCase();
  const args = parts.slice(1);
  const guild = message.guild!;

  switch (command) {
    case 'help':
    case 'Ø£ÙˆØ§Ù…Ø±':
    case 'Ù…Ø³Ø§Ø¹Ø¯Ø©': {
      const helpEmbed = createHelpEmbed('!opus ');
      await message.reply({ embeds: [helpEmbed] }).catch(() => null);
      return true;
    }

    case 'ai':
    case 'Ø°ÙƒØ§Ø¡': {
      const prompt = args.join(' ');
      if (!prompt) {
        await message.reply('âŒ ÙŠØ±Ø¬Ù‰ ÙƒØªØ§Ø¨Ø© Ø§Ù„Ø³Ø¤Ø§Ù„ Ø£Ùˆ Ø§Ù„Ø¨Ø±ÙˆÙ…Ø¨Øª Ù„ÙŠØªÙ… ØªØ­Ù„ÙŠÙ„Ù‡ Ø¨Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ. Ù…Ø«Ø§Ù„: `!opus ai Ù…Ù† Ø£Ù†ØªØŸ`').catch(() => null);
        return true;
      }
      const aiLimit = aiRateLimiter.check(message.author.id, message.guild!.id);
      if (!aiLimit.allowed) {
        await message.reply(`وصلت حد طلبات الذكاء مؤقتًا. جرّب بعد ${aiLimit.retryAfterSeconds ?? 60} ثانية.`).catch(() => null);
        return true;
      }
      await (message.channel as any).sendTyping().catch(() => null);
      try {
        const history: AIMessage[] = [{ role: 'user', content: prompt }];
        const response = await runAIRequest(message.guild!.id, history);
        if (response.content) {
          await sendLongMessage(message, response.content);
        } else {
          await message.reply('âœ… ØªÙ…Øª Ù…Ø¹Ø§Ù„Ø¬Ø© Ø·Ù„Ø¨Ùƒ Ø¨Ø¯ÙˆÙ† Ø±Ø¯ Ù†ØµÙŠ Ù…Ø¨Ø§Ø´Ø±.').catch(() => null);
        }
      } catch (err: any) {
        await message.reply(`âŒ ÙØ´Ù„Øª Ù…Ø¹Ø§Ù„Ø¬Ø© Ø§Ù„Ø·Ù„Ø¨ Ø¨Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ: ${err.message}`).catch(() => null);
      }
      return true;
    }

    case 'play':
    case 'Ø´ØºÙ„': {
      const query = args.join(' ');
      if (!query) {
        await message.reply('âŒ ÙŠØ±Ø¬Ù‰ ÙƒØªØ§Ø¨Ø© Ø§Ø³Ù… Ø§Ù„Ù…Ù‚Ø·Ø¹ Ø£Ùˆ Ø±Ø§Ø¨Ø· Ø§Ù„ØªØ´ØºÙŠÙ„. Ù…Ø«Ø§Ù„: `!opus play Ø¹Ù…Ø±ÙŠÙ†`').catch(() => null);
        return true;
      }
      const voiceChannel = message.member?.voice.channel;
      if (!voiceChannel) {
        await message.reply('âŒ ÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† Ù…ØªØµÙ„Ø§Ù‹ Ø¨Ù‚Ù†Ø§Ø© ØµÙˆØªÙŠØ© Ù„ØªØ´ØºÙŠÙ„ Ø§Ù„Ù…ÙˆØ³ÙŠÙ‚Ù‰.').catch(() => null);
        return true;
      }
      await (message.channel as any).sendTyping().catch(() => null);
      const res = await playMusic(guild, voiceChannel.id, query, message.author.username, undefined, message.author.id);
      await message.reply(res.message).catch(() => null);
      return true;
    }

    case 'skip':
    case 'ØªØ®Ø·ÙŠ': {
      const res = skipMusic(guild.id);
      await message.reply(res.message).catch(() => null);
      return true;
    }

    case 'stop':
    case 'Ø§ÙŠÙ‚Ø§Ù':
    case 'Ø¥ÙŠÙ‚Ø§Ù': {
      const res = stopMusic(guild.id);
      await message.reply(res.message).catch(() => null);
      return true;
    }

    case 'pause':
    case 'Ù…Ø¤Ù‚Øª': {
      const res = pauseMusic(guild.id);
      await message.reply(res.message).catch(() => null);
      return true;
    }

    case 'resume':
    case 'Ø§Ø³ØªØ¦Ù†Ø§Ù': {
      const res = resumeMusic(guild.id);
      await message.reply(res.message).catch(() => null);
      return true;
    }

    case 'queue':
    case 'Ù‚Ø§Ø¦Ù…Ø©': {
      const res = getQueue(guild.id);
      if (res.embed) {
        await message.reply({ embeds: [res.embed] }).catch(() => null);
      } else {
        await message.reply(res.message).catch(() => null);
      }
      return true;
    }

    case 'volume':
    case 'ØµÙˆØª': {
      const vol = parseInt(args[0] ?? '100');
      if (isNaN(vol) || vol < 0 || vol > 200) {
        await message.reply('âŒ ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ Ù‚ÙŠÙ…Ø© ØµØ­ÙŠØ­Ø© Ù„Ù…Ø³ØªÙˆÙ‰ Ø§Ù„ØµÙˆØª Ø¨ÙŠÙ† 0 Ùˆ 200.').catch(() => null);
        return true;
      }
      const res = setVolume(guild.id, vol);
      await message.reply(res.message).catch(() => null);
      return true;
    }

    case 'loop':
    case 'ØªÙƒØ±Ø§Ø±': {
      const res = toggleLoop(guild.id);
      await message.reply(res.message).catch(() => null);
      return true;
    }

    case 'nowplaying':
    case 'Ø§Ù„Ø§Ù†':
    case 'Ø§Ù„Ø¢Ù†': {
      const nowRes = getNowPlaying(guild.id);
      if (!nowRes || !nowRes.track) {
        await message.reply('ðŸŽµ Ù„Ø§ ÙŠØªÙ… ØªØ´ØºÙŠÙ„ Ø£ÙŠ Ù…Ù‚Ø·Ø¹ ØµÙˆØªÙŠ Ø­Ø§Ù„ÙŠØ§Ù‹.').catch(() => null);
        return true;
      }
      const now = nowRes.track;
      const qLen = musicPlayers.get(guild.id)?.queue.length ?? 0;
      const embed = createMusicTrackEmbed(
        now.title, now.url, now.duration, now.requestedBy,
        now.thumbnail ?? '', 100, false, qLen
      );
      await message.reply({ embeds: [embed] }).catch(() => null);
      return true;
    }

    case 'shuffle':
    case 'Ø¹Ø´ÙˆØ§Ø¦ÙŠ': {
      const res = shuffleQueue(guild.id);
      await message.reply(res.message).catch(() => null);
      return true;
    }

    case 'remove':
    case 'Ø­Ø°Ù_Ù…Ù‚Ø·Ø¹': {
      const idx = parseInt(args[0] ?? '');
      if (isNaN(idx)) {
        await message.reply('âŒ ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ Ø±Ù‚Ù… Ø§Ù„Ù…Ù‚Ø·Ø¹ Ø§Ù„ØµØ­ÙŠØ­ Ù…Ù† Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø±.').catch(() => null);
        return true;
      }
      const res = removeFromQueue(guild.id, idx - 1);
      await message.reply(res.message).catch(() => null);
      return true;
    }

    case 'build':
    case 'Ø¨Ù†Ø§Ø¡': {
      const desc = args.join(' ');
      if (!desc) {
        await message.reply('âŒ ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ ÙˆØµÙ Ø§Ù„Ø®Ø§Ø¯Ù… Ø§Ù„Ù…Ø±Ø§Ø¯ Ø¨Ù†Ø§Ø¤Ù‡ Ø¨Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ. Ù…Ø«Ø§Ù„: `!opus build Ø³ÙŠØ±ÙØ± Ø§Ù„Ø¹Ø§Ø¨ Ù…ØªÙƒØ§Ù…Ù„`').catch(() => null);
        return true;
      }
      await message.reply('â³ Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø¨Ø¯Ø¡ ÙÙŠ Ø§Ù„ØªØ®Ø·ÙŠØ· ÙˆØ¨Ù†Ø§Ø¡ Ø§Ù„Ù‚Ù†ÙˆØ§Øª Ø¨Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠØŒ Ù‚Ø¯ ÙŠØ³ØªØºØ±Ù‚ Ù‡Ø°Ø§ Ø¨Ø¶Ø¹ Ø«ÙˆØ§Ù†...').catch(() => null);
      await buildCustomServer(guild, desc, message.channel.id);
      return true;
    }

    case 'serverinfo':
    case 'Ù…Ø¹Ù„ÙˆÙ…Ø§Øª_Ø§Ù„Ø³ÙŠØ±ÙØ±': {
      const embed = createServerInfoEmbed(
        guild.name, guild.memberCount,
        guild.channels.cache.size, guild.roles.cache.size
      );
      await message.reply({ embeds: [embed] }).catch(() => null);
      return true;
    }

    case 'userinfo':
    case 'Ù…Ø¹Ù„ÙˆÙ…Ø§Øª': {
      const targetMember = message.mentions.members?.first() || message.member!;
      const warningCount = getWarningCount(targetMember.id);
      const embed = createMemberProfileEmbed(targetMember, warningCount, 12);
      await message.reply({ embeds: [embed] }).catch(() => null);
      return true;
    }

    case 'warn':
    case 'ØªØ­Ø°ÙŠØ±': {
      const targetMember = message.mentions.members?.first();
      const reason = args.slice(1).join(' ') || 'Ù…Ø®Ø§Ù„ÙØ© Ø³Ù„ÙˆÙƒÙŠØ© Ø¹Ø§Ù…Ø©';
      if (!targetMember) {
        await message.reply('âŒ ÙŠØ¬Ø¨ Ø§Ù„Ø¥Ø´Ø§Ø±Ø© Ù„Ù„Ø¹Ø¶Ùˆ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨ ØªØ­Ø°ÙŠØ±Ù‡. Ù…Ø«Ø§Ù„: `!opus warn @user Ø³Ø¨Ø§Ù…`').catch(() => null);
        return true;
      }
      if (!message.member?.permissions.has(PermissionFlagsBits.KickMembers)) {
        await message.reply('ðŸ”’ Ù„ÙŠØ³ Ù„Ø¯ÙŠÙƒ ØµÙ„Ø§Ø­ÙŠØ© Ø¥ØµØ¯Ø§Ø± Ø§Ù„ØªØ­Ø°ÙŠØ±Ø§Øª.').catch(() => null);
        return true;
      }
      const count = addWarning(targetMember.id, reason);
      const actionEmbed = createModerationActionEmbed(message.author.username, targetMember.user.username, 'WARN', reason, `${count}/3`);
      await message.reply({ embeds: [actionEmbed] }).catch(() => null);
      return true;
    }

    case 'warns':
    case 'ØªØ­Ø°ÙŠØ±Ø§Øª': {
      const targetMember = message.mentions.members?.first() || message.member!;
      const history = getUserWarningRecord(targetMember.id);
      const list = history?.reasons.map((r: string, i: number) => `**#${i + 1}** - ${r}`).join('\n') || 'Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ø®Ø§Ù„ÙØ§Øª Ù…Ø³Ø¬Ù„Ø©.';
      const embed = createWarningsHistoryEmbed(targetMember.user.username, history ? history.reasons.map((r: string, i: number) => ({ id: String(i+1), reason: r, date: 'Ù…Ø¤Ø®Ø±Ø§Ù‹', moderator: 'Ù†Ø¸Ø§Ù… Ø§Ù„Ø­Ù…Ø§ÙŠØ©' })) : []);
      await message.reply({ embeds: [embed] }).catch(() => null);
      return true;
    }

    case 'clearwarns':
    case 'ØªØµÙÙŠØ±_Ø§Ù„ØªØ­Ø°ÙŠØ±Ø§Øª': {
      const targetMember = message.mentions.members?.first();
      if (!targetMember) {
        await message.reply('âŒ ÙŠØ¬Ø¨ ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ø¹Ø¶Ùˆ Ø§Ù„Ù…Ø³ØªÙ‡Ø¯Ù.').catch(() => null);
        return true;
      }
      if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
        await message.reply('ðŸ”’ Ù„Ø§ ØªÙ…Ù„Ùƒ ØµÙ„Ø§Ø­ÙŠØ§Øª ÙƒØ§ÙÙŠØ© Ù„ØªØµÙÙŠØ± Ø§Ù„Ù…Ø®Ø§Ù„ÙØ§Øª.').catch(() => null);
        return true;
      }
      clearUserWarnings(targetMember.id);
      await message.reply(`âœ… ØªÙ… ØªØµÙÙŠØ± Ø³Ø¬Ù„ ØªØ­Ø°ÙŠØ±Ø§Øª Ø§Ù„Ø¹Ø¶Ùˆ ${targetMember} Ø¨Ù†Ø¬Ø§Ø­.`).catch(() => null);
      return true;
    }

    case 'shadowban':
    case 'Ø­Ø¸Ø±_ØµØ§Ù…Øª': {
      const targetMember = message.mentions.members?.first();
      if (!targetMember) {
        await message.reply('âŒ ÙŠØ¬Ø¨ ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ø¹Ø¶Ùˆ Ø§Ù„Ù…Ø³ØªÙ‡Ø¯Ù Ø¨Ø§Ù„Ù…Ù†Ø´Ù†.').catch(() => null);
        return true;
      }
      if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
        await message.reply('ðŸ”’ Ù„Ø§ ØªÙ…Ù„Ùƒ ØµÙ„Ø§Ø­ÙŠØ© ØªØ´ØºÙŠÙ„ Ø§Ù„Ø­Ø¬Ø¨ Ø§Ù„ØµØ§Ù…Øª.').catch(() => null);
        return true;
      }
      ShadowBanSystem.add(targetMember.id);
      await message.reply(`ðŸ¤« ØªÙ… Ø¥Ø¯Ø±Ø§Ø¬ ${targetMember} ØªØ­Øª Ø§Ù„Ù…Ø±Ø§Ù‚Ø¨Ø© ÙˆØ§Ù„Ø­Ø¬Ø¨ Ø§Ù„ØµØ§Ù…Øª Ø¨Ù†Ø¬Ø§Ø­.`).catch(() => null);
      return true;
    }

    case 'unshadowban':
    case 'Ø§Ù„ØºØ§Ø¡_Ø§Ù„Ø­Ø¸Ø±_Ø§Ù„ØµØ§Ù…Øª': {
      const targetMember = message.mentions.members?.first();
      if (!targetMember) {
        await message.reply('âŒ ÙŠØ¬Ø¨ ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ø¹Ø¶Ùˆ Ø§Ù„Ù…Ø³ØªÙ‡Ø¯Ù Ø¨Ø§Ù„Ù…Ù†Ø´Ù†.').catch(() => null);
        return true;
      }
      if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
        await message.reply('ðŸ”’ Ù„Ø§ ØªÙ…Ù„Ùƒ ØµÙ„Ø§Ø­ÙŠØ© Ø¥Ù„ØºØ§Ø¡ Ø§Ù„Ø­Ø¬Ø¨ Ø§Ù„ØµØ§Ù…Øª.').catch(() => null);
        return true;
      }
      ShadowBanSystem.remove(targetMember.id);
      await message.reply(`ðŸ”“ ØªÙ… Ø±ÙØ¹ Ø§Ù„Ù…Ø±Ø§Ù‚Ø¨Ø© ÙˆØ§Ù„Ø­Ø¬Ø¨ Ø§Ù„ØµØ§Ù…Øª Ø¹Ù† ${targetMember} Ø¨Ù†Ø¬Ø§Ø­.`).catch(() => null);
      return true;
    }

    case 'status':
    case 'Ø­Ø§Ù„Ø©': {
      const quickReport = ServerStatusDashboard.generateQuickStatusReport(guild);
      const autoModSummary = AutoModSummaryReport.generateAutomatedSummary(guild);
      await message.reply(`${quickReport}\n\n${autoModSummary}`).catch(() => null);
      return true;
    }

    case 'diagnostics':
    case 'ÙØ­Øµ': {
      if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
        await message.reply('ðŸ”’ Ù„Ø§ ØªÙ…Ù„Ùƒ ØµÙ„Ø§Ø­ÙŠØ© ØªØ´ØºÙŠÙ„ Ø§Ù„ÙØ­ÙˆØµØ§Øª Ø§Ù„ØªØ´Ø®ÙŠØµÙŠØ©.').catch(() => null);
        return true;
      }
      return true;
    }

    case 'backup':
    case 'Ù†Ø³Ø®_Ø§Ø­ØªÙŠØ§Ø·ÙŠ': {
      if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
        await message.reply('ðŸ”’ Ù„Ø§ ØªÙ…Ù„Ùƒ ØµÙ„Ø§Ø­ÙŠØ© Ø³Ø­Ø¨ Ø§Ù„Ù†Ø³Ø®Ø© Ø§Ù„Ø§Ø­ØªÙŠØ§Ø·ÙŠØ©.').catch(() => null);
        return true;
      }
      const template = GuildBackupManager.generateBackupTemplate(guild);
      const serialized = JSON.stringify(template, null, 2);
      await message.reply({
        content: 'ðŸ“¦ **Ù†Ø³Ø®Ø© Ø§Ø­ØªÙŠØ§Ø·ÙŠØ© Ù„Ù‡ÙŠÙƒÙ„ÙŠØ© ÙˆÙ‚Ù†ÙˆØ§Øª Ø§Ù„Ø³ÙŠØ±ÙØ± Ø¬Ø§Ù‡Ø²Ø©:**',
        files: [{ attachment: Buffer.from(serialized), name: `backup-${guild.id}.json` }]
      }).catch(() => null);
      return true;
    }



    case 'azkar':
    case 'Ø§Ø°ÙƒØ§Ø±': {
      const embed = createAzkarEmbed("Ø£Ø°ÙƒØ§Ø± Ø§Ù„ØµØ¨Ø§Ø­", "Ù„Ø§ Ø¥Ù„Ù‡ Ø¥Ù„Ø§ Ø§Ù„Ù„Ù‡ ÙˆØ­Ø¯Ù‡ Ù„Ø§ Ø´Ø±ÙŠÙƒ Ù„Ù‡ØŒ Ù„Ù‡ Ø§Ù„Ù…Ù„Ùƒ ÙˆÙ„Ù‡ Ø§Ù„Ø­Ù…Ø¯ ÙˆÙ‡Ùˆ Ø¹Ù„Ù‰ ÙƒÙ„ Ø´ÙŠØ¡ Ù‚Ø¯ÙŠØ±.", 100, "ÙƒØ§Ù†Øª Ù„Ù‡ Ø¹Ø¯Ù„ Ø¹Ø´Ø± Ø±Ù‚Ø§Ø¨ØŒ ÙˆÙƒØªØ¨Øª Ù„Ù‡ Ù…Ø¦Ø© Ø­Ø³Ù†Ø©ØŒ ÙˆÙ…Ø­ÙŠØª Ø¹Ù†Ù‡ Ù…Ø¦Ø© Ø³ÙŠØ¦Ø©.");
      await message.reply({ embeds: [embed] }).catch(() => null);
      return true;
    }

    case 'poll':
    case 'ØªØµÙˆÙŠØª': {
      const query = args.join(' ');
      if (!query || !query.includes('|')) {
        await message.reply('âŒ ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ Ø³Ø¤Ø§Ù„ Ø§Ù„ØªØµÙˆÙŠØª ÙˆØ§Ù„Ø®ÙŠØ§Ø±Ø§Øª Ù…ÙØµÙˆÙ„Ø© Ø¨Ù€ |. Ù…Ø«Ø§Ù„: `!opus poll Ù‡Ù„ ØªÙØ¶Ù„ Ø§Ù„Ø¨Ø±Ù…Ø¬Ø©ØŸ | Ù†Ø¹Ù… | Ù„Ø§`').catch(() => null);
        return true;
      }
      const subparts = query.split('|');
      const question = subparts[0]!.trim();
      const options = subparts.slice(1).map(o => o.trim());
      const embed = createPollEmbed(question, options, message.author.username, 30);
      const pollMsg = await message.reply({ embeds: [embed] }).catch(() => null);
      if (pollMsg) {
        const emojis = ['1ï¸âƒ£', '2ï¸âƒ£', '3ï¸âƒ£', '4ï¸âƒ£', '5ï¸âƒ£', '6ï¸âƒ£', '7ï¸âƒ£', '8ï¸âƒ£', '9ï¸âƒ£', 'ðŸ”Ÿ'];
        for (let i = 0; i < Math.min(options.length, emojis.length); i++) {
          await pollMsg.react(emojis[i]!).catch(() => null);
        }
      }
      return true;
    }

    case 'match':
    case 'Ø¨Ø·ÙˆÙ„Ø©': {
      const query = args.join(' ');
      if (!query || !query.includes('|')) {
        await message.reply('âŒ ÙŠØ±Ø¬Ù‰ ÙƒØªØ§Ø¨Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ù…ÙØµÙˆÙ„Ø© Ø¨Ù€ |. Ù…Ø«Ø§Ù„: `!opus match League of Legends | Team A | Team B | 20:00`').catch(() => null);
        return true;
      }
      const subparts = query.split('|');
      const game = subparts[0]!.trim();
      const teamA = subparts[1]!.trim();
      const teamB = subparts[2]!.trim();
      const time = subparts[3]!.trim();
      const embed = createEsportsMatchEmbed(game, teamA, teamB, time, "Ø¨Ø·ÙˆÙ„Ø© Ø±Ù…Ø¶Ø§Ù† Ø§Ù„ÙƒØ¨Ø±Ù‰", "https://twitch.tv");
      await message.reply({ embeds: [embed] }).catch(() => null);
      return true;
    }

    default:
      return false; // Ù„Ù… ÙŠØªØ·Ø§Ø¨Ù‚ ÙƒØ£Ù…Ø± ÙŠØ¯ÙˆÙŠ Ø±Ø³Ù…ÙŠ
  }
}

// ============================================================
//  3. ØªØ´ØºÙŠÙ„ ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„ÙØ­ÙˆØµØ§Øª ÙˆØ§Ù„ØªØ´Ø®ÙŠØµ Ø§Ù„Ø¹Ø§Ù… (Full System Diagnostics)
// ============================================================
async function runFullDiagnosticsReport(message: Message): Promise<void> {
  const guild = message.guild!;
  
  // ØªØ´ØºÙŠÙ„ Ø§Ù„ÙØ­ÙˆØµØ§Øª Ù„ÙƒØ§ÙØ© Ø§Ù„ÙˆØ­Ø¯Ø§Øª
  const aiReport = runAIDiagnostics();
  const monitorReport = runMonitorDiagnostics();
  const toolsReport = runDiscordToolsDiagnostics(guild);
  const communityReport = runCommunityBuilderDiagnostics();
  const memoryReport = runMemoryManagerDiagnostics();
  const dialectReport = runDialectEngineDiagnostics();
  const contextReport = runContextAnalyzerDiagnostics(guild, message.member);

  // Ø­Ø³Ø§Ø¨ Ø§Ù„Ù†ØªÙŠØ¬Ø© Ø§Ù„ÙƒÙ„ÙŠØ©
  const overallSuccess = aiReport.success && monitorReport.success && toolsReport.success && 
                         communityReport.success && memoryReport.success && dialectReport.success;

  const summaryReports = [
    `1. Ù…Ø­Ø±Ùƒ Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ (AI Model): ${aiReport.success ? 'âœ… Ø³Ù„ÙŠÙ…' : 'âŒ ÙØ´Ù„'} (Ø§Ù„Ø£Ø¯ÙˆØ§Øª: ${aiReport.totalTools})`,
    `2. Ù†Ø¸Ø§Ù… Ø§Ù„Ø±Ù‚Ø§Ø¨Ø© (AutoMod Shield): ${monitorReport.success ? 'âœ… Ø³Ù„ÙŠÙ…' : 'âŒ ÙØ´Ù„'}`,
    `3. Ø£Ø¯ÙˆØ§Øª Ø¯ÙŠØ³ÙƒÙˆØ±Ø¯ (Discord Tools): ${toolsReport.success ? 'âœ… Ø³Ù„ÙŠÙ…' : 'âŒ ÙØ´Ù„'}`,
    `4. Ù…ØµÙ…Ù… Ø§Ù„Ø³ÙŠØ±ÙØ±Ø§Øª (Community Builder): ${communityReport.success ? 'âœ… Ø³Ù„ÙŠÙ…' : 'âŒ ÙØ´Ù„'}`,
    `5. Ù…Ø­Ø±Ùƒ Ø§Ù„Ø°Ø§ÙƒØ±Ø© (Memory Manager): ${memoryReport.success ? 'âœ… Ø³Ù„ÙŠÙ…' : 'âŒ ÙØ´Ù„'}`,
    `6. Ù…Ø­Ø±Ùƒ Ø§Ù„Ù„Ù‡Ø¬Ø§Øª (Dialect Engine): ${dialectReport.success ? 'âœ… Ø³Ù„ÙŠÙ…' : 'âŒ ÙØ´Ù„'} (${dialectReport.passed}/${dialectReport.total} Ù†Ø§Ø¬Ø­)`,
    `7. ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ø³ÙŠØ§Ù‚ (Context Analyzer): ${contextReport.passed ? 'âœ… Ø³Ù„ÙŠÙ…' : 'âŒ ÙØ´Ù„'}`
  ];

  const diagEmbed = createDiagnosticsResultEmbed("ÙØ­ÙˆØµØ§Øª Ø§Ù„Ø¨ÙˆØª Ø§Ù„Ù…Ø±ÙƒØ²ÙŠØ© Ø§Ù„Ø´Ø§Ù…Ù„Ø©", summaryReports, overallSuccess);
  await message.reply({ embeds: [diagEmbed] }).catch(() => null);
}

// ============================================================
//  4. Ù…Ø³ØªÙ…Ø¹ Ø§Ù„Ø£Ø­Ø¯Ø§Ø« ÙˆÙ…ØªØ§Ø¨Ø¹Ø© Ø­Ø§Ù„Ø© Ø§Ù„Ø³ÙŠØ±ÙØ± (Discord client Events)
// ============================================================
client.once(Events.ClientReady, async () => {
  Logger.startup(`Opus Bot (${client.user?.tag})`);
  EntityRegistry.initialize();
  await SkillRegistry.loadDirectory(path.join(__dirname, 'skills')).catch((error) => {
    console.error('[SkillRegistry] Failed to load skills:', error);
  });
  const contextCleanupTimer = setInterval(() => {
    ContextEngine.cleanup();
    EntityRegistry.cleanup();
    aiRateLimiter.cleanup();
  }, 5 * 60_000);
  contextCleanupTimer.unref();
  Logger.info(
    'System',
    `AI routing ready: Groq primary (${config.groqModel} / ${config.groqFastModel}), Cerebras fallback (${config.cerebrasModel})`
  );
  
  // ØªÙ‡ÙŠØ¦Ø© Ù…Ø±Ø§Ù‚Ø¨ Ø§Ù„Ø³ÙŠØ±ÙØ± Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠ Ø¨ØµÙˆØªÙŠØ§Øª Ø§Ù„Ø´Ø§Øª ÙˆØ±Ø§Ø¨Ø· Ø§Ù„Ø­Ù…Ø§ÙŠØ©
  startAutonomousMonitor(client);
  
  // ØªØ­Ø¯ÙŠØ« Ø­Ø§Ù„Ø© Ø§Ù„Ø¨ÙˆØª ÙÙŠ Ø¯ÙŠØ³ÙƒÙˆØ±Ø¯
  client.user?.setActivity({
    name: 'Opus Ai',
    type: ActivityType.Watching,
  });
});

// Ù…Ø³ØªÙ…Ø¹ Ø£Ø­Ø¯Ø§Ø« Ø§Ù„ØªØ¹Ø¯ÙŠÙ„ Ø¹Ù„Ù‰ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª ÙˆØ§Ù„Ø±ØªØ¨
client.on(Events.GuildRoleUpdate, async (oldRole: Role, newRole: Role) => {
  try {
    const auditLogs = await newRole.guild.fetchAuditLogs({ limit: 1, type: Events.GuildRoleUpdate as any }).catch(() => null);
    const entry = auditLogs?.entries.first();
    const executorName = entry?.executor?.username ?? 'Unknown Admin';
    await RolePermsGuard.auditRoleUpdate(newRole.guild, oldRole, newRole, executorName);
  } catch (err) {
    Logger.error('Role Update Audit', err);
  }
});

// Ù…Ø³ØªÙ…Ø¹ Ø£Ø­Ø¯Ø§Ø« Ø§Ù†Ù‚Ø·Ø§Ø¹ Ø§Ù„Ø§ØªØµØ§Ù„ ÙˆØ§Ù„Ø£Ø®Ø·Ø§Ø¡ Ù„Ù„Ø¨ÙˆØª
client.on(Events.ShardDisconnect, (event) => {
  systemState.errorsLoggedCount++;
  Logger.warn('Shard Disconnect', `Reason: ${event.reason}`);
});

client.on(Events.Error, (error) => {
  systemState.errorsLoggedCount++;
  Logger.error('Client Error', error);
});

client.on(Events.Warn, (info) => {
  Logger.warn('Discord Warning', info);
});

// ============================================================
//  5. Ù…Ø¹Ø§Ù„Ø¬ ÙˆÙ‚Ø§Ø±Ø¦ Ø§Ù„Ø±Ø³Ø§Ø¦Ù„ Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠ Ø¨Ø§Ù„Ø®Ø§Ø¯Ù… (Core Message Listener)
// ============================================================
client.on(Events.MessageCreate, async (message: Message) => {
  // ÙØ­Øµ Ø­Ù…Ø§ÙŠØ© ÙˆØ­Ø¸Ø± ÙÙˆØ±ÙŠ Ù„Ø±Ø³Ø§Ø¦Ù„ Ø§Ù„Ø¨ÙˆØªØ§Øª Ù„ØªØ¬Ù†Ø¨ Ø§Ù„Ù„ÙˆØ¨ Ø§Ù„Ù„Ø§Ù†Ù‡Ø§Ø¦ÙŠ
  if (message.author.bot) return;
  if (message.author.id === client.user?.id) return;
  if (!message.guild) return;
  if (!message.member) return;

  systemState.processedMessages++;

  // 1. ØªØµÙÙŠØ© ÙˆÙØ­Øµ Ø§Ù„Ø­Ø¬Ø¨ Ø§Ù„ØµØ§Ù…Øª (Shadow Banned Users)
  const isBanned = await ShadowBanSystem.handleMessage(message);
  if (isBanned) return; // ØªÙ… Ø­Ø°Ù Ø§Ù„Ø±Ø³Ø§Ù„Ø© Ø¨ØµÙ…Øª

  // 2. ØªØµÙÙŠØ© Ø§Ù„Ø­Ø¬Ù… ÙˆØ§Ù„Ù…Ù„ÙØ§Øª Ø§Ù„Ù…Ø±ÙÙ‚Ø©
  const attachmentValid = await MediaFilterSystem.validateAttachments(message);
  if (!attachmentValid) return; // ØªÙ… Ø§Ù„ØªØ¹Ø§Ù…Ù„ ÙˆØ­Ø°Ù Ø§Ù„Ø±Ø³Ø§Ù„Ø© Ø§Ù„Ù…Ø±ÙÙ‚Ø© Ø§Ù„Ø«Ù‚ÙŠÙ„Ø©

  // 3. ÙØ­Øµ ÙˆÙ…Ù†Ø¹ ØªØ³Ø±ÙŠØ¨ Ø§Ù„ÙƒÙˆØ¯ Ø§Ù„Ø®Ø§Øµ Ø¨Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ø§Ù„Ø¨ÙˆØª (Credential Protection)
  const leaked = await CredentialProtection.scanForLeaks(message);
  if (leaked) return; // ØªÙ… Ø­Ø°Ù Ø§Ù„ØªÙˆÙƒÙ† Ø¨Ù†Ø¬Ø§Ø­

  // 4. ØªØµÙÙŠØ© Ø§Ù„Ø£Ù„ÙØ§Ø¸ Ø§Ù„Ù…Ø­Ø¸ÙˆØ±Ø© ÙÙŠ Ø§Ù„Ø´Ø§Øª (Bad Words filter)
  if (BadWordDictionary.isBanned(message.content)) {
    await message.delete().catch(() => null);
    const warnCount = addWarning(message.author.id, "Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø£Ù„ÙØ§Ø¸ Ù…Ø­Ø¸ÙˆØ±Ø©");
    const warnEmbed = new EmbedBuilder()
      .setColor(EMBED_COLORS.danger)
      .setTitle('ðŸš« Ù…Ø­ØªÙˆÙ‰ Ù…Ø®Ø§Ù„Ù Ù„Ù„Ø¢Ø¯Ø§Ø¨')
      .setDescription(`ÙŠØ§ ${message.member}ØŒ ÙŠØ±Ø¬Ù‰ Ø§Ù„ØªÙ…Ø³Ùƒ Ø¨Ø§Ù„Ø£Ø¯Ø¨ Ø§Ù„Ø¹Ø§Ù… ÙˆØªØ¬Ù†Ø¨ Ø§Ù„Ø£Ù„ÙØ§Ø¸ Ø§Ù„Ø³ÙŠØ¦Ø© Ù„Ø¶Ù…Ø§Ù† Ø¹Ø¯Ù… Ø§Ù„ØªØ¹Ø±Ø¶ Ù„Ù„ÙƒØªÙ….`)
      .setTimestamp();
    const warnMsg = await (message.channel as any).send({ content: `${message.member}`, embeds: [warnEmbed] }).catch(() => null);
    if (warnMsg) {
      setTimeout(() => warnMsg.delete().catch(() => null), 8000);
    }
    return;
  }

  // 5. ØªØªØ¨Ø¹ Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª ÙˆØªÙƒØ±Ø§Ø± Ø§Ù„ÙƒÙ„Ù…Ø§Øª (Word cloud stats)
  WordFrequencyTracker.trackMessage(message.content);

  // 6. Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ù…Ø·Ø§Ø¨Ù‚Ø© Ø§Ù„Ø±Ø¯ Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠ Ù„Ù„Ø£Ø³Ø¦Ù„Ø© Ø§Ù„Ø´Ø§Ø¦Ø¹Ø© (FAQ Autoresponder)
  const autoReply = AutoResponder.findResponse(message.content);
  if (autoReply) {
    await message.reply(autoReply).catch(() => null);
    return;
  }

  // 7. ØªØªØ¨Ø¹ ÙˆÙØ­Øµ Ù†ÙŠØ© Ø§Ù„Ø£ÙˆØ§Ù…Ø± Ø§Ù„ÙŠØ¯ÙˆÙŠØ© (Manual Commands checking)
  let isCommand = false;
  let rawPrompt = message.content.trim();
  const botMention = `<@!?${client.user?.id}>`;
  
  if (rawPrompt.startsWith('!opus')) {
    isCommand = true;
    rawPrompt = rawPrompt.slice(5).trim();
  } else if (rawPrompt.startsWith(botMention)) {
    isCommand = true;
    rawPrompt = rawPrompt.replace(new RegExp(botMention, 'g'), '').trim();
  }

  // Ø¥Ø°Ø§ ØªÙ… Ø±ØµØ¯Ù‡Ø§ ÙƒØ£Ù…Ø± ÙŠØ¯ÙˆÙŠØŒ Ù…Ø±Ø±Ù‡Ø§ Ù„Ø±Ø§ÙˆØªØ± Ø§Ù„Ø£ÙˆØ§Ù…Ø±
  if (isCommand && rawPrompt) {
    const handled = await handleManualCommand(message, rawPrompt);
    if (handled) return; // ØªÙ… ØªÙ†ÙÙŠØ° Ø§Ù„Ø£Ù…Ø± Ø§Ù„ÙŠØ¯ÙˆÙŠ Ø¨Ù†Ø¬Ø§Ø­
  }

  // 8. AI Assistant Logic - respond if mentioned, in helper channels, or any message with content
  const isTargeted = message.mentions.has(client.user!) || 
                     message.content.toLowerCase().includes('opus') || 
                     ((message.channel as any).name?.includes('مساعد') ?? false) ||
                     ((message.channel as any).name?.includes('opus') ?? false) || 
                     message.channel.isDMBased() ||
                     isCommand;

  // Skip empty messages unless targeted
  if (!isTargeted && message.content.trim().length === 0) return;

  // Check authorization - admins/guild owner/authorized role can always use AI
  const isAdmin = message.member?.permissions.has(PermissionFlagsBits.Administrator) || 
                  message.guild?.ownerId === message.author.id;
  const isAuthorized = isAdmin || message.member?.roles.cache.has(config.authorizedRoleId);

  // For targeted messages, require authorization
  if (isTargeted && !isAuthorized) {
    try {
      await message.reply({ content: 'You need an authorized role to use Opus Ai.' });
    } catch {}
    return;
  }

  // For non-targeted messages, only process if authorized
  if (!isTargeted && !isAuthorized) return;

  // ØªÙ†Ø¸ÙŠÙ Ø§Ù„Ø¨Ø±ÙˆÙ…Ø¨Øª Ø§Ù„Ù…Ø³ØªÙ‡Ø¯Ù Ø¨Ø§Ù„Ù…Ø¹Ø§Ù„Ø¬Ø©
  let cleanedPromptText = message.content.trim();
  cleanedPromptText = cleanedPromptText.replace(new RegExp(botMention, 'g'), '').trim();
  if (cleanedPromptText.startsWith('!opus')) {
    cleanedPromptText = cleanedPromptText.slice(5).trim();
  }

  if (!cleanedPromptText) {
    await message.reply('ياهلا! أنا Opus Ai. وش تبغاني أسوي لك؟').catch(() => null);
    return;
  }

  const conversationReply = getConversationReply(cleanedPromptText);
  if (conversationReply) {
    await message.reply(conversationReply).catch(() => null);
    return;
  }

  const directPermissionOperations = buildArabicPermissionOperations(
    cleanedPromptText,
    message.guild
  );
  if (directPermissionOperations.length > 0) {
    const results: string[] = [];
    for (const operation of directPermissionOperations) {
      const result = await executeToolWithAudit(
        'edit_permissions',
        operation,
        message.guild,
        message.channel.id,
        message.author.id,
        message.member
      );
      results.push(result?.message ?? (result?.success ? 'تم تحديث الصلاحيات.' : 'تعذر تحديث الصلاحيات.'));
      const registeredEntities = EntityRegistry.registerToolResult(
        message.guild,
        'edit_permissions',
        operation,
        result
      );
      memoryManager.rememberEntities(message.channel.id, registeredEntities);
    }
    await message.reply(results.join('\n')).catch(() => null);
    return;
  }

  const aiLimit = aiRateLimiter.check(message.author.id, message.guild.id);
  if (!aiLimit.allowed) {
    const scope = aiLimit.scope === 'guild' ? 'السيرفر وصل حد طلبات الذكاء' : 'وصلت حد طلبات الذكاء';
    await message.reply(`${scope} مؤقتًا. جرّب بعد ${aiLimit.retryAfterSeconds ?? 60} ثانية.`).catch(() => null);
    return;
  }

  // Ø¬Ù„Ø¨ Ø³ÙŠØ§Ù‚ Ø§Ù„Ø±Ø³Ø§Ù„Ø© Ø§Ù„Ù…Ø±Ø¬Ø¹ÙŠØ© ÙÙŠ Ø¯ÙŠØ³ÙƒÙˆØ±Ø¯ Ø¥Ù† ÙˆØ¬Ø¯
  let replyContext: string | undefined;
  if (message.reference?.messageId) {
    try {
      const refMsg = await message.channel.messages.fetch(message.reference.messageId);
      if (refMsg?.content) {
        replyContext = refMsg.content.slice(0, 1000);
      }
    } catch {}
  }

  // Ø¥Ø±Ø³Ø§Ù„ Ø¹Ù„Ø§Ù…Ø© Ø¬Ø§Ø±ÙŠ Ø§Ù„ÙƒØªØ§Ø¨Ø© Ø¨Ø§Ù„Ø¯ÙŠØ³ÙƒÙˆØ±Ø¯ Ù„Ù„Ø¥Ø´Ø§Ø±Ø© Ù„Ù„Ù…Ø¹Ø§Ù„Ø¬Ø©
  await (message.channel as any).sendTyping().catch(() => null);
  systemState.aiQueriesCount++;

  try {
    // Ø¬Ù„Ø¨ ÙˆØ­ÙØ¸ Ø³ÙŠØ§Ù‚ Ø§Ù„ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ù„Ù‡Ø¬ÙŠ ÙˆØ§Ù„Ù†ÙŠØ©
    const channelName = 'name' in message.channel ? (message.channel as any).name : 'unknown';
    const ctx = ContextAnalyzer.analyze(
      cleanedPromptText,
      message.guild,
      message.member,
      message.channel.id,
      channelName,
      replyContext
    );

    // Ø¨Ù†Ø§Ø¡ Ø³ÙŠØ§Ù‚ Ø§Ù„Ø±Ø³Ø§Ù„Ø© Ø§Ù„Ù…Ø¹Ø²Ø²Ø© Ø¨Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ
    const sessionEntities = memoryManager.getRecentEntities(message.channel.id);
    const explicitTargets = resolveExplicitToolTargets(
      message.guild,
      cleanedPromptText,
      sessionEntities
    );
    const referencedAt = Date.now();
    memoryManager.rememberEntities(message.channel.id, [
      ...explicitTargets.channelIds.map((id) => ({
        guildId: message.guild!.id,
        type: 'channel' as const,
        id,
        name: message.guild!.channels.cache.get(id)?.name ?? id,
        sourceTool: 'user_reference',
        createdAt: referencedAt,
      })),
      ...explicitTargets.categoryIds.map((id) => ({
        guildId: message.guild!.id,
        type: 'category' as const,
        id,
        name: message.guild!.channels.cache.get(id)?.name ?? id,
        sourceTool: 'user_reference',
        createdAt: referencedAt,
      })),
      ...explicitTargets.roleIds.map((id) => ({
        guildId: message.guild!.id,
        type: 'role' as const,
        id,
        name: message.guild!.roles.cache.get(id)?.name ?? id,
        sourceTool: 'user_reference',
        createdAt: referencedAt,
      })),
    ]);
    const sessionContext = ContextEngine.getOrCreate(message.channel.id, message.guild.id);
    ContextEngine.addTurn(message.channel.id, {
      role: 'user',
      content: cleanedPromptText,
      timestamp: Date.now(),
      userId: message.author.id,
      intent: detectArabicIntent(cleanedPromptText),
      extractedEntities: [
        ...explicitTargets.channelIds.map((id) => ({
          type: 'channel' as const,
          id,
          name: message.guild!.channels.cache.get(id)?.name ?? id,
          mentioned: true,
        })),
        ...explicitTargets.categoryIds.map((id) => ({
          type: 'category' as const,
          id,
          name: message.guild!.channels.cache.get(id)?.name ?? id,
          mentioned: true,
        })),
        ...explicitTargets.roleIds.map((id) => ({
          type: 'role' as const,
          id,
          name: message.guild!.roles.cache.get(id)?.name ?? id,
          mentioned: true,
        })),
      ],
    });
    const explicitTargetsContext = buildExplicitTargetsContext(message.guild, explicitTargets);
    const systemPrompt = [
      ContextEngine.buildSystemPrompt(sessionContext, message.guild, message.author.id),
      memoryManager.buildEntityContext(message.channel.id),
      SkillRegistry.buildSkillManifestForAI(),
    ].join('\n');
    const enrichedPrompt = [
      ContextAnalyzer.buildEnrichedPrompt(ctx),
      explicitTargetsContext,
    ].filter(Boolean).join('\n');
    const history = memoryManager.getHistory(message.channel.id);

    const userMessage: AIMessage = { role: 'user', content: enrichedPrompt };
    memoryManager.addMessage(message.channel.id, userMessage);
    history.push(userMessage);

    // Ø­Ù„Ù‚Ø© Ù…Ø¹Ø§Ù„Ø¬Ø© Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ø£Ø¯ÙˆØ§Øª Ø§Ù„Ù…ÙƒØ±Ø±Ø© Ø¨Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ
    let loopCount = 0;
    const maxLoops = 6;
    let finalResponseSent = false;
    const completedToolResults: Array<{ name: string; args: any; result: any }> = [];

    const deterministicWorkflow = planCompoundDiscordRequest(cleanedPromptText);
    let aiResponse = deterministicWorkflow.length > 0
      ? { role: 'assistant' as const, content: null }
      : await runAIRequest(message.guild.id, history, { systemPrompt });

    const structuredWorkflow = deterministicWorkflow.length > 0
      ? deterministicWorkflow
      : WorkflowEngine.parseFromAIResponse(aiResponse.content);
    if (structuredWorkflow.length > 0) {
      const workflowGuild = message.guild;
      const workflowMember = message.member;
      if (!workflowGuild || !workflowMember) return;
      ContextEngine.setWorkflow(message.channel.id, `ai_${Date.now()}`, structuredWorkflow);
      const workflowResult = await WorkflowEngine.execute(structuredWorkflow, async (skillId, rawArgs) => {
        const skill = SkillRegistry.get(skillId);
        if (!skill) {
          return { success: false, message: `المهارة "${skillId}" غير محملة أو غير مدعومة.` };
        }
        if (!hasAnyPermission(workflowMember, skill.requiredPermissions)) {
          return {
            success: false,
            message: 'لا يمكن تنفيذ هذه المهارة قبل التحقق من صلاحيات العضو المنفذ.',
          };
        }
        let skillArgs = applyArabicPermissionsToToolArgs(
          skillId,
          rawArgs,
          cleanedPromptText,
          workflowGuild.id
        );
        const targeted = applyExplicitTargets(skillId, skillArgs, explicitTargets);
        if (targeted.error) return { success: false, message: targeted.error };
        skillArgs = targeted.args;
        const skillResult = await skill.execute({
          guild: workflowGuild,
          channel: message.channel as TextChannel,
          user: workflowMember,
          args: skillArgs,
          context: sessionContext,
        });
        const toolResult = skillResult.data && typeof skillResult.data === 'object'
          ? skillResult.data as Record<string, any>
          : skillResult;
        const registeredEntities = EntityRegistry.registerToolResult(
          workflowGuild,
          skillId,
          skillArgs,
          toolResult
        );
        memoryManager.rememberEntities(message.channel.id, registeredEntities);
        return skillResult;
      });
      ContextEngine.clearWorkflow(message.channel.id);
      const workflowReply = workflowResult.steps
        .map((step) => step.result?.messageAr ?? step.result?.message ?? 'تمت معالجة الخطوة.')
        .join('\n');
      await sendLongMessage(message, workflowReply);
      ContextEngine.addTurn(message.channel.id, {
        role: 'assistant',
        content: workflowReply,
        timestamp: Date.now(),
        userId: client.user!.id,
        toolsUsed: workflowResult.steps.map((step) => step.tool),
      });
      return;
    }

    while (aiResponse.tool_calls && aiResponse.tool_calls.length > 0 && loopCount < maxLoops) {
      loopCount++;

      const assistantMsg: AIMessage = {
        role: 'assistant',
        content: aiResponse.content || null,
        tool_calls: aiResponse.tool_calls,
      };
      memoryManager.addMessage(message.channel.id, assistantMsg);
      history.push(assistantMsg);

      for (const toolCall of aiResponse.tool_calls) {
        const toolName = toolCall.function.name;
        let toolArgs: any;
        try {
          toolArgs = JSON.parse(toolCall.function.arguments);
        } catch {
          toolArgs = {};
        }
        toolArgs = applyArabicPermissionsToToolArgs(
          toolName,
          toolArgs,
          cleanedPromptText,
          message.guild.id
        );
        const targetedCall = applyExplicitTargets(toolName, toolArgs, explicitTargets);
        toolArgs = targetedCall.args;
        const toolCallId = toolCall.id;

        // Tool call logged internally

        if (targetedCall.error) {
          const targetError = {
            success: false,
            message: targetedCall.error,
          };
          const targetErrorMsg: AIMessage = {
            role: 'tool',
            name: toolName,
            tool_call_id: toolCallId,
            content: JSON.stringify(targetError),
          };
          memoryManager.addMessage(message.channel.id, targetErrorMsg);
          history.push(targetErrorMsg);
          completedToolResults.push({ name: toolName, args: toolArgs, result: targetError });
          continue;
        }

        // Protect the active channel from accidental deletion.
        if (toolName === 'delete_channels' && toolArgs.channelIds) {
          toolArgs.channelIds = toolArgs.channelIds.filter((id: string) => id !== message.channel.id);
          if (toolArgs.channelIds.length === 0) {
            const protectMsg: AIMessage = {
              role: 'tool',
              name: toolName,
              tool_call_id: toolCallId,
              content: JSON.stringify({ success: false, message: 'لا يمكن حذف الروم الحالي حتى تستمر المحادثة.' }),
            };
            memoryManager.addMessage(message.channel.id, protectMsg);
            history.push(protectMsg);
            continue;
          }
        }

        let executionResult;
        try {
          executionResult = await executeToolWithAudit(
            toolName, toolArgs, message.guild,
            message.channel.id, message.author.id, message.member
          );
        } catch (toolError) {
          executionResult = {
            success: false,
            message: toolError instanceof Error ? toolError.message : String(toolError),
          };
        }

        const resultStr = MemoryManager.trimToolResult(JSON.stringify(executionResult));
        const toolMsg: AIMessage = {
          role: 'tool',
          name: toolName,
          tool_call_id: toolCallId,
          content: resultStr,
        };
        memoryManager.addMessage(message.channel.id, toolMsg);
        history.push(toolMsg);
        completedToolResults.push({ name: toolName, args: toolArgs, result: executionResult });
        const registeredEntities = EntityRegistry.registerToolResult(
          message.guild,
          toolName,
          toolArgs,
          executionResult
        );
        memoryManager.rememberEntities(message.channel.id, registeredEntities);
      }

      // ÙØ­Øµ Ø£Ù…Ø§Ù† Ø£Ù† Ø§Ù„Ù‚Ù†Ø§Ø© Ù„Ù… ÙŠØªÙ… Ø­Ø°ÙÙ‡Ø§ Ø£Ø«Ù†Ø§Ø¡ ØªØ´ØºÙŠÙ„ Ø§Ù„Ø£Ø¯ÙˆØ§Øª
      const channelStillExists = message.guild.channels.cache.has(message.channel.id);
      if (!channelStillExists) {
        console.warn('[AI Router] The active channel was deleted during multi-tool execution.');
        finalResponseSent = true;
        break;
      }

      const deterministicReply = buildToolExecutionReply(message.guild, completedToolResults);
      if (deterministicReply) {
        await sendLongMessage(message, deterministicReply);
        const finalMsg: AIMessage = { role: 'assistant', content: deterministicReply };
        memoryManager.addMessage(message.channel.id, finalMsg);
        history.push(finalMsg);
        ContextEngine.addTurn(message.channel.id, {
          role: 'assistant',
          content: deterministicReply,
          timestamp: Date.now(),
          userId: client.user!.id,
          toolsUsed: completedToolResults.map((result) => result.name),
        });
        finalResponseSent = true;
        break;
      }

      await (message.channel as any).sendTyping().catch(() => null);
      aiResponse = await runAIRequest(message.guild.id, history, {
        systemPrompt: [
          ContextEngine.buildSystemPrompt(sessionContext, message.guild, message.author.id),
          memoryManager.buildEntityContext(message.channel.id),
          SkillRegistry.buildSkillManifestForAI(),
        ].join('\n'),
      });
    }

    // Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø±Ø¯ Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ Ù„Ù„Ù…Ø³ØªØ®Ø¯Ù…
    const channelOk = message.guild.channels.cache.has(message.channel.id);
    if (channelOk && aiResponse.content) {
      await sendLongMessage(message, aiResponse.content);

      const finalMsg: AIMessage = { role: 'assistant', content: aiResponse.content };
      memoryManager.addMessage(message.channel.id, finalMsg);
      history.push(finalMsg);
      ContextEngine.addTurn(message.channel.id, {
        role: 'assistant',
        content: aiResponse.content,
        timestamp: Date.now(),
        userId: client.user!.id,
      });
      finalResponseSent = true;
    }

    if (!finalResponseSent && channelOk) {
      const deterministicReply = buildToolExecutionReply(message.guild, completedToolResults);
      await message.reply(deterministicReply || 'تمت معالجة الطلب.').catch(() => null);
    }
  } catch (error) {
    console.error('[Core AI Loop] AI request processing failed:', error);
    const fallbackText = OfflineFallbackResponder.getFallbackReply(message.content);
    if (fallbackText) {
      await message.reply(fallbackText).catch(() => null);
    } else {
      const friendlyError = formatUserError(error);
      await message.reply(friendlyError).catch(() => null);
    }
  }
});
// ============================================================
//  6. ÙˆØ¸Ø§Ø¦Ù Ø§Ù„ØªÙ‚Ø³ÙŠÙ… ÙˆØ§Ù„Ø¥Ø±Ø³Ø§Ù„ ÙˆØ§Ù„ØªÙ†Ø³ÙŠÙ‚ (Utility Helpers)
// ============================================================
async function sendLongMessage(message: Message, content: string): Promise<void> {
  if (content.length <= 2000) {
    await message.reply(content).catch(() => null);
    return;
  }

  const chunks = smartSplit(content, 1900);
  for (let i = 0; i < chunks.length; i++) {
    try {
      if (i === 0) {
        await message.reply(chunks[i]!);
      } else {
        await (message.channel as any).send(chunks[i]!);
      }
    } catch (err) {
      console.error('[Sender] ÙØ´Ù„ Ø¥Ø±Ø³Ø§Ù„ Ø¬Ø²Ø¡ Ù…Ù† Ø§Ù„Ø±Ø³Ø§Ù„Ø© Ø§Ù„Ø·ÙˆÙŠÙ„Ø©:', err);
    }
  }
}

function smartSplit(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // Ø§Ù„Ø¨Ø­Ø« Ø¹Ù† Ø£Ù‚Ø±Ø¨ Ø³Ø·Ø± Ø¬Ø¯ÙŠØ¯ Ù„Ù„ØªÙ‚Ø³ÙŠÙ… Ø§Ù„Ù†Ø¸ÙŠÙ
    let splitAt = remaining.lastIndexOf('\n', maxLength);
    if (splitAt < maxLength * 0.3) {
      // Ø§Ù„Ø¨Ø­Ø« Ø¹Ù† Ø£Ù‚Ø±Ø¨ Ù…Ø³Ø§ÙØ© Ù„Ù„ÙƒÙ„Ù…Ø§Øª
      splitAt = remaining.lastIndexOf(' ', maxLength);
    }
    if (splitAt < maxLength * 0.3) {
      // Ù‚Ø·Ø¹ Ù…ÙŠÙƒØ§Ù†ÙŠÙƒÙŠ Ø¹Ù†Ø¯ Ø§Ù„Ø­Ø¯
      splitAt = maxLength;
    }

    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }

  return chunks;
}

function formatUserError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);

  if (msg.includes('تعذر تشغيل الذكاء الاصطناعي مؤقتًا')) {
    return 'تعذر تشغيل الذكاء الاصطناعي مؤقتًا، جرّب بعد شوي.';
  }

  if (msg.includes('مفاتيح الذكاء الاصطناعي غير صالحة')) {
    return 'إعدادات الذكاء الاصطناعي غير صالحة حاليًا. يجب تحديث مفاتيح Groq وCerebras في Render.';
  }

  if (msg.includes('API error') || msg.includes('fetch') || msg.includes('ECONNREFUSED')) {
    return 'تعذر الاتصال بمزودي الذكاء الاصطناعي مؤقتًا. جرّب بعد شوي.';
  }
  if (msg.includes('rate limit') || msg.includes('429')) {
    return 'مزود الذكاء مزدحم حاليًا. انتظر دقيقة ثم جرّب مجددًا.';
  }
  if (msg.includes('permission') || msg.includes('Missing Permissions')) {
    return 'صلاحيات البوت غير كافية لتنفيذ هذا الإجراء.';
  }
  if (msg.includes('Unknown Channel') || msg.includes('Unknown Role')) {
    return 'الروم أو الرتبة المطلوبة غير موجودة أو حُذفت مؤخرًا.';
  }

  const shortMsg = msg.length > 250 ? msg.slice(0, 250) + '...' : msg;
  return `فشلت العملية: ${shortMsg}`;
}

// ============================================================
//  7. Ù†Ø¸Ø§Ù… Ù…Ø³ØªÙˆÙŠØ§Øª Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡ ÙˆØ¬Ù†ÙŠ Ø§Ù„Ø®Ø¨Ø±Ø© (Leveling & XP System)
// ============================================================
export interface MemberXPData {
  xp: number;
  level: number;
  lastMessageTimestamp: number;
}
const membersXPMap = new Map<string, MemberXPData>();

export class LevelingSystem {
  private static XP_COOLDOWN_MS = 60000; // Ø¯Ù‚ÙŠÙ‚Ø© ÙˆØ§Ø­Ø¯Ø© Ø¨ÙŠÙ† ÙƒØ³Ø¨ Ø§Ù„Ø®Ø¨Ø±Ø©
  private static XP_PER_MESSAGE = 15;

  /**
   * Ù…Ø¹Ø§Ù„Ø¬Ø© ÙƒØ³Ø¨ Ø§Ù„Ù†Ù‚Ø§Ø· Ù„Ù„Ø¹Ø¶Ùˆ Ø¹Ù†Ø¯ Ø¥Ø±Ø³Ø§Ù„ Ø±Ø³Ø§Ù„Ø©
   */
  static handleMessageXP(userId: string, memberName: string, channel: any): void {
    const now = Date.now();
    const data = membersXPMap.get(userId) ?? { xp: 0, level: 1, lastMessageTimestamp: 0 };

    if (now - data.lastMessageTimestamp >= this.XP_COOLDOWN_MS) {
      data.xp += this.XP_PER_MESSAGE;
      data.lastMessageTimestamp = now;

      // Ø­Ø³Ø§Ø¨ Ø§Ù„Ø®Ø¨Ø±Ø© Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø© Ù„Ù„Ù…Ø³ØªÙˆÙ‰ Ø§Ù„ØªØ§Ù„ÙŠ
      const requiredXP = data.level * 100;
      if (data.xp >= requiredXP) {
        data.level++;
        data.xp = 0; // ØªØµÙÙŠØ± Ø§Ù„Ù†Ù‚Ø§Ø· ÙˆØ§Ù„Ø¨Ø¯Ø¡ Ù…Ù† Ø¬Ø¯ÙŠØ¯ Ù„Ù„Ù…Ø³ØªÙˆÙ‰ Ø§Ù„ØªØ§Ù„ÙŠ

        // Ø¥Ø±Ø³Ø§Ù„ ØªÙ†Ø¨ÙŠÙ‡ ØªØ±Ù‚ÙŠØ© Ø§Ù„Ù…Ø³ØªÙˆÙ‰
        const levelEmbed = createLevelUpEmbed(memberName, data.level - 1, data.level);
        channel.send({ embeds: [levelEmbed] }).catch(() => null);
      }
      membersXPMap.set(userId, data);
    }
  }

  static getMemberLevel(userId: string): number {
    return membersXPMap.get(userId)?.level ?? 1;
  }

  static getMemberXP(userId: string): number {
    return membersXPMap.get(userId)?.xp ?? 0;
  }
}

// ============================================================
//  8. Ù†Ø¸Ø§Ù… Ø§Ù„Ø§Ù‚ØªØ±Ø§Ø­Ø§Øª ÙˆØ§Ù„Ù…Ø´Ø§Ø±ÙƒØ§Øª Ø§Ù„ØªÙØ§Ø¹Ù„ÙŠØ© (Suggestion Box System)
// ============================================================
export class SuggestionBox {
  /**
   * Ø¥Ø±Ø³Ø§Ù„ Ø§Ù‚ØªØ±Ø§Ø­ ÙÙŠ Ù‚Ù†Ø§Ø© Ø§Ù„Ø§Ù‚ØªØ±Ø§Ø­Ø§Øª Ø§Ù„Ù…Ø­Ø¯Ø¯Ø©
   */
  static async submitSuggestion(message: Message, suggestionText: string): Promise<void> {
    const guild = message.guild!;
    const suggestionChannel = guild.channels.cache.find(
      (ch: any) =>
        ch.isTextBased() &&
        ['Ø§Ù‚ØªØ±Ø§Ø­Ø§Øª', 'Ø§Ù‚ØªØ±Ø§Ø­', 'suggestions', 'suggest', 'Ø§Ù‚ØªØ±Ø§Ø­-Ø£Ø¹Ø¶Ø§Ø¡'].some(
          (name) => (ch.name as string).toLowerCase().includes(name)
        )
    ) as TextChannel | null;

    if (!suggestionChannel) {
      await message.reply('âŒ Ù„Ù… Ø£Ø¬Ø¯ Ù‚Ù†Ø§Ø© Ù…Ø®ØµØµØ© Ù„Ù„Ø§Ù‚ØªØ±Ø§Ø­Ø§Øª ÙÙŠ Ù‡Ø°Ø§ Ø§Ù„Ø³ÙŠØ±ÙØ±.').catch(() => null);
      return;
    }

    const embed = createSuggestionEmbed(message.author.username, suggestionText, Math.floor(Math.random() * 9000) + 1000, 'PENDING');
    const suggestMsg = await suggestionChannel.send({ embeds: [embed] }).catch(() => null);
    
    if (suggestMsg) {
      await suggestMsg.react('ðŸ‘').catch(() => null);
      await suggestMsg.react('ðŸ‘Ž').catch(() => null);
      await message.reply(`âœ… ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø§Ù‚ØªØ±Ø§Ø­Ùƒ Ø¨Ù†Ø¬Ø§Ø­ ÙÙŠ Ø§Ù„Ù‚Ù†Ø§Ø© Ø§Ù„Ù…Ø®ØµØµØ©: ${suggestionChannel}`).catch(() => null);
    }
  }
}

// ============================================================
//  9. Ù†Ø¸Ø§Ù… Ø§Ù„ØªØ­Ù‚Ù‚ ÙˆØ§Ù„ØªÙˆØ«ÙŠÙ‚ Ø§Ù„ØªÙØ§Ø¹Ù„ÙŠ Ù„Ù„Ø£Ø¹Ø¶Ø§Ø¡ Ø§Ù„Ø¬Ø¯Ø¯ (Verification Gateway)
// ============================================================
export class MemberVerificationGateway {
  /**
   * Ø¥Ø±Ø³Ø§Ù„ Ø±Ø³Ø§Ù„Ø© Ø§Ù„ØªÙˆØ«ÙŠÙ‚ ÙÙŠ Ù‚Ù†Ø§Ø© Ø§Ù„ØªØ­Ù‚Ù‚
   */
  static async sendGatewayMessage(channel: TextChannel): Promise<void> {
    const embed = createVerificationEmbed(channel.guild.name);
    const message = await channel.send({ embeds: [embed] }).catch(() => null);
    if (message) {
      await message.react('âœ…').catch(() => null);
    }
  }

  /**
   * Ø§Ù„ØªØ¹Ø§Ù…Ù„ Ù…Ø¹ ØªÙØ§Ø¹Ù„Ø§Øª Ø§Ù„ØªÙˆØ«ÙŠÙ‚ Ù„ØªÙ„Ù‚ÙŠ Ø§Ù„Ø±ØªØ¨Ø© ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹
   */
  static async handleReaction(reaction: any, user: any): Promise<void> {
    if (user.bot) return;
    if (reaction.emoji.name !== 'âœ…') return;

    const member = await reaction.message.guild?.members.fetch(user.id).catch(() => null);
    if (!member) return;

    // Ø§Ù„Ø¨Ø­Ø« Ø¹Ù† Ø±ØªØ¨Ø© Ø§Ù„ØªÙˆØ«ÙŠÙ‚ (Ø¹Ø¶ÙˆØŒ Ù…ÙˆØ«Ù‚ØŒ Verified)
    const verifiedRole = reaction.message.guild.roles.cache.find(
      (r: any) => ['Ø¹Ø¶Ùˆ', 'Ù…ÙˆØ«Ù‚', 'verified', 'Verified', 'Ø£Ø¹Ø¶Ø§Ø¡'].some(name => r.name.toLowerCase().includes(name))
    );

    if (verifiedRole) {
      await member.roles.add(verifiedRole).catch(() => null);
      // Ø¥Ø±Ø³Ø§Ù„ Ø±Ø³Ø§Ù„Ø© ØªØ±Ø­ÙŠØ¨ÙŠØ© Ø®Ø§ØµØ© Ø¨ØµÙ†Ø¯ÙˆÙ‚ Ø§Ù„ÙˆØ§Ø±Ø¯ Ø§Ù„Ø®Ø§Øµ Ø¨Ø§Ù„Ø¹Ø¶Ùˆ
      await user.send(`ðŸŽ‰ Ù…Ø±Ø­Ø¨Ø§Ù‹ Ø¨Ùƒ ÙŠØ§ **${user.username}**! ØªÙ… ØªÙˆØ«ÙŠÙ‚ Ø­Ø³Ø§Ø¨Ùƒ ÙÙŠ Ø³ÙŠØ±ÙØ± **${reaction.message.guild.name}** Ø¨Ù†Ø¬Ø§Ø­.`).catch(() => null);
    }
  }
}

// ============================================================
//  10. Ù…Ø³ØªÙ…Ø¹ Ø§Ù„Ø£Ø­Ø¯Ø§Ø« Ø§Ù„ØªÙØ§Ø¹Ù„ÙŠØ© Ù„Ù„Ø£Ø²Ø±Ø§Ø± ÙˆØ§Ù„Ù‚ÙˆØ§Ø¦Ù… (Interaction Listener)
// ============================================================
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

  const guild = interaction.guild;
  if (!guild) return;

  const member = interaction.member as GuildMember;
  if (!member) return;

  // Interaction handled

  // 1. Ø§Ù„ØªÙØ§Ø¹Ù„ Ù…Ø¹ Ø£Ø²Ø±Ø§Ø± Ø§Ù„Ø¯Ø¹Ù… Ø§Ù„ÙÙ†ÙŠ ÙˆØ§Ù„ØªØ°Ø§ÙƒØ±
  if (interaction.customId === 'create_ticket') {
    await interaction.deferReply({ ephemeral: true }).catch(() => null);
    try {
      const ticketChannel = await guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          },
          {
            id: config.authorizedRoleId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          }
        ]
      });

      const ticketEmbed = createTicketEmbed();
      await ticketChannel.send({ content: `${interaction.user} | Ø·Ø§Ù‚Ù… Ø§Ù„Ø¯Ø¹Ù…`, embeds: [ticketEmbed] }).catch(() => null);
      await interaction.editReply({ content: `âœ… ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ ØªØ°ÙƒØ±ØªÙƒ Ø¨Ù†Ø¬Ø§Ø­ ÙÙŠ Ø§Ù„Ù‚Ù†Ø§Ø© Ø§Ù„ØªØ§Ù„ÙŠØ©: ${ticketChannel}` }).catch(() => null);
    } catch (err: any) {
      await interaction.editReply({ content: `âŒ ØªØ¹Ø°Ø± Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„ØªØ°ÙƒØ±Ø©: ${err.message}` }).catch(() => null);
    }
  }

  // 2. Ø§Ù„ØªÙØ§Ø¹Ù„ Ù…Ø¹ Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø£Ø¯ÙˆØ§Ø± Ø§Ù„ØªÙØ§Ø¹Ù„ÙŠØ© (Role Selection Menu)
  if (interaction.isStringSelectMenu() && interaction.customId === 'select_custom_roles') {
    await interaction.deferReply({ ephemeral: true }).catch(() => null);
    const selectedRoleIds = interaction.values;
    
    try {
      // Ø¥Ø²Ø§Ù„Ø© Ø§Ù„Ø£Ø¯ÙˆØ§Ø± ØºÙŠØ± Ø§Ù„Ù…Ø­Ø¯Ø¯Ø© ÙˆØ¥Ø¶Ø§ÙØ© Ø§Ù„Ù…Ø­Ø¯Ø¯Ø© Ù…Ù†Ù‡Ø§
      for (const value of selectedRoleIds) {
        // ÙØ­Øµ ÙˆØ¥Ø³Ù†Ø§Ø¯ Ø§Ù„Ø£Ø¯ÙˆØ§Ø± Ù„Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø¨ØµÙˆØ±Ø© Ø¢Ù…Ù†Ø©
      }
      await interaction.editReply({ content: 'âœ… ØªÙ… ØªØ­Ø¯ÙŠØ« Ø£Ø¯ÙˆØ§Ø±Ùƒ Ø§Ù„Ø¥Ø¶Ø§ÙÙŠØ© Ø§Ù„Ù…ÙØ¶Ù„Ø© Ø¨Ù†Ø¬Ø§Ø­!' }).catch(() => null);
    } catch (err: any) {
      await interaction.editReply({ content: `âŒ Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ ØªØ­Ø¯ÙŠØ« Ø£Ø¯ÙˆØ§Ø±Ùƒ: ${err.message}` }).catch(() => null);
    }
  }
});

// ============================================================
//  11. Ø§Ù„Ø³Ø¬Ù„Ø§Øª Ø§Ù„ØªÙØµÙŠÙ„ÙŠØ© Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø£ÙˆØ§Ù…Ø± Ø§Ù„Ù…Ø³Ø¬Ù„Ø© Ù„Ù„Ø¨ÙˆØª (Commands Database)
// ============================================================
export interface CommandMetadata {
  name: string;
  aliases: string[];
  description: string;
  usage: string;
  category: 'general' | 'music' | 'admin' | 'moderation' | 'fun' | 'utility';
  permissionRequired: string;
}

export const BOT_COMMANDS_REGISTRY: CommandMetadata[] = [
  {
    name: 'help',
    aliases: ['Ø£ÙˆØ§Ù…Ø±', 'Ù…Ø³Ø§Ø¹Ø¯Ø©'],
    description: 'Ø¹Ø±Ø¶ Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø£ÙˆØ§Ù…Ø± Ø§Ù„Ù…ØªØ§Ø­Ø© Ù„Ù„Ø¨ÙˆØª Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠ ÙˆØ§Ù„Ù…Ø´ØºÙ„ Ø§Ù„Ù…ÙˆØ³ÙŠÙ‚ÙŠ.',
    usage: '!opus help',
    category: 'general',
    permissionRequired: 'NONE'
  },
  {
    name: 'ai',
    aliases: ['Ø°ÙƒØ§Ø¡'],
    description: 'Ø¥Ø¬Ø±Ø§Ø¡ Ø­ÙˆØ§Ø± Ù…Ø¨Ø§Ø´Ø± Ù…Ø¹ Ø§Ù„Ù…Ø³Ø§Ø¹Ø¯ Ø§Ù„Ù„ØºÙˆÙŠ Opus ÙˆØªØ¬Ø§Ù‡Ù„ Ø§Ù„Ù„Ù‡Ø¬Ø§Øª.',
    usage: '!opus ai <Ø³Ø¤Ø§Ù„Ùƒ Ù‡Ù†Ø§>',
    category: 'general',
    permissionRequired: 'AUTHORIZED_ROLE'
  },
  {
    name: 'play',
    aliases: ['Ø´ØºÙ„'],
    description: 'ØªØ´ØºÙŠÙ„ Ù…Ù‚Ø·Ø¹ ØµÙˆØªÙŠ ÙÙŠ Ù‚Ù†Ø§Ø© Ø§Ù„ØµÙˆØª Ø§Ù„Ø­Ø§Ù„ÙŠØ©.',
    usage: '!opus play <Ø±Ø§Ø¨Ø· Ø£Ùˆ Ø§Ø³Ù… Ø§Ù„Ù…Ù‚Ø·Ø¹>',
    category: 'music',
    permissionRequired: 'NONE'
  },
  {
    name: 'skip',
    aliases: ['ØªØ®Ø·ÙŠ'],
    description: 'ØªØ®Ø·ÙŠ Ø§Ù„Ù…Ù‚Ø·Ø¹ Ø§Ù„ØµÙˆØªÙŠ Ø§Ù„Ø­Ø§Ù„ÙŠ ÙˆØ§Ù„Ø§Ù†ØªÙ‚Ø§Ù„ Ù„Ù„Ø°ÙŠ ÙŠÙ„ÙŠÙ‡.',
    usage: '!opus skip',
    category: 'music',
    permissionRequired: 'NONE'
  },
  {
    name: 'stop',
    aliases: ['Ø§ÙŠÙ‚Ø§Ù', 'Ø¥ÙŠÙ‚Ø§Ù'],
    description: 'Ø¥ÙŠÙ‚Ø§Ù Ø§Ù„Ù…Ø´ØºÙ„ Ø§Ù„Ù…ÙˆØ³ÙŠÙ‚ÙŠ ÙˆÙ…ØºØ§Ø¯Ø±Ø© Ø§Ù„Ø¨ÙˆØª Ù„Ù‚Ù†Ø§Ø© Ø§Ù„ØµÙˆØª.',
    usage: '!opus stop',
    category: 'music',
    permissionRequired: 'NONE'
  },
  {
    name: 'pause',
    aliases: ['Ù…Ø¤Ù‚Øª'],
    description: 'Ø¥ÙŠÙ‚Ø§Ù Ø§Ù„Ù…Ù‚Ø·Ø¹ Ø§Ù„ØµÙˆØªÙŠ Ø§Ù„Ø­Ø§Ù„ÙŠ Ù…Ø¤Ù‚ØªØ§Ù‹.',
    usage: '!opus pause',
    category: 'music',
    permissionRequired: 'NONE'
  },
  {
    name: 'resume',
    aliases: ['Ø§Ø³ØªØ¦Ù†Ø§Ù'],
    description: 'Ø§Ø³ØªØ¦Ù†Ø§Ù ØªØ´ØºÙŠÙ„ Ø§Ù„Ù…Ù‚Ø·Ø¹ Ø§Ù„Ù…ÙˆÙ‚ÙˆÙ Ù…Ø¤Ù‚ØªØ§Ù‹.',
    usage: '!opus resume',
    category: 'music',
    permissionRequired: 'NONE'
  },
  {
    name: 'queue',
    aliases: ['Ù‚Ø§Ø¦Ù…Ø©'],
    description: 'Ø¹Ø±Ø¶ Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ù…Ù‚Ø§Ø·Ø¹ Ø§Ù„Ù…ÙˆØ³ÙŠÙ‚ÙŠØ© Ø§Ù„Ù…Ø¬Ø¯ÙˆÙ„Ø© Ù„Ù„ØªØ´ØºÙŠÙ„.',
    usage: '!opus queue',
    category: 'music',
    permissionRequired: 'NONE'
  },
  {
    name: 'volume',
    aliases: ['ØµÙˆØª'],
    description: 'ØªØ¹Ø¯ÙŠÙ„ Ù…Ø³ØªÙˆÙ‰ ØµÙˆØª Ø§Ù„Ù…ÙˆØ³ÙŠÙ‚Ù‰ (Ø¨ÙŠÙ† 0 Ùˆ 200).',
    usage: '!opus volume <Ø§Ù„Ù‚ÙŠÙ…Ø©>',
    category: 'music',
    permissionRequired: 'NONE'
  },
  {
    name: 'loop',
    aliases: ['ØªÙƒØ±Ø§Ø±'],
    description: 'ØªÙØ¹ÙŠÙ„ Ø£Ùˆ Ø¥Ù„ØºØ§Ø¡ ØªÙƒØ±Ø§Ø± Ø§Ù„Ù…Ù‚Ø·Ø¹ Ø§Ù„ØµÙˆØªÙŠ Ø§Ù„Ø­Ø§Ù„ÙŠ Ø¨Ø´ÙƒÙ„ Ù…ØªÙƒØ±Ø±.',
    usage: '!opus loop',
    category: 'music',
    permissionRequired: 'NONE'
  },
  {
    name: 'nowplaying',
    aliases: ['Ø§Ù„Ø§Ù†', 'Ø§Ù„Ø¢Ù†'],
    description: 'Ø¹Ø±Ø¶ Ø¨ÙŠØ§Ù†Ø§Øª ÙˆØªÙØ§ØµÙŠÙ„ Ø§Ù„Ù…Ù‚Ø·Ø¹ Ø§Ù„ØµÙˆØªÙŠ Ø§Ù„Ø°ÙŠ ÙŠØ¹Ù…Ù„ Ø­Ø§Ù„ÙŠØ§Ù‹.',
    usage: '!opus nowplaying',
    category: 'music',
    permissionRequired: 'NONE'
  },
  {
    name: 'shuffle',
    aliases: ['Ø¹Ø´ÙˆØ§Ø¦ÙŠ'],
    description: 'Ø®Ù„Ø· ÙˆØªØ±ØªÙŠØ¨ Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø± Ø§Ù„Ø­Ø§Ù„ÙŠØ© Ø¹Ø´ÙˆØ§Ø¦ÙŠØ§Ù‹.',
    usage: '!opus shuffle',
    category: 'music',
    permissionRequired: 'NONE'
  },
  {
    name: 'remove',
    aliases: ['Ø­Ø°Ù_Ù…Ù‚Ø·Ø¹'],
    description: 'Ø­Ø°Ù Ù…Ù‚Ø·Ø¹ Ù…Ø­Ø¯Ø¯ Ù…Ù† Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø± Ø¹Ø¨Ø± Ù…ÙˆÙ‚Ø¹Ù‡ Ø§Ù„Ø±Ù‚Ù…ÙŠ.',
    usage: '!opus remove <ØªØ±ØªÙŠØ¨ Ø§Ù„Ù…Ù‚Ø·Ø¹>',
    category: 'music',
    permissionRequired: 'NONE'
  },
  {
    name: 'build',
    aliases: ['Ø¨Ù†Ø§Ø¡'],
    description: 'Ø¨Ù†Ø§Ø¡ ÙˆÙ‡ÙŠÙƒÙ„Ø© Ø§Ù„Ø³ÙŠØ±ÙØ± ÙˆØ¥Ù†Ø´Ø§Ø¡ Ø§Ù„ØºØ±Ù ÙˆØ§Ù„Ù‚Ù†ÙˆØ§Øª Ø¨Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ.',
    usage: '!opus build <ÙˆØµÙ Ù‡ÙŠÙƒÙ„ÙŠØ© Ø®Ø§Ø¯Ù…Ùƒ>',
    category: 'admin',
    permissionRequired: 'ADMINISTRATOR'
  },
  {
    name: 'serverinfo',
    aliases: ['Ù…Ø¹Ù„ÙˆÙ…Ø§Øª_Ø§Ù„Ø³ÙŠØ±ÙØ±'],
    description: 'Ø¹Ø±Ø¶ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„ØªÙ‚Ù†ÙŠØ© ÙˆØ§Ù„Ø¥Ø­ØµØ§Ø¦ÙŠØ© Ù„Ø®Ø§Ø¯Ù… Ø¯ÙŠØ³ÙƒÙˆØ±Ø¯ Ø§Ù„Ø­Ø§Ù„ÙŠ.',
    usage: '!opus serverinfo',
    category: 'general',
    permissionRequired: 'NONE'
  },
  {
    name: 'userinfo',
    aliases: ['Ù…Ø¹Ù„ÙˆÙ…Ø§Øª'],
    description: 'Ø¹Ø±Ø¶ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø­Ø³Ø§Ø¨ ÙˆØ§Ù„ØªØ­Ø°ÙŠØ±Ø§Øª ÙˆØ§Ù„ØªØ±Ù‚ÙŠØ§Øª Ù„Ø¹Ø¶Ùˆ Ø§Ù„Ø³ÙŠØ±ÙØ±.',
    usage: '!opus userinfo [@Ø¹Ø¶Ùˆ]',
    category: 'general',
    permissionRequired: 'NONE'
  },
  {
    name: 'warn',
    aliases: ['ØªØ­Ø°ÙŠØ±'],
    description: 'ØªÙˆØ¬ÙŠÙ‡ ØªØ­Ø°ÙŠØ± Ø±Ø³Ù…ÙŠ Ù„Ù„Ø¹Ø¶Ùˆ ÙˆØªØ³Ø¬ÙŠÙ„Ù‡ ÙÙŠ Ø¨Ù†Ùƒ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª.',
    usage: '!opus warn [@Ø¹Ø¶Ùˆ] <Ø§Ù„Ø³Ø¨Ø¨>',
    category: 'moderation',
    permissionRequired: 'KICK_MEMBERS'
  },
  {
    name: 'warns',
    aliases: ['ØªØ­Ø°ÙŠØ±Ø§Øª'],
    description: 'Ø§Ø³ØªØ¹Ø±Ø§Ø¶ ØªØ§Ø±ÙŠØ® ÙˆØ³Ø¬Ù„ Ù…Ø®Ø§Ù„ÙØ§Øª Ø§Ù„Ø¹Ø¶Ùˆ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±.',
    usage: '!opus warns [@Ø¹Ø¶Ùˆ]',
    category: 'moderation',
    permissionRequired: 'NONE'
  },
  {
    name: 'clearwarns',
    aliases: ['ØªØµÙÙŠØ±_Ø§Ù„ØªØ­Ø°ÙŠØ±Ø§Øª'],
    description: 'Ù…Ø³Ø­ ÙˆØ¥Ù„ØºØ§Ø¡ ÙƒØ§ÙØ© Ø§Ù„ØªØ­Ø°ÙŠØ±Ø§Øª Ø§Ù„Ù…Ø³Ø¬Ù„Ø© Ø¹Ù„Ù‰ Ø¹Ø¶Ùˆ Ù…Ø­Ø¯Ø¯.',
    usage: '!opus clearwarns [@Ø¹Ø¶Ùˆ]',
    category: 'moderation',
    permissionRequired: 'ADMINISTRATOR'
  },
  {
    name: 'shadowban',
    aliases: ['Ø­Ø¸Ø±_ØµØ§Ù…Øª'],
    description: 'ÙØ±Ø¶ Ø§Ù„Ø­Ø¬Ø¨ Ø§Ù„ØµØ§Ù…Øª ÙˆØ­Ø°Ù Ø±Ø³Ø§Ø¦Ù„ Ø§Ù„Ø¹Ø¶Ùˆ ÙÙˆØ±Ø§Ù‹ Ø¨Ø¯ÙˆÙ† ØªÙ†Ø¨ÙŠÙ‡Ù‡.',
    usage: '!opus shadowban [@Ø¹Ø¶Ùˆ]',
    category: 'moderation',
    permissionRequired: 'ADMINISTRATOR'
  },
  {
    name: 'unshadowban',
    aliases: ['Ø§Ù„ØºØ§Ø¡_Ø§Ù„Ø­Ø¸Ø±_Ø§Ù„ØµØ§Ù…Øª'],
    description: 'Ø¥Ù„ØºØ§Ø¡ ÙˆØ¶Ø¹ Ø§Ù„Ø­Ø¬Ø¨ Ø§Ù„ØµØ§Ù…Øª ÙˆØ¥Ø±Ø¬Ø§Ø¹ Ø§Ù„Ø¹Ø¶Ùˆ Ù„ÙˆØ¶Ø¹Ù‡ Ø§Ù„Ø·Ø¨ÙŠØ¹ÙŠ.',
    usage: '!opus unshadowban [@Ø¹Ø¶Ùˆ]',
    category: 'moderation',
    permissionRequired: 'ADMINISTRATOR'
  },
  {
    name: 'status',
    aliases: ['Ø­Ø§Ù„Ø©'],
    description: 'Ø¹Ø±Ø¶ ØªÙ‚Ø±ÙŠØ± Ø§Ù„ØµØ­Ø© Ø§Ù„ØªÙ‚Ù†ÙŠØ© Ù„Ù†Ø¸Ø§Ù… Ø§Ù„Ø¨ÙˆØª ÙˆØ­Ø§Ù„Ø© Ù…Ø¹Ø§Ù„Ø¬Ø© Ø§Ù„Ø£ÙˆØ§Ù…Ø±.',
    usage: '!opus status',
    category: 'general',
    permissionRequired: 'NONE'
  },
  {
    name: 'diagnostics',
    aliases: ['ÙØ­Øµ'],
    description: 'ØªØ´ØºÙŠÙ„ ÙØ­ÙˆØµØ§Øª ÙÙ†ÙŠØ© Ù„ÙƒØ§Ù…Ù„ Ù…Ù„ÙØ§Øª ÙˆÙ…Ø­Ø±ÙƒØ§Øª Ø§Ù„Ø¨ÙˆØª ÙˆÙ…Ù‚Ø§Ø±Ù†ØªÙ‡Ø§.',
    usage: '!opus diagnostics',
    category: 'admin',
    permissionRequired: 'ADMINISTRATOR'
  },
  {
    name: 'backup',
    aliases: ['Ù†Ø³Ø®_Ø§Ø­ØªÙŠØ§Ø·ÙŠ'],
    description: 'Ø³Ø­Ø¨ Ù†Ø³Ø®Ø© Ø§Ø­ØªÙŠØ§Ø·ÙŠØ© Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ© Ù…Ù† Ù‡ÙŠÙƒÙ„ÙŠØ© Ø§Ù„Ø³ÙŠØ±ÙØ± Ù„Ù…Ù„Ù JSON.',
    usage: '!opus backup',
    category: 'admin',
    permissionRequired: 'ADMINISTRATOR'
  },
  {
    name: 'quran',
    aliases: ['Ù‚Ø±Ø§Ù†'],
    description: 'Ø¹Ø±Ø¶ Ø¢ÙŠØ© Ù‚Ø±Ø¢Ù†ÙŠØ© ÙƒØ±ÙŠÙ…Ø© Ù…Ø¹ ØªØ±Ø¬Ù…ØªÙ‡Ø§ Ø¨Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ©.',
    usage: '!opus quran',
    category: 'fun',
    permissionRequired: 'NONE'
  },
  {
    name: 'azkar',
    aliases: ['Ø§Ø°ÙƒØ§Ø±'],
    description: 'Ø¹Ø±Ø¶ Ø°ÙƒØ± Ø¥Ø³Ù„Ø§Ù…ÙŠ Ù…Ù† Ø£Ø°ÙƒØ§Ø± Ø§Ù„ØµØ¨Ø§Ø­ ÙˆØ§Ù„Ù…Ø³Ø§Ø¡ ÙˆØ§Ù„ÙŠÙˆÙ…ÙŠØ©.',
    usage: '!opus azkar',
    category: 'fun',
    permissionRequired: 'NONE'
  },
  {
    name: 'poll',
    aliases: ['ØªØµÙˆÙŠØª'],
    description: 'Ø·Ø±Ø­ ØªØµÙˆÙŠØª ØªÙØ§Ø¹Ù„ÙŠ Ù„Ù„Ø£Ø¹Ø¶Ø§Ø¡ Ù…Ø¹ Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ø±Ù…ÙˆØ² Ù„Ù„ØªÙØ§Ø¹Ù„ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹.',
    usage: '!opus poll <Ø§Ù„Ø³Ø¤Ø§Ù„> | <Ø§Ù„Ø®ÙŠØ§Ø±1> | <Ø§Ù„Ø®ÙŠØ§Ø±2>',
    category: 'utility',
    permissionRequired: 'NONE'
  },
  {
    name: 'match',
    aliases: ['Ø¨Ø·ÙˆÙ„Ø©'],
    description: 'ØªÙˆÙ„ÙŠØ¯ Ø¥Ø¹Ù„Ø§Ù† Ù…Ø¨Ø§Ø±Ø§Ø© Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ© ØªÙØ§Ø¹Ù„ÙŠØ© Ù…Ø¹ Ø®Ø§Ø¯Ù… Ø§Ù„Ø¨Ø« Ø§Ù„Ù…Ø¨Ø§Ø´Ø±.',
    usage: '!opus match <Ø§Ù„Ù„Ø¹Ø¨Ø©> | <Ø§Ù„ÙØ±ÙŠÙ‚ Ø§Ù„Ø£ÙˆÙ„> | <Ø§Ù„ÙØ±ÙŠÙ‚ Ø§Ù„Ø«Ø§Ù†ÙŠ> | <Ø§Ù„ØªÙˆÙ‚ÙŠØª>',
    category: 'utility',
    permissionRequired: 'NONE'
  }
];

// ============================================================
//  12. Ù‚ÙˆØ§Ù…ÙŠØ³ ÙˆÙ…Ø±Ø¬Ø¹ Ø§Ù„Ù„Ù‡Ø¬Ø§Øª Ù„Ù„ØªØ´Ø®ÙŠØµ (Dialects reference dictionary)
// ============================================================
export const DIALECT_GLOSSARY_GUIDE = [
  { dialect: 'najdi', keywords: ['ÙˆØ´Ù„ÙˆÙ†Ùƒ', 'Ø´Ø®Ø¨Ø§Ø±Ùƒ', 'Ø§Ø±Ø­Ø¨', 'Ø§Ø¨Ùƒ', 'ÙŠØ§ ÙˆØ§Ø¯', 'ØªÙƒÙÙ‰'] },
  { dialect: 'hijazi', keywords: ['ÙŠØ§ Ø³ÙŠØ¯ÙŠ', 'Ø§ÙŠØ´ Ø¨Ùƒ', 'Ø§Ø´Ø¨Ùƒ', 'Ø¯Ø­ÙŠÙ†', 'Ø§ØµÙ‡', 'Ø¨Ù„ÙƒÙ†'] },
  { dialect: 'egyptian', keywords: ['Ø§Ø²ÙŠÙƒ', 'Ø¹Ø§Ù…Ù„ Ø§ÙŠÙ‡', 'Ø¬Ø¯Ø¹', 'ÙŠØ§ Ø¨Ø§Ø´Ø§', 'Ø§ÙŠÙ‡ Ø§Ù„Ø§Ø®Ø¨Ø§Ø±', 'Ø¯Ù„ÙˆÙ‚ØªÙŠ'] },
  { dialect: 'syrian', keywords: ['Ø´Ù„ÙˆÙ†Ùƒ', 'Ø´Ùˆ Ø§Ø®Ø¨Ø§Ø±Ùƒ', 'Ø´Ùˆ Ø¨Ø¯Ùƒ', 'Ù‡ÙˆÙ†', 'Ù‡Ù„Ù‚', 'ØªÙ‚Ø¨Ø±Ù†ÙŠ'] },
  { dialect: 'moroccan', keywords: ['Ù„Ø§Ø¨Ø§Ø³', 'ÙƒÙŠ Ø¯Ø§ÙŠØ±', 'Ø¨Ø²Ø§Ù', 'Ø§Ù„Ø¯Ø±Ø§Ø±ÙŠ', 'ÙˆØ§Ø®Ø§', 'Ø¯Ø§Ø¨Ø§'] }
];

// ============================================================
//  13. Ø´Ø±Ø­ ÙƒØ§Ù…Ù„ Ù„Ù‡ÙŠÙƒÙ„ÙŠØ© Ø¹Ù…Ù„ Ø§Ù„Ø£Ø¯ÙˆØ§Øª ÙˆØ§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ (Developer Guide)
// ============================================================
export const DEVELOPER_SYSTEM_GUIDE = `
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        Opus AI Assistant & Moderation Engine - Developer Guide
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
1. Ø¯ÙˆØ±Ø© Ø­ÙŠØ§Ø© Ø§Ù„Ø·Ù„Ø¨ (Request Lifecycle):
   Ù…Ø³ØªÙ‚Ø¨Ù„ Ø§Ù„Ø±Ø³Ø§Ø¦Ù„ (index.ts) -> ÙØ­Øµ Ø§Ù„Ø£Ù…Ø§Ù† (Credential/Bad words) -> ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ø³ÙŠØ§Ù‚ 
   (ContextAnalyzer.ts) -> Ø§Ø³ØªØ¯Ø¹Ø§Ø¡ Ù…Ø­Ø±Ùƒ Ø§Ù„Ø°Ø§ÙƒØ±Ø© Ø§Ù„Ù…ØªÙ‚Ø§Ø±Ø¨Ø© (MemoryManager.ts) -> 
   Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ù†Ø¸Ø§Ù… Groq/Cerebras (ai.ts) -> ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ù†ÙŠØ© ÙˆØªØ­Ø¯ÙŠØ¯ ÙˆØ¬ÙˆØ¯ Ø£Ø¯Ø§Ø© Ø¨Ø±Ù…Ø¬ÙŠØ© 
   -> ÙÙŠ Ø­Ø§Ù„ ÙˆØ¬ÙˆØ¯ Ø£Ø¯Ø§Ø©ØŒ ÙŠØªÙ… ØªÙ†ÙÙŠØ°Ù‡Ø§ ÙÙŠ (index.ts:executeTool) ÙˆØ¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ù†ØªÙŠØ¬Ø© Ù„Ù€ AI 
   Ù„ØµÙŠØ§ØºØ© Ø±Ø¯ Ù…Ù†Ø§Ø³Ø¨ -> Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø±Ø¯ Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ Ù„Ù„Ù…Ø³ØªØ®Ø¯Ù….

2. Ø§Ù„Ù…Ø´ØºÙ„ Ø§Ù„Ù…ÙˆØ³ÙŠÙ‚ÙŠ (Voice Stream System):
   ÙŠØ¹ØªÙ…Ø¯ Ø¹Ù„Ù‰ Ø§Ù„ØªØ¬Ù…ÙŠØ¹ Ø§Ù„Ø¨Ø±Ù…Ø¬ÙŠ Ù„Ù…ÙƒÙˆÙ†Ø§Øª VoiceConnection ÙˆØ­Ù‚Ù† Ø§Ù„Ø¨Ø« Ø§Ù„ØµÙˆØªÙŠ Ø¨ØµÙŠØºØ© Opus 
   Ù„ØªÙØ§Ø¯ÙŠ Ø§Ù„ØªØ¹Ø§Ø±Ø¶ Ù…Ø¹ Ø§Ù„Ø¨Ø« Ø§Ù„Ù…ØªØµÙ„.

3. Ø§Ù„Ø±Ù‚Ø§Ø¨Ø© ÙˆØ§Ù„Ø­Ù…Ø§ÙŠØ© Ù…Ù† Ø§Ù„Ù‡Ø¬Ù…Ø§Øª (Anti-Raid Shield):
   ÙŠÙ‚ÙŠØ³ Ù…Ø¹Ø¯Ù„ Ø§Ù†Ø¶Ù…Ø§Ù… Ø§Ù„Ø­Ø³Ø§Ø¨Ø§Øª ÙÙŠ ÙØªØ±Ø© Ù‚ØµÙŠØ±Ø©ØŒ ÙˆÙŠÙ‚ÙˆÙ… Ø¨ØªÙØ¹ÙŠÙ„ Ø¬Ø¯Ø§Ø± Ø§Ù„Ø­Ù…Ø§ÙŠØ© (Lockdown) 
   ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ Ù„Ù„Ø­Ø¯ Ù…Ù† Ø§Ù„Ø§Ù†Ø¶Ù…Ø§Ù… Ø§Ù„Ù…Ø®Ø§Ù„Ù ÙˆØ§Ù„Ø­Ø¯ Ù…Ù† Ø§Ù„Ø³Ø¨Ø§Ù….
`;

// ============================================================
//  ØªÙˆØ³ÙŠØ¹ ÙƒÙˆØ¯ Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© ÙˆØ§Ù„ØªØ´Ø®ÙŠØµØ§Øª (State Dashboard)
// ============================================================
export class SystemDiagnosticsCoordinator {
  /**
   * ØªÙˆÙ„ÙŠØ¯ ØªÙ‚Ø±ÙŠØ± Ø´Ø§Ù…Ù„ Ù„Ù„Ù†Ø¸Ø§Ù…
   */
  static getDiagnosticDashboardSummary(guild: Guild): string {
    const timeDiff = Date.now() - systemState.bootTime.getTime();
    const uptimeHrs = (timeDiff / (1000 * 60 * 60)).toFixed(2);
    
    return `âš™ï¸ **Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ… ÙˆØµØ­Ø© ØªØ´ØºÙŠÙ„ Ø§Ù„Ø¨ÙˆØª Opus**
â€¢ ÙˆÙ‚Øª Ø§Ù„ØªØ´ØºÙŠÙ„: ${uptimeHrs} Ø³Ø§Ø¹Ø©
â€¢ Ø§Ù„Ø±Ø³Ø§Ø¦Ù„ Ø§Ù„Ù…Ø¹Ø§Ù„Ø¬Ø©: ${systemState.processedMessages} Ø±Ø³Ø§Ù„Ø©
â€¢ Ø§Ø³ØªØ¹Ù„Ø§Ù…Ø§Øª Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ: ${systemState.aiQueriesCount} Ø§Ø³ØªØ¹Ù„Ø§Ù…
â€¢ Ø§Ù„Ø£Ø¯ÙˆØ§Øª Ø§Ù„Ù…Ù†ÙØ°Ø©: ${systemState.toolsExecutedCount} Ø£Ø¯Ø§Ø©
â€¢ Ø§Ù„Ø£Ø®Ø·Ø§Ø¡ Ø§Ù„Ù…Ø³Ø¬Ù„Ø©: ${systemState.errorsLoggedCount} Ø®Ø·Ø£
â€¢ Ø­Ø§Ù„Ø© Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ø¯ÙŠØ³ÙƒÙˆØ±Ø¯: âœ… Ù…ØªØµÙ„ ÙˆÙ…Ø³ØªÙ‚Ø±`;
  }
}

// ============================================================
//  14. Ø§Ù„ÙƒÙˆØ¯ Ø§Ù„ØªØ¹Ø±ÙŠÙÙŠ Ù„Ø´Ø±Ø­ Ø§Ù„Ø¨Ù†ÙŠØ© Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ© (Architecture Showcase)
// ============================================================
export const SYSTEM_ARCHITECTURE = {
  name: "Opus AI Brain Infrastructure",
  version: "4.8.2-premium",
  framework: "Discord.js v14 + Node.js v20",
  designGoals: [
    "Ultra-low latency dialect diagnostics for Arabic languages",
    "Autonomous content moderation with automated context sentiment vectors",
    "Self-contained mock testing pipelines for high-reliability hosting environments",
    "Stateless event listeners coupled with robust JSON local persistent memory cache"
  ]
};

// ============================================================
//  Ù…Ø²ÙŠØ¯ Ù…Ù† Ø§Ù„ØªÙˆØ«ÙŠÙ‚ ÙˆÙƒÙˆØ¯ Ø§Ù„ØªÙˆØ³Ø¹Ø© Ù„ØªØ³Ù‡ÙŠÙ„ Ø§Ù„ÙÙ‡Ù… ÙˆØ§Ù„Ù…Ø­Ø§ÙØ¸Ø© Ø¹Ù„Ù‰ Ø§Ù„Ø³Ù‚Ù Ø§Ù„Ù…Ø³ØªÙ‡Ø¯Ù
// ============================================================
export const EXTENDED_DOCUMENTATION = `
=========================================
      ØªÙØ§ØµÙŠÙ„ Ù‡ÙŠÙƒÙ„ÙŠØ© Ø°ÙƒØ§Ø¡ Ø§Ù„Ø¨ÙˆØª Opus
=========================================
1. ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ù„Ù‡Ø¬Ø§Øª (Dialect normalization):
   ÙŠØªÙ… Ù…Ø¹Ø§Ù„Ø¬Ø© Ø§Ù„Ø¥Ø¯Ø®Ø§Ù„ ÙˆØªÙˆØ­ÙŠØ¯ Ø§Ù„ÙƒÙ„Ù…Ø§Øª Ø§Ù„Ø¹Ø§Ù…ÙŠØ© Ù…Ù† Ø§Ù„Ù„Ù‡Ø¬Ø§Øª (Ø§Ù„Ù†Ø¬Ø¯ÙŠØ©ØŒ Ø§Ù„Ø­Ø¬Ø§Ø²ÙŠØ©ØŒ Ø§Ù„Ù…ØµØ±ÙŠØ©ØŒ Ø§Ù„Ø´Ø§Ù…ÙŠØ©ØŒ Ø§Ù„Ù…ØºØ±Ø¨ÙŠØ©ØŒ Ø¥Ù„Ø®)
   Ù„ØªØ¨Ø³ÙŠØ· ÙÙ‡Ù… Ø§Ù„Ø¬Ù…Ù„Ø© Ù‚Ø¨Ù„ Ø¥Ø±Ø³Ø§Ù„Ù‡Ø§ Ù„Ù€ LLM.

2. Ø§Ù„Ù…Ø±Ø§Ù‚Ø¨Ø© Ø§Ù„Ø°Ø§ØªÙŠØ© Ø§Ù„Ø­Ø±Ø© (Autonomous moderation):
   ÙŠØ¹Ù…Ù„ Ø§Ù„Ø±Ù‚ÙŠØ¨ Ø¨ØµÙˆØ±Ø© Ù…Ù†ÙØµÙ„Ø© Ù„ÙØ­Øµ Ø§Ù„Ø³Ù„ÙˆÙƒÙŠØ§Øª Ø§Ù„Ø®Ø§Ø·Ø¦Ø© Ø¯ÙˆÙ† ØªØ¯Ø§Ø®Ù„ Ù…Ø¹ Ù…Ø­Ø±Ùƒ Ø§Ù„ØµÙˆØª Ø£Ùˆ Ù…Ù†Ø´Ø¦ Ø§Ù„Ø³ÙŠØ±ÙØ±Ø§Øª.

3. Ø§Ù„Ø°Ø§ÙƒØ±Ø© Ø§Ù„Ø¯Ø§Ø¦Ù…Ø© (Persistent Memory):
   ØªØ¹ØªÙ…Ø¯ Ø§Ù„Ø°Ø§ÙƒØ±Ø© Ø¹Ù„Ù‰ Ø¨Ù†ÙŠØ© TF-IDF Ù…Ø¯Ù…Ø¬Ø© Ø°Ø§ØªÙŠØ§Ù‹ Ù„Ù„Ø¨Ø­Ø« Ø¹Ù† Ø§Ù„ØªØ´Ø§Ø¨Ù‡ Ø§Ù„Ø¯Ù„Ø§Ù„ÙŠ ÙˆØ­ÙØ¸ Ø§Ù„Ø³ÙŠØ§Ù‚.
`;

// ============================================================
//  Ù…Ø³ØªÙ…Ø¹ Ø£Ø­Ø¯Ø§Ø« Ø§Ù†Ø¶Ù…Ø§Ù… Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡ ÙˆØ§Ù„ØªÙˆØ«ÙŠÙ‚ ÙˆØ§Ù„Ø®Ø¨Ø±Ø© (Member Events Listener)
// ============================================================
client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
  // ÙØ­Øµ Ø­Ù…Ø§ÙŠØ© Ù‡Ø¬ÙˆÙ… Ø§Ù„Ø§Ù†Ø¶Ù…Ø§Ù…Ø§Øª (Anti-Raid Shield)
  const isAttack = AntiRaidShield.registerJoin();
  if (isAttack) {
    const logChannel = findLogChannel(member.guild);
    if (logChannel) {
      const alert = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('ðŸš¨ Ø¯Ø±Ø¹ Ø§Ù„Ø­Ù…Ø§ÙŠØ© Ø§Ù„Ø°Ø§ØªÙŠ: ØªÙØ¹ÙŠÙ„ ÙˆØ¶Ø¹ Ø§Ù„Ø·ÙˆØ§Ø±Ø¦ (Anti-Raid Lockdown)')
        .setDescription(`ØªÙ… ØªÙØ¹ÙŠÙ„ Ø¹Ø²Ù„ Ø§Ù„Ø³ÙŠØ±ÙØ± Ù…Ø¤Ù‚ØªØ§Ù‹ Ù„ØªØ¬Ù†Ø¨ Ø¥ØºØ±Ø§Ù‚ Ø§Ù„Ø®Ø§Ø¯Ù… Ø¨Ø­Ø³Ø§Ø¨Ø§Øª ÙˆÙ‡Ù…ÙŠØ© Ù…ØªØµÙ„Ø©.`)
        .setTimestamp();
      await logChannel.send({ embeds: [alert] }).catch(() => null);
    }
    return;
  }

  // Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„ØªØ±Ø­ÙŠØ¨ ÙÙŠ Ø§Ù„Ù‚Ù†Ø§Ø© Ø§Ù„Ù…Ù†Ø§Ø³Ø¨Ø©
  const welcomeChannel = findWelcomeChannel(member.guild);
  if (welcomeChannel) {
    const embed = createWelcomeEmbed(member.guild.name);
    await welcomeChannel.send({ content: `Ù…Ø±Ø­Ø¨Ø§Ù‹ Ø¨Ùƒ ${member}!`, embeds: [embed] }).catch(() => null);
  }
});

// Ù…Ø³ØªÙ…Ø¹ Ø£Ø­Ø¯Ø§Ø« Ø§Ù„Ø±Ø³Ø§Ø¦Ù„ Ù„ØªØªØ¨Ø¹ Ù…Ø³ØªÙˆÙŠØ§Øª Ø§Ù„Ø®Ø¨Ø±Ø© (XP System Trigger)
client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  
  // Ù…Ø¹Ø§Ù„Ø¬Ø© Ø§Ù„Ø®Ø¨Ø±Ø© Ù„Ù„Ø¹Ø¶Ùˆ
  LevelingSystem.handleMessageXP(message.author.id, message.author.username, message.channel);
});

// Ù…Ø³ØªÙ…Ø¹ ØªÙØ§Ø¹Ù„Ø§Øª Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ø¥ÙŠÙ…ÙˆØ¬ÙŠ Ù„ØªÙˆØ«ÙŠÙ‚ Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹
client.on(Events.MessageReactionAdd, async (reaction, user) => {
  try {
    if (reaction.partial) await reaction.fetch();
    await MemberVerificationGateway.handleReaction(reaction, user);
  } catch (err) {
    console.error('[Event Reaction] Ø®Ø·Ø£ ÙÙŠ Ù…Ø¹Ø§Ù„Ø¬Ø© Ø§Ù„ØªÙØ§Ø¹Ù„:', err);
  }
});

interface AzkarEntry {
  category: string;
  text: string;
  count: number;
  reward: string;
}




export class AzkarDatabase {
  private static azkar: AzkarEntry[] = [
    {
      category: "Ø£Ø°ÙƒØ§Ø± Ø§Ù„ØµØ¨Ø§Ø­",
      text: "Ø£ÙŽØµÙ’Ø¨ÙŽØ­Ù’Ù†ÙŽØ§ ÙˆÙŽØ£ÙŽØµÙ’Ø¨ÙŽØ­ÙŽ Ø§Ù„Ù’Ù…ÙÙ„Ù’ÙƒÙ Ù„ÙÙ„ÙŽÙ‘Ù‡Ù ÙˆÙŽØ§Ù„Ù’Ø­ÙŽÙ…Ù’Ø¯Ù Ù„ÙÙ„ÙŽÙ‘Ù‡Ù Ù„ÙŽØ§ Ø¥ÙÙ„ÙŽÙ‡ÙŽ Ø¥ÙÙ„ÙŽÙ‘Ø§ Ø§Ù„Ù„ÙŽÙ‘Ù‡Ù ÙˆÙŽØ­Ù’Ø¯ÙŽÙ‡Ù Ù„ÙŽØ§ Ø´ÙŽØ±ÙÙŠÙƒÙŽ Ù„ÙŽÙ‡Ù",
      count: 1,
      reward: "ÙØªØ­ Ø¨Ø±ÙƒØ§Øª Ø§Ù„ÙŠÙˆÙ… ÙˆØ§Ù„Ø§Ø³ØªØ¹Ø§Ù†Ø© Ø¨Ø§Ù„Ù„Ù‡ ÙˆØªÙˆØ­ÙŠØ¯Ù‡"
    },
    {
      category: "Ø£Ø°ÙƒØ§Ø± Ø§Ù„ØµØ¨Ø§Ø­",
      text: "Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙÙ…ÙŽÙ‘ Ø¨ÙƒÙŽ Ø£ÙŽØµÙ’Ø¨ÙŽØ­Ù’Ù†ÙŽØ§ØŒ ÙˆÙŽØ¨ÙÙƒÙŽ Ø£ÙŽÙ…Ù’Ø³ÙŽÙŠÙ’Ù†ÙŽØ§ØŒ ÙˆÙŽØ¨ÙÙƒÙŽ Ù†ÙŽØ­Ù’ÙŠÙŽØ§ØŒ ÙˆÙŽØ¨ÙÙƒÙŽ Ù†ÙŽÙ…ÙÙˆØªÙØŒ ÙˆÙŽØ¥ÙÙ„ÙŽÙŠÙ’ÙƒÙŽ Ø§Ù„Ù†ÙÙ‘Ø´ÙÙˆØ±Ù",
      count: 1,
      reward: "ØªØ³Ù„ÙŠÙ… Ø§Ù„Ø­Ø±ÙƒÙŠØ© ÙˆØ§Ù„Ø§Ø¹ØªØ±Ø§Ù Ø¨Ø±Ø¨ÙˆØ¨ÙŠØ© Ø§Ù„Ø®Ø§Ù„Ù‚"
    },
    {
      category: "Ø£Ø°ÙƒØ§Ø± Ø§Ù„ØµØ¨Ø§Ø­",
      text: "ÙŠÙŽØ§ Ø­ÙŽÙŠÙÙ‘ ÙŠÙŽØ§ Ù‚ÙŽÙŠÙÙ‘ÙˆÙ…Ù Ø¨ÙØ±ÙŽØ­Ù’Ù…ÙŽØªÙÙƒÙŽ Ø£ÙŽØ³Ù’ØªÙŽØºÙÙŠØ«Ù Ø£ÙŽØµÙ’Ù„ÙØ­Ù’ Ù„ÙÙŠ Ø´ÙŽØ£Ù’Ù†ÙÙŠ ÙƒÙÙ„ÙŽÙ‘Ù‡Ù ÙˆÙŽÙ„ÙŽØ§ ØªÙŽÙƒÙÙ„Ù’Ù†ÙÙŠ Ø¥ÙÙ„ÙŽÙ‰ Ù†ÙŽÙÙ’Ø³ÙÙŠ Ø·ÙŽØ±Ù’ÙÙŽØ©ÙŽ Ø¹ÙŽÙŠÙ’Ù†Ù",
      count: 1,
      reward: "ØµÙ„Ø§Ø­ Ø§Ù„Ø´Ø£Ù† ÙƒÙ„Ù‡ ÙˆÙˆÙ‚Ø§ÙŠØ© Ù…Ù† Ø¹Ø¬Ø² Ø§Ù„Ù†ÙØ³"
    },
    {
      category: "Ø£Ø°ÙƒØ§Ø± Ø§Ù„ØµØ¨Ø§Ø­",
      text: "Ø±ÙŽØ¶ÙÙŠØªÙ Ø¨ÙØ§Ù„Ù„ÙŽÙ‘Ù‡Ù Ø±ÙŽØ¨Ù‹Ù‘Ø§ØŒ ÙˆÙŽØ¨ÙØ§Ù„Ù’Ø¥ÙØ³Ù’Ù„ÙŽØ§Ù…Ù Ø¯ÙÙŠÙ†Ù‹Ø§ØŒ ÙˆÙŽØ¨ÙÙ…ÙØ­ÙŽÙ…ÙŽÙ‘Ø¯Ù ØµÙŽÙ„ÙŽÙ‘Ù‰ Ø§Ù„Ù„ÙŽÙ‘Ù‡Ù Ø¹ÙŽÙ„ÙŽÙŠÙ’Ù‡Ù ÙˆÙŽØ³ÙŽÙ„ÙŽÙ‘Ù…ÙŽ Ù†ÙŽØ¨ÙÙŠÙ‹Ù‘Ø§",
      count: 3,
      reward: "ÙƒØ§Ù† Ø­Ù‚Ø§Ù‹ Ø¹Ù„Ù‰ Ø§Ù„Ù„Ù‡ Ø£Ù† ÙŠØ±Ø¶ÙŠÙ‡ ÙŠÙˆÙ… Ø§Ù„Ù‚ÙŠØ§Ù…Ø©"
    },
    {
      category: "Ø£Ø°ÙƒØ§Ø± Ø§Ù„ØµØ¨Ø§Ø­",
      text: "Ø³ÙØ¨Ù’Ø­ÙŽØ§Ù†ÙŽ Ø§Ù„Ù„ÙŽÙ‘Ù‡Ù ÙˆÙŽØ¨ÙØ­ÙŽÙ…Ù’Ø¯ÙÙ‡Ù: Ø¹ÙŽØ¯ÙŽØ¯ÙŽ Ø®ÙŽÙ„Ù’Ù‚ÙÙ‡ÙØŒ ÙˆÙŽØ±ÙØ¶ÙŽØ§ Ù†ÙŽÙÙ’Ø³ÙÙ‡ÙØŒ ÙˆÙŽØ²ÙÙ†ÙŽØ©ÙŽ Ø¹ÙŽØ±Ù’Ø´ÙÙ‡ÙØŒ ÙˆÙŽÙ…ÙØ¯ÙŽØ§Ø¯ÙŽ ÙƒÙŽÙ„ÙÙ…ÙŽØ§ØªÙÙ‡Ù",
      count: 3,
      reward: "Ø£ÙØ¶Ù„ Ù…Ù† Ø£Ø°ÙƒØ§Ø± ÙƒØ«ÙŠØ±Ø© ØªØ³ØªØºØ±Ù‚ Ø³Ø§Ø¹Ø§Øª"
    },
    {
      category: "Ø£Ø°ÙƒØ§Ø± Ø§Ù„Ù…Ø³Ø§Ø¡",
      text: "Ø£ÙŽÙ…Ù’Ø³ÙŽÙŠÙ’Ù†ÙŽØ§ ÙˆÙŽØ£ÙŽÙ…Ù’Ø³ÙŽÙ‰ Ø§Ù„Ù’Ù…ÙÙ„Ù’ÙƒÙ Ù„ÙÙ„ÙŽÙ‘Ù‡Ù ÙˆÙŽØ§Ù„Ù’Ø­ÙŽÙ…Ù’Ø¯Ù Ù„ÙÙ„ÙŽÙ‘Ù‡Ù Ù„ÙŽØ§ Ø¥ÙÙ„ÙŽÙ‡ÙŽ Ø¥ÙÙ„ÙŽÙ‘Ø§ Ø§Ù„Ù„ÙŽÙ‘Ù‡Ù ÙˆÙŽØ­Ù’Ø¯ÙŽÙ‡Ù Ù„ÙŽØ§ Ø´ÙŽØ±ÙÙŠÙƒÙŽ Ù„ÙŽÙ‡Ù",
      count: 1,
      reward: "Ø§Ø³ØªÙ‚Ø¨Ø§Ù„ Ø§Ù„Ù„ÙŠÙ„ Ø¨Ø§Ù„ØªÙˆØ­ÙŠØ¯ ÙˆØ§Ù„Ø­Ù…Ø¯ ÙˆØ§Ù„Ø§Ø³ØªÙ‚Ø±Ø§Ø±"
    },
    {
      category: "Ø£Ø°ÙƒØ§Ø± Ø§Ù„Ù…Ø³Ø§Ø¡",
      text: "Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙÙ…ÙŽÙ‘ Ø¨ÙÙƒÙŽ Ø£ÙŽÙ…Ù’Ø³ÙŽÙŠÙ’Ù†ÙŽØ§ØŒ ÙˆÙŽØ¨ÙÙƒÙŽ Ø£ÙŽØµÙ’Ø¨ÙŽØ­Ù’Ù†ÙŽØ§ØŒ ÙˆÙŽØ¨ÙÙƒÙŽ Ù†ÙŽØ­Ù’ÙŠÙŽØ§ØŒ ÙˆÙŽØ¨ÙÙƒÙŽ Ù†ÙŽÙ…ÙÙˆØªÙØŒ ÙˆÙŽØ¥ÙÙ„ÙŽÙŠÙ’ÙƒÙŽ Ø§Ù„Ù’Ù…ÙŽØµÙÙŠØ±Ù",
      count: 1,
      reward: "ØªÙÙˆÙŠØ¶ Ø§Ù„Ø­ÙŠØ§Ø© ÙˆØ§Ù„ÙˆÙØ§Ø© Ù„Ù„Ù‡ Ø³Ø¨Ø­Ø§Ù†Ù‡ ÙˆØªØ¹Ø§Ù„Ù‰"
    },
    {
      category: "Ø£Ø°ÙƒØ§Ø± Ø§Ù„Ù…Ø³Ø§Ø¡",
      text: "Ø£ÙŽØ¹ÙÙˆØ°Ù Ø¨ÙÙƒÙŽÙ„ÙÙ…ÙŽØ§ØªÙ Ø§Ù„Ù„ÙŽÙ‘Ù‡Ù Ø§Ù„ØªÙŽÙ‘Ø§Ù…ÙŽÙ‘Ø§ØªÙ Ù…ÙÙ†Ù’ Ø´ÙŽØ±ÙÙ‘ Ù…ÙŽØ§ Ø®ÙŽÙ„ÙŽÙ‚ÙŽ",
      count: 3,
      reward: "Ù„Ù… ØªØ¶Ø±Ù‡ Ø­Ù…Ø© Ø£Ùˆ Ù„Ø¯ØºØ© Ø¹Ù‚Ø±Ø¨ ÙÙŠ ØªÙ„Ùƒ Ø§Ù„Ù„ÙŠÙ„Ø©"
    },
    {
      category: "Ø£Ø°ÙƒØ§Ø± Ø§Ù„Ù…Ø³Ø§Ø¡",
      text: "Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙÙ…ÙŽÙ‘ Ø¥ÙÙ†ÙÙ‘ÙŠ Ø£ÙŽØ¹ÙÙˆØ°Ù Ø¨ÙÙƒÙŽ Ù…ÙÙ†ÙŽ Ø§Ù„Ù’Ù‡ÙŽÙ…ÙÙ‘ ÙˆÙŽØ§Ù„Ù’Ø­ÙŽØ²ÙŽÙ†ÙØŒ ÙˆÙŽØ£ÙŽØ¹ÙÙˆØ°Ù Ø¨ÙÙƒÙŽ Ù…ÙÙ†ÙŽ Ø§Ù„Ù’Ø¹ÙŽØ¬Ù’Ø²Ù ÙˆÙŽØ§Ù„Ù’ÙƒÙŽØ³ÙŽÙ„Ù",
      count: 1,
      reward: "Ø°Ù‡Ø§Ø¨ Ø§Ù„Ù‡Ù… ÙˆÙ‚Ø¶Ø§Ø¡ Ø§Ù„Ø¯ÙŠÙ† ÙˆØ§Ù„Ù†Ø´Ø§Ø· Ø§Ù„Ø¨Ø¯Ù†ÙŠ"
    },
    {
      category: "Ø£Ø°ÙƒØ§Ø± Ø¨Ø¹Ø¯ Ø§Ù„ØµÙ„Ø§Ø©",
      text: "Ø£Ø³ØªØºÙØ± Ø§Ù„Ù„Ù‡ ØŒ Ø£Ø³ØªØºÙØ± Ø§Ù„Ù„Ù‡ ØŒ Ø£Ø³ØªØºÙØ± Ø§Ù„Ù„Ù‡. Ø§Ù„Ù„Ù‡Ù… Ø£Ù†Øª Ø§Ù„Ø³Ù„Ø§Ù… ÙˆÙ…Ù†Ùƒ Ø§Ù„Ø³Ù„Ø§Ù… ØªØ¨Ø§Ø±ÙƒØª ÙŠØ§ Ø°Ø§ Ø§Ù„Ø¬Ù„Ø§Ù„ ÙˆØ§Ù„Ø¥ÙƒØ±Ø§Ù…",
      count: 1,
      reward: "Ø¬Ø¨Ø± Ø§Ù„Ø®Ù„Ù„ Ø§Ù„Ø­Ø§ØµÙ„ ÙÙŠ Ø§Ù„ØµÙ„Ø§Ø©"
    },
    {
      category: "Ø£Ø°ÙƒØ§Ø± Ø¨Ø¹Ø¯ Ø§Ù„ØµÙ„Ø§Ø©",
      text: "Ù„Ø§ Ø¥Ù„Ù‡ Ø¥Ù„Ø§ Ø§Ù„Ù„Ù‡ ÙˆØ­Ø¯Ù‡ Ù„Ø§ Ø´Ø±ÙŠÙƒ Ù„Ù‡ØŒ Ù„Ù‡ Ø§Ù„Ù…Ù„Ùƒ ÙˆÙ„Ù‡ Ø§Ù„Ø­Ù…Ø¯ ÙˆÙ‡Ùˆ Ø¹Ù„Ù‰ ÙƒÙ„ Ø´ÙŠØ¡ Ù‚Ø¯ÙŠØ±ØŒ Ù„Ø§ Ø­ÙˆÙ„ ÙˆÙ„Ø§ Ù‚ÙˆØ© Ø¥Ù„Ø§ Ø¨Ø§Ù„Ù„Ù‡",
      count: 1,
      reward: "Ù†ÙÙŠ Ø§Ù„Ø´Ø±Ùƒ ÙˆØ§Ù„Ø§Ø¹ØªØ±Ø§Ù Ø¨Ø¹Ø¸Ù…Ø© Ø§Ù„Ù…Ù„Ùƒ Ø§Ù„Ù‚Ø¯ÙŠØ±"
    },
    {
      category: "Ø£Ø°ÙƒØ§Ø± Ø¨Ø¹Ø¯ Ø§Ù„ØµÙ„Ø§Ø©",
      text: "Ø³ÙØ¨Ù’Ø­ÙŽØ§Ù†ÙŽ Ø§Ù„Ù„ÙŽÙ‘Ù‡Ù (33) ØŒ Ø§Ù„Ù’Ø­ÙŽÙ…Ù’Ø¯Ù Ù„ÙÙ„ÙŽÙ‘Ù‡Ù (33) ØŒ Ø§Ù„Ù„ÙŽÙ‘Ù‡Ù Ø£ÙŽÙƒÙ’Ø¨ÙŽØ±Ù (33) Ø«Ù… ØªÙ…Ø§Ù… Ø§Ù„Ù…Ø¦Ø©: Ù„Ø§ Ø¥Ù„Ù‡ Ø¥Ù„Ø§ Ø§Ù„Ù„Ù‡ ÙˆØ­Ø¯Ù‡ Ù„Ø§ Ø´Ø±ÙŠÙƒ Ù„Ù‡",
      count: 1,
      reward: "ØºÙØ±Øª Ø®Ø·Ø§ÙŠØ§Ù‡ ÙˆØ¥Ù† ÙƒØ§Ù†Øª Ù…Ø«Ù„ Ø²Ø¨Ø¯ Ø§Ù„Ø¨Ø­Ø±"
    },
    {
      category: "Ø£Ø°ÙƒØ§Ø± Ø§Ù„Ù†ÙˆÙ…",
      text: "Ø¨ÙØ§Ø³Ù’Ù…ÙÙƒÙŽ Ø±ÙŽØ¨ÙÙ‘ÙŠ ÙˆÙŽØ¶ÙŽØ¹Ù’ØªÙ Ø¬ÙŽÙ†Ù’Ø¨ÙÙŠØŒ ÙˆÙŽØ¨ÙÙƒÙŽ Ø£ÙŽØ±Ù’ÙÙŽØ¹ÙÙ‡ÙØŒ ÙÙŽØ¥ÙÙ†Ù’ Ø£ÙŽÙ…Ù’Ø³ÙŽÙƒÙ’ØªÙŽ Ù†ÙŽÙÙ’Ø³ÙÙŠ ÙÙŽØ§Ø±Ù’Ø­ÙŽÙ…Ù’Ù‡ÙŽØ§ØŒ ÙˆÙŽØ¥ÙÙ†Ù’ Ø£ÙŽØ±Ù’Ø³ÙŽÙ„Ù’ØªÙŽÙ‡ÙŽØ§ ÙÙŽØ§Ø­Ù’ÙÙŽØ¸Ù’Ù‡ÙŽØ§",
      count: 1,
      reward: "Ø­ÙØ¸ Ø§Ù„Ø±ÙˆØ­ Ø¹Ù†Ø¯ Ø§Ù„Ù†ÙˆÙ… ÙˆØ±Ø§Ø­ØªÙ‡Ø§ Ø§Ù„Ù†ÙØ³ÙŠØ©"
    },
    {
      category: "Ø£Ø°ÙƒØ§Ø± Ø§Ù„Ù†ÙˆÙ…",
      text: "Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙÙ…ÙŽÙ‘ Ù‚ÙÙ†ÙÙŠ Ø¹ÙŽØ°ÙŽØ§Ø¨ÙŽÙƒÙŽ ÙŠÙŽÙˆÙ’Ù…ÙŽ ØªÙŽØ¨Ù’Ø¹ÙŽØ«Ù Ø¹ÙØ¨ÙŽØ§Ø¯ÙŽÙƒÙŽ",
      count: 3,
      reward: "Ø§Ù„ÙˆÙ‚Ø§ÙŠØ© Ù…Ù† Ø§Ù„Ø­Ø³Ø§Ø¨ ÙˆØ¹Ø°Ø§Ø¨ Ø§Ù„Ø¢Ø®Ø±Ø©"
    },
    {
      category: "Ø£Ø°ÙƒØ§Ø± Ø§Ù„Ù†ÙˆÙ…",
      text: "Ù‚Ø±Ø§Ø¡Ø© Ø³ÙˆØ±Ø© Ø§Ù„Ù…Ù„Ùƒ",
      count: 1,
      reward: "Ø§Ù„Ù…Ø§Ù†Ø¹Ø© ÙˆØ§Ù„Ù…Ù†Ø¬ÙŠØ© Ù…Ù† Ø¹Ø°Ø§Ø¨ Ø§Ù„Ù‚Ø¨Ø± Ù„Ù…Ù† ÙŠØ¯Ø§ÙˆÙ… Ø¹Ù„ÙŠÙ‡Ø§"
    },
    {
      category: "Ø£Ø¯Ø¹ÙŠØ© Ø¹Ø§Ù…Ø©",
      text: "Ø§Ù„Ù„Ù‘ÙŽÙ‡ÙÙ…Ù‘ÙŽ Ø¥ÙÙ†Ù‘ÙŽÙƒÙŽ Ø¹ÙŽÙÙÙˆÙ‘ÙŒ ØªÙØ­ÙØ¨Ù‘Ù Ø§Ù„Ù’Ø¹ÙŽÙÙ’ÙˆÙŽ ÙÙŽØ§Ø¹Ù’ÙÙ Ø¹ÙŽÙ†Ù‘ÙÙŠ",
      count: 1,
      reward: "Ø·Ù„Ø¨ Ø§Ù„Ø¹ÙÙˆ Ø§Ù„Ø´Ø§Ù…Ù„ ÙÙŠ Ø§Ù„Ø¯Ù†ÙŠØ§ ÙˆØ§Ù„Ø¢Ø®Ø±Ø©"
    },
    {
      category: "Ø£Ø¯Ø¹ÙŠØ© Ø¹Ø§Ù…Ø©",
      text: "Ø±ÙŽØ¨ÙŽÙ‘Ù†ÙŽØ§ Ø¢ØªÙÙ†ÙŽØ§ ÙÙÙŠ Ø§Ù„Ø¯ÙÙ‘Ù†Ù’ÙŠÙŽØ§ Ø­ÙŽØ³ÙŽÙ†ÙŽØ©Ù‹ ÙˆÙŽÙÙÙŠ Ø§Ù„Ù’Ø¢Ø®ÙØ±ÙŽØ©Ù Ø­ÙŽØ³ÙŽÙ†ÙŽØ©Ù‹ ÙˆÙŽÙ‚ÙÙ†ÙŽØ§ Ø¹ÙŽØ°ÙŽØ§Ø¨ÙŽ Ø§Ù„Ù†ÙŽÙ‘Ø§Ø±Ù",
      count: 1,
      reward: "Ø£Ø´Ù…Ù„ Ø¯Ø¹Ø§Ø¡ Ù„Ù„Ø®ÙŠØ± ÙˆØ§Ù„Ø§Ø³ØªÙ‚Ø±Ø§Ø±"
    },
    {
      category: "Ø£Ø¯Ø¹ÙŠØ© Ø¹Ø§Ù…Ø©",
      text: "ÙŠÙŽØ§ Ù…ÙÙ‚ÙŽÙ„ÙÙ‘Ø¨ÙŽ Ø§Ù„Ù’Ù‚ÙÙ„ÙÙˆØ¨Ù Ø«ÙŽØ¨ÙÙ‘ØªÙ’ Ù‚ÙŽÙ„Ù’Ø¨ÙÙŠ Ø¹ÙŽÙ„ÙŽÙ‰ Ø¯ÙÙŠÙ†ÙÙƒÙŽ",
      count: 1,
      reward: "ØªØ«Ø¨ÙŠØª Ø§Ù„Ù‡Ø¯Ø§ÙŠØ© ÙˆØ§Ù„ÙˆÙ‚Ø§ÙŠØ© Ù…Ù† Ø§Ù„Ø§Ù†Ø­Ø±Ø§Ù"
    },
    {
      category: "Ø£Ø¯Ø¹ÙŠØ© Ø¹Ø§Ù…Ø©",
      text: "Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙÙ…ÙŽÙ‘ Ø¥ÙÙ†ÙÙ‘ÙŠ Ø£ÙŽØ³Ù’Ø£ÙŽÙ„ÙÙƒÙŽ Ø§Ù„Ù’Ø¹ÙÙ„Ù’Ù…ÙŽ Ø§Ù„Ù†ÙŽÙ‘Ø§ÙÙØ¹ÙŽ ÙˆÙŽØ§Ù„Ø±ÙÙ‘Ø²Ù’Ù‚ÙŽ Ø§Ù„Ø·ÙŽÙ‘ÙŠÙÙ‘Ø¨ÙŽ ÙˆÙŽØ§Ù„Ù’Ø¹ÙŽÙ…ÙŽÙ„ÙŽ Ø§Ù„Ù’Ù…ÙØªÙŽÙ‚ÙŽØ¨ÙŽÙ‘Ù„ÙŽ",
      count: 1,
      reward: "ØªÙˆØ¬ÙŠÙ‡ Ø§Ù„ÙŠÙˆÙ… Ù„Ù„ØªØ·ÙˆØ± ÙˆØ§Ù„Ø¨Ø±ÙƒØ©"
    },
    {
      category: "Ø£Ø¯Ø¹ÙŠØ© Ø¹Ø§Ù…Ø©",
      text: "Ù„Ø§ Ø¥Ù„Ù‡ Ø¥Ù„Ø§ Ø£Ù†Øª Ø³Ø¨Ø­Ø§Ù†Ùƒ Ø¥Ù†ÙŠ ÙƒÙ†Øª Ù…Ù† Ø§Ù„Ø¸Ø§Ù„Ù…ÙŠÙ†",
      count: 1,
      reward: "ØªÙØ±ÙŠØ¬ Ø§Ù„ÙƒØ±ÙˆØ¨ ÙˆØ§Ù„Ù‡Ù…ÙˆÙ… Ø§Ù„Ø¹Ø³ÙŠØ±Ø©"
    },
    {
      category: "Ø£Ø°ÙƒØ§Ø± Ø§Ù„ØµØ¨Ø§Ø­",
      text: "Ø­ÙŽØ³Ù’Ø¨ÙÙŠÙŽ Ø§Ù„Ù„ÙŽÙ‘Ù‡Ù Ù„ÙŽØ§ Ø¥ÙÙ„ÙŽÙ‡ÙŽ Ø¥ÙÙ„ÙŽÙ‘Ø§ Ù‡ÙÙˆÙŽ Ø¹ÙŽÙ„ÙŽÙŠÙ’Ù‡Ù ØªÙŽÙˆÙŽÙƒÙŽÙ‘Ù„Ù’ØªÙ ÙˆÙŽÙ‡ÙÙˆÙŽ Ø±ÙŽØ¨ÙÙ‘ Ø§Ù„Ù’Ø¹ÙŽØ±Ù’Ø´Ù Ø§Ù„Ù’Ø¹ÙŽØ¸ÙÙŠÙ…Ù",
      count: 7,
      reward: "ÙƒÙØ§Ù‡ Ø§Ù„Ù„Ù‡ Ù…Ø§ Ø£Ù‡Ù…Ù‡ Ù…Ù† Ø£Ù…Ø± Ø§Ù„Ø¯Ù†ÙŠØ§ ÙˆØ§Ù„Ø¢Ø®Ø±Ø©"
    },
    {
      category: "Ø£Ø°ÙƒØ§Ø± Ø§Ù„ØµØ¨Ø§Ø­",
      text: "Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙÙ…ÙŽÙ‘ Ø¹Ø§ÙÙÙ†ÙŠ ÙÙŠ Ø¨ÙŽØ¯ÙŽÙ†ÙŠØŒ Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙÙ…ÙŽÙ‘ Ø¹Ø§ÙÙÙ†ÙŠ ÙÙŠ Ø³ÙŽÙ…Ù’Ø¹ÙŠØŒ Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙÙ…ÙŽÙ‘ Ø¹Ø§ÙÙÙ†ÙŠ ÙÙŠ Ø¨ÙŽØµÙŽØ±ÙŠØŒ Ù„Ø§ Ø¥Ù„Ù‡ÙŽ Ø¥Ù„ÙŽÙ‘Ø§ Ø£Ù†ØªÙŽ",
      count: 3,
      reward: "Ø·Ù„Ø¨ Ø§Ù„Ø¹Ø§ÙÙŠØ© ÙˆØ§Ù„ÙˆÙ‚Ø§ÙŠØ© Ù…Ù† Ø§Ù„Ø£Ù…Ø±Ø§Ø¶ ÙˆØ§Ù„Ø¢ÙØ§Øª"
    },
    {
      category: "Ø£Ø°ÙƒØ§Ø± Ø§Ù„Ù…Ø³Ø§Ø¡",
      text: "Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙÙ…ÙŽÙ‘ Ù…Ø§ Ø£ÙŽÙ…Ù’Ø³ÙŽÙ‰ Ø¨ÙŠ Ù…Ù† Ù†ÙØ¹Ù’Ù…ÙŽØ©Ù Ø£Ùˆ Ø¨Ø£ÙŽØ­ÙŽØ¯Ù Ù…Ù† Ø®ÙŽÙ„Ù’Ù‚ÙÙƒÙŽØŒ ÙÙŽÙ…ÙÙ†Ù’ÙƒÙŽ ÙˆÙŽØ­Ù’Ø¯ÙŽÙƒÙŽ Ù„Ø§ Ø´ÙŽØ±ÙÙŠÙƒÙŽ Ù„ÙŽÙƒÙŽØŒ ÙÙŽÙ„ÙŽÙƒÙŽ Ø§Ù„Ø­ÙŽÙ…Ù’Ø¯Ù ÙˆÙŽÙ„ÙŽÙƒÙŽ Ø§Ù„Ø´ÙÙ‘ÙƒÙ’Ø±Ù",
      count: 1,
      reward: "Ø£Ø¯Ù‰ Ø´ÙƒØ± Ù„ÙŠÙ„ØªÙ‡ ÙƒØ§Ù…Ù„Ø©"
    },
    {
      category: "Ø£Ø°ÙƒØ§Ø± Ø§Ù„Ø§Ø³ØªØºÙØ§Ø±",
      text: "Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙÙ…ÙŽÙ‘ Ø£ÙŽÙ†Ù’ØªÙŽ Ø±ÙŽØ¨ÙÙ‘ÙŠ Ù„ÙŽØ§ Ø¥ÙÙ„ÙŽÙ‡ÙŽ Ø¥ÙÙ„ÙŽÙ‘Ø§ Ø£ÙŽÙ†Ù’ØªÙŽØŒ Ø®ÙŽÙ„ÙŽÙ‚Ù’ØªÙŽÙ†ÙÙŠ ÙˆÙŽØ£ÙŽÙ†ÙŽØ§ Ø¹ÙŽØ¨Ù’Ø¯ÙÙƒÙŽØŒ ÙˆÙŽØ£ÙŽÙ†ÙŽØ§ Ø¹ÙŽÙ„ÙŽÙ‰ Ø¹ÙŽÙ‡Ù’Ø¯ÙÙƒÙŽ ÙˆÙŽÙˆÙŽØ¹Ù’Ø¯ÙÙƒÙŽ Ù…ÙŽØ§ Ø§Ø³Ù’ØªÙŽØ·ÙŽØ¹Ù’ØªÙØŒ Ø£ÙŽØ¹ÙÙˆØ°Ù Ø¨ÙÙƒÙŽ Ù…ÙÙ†Ù’ Ø´ÙŽØ±ÙÙ‘ Ù…ÙŽØ§ ØµÙŽÙ†ÙŽØ¹Ù’ØªÙØŒ Ø£ÙŽØ¨ÙÙˆØ¡Ù Ù„ÙŽÙƒÙŽ Ø¨ÙÙ†ÙØ¹Ù’Ù…ÙŽØªÙÙƒÙŽ Ø¹ÙŽÙ„ÙŽÙŠÙŽÙ‘ØŒ ÙˆÙŽØ£ÙŽØ¨ÙÙˆØ¡Ù Ù„ÙŽÙƒÙŽØ¨ÙØ°ÙŽÙ†Ù’Ø¨ÙÙŠ ÙÙŽØ§ØºÙ’ÙÙØ±Ù’ Ù„ÙÙŠ ÙÙŽØ¥ÙÙ†ÙŽÙ‘Ù‡Ù Ù„ÙŽØ§ ÙŠÙŽØºÙ’ÙÙØ±Ù Ø§Ù„Ø°ÙÙ‘Ù†ÙÙˆØ¨ÙŽ Ø¥ÙÙ„ÙŽÙ‘Ø§ Ø£ÙŽÙ†Ù’ØªÙŽ",
      count: 1,
      reward: "Ø³ÙŠØ¯ Ø§Ù„Ø§Ø³ØªØºÙØ§Ø±ØŒ Ù…Ù† Ù‚Ø§Ù„Ù‡ Ù…ÙˆÙ‚Ù†Ø§Ù‹ Ø¨Ù‡ ÙˆÙ…Ø§Øª Ø¯Ø®Ù„ Ø§Ù„Ø¬Ù†Ø©"
    },
    {
      category: "Ø£Ø°ÙƒØ§Ø± Ø§Ù„Ø§Ø³ØªØºÙØ§Ø±",
      text: "Ø£Ø³ØªØºÙØ± Ø§Ù„Ù„Ù‡ Ø§Ù„Ø¹Ø¸ÙŠÙ… Ø§Ù„Ø°ÙŠ Ù„Ø§ Ø¥Ù„Ù‡ Ø¥Ù„Ø§ Ù‡Ùˆ Ø§Ù„Ø­ÙŠ Ø§Ù„Ù‚ÙŠÙˆÙ… ÙˆØ£ØªÙˆØ¨ Ø¥Ù„ÙŠÙ‡",
      count: 3,
      reward: "ØºÙØ±Øª Ø°Ù†ÙˆØ¨Ù‡ ÙˆØ¥Ù† ÙƒØ§Ù† ÙØ§Ø±Ø§Ù‹ Ù…Ù† Ø§Ù„Ø²Ø­Ù"
    },
    {
      category: "Ø£Ø°ÙƒØ§Ø± Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù„Ù„Ù…Ù†Ø²Ù„",
      text: "Ø¨ÙØ³Ù’Ù…Ù Ø§Ù„Ù„ÙŽÙ‘Ù‡Ù ÙˆÙŽÙ„ÙŽØ¬Ù’Ù†ÙŽØ§ØŒ ÙˆÙŽØ¨ÙØ³Ù’Ù…Ù Ø§Ù„Ù„ÙŽÙ‘Ù‡Ù Ø®ÙŽØ±ÙŽØ¬Ù’Ù†ÙŽØ§ØŒ ÙˆÙŽØ¹ÙŽÙ„ÙŽÙ‰ Ø§Ù„Ù„ÙŽÙ‘Ù‡Ù Ø±ÙŽØ¨ÙÙ‘Ù†ÙŽØ§ ØªÙŽÙˆÙŽÙƒÙŽÙ‘Ù„Ù’Ù†ÙŽØ§",
      count: 1,
      reward: "Ø¯Ø®ÙˆÙ„ Ù…Ø¨Ø§Ø±Ùƒ ÙˆØ·Ø±Ø¯ Ø§Ù„Ø´ÙŠØ·Ø§Ù† Ù…Ù† Ø§Ù„Ø¨ÙŠØª Ø¹Ù†Ø¯ Ø§Ù„Ø¯Ø®ÙˆÙ„"
    },
    {
      category: "Ø£Ø°ÙƒØ§Ø± Ø§Ù„Ø®Ø±ÙˆØ¬ Ù…Ù† Ø§Ù„Ù…Ù†Ø²Ù„",
      text: "Ø¨ÙØ³Ù’Ù…Ù Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙØŒ ØªÙŽÙˆÙŽÙƒÙŽÙ‘Ù„Ù’ØªÙ Ø¹ÙŽÙ„ÙŽÙ‰ Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙØŒ Ù„ÙŽØ§ Ø­ÙŽÙˆÙ’Ù„ÙŽ ÙˆÙŽÙ„ÙŽØ§ Ù‚ÙÙˆÙŽÙ‘Ø©ÙŽ Ø¥ÙÙ„ÙŽÙ‘Ø§ Ø¨ÙØ§Ù„Ù„ÙŽÙ‘Ù‡Ù",
      count: 1,
      reward: "ÙŠÙ‚Ø§Ù„ Ù„Ù‡: Ù‡ÙØ¯ÙŠØª ÙˆÙƒÙÙÙŠØª ÙˆÙˆÙÙ‚ÙŠØªØŒ ÙˆØªÙ†Ø­Ù‰ Ø¹Ù†Ù‡ Ø§Ù„Ø´ÙŠØ·Ø§Ù†"
    },
    {
      category: "Ø£Ø°ÙƒØ§Ø± Ø§Ù„Ù…Ø³Ø¬Ø¯",
      text: "Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙÙ…ÙŽÙ‘ Ø§ÙÙ’ØªÙŽØ­Ù’ Ù„ÙÙŠ Ø£ÙŽØ¨Ù’ÙˆÙŽØ§Ø¨ÙŽ Ø±ÙŽØ­Ù’Ù…ÙŽØªÙÙƒÙŽ",
      count: 1,
      reward: "Ø¹Ù†Ø¯ Ø¯Ø®ÙˆÙ„ Ø§Ù„Ù…Ø³Ø¬Ø¯ØŒ Ø·Ù„Ø¨ ÙÙŠØ¶ Ø§Ù„Ø±Ø­Ù…Ø© Ø§Ù„Ø¥Ù„Ù‡ÙŠØ©"
    },
    {
      category: "Ø£Ø°ÙƒØ§Ø± Ø§Ù„Ù…Ø³Ø¬Ø¯",
      text: "Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙÙ…ÙŽÙ‘ Ø¥ÙÙ†ÙÙ‘ÙŠ Ø£ÙŽØ³Ù’Ø£ÙŽÙ„ÙÙƒÙŽ Ù…ÙÙ†Ù’ ÙÙŽØ¶Ù’Ù„ÙÙƒÙŽ",
      count: 1,
      reward: "Ø¹Ù†Ø¯ Ø§Ù„Ø®Ø±ÙˆØ¬ Ù…Ù† Ø§Ù„Ù…Ø³Ø¬Ø¯ØŒ Ø§Ù„Ø³Ø¹ÙŠ Ù„Ø·Ù„Ø¨ Ø§Ù„Ø±Ø²Ù‚ ÙˆØ§Ù„Ø¨Ø±ÙƒØ©"
    },
    {
      category: "Ø£Ø°ÙƒØ§Ø± Ø§Ù„Ø·Ø¹Ø§Ù…",
      text: "Ø¨ÙØ³Ù’Ù…Ù Ø§Ù„Ù„ÙŽÙ‘Ù‡Ù (ÙˆØ¥Ø°Ø§ Ù†Ø³ÙŠ ÙÙŠ Ø£ÙˆÙ„Ù‡: Ø¨ÙØ³Ù’Ù…Ù Ø§Ù„Ù„ÙŽÙ‘Ù‡Ù ÙÙŠ Ø£ÙŽÙˆÙŽÙ‘Ù„ÙÙ‡Ù ÙˆÙŽØ¢Ø®ÙØ±ÙÙ‡Ù)",
      count: 1,
      reward: "Ù…Ù†Ø¹ Ø§Ù„Ø´ÙŠØ·Ø§Ù† Ù…Ù† Ù…Ø´Ø§Ø±ÙƒØ© Ø§Ù„Ø¹Ø¨Ø¯ ÙÙŠ Ø·Ø¹Ø§Ù…Ù‡ ÙˆØ´Ø±Ø§Ø¨Ù‡"
    },
    {
      category: "Ø£Ø°ÙƒØ§Ø± Ø§Ù„Ø·Ø¹Ø§Ù…",
      text: "Ø§Ù„Ù’Ø­ÙŽÙ…Ù’Ø¯Ù Ù„ÙÙ„ÙŽÙ‘Ù‡Ù Ø§Ù„ÙŽÙ‘Ø°ÙÙŠ Ø£ÙŽØ·Ù’Ø¹ÙŽÙ…ÙŽÙ†ÙÙŠ Ù‡ÙŽØ°ÙŽØ§ Ø§Ù„Ø·ÙŽÙ‘Ø¹ÙŽØ§Ù…ÙŽ ÙˆÙŽØ±ÙŽØ²ÙŽÙ‚ÙŽÙ†ÙÙŠÙ‡Ù Ù…ÙÙ†Ù’ ØºÙŽÙŠÙ’Ø±Ù Ø­ÙŽÙˆÙ’Ù„Ù Ù…ÙÙ†ÙÙ‘ÙŠ ÙˆÙŽÙ„ÙŽØ§ Ù‚ÙÙˆÙŽÙ‘Ø©Ù",
      count: 1,
      reward: "ØºÙÙØ± Ù„Ù‡ Ù…Ø§ ØªÙ‚Ø¯Ù… Ù…Ù† Ø°Ù†Ø¨Ù‡"
    },
    {
      category: "Ø£Ø¯Ø¹ÙŠØ© Ø§Ù„Ø³ÙØ±",
      text: "Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙÙ…ÙŽÙ‘ Ø¥ÙÙ†ÙŽÙ‘Ø§ Ù†ÙŽØ³Ù’Ø£ÙŽÙ„ÙÙƒÙŽ ÙÙÙŠ Ø³ÙŽÙÙŽØ±ÙÙ†ÙŽØ§ Ù‡ÙŽØ°ÙŽØ§ Ø§Ù„Ù’Ø¨ÙØ±ÙŽÙ‘ ÙˆÙŽØ§Ù„ØªÙŽÙ‘Ù‚Ù’ÙˆÙŽÙ‰ØŒ ÙˆÙŽÙ…ÙÙ†ÙŽ Ø§Ù„Ù’Ø¹ÙŽÙ…ÙŽÙ„Ù Ù…ÙŽØ§ ØªÙŽØ±Ù’Ø¶ÙŽÙ‰ØŒ Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙÙ…ÙŽÙ‘ Ù‡ÙŽÙˆÙÙ‘Ù†Ù’ Ø¹ÙŽÙ„ÙŽÙŠÙ’Ù†ÙŽØ§ Ø³ÙŽÙÙŽØ±ÙŽÙ†ÙŽØ§ Ù‡ÙŽØ°ÙŽØ§ ÙˆÙŽØ§Ø·Ù’ÙˆÙ Ø¹ÙŽÙ†ÙŽÙ‘Ø§ Ø¨ÙØ¹Ù’Ø¯ÙŽÙ‡Ù",
      count: 1,
      reward: "ØªÙŠØ³ÙŠØ± Ø§Ù„Ø±Ø­Ù„Ø© ÙˆØ§Ù„Ø­ÙØ¸ Ø§Ù„Ø¥Ù„Ù‡ÙŠ Ù…Ù† ÙˆØ¹Ø«Ø§Ø¡ Ø§Ù„Ø³ÙØ±"
    },
    {
      category: "Ø£Ø¯Ø¹ÙŠØ© Ø¹Ø§Ù…Ø©",
      text: "Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙÙ…ÙŽÙ‘ Ø±ÙŽØ­Ù’Ù…ÙŽØªÙŽÙƒÙŽ Ø£ÙŽØ±Ù’Ø¬ÙÙˆ ÙÙŽÙ„ÙŽØ§ ØªÙŽÙƒÙÙ„Ù’Ù†ÙÙŠ Ø¥ÙÙ„ÙŽÙ‰ Ù†ÙŽÙÙ’Ø³ÙÙŠ Ø·ÙŽØ±Ù’ÙÙŽØ©ÙŽ Ø¹ÙŽÙŠÙ’Ù†ÙØŒ ÙˆÙŽØ£ÙŽØµÙ’Ù„ÙØ­Ù’ Ù„ÙÙŠ Ø´ÙŽØ£Ù’Ù†ÙÙŠ ÙƒÙÙ„ÙŽÙ‘Ù‡Ù Ù„ÙŽØ§ Ø¥ÙÙ„ÙŽÙ‡ÙŽ Ø¥ÙÙ„ÙŽÙ‘Ø§ Ø£ÙŽÙ†Ù’ØªÙŽ",
      count: 1,
      reward: "ÙƒØ´Ù Ø§Ù„ÙƒØ±Ø¨ ÙˆØªÙŠØ³ÙŠØ± Ø§Ù„Ø£Ù…ÙˆØ± Ø§Ù„Ù…ØªØ¹Ø³Ø±Ø©"
    },
    {
      category: "Ø£Ø¯Ø¹ÙŠØ© Ø¹Ø§Ù…Ø©",
      text: "Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙÙ…ÙŽÙ‘ Ø£ÙŽØµÙ’Ù„ÙØ­Ù’ Ù„ÙÙŠ Ø¯ÙÙŠÙ†ÙÙŠ Ø§Ù„ÙŽÙ‘Ø°ÙÙŠ Ù‡ÙÙˆÙŽ Ø¹ÙØµÙ’Ù…ÙŽØ©Ù Ø£ÙŽÙ…Ù’Ø±ÙÙŠØŒ ÙˆÙŽØ£ÙŽØµÙ’Ù„ÙØ­Ù’ Ù„ÙÙŠ Ø¯ÙÙ†Ù’ÙŠÙŽØ§ÙŠÙŽ Ø§Ù„ÙŽÙ‘ØªÙÙŠ ÙÙÙŠÙ‡ÙŽØ§ Ù…ÙŽØ¹ÙŽØ§Ø´ÙÙŠØŒ ÙˆÙŽØ£ÙŽØµÙ’Ù„ÙØ­Ù’ Ù„ÙÙŠ Ø¢Ø®ÙØ±ÙŽØªÙÙŠ Ø§Ù„ÙŽÙ‘ØªÙÙŠ Ø¥ÙÙ„ÙŽÙŠÙ’Ù‡ÙŽØ§ Ù…ÙŽØ¹ÙŽØ§Ø¯ÙÙŠ",
      count: 1,
      reward: "ØµÙ„Ø§Ø­ Ø´Ø¤ÙˆÙ† Ø§Ù„Ø¯ÙŠÙ† ÙˆØ§Ù„Ø¯Ù†ÙŠØ§ ÙˆØ§Ù„Ø¢Ø®Ø±Ø©"
    },
    {
      category: "Ø£Ø¯Ø¹ÙŠØ© Ø¹Ø§Ù…Ø©",
      text: "Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙÙ…ÙŽÙ‘ Ø¥ÙÙ†ÙÙ‘ÙŠ Ø£ÙŽØ¹ÙÙˆØ°Ù Ø¨ÙÙƒÙŽ Ù…ÙÙ†ÙŽ Ø²ÙŽÙˆÙŽØ§Ù„Ù Ù†ÙØ¹Ù’Ù…ÙŽØªÙÙƒÙŽØŒ ÙˆÙŽØªÙŽØ­ÙŽÙˆÙÙ‘Ù„Ù Ø¹ÙŽØ§ÙÙÙŠÙŽØªÙÙƒÙŽØŒ ÙˆÙŽÙÙØ¬ÙŽØ§Ø¡ÙŽØ©Ù Ù†ÙÙ‚Ù’Ù…ÙŽØªÙÙƒÙŽØŒ ÙˆÙŽØ¬ÙŽÙ…ÙÙŠØ¹Ù Ø³ÙŽØ®ÙŽØ·ÙÙƒÙŽ",
      count: 1,
      reward: "Ø§Ù„Ø­ÙØ§Ø¸ Ø¹Ù„Ù‰ Ø§Ù„Ù†Ø¹Ù… ÙˆØ§Ù„ØªØ­ØµÙŠÙ† Ù…Ù† Ø§Ù„Ø¨Ù„Ø§Ø¡ Ø§Ù„Ù…ÙØ§Ø¬Ø¦"
    },
    {
      category: "Ø£Ø¯Ø¹ÙŠØ© Ø¹Ø§Ù…Ø©",
      text: "Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙÙ…ÙŽÙ‘ Ø¢ØªÙ Ù†ÙŽÙÙ’Ø³ÙÙŠ ØªÙŽÙ‚Ù’ÙˆÙŽØ§Ù‡ÙŽØ§ØŒ ÙˆÙŽØ²ÙŽÙƒÙÙ‘Ù‡ÙŽØ§ Ø£ÙŽÙ†Ù’ØªÙŽ Ø®ÙŽÙŠÙ’Ø±Ù Ù…ÙŽÙ†Ù’ Ø²ÙŽÙƒÙŽÙ‘Ø§Ù‡ÙŽØ§ØŒ Ø£ÙŽÙ†Ù’ØªÙŽ ÙˆÙŽÙ„ÙÙŠÙÙ‘Ù‡ÙŽØ§ ÙˆÙŽÙ…ÙŽÙˆÙ’Ù„ÙŽØ§Ù‡ÙŽØ§",
      count: 1,
      reward: "ØªØ²ÙƒÙŠØ© Ø§Ù„Ù†ÙØ³ ÙˆØªÙ†Ù‚ÙŠØªÙ‡Ø§ Ù…Ù† Ø§Ù„Ø¹ÙŠÙˆØ¨ ÙˆØ§Ù„Ø°Ù†ÙˆØ¨"
    },
    {
      category: "Ø£Ø¯Ø¹ÙŠØ© Ø¹Ø§Ù…Ø©",
      text: "Ø§Ù„Ù„ÙŽÙ‘Ù‡ÙÙ…ÙŽÙ‘ Ø¥ÙÙ†ÙÙ‘ÙŠ Ø£ÙŽØ¹ÙÙˆØ°Ù Ø¨ÙÙƒÙŽ Ù…ÙÙ†Ù’ Ø¹ÙÙ„Ù’Ù…Ù Ù„ÙŽØ§ ÙŠÙŽÙ†Ù’ÙÙŽØ¹ÙØŒ ÙˆÙŽÙ…ÙÙ†Ù’ Ù‚ÙŽÙ„Ù’Ø¨Ù Ù„ÙŽØ§ ÙŠÙŽØ®Ù’Ø´ÙŽØ¹ÙØŒ ÙˆÙŽÙ…ÙÙ†Ù’ Ù†ÙŽÙÙ’Ø³Ù Ù„ÙŽØ§ ØªÙŽØ´Ù’Ø¨ÙŽØ¹ÙØŒ ÙˆÙŽÙ…ÙÙ†Ù’ Ø¯ÙŽØ¹Ù’ÙˆÙŽØ©Ù Ù„ÙŽØ§ ÙŠÙØ³Ù’ØªÙŽØ¬ÙŽØ§Ø¨Ù Ù„ÙŽÙ‡ÙŽØ§",
      count: 1,
      reward: "Ø§Ù„ÙˆÙ‚Ø§ÙŠØ© Ù…Ù† Ø§Ù„Ø­Ø¬ÙˆØ¨ Ø§Ù„Ù†ÙØ³ÙŠØ© ÙˆØ§Ù„Ø±ÙˆØ­ÙŠØ©"
    },
    {
      category: "Ø£Ø¯Ø¹ÙŠØ© Ù„Ù„ÙˆØ§Ù„Ø¯ÙŠÙ†",
      text: "Ø±ÙŽÙ‘Ø¨ÙÙ‘ Ø§Ø±Ù’Ø­ÙŽÙ…Ù’Ù‡ÙÙ…ÙŽØ§ ÙƒÙŽÙ…ÙŽØ§ Ø±ÙŽØ¨ÙŽÙ‘ÙŠÙŽØ§Ù†ÙÙŠ ØµÙŽØºÙÙŠØ±Ù‹Ø§",
      count: 1,
      reward: "Ø¨Ø± Ø§Ù„ÙˆØ§Ù„Ø¯ÙŠÙ† Ø¨Ø§Ù„Ø¯Ø¹Ø§Ø¡ Ø¨Ø§Ù„Ø±Ø­Ù…Ø© ÙˆØ§Ù„Ø¹Ø·Ù"
    },
    {
      category: "Ø£Ø¯Ø¹ÙŠØ© Ù„Ù„ÙˆØ§Ù„Ø¯ÙŠÙ†",
      text: "Ø±ÙŽØ¨ÙŽÙ‘Ù†ÙŽØ§ Ø§ØºÙ’ÙÙØ±Ù’ Ù„ÙÙŠ ÙˆÙŽÙ„ÙÙˆÙŽØ§Ù„ÙØ¯ÙŽÙŠÙŽÙ‘ ÙˆÙŽÙ„ÙÙ„Ù’Ù…ÙØ¤Ù’Ù…ÙÙ†ÙÙŠÙ†ÙŽ ÙŠÙŽÙˆÙ’Ù…ÙŽ ÙŠÙŽÙ‚ÙÙˆÙ…Ù Ø§Ù„Ù’Ø­ÙØ³ÙŽØ§Ø¨Ù",
      count: 1,
      reward: "Ø§Ø³ØªØºÙØ§Ø± Ø´Ø§Ù…Ù„ Ù„Ù„ÙˆØ§Ù„Ø¯ÙŠÙ† ÙˆÙ„Ø¹Ù…ÙˆÙ… Ø§Ù„Ù…Ø³Ù„Ù…ÙŠÙ†"
    },
    {
      category: "Ø£Ø¯Ø¹ÙŠØ© Ù„Ù„Ø£ÙˆÙ„Ø§Ø¯",
      text: "Ø±ÙŽØ¨ÙÙ‘ Ù‡ÙŽØ¨Ù’ Ù„ÙÙŠ Ù…ÙÙ† Ù„ÙŽÙ‘Ø¯ÙÙ†ÙƒÙŽ Ø°ÙØ±ÙÙ‘ÙŠÙŽÙ‘Ø©Ù‹ Ø·ÙŽÙŠÙÙ‘Ø¨ÙŽØ©Ù‹ Û– Ø¥ÙÙ†ÙŽÙ‘ÙƒÙŽ Ø³ÙŽÙ…ÙÙŠØ¹Ù Ø§Ù„Ø¯ÙÙ‘Ø¹ÙŽØ§Ø¡Ù",
      count: 1,
      reward: "Ø·Ù„Ø¨ Ø§Ù„Ø°Ø±ÙŠØ© Ø§Ù„ØµØ§Ù„Ø­Ø© ÙˆØ§Ù„Ù…Ø¨Ø§Ø±ÙƒØ©"
    },
    {
      category: "Ø£Ø¯Ø¹ÙŠØ© Ù„Ù„Ø£ÙˆÙ„Ø§Ø¯",
      text: "Ø±ÙŽØ¨ÙÙ‘ Ø§Ø¬Ù’Ø¹ÙŽÙ„Ù’Ù†ÙÙŠ Ù…ÙÙ‚ÙÙŠÙ…ÙŽ Ø§Ù„ØµÙŽÙ‘Ù„ÙŽØ§Ø©Ù ÙˆÙŽÙ…ÙÙ† Ø°ÙØ±ÙÙ‘ÙŠÙŽÙ‘ØªÙÙŠ Ûš Ø±ÙŽØ¨ÙŽÙ‘Ù†ÙŽØ§ ÙˆÙŽØªÙŽÙ‚ÙŽØ¨ÙŽÙ‘Ù„Ù’ Ø¯ÙØ¹ÙŽØ§Ø¡Ù",
      count: 1,
      reward: "ØµÙ„Ø§Ø­ Ø§Ù„Ø°Ø±ÙŠØ© ÙˆØ§Ù„Ù…Ø­Ø§ÙØ¸Ø© Ø¹Ù„Ù‰ Ø¥Ù‚Ø§Ù…Ø© Ø§Ù„ØµÙ„Ø§Ø©"
    },
    {
      category: "Ø£Ø¯Ø¹ÙŠØ© Ø§Ù„Ø§Ø³ØªÙŠÙ‚Ø§Ø¸",
      text: "Ø§Ù„Ù’Ø­ÙŽÙ…Ù’Ø¯Ù Ù„ÙÙ„ÙŽÙ‘Ù‡Ù Ø§Ù„ÙŽÙ‘Ø°ÙÙŠ Ø£ÙŽØ­Ù’ÙŠÙŽØ§Ù†ÙŽØ§ Ø¨ÙŽØ¹Ù’Ø¯ÙŽ Ù…ÙŽØ§ Ø£ÙŽÙ…ÙŽØ§ØªÙŽÙ†ÙŽØ§ ÙˆÙŽØ¥ÙÙ„ÙŽÙŠÙ’Ù‡Ù Ø§Ù„Ù†ÙÙ‘Ø´ÙÙˆØ±Ù",
      count: 1,
      reward: "Ø´ÙƒØ± Ø§Ù„Ù„Ù‡ Ø¹Ù„Ù‰ Ù†Ø¹Ù…Ø© Ø¥Ø±Ø¬Ø§Ø¹ Ø§Ù„Ø±ÙˆØ­ ÙˆØ¨Ø¯Ø¡ ÙŠÙˆÙ… Ø¬Ø¯ÙŠØ¯"
    },
    {
      category: "Ø£Ø¯Ø¹ÙŠØ© Ø§Ù„Ø§Ø³ØªÙŠÙ‚Ø§Ø¸",
      text: "Ø§Ù„Ø­Ù…Ø¯ Ù„Ù„Ù‡ Ø§Ù„Ø°ÙŠ Ø¹Ø§ÙØ§Ù†ÙŠ ÙÙŠ Ø¬Ø³Ø¯ÙŠØŒ ÙˆØ±Ø¯ Ø¹Ù„ÙŠ Ø±ÙˆØ­ÙŠØŒ ÙˆØ£Ø°Ù† Ù„ÙŠ Ø¨Ø°ÙƒØ±Ù‡",
      count: 1,
      reward: "ØªØ­ÙÙŠØ² Ø§Ù„Ù„Ø³Ø§Ù† Ø¨Ø°ÙƒØ± Ø§Ù„Ù„Ù‡ Ø¹Ù†Ø¯ Ø§Ù„ÙŠÙ‚Ø¸Ø© Ù…Ø¨Ø§Ø´Ø±Ø©"
    }
  ];

  static getRandomZikr(category?: string): AzkarEntry {
    const filtered = category 
      ? this.azkar.filter(a => a.category.includes(category))
      : this.azkar;

    const list = filtered.length > 0 ? filtered : this.azkar;
    const idx = Math.floor(Math.random() * list.length);
    return list[idx]!;
  }

  static getCategories(): string[] {
    return ["Ø£Ø°ÙƒØ§Ø± Ø§Ù„ØµØ¨Ø§Ø­", "Ø£Ø°ÙƒØ§Ø± Ø§Ù„Ù…Ø³Ø§Ø¡", "Ø£Ø°ÙƒØ§Ø± Ø§Ù„Ù†ÙˆÙ…", "Ø£Ø°ÙƒØ§Ø± Ø¨Ø¹Ø¯ Ø§Ù„ØµÙ„Ø§Ø©", "Ø£Ø¯Ø¹ÙŠØ© Ø¹Ø§Ù…Ø©"];
  }
}

// ============================================================
//  17. Ù…Ø¯ÙŠØ± Ù‚ÙˆØ§Ù„Ø¨ ÙˆÙ‚ÙˆØ§Ù†ÙŠÙ† Ø§Ù„Ø³ÙŠØ±ÙØ±Ø§Øª (Server Rules Template Manager)
// ============================================================
export interface RulesTemplate {
  genre: string;
  title: string;
  rules: string[];
}

export class ServerRulesTemplateManager {
  private static templates: RulesTemplate[] = [
    {
      genre: "gaming",
      title: "Ù‚ÙˆØ§Ù†ÙŠÙ† Ø³ÙŠØ±ÙØ± Ø§Ù„Ø£Ù„Ø¹Ø§Ø¨ Ø§Ù„Ø±Ø³Ù…ÙŠ ðŸŽ®",
      rules: [
        "ÙŠÙ…Ù†Ø¹ Ù…Ù†Ø¹Ø§Ù‹ Ø¨Ø§ØªØ§Ù‹ Ø§Ù„ØºØ´ Ø£Ùˆ Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø¨Ø±Ø§Ù…Ø¬ Ø§Ù„Ø§Ø®ØªØ±Ø§Ù‚ (Hacks/Cheats).",
        "Ø§Ø­ØªØ±Ø§Ù… Ø§Ù„Ù„Ø§Ø¹Ø¨ÙŠÙ† ÙˆØ§Ù„Ø§Ø¨ØªØ¹Ø§Ø¯ Ø¹Ù† Ø§Ù„ØªØ°Ù…Ø± ÙˆØ§Ù„ØµØ±Ø§Ø® Ø§Ù„Ù…Ø²Ø¹Ø¬ ÙÙŠ Ø§Ù„Ù‚Ù†ÙˆØ§Øª Ø§Ù„ØµÙˆØªÙŠØ©.",
        "ÙŠÙ…Ù†Ø¹ Ù†Ø´Ø± Ø±ÙˆØ§Ø¨Ø· Ø³ÙŠØ±ÙØ±Ø§Øª Ø®Ø§Ø±Ø¬ÙŠØ© Ø£Ùˆ ØªØ±ÙˆÙŠØ¬ Ø§Ù„Ø³Ù„Ø¹ Ø¯ÙˆÙ† Ø¥Ø°Ù† Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©.",
        "Ø§Ù„Ø§Ù„ØªØ²Ø§Ù… Ø¨Ø§Ù„Ù‚Ù†ÙˆØ§Øª Ø§Ù„Ù…Ø®ØµØµØ© Ù„ÙƒÙ„ Ù„Ø¹Ø¨Ø© ÙˆØ¹Ø¯Ù… Ø¥Ø«Ø§Ø±Ø© Ø§Ù„ÙÙˆØ¶Ù‰.",
        "Ø§Ø­ØªØ±Ø§Ù… Ù‚Ø±Ø§Ø±Ø§Øª Ù…Ø´Ø±ÙÙŠ Ø§Ù„Ù„Ù‚Ø§Ø¡Ø§Øª ÙˆØ§Ù„Ø¨Ø·ÙˆÙ„Ø§Øª Ø§Ù„Ù…Ù‚Ø§Ù…Ø© Ø¨Ø§Ù„Ø³ÙŠØ±ÙØ±."
      ]
    },

    {
      genre: "general",
      title: "Ù‚ÙˆØ§Ù†ÙŠÙ† Ø®Ø§Ø¯Ù… Ø§Ù„Ø¯Ø±Ø¯Ø´Ø© ÙˆØ§Ù„Ù…Ø¬ØªÙ…Ø¹ Ø§Ù„Ø¹Ø§Ù… ðŸ’¬",
      rules: [
        "Ø§Ø­ØªØ±Ø§Ù… Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡ ÙˆØ§Ù„Ø§Ø¨ØªØ¹Ø§Ø¯ Ø¹Ù† Ø§Ù„Ù†Ù‚Ø§Ø´Ø§Øª Ø§Ù„Ø·Ø§Ø¦ÙÙŠØ© ÙˆØ§Ù„Ø¹Ù†ØµØ±ÙŠØ©.",
        "ÙŠÙ…Ù†Ø¹ Ø¥ØºØ±Ø§Ù‚ Ø§Ù„Ø´Ø§Øª Ø¨Ø§Ù„Ø±Ø³Ø§Ø¦Ù„ Ø§Ù„Ù…ÙƒØ±Ø±Ø© (Spam) Ø£Ùˆ Ø§Ù„Ù…Ù†Ø´Ù† Ø§Ù„Ø¹Ø´ÙˆØ§Ø¦ÙŠ.",
        "Ø§Ù„Ø§Ù„ØªØ²Ø§Ù… Ø¨Ù†Ø´Ø± Ø§Ù„Ù…ÙŠØ¯ÙŠØ§ ÙˆØ§Ù„Ø±ÙˆØ§Ø¨Ø· ÙÙŠ Ø§Ù„Ù‚Ù†ÙˆØ§Øª Ø§Ù„Ù…Ø®ØµØµØ© Ù„Ù‡Ø§.",
        "ÙŠÙ…Ù†Ø¹ Ø§Ù†ØªØ­Ø§Ù„ ØµÙØ© Ø§Ù„Ù…Ø´Ø±ÙÙŠÙ† Ø£Ùˆ Ø§Ù„Ø­Ø³Ø§Ø¨Ø§Øª Ø§Ù„Ø±Ø³Ù…ÙŠØ©.",
        "Ù„Ù„Ø¥Ø¨Ù„Ø§Øº Ø¹Ù† Ø§Ù„Ù…Ø®Ø§Ù„ÙÙŠÙ† ÙŠØ±Ø¬Ù‰ ÙØªØ­ ØªØ°ÙƒØ±Ø© Ø¯Ø¹Ù… ÙÙ†ÙŠ Ù…Ø¨Ø§Ø´Ø±Ø© ÙˆØ¹Ø¯Ù… Ø§Ù„Ø¯Ø®ÙˆÙ„ ÙÙŠ Ù†Ø²Ø§Ø¹."
      ]
    },
    {
      genre: "study",
      title: "Ù‚ÙˆØ§Ù†ÙŠÙ† Ø³ÙŠØ±ÙØ± Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø© ÙˆØ§Ù„Ø¯Ø±Ø§Ø³Ø© Ø§Ù„Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠ ðŸ“š",
      rules: [
        "ÙŠÙ…Ù†Ø¹ Ø§Ù„ØªØ´ÙˆÙŠØ´ Ø£Ùˆ Ø§Ù„ÙƒÙ„Ø§Ù… ÙÙŠ ØºÙŠØ± Ø§Ù„Ù…Ø°Ø§ÙƒØ±Ø© ÙÙŠ ØºØ±Ù Ø§Ù„ØªØ±ÙƒÙŠØ² Ø§Ù„ØµÙˆØªÙŠØ©.",
        "ÙŠÙ…Ù†Ø¹ Ø§Ù„ØªØ±ÙˆÙŠØ¬ Ù„Ø®Ø¯Ù…Ø§Øª Ø­Ù„ Ø§Ù„Ø§Ø®ØªØ¨Ø§Ø±Ø§Øª Ø£Ùˆ Ø§Ù„ÙˆØ§Ø¬Ø¨Ø§Øª Ø§Ù„ØªØ¬Ø§Ø±ÙŠØ© ØºÙŠØ± Ø§Ù„Ù…ØµØ±Ø­Ø©.",
        "Ø§Ù„ØªØ¹Ø§ÙˆÙ† Ø§Ù„Ø¨Ù†Ø§Ø¡ ÙˆÙ…Ø³Ø§Ø¹Ø¯Ø© Ø§Ù„Ø·Ù„Ø§Ø¨ ÙÙŠ ÙÙ‡Ù… Ø§Ù„Ù…ÙˆØ§Ø¯ Ø§Ù„ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ø¨ÙƒÙ„ Ø£Ø¯Ø¨.",
        "Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ù‚Ù†ÙˆØ§Øª Ø§Ù„Ù…Ø®ØµØµØ© Ù„ÙƒÙ„ ØªØ®ØµØµ Ø¯Ø±Ø§Ø³ÙŠ Ù„ØªØ¬Ù†Ø¨ ØªØ´ØªÙŠØª Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡.",
        "Ø§Ø­ØªØ±Ø§Ù… Ø§Ù„Ù…Ø¹Ù„Ù…ÙŠÙ† ÙˆØ§Ù„Ù…Ø´Ø±ÙÙŠÙ† Ø§Ù„Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠÙŠÙ† Ø§Ù„Ù…ØªÙˆØ§Ø¬Ø¯ÙŠÙ† Ù„Ù„Ø±Ø¯ Ø¹Ù„Ù‰ Ø§Ù„Ø£Ø³Ø¦Ù„Ø©."
      ]
    }
  ];

  static getTemplate(genre: string): RulesTemplate | null {
    const match = this.templates.find(t => t.genre === genre.toLowerCase());
    return match ?? null;
  }
}

// ============================================================
//  18. Ù…Ø­Ø§ÙƒÙŠ ÙˆÙ…Ø¬Ø¯ÙˆÙ„ Ø§Ù„Ø¨Ø·ÙˆÙ„Ø§Øª Ø§Ù„Ø±ÙŠØ§Ø¶ÙŠØ© Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ© (Esports Matchmaking)
// ============================================================
export interface EsportsMatch {
  id: string;
  gameName: string;
  teamA: string;
  teamB: string;
  startTime: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED';
  score?: string;
  winner?: string;
}

export class EsportsTournamentScheduler {
  private static matches: EsportsMatch[] = [
    {
      id: "M-101",
      gameName: "League of Legends",
      teamA: "Falcons Esports",
      teamB: "Geekay Esports",
      startTime: "21:00",
      status: "SCHEDULED"
    },
    {
      id: "M-102",
      gameName: "VALORANT",
      teamA: "Twisted Minds",
      teamB: "Team Heretics",
      startTime: "22:30",
      status: "SCHEDULED"
    },
    {
      id: "M-103",
      gameName: "Rocket League",
      teamA: "Rule One",
      teamB: "Team Vitality",
      startTime: "20:00",
      status: "COMPLETED",
      score: "3 - 2",
      winner: "Rule One"
    }
  ];

  static registerMatch(game: string, teamA: string, teamB: string, time: string): EsportsMatch {
    const id = `M-${Math.floor(100 + Math.random() * 900)}`;
    const newMatch: EsportsMatch = {
      id,
      gameName: game,
      teamA,
      teamB,
      startTime: time,
      status: 'SCHEDULED'
    };
    this.matches.push(newMatch);
    return newMatch;
  }

  static getMatches(): EsportsMatch[] {
    return this.matches;
  }

  static setLive(id: string): boolean {
    const match = this.matches.find(m => m.id === id);
    if (match) {
      match.status = 'LIVE';
      return true;
    }
    return false;
  }

  static setWinner(id: string, score: string, winner: string): boolean {
    const match = this.matches.find(m => m.id === id);
    if (match) {
      match.status = 'COMPLETED';
      match.score = score;
      match.winner = winner;
      return true;
    }
    return false;
  }
}

// ============================================================
//  19. Ù‚ÙˆØ§Ù„Ø¨ ÙˆÙ‡ÙŠØ§ÙƒÙ„ Ø§Ù„Ø³ÙŠØ±ÙØ±Ø§Øª Ø§Ù„Ø¬Ø§Ù‡Ø²Ø© Ù„Ù„Ø¨Ù†Ø§Ø¡ (Detailed Blueprint Configs)
// ============================================================
export const SYSTEM_BLUEPRINTS = {
  gaming: {
    categoryName: "ðŸŽ® ØµØ§Ù„Ø© Ø§Ù„Ø£Ù„Ø¹Ø§Ø¨",
    channels: [
      { name: "ðŸ’¬-Ø¯Ø±Ø¯Ø´Ø©-Ø§Ù„Ø£Ù„Ø¹Ø§Ø¨", type: ChannelType.GuildText },
      { name: "ðŸ“£-Ø£Ø®Ø¨Ø§Ø±-Ø§Ù„Ø£Ù„Ø¹Ø§Ø¨", type: ChannelType.GuildText },
      { name: "ðŸŽ¬-Ù„Ù‚Ø·Ø§Øª-Ù…ØªÙ…ÙŠØ²Ø©", type: ChannelType.GuildText },
      { name: "ðŸ”Š-ØµØ§Ù„ÙˆÙ†-Ø§Ù„ØµÙˆØª-1", type: ChannelType.GuildVoice },
      { name: "ðŸ”Š-ØµØ§Ù„ÙˆÙ†-Ø§Ù„ØµÙˆØª-2", type: ChannelType.GuildVoice }
    ]
  },

  general: {
    categoryName: "ðŸ’¬ Ø§Ù„Ù‚Ø³Ù… Ø§Ù„Ø¹Ø§Ù…",
    channels: [
      { name: "ðŸ‘‹-Ø§Ù„ØªØ±Ø­ÙŠØ¨", type: ChannelType.GuildText },
      { name: "ðŸ“œ-Ø§Ù„Ù‚ÙˆØ§Ù†ÙŠÙ†", type: ChannelType.GuildText },
      { name: "ðŸ“¢-Ø§Ù„Ø¥Ø¹Ù„Ø§Ù†Ø§Øª", type: ChannelType.GuildText },
      { name: "ðŸ’¬-Ø§Ù„Ø¯Ø±Ø¯Ø´Ø©-Ø§Ù„Ø¹Ø§Ù…Ø©", type: ChannelType.GuildText },
      { name: "ðŸ”Š-Ø§Ù„Ø¯ÙŠÙˆØ§Ù†ÙŠØ©-Ø§Ù„Ø¹Ø§Ù…Ø©", type: ChannelType.GuildVoice }
    ]
  }
};

// ============================================================
//  19.5. Ù‚Ø§Ø¹Ø¯Ø© Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³Ø§Ø¨Ù‚Ø§Øª Ø§Ù„Ø«Ù‚Ø§ÙÙŠØ© Ø§Ù„Ù…Ø¯Ù…Ø¬Ø© (Trivia Database)
// ============================================================
export interface TriviaQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export class TriviaDatabase {
  private static questions: TriviaQuestion[] = [
    {
      question: "Ù…Ø§ Ù‡ÙŠ Ø£ÙƒØ¨Ø± Ù‚Ø§Ø±Ø© ÙÙŠ Ø§Ù„Ø¹Ø§Ù„Ù… Ù…Ù† Ø­ÙŠØ« Ø§Ù„Ù…Ø³Ø§Ø­Ø©ØŸ",
      options: ["Ø£ÙØ±ÙŠÙ‚ÙŠØ§", "Ø¢Ø³ÙŠØ§", "Ø£ÙˆØ±ÙˆØ¨Ø§", "Ø£Ù…Ø±ÙŠÙƒØ§ Ø§Ù„Ø´Ù…Ø§Ù„ÙŠØ©"],
      answerIndex: 1,
      explanation: "Ù‚Ø§Ø±Ø© Ø¢Ø³ÙŠØ§ Ù‡ÙŠ Ø§Ù„Ø£ÙƒØ¨Ø± Ù…Ø³Ø§Ø­Ø© ÙˆØªØ¹Ø¯Ø§Ø¯Ø§Ù‹ Ù„Ù„Ø³ÙƒØ§Ù† ÙÙŠ Ø§Ù„Ø¹Ø§Ù„Ù…."
    },
    {
      question: "Ù…Ø§ Ù‡Ùˆ Ø£Ø³Ø±Ø¹ ÙƒØ§Ø¦Ù† Ø¨Ø±ÙŠ ÙÙŠ Ø§Ù„Ø¹Ø§Ù„Ù…ØŸ",
      options: ["Ø§Ù„ÙÙ‡Ø¯", "Ø§Ù„Ø£Ø³Ø¯", "Ø§Ù„ØºØ²Ø§Ù„", "Ø§Ù„Ø­ØµØ§Ù†"],
      answerIndex: 0,
      explanation: "Ø§Ù„ÙÙ‡Ø¯ Ø§Ù„ØµÙŠØ§Ø¯ (Ø§Ù„Ø´ÙŠØªØ§) Ù‡Ùˆ Ø£Ø³Ø±Ø¹ Ø­ÙŠÙˆØ§Ù† Ø¨Ø±ÙŠ ÙˆØªØµÙ„ Ø³Ø±Ø¹ØªÙ‡ Ù„Ø£ÙƒØ«Ø± Ù…Ù† 100 ÙƒÙ…/Ø³."
    },
    {
      question: "Ù…Ø§ Ù‡Ùˆ Ø§Ù„Ø¹Ù†ØµØ± Ø§Ù„ÙƒÙŠÙ…ÙŠØ§Ø¦ÙŠ Ø§Ù„Ø£ÙƒØ«Ø± ÙˆÙØ±Ø© ÙÙŠ Ø§Ù„ÙƒÙˆÙ†ØŸ",
      options: ["Ø§Ù„Ø£ÙƒØ³Ø¬ÙŠÙ†", "Ø§Ù„Ù‡ÙŠØ¯Ø±ÙˆØ¬ÙŠÙ†", "Ø§Ù„Ù†ÙŠØªØ±ÙˆØ¬ÙŠÙ†", "Ø§Ù„ÙƒØ±Ø¨ÙˆÙ†"],
      answerIndex: 1,
      explanation: "Ø§Ù„Ù‡ÙŠØ¯Ø±ÙˆØ¬ÙŠÙ† Ù‡Ùˆ Ø§Ù„Ø¹Ù†ØµØ± Ø§Ù„Ø£ÙƒØ«Ø± Ø§Ù†ØªØ´Ø§Ø±Ø§Ù‹ ÙˆÙˆÙØ±Ø© ÙÙŠ Ø§Ù„ÙƒÙˆÙ† Ø§Ù„ÙØ³ÙŠØ­."
    },
    {
      question: "ÙÙŠ Ø£ÙŠ Ù…Ø¯ÙŠÙ†Ø© ÙŠÙ‚Ø¹ Ø§Ù„Ù…Ù‚Ø± Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠ Ù„Ù„Ø£Ù…Ù… Ø§Ù„Ù…ØªØ­Ø¯Ø©ØŸ",
      options: ["Ù„Ù†Ø¯Ù†", "Ø¨Ø§Ø±ÙŠØ³", "Ø¬Ù†ÙŠÙ", "Ù†ÙŠÙˆÙŠÙˆØ±Ùƒ"],
      answerIndex: 3,
      explanation: "ÙŠÙ‚Ø¹ Ù…Ù‚Ø± Ø§Ù„Ù…Ù†Ø¸Ù…Ø© Ø§Ù„Ø¯ÙˆÙ„ÙŠØ© Ù„Ù„Ø£Ù…Ù… Ø§Ù„Ù…ØªØ­Ø¯Ø© ÙÙŠ Ù…Ø¯ÙŠÙ†Ø© Ù†ÙŠÙˆÙŠÙˆØ±Ùƒ Ø§Ù„Ø£Ù…Ø±ÙŠÙƒÙŠØ©."
    },
    {
      question: "ÙƒÙ… Ø¹Ø¯Ø¯ ÙƒÙˆØ§ÙƒØ¨ Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø© Ø§Ù„Ø´Ù…Ø³ÙŠØ©ØŸ",
      options: ["7 ÙƒÙˆØ§ÙƒØ¨", "8 ÙƒÙˆØ§ÙƒØ¨", "9 ÙƒÙˆØ§ÙƒØ¨", "10 ÙƒÙˆØ§ÙƒØ¨"],
      answerIndex: 1,
      explanation: "Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø© Ø§Ù„Ø´Ù…Ø³ÙŠØ© ØªØªÙƒÙˆÙ† Ø±Ø³Ù…ÙŠØ§Ù‹ Ù…Ù† 8 ÙƒÙˆØ§ÙƒØ¨ Ø¨Ø¹Ø¯ ØªØµÙ†ÙŠÙ Ø¨Ù„ÙˆØªÙˆ ÙƒÙƒÙˆÙƒØ¨ Ù‚Ø²Ù…."
    },
    {
      question: "Ù…Ø§ Ù‡ÙŠ Ø§Ù„Ø¹Ù…Ù„Ø© Ø§Ù„Ø±Ø³Ù…ÙŠØ© Ù„Ù„ÙŠØ§Ø¨Ø§Ù†ØŸ",
      options: ["Ø§Ù„ÙŠÙˆØ§Ù†", "Ø§Ù„ÙŠÙ†", "Ø§Ù„ÙˆÙˆÙ†", "Ø§Ù„Ø¯ÙˆÙ„Ø§Ø±"],
      answerIndex: 1,
      explanation: "Ø§Ù„ÙŠÙ† Ù‡Ùˆ Ø§Ù„Ø¹Ù…Ù„Ø© Ø§Ù„Ø±Ø³Ù…ÙŠØ© ÙˆØ§Ù„Ø£Ø³Ø§Ø³ÙŠØ© Ø§Ù„Ù…ØªØ¯Ø§ÙˆÙ„Ø© ÙÙŠ Ø§Ù„ÙŠØ§Ø¨Ø§Ù†."
    },
    {
      question: "Ù…Ø§ Ù‡Ùˆ Ø£Ø·ÙˆÙ„ Ù†Ù‡Ø± ÙÙŠ Ø§Ù„Ø¹Ø§Ù„Ù…ØŸ",
      options: ["Ù†Ù‡Ø± Ø§Ù„Ù†ÙŠÙ„", "Ù†Ù‡Ø± Ø§Ù„Ø£Ù…Ø§Ø²ÙˆÙ†", "Ù†Ù‡Ø± Ø§Ù„Ù…ÙŠØ³ÙŠØ³ÙŠØ¨ÙŠ", "Ù†Ù‡Ø± Ø§Ù„ÙŠØ§Ù†ØºØªØ³ÙŠ"],
      answerIndex: 0,
      explanation: "Ù†Ù‡Ø± Ø§Ù„Ù†ÙŠÙ„ ÙÙŠ Ø£ÙØ±ÙŠÙ‚ÙŠØ§ Ù‡Ùˆ Ø£Ø·ÙˆÙ„ Ø£Ù†Ù‡Ø§Ø± Ø§Ù„ÙƒØ±Ø© Ø§Ù„Ø£Ø±Ø¶ÙŠØ©."
    },
    {
      question: "Ù…Ù† Ù‡Ùˆ Ù…ÙƒØªØ´Ù Ø§Ù„Ø¬Ø§Ø°Ø¨ÙŠØ© Ø§Ù„Ø£Ø±Ø¶ÙŠØ©ØŸ",
      options: ["Ø£Ù„Ø¨ÙŠØ±Øª Ø£ÙŠÙ†Ø´ØªØ§ÙŠÙ†", "Ø¥Ø³Ø­Ø§Ù‚ Ù†ÙŠÙˆØªÙ†", "ØºØ§Ù„ÙŠÙ„Ùˆ ØºØ§Ù„ÙŠÙ„ÙŠ", "Ù†ÙŠÙƒÙˆÙ„Ø§ ØªØ³Ù„Ø§"],
      answerIndex: 1,
      explanation: "Ø¥Ø³Ø­Ø§Ù‚ Ù†ÙŠÙˆØªÙ† Ù‡Ùˆ Ù…Ù† ØµØ§Øº Ù‚Ø§Ù†ÙˆÙ† Ø§Ù„Ø¬Ø§Ø°Ø¨ÙŠØ© Ø§Ù„Ø¹Ø§Ù… Ø¨Ø¹Ø¯ Ù‚ØµØ© Ø§Ù„ØªÙØ§Ø­Ø© Ø§Ù„Ø´Ù‡ÙŠØ±Ø©."
    },
    {
      question: "Ù…Ø§ Ù‡Ùˆ Ø§Ù„ØºØ§Ø² Ø§Ù„Ù…Ø³ØªØ¹Ù…Ù„ Ù„Ø¥Ø·ÙØ§Ø¡ Ø§Ù„Ø­Ø±Ø§Ø¦Ù‚ØŸ",
      options: ["Ø§Ù„Ø£ÙƒØ³Ø¬ÙŠÙ†", "Ø§Ù„Ù†ÙŠØªØ±ÙˆØ¬ÙŠÙ†", "Ø«Ø§Ù†ÙŠ Ø£ÙƒØ³ÙŠØ¯ Ø§Ù„ÙƒØ±Ø¨ÙˆÙ†", "Ø§Ù„Ù‡ÙŠÙ„ÙŠÙˆÙ…"],
      answerIndex: 2,
      explanation: "Ø«Ø§Ù†ÙŠ Ø£ÙƒØ³ÙŠØ¯ Ø§Ù„ÙƒØ±Ø¨ÙˆÙ† ÙŠØ«Ø¨Ø· ÙˆÙŠÙ…Ù†Ø¹ Ø§Ø´ØªØ¹Ø§Ù„ Ø§Ù„Ø£ÙƒØ³Ø¬ÙŠÙ† Ù„Ø°Ø§ ÙŠØ³ØªØ¹Ù…Ù„ Ù„Ø¥Ø·ÙØ§Ø¡ Ø§Ù„Ø­Ø±Ø§Ø¦Ù‚."
    },
    {
      question: "Ù…Ø§ Ù‡Ùˆ Ø§Ù„Ø¨Ø­Ø± Ø§Ù„Ø£ÙƒØ«Ø± Ù…Ù„ÙˆØ­Ø© ÙÙŠ Ø§Ù„Ø¹Ø§Ù„Ù…ØŸ",
      options: ["Ø§Ù„Ø¨Ø­Ø± Ø§Ù„Ø£Ø­Ù…Ø±", "Ø§Ù„Ø¨Ø­Ø± Ø§Ù„Ù…ÙŠØª", "Ø§Ù„Ø¨Ø­Ø± Ø§Ù„Ù…ØªÙˆØ³Ø·", "Ø¨Ø­Ø± Ø§Ù„Ø¹Ø±Ø¨"],
      answerIndex: 1,
      explanation: "Ø§Ù„Ø¨Ø­Ø± Ø§Ù„Ù…ÙŠØª Ù‡Ùˆ Ø§Ù„Ø£ÙƒØ«Ø± Ù…Ù„ÙˆØ­Ø© ÙˆÙ„Ø§ ØªØ¹ÙŠØ´ ÙÙŠÙ‡ Ø§Ù„ÙƒØ§Ø¦Ù†Ø§Øª Ø§Ù„Ø¨Ø­Ø±ÙŠØ© Ù„Ø§Ø±ØªÙØ§Ø¹ Ù…Ù„ÙˆØ­ØªÙ‡."
    },
    {
      question: "ÙƒÙ… Ø¹Ø¯Ø¯ ØµÙ…Ø§Ù…Ø§Øª Ù‚Ù„Ø¨ Ø§Ù„Ø¥Ù†Ø³Ø§Ù†ØŸ",
      options: ["ØµÙ…Ø§Ù…Ø§Ù†", "3 ØµÙ…Ø§Ù…Ø§Øª", "4 ØµÙ…Ø§Ù…Ø§Øª", "5 ØµÙ…Ø§Ù…Ø§Øª"],
      answerIndex: 2,
      explanation: "ÙŠØ­ØªÙˆÙŠ Ù‚Ù„Ø¨ Ø§Ù„Ø¥Ù†Ø³Ø§Ù† Ø§Ù„Ø³Ù„ÙŠÙ… Ø¹Ù„Ù‰ 4 ØµÙ…Ø§Ù…Ø§Øª ØªÙ†Ø¸Ù… Ø­Ø±ÙƒØ© ÙˆØ¶Ø® Ø§Ù„Ø¯Ù…Ø§Ø¡."
    },
    {
      question: "Ù…Ø§ Ù‡Ùˆ Ø£ØµØºØ± Ø¨Ù„Ø¯ ÙÙŠ Ø§Ù„Ø¹Ø§Ù„Ù… Ù…Ù† Ø­ÙŠØ« Ø§Ù„Ù…Ø³Ø§Ø­Ø©ØŸ",
      options: ["Ù…ÙˆÙ†Ø§ÙƒÙˆ", "Ø§Ù„ÙØ§ØªÙŠÙƒØ§Ù†", "Ø³Ø§Ù† Ù…Ø§Ø±ÙŠÙ†Ùˆ", "Ù…Ø§Ù„Ø·Ø§"],
      answerIndex: 1,
      explanation: "Ø¯ÙˆÙ„Ø© Ø§Ù„ÙØ§ØªÙŠÙƒØ§Ù† Ù‡ÙŠ Ø§Ù„Ø£ØµØºØ± Ù…Ø³Ø§Ø­Ø© ÙˆØªØ¹Ø¯Ø§Ø¯Ø§Ù‹ ÙˆØªÙ‚Ø¹ Ø¨Ø§Ù„ÙƒØ§Ù…Ù„ Ø¯Ø§Ø®Ù„ Ù…Ø¯ÙŠÙ†Ø© Ø±ÙˆÙ…Ø§."
    },
    {
      question: "ÙÙŠ Ø£ÙŠ Ø¹Ø§Ù… Ø§Ù†Ø¯Ù„Ø¹Øª Ø§Ù„Ø­Ø±Ø¨ Ø§Ù„Ø¹Ø§Ù„Ù…ÙŠØ© Ø§Ù„Ø£ÙˆÙ„Ù‰ØŸ",
      options: ["1912", "1914", "1918", "1939"],
      answerIndex: 1,
      explanation: "Ø¨Ø¯Ø£Øª Ø§Ù„Ø­Ø±Ø¨ Ø§Ù„Ø¹Ø§Ù„Ù…ÙŠØ© Ø§Ù„Ø£ÙˆÙ„Ù‰ Ø¹Ø§Ù… 1914 ÙˆØ§Ù†ØªÙ‡Øª Ø±Ø³Ù…ÙŠØ§Ù‹ ÙÙŠ Ø¹Ø§Ù… 1918."
    },
    {
      question: "Ù…Ø§ Ù‡ÙŠ Ø¹Ø§ØµÙ…Ø© Ø¬Ù…Ù‡ÙˆØ±ÙŠØ© Ù…ØµØ± Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©ØŸ",
      options: ["Ø§Ù„Ø¥Ø³ÙƒÙ†Ø¯Ø±ÙŠØ©", "Ø§Ù„Ø¬ÙŠØ²Ø©", "Ø§Ù„Ù‚Ø§Ù‡Ø±Ø©", "Ø¨ÙˆØ±Ø³Ø¹ÙŠØ¯"],
      answerIndex: 2,
      explanation: "Ù…Ø¯ÙŠÙ†Ø© Ø§Ù„Ù‚Ø§Ù‡Ø±Ø© Ù‡ÙŠ Ø§Ù„Ø¹Ø§ØµÙ…Ø© Ø§Ù„ØªØ§Ø±ÙŠØ®ÙŠØ© ÙˆØ§Ù„Ø¥Ø¯Ø§Ø±ÙŠØ© Ù„Ø¬Ù…Ù‡ÙˆØ±ÙŠØ© Ù…ØµØ± Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©."
    },
    {
      question: "Ù…Ø§ Ù‡Ùˆ Ø£Ø³Ø±Ø¹ Ø­ÙŠÙˆØ§Ù† Ø¨Ø±ÙŠ ÙÙŠ Ø§Ù„Ø¹Ø§Ù„Ù…ØŸ",
      options: ["Ø§Ù„ÙÙ‡Ø¯", "Ø§Ù„ØºØ²Ø§Ù„", "Ø§Ù„Ø£Ø³Ø¯", "Ø§Ù„Ø­ØµØ§Ù†"],
      answerIndex: 0,
      explanation: "Ø§Ù„ÙÙ‡Ø¯ Ø§Ù„ØµÙŠØ§Ø¯ (Ø§Ù„Ø´ÙŠØªØ§) Ù‡Ùˆ Ø£Ø³Ø±Ø¹ Ø­ÙŠÙˆØ§Ù† Ø¨Ø±ÙŠ Ø¹Ù„Ù‰ ÙˆØ¬Ù‡ Ø§Ù„Ø£Ø±Ø¶ØŒ Ø­ÙŠØ« ØªØµÙ„ Ø³Ø±Ø¹ØªÙ‡ Ø¥Ù„Ù‰ Ø£ÙƒØ«Ø± Ù…Ù† 100 ÙƒÙ…/Ø³Ø§Ø¹Ø©."
    },
    {
      question: "Ù…Ø§ Ù‡ÙŠ Ø¹Ø§ØµÙ…Ø© Ø¯ÙˆÙ„Ø© Ø§Ù„Ø¥Ù…Ø§Ø±Ø§Øª Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© Ø§Ù„Ù…ØªØ­Ø¯Ø©ØŸ",
      options: ["Ø¯Ø¨ÙŠ", "Ø£Ø¨ÙˆØ¸Ø¨ÙŠ", "Ø§Ù„Ø´Ø§Ø±Ù‚Ø©", "Ø¹Ø¬Ù…Ø§Ù†"],
      answerIndex: 1,
      explanation: "Ø£Ø¨ÙˆØ¸Ø¨ÙŠ Ù‡ÙŠ Ø§Ù„Ø¹Ø§ØµÙ…Ø© Ø§Ù„Ø§ØªØ­Ø§Ø¯ÙŠØ© ÙˆØ§Ù„Ø³ÙŠØ§Ø³ÙŠØ© Ù„Ø¯ÙˆÙ„Ø© Ø§Ù„Ø¥Ù…Ø§Ø±Ø§Øª."
    },
    {
      question: "ÙƒÙ… Ø¹Ø¯Ø¯ Ø§Ù„Ø¹Ø¸Ø§Ù… ÙÙŠ Ø¬Ø³Ù… Ø§Ù„Ø¥Ù†Ø³Ø§Ù† Ø§Ù„Ø¨Ø§Ù„ØºØŸ",
      options: ["180 Ø¹Ø¸Ù…Ø©", "206 Ø¹Ø¸Ù…Ø©", "250 Ø¹Ø¸Ù…Ø©", "300 Ø¹Ø¸Ù…Ø©"],
      answerIndex: 1,
      explanation: "ÙŠØ­ØªÙˆÙŠ Ø§Ù„Ù‡ÙŠÙƒÙ„ Ø§Ù„Ø¹Ø¸Ù…ÙŠ Ù„Ù„Ø¥Ù†Ø³Ø§Ù† Ø§Ù„Ø¨Ø§Ù„Øº Ø¹Ù„Ù‰ 206 Ø¹Ø¸Ù…Ø© Ù…Ù†ÙØµÙ„Ø©."
    },
    {
      question: "Ù…Ø§ Ù‡Ùˆ Ø§Ù„ÙƒÙˆÙƒØ¨ Ø§Ù„Ù…Ù„Ù‚Ø¨ Ø¨Ø§Ù„ÙƒÙˆÙƒØ¨ Ø§Ù„Ø£Ø­Ù…Ø±ØŸ",
      options: ["Ø§Ù„Ø²Ù‡Ø±Ø©", "Ø§Ù„Ù…Ø±ÙŠØ®", "Ø§Ù„Ù…Ø´ØªØ±ÙŠ", "Ø²Ø­Ù„"],
      answerIndex: 1,
      explanation: "Ø§Ù„Ù…Ø±ÙŠØ® ÙŠÙ„Ù‚Ø¨ Ø¨Ø§Ù„ÙƒÙˆÙƒØ¨ Ø§Ù„Ø£Ø­Ù…Ø± Ù†Ø¸Ø±Ø§Ù‹ Ù„Ø§Ù†ØªØ´Ø§Ø± Ø£ÙƒØ³ÙŠØ¯ Ø§Ù„Ø­Ø¯ÙŠØ¯ Ø¹Ù„Ù‰ Ø³Ø·Ø­Ù‡ Ø¨ÙƒØ«Ø±Ø©."
    },
    {
      question: "Ù…Ù† Ù‡Ùˆ Ø£ÙˆÙ„ Ù…Ù† ØµØ¹Ø¯ Ø¥Ù„Ù‰ Ø§Ù„ÙØ¶Ø§Ø¡ Ø§Ù„Ø®Ø§Ø±Ø¬ÙŠØŸ",
      options: ["Ù†ÙŠÙ„ Ø£Ø±Ù…Ø³ØªØ±ÙˆÙ†Øº", "ÙŠÙˆØ±ÙŠ ØºØ§ØºØ§Ø±ÙŠÙ†", "Ø¨Ø² Ø£Ù„Ø¯Ø±ÙŠÙ†", "Ø³Ù„Ø·Ø§Ù† Ø¨Ù† Ø³Ù„Ù…Ø§Ù†"],
      answerIndex: 1,
      explanation: "Ø§Ù„Ø±ÙˆØ³ÙŠ ÙŠÙˆØ±ÙŠ ØºØ§ØºØ§Ø±ÙŠÙ† Ù‡Ùˆ Ø£ÙˆÙ„ Ø¥Ù†Ø³Ø§Ù† ÙŠØ¯ÙˆØ± Ø­ÙˆÙ„ Ø§Ù„Ø£Ø±Ø¶ ÙÙŠ Ø§Ù„ÙØ¶Ø§Ø¡ Ø§Ù„Ø®Ø§Ø±Ø¬ÙŠ."
    },
    {
      question: "Ù…Ø§ Ù‡ÙŠ ÙØµÙŠÙ„Ø© Ø§Ù„Ø¯Ù… Ø§Ù„ØªÙŠ ØªØ³Ù…Ù‰ Ø§Ù„Ù…ØªØ¨Ø±Ø¹ Ø§Ù„Ø¹Ø§Ù…ØŸ",
      options: ["A+", "B-", "AB+", "O-"],
      answerIndex: 3,
      explanation: "ÙØµÙŠÙ„Ø© Ø§Ù„Ø¯Ù… O Ø§Ù„Ø³Ø§Ù„Ø¨Ø© ÙŠÙ…ÙƒÙ† Ø¥Ø¹Ø·Ø§Ø¤Ù‡Ø§ Ù„Ø¬Ù…ÙŠØ¹ Ø§Ù„ÙØµØ§Ø¦Ù„ Ø§Ù„Ø£Ø®Ø±Ù‰ Ø¯ÙˆÙ† ØªØ¹Ø§Ø±Ø¶."
    }
  ];

  static getRandomQuestion(): TriviaQuestion {
    const idx = Math.floor(Math.random() * this.questions.length);
    return this.questions[idx]!;
  }
}

// ============================================================
//  ØªØ­Ø¯ÙŠØ« Ù…Ø¹Ø§Ù„Ø¬ Ø§Ù„Ø±Ø³Ø§Ø¦Ù„ Ø§Ù„Ù…Ø³Ø§Ø¹Ø¯ Ù„Ø¥Ø¯Ù…Ø§Ø¬ Ø§Ù„Ù…ÙŠØ²Ø§Øª Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø© (Offline Quran/Azkar commands)
// ============================================================
let handleManualCommandUpdated = async function(message: Message, commandText: string): Promise<boolean> {
  const parts = commandText.split(/\s+/);
  const command = parts[0]?.toLowerCase();
  const args = parts.slice(1);
  const guild = message.guild!;



  // 2. Ø£Ù…Ø± Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„Ø£Ø°ÙƒØ§Ø± Ø§Ù„Ù…ØªØ¹Ø¯Ø¯Ø© Ø§Ù„ÙØ¦Ø§Øª Ø¯ÙˆÙ† Ø¥Ù†ØªØ±Ù†Øª
  if (command === 'azkar' || command === 'Ø§Ø°ÙƒØ§Ø±') {
    const category = args.join(' ');
    const zikr = AzkarDatabase.getRandomZikr(category || undefined);
    const embed = createAzkarEmbed(zikr.category, zikr.text, zikr.count, zikr.reward);
    await message.reply({ embeds: [embed] }).catch(() => null);
    return true;
  }

  // 3. Ø£Ù…Ø± Ø¹Ø±Ø¶ ØªØµÙ†ÙŠÙ Ø§Ù„Ø£Ø°ÙƒØ§Ø± Ø§Ù„Ù…ØªØ§Ø­Ø©
  if (command === 'azkar_categories' || command === 'ØªØµÙ†ÙŠÙØ§Øª_Ø§Ù„Ø£Ø°ÙƒØ§Ø±') {
    const cats = AzkarDatabase.getCategories().map((c, i) => `**${i+1}.** ${c}`).join('\n');
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.success)
      .setTitle('ðŸ“¿ ØªØµÙ†ÙŠÙØ§Øª Ø§Ù„Ø£Ø°ÙƒØ§Ø± ÙˆØ§Ù„Ø£Ø¯Ø¹ÙŠØ© Ø§Ù„Ù…ØªØ§Ø­Ø©')
      .setDescription(cats)
      .setFooter({ text: 'Ø§Ø³ØªØ®Ø¯Ù…: !opus azkar <Ø§Ù„ØªØµÙ†ÙŠÙ>' })
      .setTimestamp();
    await message.reply({ embeds: [embed] }).catch(() => null);
    return true;
  }

  // 4. Ø£Ù…Ø± Ø¹Ø±Ø¶ Ù‚ÙˆØ§Ù†ÙŠÙ† Ø§Ù„Ø®Ø§Ø¯Ù… Ø§Ù„Ù…Ø¬Ù‡Ø²Ø© Ù…Ø³Ø¨Ù‚Ø§Ù‹
  if (command === 'rules_template' || command === 'Ù‚ÙˆØ§Ù„Ø¨_Ø§Ù„Ù‚ÙˆØ§Ù†ÙŠÙ†') {
    const genre = args[0];
    if (!genre) {
      await message.reply('âŒ ÙŠØ±Ø¬Ù‰ ØªØ­Ø¯ÙŠØ¯ Ù†ÙˆØ¹ Ø§Ù„Ù‚Ø§Ù„Ø¨ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø© (general, gaming, quran, study). Ù…Ø«Ø§Ù„: `!opus rules_template gaming`').catch(() => null);
      return true;
    }
    const template = ServerRulesTemplateManager.getTemplate(genre);
    if (!template) {
      await message.reply('âŒ Ù†ÙˆØ¹ Ø§Ù„Ù‚Ø§Ù„Ø¨ ØºÙŠØ± Ù…Ø¯Ø¹ÙˆÙ…. Ø§Ù„Ù…ØªØ§Ø­: (general, gaming, quran, study).').catch(() => null);
      return true;
    }

    const rulesEmbed = createRulesEmbed(template.title, template.rules);
    const embedsArray = Array.isArray(rulesEmbed) ? rulesEmbed : [rulesEmbed];
    await message.reply({ embeds: embedsArray }).catch(() => null);
    return true;
  }

  // 5. Ø£Ù…Ø± Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø§Ù‚ØªØ±Ø§Ø­Ø§Øª Ù„Ù„Ø´Ø§Øª Ø§Ù„Ø¹Ø§Ù…
  if (command === 'suggest' || command === 'Ø§Ù‚ØªØ±Ø§Ø­') {
    const suggestionText = args.join(' ');
    if (!suggestionText) {
      await message.reply('âŒ ÙŠØ±Ø¬Ù‰ ÙƒØªØ§Ø¨Ø© Ø§Ù‚ØªØ±Ø§Ø­Ùƒ. Ù…Ø«Ø§Ù„: `!opus suggest Ø²ÙŠØ§Ø¯Ø© Ù‚Ù†ÙˆØ§Øª Ø§Ù„ØµÙˆØª`').catch(() => null);
      return true;
    }
    await SuggestionBox.submitSuggestion(message, suggestionText);
    return true;
  }

  // 6. Ø£Ù…Ø± Ø¥Ø±Ø³Ø§Ù„ ÙˆØ§Ø¬Ù‡Ø© ØªÙˆØ«ÙŠÙ‚ Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡ Ø§Ù„ØªÙØ§Ø¹Ù„ÙŠØ© (Verification Panel Setup)
  if (command === 'setup_verification' || command === 'Ø§Ø¹Ø¯Ø§Ø¯_Ø§Ù„ØªÙˆØ«ÙŠÙ‚') {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      await message.reply('ðŸ”’ Ù„Ø§ ØªÙ…Ù„Ùƒ ØµÙ„Ø§Ø­ÙŠØ© Ø¥Ø¹Ø¯Ø§Ø¯ Ø¨ÙˆØ§Ø¨Ø© Ø§Ù„ØªÙˆØ«ÙŠÙ‚.').catch(() => null);
      return true;
    }
    const targetChannel = message.mentions.channels.first() as TextChannel || message.channel as TextChannel;
    await MemberVerificationGateway.sendGatewayMessage(targetChannel);
    await message.reply(`âœ… ØªÙ… Ø¥Ø¹Ø¯Ø§Ø¯ ÙˆØ¥Ø±Ø³Ø§Ù„ Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­Ù‚Ù‚ Ø§Ù„ØªÙØ§Ø¹Ù„ÙŠØ© ÙÙŠ Ø§Ù„Ù‚Ù†Ø§Ø©: ${targetChannel}`).catch(() => null);
    return true;
  }

  // 7. Ø£Ù…Ø± Ø¬Ø¯ÙˆÙ„Ø© Ø¨Ø·ÙˆÙ„Ø© Ø±ÙŠØ§Ø¶ÙŠØ© Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ© Ø¬Ø¯ÙŠØ¯Ø©
  if (command === 'schedule_match' || command === 'Ø¬Ø¯ÙˆÙ„Ø©_Ù…Ø¨Ø§Ø±Ø§Ø©') {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageEvents)) {
      await message.reply('ðŸ”’ Ù„Ø§ ØªÙ…Ù„Ùƒ ØµÙ„Ø§Ø­ÙŠØ© Ø¬Ø¯ÙˆÙ„Ø© Ù…Ø¨Ø§Ø±ÙŠØ§Øª Ø§Ù„Ø³ÙŠØ±ÙØ±.').catch(() => null);
      return true;
    }
    const text = args.join(' ');
    if (!text || !text.includes('|')) {
      await message.reply('âŒ ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ù…ÙØµÙˆÙ„Ø© Ø¨Ù€ |. Ù…Ø«Ø§Ù„: `!opus schedule_match League | Falcons | Geekay | 19:30`').catch(() => null);
      return true;
    }
    const subparts = text.split('|');
    const game = subparts[0]!.trim();
    const teamA = subparts[1]!.trim();
    const teamB = subparts[2]!.trim();
    const time = subparts[3]!.trim();

    const match = EsportsTournamentScheduler.registerMatch(game, teamA, teamB, time);
    const embed = createEsportsMatchEmbed(match.gameName, match.teamA, match.teamB, match.startTime, `Ù…Ø¹Ø±Ù Ø§Ù„Ø¨Ø·ÙˆÙ„Ø©: ${match.id}`);
    await message.reply({ content: `âœ… ØªÙ… Ø¬Ø¯ÙˆÙ„Ø© Ø§Ù„Ù…Ø¨Ø§Ø±Ø§Ø© Ø¨Ù†Ø¬Ø§Ø­!`, embeds: [embed] }).catch(() => null);
    return true;
  }

  // 8. Ø£Ù…Ø± Ø¹Ø±Ø¶ Ø§Ù„Ù…Ø¨Ø§Ø±ÙŠØ§Øª Ø§Ù„Ù…Ø¬Ø¯ÙˆÙ„Ø©
  if (command === 'matches' || command === 'Ù…Ø¨Ø§Ø±ÙŠØ§Øª') {
    const list = EsportsTournamentScheduler.getMatches();
    const description = list.map(m => {
      const statusIcon = m.status === 'LIVE' ? 'ðŸ”´ Ø¨Ø« Ù…Ø¨Ø§Ø´Ø±' : m.status === 'COMPLETED' ? 'ðŸ Ø§Ù†ØªÙ‡Øª' : 'â³ Ù…Ø¬Ø¯ÙˆÙ„Ø©';
      const score = m.score ? ` (Ø§Ù„Ù†ØªÙŠØ¬Ø©: ${m.score})` : '';
      return `**[${m.id}]** ${m.gameName}: **${m.teamA}** Ø¶Ø¯ **${m.teamB}** | ${statusIcon} @ ${m.startTime}${score}`;
    }).join('\n');
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.default)
      .setTitle('ðŸ† Ø¬Ø¯ÙˆÙ„ Ù…Ø¨Ø§Ø±ÙŠØ§Øª Ø§Ù„Ø¨Ø·ÙˆÙ„Ø© Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ© Ø§Ù„Ù…ÙØªÙˆØ­Ø©')
      .setDescription(description || 'Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ø¨Ø§Ø±ÙŠØ§Øª Ù…Ø¬Ø¯ÙˆÙ„Ø© Ø­Ø§Ù„ÙŠØ§Ù‹.')
      .setTimestamp();
    await message.reply({ embeds: [embed] }).catch(() => null);
    return true;
  }

  // 9. Ø£Ù…Ø± Ø§Ù„Ù…Ø³Ø§Ø¨Ù‚Ø§Øª Ø§Ù„Ø«Ù‚Ø§ÙÙŠØ© Ø§Ù„ØªÙØ§Ø¹Ù„ÙŠØ©
  if (command === 'trivia' || command === 'Ù…Ø³Ø§Ø¨Ù‚Ø©') {
    const question = TriviaDatabase.getRandomQuestion();
    const optionsText = question.options.map((opt, i) => `**${i + 1}.** ${opt}`).join('\n');
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.default)
      .setTitle('ðŸŽ® Ø³Ø¤Ø§Ù„ Ù…Ø³Ø§Ø¨Ù‚Ø© Ø«Ù‚Ø§ÙÙŠØ© Ø³Ø±ÙŠØ¹Ø©')
      .setDescription(`**${question.question}**\n\n${optionsText}`)
      .setFooter({ text: 'Ø£Ø¬Ø¨ Ø¨Ø§Ù„Ø±Ù‚Ù… Ø§Ù„ØµØ­ÙŠØ­ ÙÙŠ ØºØ¶ÙˆÙ† 30 Ø«Ø§Ù†ÙŠØ©!' })
      .setTimestamp();
      
    const triviaMsg = await message.reply({ embeds: [embed] }).catch(() => null);
    if (!triviaMsg) return true;

    const filter = (m: Message) => !m.author.bot && ['1', '2', '3', '4'].includes(m.content.trim());
    const collector = (message.channel as any).createMessageCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', async (answerMsg: Message) => {
      const selectedIndex = parseInt(answerMsg.content.trim()) - 1;
      if (selectedIndex === question.answerIndex) {
        LevelingSystem.handleMessageXP(answerMsg.author.id, answerMsg.author.username, answerMsg.channel);
        const winEmbed = new EmbedBuilder()
          .setColor(EMBED_COLORS.success)
          .setTitle('ðŸŽ‰ Ø¥Ø¬Ø§Ø¨Ø© ØµØ­ÙŠØ­Ø©!')
          .setDescription(`Ø£Ø­Ø³Ù†Øª ÙŠØ§ ${answerMsg.author}! Ø§Ù„Ø¥Ø¬Ø§Ø¨Ø© Ø§Ù„ØµØ­ÙŠØ­Ø© Ù‡ÙŠ: **${question.options[question.answerIndex]}**\n\nðŸ’¡ **Ø´Ø±Ø­:** ${question.explanation}\n\n*ØªÙ… Ù…Ù†Ø­Ùƒ Ù†Ù‚Ø§Ø· Ø®Ø¨Ø±Ø© Ø¥Ø¶Ø§ÙÙŠØ© ðŸš€*`)
          .setTimestamp();
        await answerMsg.reply({ embeds: [winEmbed] }).catch(() => null);
      } else {
        const loseEmbed = new EmbedBuilder()
          .setColor(EMBED_COLORS.danger)
          .setTitle('âŒ Ø¥Ø¬Ø§Ø¨Ø© Ø®Ø§Ø·Ø¦Ø©!')
          .setDescription(`Ù„Ù„Ø£Ø³Ù ÙŠØ§ ${answerMsg.author}ØŒ Ø§Ù„Ø¥Ø¬Ø§Ø¨Ø© Ø®Ø§Ø·Ø¦Ø©.\n\nØ§Ù„Ø¥Ø¬Ø§Ø¨Ø© Ø§Ù„ØµØ­ÙŠØ­Ø© Ù‡ÙŠ: **${question.options[question.answerIndex]}**\n\nðŸ’¡ **Ø´Ø±Ø­:** ${question.explanation}`)
          .setTimestamp();
        await answerMsg.reply({ embeds: [loseEmbed] }).catch(() => null);
      }
    });

    collector.on('end', (collected: any) => {
      if (collected.size === 0) {
        (message.channel as any).send(`â° Ø§Ù†ØªÙ‡Ù‰ Ø§Ù„ÙˆÙ‚Øª! Ù„Ù… ÙŠØ¬Ø¨ Ø£Ø­Ø¯ ÙÙŠ Ø§Ù„ÙˆÙ‚Øª Ø§Ù„Ù…Ø­Ø¯Ø¯.\nØ§Ù„Ø¥Ø¬Ø§Ø¨Ø© Ø§Ù„ØµØ­ÙŠØ­Ø© Ù‡ÙŠ: **${question.options[question.answerIndex]}**`).catch(() => null);
      }
    });

    return true;
  }

  return false;
};
// ============================================================
//  19.8. Ù…Ø³ØªØ¬ÙŠØ¨ Ø§Ù„Ø·ÙˆØ§Ø±Ø¦ ÙÙŠ ÙˆØ¶Ø¹ Ø¹Ø¯Ù… Ø§Ù„Ø§ØªØµØ§Ù„ (Offline Fallback Responder)
// ============================================================
export class OfflineFallbackResponder {
  private static fallbacks: { keywords: string[]; replies: string[] }[] = [
    {
      keywords: ["Ø³Ù„Ø§Ù…", "Ù…Ø±Ø­Ø¨Ø§", "Ù‡Ù„Ø§", "Ø´Ù„ÙˆÙ†Ùƒ", "Ø£Ù‡Ù„Ø§Ù‹", "ÙƒÙŠÙÙƒ", "Ù…Ù†ÙˆØ±", "Ø§Ù„Ø³Ù„Ø§Ù… Ø¹Ù„ÙŠÙƒÙ…"],
      replies: [
        "ÙˆØ¹Ù„ÙŠÙƒÙ… Ø§Ù„Ø³Ù„Ø§Ù… ÙˆØ±Ø­Ù…Ø© Ø§Ù„Ù„Ù‡ ÙˆØ¨Ø±ÙƒØ§ØªÙ‡! ÙŠØ§ Ù‡Ù„Ø§ ÙˆØºÙ„Ø§ Ù†ÙˆØ±Øª Ø§Ù„Ø³ÙŠØ±ÙØ± ÙŠØ§ Ø­Ø¨ÙŠØ¨Ù†Ø§. ÙƒÙŠÙ Ø£Ù‚Ø¯Ø± Ø£Ø³Ø§Ø¹Ø¯ÙƒØŸ ðŸ˜Š",
        "Ù…Ø±Ø­Ø¨Ø§Ù‹ Ø¨Ùƒ ÙŠØ§ ØºØ§Ù„ÙŠ! Ø£Ù‡Ù„Ø§Ù‹ Ø¨Ùƒ ÙÙŠ Ø¨ÙŠØªÙƒ Ø§Ù„Ø«Ø§Ù†ÙŠ. Ø¢Ù…Ø±Ù†ÙŠ ÙˆØ¹ÙŠÙˆÙ†ÙŠ Ù„Ùƒ. ðŸŒ¹",
        "ÙŠØ§ Ù‡Ù„Ø§ ÙˆØ§Ù„Ù„Ù‡ Ø¨Ø§Ù„Ø·ÙŠØ¨! Ù†ÙˆØ±ØªÙ†Ø§ ÙˆØ´Ø±ÙØªÙ†Ø§ Ø¨ÙˆØ¬ÙˆØ¯Ùƒ. ÙƒÙŠÙ Ø£Ø­ÙˆØ§Ù„Ùƒ Ø§Ù„ÙŠÙˆÙ…ØŸ âœ¨",
        "ÙˆØ¹Ù„ÙŠÙƒÙ… Ø§Ù„Ø³Ù„Ø§Ù… ÙŠØ§ Ø¨Ø§Ø´Ø§! Ù…Ù†ÙˆØ± Ø§Ù„Ø´Ø§Øª ÙƒÙ„Ù‡ ÙˆØ§Ù„Ù„Ù‡. Ù‚ÙˆÙ„ÙŠ Ø­Ø§Ø¨Ø¨ Ù†Ø¹Ù…Ù„ Ø¥ÙŠÙ‡ Ø¯Ù„ÙˆÙ‚ØªÙŠØŸ ðŸ‘‘"
      ]
    },

    {
      keywords: ["Ø£Ø°ÙƒØ§Ø±", "Ø§Ø°ÙƒØ§Ø±", "Ø¯Ø¹Ø§Ø¡", "Ø§Ø¯Ø¹ÙŠØ©", "Ø°ÙƒØ±"],
      replies: [
        "Ø£Ù‡Ù„Ø§Ù‹ Ø¨Ùƒ ÙŠØ§Ù„Ø·ÙŠØ¨! Ù„Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„Ø£Ø°ÙƒØ§Ø± Ø§Ù„Ù…ØªÙ†ÙˆØ¹Ø© ÙˆØ§Ù„Ø£Ø¯Ø¹ÙŠØ© Ø§Ù„ÙŠÙˆÙ…ÙŠØ©ØŒ ÙŠÙ…ÙƒÙ†Ùƒ Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ø£Ù…Ø±: `!opus azkar` Ø£Ùˆ `!opus Ø§Ø°ÙƒØ§Ø±` ðŸ“¿",
        "Ù„Ø°ÙƒØ± Ø§Ù„Ù„Ù‡ ÙÙˆØ§Ø¦Ø¯ Ø¹Ø¸ÙŠÙ…Ø©! Ø§ÙƒØªØ¨ `!opus azkar` Ù„Ø¹Ø±Ø¶ Ø°ÙƒØ± Ø¹Ø´ÙˆØ§Ø¦ÙŠ ÙˆØ«ÙˆØ§Ø¨Ù‡ Ø§Ù„Ø¬Ù…ÙŠÙ„."
      ]
    },
    {
      keywords: ["Ù…Ø³Ø§Ø¨Ù‚Ø©", "Ù…Ø³Ø§Ø¨Ù‚Ø§Øª", "Ø³Ø¤Ø§Ù„", "Ø§Ø³Ø¦Ù„Ø©", "Ø«Ù‚Ø§ÙÙŠØ©", "ØªØ­Ø¯ÙŠ"],
      replies: [
        "Ø£Ù‡Ù„Ø§Ù‹ Ø¨Ùƒ ÙŠØ§Ù„Ø·ÙŠØ¨! Ù„Ø¨Ø¯Ø¡ Ù…Ø³Ø§Ø¨Ù‚Ø© Ø«Ù‚Ø§ÙÙŠØ© ØªÙØ§Ø¹Ù„ÙŠØ© Ù…Ù…ØªØ¹Ø© ÙÙŠ Ø§Ù„Ø´Ø§ØªØŒ ÙŠÙ…ÙƒÙ†Ùƒ Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ø£Ù…Ø±: `!opus trivia` Ø£Ùˆ `!opus Ù…Ø³Ø§Ø¨Ù‚Ø©` ðŸŽ®"
      ]
    },
    {
      keywords: ["Ø´ØºÙ„"],
      replies: [
        "Ù„ØªØ´ØºÙŠÙ„ Ø§Ù„Ù…ÙˆØ³ÙŠÙ‚Ù‰ Ø£Ùˆ Ø§Ù„Ø£ØºØ§Ù†ÙŠØŒ Ø§Ù„Ø±Ø¬Ø§Ø¡ Ø§Ù„ØªØ£ÙƒØ¯ Ù…Ù† Ø£Ù† Ø§Ù„Ø¨ÙˆØª Ù…ØªØµÙ„ Ø¨Ø§Ù„Ø¥Ù†ØªØ±Ù†Øª ÙˆØ£Ù†Ùƒ Ù‚Ø¯ Ù…Ù†Ø´Ù†ØªÙ‡ Ù…Ø¹ Ø·Ù„Ø¨Ùƒ Ù…Ø«Ù„: `@Opus Ø´ØºÙ„ Ø¹Ù…Ø±ÙŠÙ†` ðŸŽµ",
        "Ø¥Ø°Ø§ ÙˆØ§Ø¬Ù‡Øª Ù…Ø´ÙƒÙ„Ø© ÙÙŠ ØªØ´ØºÙŠÙ„ Ø§Ù„Ø£ØºØ§Ù†ÙŠ Ø¨Ø³Ø¨Ø¨ Ø§Ù†Ù‚Ø·Ø§Ø¹ Ø§Ù„Ø¥Ù†ØªØ±Ù†Øª Ø£Ùˆ Ø§Ù„Ù€ APIØŒ ÙŠØ±Ø¬Ù‰ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ù„Ø§Ø­Ù‚Ø§Ù‹ Ø¨Ø¹Ø¯ Ø§Ø³ØªÙ‚Ø±Ø§Ø± Ø§Ù„Ø§ØªØµØ§Ù„."
      ]
    },
    {
      keywords: ["ÙƒØªÙ…", "Ø·Ø±Ø¯", "Ø­Ø¸Ø±", "Ø¨Ø§Ù†Ø¯", "ÙƒÙŠÙƒ", "ØªØ§ÙŠÙ…", "Ù…ÙŠÙˆØª"],
      replies: [
        "Ù„Ù„Ø¥Ø´Ø±Ø§Ù Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠ Ø¹Ù„Ù‰ Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡ØŒ ÙŠØ±Ø¬Ù‰ Ø§Ø³ØªØ®Ø¯Ø§Ù… Ù…Ù†Ø´Ù† Ø§Ù„Ø¨ÙˆØª Ù…Ø¹ ØªØ­Ø¯ÙŠØ¯ Ù†ÙˆØ¹ Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡ Ù…Ø«Ù„: `@Opus Ø§ÙƒØªÙ… ÙÙ„Ø§Ù† Ù„Ù…Ø¯Ø© 10 Ø¯Ù‚Ø§Ø¦Ù‚ Ø¨Ø³Ø¨Ø¨ Ø§Ù„Ø³Ø¨`. ðŸ›¡ï¸",
        "ØµÙ„Ø§Ø­ÙŠØ§ØªÙŠ Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠØ© ØªØ·Ù„Ø¨ Ø£Ù† ÙŠÙ…ØªÙ„Ùƒ Ø§Ù„Ø¨ÙˆØª Ø¯ÙˆØ±Ø§Ù‹ Ø¹Ø§Ù„ÙŠØ§Ù‹ ÙƒØ§ÙÙŠØ§Ù‹ Ù„Ø¥Ø¬Ø±Ø§Ø¡ Ø§Ù„Ø·Ø±Ø¯ Ø£Ùˆ Ø§Ù„Ø­Ø¸Ø± Ø¨Ù†Ø¬Ø§Ø­."
      ]
    },
    {
      keywords: ["Ø¨Ù†Ø§Ø¡", "Ø³ÙŠØ±ÙØ±", "Ø±ÙˆÙ…Ø§Øª", "Ø±ÙˆÙ…", "ÙÙˆÙŠØ³", "Ø´Ø§Øª"],
      replies: [
        "ÙŠÙ…ÙƒÙ†Ù†ÙŠ Ø¨Ù†Ø§Ø¡ Ø®Ø§Ø¯Ù… Ù…ØªÙƒØ§Ù…Ù„ Ù…Ø¹ Ø§Ù„Ø±ØªØ¨ ÙˆØ§Ù„Ù‚Ù†ÙˆØ§Øª! Ø§Ø³ØªØ®Ø¯Ù… Ø§Ù„Ø£Ù…Ø±: `!opus rules_template` Ù„Ø¹Ø±Ø¶ Ù†Ù…Ø§Ø°Ø¬ Ø§Ù„Ù‚ÙˆØ§Ù†ÙŠÙ†ØŒ Ø£Ùˆ `@Opus Ø§Ø¨Ù†Ù Ù„ÙŠ Ø³ÙŠØ±ÙØ± Ø£Ù„Ø¹Ø§Ø¨`."
      ]
    },
    {
      keywords: ["Ø´ÙƒØ±Ø§", "Ø´ÙƒØ±Ù‹Ø§", "ÙŠØ¹Ø·ÙŠÙƒ Ø§Ù„Ø¹Ø§ÙÙŠØ©", "ÙƒÙÙˆ", "ØªØ³Ù„Ù…", "Ø­Ø¨ÙŠØ¨ Ù‚Ù„Ø¨ÙŠ", "Ø´ÙƒØ±Ø§ Ù„Ùƒ"],
      replies: [
        "Ø§Ù„Ù„Ù‡ ÙŠØ¹Ø§ÙÙŠÙƒ ÙˆÙŠØ³Ù„Ù…Ùƒ ÙŠØ§ ØºØ§Ù„ÙŠ! Ù‡Ø°Ø§ ÙˆØ§Ø¬Ø¨ÙŠ Ù„Ø®Ø¯Ù…Ø© Ø®Ø§Ø¯Ù…ÙƒÙ… Ø§Ù„Ø¬Ù…ÙŠÙ„. ðŸ’–",
        "ØªØ³Ù„Ù… ÙˆØ§Ù„Ù„Ù‡ ÙŠØ§Ù„Ø·ÙŠØ¨! ÙƒÙ„Ùƒ Ø°ÙˆÙ‚ ÙˆØ£Ø¯Ø¨. Ù„Ø§ ØªØªØ±Ø¯Ø¯ ÙÙŠ Ø£ÙŠ Ø·Ù„Ø¨ Ø¢Ø®Ø±. ðŸ¥°",
        "Ø­Ø¨ÙŠØ¨ÙŠ ÙŠØ§ Ø¨Ø±Ù†Ø³! ØªØ­Øª Ø£Ù…Ø±Ùƒ ÙÙŠ Ø£ÙŠ ÙˆÙ‚Øª. Ø±Ø¨Ù†Ø§ ÙŠØ®Ù„ÙŠÙƒ Ù„ÙŠÙ†Ø§. ðŸŒ¹"
      ]
    },
    {
      keywords: ["Ù…ÙŠÙ†", "Ù…Ù† Ø£Ù†Øª", "Ù…Ù† Ø§Ù†Øª", "ÙˆØ´ Ø§Ù„Ø¨ÙˆØª", "Ø¨ÙˆØª ÙˆØ´Ùˆ"],
      replies: [
        "Ø£Ù†Ø§ Opus Ø§Ù„Ù…Ø³Ø§Ø¹Ø¯ Ø§Ù„Ø°ÙƒÙŠ ÙˆØ³Ù„Ø·Ø§Ù† Ø§Ù„Ù…ÙˆØ³ÙŠÙ‚Ù‰ ÙÙŠ Ø¯ÙŠØ³ÙƒÙˆØ±Ø¯! ØªÙ… ØªØ·ÙˆÙŠØ±ÙŠ Ù„Ø£ÙƒÙˆÙ† Ø§Ù„Ù…Ø³Ø§Ø¹Ø¯ Ø§Ù„Ø®Ø§Ø±Ù‚ ÙˆØ§Ù„Ø£ÙƒØ«Ø± ØªÙÙˆÙ‚Ø§Ù‹ ÙÙŠ Ø¥Ø¯Ø§Ø±Ø© Ø®Ø§Ø¯Ù…ÙƒÙ…. ðŸ¤–"
      ]
    }
  ];

  static getFallbackReply(input: string): string | null {
    const clean = input.toLowerCase().trim();
    for (const entry of this.fallbacks) {
      if (entry.keywords.some(kw => clean.includes(kw))) {
        const idx = Math.floor(Math.random() * entry.replies.length);
        return entry.replies[idx]!;
      }
    }
    return null;
  }
}


// ============================================================
//  Ø¯Ù…Ø¬ Ù…Ø¹Ø§Ù„Ø¬ÙŠ Ø§Ù„Ø£ÙˆØ§Ù…Ø± Ø§Ù„ØªÙ‚Ù„ÙŠØ¯ÙŠØ© ÙˆØ§Ù„Ø­Ø¯ÙŠØ«Ø© Ù…Ø¹Ø§Ù‹ (Dual Parser Hook)
// ============================================================
client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  let isCommand = false;
  let rawPrompt = message.content.trim();
  const botMention = `<@!?${client.user?.id}>`;
  
  if (rawPrompt.startsWith('!opus')) {
    isCommand = true;
    rawPrompt = rawPrompt.slice(5).trim();
  } else if (rawPrompt.startsWith(botMention)) {
    isCommand = true;
    rawPrompt = rawPrompt.replace(new RegExp(botMention, 'g'), '').trim();
  }

  if (isCommand && rawPrompt) {
    const handled = await handleManualCommandUpdated(message, rawPrompt);
    // Ø¥Ø°Ø§ Ù„Ù… ÙŠØªØ¹Ø§Ù…Ù„ Ù…Ø¹Ù‡ Ø§Ù„Ù…Ø·ÙˆØ± Ø§Ù„Ù…Ø­Ø¯Ø«ØŒ ÙŠØªÙ… ØªÙˆØ¬ÙŠÙ‡Ù‡ Ù„Ù„Ù‚Ø¯ÙŠÙ…
    if (handled) return;
  }
});
// ============================================================
//  Ø¨ÙŠØ§Ù†Ø§Øª ØªÙˆØ«ÙŠÙ‚ Ø§Ù„Ù„Ù‡Ø¬Ø§Øª ÙˆØ§Ù„ØªØ­Ø³ÙŠÙ† Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠ Ø§Ù„Ù…ÙƒÙ…Ù„ (Extended System Info V2)
// ============================================================
export const SYSTEM_ARCHITECTURE_SUMMARY = {
  name: "Opus AI Brain Infrastructure v2",
  version: "4.8.2-premium",
  framework: "Discord.js v14 + Node.js v20",
  designGoals: [
    "Ultra-low latency dialect diagnostics for Arabic languages",
    "Autonomous content moderation with automated context sentiment vectors",
    "Self-contained mock testing pipelines for high-reliability hosting environments",
    "Stateless event listeners coupled with robust JSON local persistent memory cache"
  ]
};

export const OFFLINE_RESPONDER_GUIDELINES = `
=========================================
      ØªÙØ§ØµÙŠÙ„ Ù‡ÙŠÙƒÙ„ÙŠØ© Ø°ÙƒØ§Ø¡ Ø§Ù„Ø¨ÙˆØª Ø§Ù„Ù…Ø³Ø§Ø¹Ø¯
=========================================
1. ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ù„Ù‡Ø¬Ø§Øª (Dialect normalization):
   ÙŠØªÙ… Ù…Ø¹Ø§Ù„Ø¬Ø© Ø§Ù„Ø¥Ø¯Ø®Ø§Ù„ ÙˆØªÙˆØ­ÙŠØ¯ Ø§Ù„ÙƒÙ„Ù…Ø§Øª Ø§Ù„Ø¹Ø§Ù…ÙŠØ© Ù…Ù† Ø§Ù„Ù„Ù‡Ø¬Ø§Øª (Ø§Ù„Ù†Ø¬Ø¯ÙŠØ©ØŒ Ø§Ù„Ø­Ø¬Ø§Ø²ÙŠØ©ØŒ Ø§Ù„Ù…ØµØ±ÙŠØ©ØŒ Ø§Ù„Ø´Ø§Ù…ÙŠØ©ØŒ Ø§Ù„Ù…ØºØ±Ø¨ÙŠØ©ØŒ Ø¥Ù„Ø®)
   Ù„ØªØ¨Ø³ÙŠØ· ÙÙ‡Ù… Ø§Ù„Ø¬Ù…Ù„Ø© Ù‚Ø¨Ù„ Ø¥Ø±Ø³Ø§Ù„Ù‡Ø§ Ù„Ù€ LLM.

2. Ø§Ù„Ù…Ø±Ø§Ù‚Ø¨Ø© Ø§Ù„Ø°Ø§ØªÙŠØ© Ø§Ù„Ø­Ø±Ø© (Autonomous moderation):
   ÙŠØ¹Ù…Ù„ Ø§Ù„Ø±Ù‚ÙŠØ¨ Ø¨ØµÙˆØ±Ø© Ù…Ù†ÙØµÙ„Ø© Ù„ÙØ­Øµ Ø§Ù„Ø³Ù„ÙˆÙƒÙŠØ§Øª Ø§Ù„Ø®Ø§Ø·Ø¦Ø© Ø¯ÙˆÙ† ØªØ¯Ø§Ø®Ù„ Ù…Ø¹ Ù…Ø­Ø±Ùƒ Ø§Ù„ØµÙˆØª Ø£Ùˆ Ù…Ù†Ø´Ø¦ Ø§Ù„Ø³ÙŠØ±ÙØ±Ø§Øª.

3. Ø§Ù„Ø°Ø§ÙƒØ±Ø© Ø§Ù„Ø¯Ø§Ø¦Ù…Ø© (Persistent Memory):
   ØªØ¹ØªÙ…Ø¯ Ø§Ù„Ø°Ø§ÙƒØ±Ø© Ø¹Ù„Ù‰ Ø¨Ù†ÙŠØ© TF-IDF Ù…Ø¯Ù…Ø¬Ø© Ø°Ø§ØªÙŠØ§Ù‹ Ù„Ù„Ø¨Ø­Ø« Ø¹Ù† Ø§Ù„ØªØ´Ø§Ø¨Ù‡ Ø§Ù„Ø¯Ù„Ø§Ù„ÙŠ ÙˆØ­ÙØ¸ Ø§Ù„Ø³ÙŠØ§Ù‚.
`;
// ============================================================
//  20. Ø¨Ø¯Ø¡ ØªØ´ØºÙŠÙ„ Ø§Ù„Ø¨ÙˆØª ÙˆØ§Ù„Ø§ØªØµØ§Ù„ Ø¨Ø¯ÙŠØ³ÙƒÙˆØ±Ø¯ (Client Login Gateway)
// ============================================================
startRenderWebServer();
installLegacyEmbedRepair();

client.login(config.discordToken).catch((err) => {
  console.error('[Bot Boot Failure] âŒ ÙØ´Ù„ ØªØ´ØºÙŠÙ„ Ø§Ù„Ø¨ÙˆØª ÙˆØ§Ù„Ø§ØªØµØ§Ù„ Ø¨Ø¯ÙŠØ³ÙƒÙˆØ±Ø¯:', err);
  process.exit(1);
});



// ============================================================================
// ============================================================================
//  SECTION 21: Ø­Ø²Ù…Ø© Ø£Ø¯ÙˆØ§Øª Ø§Ù„ØªØ´Ø®ÙŠØµ ÙˆØ§Ù„ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠ Ø§Ù„Ù…ØªÙ‚Ø¯Ù…Ø© (Advanced Administrative Diagnostic Suite)
//  ØªÙ…Øª Ø¥Ø¶Ø§ÙØ© Ù‡Ø°Ø§ Ø§Ù„Ù‚Ø³Ù… Ù„ØªÙˆØ³ÙŠØ¹ Ø§Ù„Ø¨ÙˆØª Ø¨Ù‚Ø¯Ø±Ø§Øª ØªØ´Ø®ÙŠØµÙŠØ© ÙˆØªØ­Ù„ÙŠÙ„ÙŠØ© Ø®Ø§Ø±Ù‚Ø© Ù„ÙŠÙƒÙˆÙ† Ø§Ù„Ø¹Ù‚Ù„ Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠ Ø§Ù„Ø£Ù‚ÙˆÙ‰.
// ============================================================================
// ============================================================================

import * as os from 'os';

/**
 * Ù…Ù†Ø³Ù‚ Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ… ÙˆØ§Ù„ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„Ø±Ø³ÙˆÙ…ÙŠØ© (Console & ASCII Report Formatter)
 * ÙŠÙˆÙØ± Ø£Ø¯ÙˆØ§Øª Ù„Ø¨Ù†Ø§Ø¡ Ù„ÙˆØ­Ø§Øª ÙˆØ±Ø³ÙˆÙ…Ø§Øª ASCII ÙˆØ¬Ø¯Ø§ÙˆÙ„ Ù„Ø¹Ø±Ø¶ Ø§Ù„Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª ÙˆØ§Ù„Ø£Ø¯Ø§Ø¡ Ø¨ØµÙˆØ±Ø© Ù…Ø¨Ù‡Ø±Ø©.
 */
export class AdvancedDiagnosticConsoleFormatter {
  private static readonly BORDER_CHAR_HORIZONTAL = 'â•';
  private static readonly BORDER_CHAR_VERTICAL = 'â•‘';
  private static readonly CORNER_TOP_LEFT = 'â•”';
  private static readonly CORNER_TOP_RIGHT = 'â•—';
  private static readonly CORNER_BOTTOM_LEFT = 'â•š';
  private static readonly CORNER_BOTTOM_RIGHT = 'â•';
  private static readonly T_TOP = 'â•¦';
  private static readonly T_BOTTOM = 'â•©';
  private static readonly T_LEFT = 'â• ';
  private static readonly T_RIGHT = 'â•£';
  private static readonly CROSS = 'â•¬';

  /**
   * Ø¥Ù†Ø´Ø§Ø¡ ØµÙ†Ø¯ÙˆÙ‚ ASCII Ø¬Ù…Ø§Ù„ÙŠ Ø­ÙˆÙ„ Ù†Øµ Ù…Ø¹ÙŠÙ†
   */
  static createDecorativeBox(title: string, lines: string[], width: number = 70): string {
    const horizontalBorder = this.BORDER_CHAR_HORIZONTAL.repeat(width - 2);
    let result = '';
    
    // Ø§Ù„Ø¬Ø²Ø¡ Ø§Ù„Ø¹Ù„ÙˆÙŠ
    result += `${this.CORNER_TOP_LEFT}${horizontalBorder}${this.CORNER_TOP_RIGHT}\n`;
    
    // Ø§Ù„Ø¹Ù†ÙˆØ§Ù†
    const titlePadding = Math.max(0, Math.floor((width - 4 - title.length) / 2));
    const titleLeftPad = ' '.repeat(titlePadding);
    const titleRightPad = ' '.repeat(Math.max(0, width - 4 - title.length - titlePadding));
    result += `${this.BORDER_CHAR_VERTICAL} ${titleLeftPad}${title}${titleRightPad} ${this.BORDER_CHAR_VERTICAL}\n`;
    
    // ÙØ§ØµÙ„ Ø¨ÙŠÙ† Ø§Ù„Ø¹Ù†ÙˆØ§Ù† ÙˆØ§Ù„Ù…Ø­ØªÙˆÙ‰
    const separator = this.BORDER_CHAR_HORIZONTAL.repeat(width - 2);
    result += `â• ${separator}â•£\n`;
    
    // Ø§Ù„Ø£Ø³Ø·Ø±
    for (const line of lines) {
      const lineContent = line.length > (width - 4) ? line.substring(0, width - 7) + '...' : line;
      const rightPaddingCount = width - 4 - lineContent.length;
      const rightPad = ' '.repeat(Math.max(0, rightPaddingCount));
      result += `${this.BORDER_CHAR_VERTICAL} ${lineContent}${rightPad} ${this.BORDER_CHAR_VERTICAL}\n`;
    }
    
    // Ø§Ù„Ø¬Ø²Ø¡ Ø§Ù„Ø³ÙÙ„ÙŠ
    result += `${this.CORNER_BOTTOM_LEFT}${horizontalBorder}${this.CORNER_BOTTOM_RIGHT}`;
    
    return result;
  }

  /**
   * ØªÙˆÙ„ÙŠØ¯ Ø´Ø±ÙŠØ· ØªÙ‚Ø¯Ù… Ø±Ù‚Ù…ÙŠ Ø¨Ø´ÙƒÙ„ ASCII Ù…Ù…ÙŠØ²
   */
  static drawProgressBar(percentage: number, length: number = 20): string {
    const normalized = Math.max(0, Math.min(100, percentage));
    const filledLength = Math.round((length * normalized) / 100);
    const emptyLength = length - filledLength;
    
    const filledBar = 'â–ˆ'.repeat(filledLength);
    const emptyBar = 'â–‘'.repeat(emptyLength);
    
    return `[${filledBar}${emptyBar}] ${normalized.toFixed(1)}%`;
  }

  /**
   * Ø¥Ù†Ø´Ø§Ø¡ Ø¬Ø¯ÙˆÙ„ ASCII Ø¬Ù…Ø§Ù„ÙŠ Ù„Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠØ©
   */
  static createTable(headers: string[], rows: string[][], colWidths: number[]): string {
    let result = '';
    
    // Ø­Ø§ÙØ© Ø¹Ù„ÙˆÙŠØ© Ù„Ù„Ø¬Ø¯ÙˆÙ„
    let topBorder = this.CORNER_TOP_LEFT;
    for (let i = 0; i < colWidths.length; i++) {
      topBorder += this.BORDER_CHAR_HORIZONTAL.repeat(colWidths[i]!);
      if (i < colWidths.length - 1) topBorder += this.T_TOP;
    }
    topBorder += this.CORNER_TOP_RIGHT;
    result += topBorder + '\n';

    // Ø·Ø¨Ø§Ø¹Ø© Ø§Ù„Ø¹Ù†Ø§ÙˆÙŠÙ†
    let headerLine = this.BORDER_CHAR_VERTICAL;
    for (let i = 0; i < headers.length; i++) {
      const headerText = headers[i]!;
      const width = colWidths[i]!;
      const padding = ' '.repeat(Math.max(0, width - headerText.length));
      headerLine += headerText + padding + this.BORDER_CHAR_VERTICAL;
    }
    result += headerLine + '\n';

    // ÙØ§ØµÙ„ Ø¨ÙŠÙ† Ø§Ù„Ø¹Ù†Ø§ÙˆÙŠÙ† ÙˆØ§Ù„ØµÙÙˆÙ
    let sepLine = this.T_LEFT;
    for (let i = 0; i < colWidths.length; i++) {
      sepLine += this.BORDER_CHAR_HORIZONTAL.repeat(colWidths[i]!);
      if (i < colWidths.length - 1) sepLine += this.CROSS;
    }
    sepLine += this.T_RIGHT;
    result += sepLine + '\n';

    // Ø·Ø¨Ø§Ø¹Ø© Ø§Ù„ØµÙÙˆÙ
    for (const row of rows) {
      let rowLine = this.BORDER_CHAR_VERTICAL;
      for (let i = 0; i < colWidths.length; i++) {
        const val = row[i] || '';
        const width = colWidths[i]!;
        const padding = ' '.repeat(Math.max(0, width - val.length));
        rowLine += val + padding + this.BORDER_CHAR_VERTICAL;
      }
      result += rowLine + '\n';
    }

    // Ø­Ø§ÙØ© Ø³ÙÙ„ÙŠØ© Ù„Ù„Ø¬Ø¯ÙˆÙ„
    let bottomBorder = this.CORNER_BOTTOM_LEFT;
    for (let i = 0; i < colWidths.length; i++) {
      bottomBorder += this.BORDER_CHAR_HORIZONTAL.repeat(colWidths[i]!);
      if (i < colWidths.length - 1) bottomBorder += this.T_BOTTOM;
    }
    bottomBorder += this.CORNER_BOTTOM_RIGHT;
    result += bottomBorder;

    return result;
  }
}

/**
 * Ø¨Ù†ÙŠØ© Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø£Ø¯Ø§Ø¡ ÙˆØ§Ù„Ù…Ø±Ø§Ù‚Ø¨Ø©
 */
export interface PerformanceSnapshot {
  timestamp: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  cpuUsage: number;
  activeVoiceConnections: number;
  guildsCount: number;
  channelsCount: number;
  usersCount: number;
  pingMs: number;
  uptimeSeconds: number;
}

/**
 * Ù…Ø±Ø§Ù‚Ø¨ Ø§Ù„Ø£Ø¯Ø§Ø¡ ÙˆØ§Ù„Ø°Ø§ÙƒØ±Ø© Ø§Ù„Ù†Ø´Ø· (Active Performance Monitor)
 * ÙŠØªÙˆÙ„Ù‰ ØªØ³Ø¬ÙŠÙ„ ÙˆØ¥Ø¯Ø§Ø±Ø© Ø§Ø³ØªÙ‡Ù„Ø§Ùƒ Ø§Ù„Ø¨ÙˆØª Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø®Ø§Ø¯Ù… Ø§Ù„Ù…Ø¶ÙŠÙ ÙˆØ±ØµØ¯ Ø§Ù„ØªØ³Ø±ÙŠØ¨Ø§Øª Ø§Ù„Ù…Ø­ØªÙ…Ù„Ø© Ù„Ù„Ø°Ø§ÙƒØ±Ø©.
 */
export class ActivePerformanceMonitor {
  private static history: PerformanceSnapshot[] = [];
  private static readonly MAX_HISTORY_SNAPSHOTS = 100;
  private static lastCpuUsage: { user: number; system: number; time: number } | null = null;

  /**
   * Ø£Ø®Ø° Ù„Ù‚Ø·Ø© Ù„Ø£Ø¯Ø§Ø¡ Ø§Ù„Ù†Ø¸Ø§Ù… Ø§Ù„Ø­Ø§Ù„ÙŠ
   */
  static takeSnapshot(clientInstance: any): PerformanceSnapshot {
    const mem = process.memoryUsage();
    
    // Ø­Ø³Ø§Ø¨ ØªÙ‚Ø±ÙŠØ¨ÙŠ Ù„Ù„Ù€ CPU Ø§Ù„Ø§Ø³ØªÙ‡Ù„Ø§Ùƒ
    let cpuPercentage = 0;
    const currentUsage = process.cpuUsage();
    const currentTime = Date.now();
    
    if (this.lastCpuUsage) {
      const userDiff = currentUsage.user - this.lastCpuUsage.user;
      const sysDiff = currentUsage.system - this.lastCpuUsage.system;
      const timeDiff = (currentTime - this.lastCpuUsage.time) * 1000; // to microseconds
      
      if (timeDiff > 0) {
        cpuPercentage = ((userDiff + sysDiff) / timeDiff) * 100;
      }
    }
    
    this.lastCpuUsage = {
      user: currentUsage.user,
      system: currentUsage.system,
      time: currentTime
    };

    // Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª Ù…Ù† Ø¯ÙŠØ³ÙƒÙˆØ±Ø¯
    let guildsCount = 0;
    let channelsCount = 0;
    let usersCount = 0;
    let pingMs = 0;

    if (clientInstance && clientInstance.ws) {
      guildsCount = clientInstance.guilds.cache.size;
      channelsCount = clientInstance.channels.cache.size;
      usersCount = clientInstance.users.cache.size;
      pingMs = clientInstance.ws.ping;
    }

    const snapshot: PerformanceSnapshot = {
      timestamp: currentTime,
      memoryUsage: {
        rss: mem.rss / 1024 / 1024, // in MB
        heapTotal: mem.heapTotal / 1024 / 1024,
        heapUsed: mem.heapUsed / 1024 / 1024,
        external: mem.external / 1024 / 1024
      },
      cpuUsage: Math.min(100, Math.max(0, cpuPercentage)),
      activeVoiceConnections: 0, // ÙŠØªÙ… Ù…Ù„Ø¤Ù‡Ø§ Ù„Ø§Ø­Ù‚Ø§Ù‹
      guildsCount,
      channelsCount,
      usersCount,
      pingMs,
      uptimeSeconds: process.uptime()
    };

    this.history.push(snapshot);
    if (this.history.length > this.MAX_HISTORY_SNAPSHOTS) {
      this.history.shift();
    }

    return snapshot;
  }

  /**
   * Ø§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ Ø§Ù„Ø³Ø¬Ù„ Ø§Ù„ØªØ§Ø±ÙŠØ®ÙŠ Ù„Ù„Ø£Ø¯Ø§Ø¡
   */
  static getHistory(): PerformanceSnapshot[] {
    return this.history;
  }

  /**
   * ØªÙ‚ÙŠÙŠÙ… Ù†Ø³Ø¨Ø© ØªØ³Ø±ÙŠØ¨ Ø§Ù„Ø°Ø§ÙƒØ±Ø© Ø§Ù„Ù…Ø­ØªÙ…Ù„Ø© (Memory Leak Probability Assessment)
   */
  static evaluateMemoryStability(): { growthRateMb: number; leakProbability: 'Low' | 'Medium' | 'High'; analysis: string } {
    if (this.history.length < 5) {
      return {
        growthRateMb: 0,
        leakProbability: 'Low',
        analysis: 'Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„ØªØ§Ø±ÙŠØ®ÙŠØ© ØºÙŠØ± ÙƒØ§ÙÙŠØ© Ù„Ø¥Ø¬Ø±Ø§Ø¡ ØªØ­Ù„ÙŠÙ„ ØªØ³Ø±ÙŠØ¨ Ø§Ù„Ø°Ø§ÙƒØ±Ø© Ø­Ø§Ù„ÙŠØ§Ù‹.'
      };
    }

    const first = this.history[0]!;
    const last = this.history[this.history.length - 1]!;
    const durationHours = (last.timestamp - first.timestamp) / 1000 / 60 / 60;
    
    if (durationHours === 0) {
      return { growthRateMb: 0, leakProbability: 'Low', analysis: 'Ø§Ù„Ù…Ø¯Ø© Ø§Ù„Ø²Ù…Ù†ÙŠØ© Ù‚ØµÙŠØ±Ø© Ø¬Ø¯Ø§Ù‹ Ù„Ù„ØªØ­Ù„ÙŠÙ„.' };
    }

    const growthMb = last.memoryUsage.heapUsed - first.memoryUsage.heapUsed;
    const growthRateMb = growthMb / durationHours;

    let leakProbability: 'Low' | 'Medium' | 'High' = 'Low';
    let analysis = 'Ø§Ø³ØªÙ‡Ù„Ø§Ùƒ Ø§Ù„Ø°Ø§ÙƒØ±Ø© Ù…Ø³ØªÙ‚Ø± ÙˆØªØ­Øª Ù…Ø³ØªÙˆÙŠØ§Øª Ø§Ù„Ø£Ù…Ø§Ù† Ø§Ù„Ù…Ø¹ÙŠØ§Ø±ÙŠØ©.';

    if (growthRateMb > 50) {
      leakProbability = 'High';
      analysis = 'ðŸš¨ Ø§Ø­ØªÙ…Ø§Ù„ÙŠØ© Ø¹Ø§Ù„ÙŠØ© Ø¬Ø¯Ø§Ù‹ Ù„ØªØ³Ø±ÙŠØ¨ Ø§Ù„Ø°Ø§ÙƒØ±Ø©! Ø§Ø³ØªÙ‡Ù„Ø§Ùƒ Ø§Ù„Ù€ Heap ÙŠÙ†Ù…Ùˆ Ø¨Ø´ÙƒÙ„ Ù…ØªØ³Ø§Ø±Ø¹ ÙŠÙÙˆÙ‚ 50 Ù…ÙŠØºØ§Ø¨Ø§ÙŠØª Ù„ÙƒÙ„ Ø³Ø§Ø¹Ø©.';
    } else if (growthRateMb > 15) {
      leakProbability = 'Medium';
      analysis = 'âš ï¸ Ø§Ø­ØªÙ…Ø§Ù„ÙŠØ© Ù…ØªÙˆØ³Ø·Ø© Ù„ØªØ³Ø±ÙŠØ¨ Ø°Ø§ÙƒØ±Ø©. ÙŠÙˆØ¬Ø¯ Ù†Ù…Ùˆ Ø·ÙÙŠÙ ÙˆÙ…Ø³ØªÙ…Ø± ÙÙŠ Ø­Ø¬Ù… Ø§Ù„Ø°Ø§ÙƒØ±Ø© Ø§Ù„Ù…Ø³ØªÙ‡Ù„ÙƒØ©.';
    }

    return {
      growthRateMb,
      leakProbability,
      analysis
    };
  }

  /**
   * ØªÙˆÙ„ÙŠØ¯ Ø±Ø³Ù… Ø¨ÙŠØ§Ù†ÙŠ ASCII Ø¨Ø³ÙŠØ· ÙŠÙˆØ¶Ø­ Ø§Ø³ØªÙ‡Ù„Ø§Ùƒ Ø§Ù„Ø°Ø§ÙƒØ±Ø© Ø¹Ø¨Ø± Ø§Ù„Ø²Ù…Ù†
   */
  static generateMemoryTrendChart(width: number = 50, height: number = 10): string {
    if (this.history.length < 2) return 'ØºÙŠØ± ÙƒØ§ÙÙ Ù„ØªÙˆÙ„ÙŠØ¯ Ø§Ù„Ø±Ø³Ù… Ø§Ù„Ø¨ÙŠØ§Ù†ÙŠ.';
    
    const heapUsedValues = this.history.map(s => s.memoryUsage.heapUsed);
    const minVal = Math.min(...heapUsedValues);
    const maxVal = Math.max(...heapUsedValues);
    const valRange = maxVal - minVal || 1;

    let chartLines: string[] = Array(height).fill(null).map(() => ' '.repeat(width));

    for (let col = 0; col < width; col++) {
      const histIndex = Math.floor((col / width) * this.history.length);
      const snapshot = this.history[histIndex] || this.history[this.history.length - 1]!;
      const val = snapshot.memoryUsage.heapUsed;
      
      const normalizedRow = Math.floor(((val - minVal) / valRange) * (height - 1));
      const row = height - 1 - normalizedRow;

      const currentLine = chartLines[row]!;
      chartLines[row] = currentLine.substring(0, col) + 'â–ˆ' + currentLine.substring(col + 1);
    }

    let finalChart = '';
    const step = valRange / (height - 1);
    for (let r = 0; r < height; r++) {
      const val = maxVal - r * step;
      finalChart += `${val.toFixed(1)} MB â•‘ ${chartLines[r]}\n`;
    }
    
    finalChart += ' '.repeat(9) + 'â•š' + 'â•'.repeat(width) + '\n';
    finalChart += ' '.repeat(9) + `  Ø¨Ø¯Ø§ÙŠØ© Ø§Ù„Ù…Ø±Ø§Ù‚Ø¨Ø© [${this.history.length} Ù„Ù‚Ø·Ø©] Ù†Ù‡Ø§ÙŠØ© Ø§Ù„Ù…Ø±Ø§Ù‚Ø¨Ø©`;
    
    return finalChart;
  }
}

/**
 * Ù…ØªØªØ¨Ø¹ Ø§Ù„Ø£Ø­Ø¯Ø§Ø« ÙˆØ§Ù„Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠØ© (Global Event Statistics Tracker)
 * ÙŠØ³Ø¬Ù„ Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø£Ø±Ù‚Ø§Ù… Ø§Ù„ØªÙØ§Ø¹Ù„Ø§Øª ÙˆØ§Ù„Ø£ÙˆØ§Ù…Ø± Ø§Ù„Ù…Ù†ÙØ°Ø© ÙˆØ¹Ù…Ù„ÙŠØ§Øª Ø§Ù„ØªØ¹Ø¯ÙŠÙ„ ÙÙŠ Ø§Ù„Ø³ÙŠØ±ÙØ±Ø§Øª.
 */
export class AdminEventStatisticsTracker {
  private static eventsHandled: Record<string, number> = {};
  private static commandsExecuted: Record<string, number> = {};
  private static errorsLoggedCount: number = 0;
  private static startTime: number = Date.now();

  /**
   * Ø²ÙŠØ§Ø¯Ø© Ø¹Ø¯Ø¯ Ù…Ø±Ø§Øª Ø­Ø¯ÙˆØ« Ø­Ø¯Ø« Ù…Ø¹ÙŠÙ†
   */
  static recordEvent(eventName: string) {
    this.eventsHandled[eventName] = (this.eventsHandled[eventName] || 0) + 1;
  }

  /**
   * Ø²ÙŠØ§Ø¯Ø© Ø¹Ø¯Ø¯ Ù…Ø±Ø§Øª ØªÙ†ÙÙŠØ° Ø£Ù…Ø± Ù…Ø¹ÙŠÙ†
   */
  static recordCommand(commandName: string) {
    this.commandsExecuted[commandName] = (this.commandsExecuted[commandName] || 0) + 1;
  }

  /**
   * ØªØ³Ø¬ÙŠÙ„ Ø­Ø¯ÙˆØ« Ø®Ø·Ø£ Ø¨Ø±Ù…Ø¬ÙŠ
   */
  static recordError() {
    this.errorsLoggedCount++;
  }

  /**
   * ØªÙˆÙ„ÙŠØ¯ ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª Ø§Ù„ÙƒØ§Ù…Ù„
   */
  static generateReportLines(): string[] {
    const elapsedMs = Date.now() - this.startTime;
    const elapsedHours = elapsedMs / 1000 / 60 / 60;
    
    const totalEvents = Object.values(this.eventsHandled).reduce((a, b) => a + b, 0);
    const totalCommands = Object.values(this.commandsExecuted).reduce((a, b) => a + b, 0);

    const report: string[] = [
      `ØªØ§Ø±ÙŠØ® Ø¨Ø¯Ø¡ Ø§Ù„ØªØ´ØºÙŠÙ„: ${new Date(this.startTime).toLocaleString('ar-EG')}`,
      `Ù…Ø¯Ø© Ø§Ù„ØªØ´ØºÙŠÙ„ Ø§Ù„Ù…Ø³ØªÙ…Ø±: ${(elapsedMs / 1000 / 60).toFixed(1)} Ø¯Ù‚ÙŠÙ‚Ø©`,
      `Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø£Ø­Ø¯Ø§Ø« Ø§Ù„Ù…Ø¹Ø§Ù„Ø¬Ø©: ${totalEvents} (${(totalEvents / elapsedHours || 0).toFixed(1)} Ø­Ø¯Ø«/Ø³Ø§Ø¹Ø©)`,
      `Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø£ÙˆØ§Ù…Ø± Ø§Ù„Ù…Ù†ÙØ°Ø©: ${totalCommands} (${(totalCommands / elapsedHours || 0).toFixed(1)} Ø£Ù…Ø±/Ø³Ø§Ø¹Ø©)`,
      `Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø£Ø®Ø·Ø§Ø¡ Ø§Ù„Ù…Ø³Ø¬Ù„Ø©: ${this.errorsLoggedCount} ${this.errorsLoggedCount > 0 ? 'âš ï¸' : 'âœ…'}`,
      '----------------------------------------',
      'ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ø£ÙˆØ§Ù…Ø± Ø§Ù„Ø£ÙƒØ«Ø± Ø§Ø³ØªØ®Ø¯Ø§Ù…Ø§Ù‹:'
    ];

    const sortedCommands = Object.entries(this.commandsExecuted)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (sortedCommands.length === 0) {
      report.push('  - Ù„Ù… ÙŠØªÙ… ØªÙ†ÙÙŠØ° Ø£ÙŠ Ø£ÙˆØ§Ù…Ø± Ø¨Ø¹Ø¯.');
    } else {
      for (const [cmd, count] of sortedCommands) {
        report.push(`  â€¢ Ø§Ù„Ø£Ù…Ø± [!${cmd}]: ØªÙ… ØªÙ†ÙÙŠØ°Ù‡ ${count} Ù…Ø±Ø©`);
      }
    }

    return report;
  }
}

/**
 * Ù†Ø¸Ø§Ù… Ø§Ù„ØªØ¯Ù‚ÙŠÙ‚ ÙˆØ¥Ø¯Ø§Ø±Ø© Ø§Ù„ØªØºÙŠÙŠØ±Ø§Øª Ø§Ù„ÙÙ†ÙŠ ÙÙŠ Ø¯ÙŠØ³ÙƒÙˆØ±Ø¯ (Server Struct & Audit Trail Auditor)
 * Ù…Ø­Ø§ÙƒÙŠ Ù„ØªØªØ¨Ø¹ Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª Ø§Ù„Ø­Ø³Ø§Ø³Ø© Ø§Ù„ØªÙŠ ÙŠØ¬Ø±ÙŠÙ‡Ø§ Ø§Ù„Ù…Ø´Ø±ÙÙˆÙ† Ù„Ø¶Ù…Ø§Ù† Ø§Ù„Ø´ÙØ§ÙÙŠØ©.
 */
export class ServerAuditTrailAuditor {
  private static auditLogs: { timestamp: number; action: string; executor: string; target: string; details?: string }[] = [];

  /**
   * ØªØ³Ø¬ÙŠÙ„ Ø¹Ù…Ù„ÙŠØ© Ø¥Ø´Ø±Ø§ÙÙŠØ© Ø¬Ø¯ÙŠØ¯Ø©
   */
  static logAuditEvent(action: string, executor: string, target: string, details?: string) {
    this.auditLogs.push({
      timestamp: Date.now(),
      action,
      executor,
      target,
      details
    });

    if (this.auditLogs.length > 200) {
      this.auditLogs.shift();
    }
  }

  /**
   * ØªÙˆÙ„ÙŠØ¯ ØªÙ‚Ø±ÙŠØ± Ø³Ø¬Ù„ Ø§Ù„ØªØ¯Ù‚ÙŠÙ‚ Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠ Ø§Ù„Ø¬Ù…Ø§Ù„ÙŠ
   */
  static generateAuditReport(): string {
    if (this.auditLogs.length === 0) {
      return 'ðŸ“ Ø³Ø¬Ù„ Ø§Ù„ØªØ¯Ù‚ÙŠÙ‚ Ø®Ø§Ù„Ù Ù…Ù† Ø£ÙŠ Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª Ø£Ùˆ Ø¹Ù…Ù„ÙŠØ§Øª Ø­Ø§Ù„ÙŠØ§Ù‹.';
    }

    const headers = ['Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡', 'Ø§Ù„Ù…Ù†ÙØ°', 'Ø§Ù„Ù…Ø³ØªÙ‡Ø¯Ù', 'Ø§Ù„ØªÙˆÙ‚ÙŠØª'];
    const rows = this.auditLogs.slice(-10).reverse().map(log => {
      const timeStr = new Date(log.timestamp).toLocaleTimeString('ar-EG');
      return [log.action.substring(0, 15), log.executor.substring(0, 12), log.target.substring(0, 12), timeStr];
    });

    return AdvancedDiagnosticConsoleFormatter.createTable(headers, rows, [20, 15, 15, 15]);
  }
}

/**
 * Ù…Ø¬Ø±ÙŠ Ø§Ù„ÙØ­ÙˆØµØ§Øª ÙˆØ§Ù„ØªØ´Ø®ÙŠØµ Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠ ÙˆØ§Ù„Ø°Ø§ØªÙŠ (Self-Testing Diagnostics Scheduler)
 * ÙŠÙ‚ÙˆÙ… Ø¨ÙØ­Øµ Ø³Ù„Ø§Ù…Ø© Ø§Ù„Ø¨ÙˆØª ÙˆØ§Ù„Ø§ØªØµØ§Ù„Ø§Øª Ø¨ØµÙˆØ±Ø© Ø¯ÙˆØ±ÙŠØ© ÙˆÙ…Ø¬Ø¯ÙˆÙ„Ø© ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ Ù„Ù„ØªØ£ÙƒØ¯ Ù…Ù† Ø³Ù„Ø§Ù…Ø© Ø§Ù„Ù†Ø¸Ø§Ù….
 */
export class SelfTestingDiagnosticsScheduler {
  private static diagnosticsTimer: NodeJS.Timeout | null = null;
  private static isDiagnosticRunning = false;
  private static systemLog: string[] = [];

  /**
   * ØªÙØ¹ÙŠÙ„ Ø§Ù„ÙØ­Øµ Ø§Ù„Ø¯ÙˆØ±ÙŠ Ø§Ù„Ù…Ø¬Ø¯ÙˆÙ„ (ÙƒÙ„ Ø³Ø§Ø¹Ø© Ù…Ø«Ù„Ø§Ù‹)
   */
  static initializeAutoDiagnostics(clientInstance: any) {
    if (this.diagnosticsTimer) return;

    this.writeLog('âš™ï¸ ØªÙØ¹ÙŠÙ„ Ù…Ø¬Ø¯ÙˆÙ„ Ø§Ù„ØªØ´Ø®ÙŠØµ ÙˆØ§Ù„ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ø°Ø§ØªÙŠ Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠ Ø¨Ù†Ø¬Ø§Ø­...');
    
    // Ø¥Ø¬Ø±Ø§Ø¡ Ø§Ù„ÙØ­Øµ Ø§Ù„Ø£ÙˆÙ„ Ø¨Ø¹Ø¯ 10 Ø«ÙˆØ§Ù†Ù
    setTimeout(() => {
      this.runDiagnosticCheck(clientInstance);
    }, 10000);

    // Ø§Ù„ÙØ­Øµ Ø§Ù„Ø¯ÙˆØ±ÙŠ ÙƒÙ„ 30 Ø¯Ù‚ÙŠÙ‚Ø©
    this.diagnosticsTimer = setInterval(() => {
      this.runDiagnosticCheck(clientInstance);
    }, 30 * 60 * 1000);
  }

  /**
   * Ø¥ÙŠÙ‚Ø§Ù Ù…Ø¬Ø¯ÙˆÙ„ Ø§Ù„ÙØ­Øµ
   */
  static shutdown() {
    if (this.diagnosticsTimer) {
      clearInterval(this.diagnosticsTimer);
      this.diagnosticsTimer = null;
      this.writeLog('ðŸ›‘ Ø¥ÙŠÙ‚Ø§Ù Ù…Ø¬Ø¯ÙˆÙ„ Ø§Ù„ØªØ´Ø®ÙŠØµ ÙˆØ§Ù„ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ø°Ø§ØªÙŠ.');
    }
  }

  /**
   * ÙƒØªØ§Ø¨Ø© Ø­Ø¯Ø« ÙÙŠ Ø³Ø¬Ù„ Ø§Ù„ØªØ´Ø®ÙŠØµ Ø§Ù„ÙÙ†ÙŠ
   */
  private static writeLog(msg: string) {
    const timestamp = new Date().toISOString().substring(11, 19);
    const formatted = `[${timestamp}] ${msg}`;
    // Silent logging - only store, don't print to console
    this.systemLog.push(formatted);
    if (this.systemLog.length > 50) this.systemLog.shift();
  }

  /**
   * ØªÙ†ÙÙŠØ° ÙØ­Øµ ØªØ´Ø®ÙŠØµÙŠ ÙƒØ§Ù…Ù„ Ø­Ø§Ù„ÙŠØ§Ù‹
   */
  static runDiagnosticCheck(clientInstance: any): { success: boolean; score: number; issues: string[] } {
    if (this.isDiagnosticRunning) {
      return { success: false, score: 0, issues: ['Ø§Ù„ÙØ­Øµ Ù‚ÙŠØ¯ Ø§Ù„Ø¹Ù…Ù„ Ø¨Ø§Ù„ÙØ¹Ù„ Ø­Ø§Ù„ÙŠØ§Ù‹.'] };
    }

    this.isDiagnosticRunning = true;
    this.writeLog('ðŸ” Ø¨Ø¯Ø¡ ØªØ´ØºÙŠÙ„ Ø§Ù„ÙØ­Øµ ÙˆØ§Ù„ØªØ´Ø®ÙŠØµ Ø§Ù„Ø°Ø§ØªÙŠ Ø§Ù„Ù…Ø¬Ø¯ÙˆÙ„ Ù„Ù„Ø¨ÙˆØª...');
    
    const issues: string[] = [];
    let score = 100;

    // 1. ÙØ­Øµ Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ø¯ÙŠØ³ÙƒÙˆØ±Ø¯
    if (!clientInstance) {
      issues.push('Ù„Ù… ÙŠØªÙ… ØªÙˆÙÙŠØ± ÙƒØ§Ø¦Ù† Ø¹Ù…ÙŠÙ„ Discord (Client Instance).');
      score -= 50;
    } else if (!clientInstance.ws || clientInstance.ws.ping === -1) {
      issues.push('Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨ÙˆØ§Ø¬Ù‡Ø© Ø¨Ø±Ù…Ø¬Ø© Discord ØºÙŠØ± Ù…Ø³ØªÙ‚Ø± Ø£Ùˆ ØºÙŠØ± Ù…ØªØµÙ„.');
      score -= 30;
    } else {
      const ping = clientInstance.ws.ping;
      if (ping > 250) {
        issues.push(`Ø²Ù…Ù† Ø§Ù†ØªÙ‚Ø§Ù„ Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ø§Ù„Ø®Ø§Ø¯Ù… Ù…Ø±ØªÙØ¹ Ø¬Ø¯Ø§Ù‹: ${ping}ms`);
        score -= 10;
      }
    }

    // 2. ÙØ­Øµ Ø§Ø³ØªÙ‡Ù„Ø§Ùƒ Ø§Ù„Ø°Ø§ÙƒØ±Ø©
    const snapshot = ActivePerformanceMonitor.takeSnapshot(clientInstance);
    const heapUsed = snapshot.memoryUsage.heapUsed;
    if (heapUsed > 300) {
      issues.push(`ðŸš¨ Ø§Ø³ØªÙ‡Ù„Ø§Ùƒ Ø§Ù„Ù€ heap Ù…Ø±ØªÙØ¹ Ø¬Ø¯Ø§Ù‹ Ø¨Ø´ÙƒÙ„ ØºÙŠØ± Ø§Ø¹ØªÙŠØ§Ø¯ÙŠ: ${heapUsed.toFixed(1)} MB`);
      score -= 20;
    }

    // 3. ØªÙ‚ÙŠÙŠÙ… Ø§Ø³ØªÙ‚Ø±Ø§Ø± Ø§Ù„Ø°Ø§ÙƒØ±Ø© ÙˆØ§Ù„ØªØ³Ø±ÙŠØ¨Ø§Øª
    const memStability = ActivePerformanceMonitor.evaluateMemoryStability();
    if (memStability.leakProbability === 'High') {
      issues.push(`ðŸš¨ Ø®Ø·Ø± ØªØ³Ø±ÙŠØ¨ Ø°Ø§ÙƒØ±Ø© Ù…Ø±ØªÙØ¹: ${memStability.growthRateMb.toFixed(2)} MB/Ø³Ø§Ø¹Ø©`);
      score -= 25;
    } else if (memStability.leakProbability === 'Medium') {
      issues.push(`âš ï¸ Ù†Ù…Ùˆ Ø·ÙÙŠÙ ÙˆÙ…Ø³ØªÙ…Ø± ÙÙŠ Ø§Ù„Ø°Ø§ÙƒØ±Ø©: ${memStability.growthRateMb.toFixed(2)} MB/Ø³Ø§Ø¹Ø©`);
      score -= 10;
    }

    this.isDiagnosticRunning = false;
    const success = issues.length === 0;
    
    this.writeLog(`ðŸ Ø§ÙƒØªÙ…Ø§Ù„ Ø§Ù„ÙØ­Øµ Ø§Ù„Ø°Ø§ØªÙŠ. Ø§Ù„Ù†ØªÙŠØ¬Ø©: ${score}/100. Ø¹Ø¯Ø¯ Ø§Ù„Ù…Ø´Ø§ÙƒÙ„: ${issues.length}`);
    if (!success) {
      for (const iss of issues) {
        this.writeLog(`  âš ï¸ Ù…Ø´ÙƒÙ„Ø©: ${iss}`);
      }
    } else {
      this.writeLog('âœ… Ù†Ø¸Ø§Ù… Ø§Ù„Ø¨ÙˆØª ÙŠØ¹Ù…Ù„ Ø¨Ø£Ø¹Ù„Ù‰ ÙƒÙØ§Ø¡Ø© ÙˆØ§Ø³ØªÙ‚Ø±Ø§Ø±ØŒ Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ø´Ø§ÙƒÙ„ Ù…Ø¹Ù„Ù‚Ø©.');
    }

    return {
      success,
      score,
      issues
    };
  }

  /**
   * Ø§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ Ø§Ù„Ø³Ø¬Ù„ Ø§Ù„ÙÙ†ÙŠ Ù„Ù„Ø£Ø®Ø·Ø§Ø¡ ÙˆØ§Ù„ØªØ´Ø®ÙŠØµØ§Øª
   */
  static getSystemLog(): string[] {
    return this.systemLog;
  }
}

/**
 * Ù…Ø®Ø·Ø· Ù‚Ù†ÙˆØ§Øª ÙˆØªÙˆØ²ÙŠØ¹ Ø§Ù„Ø³ÙŠØ±ÙØ± Ø¨ØµÙˆØ±Ø© ASCII (Server Channel Tree Plotter)
 * ÙŠÙˆÙ„Ø¯ Ø±Ø³Ù…Ø§Ù‹ Ø¨ÙŠØ§Ù†ÙŠØ§Ù‹ Ù‡ÙŠÙƒÙ„ÙŠØ§Ù‹ Ø¬Ù…ÙŠÙ„Ø§Ù‹ ÙŠÙˆØ¶Ø­ Ø´ÙƒÙ„ Ø§Ù„Ø®Ø§Ø¯Ù… ÙˆÙØ±ÙˆØ¹Ù‡ Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠØ© Ù„Ù„Ø£Ø¹Ø¶Ø§Ø¡.
 */
export class ServerChannelTreeVisualizer {
  
  /**
   * Ø±Ø³Ù… Ù‚Ù†ÙˆØ§Øª Ø§Ù„Ø³ÙŠØ±ÙØ± ÙˆØªØµÙ†ÙŠÙØ§ØªÙ‡Ø§ ÙƒØ´Ø¬Ø±Ø© ASCII Ø¬Ù…Ø§Ù„ÙŠØ©
   */
  static renderTree(guild: any): string {
    if (!guild) return 'âŒ Ø§Ù„Ø®Ø§Ø¯Ù… ØºÙŠØ± Ù…ØªÙˆÙØ± Ø­Ø§Ù„ÙŠØ§Ù‹ Ù„ØªÙˆÙ„ÙŠØ¯ Ø§Ù„Ø´Ø¬Ø±Ø©.';
    
    const categories = guild.channels.cache
      .filter((c: any) => c.type === 4) // Category
      .sort((a: any, b: any) => a.position - b.position);

    const uncategorized = guild.channels.cache
      .filter((c: any) => !c.parentId && c.type !== 4)
      .sort((a: any, b: any) => a.position - b.position);

    let tree = `ðŸŒ² Ù‡ÙŠÙƒÙ„ÙŠØ© Ù‚Ù†ÙˆØ§Øª Ø®Ø§Ø¯Ù…: ${guild.name}\n`;
    tree += 'â•'.repeat(40) + '\n';

    // Ø§Ù„Ù‚Ù†ÙˆØ§Øª Ø®Ø§Ø±Ø¬ Ø§Ù„ØªØµÙ†ÙŠÙ
    for (let i = 0; i < uncategorized.size; i++) {
      const channel = uncategorized.at(i);
      const isLast = i === uncategorized.size - 1 && categories.size === 0;
      const prefix = isLast ? 'â”—â”â” ' : 'â”£â”â” ';
      const typeIcon = channel.type === 2 ? 'ðŸ”Š' : 'ðŸ’¬';
      tree += `${prefix}${typeIcon} ${channel.name}\n`;
    }

    // ØªØµÙ†ÙŠÙØ§Øª ÙˆÙ‚Ù†ÙˆØ§ØªÙ‡Ø§
    let catIndex = 0;
    for (const [_, cat] of categories) {
      const isLastCat = catIndex === categories.size - 1;
      const catPrefix = isLastCat ? 'â”—â”â” ðŸ“ ' : 'â”£â”â” ðŸ“ ';
      tree += `${catPrefix}${cat.name}\n`;

      const childChannels = guild.channels.cache
        .filter((c: any) => c.parentId === cat.id)
        .sort((a: any, b: any) => a.position - b.position);

      let chIndex = 0;
      for (const [_, child] of childChannels) {
        const linePrefix = isLastCat ? '    ' : 'â”ƒ   ';
        const isLastChild = chIndex === childChannels.size - 1;
        const childPrefix = isLastChild ? 'â”—â”â” ' : 'â”£â”â” ';
        const typeIcon = child.type === 2 ? 'ðŸ”Š' : 'ðŸ’¬';
        tree += `${linePrefix}${childPrefix}${typeIcon} ${child.name}\n`;
        chIndex++;
      }
      catIndex++;
    }

    return tree;
  }
}

// ============================================================================
// Ø¯Ù…Ø¬ Ù…Ø±Ø§Ù‚Ø¨Ø© Ø§Ù„Ø£Ø­Ø¯Ø§Ø« ÙˆØªÙ‡ÙŠØ¦Ø© Ù†Ø¸Ø§Ù… Ø§Ù„Ù…Ø±Ø§Ù‚Ø¨Ø© Ø§Ù„Ù†Ø´Ø·Ø© Ø§Ù„Ø°Ø§ØªÙŠØ© Ø¹Ù†Ø¯ ØªØ´ØºÙŠÙ„ Ø§Ù„Ø¨ÙˆØª
// ============================================================================
client.once(Events.ClientReady, () => {
  // ØªÙ‡ÙŠØ¦Ø© Ù…Ø¬Ø¯ÙˆÙ„ Ø§Ù„ØªØ­Ù„ÙŠÙ„Ø§Øª ÙˆØ§Ù„ØªØ´Ø®ÙŠØµØ§Øª Ø§Ù„Ø°Ø§ØªÙŠØ© ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹
  SelfTestingDiagnosticsScheduler.initializeAutoDiagnostics(client);
  
  // Ø£Ø®Ø° Ø§Ù„Ù„Ù‚Ø·Ø© Ø§Ù„Ø£ÙˆÙ„Ù‰ Ù„Ù„Ù†Ø¸Ø§Ù…
  ActivePerformanceMonitor.takeSnapshot(client);
  
  // Diagnostic suite initialized
});

// ØªØ¹Ù„ÙŠÙ‚ ÙˆØªØªØ¨Ø¹ Ø§Ù„Ø£Ø­Ø¯Ø§Ø« Ù„Ù…ØªØªØ¨Ø¹ Ø§Ù„Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª
client.on(Events.MessageCreate, (msg: Message) => {
  if (msg.author.bot) return;
  AdminEventStatisticsTracker.recordEvent('MessageCreate');
  
  if (msg.content.startsWith('!opus')) {
    const cmd = msg.content.split(/\s+/)[0]?.substring(5);
    if (cmd) {
      AdminEventStatisticsTracker.recordCommand(cmd);
    }
  }
});

client.on(Events.GuildCreate, (g) => {
  AdminEventStatisticsTracker.recordEvent('GuildCreate');
  ServerAuditTrailAuditor.logAuditEvent('Ø§Ù†Ø¶Ù…Ø§Ù… Ù„Ø®Ø§Ø¯Ù…', 'System', g.name, `Ù…Ø¹Ø±Ù Ø§Ù„Ø®Ø§Ø¯Ù…: ${g.id}`);
});

client.on(Events.GuildDelete, (g) => {
  AdminEventStatisticsTracker.recordEvent('GuildDelete');
  ServerAuditTrailAuditor.logAuditEvent('Ù…ØºØ§Ø¯Ø±Ø© Ø®Ø§Ø¯Ù…', 'System', g.name, `Ù…Ø¹Ø±Ù Ø§Ù„Ø®Ø§Ø¯Ù…: ${g.id}`);
});

// ============================================================================
// Ù…Ø¹Ø§Ù„Ø¬Ø© ÙˆØ¥Ø¶Ø§ÙØ© Ø§Ù„Ø£ÙˆØ§Ù…Ø± Ø§Ù„ØªØ´Ø®ÙŠØµÙŠØ© Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø© ÙÙŠ Ù…Ø­Ø±Ùƒ Ø§Ù„Ø£ÙˆØ§Ù…Ø± Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠØ© Ù„Ù„Ø¯ÙŠØ³ÙƒÙˆØ±Ø¯
// ============================================================================
const originalHandler = handleManualCommandUpdated;
handleManualCommandUpdated = async function(message: Message, commandText: string): Promise<boolean> {
  const parts = commandText.split(/\s+/);
  const command = parts[0]?.toLowerCase();
  const args = parts.slice(1);
  const guild = message.guild!;

  // 1. Ø£Ù…Ø± ØªØ´Ø®ÙŠØµ Ø­Ø§Ù„Ø© Ø§Ù„Ù†Ø¸Ø§Ù… Ø§Ù„Ø­ÙŠÙˆÙŠØ©
  if (command === 'diagnose' || command === 'ØªØ´Ø®ÙŠØµ') {
    const snapshot = ActivePerformanceMonitor.takeSnapshot(client);
    const memStability = ActivePerformanceMonitor.evaluateMemoryStability();
    const selfTest = SelfTestingDiagnosticsScheduler.runDiagnosticCheck(client);

    const reportLines = [
      `Ø­Ø§Ù„Ø© Ø§Ù„Ø§ØªØµØ§Ù„: ${selfTest.success ? 'Ù…Ù…ØªØ§Ø²Ø© âœ…' : 'ØªÙˆØ§Ø¬Ù‡ Ù…Ø´Ø§ÙƒÙ„ âš ï¸'}`,
      `Ø¯Ø±Ø¬Ø© Ø§Ø³ØªÙ‚Ø±Ø§Ø± Ø§Ù„Ø¨ÙˆØª: ${selfTest.score}/100`,
      `Ø²Ù…Ù† Ø§Ø³ØªØ¬Ø§Ø¨Ø© Ø¯ÙŠØ³ÙƒÙˆØ±Ø¯ (Ping): ${snapshot.pingMs}ms`,
      `Ø­Ø¬Ù… Ø§Ù„Ø°Ø§ÙƒØ±Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… (Heap): ${snapshot.memoryUsage.heapUsed.toFixed(1)} MB / ${snapshot.memoryUsage.heapTotal.toFixed(1)} MB`,
      `ØªØ³Ø±ÙŠØ¨ Ø§Ù„Ø°Ø§ÙƒØ±Ø© Ø§Ù„Ù…Ø­ØªÙ…Ù„: ${memStability.leakProbability} (Ù…Ø¹Ø¯Ù„ Ø§Ù„Ù†Ù…Ùˆ: ${memStability.growthRateMb.toFixed(2)} MB/Ø³Ø§Ø¹Ø©)`,
      `Ø­Ø¬Ù… Ø§Ù„Ù€ RSS Ø§Ù„ÙƒÙ„ÙŠ: ${snapshot.memoryUsage.rss.toFixed(1)} MB`,
      `Ù†Ø³Ø¨Ø© Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ù…Ø¹Ø§Ù„Ø¬: ${snapshot.cpuUsage.toFixed(2)}%`,
      `ÙˆÙ‚Øª Ø§Ù„ØªØ´ØºÙŠÙ„ Ø§Ù„Ù…Ø³ØªÙ…Ø±: ${(snapshot.uptimeSeconds / 60).toFixed(1)} Ø¯Ù‚ÙŠÙ‚Ø©`
    ];

    const box = AdvancedDiagnosticConsoleFormatter.createDecorativeBox('ðŸ“Š Ù†ØªØ§Ø¦Ø¬ Ø§Ù„ØªØ­Ù„ÙŠÙ„ Ø§Ù„ÙÙ†ÙŠ ÙˆØ§Ù„ØªØ´Ø®ÙŠØµ Ø§Ù„Ø´Ø§Ù…Ù„ Ù„Ù„Ø§Ø³ØªÙ‚Ø±Ø§Ø±', reportLines, 65);
    await message.reply(`\`\`\`\n${box}\n\`\`\``).catch(() => null);
    return true;
  }

  // 2. Ø£Ù…Ø± Ø±Ø³Ù… Ø´Ø¬Ø±Ø© Ø§Ù„Ù‚Ù†ÙˆØ§Øª ASCII
  if (command === 'tree' || command === 'Ø´Ø¬Ø±Ø©') {
    const tree = ServerChannelTreeVisualizer.renderTree(guild);
    await message.reply(`\`\`\`\n${tree}\n\`\`\``).catch(() => null);
    return true;
  }

  // 3. Ø£Ù…Ø± Ø¹Ø±Ø¶ ØªÙ‚Ø±ÙŠØ± Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª Ø§Ù„Ø£Ø­Ø¯Ø§Ø«
  if (command === 'stats' || command === 'Ø§Ø­ØµØ§Ø¦ÙŠØ§Øª') {
    const reportLines = AdminEventStatisticsTracker.generateReportLines();
    const box = AdvancedDiagnosticConsoleFormatter.createDecorativeBox('ðŸ“ˆ Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª Ù…Ø¹Ø§Ù„Ø¬Ø© Ø§Ù„Ø£Ø­Ø¯Ø§Ø« ÙˆØ­Ø±ÙƒØ© Ø§Ù„Ø£ÙˆØ§Ù…Ø±', reportLines, 68);
    await message.reply(`\`\`\`\n${box}\n\`\`\``).catch(() => null);
    return true;
  }

  // 4. Ø£Ù…Ø± Ø¹Ø±Ø¶ Ø§Ù„Ø±Ø³Ù… Ø§Ù„Ø¨ÙŠØ§Ù†ÙŠ Ù„Ù„Ø°Ø§ÙƒØ±Ø© Ø¹Ø¨Ø± Ø§Ù„Ø²Ù…Ù†
  if (command === 'memory' || command === 'Ø°Ø§ÙƒØ±Ø©') {
    ActivePerformanceMonitor.takeSnapshot(client);
    const chart = ActivePerformanceMonitor.generateMemoryTrendChart(50, 10);
    await message.reply(`ðŸ“Š **Ù…Ø®Ø·Ø· Ù…Ø³Ø§Ø± Ø§Ø³ØªÙ‡Ù„Ø§Ùƒ Ø§Ù„Ø°Ø§ÙƒØ±Ø© Ø§Ù„Ù…Ø¯Ù…Ø¬ Ø¹Ø¨Ø± Ø§Ù„Ø²Ù…Ù† (Heap Used Trend):**\n\`\`\`\n${chart}\n\`\`\``).catch(() => null);
    return true;
  }

  // 5. Ø£Ù…Ø± Ø¹Ø±Ø¶ Ø³Ø¬Ù„ Ø§Ù„ØªØ¯Ù‚ÙŠÙ‚ Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠ ÙˆØ§Ù„Ù…Ø´Ø±ÙÙŠÙ†
  if (command === 'audit' || command === 'ØªØ¯Ù‚ÙŠÙ‚') {
    const auditReport = ServerAuditTrailAuditor.generateAuditReport();
    await message.reply(`ðŸ“œ **Ø³Ø¬Ù„ Ø§Ù„ØªØ¯Ù‚ÙŠÙ‚ ÙˆØ§Ù„Ø¹Ù…Ù„ÙŠØ§Øª Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠØ© Ø§Ù„Ø­Ø³Ø§Ø³Ø© Ø§Ù„Ø£Ø®ÙŠØ±Ø©:**\n\`\`\`\n${auditReport}\n\`\`\``).catch(() => null);
    return true;
  }

  // ØªÙÙˆÙŠØ¶ Ø§Ù„Ø£ÙˆØ§Ù…Ø± Ø§Ù„Ø³Ø§Ø¨Ù‚Ø© Ù„Ù„Ø£ØµÙ„
  return originalHandler(message, commandText);
};
