import {
  AuditLogEvent,
  AutoModerationActionType,
  AutoModerationRuleEventType,
  AutoModerationRuleTriggerType,
  ChannelType,
  Guild,
  GuildScheduledEventEntityType,
  GuildScheduledEventPrivacyLevel,
  GuildScheduledEventStatus,
  PermissionFlagsBits,
} from 'discord.js';

export const ADVANCED_ACTION_GROUPS = {
  channel_operations: [
    'channel_rename',
    'channel_clone',
    'channel_move',
    'channel_set_parent',
    'channel_sync_permissions',
    'channel_set_topic',
    'channel_set_nsfw',
    'channel_set_slowmode',
    'voice_set_bitrate',
    'voice_set_user_limit',
    'voice_set_rtc_region',
    'voice_set_video_quality',
    'channel_lock',
    'channel_unlock',
    'channel_info',
    'channel_list',
    'channel_create_invite',
    'channel_list_invites',
    'channel_delete_invites',
    'channel_set_default_archive',
  ],
  thread_operations: [
    'thread_create',
    'thread_archive',
    'thread_unarchive',
    'thread_lock',
    'thread_unlock',
    'thread_rename',
    'thread_set_slowmode',
    'thread_set_auto_archive',
    'thread_add_member',
    'thread_remove_member',
  ],
  message_operations: [
    'message_send',
    'message_pin',
    'message_unpin',
    'message_crosspost',
    'message_react',
    'message_fetch',
    'message_delete',
    'message_edit_bot_message',
    'message_list_pins',
    'message_clear_reactions',
  ],
  webhook_operations: [
    'webhook_create',
    'webhook_list',
    'webhook_delete',
    'webhook_rename',
    'webhook_send',
    'webhook_info',
  ],
  role_operations: [
    'role_info',
    'role_list',
    'role_members',
    'role_clone',
    'role_set_color',
    'role_set_name',
    'role_set_mentionable',
    'role_set_hoist',
    'role_set_permissions',
    'role_set_position',
    'role_mass_assign',
    'role_mass_remove',
  ],
  guild_operations: [
    'guild_info',
    'guild_set_name',
    'guild_set_description',
    'guild_set_icon',
    'guild_set_banner',
    'guild_set_afk_channel',
    'guild_set_system_channel',
    'guild_set_rules_channel',
    'guild_set_public_updates_channel',
    'guild_set_verification_level',
    'guild_list_bans',
    'guild_list_invites',
  ],
  expression_operations: [
    'emoji_list',
    'emoji_create',
    'emoji_delete',
    'emoji_rename',
    'sticker_list',
    'soundboard_list',
  ],
  automod_operations: [
    'automod_list',
    'automod_create_keyword',
    'automod_create_spam',
    'automod_create_mention_spam',
    'automod_enable',
    'automod_disable',
    'automod_delete',
  ],
  event_operations: [
    'event_list',
    'event_create_external',
    'event_create_voice',
    'event_cancel',
    'event_complete',
    'event_delete',
  ],
  analytics_operations: [
    'audit_recent',
    'audit_bans',
    'audit_channels',
    'audit_roles',
    'stats_boosts',
    'stats_voice',
    'stats_channels',
    'stats_roles',
    'stats_members',
    'stats_threads',
  ],
} as const;

export type AdvancedActionGroup = keyof typeof ADVANCED_ACTION_GROUPS;
export type AdvancedDiscordAction = typeof ADVANCED_ACTION_GROUPS[AdvancedActionGroup][number];

export const ADVANCED_DISCORD_ACTIONS = Object.values(ADVANCED_ACTION_GROUPS).flat();

export interface AdvancedDiscordArgs {
  channelId?: string;
  categoryId?: string;
  roleId?: string;
  memberId?: string;
  messageId?: string;
  webhookId?: string;
  eventId?: string;
  ruleId?: string;
  emojiId?: string;
  name?: string;
  content?: string;
  description?: string;
  topic?: string;
  color?: string;
  reason?: string;
  url?: string;
  emoji?: string;
  location?: string;
  region?: string | null;
  keyword?: string;
  alertChannelId?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  enabled?: boolean;
  value?: number | null;
  position?: number;
  count?: number;
  duration?: number;
  mentionTotalLimit?: number;
  roleIds?: string[];
  memberIds?: string[];
  permissions?: string[];
}

export interface AdvancedDiscordResult {
  success: boolean;
  message: string;
  data?: unknown;
}

function success(message: string, data?: unknown): AdvancedDiscordResult {
  return { success: true, message, data };
}

function failure(message: string): AdvancedDiscordResult {
  return { success: false, message };
}

async function getChannel(guild: Guild, channelId?: string): Promise<any> {
  if (!channelId) return null;
  return guild.channels.cache.get(channelId)
    || await guild.channels.fetch(channelId).catch(() => null);
}

async function getRole(guild: Guild, roleId?: string): Promise<any> {
  if (!roleId) return null;
  return guild.roles.cache.get(roleId)
    || await guild.roles.fetch(roleId).catch(() => null);
}

async function getMember(guild: Guild, memberId?: string): Promise<any> {
  if (!memberId) return null;
  return guild.members.cache.get(memberId)
    || await guild.members.fetch(memberId).catch(() => null);
}

async function getMessage(guild: Guild, args: AdvancedDiscordArgs): Promise<any> {
  const channel = await getChannel(guild, args.channelId);
  if (!channel?.isTextBased?.() || !channel.messages || !args.messageId) return null;
  return channel.messages.fetch(args.messageId).catch(() => null);
}

function serializeChannel(channel: any): Record<string, unknown> {
  return {
    id: channel.id,
    name: channel.name,
    type: channel.type,
    parentId: channel.parentId ?? null,
    position: channel.position,
    topic: channel.topic ?? null,
    nsfw: channel.nsfw ?? false,
  };
}

function serializeRole(role: any): Record<string, unknown> {
  return {
    id: role.id,
    name: role.name,
    color: role.hexColor,
    position: role.position,
    managed: role.managed,
    mentionable: role.mentionable,
    hoist: role.hoist,
    permissions: role.permissions.toArray(),
  };
}

function resolveAuditType(action: AdvancedDiscordAction): AuditLogEvent | undefined {
  if (action === 'audit_bans') return AuditLogEvent.MemberBanAdd;
  if (action === 'audit_channels') return AuditLogEvent.ChannelUpdate;
  if (action === 'audit_roles') return AuditLogEvent.RoleUpdate;
  return undefined;
}

export function requiredPermissionForAdvancedAction(action: AdvancedDiscordAction): bigint {
  if (action.startsWith('channel_') || action.startsWith('voice_')) {
    if (['channel_info', 'channel_list', 'channel_list_invites'].includes(action)) {
      return PermissionFlagsBits.ViewChannel;
    }
    if (action === 'channel_create_invite') return PermissionFlagsBits.CreateInstantInvite;
    return PermissionFlagsBits.ManageChannels;
  }
  if (action.startsWith('thread_')) return PermissionFlagsBits.ManageThreads;
  if (action.startsWith('message_')) {
    return action === 'message_send' ? PermissionFlagsBits.SendMessages : PermissionFlagsBits.ManageMessages;
  }
  if (action.startsWith('webhook_')) return PermissionFlagsBits.ManageWebhooks;
  if (action.startsWith('role_')) return PermissionFlagsBits.ManageRoles;
  if (action === 'guild_list_bans') return PermissionFlagsBits.BanMembers;
  if (action.startsWith('guild_')) return PermissionFlagsBits.ManageGuild;
  if (action.startsWith('emoji_') || action.startsWith('sticker_') || action.startsWith('soundboard_')) {
    return PermissionFlagsBits.ManageGuildExpressions;
  }
  if (action.startsWith('automod_')) return PermissionFlagsBits.ManageGuild;
  if (action.startsWith('event_')) return PermissionFlagsBits.ManageEvents;
  if (action.startsWith('audit_')) return PermissionFlagsBits.ViewAuditLog;
  return PermissionFlagsBits.ViewChannel;
}

async function executeChannelAction(
  guild: Guild,
  action: AdvancedDiscordAction,
  args: AdvancedDiscordArgs
): Promise<AdvancedDiscordResult> {
  if (action === 'channel_list') {
    return success('تم جلب قائمة الرومات.', guild.channels.cache.map(serializeChannel));
  }

  const channel = await getChannel(guild, args.channelId);
  if (!channel) return failure('الروم المطلوب غير موجود.');

  switch (action) {
    case 'channel_rename':
      if (!args.name) return failure('الاسم الجديد مطلوب.');
      await channel.setName(args.name, args.reason);
      return success(`تم تغيير اسم الروم إلى "${args.name}".`);
    case 'channel_clone': {
      const cloned = await channel.clone({ name: args.name, reason: args.reason });
      return success(`تم نسخ الروم باسم "${cloned.name}".`, serializeChannel(cloned));
    }
    case 'channel_move':
      if (!Number.isInteger(args.position)) return failure('موضع الروم مطلوب كرقم صحيح.');
      await channel.setPosition(args.position, { reason: args.reason });
      return success(`تم نقل الروم إلى الموضع ${args.position}.`);
    case 'channel_set_parent':
      await channel.setParent(args.categoryId ?? null, { lockPermissions: false, reason: args.reason });
      return success('تم تحديث الكاتقوري الأب للروم.');
    case 'channel_sync_permissions':
      await channel.lockPermissions();
      return success('تمت مزامنة صلاحيات الروم مع الكاتقوري.');
    case 'channel_set_topic':
      if (!channel.setTopic) return failure('هذا النوع من الرومات لا يدعم الوصف.');
      await channel.setTopic(args.topic ?? null, args.reason);
      return success('تم تحديث وصف الروم.');
    case 'channel_set_nsfw':
      if (!channel.setNSFW) return failure('هذا النوع من الرومات لا يدعم NSFW.');
      await channel.setNSFW(args.enabled ?? true, args.reason);
      return success(`تم ${args.enabled === false ? 'تعطيل' : 'تفعيل'} NSFW.`);
    case 'channel_set_slowmode':
      if (!channel.setRateLimitPerUser) return failure('هذا النوع من الرومات لا يدعم السلومود.');
      await channel.setRateLimitPerUser(Number(args.duration ?? args.value ?? 0), args.reason);
      return success('تم تحديث السلومود.');
    case 'voice_set_bitrate':
      if (!channel.setBitrate) return failure('الروم ليس صوتيًا.');
      await channel.setBitrate(Number(args.value), args.reason);
      return success('تم تحديث جودة الصوت.');
    case 'voice_set_user_limit':
      if (!channel.setUserLimit) return failure('الروم ليس صوتيًا.');
      await channel.setUserLimit(Number(args.value ?? 0), args.reason);
      return success('تم تحديث حد المستخدمين.');
    case 'voice_set_rtc_region':
      if (!channel.setRTCRegion) return failure('الروم ليس صوتيًا.');
      await channel.setRTCRegion(args.region ?? null, args.reason);
      return success('تم تحديث منطقة الاتصال الصوتي.');
    case 'voice_set_video_quality':
      if (!channel.setVideoQualityMode) return failure('الروم ليس صوتيًا.');
      await channel.setVideoQualityMode(Number(args.value ?? 1), args.reason);
      return success('تم تحديث وضع جودة الفيديو.');
    case 'channel_lock':
      await channel.permissionOverwrites.edit(guild.id, {
        SendMessages: false,
        AddReactions: false,
        Connect: false,
      }, { reason: args.reason });
      return success('تم قفل الروم على @everyone.');
    case 'channel_unlock':
      await channel.permissionOverwrites.edit(guild.id, {
        SendMessages: null,
        AddReactions: null,
        Connect: null,
      }, { reason: args.reason });
      return success('تم فك قفل الروم وإزالة المنع الصريح.');
    case 'channel_info':
      return success('تم جلب معلومات الروم.', serializeChannel(channel));
    case 'channel_create_invite': {
      if (!channel.createInvite) return failure('هذا الروم لا يدعم روابط الدعوة.');
      const invite = await channel.createInvite({
        maxAge: Number(args.duration ?? 86_400),
        maxUses: Number(args.count ?? 0),
        unique: true,
        reason: args.reason,
      });
      return success('تم إنشاء رابط الدعوة.', { code: invite.code, url: invite.url });
    }
    case 'channel_list_invites': {
      if (!channel.fetchInvites) return failure('هذا الروم لا يدعم روابط الدعوة.');
      const invites = await channel.fetchInvites();
      return success('تم جلب روابط دعوة الروم.', invites.map((invite: any) => ({
        code: invite.code,
        uses: invite.uses,
        maxUses: invite.maxUses,
        expiresAt: invite.expiresAt?.toISOString() ?? null,
      })));
    }
    case 'channel_delete_invites': {
      if (!channel.fetchInvites) return failure('هذا الروم لا يدعم روابط الدعوة.');
      const invites = await channel.fetchInvites();
      await Promise.all(invites.map((invite: any) => invite.delete(args.reason)));
      return success(`تم حذف ${invites.size} رابط دعوة من الروم.`);
    }
    case 'channel_set_default_archive':
      if (!channel.setDefaultAutoArchiveDuration) return failure('هذا الروم لا يدعم مدة أرشفة الثريدات.');
      await channel.setDefaultAutoArchiveDuration(Number(args.duration ?? args.value ?? 1440), args.reason);
      return success('تم تحديث مدة الأرشفة الافتراضية للثريدات.');
    default:
      return failure('إجراء الروم غير مدعوم.');
  }
}

async function executeThreadAction(
  guild: Guild,
  action: AdvancedDiscordAction,
  args: AdvancedDiscordArgs
): Promise<AdvancedDiscordResult> {
  if (action === 'thread_create') {
    const channel = await getChannel(guild, args.channelId);
    if (!channel?.threads?.create || !args.name) return failure('روم نصي واسم الثريد مطلوبان.');
    const thread = await channel.threads.create({
      name: args.name,
      autoArchiveDuration: Number(args.duration ?? 1440),
      reason: args.reason,
    });
    return success(`تم إنشاء الثريد "${thread.name}".`, { id: thread.id, name: thread.name });
  }

  const thread = await getChannel(guild, args.channelId);
  if (!thread?.isThread?.()) return failure('الثريد المطلوب غير موجود.');

  switch (action) {
    case 'thread_archive':
      await thread.setArchived(true, args.reason);
      return success('تمت أرشفة الثريد.');
    case 'thread_unarchive':
      await thread.setArchived(false, args.reason);
      return success('تم فتح الثريد من الأرشيف.');
    case 'thread_lock':
      await thread.setLocked(true, args.reason);
      return success('تم قفل الثريد.');
    case 'thread_unlock':
      await thread.setLocked(false, args.reason);
      return success('تم فك قفل الثريد.');
    case 'thread_rename':
      if (!args.name) return failure('الاسم الجديد مطلوب.');
      await thread.setName(args.name, args.reason);
      return success(`تم تغيير اسم الثريد إلى "${args.name}".`);
    case 'thread_set_slowmode':
      await thread.setRateLimitPerUser(Number(args.duration ?? args.value ?? 0), args.reason);
      return success('تم تحديث سلومود الثريد.');
    case 'thread_set_auto_archive':
      await thread.setAutoArchiveDuration(Number(args.duration ?? args.value ?? 1440), args.reason);
      return success('تم تحديث مدة أرشفة الثريد.');
    case 'thread_add_member':
      if (!args.memberId) return failure('معرف العضو مطلوب.');
      await thread.members.add(args.memberId);
      return success('تمت إضافة العضو إلى الثريد.');
    case 'thread_remove_member':
      if (!args.memberId) return failure('معرف العضو مطلوب.');
      await thread.members.remove(args.memberId);
      return success('تمت إزالة العضو من الثريد.');
    default:
      return failure('إجراء الثريد غير مدعوم.');
  }
}

async function executeMessageAction(
  guild: Guild,
  action: AdvancedDiscordAction,
  args: AdvancedDiscordArgs
): Promise<AdvancedDiscordResult> {
  const channel = await getChannel(guild, args.channelId);
  if (!channel?.isTextBased?.() || !channel.messages) return failure('الروم النصي المطلوب غير موجود.');

  if (action === 'message_send') {
    if (!args.content) return failure('نص الرسالة مطلوب.');
    const sent = await channel.send({ content: args.content, allowedMentions: { parse: [] } });
    return success('تم إرسال الرسالة.', { messageId: sent.id });
  }
  if (action === 'message_list_pins') {
    const pins = await channel.messages.fetchPinned();
    return success('تم جلب الرسائل المثبتة.', pins.map((message: any) => ({
      id: message.id,
      authorId: message.author.id,
      content: message.content.slice(0, 300),
    })));
  }

  const message = await getMessage(guild, args);
  if (!message) return failure('الرسالة المطلوبة غير موجودة.');

  switch (action) {
    case 'message_pin':
      await message.pin(args.reason);
      return success('تم تثبيت الرسالة.');
    case 'message_unpin':
      await message.unpin(args.reason);
      return success('تم إلغاء تثبيت الرسالة.');
    case 'message_crosspost':
      if (!message.crosspost) return failure('الرسالة ليست في روم إعلانات.');
      await message.crosspost();
      return success('تم نشر رسالة الإعلان.');
    case 'message_react':
      if (!args.emoji) return failure('الإيموجي مطلوب.');
      await message.react(args.emoji);
      return success('تمت إضافة التفاعل.');
    case 'message_fetch':
      return success('تم جلب الرسالة.', {
        id: message.id,
        authorId: message.author.id,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      });
    case 'message_delete':
      await message.delete();
      return success('تم حذف الرسالة.');
    case 'message_edit_bot_message':
      if (message.author.id !== guild.client.user?.id) return failure('لا يمكن تعديل رسالة ليست للبوت.');
      if (!args.content) return failure('النص الجديد مطلوب.');
      await message.edit({ content: args.content, allowedMentions: { parse: [] } });
      return success('تم تعديل رسالة البوت.');
    case 'message_clear_reactions':
      await message.reactions.removeAll();
      return success('تم حذف جميع تفاعلات الرسالة.');
    default:
      return failure('إجراء الرسالة غير مدعوم.');
  }
}

async function executeWebhookAction(
  guild: Guild,
  action: AdvancedDiscordAction,
  args: AdvancedDiscordArgs
): Promise<AdvancedDiscordResult> {
  if (action === 'webhook_create' || action === 'webhook_list') {
    const channel = await getChannel(guild, args.channelId);
    if (!channel?.isTextBased?.()) return failure('الروم النصي المطلوب غير موجود.');
    if (action === 'webhook_create') {
      if (!channel.createWebhook || !args.name) return failure('اسم الويب هوك مطلوب.');
      const webhook = await channel.createWebhook({ name: args.name, reason: args.reason });
      return success('تم إنشاء الويب هوك.', { id: webhook.id, name: webhook.name });
    }
    const webhooks = await channel.fetchWebhooks();
    return success('تم جلب الويب هوكات.', webhooks.map((webhook: any) => ({
      id: webhook.id,
      name: webhook.name,
      channelId: webhook.channelId,
    })));
  }

  if (!args.webhookId) return failure('معرف الويب هوك مطلوب.');
  const webhook = await guild.client.fetchWebhook(args.webhookId).catch(() => null);
  if (!webhook) return failure('الويب هوك المطلوب غير موجود.');

  switch (action) {
    case 'webhook_delete':
      await webhook.delete(args.reason);
      return success('تم حذف الويب هوك.');
    case 'webhook_rename':
      if (!args.name) return failure('الاسم الجديد مطلوب.');
      await webhook.edit({ name: args.name, reason: args.reason });
      return success('تم تغيير اسم الويب هوك.');
    case 'webhook_send':
      if (!args.content) return failure('نص الرسالة مطلوب.');
      await webhook.send({ content: args.content, allowedMentions: { parse: [] } });
      return success('تم الإرسال عبر الويب هوك.');
    case 'webhook_info':
      return success('تم جلب معلومات الويب هوك.', {
        id: webhook.id,
        name: webhook.name,
        channelId: webhook.channelId,
        ownerId: webhook.owner?.id ?? null,
      });
    default:
      return failure('إجراء الويب هوك غير مدعوم.');
  }
}

async function executeRoleAction(
  guild: Guild,
  action: AdvancedDiscordAction,
  args: AdvancedDiscordArgs
): Promise<AdvancedDiscordResult> {
  if (action === 'role_list') {
    return success('تم جلب قائمة الرتب.', guild.roles.cache
      .filter((role) => role.id !== guild.id)
      .map(serializeRole));
  }

  const role = await getRole(guild, args.roleId);
  if (!role || role.id === guild.id) return failure('الرتبة المطلوبة غير موجودة أو هي @everyone.');

  switch (action) {
    case 'role_info':
      return success('تم جلب معلومات الرتبة.', serializeRole(role));
    case 'role_members':
      return success('تم جلب أعضاء الرتبة.', role.members.map((member: any) => ({
        id: member.id,
        name: member.displayName,
      })));
    case 'role_clone': {
      const cloned = await guild.roles.create({
        name: args.name ?? `${role.name} Copy`,
        color: role.color,
        permissions: role.permissions,
        hoist: role.hoist,
        mentionable: role.mentionable,
        reason: args.reason,
      });
      return success(`تم نسخ الرتبة باسم "${cloned.name}".`, { roleId: cloned.id });
    }
    case 'role_set_color':
      if (!args.color) return failure('اللون مطلوب.');
      await role.setColor(args.color, args.reason);
      return success('تم تحديث لون الرتبة.');
    case 'role_set_name':
      if (!args.name) return failure('الاسم الجديد مطلوب.');
      await role.setName(args.name, args.reason);
      return success(`تم تغيير اسم الرتبة إلى "${args.name}".`);
    case 'role_set_mentionable':
      await role.setMentionable(args.enabled ?? true, args.reason);
      return success('تم تحديث قابلية منشن الرتبة.');
    case 'role_set_hoist':
      await role.setHoist(args.enabled ?? true, args.reason);
      return success('تم تحديث إظهار الرتبة بشكل منفصل.');
    case 'role_set_permissions':
      await role.setPermissions(args.permissions ?? [], args.reason);
      return success('تم تحديث صلاحيات الرتبة.');
    case 'role_set_position':
      if (!Number.isInteger(args.position)) return failure('موضع الرتبة مطلوب.');
      await role.setPosition(args.position, { reason: args.reason });
      return success('تم تحديث موضع الرتبة.');
    case 'role_mass_assign':
    case 'role_mass_remove': {
      const memberIds = args.memberIds ?? [];
      if (memberIds.length === 0) return failure('يجب تحديد أعضاء.');
      let updated = 0;
      for (const memberId of memberIds.slice(0, 100)) {
        const member = await getMember(guild, memberId);
        if (!member) continue;
        if (action === 'role_mass_assign') await member.roles.add(role, args.reason);
        else await member.roles.remove(role, args.reason);
        updated++;
      }
      return success(`تم تحديث الرتبة لـ ${updated} عضو.`);
    }
    default:
      return failure('إجراء الرتبة غير مدعوم.');
  }
}

async function executeGuildAction(
  guild: Guild,
  action: AdvancedDiscordAction,
  args: AdvancedDiscordArgs
): Promise<AdvancedDiscordResult> {
  switch (action) {
    case 'guild_info':
      return success('تم جلب معلومات السيرفر.', {
        id: guild.id,
        name: guild.name,
        description: guild.description,
        ownerId: guild.ownerId,
        memberCount: guild.memberCount,
        premiumTier: guild.premiumTier,
        premiumSubscriptionCount: guild.premiumSubscriptionCount,
        createdAt: guild.createdAt.toISOString(),
      });
    case 'guild_set_name':
      if (!args.name) return failure('الاسم الجديد مطلوب.');
      await guild.setName(args.name, args.reason);
      return success(`تم تغيير اسم السيرفر إلى "${args.name}".`);
    case 'guild_set_description':
      await guild.edit({ description: args.description ?? null, reason: args.reason });
      return success('تم تحديث وصف السيرفر.');
    case 'guild_set_icon':
      if (!args.url) return failure('رابط الأيقونة مطلوب.');
      await guild.setIcon(args.url, args.reason);
      return success('تم تحديث أيقونة السيرفر.');
    case 'guild_set_banner':
      if (!args.url) return failure('رابط البنر مطلوب.');
      await guild.setBanner(args.url, args.reason);
      return success('تم تحديث بنر السيرفر.');
    case 'guild_set_afk_channel':
      await guild.setAFKChannel(args.channelId ?? null, args.reason);
      return success('تم تحديث روم AFK.');
    case 'guild_set_system_channel':
      await guild.setSystemChannel(args.channelId ?? null, args.reason);
      return success('تم تحديث روم النظام.');
    case 'guild_set_rules_channel':
      await guild.setRulesChannel(args.channelId ?? null, args.reason);
      return success('تم تحديث روم القوانين.');
    case 'guild_set_public_updates_channel':
      await guild.setPublicUpdatesChannel(args.channelId ?? null, args.reason);
      return success('تم تحديث روم تحديثات المجتمع.');
    case 'guild_set_verification_level':
      await guild.setVerificationLevel(Number(args.value ?? 1), args.reason);
      return success('تم تحديث مستوى التحقق.');
    case 'guild_list_bans': {
      const bans = await guild.bans.fetch({ limit: Math.min(Number(args.count ?? 100), 1000) });
      return success('تم جلب قائمة المحظورين.', bans.map((ban) => ({
        id: ban.user.id,
        username: ban.user.username,
        reason: ban.reason,
      })));
    }
    case 'guild_list_invites': {
      const invites = await guild.invites.fetch();
      return success('تم جلب دعوات السيرفر.', invites.map((invite) => ({
        code: invite.code,
        channelId: invite.channelId,
        uses: invite.uses,
        inviterId: invite.inviterId,
      })));
    }
    default:
      return failure('إجراء السيرفر غير مدعوم.');
  }
}

async function executeExpressionAction(
  guild: Guild,
  action: AdvancedDiscordAction,
  args: AdvancedDiscordArgs
): Promise<AdvancedDiscordResult> {
  switch (action) {
    case 'emoji_list':
      return success('تم جلب إيموجيات السيرفر.', guild.emojis.cache.map((emoji) => ({
        id: emoji.id,
        name: emoji.name,
        animated: emoji.animated,
        url: emoji.url,
      })));
    case 'emoji_create': {
      if (!args.url || !args.name) return failure('اسم الإيموجي ورابط الصورة مطلوبان.');
      const emoji = await guild.emojis.create({ attachment: args.url, name: args.name, reason: args.reason });
      return success(`تم إنشاء الإيموجي "${emoji.name}".`, { id: emoji.id, url: emoji.url });
    }
    case 'emoji_delete': {
      const emoji = guild.emojis.cache.get(args.emojiId ?? '');
      if (!emoji) return failure('الإيموجي المطلوب غير موجود.');
      await emoji.delete(args.reason);
      return success('تم حذف الإيموجي.');
    }
    case 'emoji_rename': {
      const emoji = guild.emojis.cache.get(args.emojiId ?? '');
      if (!emoji || !args.name) return failure('الإيموجي والاسم الجديد مطلوبان.');
      await emoji.setName(args.name, args.reason);
      return success('تم تغيير اسم الإيموجي.');
    }
    case 'sticker_list': {
      const stickers = await guild.stickers.fetch();
      return success('تم جلب ملصقات السيرفر.', stickers.map((sticker) => ({
        id: sticker.id,
        name: sticker.name,
        description: sticker.description,
      })));
    }
    case 'soundboard_list': {
      const sounds = await guild.soundboardSounds.fetch();
      return success('تم جلب أصوات الساوند بورد.', sounds.map((sound) => ({
        id: sound.soundId,
        name: sound.name,
        volume: sound.volume,
      })));
    }
    default:
      return failure('إجراء التعبيرات غير مدعوم.');
  }
}

async function executeAutoModAction(
  guild: Guild,
  action: AdvancedDiscordAction,
  args: AdvancedDiscordArgs
): Promise<AdvancedDiscordResult> {
  if (action === 'automod_list') {
    const rules = await guild.autoModerationRules.fetch();
    return success('تم جلب قواعد AutoMod.', rules.map((rule) => ({
      id: rule.id,
      name: rule.name,
      enabled: rule.enabled,
      triggerType: rule.triggerType,
      actions: rule.actions,
    })));
  }

  if (action.startsWith('automod_create_')) {
    const actions: any[] = [{ type: AutoModerationActionType.BlockMessage }];
    if (args.alertChannelId) {
      actions.push({
        type: AutoModerationActionType.SendAlertMessage,
        metadata: { channel: args.alertChannelId },
      });
    }

    let triggerType = AutoModerationRuleTriggerType.Keyword;
    let triggerMetadata: Record<string, unknown> = {
      keywordFilter: args.keyword ? [args.keyword] : [],
    };
    if (action === 'automod_create_spam') {
      triggerType = AutoModerationRuleTriggerType.Spam;
      triggerMetadata = {};
    }
    if (action === 'automod_create_mention_spam') {
      triggerType = AutoModerationRuleTriggerType.MentionSpam;
      triggerMetadata = {
        mentionTotalLimit: Math.max(1, Math.min(50, Number(args.mentionTotalLimit ?? 5))),
        mentionRaidProtectionEnabled: true,
      };
    }

    const rule = await guild.autoModerationRules.create({
      name: args.name ?? `Opus ${action.replace('automod_create_', '')}`,
      eventType: AutoModerationRuleEventType.MessageSend,
      triggerType,
      triggerMetadata,
      actions,
      enabled: args.enabled ?? true,
      reason: args.reason,
    } as any);
    return success(`تم إنشاء قاعدة AutoMod "${rule.name}".`, { ruleId: rule.id });
  }

  if (!args.ruleId) return failure('معرف قاعدة AutoMod مطلوب.');
  const rule = await guild.autoModerationRules.fetch(args.ruleId).catch(() => null);
  if (!rule) return failure('قاعدة AutoMod غير موجودة.');

  switch (action) {
    case 'automod_enable':
      await rule.setEnabled(true, args.reason);
      return success('تم تفعيل قاعدة AutoMod.');
    case 'automod_disable':
      await rule.setEnabled(false, args.reason);
      return success('تم تعطيل قاعدة AutoMod.');
    case 'automod_delete':
      await rule.delete(args.reason);
      return success('تم حذف قاعدة AutoMod.');
    default:
      return failure('إجراء AutoMod غير مدعوم.');
  }
}

async function executeEventAction(
  guild: Guild,
  action: AdvancedDiscordAction,
  args: AdvancedDiscordArgs
): Promise<AdvancedDiscordResult> {
  if (action === 'event_list') {
    const events = await guild.scheduledEvents.fetch();
    return success('تم جلب فعاليات السيرفر.', events.map((event) => ({
      id: event.id,
      name: event.name,
      status: event.status,
      start: event.scheduledStartAt?.toISOString() ?? null,
      end: event.scheduledEndAt?.toISOString() ?? null,
      channelId: event.channelId,
    })));
  }

  if (action === 'event_create_external' || action === 'event_create_voice') {
    if (!args.name || !args.scheduledStartTime) return failure('اسم الفعالية ووقت البداية مطلوبان.');
    const isExternal = action === 'event_create_external';
    if (isExternal && !args.location) return failure('موقع الفعالية الخارجية مطلوب.');
    if (!isExternal && !args.channelId) return failure('الروم الصوتي مطلوب.');

    const event = await guild.scheduledEvents.create({
      name: args.name,
      description: args.description,
      scheduledStartTime: new Date(args.scheduledStartTime),
      scheduledEndTime: args.scheduledEndTime ? new Date(args.scheduledEndTime) : undefined,
      privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
      entityType: isExternal
        ? GuildScheduledEventEntityType.External
        : GuildScheduledEventEntityType.Voice,
      channel: isExternal ? undefined : args.channelId,
      entityMetadata: isExternal ? { location: args.location } : undefined,
      reason: args.reason,
    });
    return success(`تم إنشاء الفعالية "${event.name}".`, { eventId: event.id, url: event.url });
  }

  if (!args.eventId) return failure('معرف الفعالية مطلوب.');
  const event = await guild.scheduledEvents.fetch(args.eventId).catch(() => null);
  if (!event) return failure('الفعالية المطلوبة غير موجودة.');

  switch (action) {
    case 'event_cancel':
      await event.setStatus(GuildScheduledEventStatus.Canceled, args.reason);
      return success('تم إلغاء الفعالية.');
    case 'event_complete':
      await event.setStatus(GuildScheduledEventStatus.Completed, args.reason);
      return success('تم إنهاء الفعالية.');
    case 'event_delete':
      await event.delete();
      return success('تم حذف الفعالية.');
    default:
      return failure('إجراء الفعالية غير مدعوم.');
  }
}

async function executeAnalyticsAction(
  guild: Guild,
  action: AdvancedDiscordAction,
  args: AdvancedDiscordArgs
): Promise<AdvancedDiscordResult> {
  if (action.startsWith('audit_')) {
    const logs = await guild.fetchAuditLogs({
      limit: Math.min(Math.max(Number(args.count ?? 20), 1), 100),
      type: resolveAuditType(action),
    });
    return success('تم جلب سجل التدقيق.', logs.entries.map((entry) => ({
      id: entry.id,
      action: entry.action,
      executorId: entry.executorId,
      targetId: entry.targetId,
      reason: entry.reason,
      createdAt: entry.createdAt.toISOString(),
    })));
  }

  switch (action) {
    case 'stats_boosts':
      return success('تم جلب إحصائيات البوست.', {
        tier: guild.premiumTier,
        boosts: guild.premiumSubscriptionCount ?? 0,
        boosters: guild.members.cache.filter((member) => Boolean(member.premiumSince)).size,
      });
    case 'stats_voice': {
      const voiceChannels = guild.channels.cache.filter((channel) =>
        channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice
      );
      return success('تم جلب إحصائيات الصوت.', {
        channels: voiceChannels.size,
        connectedMembers: voiceChannels.reduce((sum, channel: any) => sum + channel.members.size, 0),
      });
    }
    case 'stats_channels':
      return success('تم جلب إحصائيات الرومات.', {
        total: guild.channels.cache.size,
        text: guild.channels.cache.filter((channel) => channel.type === ChannelType.GuildText).size,
        voice: guild.channels.cache.filter((channel) => channel.type === ChannelType.GuildVoice).size,
        categories: guild.channels.cache.filter((channel) => channel.type === ChannelType.GuildCategory).size,
      });
    case 'stats_roles':
      return success('تم جلب إحصائيات الرتب.', {
        total: guild.roles.cache.size,
        managed: guild.roles.cache.filter((role) => role.managed).size,
        mentionable: guild.roles.cache.filter((role) => role.mentionable).size,
      });
    case 'stats_members':
      return success('تم جلب إحصائيات الأعضاء.', {
        total: guild.memberCount,
        cached: guild.members.cache.size,
        bots: guild.members.cache.filter((member) => member.user.bot).size,
        humans: guild.members.cache.filter((member) => !member.user.bot).size,
      });
    case 'stats_threads':
      return success('تم جلب إحصائيات الثريدات.', {
        cached: guild.channels.cache.filter((channel) => channel.isThread()).size,
        active: guild.channels.cache.filter((channel: any) => channel.isThread() && !channel.archived).size,
      });
    default:
      return failure('إجراء الإحصائيات غير مدعوم.');
  }
}

export async function executeAdvancedDiscordAction(
  guild: Guild,
  group: AdvancedActionGroup,
  action: AdvancedDiscordAction,
  args: AdvancedDiscordArgs
): Promise<AdvancedDiscordResult> {
  if (!(ADVANCED_ACTION_GROUPS[group] as readonly string[] | undefined)?.includes(action)) {
    return failure('الإجراء لا ينتمي إلى مجموعة المهارات المطلوبة.');
  }

  try {
    if (group === 'channel_operations') return await executeChannelAction(guild, action, args);
    if (group === 'thread_operations') return await executeThreadAction(guild, action, args);
    if (group === 'message_operations') return await executeMessageAction(guild, action, args);
    if (group === 'webhook_operations') return await executeWebhookAction(guild, action, args);
    if (group === 'role_operations') return await executeRoleAction(guild, action, args);
    if (group === 'guild_operations') return await executeGuildAction(guild, action, args);
    if (group === 'expression_operations') return await executeExpressionAction(guild, action, args);
    if (group === 'automod_operations') return await executeAutoModAction(guild, action, args);
    if (group === 'event_operations') return await executeEventAction(guild, action, args);
    if (group === 'analytics_operations') return await executeAnalyticsAction(guild, action, args);
    return failure('مجموعة المهارات غير مدعومة.');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return failure(`فشل تنفيذ المهارة: ${errorMessage}`);
  }
}
