import { ChannelType, Guild, PermissionFlagsBits } from 'discord.js';

import { EntityRegistry } from './entity_registry.js';

export type ArabicIntent =
  | 'CREATE_CHANNEL'
  | 'SET_PERMISSIONS'
  | 'DELETE_CHANNEL'
  | 'VOICE_DISCONNECT'
  | 'BAN_USER'
  | 'KICK_USER'
  | 'TIMEOUT_USER'
  | 'GIVE_ROLE'
  | 'BULK_DELETE'
  | 'REBUILD_SERVER'
  | 'UNKNOWN';

export const INTENT_PATTERNS: Record<Exclude<ArabicIntent, 'UNKNOWN'>, RegExp[]> = {
  CREATE_CHANNEL: [
    /(?:سو|سوي|انشئ|أنشئ|اضف|أضف|ابغى|ابي)\s+(?:لي\s+)?(?:روم|قناة|شانل)/i,
  ],
  SET_PERMISSIONS: [
    /(?:صلاحيات?|برمشن|برمشنز)/i,
    /(?:خلي|خلّي|امنع|إمنع).*(?:يشوف|يدخل|يخش|يتصل|يتكلم|يكتب)/i,
  ],
  DELETE_CHANNEL: [
    /(?:احذف|إحذف|حذف|امسح|أمسح|ازيل|أزل)\s+(?:الروم|القناة|الشانل|روم|قناة)/i,
  ],
  VOICE_DISCONNECT: [
    /(?:دسكونكت|دسكنوكت|ديسكونكت|disconnect|voice\s*kick|voicekick|افصل|فصل|طلعه|طلعه|اطرده|طرد).*(?:الروم|الفويس|الصوتي)/i,
  ],
  BAN_USER: [/(?:بان|ban|احظر|إحظر|حظر نهائي)\s+/i],
  KICK_USER: [/(?:كيك|kick)\s+/i, /طرد\s+(?!نهائي)/i],
  TIMEOUT_USER: [/(?:تايم\s?اوت|timeout|ميوت|اسكت|أسكت|كتم)\s+/i],
  GIVE_ROLE: [/(?:اعطي|أعطي|عطي|ضيف|اضف|أضف)\s+(?:رتبة|رول|دور)\s+/i],
  BULK_DELETE: [
    /(?:احذف|تحذف|امسح|ازل|شيل|delete|remove).*(?:كل|جميع|all).*(?:الرومات|رومات|القنوات|روومات|الرومز|channels|rooms)/i,
    /delete\s+all\s+/i,
  ],
  REBUILD_SERVER: [
    /(?:سوي|سو|انشئ|انشاء|ابني|بناء|جدد|جديد)\s+(?:سيرفر|server)/i,
    /(?:نظف|ترتيب|إعادة|اعادة|re(?:build|organize|design))\s+(?:السيرفر|السيرفرات)/i,
    /تحسين\s+السيرفر\s+(?:وتطويره|وتنظيمه)/i,
  ],
};

const PERMISSION_PHRASES: Array<{
  pattern: RegExp;
  flag: bigint;
  type: 'allow' | 'deny';
  name: string;
}> = [
  { pattern: /(?:الكل\s+)?(?:يشوف(?:ه|ها|ون|ونه|ونها)?|تشوف(?:ه|ها)?|يقرأ(?:ه|ها|ون)?)(?:\s+الروم)?/i, flag: PermissionFlagsBits.ViewChannel, type: 'allow', name: 'ViewChannel' },
  { pattern: /(?:ما|لا|محد|مو)\s*(?:يقدر(?:ون)?\s*)?(?:يشوف|تشوف)(?:ه|ها|ون|ونه|ونها)?/i, flag: PermissionFlagsBits.ViewChannel, type: 'deny', name: 'ViewChannel' },
  { pattern: /(?:ما|لا|محد|مو)\s*(?:يقدر(?:ون)?\s*)?(?:يدخل|يخش|يتصل)(?:ون|ونه|ونها|ه|ها)?/i, flag: PermissionFlagsBits.Connect, type: 'deny', name: 'Connect' },
  { pattern: /(?:يقدر(?:ون)?\s*)?(?:يدخل|يخش|يتصل|تدخل|تخش|تتصل)(?:ون|ونه|ونها|ه|ها)?/i, flag: PermissionFlagsBits.Connect, type: 'allow', name: 'Connect' },
  { pattern: /(?:يتكلم|تتكلم)(?:ون)?/i, flag: PermissionFlagsBits.Speak, type: 'allow', name: 'Speak' },
  { pattern: /(?:ما|لا|محد|مو)\s*(?:يقدر(?:ون)?\s*)?(?:يفتح|تفتح|يسوي|تسوي)(?:ون)?\s*(?:سكرين|شير|بث)|(?:بدون|منع)\s*(?:سكرين|شير|بث)/i, flag: PermissionFlagsBits.Stream, type: 'deny', name: 'Stream' },
  { pattern: /(?:سكرين(?:\s*شير)?|بث\s+الشاشة|(?:يفتح|تفتح|يسوي|تسوي)(?:ون)?\s+سكرين)/i, flag: PermissionFlagsBits.Stream, type: 'allow', name: 'Stream' },
  { pattern: /(?:ما|لا|محد|مو)\s*(?:يقدر(?:ون)?\s*)?(?:منج|يدير|يعدل|manage)\s*(?:شنل|شانل|روم|قناه|قناة|channel)/i, flag: PermissionFlagsBits.ManageChannels, type: 'deny', name: 'ManageChannels' },
  { pattern: /(?:move|موف|ينقل|نقل|يحرك|تحريك)/i, flag: PermissionFlagsBits.MoveMembers, type: 'allow', name: 'MoveMembers' },
  { pattern: /(?:ميوت|يكتم|كتم صوتي|mute)/i, flag: PermissionFlagsBits.MuteMembers, type: 'allow', name: 'MuteMembers' },
  { pattern: /(?:ديفن|ديفين|دفن|يصم|deafen)/i, flag: PermissionFlagsBits.DeafenMembers, type: 'allow', name: 'DeafenMembers' },
  { pattern: /(?:نشاط|أنشطة|activity|activities|watch\s+together|youtube\s+together|فيديو|video)/i, flag: PermissionFlagsBits.UseEmbeddedActivities, type: 'allow', name: 'UseEmbeddedActivities' },
  { pattern: /(?:ما|لا|محد|مو)\s*(?:يقدر(?:ون)?\s*)?يكتب(?:ون)?/i, flag: PermissionFlagsBits.SendMessages, type: 'deny', name: 'SendMessages' },
  { pattern: /يكتب(?:ون)?|يرسل(?:ون)?\s+رسائل/i, flag: PermissionFlagsBits.SendMessages, type: 'allow', name: 'SendMessages' },
  { pattern: /(?:منشن|تاق).*(?:@?everyone|@?here)/i, flag: PermissionFlagsBits.MentionEveryone, type: 'deny', name: 'MentionEveryone' },
  { pattern: /يحذف(?:ون)?\s+رسائل/i, flag: PermissionFlagsBits.ManageMessages, type: 'allow', name: 'ManageMessages' },
];

export interface ParsedArabicPermission {
  flag: bigint;
  name: string;
  type: 'allow' | 'deny';
}

export interface ArabicPermissionOperation {
  channelId: string;
  targetId: string;
  targetType: 'role';
  allow: string[];
  deny: string[];
}

export function detectArabicIntent(text: string): ArabicIntent {
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    if (patterns.some((pattern) => pattern.test(text))) return intent as ArabicIntent;
  }
  return 'UNKNOWN';
}

export function parseArabicPermissions(text: string): ParsedArabicPermission[] {
  const byKey = new Map<string, ParsedArabicPermission>();
  for (const entry of PERMISSION_PHRASES) {
    if (entry.pattern.test(text)) {
      byKey.set(`${entry.name}:${entry.type}`, {
        flag: entry.flag,
        name: entry.name,
        type: entry.type,
      });
    }
  }
  return [...byKey.values()];
}

export function applyArabicPermissionsToToolArgs(
  toolName: string,
  args: Record<string, any>,
  text: string,
  everyoneRoleId: string
): Record<string, any> {
  const permissions = parseArabicPermissions(text);
  if (permissions.length === 0) return args;

  const deny = permissions.filter((permission) => permission.type === 'deny').map((permission) => permission.name);
  const deniedNames = new Set(deny);
  const allow = permissions
    .filter((permission) => permission.type === 'allow' && !deniedNames.has(permission.name))
    .map((permission) => permission.name);

  if (toolName === 'edit_permissions' || toolName === 'bulk_permission_update') {
    if (Array.isArray(args.allow) && Array.isArray(args.deny)) return args;
    const targetsEveryone = /(?:الكل|الجميع|@?everyone|@?here)/i.test(text);
    return {
      ...args,
      targetId: args.targetId ?? (targetsEveryone ? everyoneRoleId : undefined),
      targetType: args.targetType ?? (targetsEveryone ? 'role' : undefined),
      allow,
      deny,
    };
  }
  if (toolName === 'create_channels' && !args.permissions) {
    return {
      ...args,
      permissions: [{ id: everyoneRoleId, allow, deny }],
    };
  }
  return args;
}

function permissionNames(text: string): { allow: string[]; deny: string[] } {
  const permissions = parseArabicPermissions(text);
  const deny = [...new Set(
    permissions.filter((permission) => permission.type === 'deny').map((permission) => permission.name)
  )];
  const deniedNames = new Set(deny);
  const allow = [...new Set(
    permissions
      .filter((permission) => permission.type === 'allow' && !deniedNames.has(permission.name))
      .map((permission) => permission.name)
  )];
  return { allow, deny };
}

function normalizeName(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('ar')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim();
}

export function buildArabicPermissionOperations(
  text: string,
  guild: Guild,
  sessionEntities?: Array<{ id: string; name: string; type: string }>
): ArabicPermissionOperation[] {
  const isConcreteChannel = (id: string): boolean => {
    const channel = guild.channels.cache.get(id);
    return Boolean(channel && channel.type !== ChannelType.GuildCategory);
  };
  const sessionChannels = (sessionEntities ?? []).filter((e) => e.type === 'channel' || e.type === 'thread');
  const sessionChannelIds = new Set(sessionChannels.map((entity) => entity.id));
  const mentionedChannelIds = [...text.matchAll(/<#(\d{17,20})>/g)]
    .map((match) => match[1])
    .filter((id) => guild.channels.cache.get(id)?.type !== ChannelType.GuildCategory);
  const rawChannelIds = [...text.matchAll(/\b(\d{17,20})\b/g)]
    .map((match) => match[1])
    .filter((id) => isConcreteChannel(id) || sessionChannelIds.has(id));
  let channelId = mentionedChannelIds[0] ?? rawChannelIds[0];
  if (!channelId && sessionChannels.length > 0) {
    const textNorm = normalizeName(text);
    const sessionChannel = sessionChannels.find((e) => textNorm.includes(normalizeName(e.name)))
      ?? (/(?:الروم|روم|القناه|القناة|الشانل)/i.test(text) ? sessionChannels[0] : undefined);
    if (sessionChannel) {
      channelId = sessionChannel.id;
    }
  }
  // Fallback to EntityRegistry (guild-level, broader TTL) if not found in session
  if (!channelId) {
    const registryChannels = EntityRegistry.getRecent(guild.id, 'channel')
      .concat(EntityRegistry.getRecent(guild.id, 'category'));
    if (registryChannels.length > 0) {
      const textNorm = normalizeName(text);
      const registryMatch = registryChannels.find((e) => textNorm.includes(normalizeName(e.name)))
        ?? (/(?:الروم|روم|القناه|القناة|الشانل)/i.test(text) ? registryChannels[0] : undefined);
      if (registryMatch) {
        channelId = registryMatch.id;
      }
    }
  }
  if (!channelId) return [];

  const exceptionMatch = text.match(
    /(?:(?:إلا|الا)\s+(?:اللي|الي|من)?\s*(?:معه|عنده)?\s*|(?:فقط|بس)\s+(?:اللي|الي|من)?\s*(?:معه|عنده)?\s*)(?:رتبة|رتبت|رول)\s+(?:<@&(?<roleId>\d{17,20})>|@?(?<roleName>.+?))(?=\s+(?:يقدر|يدخل|يخش|يتصل|تدخل|تخش|تتصل|تشوف|ترى|تكتب|تتكلم|تفتح|تسوي|يسمح|$))/i
  );
  const exceptionIndex = exceptionMatch?.index ?? -1;
  const everyoneText = exceptionIndex >= 0 ? text.slice(0, exceptionIndex) : text;
  const everyonePermissions = permissionNames(everyoneText);
  const operations: ArabicPermissionOperation[] = [];

  if (
    /(?:الكل|الجميع|كل\s+الناس|everyone)/i.test(text) &&
    (everyonePermissions.allow.length > 0 || everyonePermissions.deny.length > 0)
  ) {
    operations.push({
      channelId,
      targetId: guild.id,
      targetType: 'role',
      ...everyonePermissions,
    });
  }

  if (exceptionMatch) {
    const explicitRoleId = exceptionMatch.groups?.roleId;
    const requestedRoleName = normalizeName(exceptionMatch.groups?.roleName ?? '');
    const role = explicitRoleId
      ? guild.roles.cache.get(explicitRoleId)
      : guild.roles.cache.find((candidate) =>
        candidate.id !== guild.id && normalizeName(candidate.name) === requestedRoleName
      );
    if (!role) return [];

    const roleText = text.slice((exceptionMatch.index ?? 0) + exceptionMatch[0].length);
    const rolePermissions = permissionNames(roleText);
    const hasVoiceAccess = rolePermissions.allow.some((permission) =>
      ['Connect', 'Speak', 'Stream', 'UseEmbeddedActivities'].includes(permission)
    );
    if (hasVoiceAccess && !rolePermissions.deny.includes('ViewChannel')) {
      rolePermissions.allow = [...new Set(['ViewChannel', ...rolePermissions.allow])];
    }
    if (rolePermissions.allow.length > 0 || rolePermissions.deny.length > 0) {
      operations.push({
        channelId,
        targetId: role.id,
        targetType: 'role',
        ...rolePermissions,
      });
    }
  }

  return operations;
}
