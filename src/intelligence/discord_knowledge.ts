import { AuditLogEvent, ChannelType, PermissionFlagsBits } from 'discord.js';

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
