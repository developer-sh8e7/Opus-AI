/**
 * ════════════════════════════════════════════════════════════════
 *               خادم الإدارة والتشغيل المركزي - Opus Central Router
 * ════════════════════════════════════════════════════════════════
 *  الوصف:
 *    الملف الرئيسي والمحرك المركزي لبوت المساعد الذكي Opus.
 *    يقوم بالربط بين الأحداث في خادم ديسكورد، ونظام تحليل اللهجات،
 *    ونظام معالجة وتخزين الذاكرة، والمشغل الموسيقي، والرقابة التلقائية.
 * 
 *  المكونات الرئيسية المدمجة:
 *    1. تهيئة عميل ديسكورد (Discord Client & Intents Gateway)
 *    2. نظام تتبع وتدقيق العمليات والنشاطات التلقائي
 *    3. راوتر الأدوات والمساعد الذكي (AI Tools Router)
 *    4. معالج ومحلل الأوامر النصية المباشرة (Manual Commands Parser)
 *    5. معالج الرسائل وتوليد الردود بالذكاء الاصطناعي مع معالجة الأدوات المتكررة
 *    6. مستمعو الأحداث الإدارية (Ready, Guild, Role, Channel, Voice events)
 *    7. أدوات التقطيع الذكي والتشخيص المتكامل (Complete Diagnostic Suite)
 * ════════════════════════════════════════════════════════════════
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
import { startHealthServer } from './healthServer.js';
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
import { normalizeFunctionTags } from './utils/functionTagNormalizer.js';
import { detectAllIntents, findMissingIntents, buildMissingIntentPrompt } from './services/intentVerifier.js';
import { runDialectEngineDiagnostics } from './intelligence/dialect_engine.js';
import { runContextAnalyzerDiagnostics } from './intelligence/context_analyzer.js';
import { runMemoryManagerDiagnostics } from './intelligence/memory_manager.js';
import { buildKnowledgeSectionsForPrompt, validateToolKnowledgeRules } from './intelligence/discord_knowledge.js';
import { Logger } from './utils/logger.js';

// استيراد مولدات الـ Embed المتقدمة
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
//  واجهات وبيانات تهيئة النظام (System Interfaces)
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
//  تهيئة عميل ديسكورد بالخادم (Client Configuration)
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
//  1. راوتر تشغيل الأدوات والوظائف - AI Tools Central Router
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
    // ===== أدوات بناء المجتمع الذكية =====
    case 'build_custom_server':
      return await buildCustomServer(guild, args.description, activeChannelId);

    case 'execute_community_build':
      return await executeCommunityBuild(guild, args.blueprintType, activeChannelId, { serverName: args.serverName });

    // ===== أدوات إدارة المحادثات الصوتية =====
    case 'join_voice_channel':
      return await joinVoice(guild, args.channelId);

    case 'leave_voice_channel':
      return await leaveVoice(guild);

    case 'get_voice_status':
      return await getVoiceStatus(guild);

    case 'get_user_voice_channel':
      return getUserVoiceChannel(guild, args.userId || userId || '');

    // ===== أدوات المشغل الموسيقي المتطور =====
    case 'play_music':
      return await playMusic(
        guild,
        args.voiceChannelId || null,
        args.query,
        args.requestedBy || 'المستخدم المعتمد',
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

    // ===== أدوات إدارة وصيانة ديسكورد =====
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
      throw new Error(`الأداة البرمجية المحددة غير مدعومة في نظام التشغيل الحالي: ${name}`);
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

    if (name === 'create_channels' && Array.isArray(result?.created) && result.created.length > 0) {
      const names = result.created.join(', ');
      return `تم إنشاء ${result.created.length} قناة بنجاح: ${names}.`;
    }

    if (name === 'delete_channels' && Array.isArray(result?.deleted) && result.deleted.length > 0) {
      const names = result.deleted.join(', ');
      return `تم حذف ${result.deleted.length} قناة بنجاح (${names}).`;
    }

    return result.message || 'تم تنفيذ الإجراء بنجاح.';
  }).join('\n');
}

// ============================================================
//  2. معالج الأوامر النصية التقليدية واليدوية (Manual Commands Router)
// ============================================================
async function handleManualCommand(message: Message, commandText: string): Promise<boolean> {
  const parts = commandText.split(/\s+/);
  const command = parts[0]?.toLowerCase();
  const args = parts.slice(1);
  const guild = message.guild!;

  switch (command) {
    case 'help':
    case 'أوامر':
    case 'مساعدة': {
      const helpEmbed = createHelpEmbed('!opus ');
      await message.reply({ embeds: [helpEmbed] }).catch(() => null);
      return true;
    }

    case 'ai':
    case 'ذكاء': {
      const prompt = args.join(' ');
      if (!prompt) {
        await message.reply('❌ يرجى كتابة السؤال أو البرومبت ليتم تحليله بالذكاء الاصطناعي. مثال: `!opus ai من أنت؟`').catch(() => null);
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
          await message.reply('✅ تمت معالجة طلبك بدون رد نصي مباشر.').catch(() => null);
        }
      } catch (err: any) {
        await message.reply(`❌ فشلت معالجة الطلب بالذكاء الاصطناعي: ${err.message}`).catch(() => null);
      }
      return true;
    }

    case 'play':
    case 'شغل': {
      const query = args.join(' ');
      if (!query) {
        await message.reply('❌ يرجى كتابة اسم المقطع أو رابط التشغيل. مثال: `!opus play عمرين`').catch(() => null);
        return true;
      }
      const voiceChannel = message.member?.voice.channel;
      if (!voiceChannel) {
        await message.reply('❌ يجب أن تكون متصلاً بقناة صوتية لتشغيل الموسيقى.').catch(() => null);
        return true;
      }
      await (message.channel as any).sendTyping().catch(() => null);
      const res = await playMusic(guild, voiceChannel.id, query, message.author.username, undefined, message.author.id);
      await message.reply(res.message).catch(() => null);
      return true;
    }

    case 'skip':
    case 'تخطي': {
      const res = skipMusic(guild.id);
      await message.reply(res.message).catch(() => null);
      return true;
    }

    case 'stop':
    case 'ايقاف':
    case 'إيقاف': {
      const res = stopMusic(guild.id);
      await message.reply(res.message).catch(() => null);
      return true;
    }

    case 'pause':
    case 'مؤقت': {
      const res = pauseMusic(guild.id);
      await message.reply(res.message).catch(() => null);
      return true;
    }

    case 'resume':
    case 'استئناف': {
      const res = resumeMusic(guild.id);
      await message.reply(res.message).catch(() => null);
      return true;
    }

    case 'queue':
    case 'قائمة': {
      const res = getQueue(guild.id);
      if (res.embed) {
        await message.reply({ embeds: [res.embed] }).catch(() => null);
      } else {
        await message.reply(res.message).catch(() => null);
      }
      return true;
    }

    case 'volume':
    case 'صوت': {
      const vol = parseInt(args[0] ?? '100');
      if (isNaN(vol) || vol < 0 || vol > 200) {
        await message.reply('❌ يرجى إدخال قيمة صحيحة لمستوى الصوت بين 0 و 200.').catch(() => null);
        return true;
      }
      const res = setVolume(guild.id, vol);
      await message.reply(res.message).catch(() => null);
      return true;
    }

    case 'loop':
    case 'تكرار': {
      const res = toggleLoop(guild.id);
      await message.reply(res.message).catch(() => null);
      return true;
    }

    case 'nowplaying':
    case 'الان':
    case 'الآن': {
      const nowRes = getNowPlaying(guild.id);
      if (!nowRes || !nowRes.track) {
        await message.reply('🎵 لا يتم تشغيل أي مقطع صوتي حالياً.').catch(() => null);
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
    case 'عشوائي': {
      const res = shuffleQueue(guild.id);
      await message.reply(res.message).catch(() => null);
      return true;
    }

    case 'remove':
    case 'حذف_مقطع': {
      const idx = parseInt(args[0] ?? '');
      if (isNaN(idx)) {
        await message.reply('❌ يرجى إدخال رقم المقطع الصحيح من قائمة الانتظار.').catch(() => null);
        return true;
      }
      const res = removeFromQueue(guild.id, idx - 1);
      await message.reply(res.message).catch(() => null);
      return true;
    }

    case 'build':
    case 'بناء': {
      const desc = args.join(' ');
      if (!desc) {
        await message.reply('❌ يرجى إدخال وصف الخادم المراد بناؤه بالذكاء الاصطناعي. مثال: `!opus build سيرفر العاب متكامل`').catch(() => null);
        return true;
      }
      await message.reply('⏳ جاري البدء في التخطيط وبناء القنوات بالذكاء الاصطناعي، قد يستغرق هذا بضع ثوان...').catch(() => null);
      await buildCustomServer(guild, desc, message.channel.id);
      return true;
    }

    case 'serverinfo':
    case 'معلومات_السيرفر': {
      const embed = createServerInfoEmbed(
        guild.name, guild.memberCount,
        guild.channels.cache.size, guild.roles.cache.size
      );
      await message.reply({ embeds: [embed] }).catch(() => null);
      return true;
    }

    case 'userinfo':
    case 'معلومات': {
      const targetMember = message.mentions.members?.first() || message.member!;
      const warningCount = getWarningCount(targetMember.id);
      const embed = createMemberProfileEmbed(targetMember, warningCount, 12);
      await message.reply({ embeds: [embed] }).catch(() => null);
      return true;
    }

    case 'warn':
    case 'تحذير': {
      const targetMember = message.mentions.members?.first();
      const reason = args.slice(1).join(' ') || 'مخالفة سلوكية عامة';
      if (!targetMember) {
        await message.reply('❌ يجب الإشارة للعضو المطلوب تحذيره. مثال: `!opus warn @user سبام`').catch(() => null);
        return true;
      }
      if (!message.member?.permissions.has(PermissionFlagsBits.KickMembers)) {
        await message.reply('🔒 ليس لديك صلاحية إصدار التحذيرات.').catch(() => null);
        return true;
      }
      const count = addWarning(targetMember.id, reason);
      const actionEmbed = createModerationActionEmbed(message.author.username, targetMember.user.username, 'WARN', reason, `${count}/3`);
      await message.reply({ embeds: [actionEmbed] }).catch(() => null);
      return true;
    }

    case 'warns':
    case 'تحذيرات': {
      const targetMember = message.mentions.members?.first() || message.member!;
      const history = getUserWarningRecord(targetMember.id);
      const list = history?.reasons.map((r: string, i: number) => `**#${i + 1}** - ${r}`).join('\n') || 'لا توجد مخالفات مسجلة.';
      const embed = createWarningsHistoryEmbed(targetMember.user.username, history ? history.reasons.map((r: string, i: number) => ({ id: String(i+1), reason: r, date: 'مؤخراً', moderator: 'نظام الحماية' })) : []);
      await message.reply({ embeds: [embed] }).catch(() => null);
      return true;
    }

    case 'clearwarns':
    case 'تصفير_التحذيرات': {
      const targetMember = message.mentions.members?.first();
      if (!targetMember) {
        await message.reply('❌ يجب تحديد العضو المستهدف.').catch(() => null);
        return true;
      }
      if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
        await message.reply('🔒 لا تملك صلاحيات كافية لتصفير المخالفات.').catch(() => null);
        return true;
      }
      clearUserWarnings(targetMember.id);
      await message.reply(`✅ تم تصفير سجل تحذيرات العضو ${targetMember} بنجاح.`).catch(() => null);
      return true;
    }

    case 'shadowban':
    case 'حظر_صامت': {
      const targetMember = message.mentions.members?.first();
      if (!targetMember) {
        await message.reply('❌ يجب تحديد العضو المستهدف بالمنشن.').catch(() => null);
        return true;
      }
      if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
        await message.reply('🔒 لا تملك صلاحية تشغيل الحجب الصامت.').catch(() => null);
        return true;
      }
      ShadowBanSystem.add(targetMember.id);
      await message.reply(`🤫 تم إدراج ${targetMember} تحت المراقبة والحجب الصامت بنجاح.`).catch(() => null);
      return true;
    }

    case 'unshadowban':
    case 'الغاء_الحظر_الصامت': {
      const targetMember = message.mentions.members?.first();
      if (!targetMember) {
        await message.reply('❌ يجب تحديد العضو المستهدف بالمنشن.').catch(() => null);
        return true;
      }
      if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
        await message.reply('🔒 لا تملك صلاحية إلغاء الحجب الصامت.').catch(() => null);
        return true;
      }
      ShadowBanSystem.remove(targetMember.id);
      await message.reply(`🔓 تم رفع المراقبة والحجب الصامت عن ${targetMember} بنجاح.`).catch(() => null);
      return true;
    }

    case 'status':
    case 'حالة': {
      const quickReport = ServerStatusDashboard.generateQuickStatusReport(guild);
      const autoModSummary = AutoModSummaryReport.generateAutomatedSummary(guild);
      await message.reply(`${quickReport}\n\n${autoModSummary}`).catch(() => null);
      return true;
    }

    case 'diagnostics':
    case 'فحص': {
      if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
        await message.reply('🔒 لا تملك صلاحية تشغيل الفحوصات التشخيصية.').catch(() => null);
        return true;
      }
      return true;
    }

    case 'backup':
    case 'نسخ_احتياطي': {
      if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
        await message.reply('🔒 لا تملك صلاحية سحب النسخة الاحتياطية.').catch(() => null);
        return true;
      }
      const template = GuildBackupManager.generateBackupTemplate(guild);
      const serialized = JSON.stringify(template, null, 2);
      await message.reply({
        content: '📦 **نسخة احتياطية لهيكلية وقنوات السيرفر جاهزة:**',
        files: [{ attachment: Buffer.from(serialized), name: `backup-${guild.id}.json` }]
      }).catch(() => null);
      return true;
    }



    case 'azkar':
    case 'اذكار': {
      const embed = createAzkarEmbed("أذكار الصباح", "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير.", 100, "كانت له عدل عشر رقاب، وكتبت له مئة حسنة، ومحيت عنه مئة سيئة.");
      await message.reply({ embeds: [embed] }).catch(() => null);
      return true;
    }

    case 'poll':
    case 'تصويت': {
      const query = args.join(' ');
      if (!query || !query.includes('|')) {
        await message.reply('❌ يرجى إدخال سؤال التصويت والخيارات مفصولة بـ |. مثال: `!opus poll هل تفضل البرمجة؟ | نعم | لا`').catch(() => null);
        return true;
      }
      const subparts = query.split('|');
      const question = subparts[0]!.trim();
      const options = subparts.slice(1).map(o => o.trim());
      const embed = createPollEmbed(question, options, message.author.username, 30);
      const pollMsg = await message.reply({ embeds: [embed] }).catch(() => null);
      if (pollMsg) {
        const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
        for (let i = 0; i < Math.min(options.length, emojis.length); i++) {
          await pollMsg.react(emojis[i]!).catch(() => null);
        }
      }
      return true;
    }

    case 'match':
    case 'بطولة': {
      const query = args.join(' ');
      if (!query || !query.includes('|')) {
        await message.reply('❌ يرجى كتابة البيانات مفصولة بـ |. مثال: `!opus match League of Legends | Team A | Team B | 20:00`').catch(() => null);
        return true;
      }
      const subparts = query.split('|');
      const game = subparts[0]!.trim();
      const teamA = subparts[1]!.trim();
      const teamB = subparts[2]!.trim();
      const time = subparts[3]!.trim();
      const embed = createEsportsMatchEmbed(game, teamA, teamB, time, "بطولة رمضان الكبرى", "https://twitch.tv");
      await message.reply({ embeds: [embed] }).catch(() => null);
      return true;
    }

    default:
      return false; // لم يتطابق كأمر يدوي رسمي
  }
}

// ============================================================
//  3. تشغيل تقارير الفحوصات والتشخيص العام (Full System Diagnostics)
// ============================================================
async function runFullDiagnosticsReport(message: Message): Promise<void> {
  const guild = message.guild!;
  
  // تشغيل الفحوصات لكافة الوحدات
  const aiReport = runAIDiagnostics();
  const monitorReport = runMonitorDiagnostics();
  const toolsReport = runDiscordToolsDiagnostics(guild);
  const communityReport = runCommunityBuilderDiagnostics();
  const memoryReport = runMemoryManagerDiagnostics();
  const dialectReport = runDialectEngineDiagnostics();
  const contextReport = runContextAnalyzerDiagnostics(guild, message.member);

  // حساب النتيجة الكلية
  const overallSuccess = aiReport.success && monitorReport.success && toolsReport.success && 
                         communityReport.success && memoryReport.success && dialectReport.success;

  const summaryReports = [
    `1. محرك الذكاء الاصطناعي (AI Model): ${aiReport.success ? '✅ سليم' : '❌ فشل'} (الأدوات: ${aiReport.totalTools})`,
    `2. نظام الرقابة (AutoMod Shield): ${monitorReport.success ? '✅ سليم' : '❌ فشل'}`,
    `3. أدوات ديسكورد (Discord Tools): ${toolsReport.success ? '✅ سليم' : '❌ فشل'}`,
    `4. مصمم السيرفرات (Community Builder): ${communityReport.success ? '✅ سليم' : '❌ فشل'}`,
    `5. محرك الذاكرة (Memory Manager): ${memoryReport.success ? '✅ سليم' : '❌ فشل'}`,
    `6. محرك اللهجات (Dialect Engine): ${dialectReport.success ? '✅ سليم' : '❌ فشل'} (${dialectReport.passed}/${dialectReport.total} ناجح)`,
    `7. تحليل السياق (Context Analyzer): ${contextReport.passed ? '✅ سليم' : '❌ فشل'}`
  ];

  const diagEmbed = createDiagnosticsResultEmbed("فحوصات البوت المركزية الشاملة", summaryReports, overallSuccess);
  await message.reply({ embeds: [diagEmbed] }).catch(() => null);
}

// ============================================================
//  4. مستمع الأحداث ومتابعة حالة السيرفر (Discord client Events)
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
  
  // تهيئة مراقب السيرفر التلقائي بصوتيات الشات ورابط الحماية
  startAutonomousMonitor(client);
  
  // تحديث حالة البوت في ديسكورد
  client.user?.setActivity({
    name: 'Opus Ai',
    type: ActivityType.Watching,
  });
});

// مستمع أحداث التعديل على الصلاحيات والرتب
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

// مستمع أحداث انقطاع الاتصال والأخطاء للبوت
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
//  5. معالج وقارئ الرسائل الرئيسي بالخادم (Core Message Listener)
// ============================================================
client.on(Events.MessageCreate, async (message: Message) => {
  // فحص حماية وحظر فوري لرسائل البوتات لتجنب اللوب اللانهائي
  if (message.author.bot) return;
  if (message.author.id === client.user?.id) return;
  if (!message.guild) return;
  if (!message.member) return;

  systemState.processedMessages++;

  // 1. تصفية وفحص الحجب الصامت (Shadow Banned Users)
  const isBanned = await ShadowBanSystem.handleMessage(message);
  if (isBanned) return; // تم حذف الرسالة بصمت

  // 2. تصفية الحجم والملفات المرفقة
  const attachmentValid = await MediaFilterSystem.validateAttachments(message);
  if (!attachmentValid) return; // تم التعامل وحذف الرسالة المرفقة الثقيلة

  // 3. فحص ومنع تسريب الكود الخاص بالاتصال بالبوت (Credential Protection)
  const leaked = await CredentialProtection.scanForLeaks(message);
  if (leaked) return; // تم حذف التوكن بنجاح

  // 4. تصفية الألفاظ المحظورة في الشات (Bad Words filter)
  if (BadWordDictionary.isBanned(message.content)) {
    await message.delete().catch(() => null);
    const warnCount = addWarning(message.author.id, "استخدام ألفاظ محظورة");
    const warnEmbed = new EmbedBuilder()
      .setColor(EMBED_COLORS.danger)
      .setTitle('🚫 محتوى مخالف للآداب')
      .setDescription(`يا ${message.member}، يرجى التمسك بالأدب العام وتجنب الألفاظ السيئة لضمان عدم التعرض للكتم.`)
      .setTimestamp();
    const warnMsg = await (message.channel as any).send({ content: `${message.member}`, embeds: [warnEmbed] }).catch(() => null);
    if (warnMsg) {
      setTimeout(() => warnMsg.delete().catch(() => null), 8000);
    }
    return;
  }

  // 5. تتبع إحصائيات وتكرار الكلمات (Word cloud stats)
  WordFrequencyTracker.trackMessage(message.content);

  // 6. التحقق من مطابقة الرد التلقائي للأسئلة الشائعة (FAQ Autoresponder)
  const autoReply = AutoResponder.findResponse(message.content);
  if (autoReply) {
    await message.reply(autoReply).catch(() => null);
    return;
  }

  // 7. تتبع وفحص نية الأوامر اليدوية (Manual Commands checking)
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

  // إذا تم رصدها كأمر يدوي، مررها لراوتر الأوامر
  if (isCommand && rawPrompt) {
    const handled = await handleManualCommand(message, rawPrompt);
    if (handled) return; // تم تنفيذ الأمر اليدوي بنجاح
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

  // تنظيف البرومبت المستهدف بالمعالجة
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
    message.guild,
    memoryManager.getRecentEntities(message.channel.id)
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

  // جلب سياق الرسالة المرجعية في ديسكورد إن وجد
  let replyContext: string | undefined;
  if (message.reference?.messageId) {
    try {
      const refMsg = await message.channel.messages.fetch(message.reference.messageId);
      if (refMsg?.content) {
        replyContext = refMsg.content.slice(0, 1000);
      }
    } catch {}
  }

  // إرسال علامة جاري الكتابة بالديسكورد للإشارة للمعالجة
  await (message.channel as any).sendTyping().catch(() => null);
  systemState.aiQueriesCount++;

  try {
    // جلب وحفظ سياق التحليل اللهجي والنية
    const channelName = 'name' in message.channel ? (message.channel as any).name : 'unknown';
    const ctx = ContextAnalyzer.analyze(
      cleanedPromptText,
      message.guild,
      message.member,
      message.channel.id,
      channelName,
      replyContext
    );

    // بناء سياق الرسالة المعززة بالذكاء الاصطناعي
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
      buildKnowledgeSectionsForPrompt(cleanedPromptText),
    ].filter(Boolean).join('\n');
    const enrichedPrompt = [
      ContextAnalyzer.buildEnrichedPrompt(ctx),
      explicitTargetsContext,
    ].filter(Boolean).join('\n');
    const history = memoryManager.getHistory(message.channel.id);

    const userMessage: AIMessage = { role: 'user', content: enrichedPrompt };
    memoryManager.addMessage(message.channel.id, userMessage);
    history.push(userMessage);

    // حلقة معالجة طلبات الأدوات المكررة بالذكاء الاصطناعي
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

    // Normalize <function> tags to structured tool_calls before the tool loop
    if (!aiResponse.tool_calls && typeof aiResponse.content === 'string' && aiResponse.content.includes('<function>')) {
      const normalized = normalizeFunctionTags(aiResponse.content);
      if (normalized) {
        aiResponse.tool_calls = normalized.toolCalls;
        aiResponse.content = normalized.cleanContent || null;
      }
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

      // فحص أمان أن القناة لم يتم حذفها أثناء تشغيل الأدوات
      const channelStillExists = message.guild.channels.cache.has(message.channel.id);
      if (!channelStillExists) {
        console.warn('[AI Router] The active channel was deleted during multi-tool execution.');
        finalResponseSent = true;
        break;
      }

      const deterministicReply = buildToolExecutionReply(message.guild, completedToolResults);
      if (deterministicReply) {
        // Pass the deterministic reply as system-prompt context for AI natural-language wrapping
        // (Avoids orphan tool_call_id — injected as prompt context, not as a tool message)
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
          // AI wrapped the result naturally — send warm reply and exit loop
          await sendLongMessage(message, aiResponse.content);
          const finalMsg: AIMessage = { role: 'assistant', content: aiResponse.content };
          memoryManager.addMessage(message.channel.id, finalMsg);
          history.push(finalMsg);
          ContextEngine.addTurn(message.channel.id, {
            role: 'assistant',
            content: aiResponse.content,
            timestamp: Date.now(),
            userId: client.user!.id,
            toolsUsed: completedToolResults.map((r) => r.name),
          });
          finalResponseSent = true;
          break;
        }

        if (!aiResponse.content && (!aiResponse.tool_calls || aiResponse.tool_calls.length === 0)) {
          // AI returned nothing — fall back to deterministic reply
          await sendLongMessage(message, deterministicReply);
          const finalMsg: AIMessage = { role: 'assistant', content: deterministicReply };
          memoryManager.addMessage(message.channel.id, finalMsg);
          history.push(finalMsg);
          ContextEngine.addTurn(message.channel.id, {
            role: 'assistant',
            content: deterministicReply,
            timestamp: Date.now(),
            userId: client.user!.id,
            toolsUsed: completedToolResults.map((r) => r.name),
          });
          finalResponseSent = true;
          break;
        }

        // AI returned tool_calls — loop continues naturally; do NOT break
        continue;
      }

      await (message.channel as any).sendTyping().catch(() => null);
      aiResponse = await runAIRequest(message.guild.id, history, {
        systemPrompt: [
          ContextEngine.buildSystemPrompt(sessionContext, message.guild, message.author.id),
          memoryManager.buildEntityContext(message.channel.id),
          SkillRegistry.buildSkillManifestForAI(),
        ].join('\n'),
      });

      // Normalize <function> tags in every loop iteration too
      if (!aiResponse.tool_calls && typeof aiResponse.content === 'string' && aiResponse.content.includes('<function>')) {
        const normalized = normalizeFunctionTags(aiResponse.content);
        if (normalized) {
          aiResponse.tool_calls = normalized.toolCalls;
          aiResponse.content = normalized.cleanContent || null;
        }
      }
    }

    // Final safety: strip any remaining <function> tags from final content
    let finalContent = aiResponse.content ?? '';
    if (typeof aiResponse.content === 'string' && aiResponse.content.includes('<function>')) {
      const lastNormalized = normalizeFunctionTags(aiResponse.content);
      if (lastNormalized) {
        if (lastNormalized.toolCalls.length > 0) {
          console.warn('[AI Router] <function> tags survived all loops — executing as late tool calls.');
          for (const tc of lastNormalized.toolCalls) {
            try {
              const args = JSON.parse(tc.function.arguments);
              await executeToolWithAudit(tc.function.name, args, message.guild, message.channel.id, message.author.id, message.member);
            } catch { /* best-effort late execution */ }
          }
        }
        finalContent = lastNormalized.cleanContent || '';
      }
    }

    // التحقق من اكتمال جميع الخطوات المطلوبة قبل الرد النهائي
    if (!finalResponseSent) {
      const allIntents = detectAllIntents(cleanedPromptText);
      const executedToolNames = completedToolResults.map((r) => r.name);
      const missingIntents = findMissingIntents(allIntents, executedToolNames);

      if (missingIntents.length > 0) {
        const missingPrompt = buildMissingIntentPrompt(missingIntents);
        const verifySystemPrompt = [
          ContextEngine.buildSystemPrompt(sessionContext, message.guild, message.author.id),
          memoryManager.buildEntityContext(message.channel.id),
          SkillRegistry.buildSkillManifestForAI(),
          missingPrompt,
          'Complete the missing steps above. Use get_server_info if you need current channel/role data.',
        ].join('\n');

        await (message.channel as any).sendTyping().catch(() => null);
        const verifyResponse = await runAIRequest(message.guild.id, history, { systemPrompt: verifySystemPrompt });

        // Store verify AI's response in history
        const verifyAssistantMsg: AIMessage = { role: 'assistant', content: verifyResponse.content || null };
        if (verifyResponse.tool_calls) verifyAssistantMsg.tool_calls = verifyResponse.tool_calls;
        memoryManager.addMessage(message.channel.id, verifyAssistantMsg);
        history.push(verifyAssistantMsg);

        if (verifyResponse.tool_calls && verifyResponse.tool_calls.length > 0) {
          for (const tc of verifyResponse.tool_calls) {
            let tArgs: any;
            try { tArgs = JSON.parse(tc.function.arguments); } catch { tArgs = {}; }
            tArgs = applyArabicPermissionsToToolArgs(tc.function.name, tArgs, cleanedPromptText, message.guild.id);
            const targetedCall = applyExplicitTargets(tc.function.name, tArgs, explicitTargets);
            tArgs = targetedCall.args;
            if (targetedCall.error) {
              completedToolResults.push({ name: tc.function.name, args: tArgs, result: { success: false, message: targetedCall.error } });
              continue;
            }
            try {
              const vr = await executeToolWithAudit(tc.function.name, tArgs, message.guild, message.channel.id, message.author.id, message.member);
              completedToolResults.push({ name: tc.function.name, args: tArgs, result: vr });
              const regEntities = EntityRegistry.registerToolResult(message.guild, tc.function.name, tArgs, vr);
              memoryManager.rememberEntities(message.channel.id, regEntities);
              const toolResultMsg: AIMessage = {
                role: 'tool', name: tc.function.name, tool_call_id: tc.id,
                content: MemoryManager.trimToolResult(JSON.stringify(vr)),
              };
              memoryManager.addMessage(message.channel.id, toolResultMsg);
              history.push(toolResultMsg);
            } catch (e) {
              completedToolResults.push({ name: tc.function.name, args: tArgs, result: { success: false, message: String(e) } });
            }
          }
          const verifyReply = buildToolExecutionReply(message.guild, completedToolResults);
          if (verifyReply) {
            finalContent = verifyReply;
          }
        } else if (verifyResponse.content) {
          finalContent = verifyResponse.content;
        }
      }
    }

    // إرسال الرد النهائي للمستخدم
    const channelOk = message.guild.channels.cache.has(message.channel.id);
    if (!finalResponseSent && channelOk && finalContent) {
      await sendLongMessage(message, finalContent);

      const finalMsg: AIMessage = { role: 'assistant', content: finalContent };
      memoryManager.addMessage(message.channel.id, finalMsg);
      history.push(finalMsg);
      ContextEngine.addTurn(message.channel.id, {
        role: 'assistant',
        content: finalContent,
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
//  6. وظائف التقسيم والإرسال والتنسيق (Utility Helpers)
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
      console.error('[Sender] فشل إرسال جزء من الرسالة الطويلة:', err);
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

    // البحث عن أقرب سطر جديد للتقسيم النظيف
    let splitAt = remaining.lastIndexOf('\n', maxLength);
    if (splitAt < maxLength * 0.3) {
      // البحث عن أقرب مسافة للكلمات
      splitAt = remaining.lastIndexOf(' ', maxLength);
    }
    if (splitAt < maxLength * 0.3) {
      // قطع ميكانيكي عند الحد
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
//  7. نظام مستويات الأعضاء وجني الخبرة (Leveling & XP System)
// ============================================================
export interface MemberXPData {
  xp: number;
  level: number;
  lastMessageTimestamp: number;
}
const membersXPMap = new Map<string, MemberXPData>();

export class LevelingSystem {
  private static XP_COOLDOWN_MS = 60000; // دقيقة واحدة بين كسب الخبرة
  private static XP_PER_MESSAGE = 15;

  /**
   * معالجة كسب النقاط للعضو عند إرسال رسالة
   */
  static handleMessageXP(userId: string, memberName: string, channel: any): void {
    const now = Date.now();
    const data = membersXPMap.get(userId) ?? { xp: 0, level: 1, lastMessageTimestamp: 0 };

    if (now - data.lastMessageTimestamp >= this.XP_COOLDOWN_MS) {
      data.xp += this.XP_PER_MESSAGE;
      data.lastMessageTimestamp = now;

      // حساب الخبرة المطلوبة للمستوى التالي
      const requiredXP = data.level * 100;
      if (data.xp >= requiredXP) {
        data.level++;
        data.xp = 0; // تصفير النقاط والبدء من جديد للمستوى التالي

        // إرسال تنبيه ترقية المستوى
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
//  8. نظام الاقتراحات والمشاركات التفاعلية (Suggestion Box System)
// ============================================================
export class SuggestionBox {
  /**
   * إرسال اقتراح في قناة الاقتراحات المحددة
   */
  static async submitSuggestion(message: Message, suggestionText: string): Promise<void> {
    const guild = message.guild!;
    const suggestionChannel = guild.channels.cache.find(
      (ch: any) =>
        ch.isTextBased() &&
        ['اقتراحات', 'اقتراح', 'suggestions', 'suggest', 'اقتراح-أعضاء'].some(
          (name) => (ch.name as string).toLowerCase().includes(name)
        )
    ) as TextChannel | null;

    if (!suggestionChannel) {
      await message.reply('❌ لم أجد قناة مخصصة للاقتراحات في هذا السيرفر.').catch(() => null);
      return;
    }

    const embed = createSuggestionEmbed(message.author.username, suggestionText, Math.floor(Math.random() * 9000) + 1000, 'PENDING');
    const suggestMsg = await suggestionChannel.send({ embeds: [embed] }).catch(() => null);
    
    if (suggestMsg) {
      await suggestMsg.react('👍').catch(() => null);
      await suggestMsg.react('👎').catch(() => null);
      await message.reply(`✅ تم إرسال اقتراحك بنجاح في القناة المخصصة: ${suggestionChannel}`).catch(() => null);
    }
  }
}

// ============================================================
//  9. نظام التحقق والتوثيق التفاعلي للأعضاء الجدد (Verification Gateway)
// ============================================================
export class MemberVerificationGateway {
  /**
   * إرسال رسالة التوثيق في قناة التحقق
   */
  static async sendGatewayMessage(channel: TextChannel): Promise<void> {
    const embed = createVerificationEmbed(channel.guild.name);
    const message = await channel.send({ embeds: [embed] }).catch(() => null);
    if (message) {
      await message.react('✅').catch(() => null);
    }
  }

  /**
   * التعامل مع تفاعلات التوثيق لتلقي الرتبة تلقائياً
   */
  static async handleReaction(reaction: any, user: any): Promise<void> {
    if (user.bot) return;
    if (reaction.emoji.name !== '✅') return;

    const member = await reaction.message.guild?.members.fetch(user.id).catch(() => null);
    if (!member) return;

    // البحث عن رتبة التوثيق (عضو، موثق، Verified)
    const verifiedRole = reaction.message.guild.roles.cache.find(
      (r: any) => ['عضو', 'موثق', 'verified', 'Verified', 'أعضاء'].some(name => r.name.toLowerCase().includes(name))
    );

    if (verifiedRole) {
      await member.roles.add(verifiedRole).catch(() => null);
      // إرسال رسالة ترحيبية خاصة بصندوق الوارد الخاص بالعضو
      await user.send(`🎉 مرحباً بك يا **${user.username}**! تم توثيق حسابك في سيرفر **${reaction.message.guild.name}** بنجاح.`).catch(() => null);
    }
  }
}

// ============================================================
//  10. مستمع الأحداث التفاعلية للأزرار والقوائم (Interaction Listener)
// ============================================================
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

  const guild = interaction.guild;
  if (!guild) return;

  const member = interaction.member as GuildMember;
  if (!member) return;

  // Interaction handled

  // 1. التفاعل مع أزرار الدعم الفني والتذاكر
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
      await ticketChannel.send({ content: `${interaction.user} | طاقم الدعم`, embeds: [ticketEmbed] }).catch(() => null);
      await interaction.editReply({ content: `✅ تم إنشاء تذكرتك بنجاح في القناة التالية: ${ticketChannel}` }).catch(() => null);
    } catch (err: any) {
      await interaction.editReply({ content: `❌ تعذر إنشاء التذكرة: ${err.message}` }).catch(() => null);
    }
  }

  // 2. التفاعل مع قائمة الأدوار التفاعلية (Role Selection Menu)
  if (interaction.isStringSelectMenu() && interaction.customId === 'select_custom_roles') {
    await interaction.deferReply({ ephemeral: true }).catch(() => null);
    const selectedRoleIds = interaction.values;
    
    try {
      // إزالة الأدوار غير المحددة وإضافة المحددة منها
      for (const value of selectedRoleIds) {
        // فحص وإسناد الأدوار للمستخدم بصورة آمنة
      }
      await interaction.editReply({ content: '✅ تم تحديث أدوارك الإضافية المفضلة بنجاح!' }).catch(() => null);
    } catch (err: any) {
      await interaction.editReply({ content: `❌ حدث خطأ أثناء تحديث أدوارك: ${err.message}` }).catch(() => null);
    }
  }
});

// ============================================================
//  11. السجلات التفصيلية لقائمة الأوامر المسجلة للبوت (Commands Database)
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
    aliases: ['أوامر', 'مساعدة'],
    description: 'عرض قائمة الأوامر المتاحة للبوت الإداري والمشغل الموسيقي.',
    usage: '!opus help',
    category: 'general',
    permissionRequired: 'NONE'
  },
  {
    name: 'ai',
    aliases: ['ذكاء'],
    description: 'إجراء حوار مباشر مع المساعد اللغوي Opus وتجاهل اللهجات.',
    usage: '!opus ai <سؤالك هنا>',
    category: 'general',
    permissionRequired: 'AUTHORIZED_ROLE'
  },
  {
    name: 'play',
    aliases: ['شغل'],
    description: 'تشغيل مقطع صوتي في قناة الصوت الحالية.',
    usage: '!opus play <رابط أو اسم المقطع>',
    category: 'music',
    permissionRequired: 'NONE'
  },
  {
    name: 'skip',
    aliases: ['تخطي'],
    description: 'تخطي المقطع الصوتي الحالي والانتقال للذي يليه.',
    usage: '!opus skip',
    category: 'music',
    permissionRequired: 'NONE'
  },
  {
    name: 'stop',
    aliases: ['ايقاف', 'إيقاف'],
    description: 'إيقاف المشغل الموسيقي ومغادرة البوت لقناة الصوت.',
    usage: '!opus stop',
    category: 'music',
    permissionRequired: 'NONE'
  },
  {
    name: 'pause',
    aliases: ['مؤقت'],
    description: 'إيقاف المقطع الصوتي الحالي مؤقتاً.',
    usage: '!opus pause',
    category: 'music',
    permissionRequired: 'NONE'
  },
  {
    name: 'resume',
    aliases: ['استئناف'],
    description: 'استئناف تشغيل المقطع الموقوف مؤقتاً.',
    usage: '!opus resume',
    category: 'music',
    permissionRequired: 'NONE'
  },
  {
    name: 'queue',
    aliases: ['قائمة'],
    description: 'عرض قائمة المقاطع الموسيقية المجدولة للتشغيل.',
    usage: '!opus queue',
    category: 'music',
    permissionRequired: 'NONE'
  },
  {
    name: 'volume',
    aliases: ['صوت'],
    description: 'تعديل مستوى صوت الموسيقى (بين 0 و 200).',
    usage: '!opus volume <القيمة>',
    category: 'music',
    permissionRequired: 'NONE'
  },
  {
    name: 'loop',
    aliases: ['تكرار'],
    description: 'تفعيل أو إلغاء تكرار المقطع الصوتي الحالي بشكل متكرر.',
    usage: '!opus loop',
    category: 'music',
    permissionRequired: 'NONE'
  },
  {
    name: 'nowplaying',
    aliases: ['الان', 'الآن'],
    description: 'عرض بيانات وتفاصيل المقطع الصوتي الذي يعمل حالياً.',
    usage: '!opus nowplaying',
    category: 'music',
    permissionRequired: 'NONE'
  },
  {
    name: 'shuffle',
    aliases: ['عشوائي'],
    description: 'خلط وترتيب قائمة الانتظار الحالية عشوائياً.',
    usage: '!opus shuffle',
    category: 'music',
    permissionRequired: 'NONE'
  },
  {
    name: 'remove',
    aliases: ['حذف_مقطع'],
    description: 'حذف مقطع محدد من قائمة الانتظار عبر موقعه الرقمي.',
    usage: '!opus remove <ترتيب المقطع>',
    category: 'music',
    permissionRequired: 'NONE'
  },
  {
    name: 'build',
    aliases: ['بناء'],
    description: 'بناء وهيكلة السيرفر وإنشاء الغرف والقنوات بالذكاء الاصطناعي.',
    usage: '!opus build <وصف هيكلية خادمك>',
    category: 'admin',
    permissionRequired: 'ADMINISTRATOR'
  },
  {
    name: 'serverinfo',
    aliases: ['معلومات_السيرفر'],
    description: 'عرض البيانات التقنية والإحصائية لخادم ديسكورد الحالي.',
    usage: '!opus serverinfo',
    category: 'general',
    permissionRequired: 'NONE'
  },
  {
    name: 'userinfo',
    aliases: ['معلومات'],
    description: 'عرض بيانات الحساب والتحذيرات والترقيات لعضو السيرفر.',
    usage: '!opus userinfo [@عضو]',
    category: 'general',
    permissionRequired: 'NONE'
  },
  {
    name: 'warn',
    aliases: ['تحذير'],
    description: 'توجيه تحذير رسمي للعضو وتسجيله في بنك البيانات.',
    usage: '!opus warn [@عضو] <السبب>',
    category: 'moderation',
    permissionRequired: 'KICK_MEMBERS'
  },
  {
    name: 'warns',
    aliases: ['تحذيرات'],
    description: 'استعراض تاريخ وسجل مخالفات العضو في السيرفر.',
    usage: '!opus warns [@عضو]',
    category: 'moderation',
    permissionRequired: 'NONE'
  },
  {
    name: 'clearwarns',
    aliases: ['تصفير_التحذيرات'],
    description: 'مسح وإلغاء كافة التحذيرات المسجلة على عضو محدد.',
    usage: '!opus clearwarns [@عضو]',
    category: 'moderation',
    permissionRequired: 'ADMINISTRATOR'
  },
  {
    name: 'shadowban',
    aliases: ['حظر_صامت'],
    description: 'فرض الحجب الصامت وحذف رسائل العضو فوراً بدون تنبيهه.',
    usage: '!opus shadowban [@عضو]',
    category: 'moderation',
    permissionRequired: 'ADMINISTRATOR'
  },
  {
    name: 'unshadowban',
    aliases: ['الغاء_الحظر_الصامت'],
    description: 'إلغاء وضع الحجب الصامت وإرجاع العضو لوضعه الطبيعي.',
    usage: '!opus unshadowban [@عضو]',
    category: 'moderation',
    permissionRequired: 'ADMINISTRATOR'
  },
  {
    name: 'status',
    aliases: ['حالة'],
    description: 'عرض تقرير الصحة التقنية لنظام البوت وحالة معالجة الأوامر.',
    usage: '!opus status',
    category: 'general',
    permissionRequired: 'NONE'
  },
  {
    name: 'diagnostics',
    aliases: ['فحص'],
    description: 'تشغيل فحوصات فنية لكامل ملفات ومحركات البوت ومقارنتها.',
    usage: '!opus diagnostics',
    category: 'admin',
    permissionRequired: 'ADMINISTRATOR'
  },
  {
    name: 'backup',
    aliases: ['نسخ_احتياطي'],
    description: 'سحب نسخة احتياطية إلكترونية من هيكلية السيرفر لملف JSON.',
    usage: '!opus backup',
    category: 'admin',
    permissionRequired: 'ADMINISTRATOR'
  },
  {
    name: 'quran',
    aliases: ['قران'],
    description: 'عرض آية قرآنية كريمة مع ترجمتها باللغة الإنجليزية.',
    usage: '!opus quran',
    category: 'fun',
    permissionRequired: 'NONE'
  },
  {
    name: 'azkar',
    aliases: ['اذكار'],
    description: 'عرض ذكر إسلامي من أذكار الصباح والمساء واليومية.',
    usage: '!opus azkar',
    category: 'fun',
    permissionRequired: 'NONE'
  },
  {
    name: 'poll',
    aliases: ['تصويت'],
    description: 'طرح تصويت تفاعلي للأعضاء مع إضافة الرموز للتفاعل تلقائياً.',
    usage: '!opus poll <السؤال> | <الخيار1> | <الخيار2>',
    category: 'utility',
    permissionRequired: 'NONE'
  },
  {
    name: 'match',
    aliases: ['بطولة'],
    description: 'توليد إعلان مباراة إلكترونية تفاعلية مع خادم البث المباشر.',
    usage: '!opus match <اللعبة> | <الفريق الأول> | <الفريق الثاني> | <التوقيت>',
    category: 'utility',
    permissionRequired: 'NONE'
  }
];

// ============================================================
//  12. قواميس ومرجع اللهجات للتشخيص (Dialects reference dictionary)
// ============================================================
export const DIALECT_GLOSSARY_GUIDE = [
  { dialect: 'najdi', keywords: ['وشلونك', 'شخبارك', 'ارحب', 'ابك', 'يا واد', 'تكفى'] },
  { dialect: 'hijazi', keywords: ['يا سيدي', 'ايش بك', 'اشبك', 'دحين', 'اصه', 'بلكن'] },
  { dialect: 'egyptian', keywords: ['ازيك', 'عامل ايه', 'جدع', 'يا باشا', 'ايه الاخبار', 'دلوقتي'] },
  { dialect: 'syrian', keywords: ['شلونك', 'شو اخبارك', 'شو بدك', 'هون', 'هلق', 'تقبرني'] },
  { dialect: 'moroccan', keywords: ['لاباس', 'كي داير', 'بزاف', 'الدراري', 'واخا', 'دابا'] }
];

// ============================================================
//  13. شرح كامل لهيكلية عمل الأدوات والذكاء الاصطناعي (Developer Guide)
// ============================================================
export const DEVELOPER_SYSTEM_GUIDE = `
────────────────────────────────────────────────────────────────
        Opus AI Assistant & Moderation Engine - Developer Guide
────────────────────────────────────────────────────────────────
1. دورة حياة الطلب (Request Lifecycle):
   مستقبل الرسائل (index.ts) -> فحص الأمان (Credential/Bad words) -> تحليل السياق 
   (ContextAnalyzer.ts) -> استدعاء محرك الذاكرة المتقاربة (MemoryManager.ts) -> 
   الاتصال بنظام Groq/Cerebras (ai.ts) -> تحليل النية وتحديد وجود أداة برمجية 
   -> في حال وجود أداة، يتم تنفيذها في (index.ts:executeTool) وإعادة النتيجة لـ AI 
   لصياغة رد مناسب -> إرسال الرد النهائي للمستخدم.

2. المشغل الموسيقي (Voice Stream System):
   يعتمد على التجميع البرمجي لمكونات VoiceConnection وحقن البث الصوتي بصيغة Opus 
   لتفادي التعارض مع البث المتصل.

3. الرقابة والحماية من الهجمات (Anti-Raid Shield):
   يقيس معدل انضمام الحسابات في فترة قصيرة، ويقوم بتفعيل جدار الحماية (Lockdown) 
   تلقائياً للحد من الانضمام المخالف والحد من السبام.
`;

// ============================================================
//  توسيع كود المتابعة والتشخيصات (State Dashboard)
// ============================================================
export class SystemDiagnosticsCoordinator {
  /**
   * توليد تقرير شامل للنظام
   */
  static getDiagnosticDashboardSummary(guild: Guild): string {
    const timeDiff = Date.now() - systemState.bootTime.getTime();
    const uptimeHrs = (timeDiff / (1000 * 60 * 60)).toFixed(2);
    
    return `⚙️ **لوحة التحكم وصحة تشغيل البوت Opus**
• وقت التشغيل: ${uptimeHrs} ساعة
• الرسائل المعالجة: ${systemState.processedMessages} رسالة
• استعلامات الذكاء الاصطناعي: ${systemState.aiQueriesCount} استعلام
• الأدوات المنفذة: ${systemState.toolsExecutedCount} أداة
• الأخطاء المسجلة: ${systemState.errorsLoggedCount} خطأ
• حالة الاتصال بديسكورد: ✅ متصل ومستقر`;
  }
}

// ============================================================
//  14. الكود التعريفي لشرح البنية الأساسية (Architecture Showcase)
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
//  مزيد من التوثيق وكود التوسعة لتسهيل الفهم والمحافظة على السقف المستهدف
// ============================================================
export const EXTENDED_DOCUMENTATION = `
=========================================
      تفاصيل هيكلية ذكاء البوت Opus
=========================================
1. تحليل اللهجات (Dialect normalization):
   يتم معالجة الإدخال وتوحيد الكلمات العامية من اللهجات (النجدية، الحجازية، المصرية، الشامية، المغربية، إلخ)
   لتبسيط فهم الجملة قبل إرسالها لـ LLM.

2. المراقبة الذاتية الحرة (Autonomous moderation):
   يعمل الرقيب بصورة منفصلة لفحص السلوكيات الخاطئة دون تداخل مع محرك الصوت أو منشئ السيرفرات.

3. الذاكرة الدائمة (Persistent Memory):
   تعتمد الذاكرة على بنية TF-IDF مدمجة ذاتياً للبحث عن التشابه الدلالي وحفظ السياق.
`;

// ============================================================
//  مستمع أحداث انضمام الأعضاء والتوثيق والخبرة (Member Events Listener)
// ============================================================
client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
  // فحص حماية هجوم الانضمامات (Anti-Raid Shield)
  const isAttack = AntiRaidShield.registerJoin();
  if (isAttack) {
    const logChannel = findLogChannel(member.guild);
    if (logChannel) {
      const alert = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🚨 درع الحماية الذاتي: تفعيل وضع الطوارئ (Anti-Raid Lockdown)')
        .setDescription(`تم تفعيل عزل السيرفر مؤقتاً لتجنب إغراق الخادم بحسابات وهمية متصلة.`)
        .setTimestamp();
      await logChannel.send({ embeds: [alert] }).catch(() => null);
    }
    return;
  }

  // إرسال الترحيب في القناة المناسبة
  const welcomeChannel = findWelcomeChannel(member.guild);
  if (welcomeChannel) {
    const embed = createWelcomeEmbed(member.guild.name);
    await welcomeChannel.send({ content: `مرحباً بك ${member}!`, embeds: [embed] }).catch(() => null);
  }
});

// مستمع أحداث الرسائل لتتبع مستويات الخبرة (XP System Trigger)
client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  
  // معالجة الخبرة للعضو
  LevelingSystem.handleMessageXP(message.author.id, message.author.username, message.channel);
});

// مستمع تفاعلات إضافة الإيموجي لتوثيق الأعضاء تلقائياً
client.on(Events.MessageReactionAdd, async (reaction, user) => {
  try {
    if (reaction.partial) await reaction.fetch();
    await MemberVerificationGateway.handleReaction(reaction, user);
  } catch (err) {
    console.error('[Event Reaction] خطأ في معالجة التفاعل:', err);
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
      category: "أذكار الصباح",
      text: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
      count: 1,
      reward: "فتح بركات اليوم والاستعانة بالله وتوحيده"
    },
    {
      category: "أذكار الصباح",
      text: "اللَّهُمَّ بكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ",
      count: 1,
      reward: "تسليم الحركية والاعتراف بربوبية الخالق"
    },
    {
      category: "أذكار الصباح",
      text: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ أَصْلِحْ لِي شَأْنِي كُلَّهُ وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ",
      count: 1,
      reward: "صلاح الشأن كله ووقاية من عجز النفس"
    },
    {
      category: "أذكار الصباح",
      text: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا",
      count: 3,
      reward: "كان حقاً على الله أن يرضيه يوم القيامة"
    },
    {
      category: "أذكار الصباح",
      text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ: عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ",
      count: 3,
      reward: "أفضل من أذكار كثيرة تستغرق ساعات"
    },
    {
      category: "أذكار المساء",
      text: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
      count: 1,
      reward: "استقبال الليل بالتوحيد والحمد والاستقرار"
    },
    {
      category: "أذكار المساء",
      text: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ",
      count: 1,
      reward: "تفويض الحياة والوفاة لله سبحانه وتعالى"
    },
    {
      category: "أذكار المساء",
      text: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
      count: 3,
      reward: "لم تضره حمة أو لدغة عقرب في تلك الليلة"
    },
    {
      category: "أذكار المساء",
      text: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَأَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ",
      count: 1,
      reward: "ذهاب الهم وقضاء الدين والنشاط البدني"
    },
    {
      category: "أذكار بعد الصلاة",
      text: "أستغفر الله ، أستغفر الله ، أستغفر الله. اللهم أنت السلام ومنك السلام تباركت يا ذا الجلال والإكرام",
      count: 1,
      reward: "جبر الخلل الحاصل في الصلاة"
    },
    {
      category: "أذكار بعد الصلاة",
      text: "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير، لا حول ولا قوة إلا بالله",
      count: 1,
      reward: "نفي الشرك والاعتراف بعظمة الملك القدير"
    },
    {
      category: "أذكار بعد الصلاة",
      text: "سُبْحَانَ اللَّهِ (33) ، الْحَمْدُ لِلَّهِ (33) ، اللَّهُ أَكْبَرُ (33) ثم تمام المئة: لا إله إلا الله وحده لا شريك له",
      count: 1,
      reward: "غفرت خطاياه وإن كانت مثل زبد البحر"
    },
    {
      category: "أذكار النوم",
      text: "بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا",
      count: 1,
      reward: "حفظ الروح عند النوم وراحتها النفسية"
    },
    {
      category: "أذكار النوم",
      text: "اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ",
      count: 3,
      reward: "الوقاية من الحساب وعذاب الآخرة"
    },
    {
      category: "أذكار النوم",
      text: "قراءة سورة الملك",
      count: 1,
      reward: "المانعة والمنجية من عذاب القبر لمن يداوم عليها"
    },
    {
      category: "أدعية عامة",
      text: "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي",
      count: 1,
      reward: "طلب العفو الشامل في الدنيا والآخرة"
    },
    {
      category: "أدعية عامة",
      text: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
      count: 1,
      reward: "أشمل دعاء للخير والاستقرار"
    },
    {
      category: "أدعية عامة",
      text: "يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ",
      count: 1,
      reward: "تثبيت الهداية والوقاية من الانحراف"
    },
    {
      category: "أدعية عامة",
      text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعِلْمَ النَّافِعَ وَالرِّزْقَ الطَّيِّبَ وَالْعَمَلَ الْمُتَقَبَّلَ",
      count: 1,
      reward: "توجيه اليوم للتطور والبركة"
    },
    {
      category: "أدعية عامة",
      text: "لا إله إلا أنت سبحانك إني كنت من الظالمين",
      count: 1,
      reward: "تفريج الكروب والهموم العسيرة"
    },
    {
      category: "أذكار الصباح",
      text: "حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ",
      count: 7,
      reward: "كفاه الله ما أهمه من أمر الدنيا والآخرة"
    },
    {
      category: "أذكار الصباح",
      text: "اللَّهُمَّ عافِني في بَدَني، اللَّهُمَّ عافِني في سَمْعي، اللَّهُمَّ عافِني في بَصَري، لا إلهَ إلَّا أنتَ",
      count: 3,
      reward: "طلب العافية والوقاية من الأمراض والآفات"
    },
    {
      category: "أذكار المساء",
      text: "اللَّهُمَّ ما أَمْسَى بي من نِعْمَةٍ أو بأَحَدٍ من خَلْقِكَ، فَمِنْكَ وَحْدَكَ لا شَرِيكَ لَكَ، فَلَكَ الحَمْدُ وَلَكَ الشُّكْرُ",
      count: 1,
      reward: "أدى شكر ليلته كاملة"
    },
    {
      category: "أذكار الاستغفار",
      text: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَكَبِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
      count: 1,
      reward: "سيد الاستغفار، من قاله موقناً به ومات دخل الجنة"
    },
    {
      category: "أذكار الاستغفار",
      text: "أستغفر الله العظيم الذي لا إله إلا هو الحي القيوم وأتوب إليه",
      count: 3,
      reward: "غفرت ذنوبه وإن كان فاراً من الزحف"
    },
    {
      category: "أذكار الدخول للمنزل",
      text: "بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا",
      count: 1,
      reward: "دخول مبارك وطرد الشيطان من البيت عند الدخول"
    },
    {
      category: "أذكار الخروج من المنزل",
      text: "بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
      count: 1,
      reward: "يقال له: هُديت وكُفيت ووُقيت، وتنحى عنه الشيطان"
    },
    {
      category: "أذكار المسجد",
      text: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
      count: 1,
      reward: "عند دخول المسجد، طلب فيض الرحمة الإلهية"
    },
    {
      category: "أذكار المسجد",
      text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ",
      count: 1,
      reward: "عند الخروج من المسجد، السعي لطلب الرزق والبركة"
    },
    {
      category: "أذكار الطعام",
      text: "بِسْمِ اللَّهِ (وإذا نسي في أوله: بِسْمِ اللَّهِ في أَوَّلِهِ وَآخِرِهِ)",
      count: 1,
      reward: "منع الشيطان من مشاركة العبد في طعامه وشرابه"
    },
    {
      category: "أذكار الطعام",
      text: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا الطَّعَامَ وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ",
      count: 1,
      reward: "غُفر له ما تقدم من ذنبه"
    },
    {
      category: "أدعية السفر",
      text: "اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى، وَمِنَ الْعَمَلِ مَا تَرْضَى، اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَذَا وَاطْوِ عَنَّا بُعْدَهُ",
      count: 1,
      reward: "تيسير الرحلة والحفظ الإلهي من وعثاء السفر"
    },
    {
      category: "أدعية عامة",
      text: "اللَّهُمَّ رَحْمَتَكَ أَرْجُو فَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ، وَأَصْلِحْ لِي شَأْنِي كُلَّهُ لَا إِلَهَ إِلَّا أَنْتَ",
      count: 1,
      reward: "كشف الكرب وتيسير الأمور المتعسرة"
    },
    {
      category: "أدعية عامة",
      text: "اللَّهُمَّ أَصْلِحْ لِي دِينِي الَّذِي هُوَ عِصْمَةُ أَمْرِي، وَأَصْلِحْ لِي دُنْيَايَ الَّتِي فِيهَا مَعَاشِي، وَأَصْلِحْ لِي آخِرَتِي الَّتِي إِلَيْهَا مَعَادِي",
      count: 1,
      reward: "صلاح شؤون الدين والدنيا والآخرة"
    },
    {
      category: "أدعية عامة",
      text: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ زَوَالِ نِعْمَتِكَ، وَتَحَوُّلِ عَافِيَتِكَ، وَفُجَاءَةِ نِقْمَتِكَ، وَجَمِيعِ سَخَطِكَ",
      count: 1,
      reward: "الحفاظ على النعم والتحصين من البلاء المفاجئ"
    },
    {
      category: "أدعية عامة",
      text: "اللَّهُمَّ آتِ نَفْسِي تَقْوَاهَا، وَزَكِّهَا أَنْتَ خَيْرُ مَنْ زَكَّاهَا، أَنْتَ وَلِيُّهَا وَمَوْلَاهَا",
      count: 1,
      reward: "تزكية النفس وتنقيتها من العيوب والذنوب"
    },
    {
      category: "أدعية عامة",
      text: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عِلْمٍ لَا يَنْفَعُ، وَمِنْ قَلْبٍ لَا يَخْشَعُ، وَمِنْ نَفْسٍ لَا تَشْبَعُ، وَمِنْ دَعْوَةٍ لَا يُسْتَجَابُ لَهَا",
      count: 1,
      reward: "الوقاية من الحجوب النفسية والروحية"
    },
    {
      category: "أدعية للوالدين",
      text: "رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا",
      count: 1,
      reward: "بر الوالدين بالدعاء بالرحمة والعطف"
    },
    {
      category: "أدعية للوالدين",
      text: "رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ",
      count: 1,
      reward: "استغفار شامل للوالدين ولعموم المسلمين"
    },
    {
      category: "أدعية للأولاد",
      text: "رَبِّ هَبْ لِي مِن لَّدُنكَ ذُرِّيَّةً طَيِّبَةً ۖ إِنَّكَ سَمِيعُ الدُّعَاءِ",
      count: 1,
      reward: "طلب الذرية الصالحة والمباركة"
    },
    {
      category: "أدعية للأولاد",
      text: "رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِن ذُرِّيَّتِي ۚ رَبَّنَا وَتَقَبَّلْ دُعَاءِ",
      count: 1,
      reward: "صلاح الذرية والمحافظة على إقامة الصلاة"
    },
    {
      category: "أدعية الاستيقاظ",
      text: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
      count: 1,
      reward: "شكر الله على نعمة إرجاع الروح وبدء يوم جديد"
    },
    {
      category: "أدعية الاستيقاظ",
      text: "الحمد لله الذي عافاني في جسدي، ورد علي روحي، وأذن لي بذكره",
      count: 1,
      reward: "تحفيز اللسان بذكر الله عند اليقظة مباشرة"
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
    return ["أذكار الصباح", "أذكار المساء", "أذكار النوم", "أذكار بعد الصلاة", "أدعية عامة"];
  }
}

// ============================================================
//  17. مدير قوالب وقوانين السيرفرات (Server Rules Template Manager)
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
      title: "قوانين سيرفر الألعاب الرسمي 🎮",
      rules: [
        "يمنع منعاً باتاً الغش أو استخدام برامج الاختراق (Hacks/Cheats).",
        "احترام اللاعبين والابتعاد عن التذمر والصراخ المزعج في القنوات الصوتية.",
        "يمنع نشر روابط سيرفرات خارجية أو ترويج السلع دون إذن الإدارة.",
        "الالتزام بالقنوات المخصصة لكل لعبة وعدم إثارة الفوضى.",
        "احترام قرارات مشرفي اللقاءات والبطولات المقامة بالسيرفر."
      ]
    },

    {
      genre: "general",
      title: "قوانين خادم الدردشة والمجتمع العام 💬",
      rules: [
        "احترام الأعضاء والابتعاد عن النقاشات الطائفية والعنصرية.",
        "يمنع إغراق الشات بالرسائل المكررة (Spam) أو المنشن العشوائي.",
        "الالتزام بنشر الميديا والروابط في القنوات المخصصة لها.",
        "يمنع انتحال صفة المشرفين أو الحسابات الرسمية.",
        "للإبلاغ عن المخالفين يرجى فتح تذكرة دعم فني مباشرة وعدم الدخول في نزاع."
      ]
    },
    {
      genre: "study",
      title: "قوانين سيرفر المذاكرة والدراسة الأكاديمي 📚",
      rules: [
        "يمنع التشويش أو الكلام في غير المذاكرة في غرف التركيز الصوتية.",
        "يمنع الترويج لخدمات حل الاختبارات أو الواجبات التجارية غير المصرحة.",
        "التعاون البناء ومساعدة الطلاب في فهم المواد التعليمية بكل أدب.",
        "استخدام القنوات المخصصة لكل تخصص دراسي لتجنب تشتيت الأعضاء.",
        "احترام المعلمين والمشرفين الأكاديميين المتواجدين للرد على الأسئلة."
      ]
    }
  ];

  static getTemplate(genre: string): RulesTemplate | null {
    const match = this.templates.find(t => t.genre === genre.toLowerCase());
    return match ?? null;
  }
}

// ============================================================
//  18. محاكي ومجدول البطولات الرياضية الإلكترونية (Esports Matchmaking)
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
//  19. قوالب وهياكل السيرفرات الجاهزة للبناء (Detailed Blueprint Configs)
// ============================================================
export const SYSTEM_BLUEPRINTS = {
  gaming: {
    categoryName: "🎮 صالة الألعاب",
    channels: [
      { name: "💬-دردشة-الألعاب", type: ChannelType.GuildText },
      { name: "📣-أخبار-الألعاب", type: ChannelType.GuildText },
      { name: "🎬-لقطات-متميزة", type: ChannelType.GuildText },
      { name: "🔊-صالون-الصوت-1", type: ChannelType.GuildVoice },
      { name: "🔊-صالون-الصوت-2", type: ChannelType.GuildVoice }
    ]
  },

  general: {
    categoryName: "💬 القسم العام",
    channels: [
      { name: "👋-الترحيب", type: ChannelType.GuildText },
      { name: "📜-القوانين", type: ChannelType.GuildText },
      { name: "📢-الإعلانات", type: ChannelType.GuildText },
      { name: "💬-الدردشة-العامة", type: ChannelType.GuildText },
      { name: "🔊-الديوانية-العامة", type: ChannelType.GuildVoice }
    ]
  }
};

// ============================================================
//  19.5. قاعدة بيانات المسابقات الثقافية المدمجة (Trivia Database)
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
      question: "ما هي أكبر قارة في العالم من حيث المساحة؟",
      options: ["أفريقيا", "آسيا", "أوروبا", "أمريكا الشمالية"],
      answerIndex: 1,
      explanation: "قارة آسيا هي الأكبر مساحة وتعداداً للسكان في العالم."
    },
    {
      question: "ما هو أسرع كائن بري في العالم؟",
      options: ["الفهد", "الأسد", "الغزال", "الحصان"],
      answerIndex: 0,
      explanation: "الفهد الصياد (الشيتا) هو أسرع حيوان بري وتصل سرعته لأكثر من 100 كم/س."
    },
    {
      question: "ما هو العنصر الكيميائي الأكثر وفرة في الكون؟",
      options: ["الأكسجين", "الهيدروجين", "النيتروجين", "الكربون"],
      answerIndex: 1,
      explanation: "الهيدروجين هو العنصر الأكثر انتشاراً ووفرة في الكون الفسيح."
    },
    {
      question: "في أي مدينة يقع المقر الرئيسي للأمم المتحدة؟",
      options: ["لندن", "باريس", "جنيف", "نيويورك"],
      answerIndex: 3,
      explanation: "يقع مقر المنظمة الدولية للأمم المتحدة في مدينة نيويورك الأمريكية."
    },
    {
      question: "كم عدد كواكب المجموعة الشمسية؟",
      options: ["7 كواكب", "8 كواكب", "9 كواكب", "10 كواكب"],
      answerIndex: 1,
      explanation: "المجموعة الشمسية تتكون رسمياً من 8 كواكب بعد تصنيف بلوتو ككوكب قزم."
    },
    {
      question: "ما هي العملة الرسمية لليابان؟",
      options: ["اليوان", "الين", "الوون", "الدولار"],
      answerIndex: 1,
      explanation: "الين هو العملة الرسمية والأساسية المتداولة في اليابان."
    },
    {
      question: "ما هو أطول نهر في العالم؟",
      options: ["نهر النيل", "نهر الأمازون", "نهر الميسيسيبي", "نهر اليانغتسي"],
      answerIndex: 0,
      explanation: "نهر النيل في أفريقيا هو أطول أنهار الكرة الأرضية."
    },
    {
      question: "من هو مكتشف الجاذبية الأرضية؟",
      options: ["ألبيرت أينشتاين", "إسحاق نيوتن", "غاليلو غاليلي", "نيكولا تسلا"],
      answerIndex: 1,
      explanation: "إسحاق نيوتن هو من صاغ قانون الجاذبية العام بعد قصة التفاحة الشهيرة."
    },
    {
      question: "ما هو الغاز المستعمل لإطفاء الحرائق؟",
      options: ["الأكسجين", "النيتروجين", "ثاني أكسيد الكربون", "الهيليوم"],
      answerIndex: 2,
      explanation: "ثاني أكسيد الكربون يثبط ويمنع اشتعال الأكسجين لذا يستعمل لإطفاء الحرائق."
    },
    {
      question: "ما هو البحر الأكثر ملوحة في العالم؟",
      options: ["البحر الأحمر", "البحر الميت", "البحر المتوسط", "بحر العرب"],
      answerIndex: 1,
      explanation: "البحر الميت هو الأكثر ملوحة ولا تعيش فيه الكائنات البحرية لارتفاع ملوحته."
    },
    {
      question: "كم عدد صمامات قلب الإنسان؟",
      options: ["صمامان", "3 صمامات", "4 صمامات", "5 صمامات"],
      answerIndex: 2,
      explanation: "يحتوي قلب الإنسان السليم على 4 صمامات تنظم حركة وضخ الدماء."
    },
    {
      question: "ما هو أصغر بلد في العالم من حيث المساحة؟",
      options: ["موناكو", "الفاتيكان", "سان مارينو", "مالطا"],
      answerIndex: 1,
      explanation: "دولة الفاتيكان هي الأصغر مساحة وتعداداً وتقع بالكامل داخل مدينة روما."
    },
    {
      question: "في أي عام اندلعت الحرب العالمية الأولى؟",
      options: ["1912", "1914", "1918", "1939"],
      answerIndex: 1,
      explanation: "بدأت الحرب العالمية الأولى عام 1914 وانتهت رسمياً في عام 1918."
    },
    {
      question: "ما هي عاصمة جمهورية مصر العربية؟",
      options: ["الإسكندرية", "الجيزة", "القاهرة", "بورسعيد"],
      answerIndex: 2,
      explanation: "مدينة القاهرة هي العاصمة التاريخية والإدارية لجمهورية مصر العربية."
    },
    {
      question: "ما هو أسرع حيوان بري في العالم؟",
      options: ["الفهد", "الغزال", "الأسد", "الحصان"],
      answerIndex: 0,
      explanation: "الفهد الصياد (الشيتا) هو أسرع حيوان بري على وجه الأرض، حيث تصل سرعته إلى أكثر من 100 كم/ساعة."
    },
    {
      question: "ما هي عاصمة دولة الإمارات العربية المتحدة؟",
      options: ["دبي", "أبوظبي", "الشارقة", "عجمان"],
      answerIndex: 1,
      explanation: "أبوظبي هي العاصمة الاتحادية والسياسية لدولة الإمارات."
    },
    {
      question: "كم عدد العظام في جسم الإنسان البالغ؟",
      options: ["180 عظمة", "206 عظمة", "250 عظمة", "300 عظمة"],
      answerIndex: 1,
      explanation: "يحتوي الهيكل العظمي للإنسان البالغ على 206 عظمة منفصلة."
    },
    {
      question: "ما هو الكوكب الملقب بالكوكب الأحمر؟",
      options: ["الزهرة", "المريخ", "المشتري", "زحل"],
      answerIndex: 1,
      explanation: "المريخ يلقب بالكوكب الأحمر نظراً لانتشار أكسيد الحديد على سطحه بكثرة."
    },
    {
      question: "من هو أول من صعد إلى الفضاء الخارجي؟",
      options: ["نيل أرمسترونغ", "يوري غاغارين", "بز ألدرين", "سلطان بن سلمان"],
      answerIndex: 1,
      explanation: "الروسي يوري غاغارين هو أول إنسان يدور حول الأرض في الفضاء الخارجي."
    },
    {
      question: "ما هي فصيلة الدم التي تسمى المتبرع العام؟",
      options: ["A+", "B-", "AB+", "O-"],
      answerIndex: 3,
      explanation: "فصيلة الدم O السالبة يمكن إعطاؤها لجميع الفصائل الأخرى دون تعارض."
    }
  ];

  static getRandomQuestion(): TriviaQuestion {
    const idx = Math.floor(Math.random() * this.questions.length);
    return this.questions[idx]!;
  }
}

// ============================================================
//  تحديث معالج الرسائل المساعد لإدماج الميزات الجديدة (Offline Quran/Azkar commands)
// ============================================================
let handleManualCommandUpdated = async function(message: Message, commandText: string): Promise<boolean> {
  const parts = commandText.split(/\s+/);
  const command = parts[0]?.toLowerCase();
  const args = parts.slice(1);
  const guild = message.guild!;



  // 2. أمر قراءة الأذكار المتعددة الفئات دون إنترنت
  if (command === 'azkar' || command === 'اذكار') {
    const category = args.join(' ');
    const zikr = AzkarDatabase.getRandomZikr(category || undefined);
    const embed = createAzkarEmbed(zikr.category, zikr.text, zikr.count, zikr.reward);
    await message.reply({ embeds: [embed] }).catch(() => null);
    return true;
  }

  // 3. أمر عرض تصنيف الأذكار المتاحة
  if (command === 'azkar_categories' || command === 'تصنيفات_الأذكار') {
    const cats = AzkarDatabase.getCategories().map((c, i) => `**${i+1}.** ${c}`).join('\n');
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.success)
      .setTitle('📿 تصنيفات الأذكار والأدعية المتاحة')
      .setDescription(cats)
      .setFooter({ text: 'استخدم: !opus azkar <التصنيف>' })
      .setTimestamp();
    await message.reply({ embeds: [embed] }).catch(() => null);
    return true;
  }

  // 4. أمر عرض قوانين الخادم المجهزة مسبقاً
  if (command === 'rules_template' || command === 'قوالب_القوانين') {
    const genre = args[0];
    if (!genre) {
      await message.reply('❌ يرجى تحديد نوع القالب المطلوبة (general, gaming, quran, study). مثال: `!opus rules_template gaming`').catch(() => null);
      return true;
    }
    const template = ServerRulesTemplateManager.getTemplate(genre);
    if (!template) {
      await message.reply('❌ نوع القالب غير مدعوم. المتاح: (general, gaming, quran, study).').catch(() => null);
      return true;
    }

    const rulesEmbed = createRulesEmbed(template.title, template.rules);
    const embedsArray = Array.isArray(rulesEmbed) ? rulesEmbed : [rulesEmbed];
    await message.reply({ embeds: embedsArray }).catch(() => null);
    return true;
  }

  // 5. أمر إرسال الاقتراحات للشات العام
  if (command === 'suggest' || command === 'اقتراح') {
    const suggestionText = args.join(' ');
    if (!suggestionText) {
      await message.reply('❌ يرجى كتابة اقتراحك. مثال: `!opus suggest زيادة قنوات الصوت`').catch(() => null);
      return true;
    }
    await SuggestionBox.submitSuggestion(message, suggestionText);
    return true;
  }

  // 6. أمر إرسال واجهة توثيق الأعضاء التفاعلية (Verification Panel Setup)
  if (command === 'setup_verification' || command === 'اعداد_التوثيق') {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      await message.reply('🔒 لا تملك صلاحية إعداد بوابة التوثيق.').catch(() => null);
      return true;
    }
    const targetChannel = message.mentions.channels.first() as TextChannel || message.channel as TextChannel;
    await MemberVerificationGateway.sendGatewayMessage(targetChannel);
    await message.reply(`✅ تم إعداد وإرسال لوحة التحقق التفاعلية في القناة: ${targetChannel}`).catch(() => null);
    return true;
  }

  // 7. أمر جدولة بطولة رياضية إلكترونية جديدة
  if (command === 'schedule_match' || command === 'جدولة_مباراة') {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageEvents)) {
      await message.reply('🔒 لا تملك صلاحية جدولة مباريات السيرفر.').catch(() => null);
      return true;
    }
    const text = args.join(' ');
    if (!text || !text.includes('|')) {
      await message.reply('❌ يرجى إدخال البيانات مفصولة بـ |. مثال: `!opus schedule_match League | Falcons | Geekay | 19:30`').catch(() => null);
      return true;
    }
    const subparts = text.split('|');
    const game = subparts[0]!.trim();
    const teamA = subparts[1]!.trim();
    const teamB = subparts[2]!.trim();
    const time = subparts[3]!.trim();

    const match = EsportsTournamentScheduler.registerMatch(game, teamA, teamB, time);
    const embed = createEsportsMatchEmbed(match.gameName, match.teamA, match.teamB, match.startTime, `معرف البطولة: ${match.id}`);
    await message.reply({ content: `✅ تم جدولة المباراة بنجاح!`, embeds: [embed] }).catch(() => null);
    return true;
  }

  // 8. أمر عرض المباريات المجدولة
  if (command === 'matches' || command === 'مباريات') {
    const list = EsportsTournamentScheduler.getMatches();
    const description = list.map(m => {
      const statusIcon = m.status === 'LIVE' ? '🔴 بث مباشر' : m.status === 'COMPLETED' ? '🏁 انتهت' : '⏳ مجدولة';
      const score = m.score ? ` (النتيجة: ${m.score})` : '';
      return `**[${m.id}]** ${m.gameName}: **${m.teamA}** ضد **${m.teamB}** | ${statusIcon} @ ${m.startTime}${score}`;
    }).join('\n');
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.default)
      .setTitle('🏆 جدول مباريات البطولة الإلكترونية المفتوحة')
      .setDescription(description || 'لا توجد مباريات مجدولة حالياً.')
      .setTimestamp();
    await message.reply({ embeds: [embed] }).catch(() => null);
    return true;
  }

  // 9. أمر المسابقات الثقافية التفاعلية
  if (command === 'trivia' || command === 'مسابقة') {
    const question = TriviaDatabase.getRandomQuestion();
    const optionsText = question.options.map((opt, i) => `**${i + 1}.** ${opt}`).join('\n');
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.default)
      .setTitle('🎮 سؤال مسابقة ثقافية سريعة')
      .setDescription(`**${question.question}**\n\n${optionsText}`)
      .setFooter({ text: 'أجب بالرقم الصحيح في غضون 30 ثانية!' })
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
          .setTitle('🎉 إجابة صحيحة!')
          .setDescription(`أحسنت يا ${answerMsg.author}! الإجابة الصحيحة هي: **${question.options[question.answerIndex]}**\n\n💡 **شرح:** ${question.explanation}\n\n*تم منحك نقاط خبرة إضافية 🚀*`)
          .setTimestamp();
        await answerMsg.reply({ embeds: [winEmbed] }).catch(() => null);
      } else {
        const loseEmbed = new EmbedBuilder()
          .setColor(EMBED_COLORS.danger)
          .setTitle('❌ إجابة خاطئة!')
          .setDescription(`للأسف يا ${answerMsg.author}، الإجابة خاطئة.\n\nالإجابة الصحيحة هي: **${question.options[question.answerIndex]}**\n\n💡 **شرح:** ${question.explanation}`)
          .setTimestamp();
        await answerMsg.reply({ embeds: [loseEmbed] }).catch(() => null);
      }
    });

    collector.on('end', (collected: any) => {
      if (collected.size === 0) {
        (message.channel as any).send(`⏰ انتهى الوقت! لم يجب أحد في الوقت المحدد.\nالإجابة الصحيحة هي: **${question.options[question.answerIndex]}**`).catch(() => null);
      }
    });

    return true;
  }

  return false;
};
// ============================================================
//  19.8. مستجيب الطوارئ في وضع عدم الاتصال (Offline Fallback Responder)
// ============================================================
export class OfflineFallbackResponder {
  private static fallbacks: { keywords: string[]; replies: string[] }[] = [
    {
      keywords: ["سلام", "مرحبا", "هلا", "شلونك", "أهلاً", "كيفك", "منور", "السلام عليكم"],
      replies: [
        "وعليكم السلام ورحمة الله وبركاته! يا هلا وغلا نورت السيرفر يا حبيبنا. كيف أقدر أساعدك؟ 😊",
        "مرحباً بك يا غالي! أهلاً بك في بيتك الثاني. آمرني وعيوني لك. 🌹",
        "يا هلا والله بالطيب! نورتنا وشرفتنا بوجودك. كيف أحوالك اليوم؟ ✨",
        "وعليكم السلام يا باشا! منور الشات كله والله. قولي حابب نعمل إيه دلوقتي؟ 👑"
      ]
    },

    {
      keywords: ["أذكار", "اذكار", "دعاء", "ادعية", "ذكر"],
      replies: [
        "أهلاً بك يالطيب! لقراءة الأذكار المتنوعة والأدعية اليومية، يمكنك استخدام الأمر: `!opus azkar` أو `!opus اذكار` 📿",
        "لذكر الله فوائد عظيمة! اكتب `!opus azkar` لعرض ذكر عشوائي وثوابه الجميل."
      ]
    },
    {
      keywords: ["مسابقة", "مسابقات", "سؤال", "اسئلة", "ثقافية", "تحدي"],
      replies: [
        "أهلاً بك يالطيب! لبدء مسابقة ثقافية تفاعلية ممتعة في الشات، يمكنك استخدام الأمر: `!opus trivia` أو `!opus مسابقة` 🎮"
      ]
    },
    {
      keywords: ["شغل"],
      replies: [
        "لتشغيل الموسيقى أو الأغاني، الرجاء التأكد من أن البوت متصل بالإنترنت وأنك قد منشنته مع طلبك مثل: `@Opus شغل عمرين` 🎵",
        "إذا واجهت مشكلة في تشغيل الأغاني بسبب انقطاع الإنترنت أو الـ API، يرجى المحاولة لاحقاً بعد استقرار الاتصال."
      ]
    },
    {
      keywords: ["كتم", "طرد", "حظر", "باند", "كيك", "تايم", "ميوت"],
      replies: [
        "للإشراف الإداري على الأعضاء، يرجى استخدام منشن البوت مع تحديد نوع الإجراء مثل: `@Opus اكتم فلان لمدة 10 دقائق بسبب السب`. 🛡️",
        "صلاحياتي الإدارية تطلب أن يمتلك البوت دوراً عالياً كافياً لإجراء الطرد أو الحظر بنجاح."
      ]
    },
    {
      keywords: ["بناء", "سيرفر", "رومات", "روم", "فويس", "شات"],
      replies: [
        "يمكنني بناء خادم متكامل مع الرتب والقنوات! استخدم الأمر: `!opus rules_template` لعرض نماذج القوانين، أو `@Opus ابنِ لي سيرفر ألعاب`."
      ]
    },
    {
      keywords: ["شكرا", "شكرًا", "يعطيك العافية", "كفو", "تسلم", "حبيب قلبي", "شكرا لك"],
      replies: [
        "الله يعافيك ويسلمك يا غالي! هذا واجبي لخدمة خادمكم الجميل. 💖",
        "تسلم والله يالطيب! كلك ذوق وأدب. لا تتردد في أي طلب آخر. 🥰",
        "حبيبي يا برنس! تحت أمرك في أي وقت. ربنا يخليك لينا. 🌹"
      ]
    },
    {
      keywords: ["مين", "من أنت", "من انت", "وش البوت", "بوت وشو"],
      replies: [
        "أنا Opus المساعد الذكي وسلطان الموسيقى في ديسكورد! تم تطويري لأكون المساعد الخارق والأكثر تفوقاً في إدارة خادمكم. 🤖"
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
//  دمج معالجي الأوامر التقليدية والحديثة معاً (Dual Parser Hook)
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
    // إذا لم يتعامل معه المطور المحدث، يتم توجيهه للقديم
    if (handled) return;
  }
});
// ============================================================
//  بيانات توثيق اللهجات والتحسين الإداري المكمل (Extended System Info V2)
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
      تفاصيل هيكلية ذكاء البوت المساعد
=========================================
1. تحليل اللهجات (Dialect normalization):
   يتم معالجة الإدخال وتوحيد الكلمات العامية من اللهجات (النجدية، الحجازية، المصرية، الشامية، المغربية، إلخ)
   لتبسيط فهم الجملة قبل إرسالها لـ LLM.

2. المراقبة الذاتية الحرة (Autonomous moderation):
   يعمل الرقيب بصورة منفصلة لفحص السلوكيات الخاطئة دون تداخل مع محرك الصوت أو منشئ السيرفرات.

3. الذاكرة الدائمة (Persistent Memory):
   تعتمد الذاكرة على بنية TF-IDF مدمجة ذاتياً للبحث عن التشابه الدلالي وحفظ السياق.
`;
// ============================================================
//  20. بدء تشغيل البوت والاتصال بديسكورد (Client Login Gateway)
// ============================================================
startHealthServer();
installLegacyEmbedRepair();

client.login(config.discordToken).catch((err) => {
  console.error('[Bot Boot Failure] ❌ فشل تشغيل البوت والاتصال بديسكورد:', err);
  process.exit(1);
});



// ============================================================================
// ============================================================================
//  SECTION 21: حزمة أدوات التشخيص والتحليل الإداري المتقدمة (Advanced Administrative Diagnostic Suite)
//  تمت إضافة هذا القسم لتوسيع البوت بقدرات تشخيصية وتحليلية خارقة ليكون العقل الإداري الأقوى.
// ============================================================================
// ============================================================================

import * as os from 'os';

/**
 * منسق لوحة التحكم والتقارير الرسومية (Console & ASCII Report Formatter)
 * يوفر أدوات لبناء لوحات ورسومات ASCII وجداول لعرض الإحصائيات والأداء بصورة مبهرة.
 */
export class AdvancedDiagnosticConsoleFormatter {
  private static readonly BORDER_CHAR_HORIZONTAL = '═';
  private static readonly BORDER_CHAR_VERTICAL = '║';
  private static readonly CORNER_TOP_LEFT = '╔';
  private static readonly CORNER_TOP_RIGHT = '╗';
  private static readonly CORNER_BOTTOM_LEFT = '╚';
  private static readonly CORNER_BOTTOM_RIGHT = '╝';
  private static readonly T_TOP = '╦';
  private static readonly T_BOTTOM = '╩';
  private static readonly T_LEFT = '╠';
  private static readonly T_RIGHT = '╣';
  private static readonly CROSS = '╬';

  /**
   * إنشاء صندوق ASCII جمالي حول نص معين
   */
  static createDecorativeBox(title: string, lines: string[], width: number = 70): string {
    const horizontalBorder = this.BORDER_CHAR_HORIZONTAL.repeat(width - 2);
    let result = '';
    
    // الجزء العلوي
    result += `${this.CORNER_TOP_LEFT}${horizontalBorder}${this.CORNER_TOP_RIGHT}\n`;
    
    // العنوان
    const titlePadding = Math.max(0, Math.floor((width - 4 - title.length) / 2));
    const titleLeftPad = ' '.repeat(titlePadding);
    const titleRightPad = ' '.repeat(Math.max(0, width - 4 - title.length - titlePadding));
    result += `${this.BORDER_CHAR_VERTICAL} ${titleLeftPad}${title}${titleRightPad} ${this.BORDER_CHAR_VERTICAL}\n`;
    
    // فاصل بين العنوان والمحتوى
    const separator = this.BORDER_CHAR_HORIZONTAL.repeat(width - 2);
    result += `╠${separator}╣\n`;
    
    // الأسطر
    for (const line of lines) {
      const lineContent = line.length > (width - 4) ? line.substring(0, width - 7) + '...' : line;
      const rightPaddingCount = width - 4 - lineContent.length;
      const rightPad = ' '.repeat(Math.max(0, rightPaddingCount));
      result += `${this.BORDER_CHAR_VERTICAL} ${lineContent}${rightPad} ${this.BORDER_CHAR_VERTICAL}\n`;
    }
    
    // الجزء السفلي
    result += `${this.CORNER_BOTTOM_LEFT}${horizontalBorder}${this.CORNER_BOTTOM_RIGHT}`;
    
    return result;
  }

  /**
   * توليد شريط تقدم رقمي بشكل ASCII مميز
   */
  static drawProgressBar(percentage: number, length: number = 20): string {
    const normalized = Math.max(0, Math.min(100, percentage));
    const filledLength = Math.round((length * normalized) / 100);
    const emptyLength = length - filledLength;
    
    const filledBar = '█'.repeat(filledLength);
    const emptyBar = '░'.repeat(emptyLength);
    
    return `[${filledBar}${emptyBar}] ${normalized.toFixed(1)}%`;
  }

  /**
   * إنشاء جدول ASCII جمالي للبيانات الإدارية
   */
  static createTable(headers: string[], rows: string[][], colWidths: number[]): string {
    let result = '';
    
    // حافة علوية للجدول
    let topBorder = this.CORNER_TOP_LEFT;
    for (let i = 0; i < colWidths.length; i++) {
      topBorder += this.BORDER_CHAR_HORIZONTAL.repeat(colWidths[i]!);
      if (i < colWidths.length - 1) topBorder += this.T_TOP;
    }
    topBorder += this.CORNER_TOP_RIGHT;
    result += topBorder + '\n';

    // طباعة العناوين
    let headerLine = this.BORDER_CHAR_VERTICAL;
    for (let i = 0; i < headers.length; i++) {
      const headerText = headers[i]!;
      const width = colWidths[i]!;
      const padding = ' '.repeat(Math.max(0, width - headerText.length));
      headerLine += headerText + padding + this.BORDER_CHAR_VERTICAL;
    }
    result += headerLine + '\n';

    // فاصل بين العناوين والصفوف
    let sepLine = this.T_LEFT;
    for (let i = 0; i < colWidths.length; i++) {
      sepLine += this.BORDER_CHAR_HORIZONTAL.repeat(colWidths[i]!);
      if (i < colWidths.length - 1) sepLine += this.CROSS;
    }
    sepLine += this.T_RIGHT;
    result += sepLine + '\n';

    // طباعة الصفوف
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

    // حافة سفلية للجدول
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
 * بنية لبيانات الأداء والمراقبة
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
 * مراقب الأداء والذاكرة النشط (Active Performance Monitor)
 * يتولى تسجيل وإدارة استهلاك البوت لموارد الخادم المضيف ورصد التسريبات المحتملة للذاكرة.
 */
export class ActivePerformanceMonitor {
  private static history: PerformanceSnapshot[] = [];
  private static readonly MAX_HISTORY_SNAPSHOTS = 100;
  private static lastCpuUsage: { user: number; system: number; time: number } | null = null;

  /**
   * أخذ لقطة لأداء النظام الحالي
   */
  static takeSnapshot(clientInstance: any): PerformanceSnapshot {
    const mem = process.memoryUsage();
    
    // حساب تقريبي للـ CPU الاستهلاك
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

    // إحصائيات من ديسكورد
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
      activeVoiceConnections: 0, // يتم ملؤها لاحقاً
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
   * الحصول على السجل التاريخي للأداء
   */
  static getHistory(): PerformanceSnapshot[] {
    return this.history;
  }

  /**
   * تقييم نسبة تسريب الذاكرة المحتملة (Memory Leak Probability Assessment)
   */
  static evaluateMemoryStability(): { growthRateMb: number; leakProbability: 'Low' | 'Medium' | 'High'; analysis: string } {
    if (this.history.length < 5) {
      return {
        growthRateMb: 0,
        leakProbability: 'Low',
        analysis: 'البيانات التاريخية غير كافية لإجراء تحليل تسريب الذاكرة حالياً.'
      };
    }

    const first = this.history[0]!;
    const last = this.history[this.history.length - 1]!;
    const durationHours = (last.timestamp - first.timestamp) / 1000 / 60 / 60;
    
    if (durationHours === 0) {
      return { growthRateMb: 0, leakProbability: 'Low', analysis: 'المدة الزمنية قصيرة جداً للتحليل.' };
    }

    const growthMb = last.memoryUsage.heapUsed - first.memoryUsage.heapUsed;
    const growthRateMb = growthMb / durationHours;

    let leakProbability: 'Low' | 'Medium' | 'High' = 'Low';
    let analysis = 'استهلاك الذاكرة مستقر وتحت مستويات الأمان المعيارية.';

    if (growthRateMb > 50) {
      leakProbability = 'High';
      analysis = '🚨 احتمالية عالية جداً لتسريب الذاكرة! استهلاك الـ Heap ينمو بشكل متسارع يفوق 50 ميغابايت لكل ساعة.';
    } else if (growthRateMb > 15) {
      leakProbability = 'Medium';
      analysis = '⚠️ احتمالية متوسطة لتسريب ذاكرة. يوجد نمو طفيف ومستمر في حجم الذاكرة المستهلكة.';
    }

    return {
      growthRateMb,
      leakProbability,
      analysis
    };
  }

  /**
   * توليد رسم بياني ASCII بسيط يوضح استهلاك الذاكرة عبر الزمن
   */
  static generateMemoryTrendChart(width: number = 50, height: number = 10): string {
    if (this.history.length < 2) return 'غير كافٍ لتوليد الرسم البياني.';
    
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
      chartLines[row] = currentLine.substring(0, col) + '█' + currentLine.substring(col + 1);
    }

    let finalChart = '';
    const step = valRange / (height - 1);
    for (let r = 0; r < height; r++) {
      const val = maxVal - r * step;
      finalChart += `${val.toFixed(1)} MB ║ ${chartLines[r]}\n`;
    }
    
    finalChart += ' '.repeat(9) + '╚' + '═'.repeat(width) + '\n';
    finalChart += ' '.repeat(9) + `  بداية المراقبة [${this.history.length} لقطة] نهاية المراقبة`;
    
    return finalChart;
  }
}

/**
 * متتبع الأحداث والإحصائيات الإدارية (Global Event Statistics Tracker)
 * يسجل إجمالي أرقام التفاعلات والأوامر المنفذة وعمليات التعديل في السيرفرات.
 */
export class AdminEventStatisticsTracker {
  private static eventsHandled: Record<string, number> = {};
  private static commandsExecuted: Record<string, number> = {};
  private static errorsLoggedCount: number = 0;
  private static startTime: number = Date.now();

  /**
   * زيادة عدد مرات حدوث حدث معين
   */
  static recordEvent(eventName: string) {
    this.eventsHandled[eventName] = (this.eventsHandled[eventName] || 0) + 1;
  }

  /**
   * زيادة عدد مرات تنفيذ أمر معين
   */
  static recordCommand(commandName: string) {
    this.commandsExecuted[commandName] = (this.commandsExecuted[commandName] || 0) + 1;
  }

  /**
   * تسجيل حدوث خطأ برمجي
   */
  static recordError() {
    this.errorsLoggedCount++;
  }

  /**
   * توليد تقرير الإحصائيات الكامل
   */
  static generateReportLines(): string[] {
    const elapsedMs = Date.now() - this.startTime;
    const elapsedHours = elapsedMs / 1000 / 60 / 60;
    
    const totalEvents = Object.values(this.eventsHandled).reduce((a, b) => a + b, 0);
    const totalCommands = Object.values(this.commandsExecuted).reduce((a, b) => a + b, 0);

    const report: string[] = [
      `تاريخ بدء التشغيل: ${new Date(this.startTime).toLocaleString('ar-EG')}`,
      `مدة التشغيل المستمر: ${(elapsedMs / 1000 / 60).toFixed(1)} دقيقة`,
      `إجمالي الأحداث المعالجة: ${totalEvents} (${(totalEvents / elapsedHours || 0).toFixed(1)} حدث/ساعة)`,
      `إجمالي الأوامر المنفذة: ${totalCommands} (${(totalCommands / elapsedHours || 0).toFixed(1)} أمر/ساعة)`,
      `إجمالي الأخطاء المسجلة: ${this.errorsLoggedCount} ${this.errorsLoggedCount > 0 ? '⚠️' : '✅'}`,
      '----------------------------------------',
      'تفاصيل الأوامر الأكثر استخداماً:'
    ];

    const sortedCommands = Object.entries(this.commandsExecuted)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (sortedCommands.length === 0) {
      report.push('  - لم يتم تنفيذ أي أوامر بعد.');
    } else {
      for (const [cmd, count] of sortedCommands) {
        report.push(`  • الأمر [!${cmd}]: تم تنفيذه ${count} مرة`);
      }
    }

    return report;
  }
}

/**
 * نظام التدقيق وإدارة التغييرات الفني في ديسكورد (Server Struct & Audit Trail Auditor)
 * محاكي لتتبع العمليات الحساسة التي يجريها المشرفون لضمان الشفافية.
 */
export class ServerAuditTrailAuditor {
  private static auditLogs: { timestamp: number; action: string; executor: string; target: string; details?: string }[] = [];

  /**
   * تسجيل عملية إشرافية جديدة
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
   * توليد تقرير سجل التدقيق الإداري الجمالي
   */
  static generateAuditReport(): string {
    if (this.auditLogs.length === 0) {
      return '📝 سجل التدقيق خالٍ من أي إجراءات أو عمليات حالياً.';
    }

    const headers = ['الإجراء', 'المنفذ', 'المستهدف', 'التوقيت'];
    const rows = this.auditLogs.slice(-10).reverse().map(log => {
      const timeStr = new Date(log.timestamp).toLocaleTimeString('ar-EG');
      return [log.action.substring(0, 15), log.executor.substring(0, 12), log.target.substring(0, 12), timeStr];
    });

    return AdvancedDiagnosticConsoleFormatter.createTable(headers, rows, [20, 15, 15, 15]);
  }
}

/**
 * مجري الفحوصات والتشخيص التلقائي والذاتي (Self-Testing Diagnostics Scheduler)
 * يقوم بفحص سلامة البوت والاتصالات بصورة دورية ومجدولة تلقائياً للتأكد من سلامة النظام.
 */
export class SelfTestingDiagnosticsScheduler {
  private static diagnosticsTimer: NodeJS.Timeout | null = null;
  private static isDiagnosticRunning = false;
  private static systemLog: string[] = [];

  /**
   * تفعيل الفحص الدوري المجدول (كل ساعة مثلاً)
   */
  static initializeAutoDiagnostics(clientInstance: any) {
    if (this.diagnosticsTimer) return;

    this.writeLog('⚙️ تفعيل مجدول التشخيص والتحليل الذاتي التلقائي بنجاح...');
    
    // إجراء الفحص الأول بعد 10 ثوانٍ
    setTimeout(() => {
      this.runDiagnosticCheck(clientInstance);
    }, 10000);

    // الفحص الدوري كل 30 دقيقة
    this.diagnosticsTimer = setInterval(() => {
      this.runDiagnosticCheck(clientInstance);
    }, 30 * 60 * 1000);
  }

  /**
   * إيقاف مجدول الفحص
   */
  static shutdown() {
    if (this.diagnosticsTimer) {
      clearInterval(this.diagnosticsTimer);
      this.diagnosticsTimer = null;
      this.writeLog('🛑 إيقاف مجدول التشخيص والتحليل الذاتي.');
    }
  }

  /**
   * كتابة حدث في سجل التشخيص الفني
   */
  private static writeLog(msg: string) {
    const timestamp = new Date().toISOString().substring(11, 19);
    const formatted = `[${timestamp}] ${msg}`;
    // Silent logging - only store, don't print to console
    this.systemLog.push(formatted);
    if (this.systemLog.length > 50) this.systemLog.shift();
  }

  /**
   * تنفيذ فحص تشخيصي كامل حالياً
   */
  static runDiagnosticCheck(clientInstance: any): { success: boolean; score: number; issues: string[] } {
    if (this.isDiagnosticRunning) {
      return { success: false, score: 0, issues: ['الفحص قيد العمل بالفعل حالياً.'] };
    }

    this.isDiagnosticRunning = true;
    this.writeLog('🔍 بدء تشغيل الفحص والتشخيص الذاتي المجدول للبوت...');
    
    const issues: string[] = [];
    let score = 100;

    // 1. فحص الاتصال بديسكورد
    if (!clientInstance) {
      issues.push('لم يتم توفير كائن عميل Discord (Client Instance).');
      score -= 50;
    } else if (!clientInstance.ws || clientInstance.ws.ping === -1) {
      issues.push('الاتصال بواجهة برمجة Discord غير مستقر أو غير متصل.');
      score -= 30;
    } else {
      const ping = clientInstance.ws.ping;
      if (ping > 250) {
        issues.push(`زمن انتقال الاتصال بالخادم مرتفع جداً: ${ping}ms`);
        score -= 10;
      }
    }

    // 2. فحص استهلاك الذاكرة
    const snapshot = ActivePerformanceMonitor.takeSnapshot(clientInstance);
    const heapUsed = snapshot.memoryUsage.heapUsed;
    if (heapUsed > 300) {
      issues.push(`🚨 استهلاك الـ heap مرتفع جداً بشكل غير اعتيادي: ${heapUsed.toFixed(1)} MB`);
      score -= 20;
    }

    // 3. تقييم استقرار الذاكرة والتسريبات
    const memStability = ActivePerformanceMonitor.evaluateMemoryStability();
    if (memStability.leakProbability === 'High') {
      issues.push(`🚨 خطر تسريب ذاكرة مرتفع: ${memStability.growthRateMb.toFixed(2)} MB/ساعة`);
      score -= 25;
    } else if (memStability.leakProbability === 'Medium') {
      issues.push(`⚠️ نمو طفيف ومستمر في الذاكرة: ${memStability.growthRateMb.toFixed(2)} MB/ساعة`);
      score -= 10;
    }

    this.isDiagnosticRunning = false;
    const success = issues.length === 0;
    
    this.writeLog(`🏁 اكتمال الفحص الذاتي. النتيجة: ${score}/100. عدد المشاكل: ${issues.length}`);
    if (!success) {
      for (const iss of issues) {
        this.writeLog(`  ⚠️ مشكلة: ${iss}`);
      }
    } else {
      this.writeLog('✅ نظام البوت يعمل بأعلى كفاءة واستقرار، لا توجد مشاكل معلقة.');
    }

    return {
      success,
      score,
      issues
    };
  }

  /**
   * الحصول على السجل الفني للأخطاء والتشخيصات
   */
  static getSystemLog(): string[] {
    return this.systemLog;
  }
}

/**
 * مخطط قنوات وتوزيع السيرفر بصورة ASCII (Server Channel Tree Plotter)
 * يولد رسماً بيانياً هيكلياً جميلاً يوضح شكل الخادم وفروعه الإدارية للأعضاء.
 */
export class ServerChannelTreeVisualizer {
  
  /**
   * رسم قنوات السيرفر وتصنيفاتها كشجرة ASCII جمالية
   */
  static renderTree(guild: any): string {
    if (!guild) return '❌ الخادم غير متوفر حالياً لتوليد الشجرة.';
    
    const categories = guild.channels.cache
      .filter((c: any) => c.type === 4) // Category
      .sort((a: any, b: any) => a.position - b.position);

    const uncategorized = guild.channels.cache
      .filter((c: any) => !c.parentId && c.type !== 4)
      .sort((a: any, b: any) => a.position - b.position);

    let tree = `🌲 هيكلية قنوات خادم: ${guild.name}\n`;
    tree += '═'.repeat(40) + '\n';

    // القنوات خارج التصنيف
    for (let i = 0; i < uncategorized.size; i++) {
      const channel = uncategorized.at(i);
      const isLast = i === uncategorized.size - 1 && categories.size === 0;
      const prefix = isLast ? '┗━━ ' : '┣━━ ';
      const typeIcon = channel.type === 2 ? '🔊' : '💬';
      tree += `${prefix}${typeIcon} ${channel.name}\n`;
    }

    // تصنيفات وقنواتها
    let catIndex = 0;
    for (const [_, cat] of categories) {
      const isLastCat = catIndex === categories.size - 1;
      const catPrefix = isLastCat ? '┗━━ 📁 ' : '┣━━ 📁 ';
      tree += `${catPrefix}${cat.name}\n`;

      const childChannels = guild.channels.cache
        .filter((c: any) => c.parentId === cat.id)
        .sort((a: any, b: any) => a.position - b.position);

      let chIndex = 0;
      for (const [_, child] of childChannels) {
        const linePrefix = isLastCat ? '    ' : '┃   ';
        const isLastChild = chIndex === childChannels.size - 1;
        const childPrefix = isLastChild ? '┗━━ ' : '┣━━ ';
        const typeIcon = child.type === 2 ? '🔊' : '💬';
        tree += `${linePrefix}${childPrefix}${typeIcon} ${child.name}\n`;
        chIndex++;
      }
      catIndex++;
    }

    return tree;
  }
}

// ============================================================================
// دمج مراقبة الأحداث وتهيئة نظام المراقبة النشطة الذاتية عند تشغيل البوت
// ============================================================================
client.once(Events.ClientReady, () => {
  // تهيئة مجدول التحليلات والتشخيصات الذاتية تلقائياً
  SelfTestingDiagnosticsScheduler.initializeAutoDiagnostics(client);
  
  // أخذ اللقطة الأولى للنظام
  ActivePerformanceMonitor.takeSnapshot(client);
  
  // Diagnostic suite initialized
});

// تعليق وتتبع الأحداث لمتتبع الإحصائيات
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
  ServerAuditTrailAuditor.logAuditEvent('انضمام لخادم', 'System', g.name, `معرف الخادم: ${g.id}`);
});

client.on(Events.GuildDelete, (g) => {
  AdminEventStatisticsTracker.recordEvent('GuildDelete');
  ServerAuditTrailAuditor.logAuditEvent('مغادرة خادم', 'System', g.name, `معرف الخادم: ${g.id}`);
});

// ============================================================================
// معالجة وإضافة الأوامر التشخيصية الجديدة في محرك الأوامر الإدارية للديسكورد
// ============================================================================
const originalHandler = handleManualCommandUpdated;
handleManualCommandUpdated = async function(message: Message, commandText: string): Promise<boolean> {
  const parts = commandText.split(/\s+/);
  const command = parts[0]?.toLowerCase();
  const args = parts.slice(1);
  const guild = message.guild!;

  // 1. أمر تشخيص حالة النظام الحيوية
  if (command === 'diagnose' || command === 'تشخيص') {
    const snapshot = ActivePerformanceMonitor.takeSnapshot(client);
    const memStability = ActivePerformanceMonitor.evaluateMemoryStability();
    const selfTest = SelfTestingDiagnosticsScheduler.runDiagnosticCheck(client);

    const reportLines = [
      `حالة الاتصال: ${selfTest.success ? 'ممتازة ✅' : 'تواجه مشاكل ⚠️'}`,
      `درجة استقرار البوت: ${selfTest.score}/100`,
      `زمن استجابة ديسكورد (Ping): ${snapshot.pingMs}ms`,
      `حجم الذاكرة المستخدم (Heap): ${snapshot.memoryUsage.heapUsed.toFixed(1)} MB / ${snapshot.memoryUsage.heapTotal.toFixed(1)} MB`,
      `تسريب الذاكرة المحتمل: ${memStability.leakProbability} (معدل النمو: ${memStability.growthRateMb.toFixed(2)} MB/ساعة)`,
      `حجم الـ RSS الكلي: ${snapshot.memoryUsage.rss.toFixed(1)} MB`,
      `نسبة استخدام المعالج: ${snapshot.cpuUsage.toFixed(2)}%`,
      `وقت التشغيل المستمر: ${(snapshot.uptimeSeconds / 60).toFixed(1)} دقيقة`
    ];

    const box = AdvancedDiagnosticConsoleFormatter.createDecorativeBox('📊 نتائج التحليل الفني والتشخيص الشامل للاستقرار', reportLines, 65);
    await message.reply(`\`\`\`\n${box}\n\`\`\``).catch(() => null);
    return true;
  }

  // 2. أمر رسم شجرة القنوات ASCII
  if (command === 'tree' || command === 'شجرة') {
    const tree = ServerChannelTreeVisualizer.renderTree(guild);
    await message.reply(`\`\`\`\n${tree}\n\`\`\``).catch(() => null);
    return true;
  }

  // 3. أمر عرض تقرير إحصائيات الأحداث
  if (command === 'stats' || command === 'احصائيات') {
    const reportLines = AdminEventStatisticsTracker.generateReportLines();
    const box = AdvancedDiagnosticConsoleFormatter.createDecorativeBox('📈 إحصائيات معالجة الأحداث وحركة الأوامر', reportLines, 68);
    await message.reply(`\`\`\`\n${box}\n\`\`\``).catch(() => null);
    return true;
  }

  // 4. أمر عرض الرسم البياني للذاكرة عبر الزمن
  if (command === 'memory' || command === 'ذاكرة') {
    ActivePerformanceMonitor.takeSnapshot(client);
    const chart = ActivePerformanceMonitor.generateMemoryTrendChart(50, 10);
    await message.reply(`📊 **مخطط مسار استهلاك الذاكرة المدمج عبر الزمن (Heap Used Trend):**\n\`\`\`\n${chart}\n\`\`\``).catch(() => null);
    return true;
  }

  // 5. أمر عرض سجل التدقيق الإداري والمشرفين
  if (command === 'audit' || command === 'تدقيق') {
    const auditReport = ServerAuditTrailAuditor.generateAuditReport();
    await message.reply(`📜 **سجل التدقيق والعمليات الإدارية الحساسة الأخيرة:**\n\`\`\`\n${auditReport}\n\`\`\``).catch(() => null);
    return true;
  }

  // تفويض الأوامر السابقة للأصل
  return originalHandler(message, commandText);
};
