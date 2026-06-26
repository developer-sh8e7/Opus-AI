import { AuditLogEvent, ChannelType, PermissionFlagsBits } from 'discord.js';
import { detectAllIntents } from '../services/intentVerifier.js';
import { KnowledgeSkillLoader } from './knowledge_skill_loader.js';
import type { Guild, GuildMember } from 'discord.js';

const PERMISSION_ARABIC: Partial<Record<keyof typeof PermissionFlagsBits, string>> = {
  CreateInstantInvite: 'إنشاء دعوات',
  KickMembers: 'طرد الأعضاء',
  BanMembers: 'حظر الأعضاء',
  Administrator: 'كل الصلاحيات وتجاوز برمشن الرومات',
  ManageChannels: 'إدارة الرومات والكاتقوري',
  ManageGuild: 'إدارة إعدادات السيرفر',
  AddReactions: 'إضافة تفاعلات',
  ViewAuditLog: 'عرض سجل التدقيق',
  PrioritySpeaker: 'متحدث ذو أولوية',
  Stream: 'بث الشاشة',
  ViewChannel: 'مشاهدة الروم',
  SendMessages: 'إرسال الرسائل',
  SendTTSMessages: 'إرسال رسائل TTS',
  ManageMessages: 'إدارة وحذف الرسائل',
  EmbedLinks: 'إظهار الروابط كـ embed',
  AttachFiles: 'إرفاق الملفات',
  ReadMessageHistory: 'قراءة سجل الرسائل',
  MentionEveryone: 'منشن everyone وhere',
  UseExternalEmojis: 'استخدام إيموجيات خارجية',
  ViewGuildInsights: 'عرض إحصاءات المجتمع',
  Connect: 'دخول الرومات الصوتية',
  Speak: 'التحدث في الرومات الصوتية',
  MuteMembers: 'ميوت صوتي للأعضاء',
  DeafenMembers: 'ديفن للأعضاء',
  MoveMembers: 'نقل الأعضاء صوتيًا',
  UseVAD: 'استخدام كشف الصوت',
  ChangeNickname: 'تغيير لقبه الشخصي',
  ManageNicknames: 'إدارة ألقاب الأعضاء',
  ManageRoles: 'إدارة الرتب والبرمشن',
  ManageWebhooks: 'إدارة الويب هوك',
  ManageEmojisAndStickers: 'إدارة الإيموجيات والملصقات',
  ManageGuildExpressions: 'إدارة تعبيرات السيرفر',
  UseApplicationCommands: 'استخدام أوامر التطبيقات',
  RequestToSpeak: 'طلب التحدث في Stage',
  ManageEvents: 'إدارة فعاليات السيرفر',
  ManageThreads: 'إدارة الثريدات',
  CreatePublicThreads: 'إنشاء ثريدات عامة',
  CreatePrivateThreads: 'إنشاء ثريدات خاصة',
  UseExternalStickers: 'استخدام ملصقات خارجية',
  SendMessagesInThreads: 'إرسال رسائل داخل الثريدات',
  UseEmbeddedActivities: 'استخدام الأنشطة المدمجة',
  ModerateMembers: 'تايم أوت للأعضاء',
  ViewCreatorMonetizationAnalytics: 'عرض تحليلات تحقيق الدخل',
  UseSoundboard: 'استخدام الساوند بورد',
  CreateGuildExpressions: 'إنشاء تعبيرات السيرفر',
  CreateEvents: 'إنشاء فعاليات',
  UseExternalSounds: 'استخدام أصوات خارجية',
  SendVoiceMessages: 'إرسال رسائل صوتية',
  SendPolls: 'إرسال تصويتات',
  UseExternalApps: 'استخدام تطبيقات خارجية',
  PinMessages: 'تثبيت الرسائل',
  BypassSlowmode: 'تجاوز السلو مود',
};

const CHANNEL_TYPE_ARABIC: Partial<Record<ChannelType, string>> = {
  [ChannelType.GuildText]: 'روم نصي',
  [ChannelType.DM]: 'خاص',
  [ChannelType.GuildVoice]: 'روم صوتي',
  [ChannelType.GroupDM]: 'خاص جماعي',
  [ChannelType.GuildCategory]: 'كاتقوري',
  [ChannelType.GuildAnnouncement]: 'إعلانات',
  [ChannelType.AnnouncementThread]: 'ثريد إعلانات',
  [ChannelType.PublicThread]: 'ثريد عام',
  [ChannelType.PrivateThread]: 'ثريد خاص',
  [ChannelType.GuildStageVoice]: 'ستيج',
  [ChannelType.GuildDirectory]: 'دليل سيرفر',
  [ChannelType.GuildForum]: 'فورم',
  [ChannelType.GuildMedia]: 'ميديا',
};

export const DISCORD_ERROR_ARABIC: Record<number, string> = {
  10003: 'الروم غير موجود.',
  10007: 'العضو غير موجود.',
  10011: 'الرتبة غير موجودة.',
  10013: 'المستخدم غير موجود.',
  10026: 'الحظر غير موجود.',
  20028: 'الروم وصل حد الطلبات مؤقتًا.',
  20029: 'السيرفر وصل حد الطلبات مؤقتًا.',
  30005: 'السيرفر وصل الحد الأقصى للرتب.',
  30013: 'السيرفر وصل الحد الأقصى للرومات.',
  50001: 'البوت لا يستطيع الوصول إلى هذا العنصر.',
  50013: 'البوت لا يملك الصلاحية المطلوبة.',
  50035: 'البيانات المرسلة إلى Discord غير صالحة.',
  50074: 'لا يمكن حذف روم مطلوب لميزات المجتمع.',
  50083: 'الثريد مؤرشف ولا يقبل هذا الإجراء.',
  50091: 'وقت الفعالية غير صالح.',
};

export function getPermissionReference() {
  return Object.entries(PermissionFlagsBits).map(([name, value]) => ({
    name: name as keyof typeof PermissionFlagsBits,
    value,
    descriptionAr: PERMISSION_ARABIC[name as keyof typeof PermissionFlagsBits] ?? `صلاحية Discord: ${name}`,
  }));
}

export function getChannelTypeReference() {
  return Object.entries(ChannelType)
    .filter(([, value]) => typeof value === 'number')
    .map(([name, value]) => ({
      id: value as ChannelType,
      name,
      descriptionAr: CHANNEL_TYPE_ARABIC[value as ChannelType] ?? `نوع روم Discord: ${name}`,
    }));
}

export function getAuditLogReference() {
  return Object.entries(AuditLogEvent)
    .filter(([, value]) => typeof value === 'number')
    .map(([name, value]) => ({
      name,
      value: value as number,
      descriptionAr: `حدث سجل تدقيق: ${name}`,
    }));
}

export function explainDiscordError(code: number, fallback: string): string {
  return DISCORD_ERROR_ARABIC[code] ?? fallback;
}

export function buildDiscordKnowledgePrompt(): string {
  return [
    '[DISCORD_RULES]',
    'Administrator bypasses channel overwrites.',
    'Permission order: @everyone overwrite, combined role overwrites, then member overwrite.',
    'Deny ViewChannel makes other channel permissions ineffective.',
    'Deny SendMessages makes message-dependent permissions ineffective.',
    'Deny Connect makes voice-dependent permissions ineffective.',
    'The bot can manage only roles and members below its highest role.',
    'Threads require ViewChannel and SendMessagesInThreads.',
    'Use permissionOverwrites.edit for targeted changes; never replace unrelated overwrites.',
  ].join('\n');
}

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
  // AP-001: MoveMembers allowed broadly for @everyone.
  // Channel-specific voice overwrites are allowed when the user explicitly targets a voice room;
  // this changes only that room's overwrite, not the base @everyone role permissions.
  if (isEveryoneRole(args, everyoneRoleId) && hasPermissionInAllow(args, 'MoveMembers')) {
    const targetChannel = args.channelId ? guild.channels.cache.get(String(args.channelId)) : undefined;
    if (!targetChannel || targetChannel.type !== ChannelType.GuildVoice) {
      return {
        allowed: false,
        reason: 'لا يمكن إعطاء صلاحية نقل الأعضاء للكل بشكل عام. حدد روم صوتي معيّن أو أعطها لرتبة مشرف.',
        fix: 'استخدم برمشن الروم الصوتي المحدد فقط أو رتبة إدارية موثوقة.',
      };
    }
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

  // AP-004b: other high-risk permissions should never be granted to @everyone.
  const dangerousEveryoneAllows = ['KickMembers', 'BanMembers', 'ManageGuild', 'ModerateMembers'];
  const dangerousGranted = dangerousEveryoneAllows.find((permission) =>
    isEveryoneRole(args, everyoneRoleId) && hasPermissionInAllow(args, permission)
  );
  if (dangerousGranted) {
    return {
      allowed: false,
      reason: `لا يمكن إعطاء ${dangerousGranted} للكل لأنها صلاحية إدارية خطيرة.`,
      fix: 'أعط هذه الصلاحية لرتبة إدارة موثوقة فقط، وليس @everyone.',
    };
  }

  // AP-005: Denying ViewChannel for @everyone is valid for private/hidden rooms,
  // but it is high-impact and is handled by the human approval gate.

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
  const voiceStateAction = ['move', 'voicekick', 'deafen', 'mute_voice'].includes(action);

  // AP-011: Target is guild owner
  if (args.memberId && guild.ownerId && args.memberId === guild.ownerId) {
    return {
      allowed: false,
      reason: 'لا يمكن تطبيق عقوبة على مالك السيرفر.',
    };
  }

  // AP-006: Missing hierarchy check (actor below target)
  if (actorMember && args.memberId && action !== 'unban' && !voiceStateAction) {
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

export function buildKnowledgeSectionsForPrompt(text: string): string {
  const intents = detectAllIntents(text);
  const sections = KnowledgeSkillLoader.getRelevantSections(intents, [], text);
  if (sections.length === 0) return '';
  const MAX_KNOWLEDGE_CHARS = 2_800; // ~700 tokens hard budget
  const rendered = sections.map((s) =>
    `[DISCORD_KNOWLEDGE_${s.source.replace(/[^\w]/g, '_').toUpperCase()}]\n${s.content}`
  ).join('\n');
  return rendered.length > MAX_KNOWLEDGE_CHARS
    ? rendered.slice(0, MAX_KNOWLEDGE_CHARS) + '\n<!-- knowledge truncated -->'
    : rendered;
}
