import { PermissionFlagsBits } from 'discord.js';

export type ArabicIntent =
  | 'CREATE_CHANNEL'
  | 'SET_PERMISSIONS'
  | 'DELETE_CHANNEL'
  | 'BAN_USER'
  | 'KICK_USER'
  | 'TIMEOUT_USER'
  | 'GIVE_ROLE'
  | 'UNKNOWN';

const INTENT_PATTERNS: Record<Exclude<ArabicIntent, 'UNKNOWN'>, RegExp[]> = {
  CREATE_CHANNEL: [
    /(?:سو|سوي|انشئ|أنشئ|اضف|أضف|ابغى|ابي)\s+(?:لي\s+)?(?:روم|قناة|شانل)/i,
  ],
  SET_PERMISSIONS: [
    /(?:صلاحيات?|برمشن|برمشنز)/i,
    /(?:خلي|خلّي|امنع|إمنع).*(?:يشوف|يدخل|يتكلم|يكتب)/i,
  ],
  DELETE_CHANNEL: [
    /(?:احذف|إحذف|حذف|امسح|أمسح|ازيل|أزل)\s+(?:الروم|القناة|الشانل|روم|قناة)/i,
  ],
  BAN_USER: [/(?:بان|ban|احظر|إحظر|حظر نهائي)\s+/i],
  KICK_USER: [/(?:كيك|kick)\s+/i, /طرد\s+(?!نهائي)/i],
  TIMEOUT_USER: [/(?:تايم\s?اوت|timeout|ميوت|اسكت|أسكت|كتم)\s+/i],
  GIVE_ROLE: [/(?:اعطي|أعطي|عطي|ضيف|اضف|أضف)\s+(?:رتبة|رول|دور)\s+/i],
};

const PERMISSION_PHRASES: Array<{
  pattern: RegExp;
  flag: bigint;
  type: 'allow' | 'deny';
  name: string;
}> = [
  { pattern: /(?:الكل\s+)?(?:يشوف(?:ون)?|يقرأ(?:ون)?)(?:\s+الروم)?/i, flag: PermissionFlagsBits.ViewChannel, type: 'allow', name: 'ViewChannel' },
  { pattern: /(?:ما|لا)\s+يشوف(?:ون)?/i, flag: PermissionFlagsBits.ViewChannel, type: 'deny', name: 'ViewChannel' },
  { pattern: /(?:ما|لا|محد)\s+(?:يقدر\s+)?يدخل/i, flag: PermissionFlagsBits.Connect, type: 'deny', name: 'Connect' },
  { pattern: /(?:يقدر(?:ون)?\s+)?يدخل(?:ون)?/i, flag: PermissionFlagsBits.Connect, type: 'allow', name: 'Connect' },
  { pattern: /يتكلم(?:ون)?/i, flag: PermissionFlagsBits.Speak, type: 'allow', name: 'Speak' },
  { pattern: /(?:سكرين\s*شير|بث\s+الشاشة)/i, flag: PermissionFlagsBits.Stream, type: 'allow', name: 'Stream' },
  { pattern: /(?:ما|لا)\s+يكتب(?:ون)?/i, flag: PermissionFlagsBits.SendMessages, type: 'deny', name: 'SendMessages' },
  { pattern: /يكتب(?:ون)?|يرسل(?:ون)?\s+رسائل/i, flag: PermissionFlagsBits.SendMessages, type: 'allow', name: 'SendMessages' },
  { pattern: /(?:منشن|تاق).*(?:@?everyone|@?here)/i, flag: PermissionFlagsBits.MentionEveryone, type: 'deny', name: 'MentionEveryone' },
  { pattern: /يحذف(?:ون)?\s+رسائل/i, flag: PermissionFlagsBits.ManageMessages, type: 'allow', name: 'ManageMessages' },
];

export interface ParsedArabicPermission {
  flag: bigint;
  name: string;
  type: 'allow' | 'deny';
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
