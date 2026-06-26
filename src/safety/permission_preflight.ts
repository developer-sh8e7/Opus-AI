import {
  ChannelType,
  Guild,
  GuildMember,
  PermissionFlagsBits,
  type GuildBasedChannel,
} from 'discord.js';
import { PRODUCT_NAME } from '../branding.js';
import { requiredPermissionForAdvancedAction, type AdvancedDiscordAction } from '../utils/advancedDiscordActions.js';
import { permissionArabicNames, permissionMap, resolvePermission } from '../utils/discordTools.js';
import { validateHierarchy, validateMemberHierarchy } from '../utils/security.js';

export interface PreflightCheck {
  code: string;
  ok: boolean;
  label: string;
  current?: string;
  fix?: string;
}

export interface PermissionPreflightResult {
  ok: boolean;
  actionLabel: string;
  requiredPermissions: string[];
  checks: PreflightCheck[];
  message: string;
}

const ADVANCED_GROUPS = new Set([
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
]);

function permissionName(bit: bigint): string {
  return Object.entries(permissionMap).find(([, value]) => value === bit)?.[0] ?? String(bit);
}

function permissionLabel(name: string): string {
  return permissionArabicNames[name] ? `${name} (${permissionArabicNames[name]})` : name;
}

function uniqueBits(values: bigint[]): bigint[] {
  return [...new Set(values.map(String))].map(BigInt);
}

function hasPermission(member: GuildMember, permission: bigint): boolean {
  return member.permissions.has(PermissionFlagsBits.Administrator) || member.permissions.has(permission);
}

function isAdmin(member: GuildMember): boolean {
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

/** Returns true if the string looks like an unresolved internal template variable. */
function isTemplateVariable(value: string): boolean {
  return /^\$[a-zA-Z_]/.test(value);
}

/** Sanitize a value that might be an unresolved template variable for display. */
function sanitizeId(value: unknown): string {
  const str = String(value ?? '');
  if (!str || isTemplateVariable(str)) return '';
  return str;
}

function getChannel(guild: Guild, id: unknown): GuildBasedChannel | undefined {
  if (!id) return undefined;
  return guild.channels.cache.get(String(id));
}

function channelHasPermission(channel: GuildBasedChannel, member: GuildMember, permission: bigint): boolean {
  if (isAdmin(member)) return true; // Administrator bypasses ALL channel-level checks
  if (!('permissionsFor' in channel)) return true;
  return Boolean(channel.permissionsFor(member)?.has(permission));
}

function requiredBotPermissions(toolName: string, args: Record<string, any>): bigint[] {
  switch (toolName) {
    case 'create_channels':
      return args.permissions ? [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageRoles] : [PermissionFlagsBits.ManageChannels];
    case 'delete_channels':
      return [PermissionFlagsBits.ManageChannels];
    case 'edit_permissions':
    case 'bulk_permission_update':
    case 'sweep_permission_overwrites':
      return [PermissionFlagsBits.ManageRoles, PermissionFlagsBits.ViewChannel];
    case 'manage_roles':
      return [PermissionFlagsBits.ManageRoles];
    case 'bulk_delete_messages':
      return [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory];
    case 'send_embed':
      return [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks];
    case 'edit_bot_profile':
      return [PermissionFlagsBits.ChangeNickname];
    case 'manage_members': {
      const action = String(args.action ?? '');
      if (action === 'ban' || action === 'unban') return [PermissionFlagsBits.BanMembers];
      if (action === 'kick') return [PermissionFlagsBits.KickMembers];
      if (action === 'timeout' || action === 'untimeout') return [PermissionFlagsBits.ModerateMembers];
      if (action === 'move' || action === 'voicekick') return [PermissionFlagsBits.MoveMembers];
      if (action === 'deafen') return [PermissionFlagsBits.DeafenMembers];
      if (action === 'mute_voice') return [PermissionFlagsBits.MuteMembers];
      if (action === 'nickname') return [PermissionFlagsBits.ManageNicknames];
      return [];
    }
    default:
      if (ADVANCED_GROUPS.has(toolName)) {
        try {
          return [requiredPermissionForAdvancedAction(String(args.action ?? '') as AdvancedDiscordAction)];
        } catch {
          return [];
        }
      }
      return [];
  }
}

function targetChannelIds(guild: Guild, toolName: string, args: Record<string, any>): string[] {
  const ids = new Set<string>();
  const add = (value: unknown) => {
    if (value) ids.add(String(value));
  };
  const addMany = (value: unknown) => {
    if (Array.isArray(value)) value.forEach(add);
  };

  if (['edit_permissions', 'bulk_delete_messages', 'send_embed', 'channel_operations', 'thread_operations', 'message_operations', 'webhook_operations'].includes(toolName)) {
    add(args.channelId ?? args.threadId);
  }
  if (toolName === 'delete_channels') addMany(args.channelIds);
  if (toolName === 'bulk_permission_update' || toolName === 'sweep_permission_overwrites') {
    addMany(args.channelIds);
    add(args.categoryId);
    if (args.categoryId) {
      for (const channel of guild.channels.cache.values()) {
        if (channel.parentId === String(args.categoryId)) ids.add(channel.id);
      }
    }
  }
  if (toolName === 'create_channels') add(args.categoryId);
  if (ADVANCED_GROUPS.has(toolName)) {
    add(args.channelId ?? args.threadId ?? args.categoryId);
  }
  return [...ids];
}

function actionLabel(toolName: string, args: Record<string, any>): string {
  if (toolName === 'manage_members') {
    const action = String(args.action ?? '');
    const labels: Record<string, string> = {
      ban: 'حظر عضو',
      kick: 'طرد عضو',
      timeout: 'تايم أوت عضو',
      mute_voice: 'ميوت صوتي',
      deafen: 'ديفن عضو',
      voicekick: 'فصل عضو من الفويس',
      move: 'نقل عضو صوتيًا',
      nickname: 'تعديل لقب عضو',
      unban: 'فك حظر عضو',
    };
    return labels[action] ?? `إجراء أعضاء: ${action}`;
  }
  const labels: Record<string, string> = {
    create_channels: 'إنشاء رومات/كاتقوري',
    delete_channels: 'حذف رومات',
    edit_permissions: 'تعديل صلاحيات روم',
    bulk_permission_update: 'تعديل صلاحيات متعددة',
    sweep_permission_overwrites: 'فحص وسحب صلاحيات من الرومات',
    manage_roles: 'إدارة الرتب',
    bulk_delete_messages: 'حذف رسائل',
    send_embed: 'إرسال إيمبد',
    edit_bot_profile: 'تغيير اسم/لقب البوت',
  };
  return labels[toolName] ?? toolName;
}

/** Replace leftover internal $variable references with human-safe text. */
function sanitizeForDisplay(text: string): string {
  return text.replace(/\$[a-zA-Z_]\S*/g, '(قيمة داخلية غير معروفة)');
}

function buildMessage(result: Omit<PermissionPreflightResult, 'message'>): string {
  if (result.ok) return `فحص الصلاحيات نجح: أقدر أنفذ ${result.actionLabel}.`;
  const failed = result.checks.filter((check) => !check.ok);
  const lines = [
    `ما قدرت أبدأ إجراء "${result.actionLabel}" لأن فحص الصلاحيات فشل.`,
    '',
    'المطلوب:',
    ...(result.requiredPermissions.length > 0
      ? result.requiredPermissions.map((permission) => `- ${permissionLabel(permission)}`)
      : ['- لا توجد صلاحيات ديسكورد إضافية معروفة لهذا الإجراء']),
    '',
    'المشكلة:',
    ...failed.map((check) => `- ${sanitizeForDisplay(check.label)}${check.current ? `: ${sanitizeForDisplay(check.current)}` : ''}`),
    '',
    'الحل:',
  ];
  const fixes = [...new Set(failed.map((check) => check.fix).filter(Boolean) as string[])];
  if (fixes.length > 0) {
    fixes.forEach((fix, index) => lines.push(`${index + 1}. ${sanitizeForDisplay(fix)}`));
  } else {
    lines.push(`1. افتح Server Settings > Roles وارفع رتبة ${PRODUCT_NAME} وأعطها الصلاحيات المطلوبة بدون Administrator.`);
  }
  return lines.join('\n');
}

export async function runPermissionPreflight(
  toolName: string,
  args: Record<string, any>,
  guild: Guild,
  actorMember?: GuildMember | null
): Promise<PermissionPreflightResult> {
  const checks: PreflightCheck[] = [];
  const requiredBits = uniqueBits(requiredBotPermissions(toolName, args));
  const requiredPermissions = requiredBits.map(permissionName);
  const label = actionLabel(toolName, args);
  // Always fetch fresh bot member to avoid stale cache (especially for Administrator check)
  const botMember = guild.client.user
    ? await guild.members.fetch(guild.client.user.id).catch(() => guild.members.me)
    : null;

  // ── Administrator bypass ──────────────────────────────────────
  // Discord rule: Administrator grants every permission. If the bot has it,
  // skip all individual permission checks — they can never fail.
  if (botMember && isAdmin(botMember)) {
    const base = {
      ok: true,
      actionLabel: label,
      requiredPermissions,
      checks: [{
        code: 'administrator_bypass',
        ok: true,
        label: `✓ ${PRODUCT_NAME} يملك Administrator (جميع الصلاحيات مفعلة)`,
      }],
    };
    return { ...base, message: buildMessage(base) };
  }

  if (!botMember) {
    checks.push({
      code: 'bot_member_missing',
      ok: false,
      label: 'ما لقيت عضوية البوت داخل السيرفر',
      fix: `أعد دعوة ${PRODUCT_NAME} للسيرفر وتأكد أن البوت دخل بنجاح.`,
    });
  } else {
    for (const bit of requiredBits) {
      const name = permissionName(bit);
      checks.push({
        code: `bot_guild_permission_${name}`,
        ok: hasPermission(botMember, bit),
        label: `${PRODUCT_NAME} يحتاج ${permissionLabel(name)}`,
        current: hasPermission(botMember, bit) ? 'موجودة' : 'ناقصة',
        fix: `فعّل ${permissionLabel(name)} لرتبة ${PRODUCT_NAME} أو ارفع رتبة البوت فوق الرتبة/الروم المستهدف.`,
      });
    }

    for (const id of targetChannelIds(guild, toolName, args)) {
      const cleanId = sanitizeId(id);
      if (!cleanId) {
        // Unresolved internal template variable ($create_store_category.channelId, etc.)
        // — skip the check entirely instead of leaking raw $variable into the reply
        continue;
      }
      const channel = getChannel(guild, cleanId);
      if (!channel) {
        checks.push({
          code: 'target_channel_missing',
          ok: false,
          label: `الروم/الكاتقوري ${cleanId} غير موجود أو غير محمل بالكاش`,
          fix: 'استخدم منشن الروم/الكاتقوري أو ID صحيح وتأكد أنه لم يُحذف.',
        });
        continue;
      }
      const channelChecks = requiredBits.filter((bit) =>
        [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ManageRoles,
          PermissionFlagsBits.ManageMessages,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.EmbedLinks,
        ].includes(bit)
      );
      const viewOk = channelHasPermission(channel, botMember, PermissionFlagsBits.ViewChannel);
      checks.push({
        code: `channel_view_${channel.id}`,
        ok: viewOk,
        label: `${PRODUCT_NAME} يقدر يشوف "${channel.name}"`,
        current: viewOk ? 'نعم' : 'لا',
        fix: `اسمح لـ ${PRODUCT_NAME} بـ View Channel على "${channel.name}" أو على الكاتقوري الأب.`,
      });
      for (const bit of channelChecks) {
        const name = permissionName(bit);
        const ok = channelHasPermission(channel, botMember, bit);
        checks.push({
          code: `channel_permission_${channel.id}_${name}`,
          ok,
          label: `${PRODUCT_NAME} يملك ${permissionLabel(name)} داخل "${channel.name}"`,
          current: ok ? 'نعم' : 'لا',
          fix: `عدّل Overwrites في "${channel.name}" أو الكاتقوري الأب واسمح بصلاحية ${permissionLabel(name)} للبوت.`,
        });
      }
    }
  }

  if (toolName === 'edit_permissions' && args.targetType === 'role') {
    const targetId = String(args.targetId ?? '');
    if (targetId && targetId !== guild.id && targetId !== '@everyone') {
      const hierarchy = await validateHierarchy(guild, targetId);
      checks.push({
        code: 'role_hierarchy',
        ok: hierarchy.allowed,
        label: 'فحص ترتيب رتبة البوت مقابل الرتبة المستهدفة',
        current: hierarchy.allowed ? 'مناسب' : hierarchy.reason,
        fix: `ارفع رتبة ${PRODUCT_NAME} فوق الرتبة التي تريد تعديلها، أو اختر رتبة أقل.`,
      });
    }
  }

  if (toolName === 'manage_roles' && ['delete', 'edit', 'assign', 'remove'].includes(String(args.action ?? ''))) {
    const roleId = String(args.roleData?.roleId ?? '');
    if (roleId && roleId !== guild.id) {
      const hierarchy = await validateHierarchy(guild, roleId);
      checks.push({
        code: 'role_hierarchy',
        ok: hierarchy.allowed,
        label: 'فحص ترتيب رتبة البوت مقابل الرتبة المستهدفة',
        current: hierarchy.allowed ? 'مناسب' : hierarchy.reason,
        fix: `ارفع رتبة ${PRODUCT_NAME} فوق الرتبة التي تريد تعديلها/سحبها.`,
      });
    }
  }

  if (toolName === 'manage_members' && args.memberId && !['unban', 'voicekick', 'move'].includes(String(args.action ?? ''))) {
    const hierarchy = await validateMemberHierarchy(guild, String(args.memberId));
    checks.push({
      code: 'member_hierarchy',
      ok: hierarchy.allowed,
      label: 'فحص ترتيب رتبة البوت مقابل العضو المستهدف',
      current: hierarchy.allowed ? 'مناسب' : hierarchy.reason,
      fix: `ارفع رتبة ${PRODUCT_NAME} فوق رتبة العضو المستهدف، ولا يمكن التحكم بمالك السيرفر.`,
    });
  }

  if (toolName === 'edit_permissions') {
    for (const permission of [...(args.allow ?? []), ...(args.deny ?? [])]) {
      if (!resolvePermission(String(permission))) {
        checks.push({
          code: `unknown_permission_${permission}`,
          ok: false,
          label: `اسم صلاحية غير معروف: ${permission}`,
          fix: 'استخدم أسماء صلاحيات Discord الصحيحة مثل ViewChannel أو Connect أو SendMessages.',
        });
      }
    }
  }

  const base = {
    ok: checks.every((check) => check.ok),
    actionLabel: label,
    requiredPermissions,
    checks,
  };
  return {
    ...base,
    message: buildMessage(base),
  };
}

export function diagnoseDiscordApiError(error: unknown, fallbackAction = 'الإجراء المطلوب'): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (/Missing Permissions|50013/i.test(raw)) {
    return [
      `فشل ${fallbackAction} لأن Discord رفض العملية بسبب صلاحيات ناقصة.`,
      'الحل:',
      `1. ارفع رتبة ${PRODUCT_NAME} فوق الرتبة/العضو/الروم المستهدف.`,
      '2. فعّل الصلاحية المطلوبة مثل Manage Channels أو Manage Roles أو Moderate Members حسب العملية.',
      '3. تأكد من Overwrites داخل الروم أو الكاتقوري.',
    ].join('\n');
  }
  if (/Missing Access|50001/i.test(raw)) {
    return `فشل ${fallbackAction}: البوت لا يستطيع الوصول للروم/المورد. الحل: اسمح لـ ${PRODUCT_NAME} بـ View Channel على الروم أو الكاتقوري.`;
  }
  if (/Unknown Channel|10003/i.test(raw)) return `فشل ${fallbackAction}: الروم غير موجود أو انحذف. استخدم منشن أو ID صحيح.`;
  if (/Unknown Role|10011/i.test(raw)) return `فشل ${fallbackAction}: الرتبة غير موجودة أو انحذفت. منشن الرتبة المطلوبة.`;
  if (/Unknown Member|10007/i.test(raw)) return `فشل ${fallbackAction}: العضو غير موجود في السيرفر أو غير محمل. منشن العضو مباشرة.`;
  if (/rate.?limit|429/i.test(raw)) return `Discord حدّنا مؤقتًا بسبب كثرة العمليات. انتظر دقيقة ثم أعد attempt.`;
  return raw.length > 300 ? `${raw.slice(0, 300)}...` : raw;
}
