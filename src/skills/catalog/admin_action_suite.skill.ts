import {
  ChannelType,
  PermissionFlagsBits,
  type GuildBasedChannel,
  type GuildMember,
  type Role,
  type TextChannel,
} from 'discord.js';
import { SkillDefinition, SkillParams, SkillRegistry, SkillResult } from '../skill_registry.js';
import { resolvePermission } from '../../utils/discordTools.js';

const schema = { type: 'object', additionalProperties: true } as const;

type Category = SkillDefinition['category'];
type ArgMap = (args: Record<string, any>, params: SkillParams) => Record<string, any> | Promise<Record<string, any>>;

async function warningStore() {
  return import('../../autonomous/monitor.js');
}

function ok(message: string, data?: unknown): SkillResult {
  return { success: true, message, messageAr: message, data };
}

function fail(message: string): SkillResult {
  return { success: false, message, messageAr: message };
}

function skill(config: {
  id: string;
  name: string;
  nameAr?: string;
  category: Category;
  description: string;
  triggers: string[];
  triggersAr: string[];
  requiredPermissions: bigint[];
  execute: (params: SkillParams) => Promise<SkillResult>;
}): SkillDefinition {
  return {
    ...config,
    schema,
    examples: [],
  };
}

function toolSkill(config: Omit<Parameters<typeof skill>[0], 'execute'> & {
  toolName: string;
  mapArgs: ArgMap;
}): SkillDefinition {
  return skill({
    ...config,
    execute: async (params) => SkillRegistry.executeToolAdapter(
      config.toolName,
      await config.mapArgs(params.args, params),
      params
    ),
  });
}

function snowflake(value: unknown): string | undefined {
  const match = String(value ?? '').match(/\d{17,20}/);
  return match?.[0];
}

function textValue(args: Record<string, any>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = args[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function listValue(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string') return value.split(/[،,\s]+/).map((v) => v.trim()).filter(Boolean);
  return [];
}

function normalize(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('ar')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}\s_-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function resolveMember(params: SkillParams): Promise<{ member?: GuildMember; id?: string; error?: string }> {
  const args = params.args;
  const raw = textValue(args, ['memberId', 'userId', 'targetId', 'id', 'member', 'user', 'target', 'username', 'name', 'query']);
  const id = snowflake(raw);
  if (id) {
    const member = params.guild.members.cache.get(id) || await params.guild.members.fetch(id).catch(() => null);
    if (member) return { member, id: member.id };
    return { id, error: 'العضو غير موجود في السيرفر أو الـ ID غير صحيح.' };
  }
  const query = raw ? normalize(raw) : '';
  if (!query) return { error: 'حدد العضو بمنشن أو ID أو اسم واضح.' };
  const matches = params.guild.members.cache.filter((member) => {
    const display = normalize(member.displayName);
    const username = normalize(member.user.username);
    return display === query || username === query || display.includes(query) || username.includes(query);
  }).first(5);
  if (matches.length === 1) return { member: matches[0], id: matches[0]!.id };
  if (matches.length > 1) return { error: `لقيت أكثر من عضو مطابق: ${matches.map((m) => m.displayName).join('، ')}. استخدم المنشن أو ID.` };
  const fetched = await params.guild.members.fetch({ query: raw, limit: 5 }).catch(() => null);
  const fetchedMatches = fetched ? [...fetched.values()] : [];
  if (fetchedMatches.length === 1) return { member: fetchedMatches[0], id: fetchedMatches[0]!.id };
  if (fetchedMatches.length > 1) return { error: `لقيت أكثر من عضو مطابق: ${fetchedMatches.map((m) => m.displayName).join('، ')}. استخدم المنشن أو ID.` };
  return { error: 'ما لقيت العضو المطلوب. جرّب منشن أو ID.' };
}

async function resolveRole(params: SkillParams, keys = ['roleId', 'targetId', 'role', 'rank', 'name']): Promise<{ role?: Role; id?: string; error?: string }> {
  const raw = textValue(params.args, keys);
  if (raw === '@everyone' || normalize(raw ?? '') === 'everyone' || normalize(raw ?? '') === 'الكل') {
    const everyone = params.guild.roles.everyone;
    return { role: everyone, id: everyone.id };
  }
  const id = snowflake(raw);
  if (id) {
    const role = params.guild.roles.cache.get(id) || await params.guild.roles.fetch(id).catch(() => null);
    return role ? { role, id: role.id } : { error: 'الرتبة غير موجودة أو الـ ID غير صحيح.' };
  }
  const query = raw ? normalize(raw) : '';
  if (!query) return { error: 'حدد الرتبة بمنشن أو ID أو اسم واضح.' };
  const matches = params.guild.roles.cache.filter((role) => {
    const name = normalize(role.name);
    return name === query || name.includes(query);
  }).first(5);
  if (matches.length === 1) return { role: matches[0], id: matches[0]!.id };
  if (matches.length > 1) return { error: `لقيت أكثر من رتبة مطابقة: ${matches.map((r) => r.name).join('، ')}. استخدم منشن الرتبة أو ID.` };
  return { error: 'ما لقيت الرتبة المطلوبة. جرّب منشن أو ID.' };
}

async function resolveChannel(params: SkillParams, keys = ['channelId', 'targetChannelId', 'roomId', 'id', 'channel', 'room', 'name']): Promise<{ channel?: GuildBasedChannel; id?: string; error?: string }> {
  const raw = textValue(params.args, keys);
  const id = snowflake(raw) ?? (raw ? undefined : params.channel.id);
  if (id) {
    const channel = params.guild.channels.cache.get(id) || await params.guild.channels.fetch(id).catch(() => null);
    return channel ? { channel, id: channel.id } : { error: 'القناة غير موجودة أو الـ ID غير صحيح.' };
  }
  const query = raw ? normalize(raw.replace(/^#/, '')) : '';
  if (!query) return { channel: params.channel, id: params.channel.id };
  const matches = params.guild.channels.cache.filter((channel) => {
    const name = normalize((channel as any).name ?? '');
    return name === query || name.includes(query);
  }).first(5);
  if (matches.length === 1) return { channel: matches[0], id: matches[0]!.id };
  if (matches.length > 1) return { error: `لقيت أكثر من قناة مطابقة: ${matches.map((c: any) => c.name).join('، ')}. استخدم منشن القناة أو ID.` };
  return { error: 'ما لقيت القناة المطلوبة. جرّب منشن أو ID.' };
}

function parseDurationMs(args: Record<string, any>, fallbackMs?: number): number | undefined {
  const direct = Number(args.durationMs ?? args.duration);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const amount = Number(args.amount ?? args.value ?? args.count);
  const unit = normalize(String(args.unit ?? args.durationUnit ?? ''));
  if (Number.isFinite(amount) && amount > 0) {
    if (/ث|second|sec/.test(unit)) return amount * 1000;
    if (/ساع|hour|hr/.test(unit)) return amount * 60 * 60 * 1000;
    if (/يوم|day/.test(unit)) return amount * 24 * 60 * 60 * 1000;
    if (/اسبوع|اسبوع|week/.test(unit)) return amount * 7 * 24 * 60 * 60 * 1000;
    return amount * 60 * 1000;
  }
  const text = normalize(String(args.text ?? args.query ?? args.reason ?? ''));
  const m = text.match(/(\d+)\s*(ثانيه|ثواني|دقيقه|دقايق|ساعه|ساعات|يوم|ايام|اسبوع|اسابيع|second|minute|hour|day|week)/i);
  if (m) return parseDurationMs({ amount: Number(m[1]), unit: m[2] }, fallbackMs);
  return fallbackMs;
}

function reason(args: Record<string, any>, fallback = 'إجراء إداري عبر HumanGuard AI'): string {
  return String(args.reason ?? args.cause ?? args.سبب ?? fallback);
}

function memberActionSkill(config: {
  id: string;
  name: string;
  nameAr: string;
  action: 'ban' | 'unban' | 'kick' | 'timeout' | 'untimeout' | 'voicekick' | 'mute_voice' | 'deafen' | 'move' | 'nickname';
  category?: Category;
  requiredPermissions: bigint[];
  triggers: string[];
  triggersAr: string[];
  durationMs?: number;
  data?: (params: SkillParams, memberId: string) => Record<string, any> | Promise<Record<string, any>>;
}): SkillDefinition {
  return skill({
    id: config.id,
    name: config.name,
    nameAr: config.nameAr,
    category: config.category ?? 'moderation',
    description: `${config.name} with Arabic target resolution.`,
    triggers: config.triggers,
    triggersAr: config.triggersAr,
    requiredPermissions: config.requiredPermissions,
    execute: async (params) => {
      let memberId = snowflake(textValue(params.args, ['memberId', 'userId', 'targetId', 'id']));
      if (config.action !== 'unban') {
        const resolved = await resolveMember(params);
        if (resolved.error || !resolved.id) return fail(resolved.error ?? 'حدد العضو المطلوب.');
        memberId = resolved.id;
      }
      if (!memberId) return fail('حدد العضو أو المستخدم بالـ ID.');
      const data = config.data
        ? await config.data(params, memberId)
        : { reason: reason(params.args), duration: config.durationMs ?? parseDurationMs(params.args) };
      return SkillRegistry.executeToolAdapter('manage_members', { action: config.action, memberId, data }, params);
    },
  });
}

function permissionSkill(config: {
  id: string;
  name: string;
  nameAr: string;
  targetType: 'role' | 'member';
  permission: string;
  mode: 'allow' | 'deny';
  triggersAr: string[];
}): SkillDefinition {
  return skill({
    id: config.id,
    name: config.name,
    nameAr: config.nameAr,
    category: 'permissions',
    description: `Set ${config.permission} ${config.mode} overwrite for a ${config.targetType}.`,
    triggers: [config.id],
    triggersAr: config.triggersAr,
    requiredPermissions: [PermissionFlagsBits.ManageRoles],
    execute: async (params) => {
      const channel = await resolveChannel(params, ['channelId', 'roomId', 'channel', 'room']);
      if (channel.error || !channel.id) return fail(channel.error ?? 'حدد القناة المطلوبة.');
      const target = config.targetType === 'role'
        ? await resolveRole(params)
        : await resolveMember(params);
      if (target.error || !target.id) return fail(target.error ?? 'حدد الهدف المطلوب.');
      return SkillRegistry.executeToolAdapter('edit_permissions', {
        channelId: channel.id,
        targetId: target.id,
        targetType: config.targetType,
        allow: config.mode === 'allow' ? [config.permission] : [],
        deny: config.mode === 'deny' ? [config.permission] : [],
      }, params);
    },
  });
}

function channelPermissionSkill(config: {
  id: string;
  name: string;
  nameAr: string;
  allow?: string[];
  deny?: string[];
  triggersAr: string[];
  category?: Category;
}): SkillDefinition {
  return skill({
    id: config.id,
    name: config.name,
    nameAr: config.nameAr,
    category: config.category ?? 'permissions',
    description: 'Apply @everyone channel permission overwrite.',
    triggers: [config.id],
    triggersAr: config.triggersAr,
    requiredPermissions: [PermissionFlagsBits.ManageRoles],
    execute: async (params) => {
      const channel = await resolveChannel(params, ['channelId', 'roomId', 'channel', 'room']);
      if (channel.error || !channel.id) return fail(channel.error ?? 'حدد القناة المطلوبة.');
      return SkillRegistry.executeToolAdapter('edit_permissions', {
        channelId: channel.id,
        targetId: params.guild.id,
        targetType: 'role',
        allow: config.allow ?? [],
        deny: config.deny ?? [],
      }, params);
    },
  });
}

async function createChannel(params: SkillParams, type: 'text' | 'voice' | 'category', privateMode = false): Promise<SkillResult> {
  const name = textValue(params.args, ['name', 'channelName', 'roomName']) ?? (type === 'voice' ? 'voice-room' : type === 'category' ? 'category' : 'text-channel');
  const category = await resolveChannel(params, ['categoryId', 'parentId', 'category']).catch(() => undefined);
  const permissions = privateMode ? [{ id: '@everyone', allow: [], deny: ['ViewChannel'] }] : undefined;
  return SkillRegistry.executeToolAdapter('create_channels', {
    type,
    names: [name],
    categoryId: category?.id && category.channel?.type === ChannelType.GuildCategory ? category.id : undefined,
    permissions,
  }, params);
}

async function listMembersWithRole(params: SkillParams): Promise<SkillResult> {
  const role = await resolveRole(params);
  if (role.error || !role.role) return fail(role.error ?? 'حدد الرتبة المطلوبة.');
  const members = role.role.members.map((m) => `• ${m.displayName} (${m.id})`).slice(0, 80);
  return ok(members.length ? `أعضاء رتبة ${role.role.name}:\n${members.join('\n')}` : `رتبة ${role.role.name} ما فيها أعضاء ظاهرين بالكاش.`, {
    roleId: role.role.id,
    memberIds: role.role.members.map((m) => m.id),
  });
}

async function roleInfo(params: SkillParams): Promise<SkillResult> {
  const role = await resolveRole(params);
  if (role.error || !role.role) return fail(role.error ?? 'حدد الرتبة المطلوبة.');
  const permissions = role.role.permissions.toArray();
  return ok(`معلومات رتبة ${role.role.name}: الأعضاء ${role.role.members.size}، اللون ${role.role.hexColor}، الصلاحيات ${permissions.join(', ') || 'بدون صلاحيات خاصة'}.`, {
    id: role.role.id,
    name: role.role.name,
    members: role.role.members.size,
    permissions,
  });
}

async function setRolePermission(params: SkillParams, mode: 'add' | 'remove'): Promise<SkillResult> {
  const role = await resolveRole(params);
  if (role.error || !role.role) return fail(role.error ?? 'حدد الرتبة المطلوبة.');
  const permissionName = textValue(params.args, ['permission', 'permissionName', 'perm']) ?? '';
  const bit = resolvePermission(permissionName);
  if (bit === null) return fail('الصلاحية المطلوبة غير معروفة. اكتب اسم صلاحية Discord صحيح مثل ManageMessages.');
  const current = new Set<string>(role.role.permissions.toArray());
  const canonical = Object.entries(PermissionFlagsBits).find(([, value]) => value === bit)?.[0] as string | undefined;
  if (!canonical) return fail('الصلاحية المطلوبة غير مدعومة.');
  if (mode === 'add') current.add(canonical);
  else current.delete(canonical);
  await role.role.setPermissions([...current] as any, reason(params.args));
  return ok(mode === 'add' ? `تمت إضافة صلاحية ${canonical} لرتبة ${role.role.name}.` : `تم سحب صلاحية ${canonical} من رتبة ${role.role.name}.`);
}

async function memberInfoLine(params: SkillParams, mode: 'info' | 'roles' | 'join' | 'age'): Promise<SkillResult> {
  const resolved = await resolveMember(params);
  if (resolved.error || !resolved.member) return fail(resolved.error ?? 'حدد العضو المطلوب.');
  const m = resolved.member;
  if (mode === 'roles') return ok(`رتب ${m.displayName}: ${m.roles.cache.filter((r) => r.id !== params.guild.id).map((r) => r.name).join('، ') || 'بدون رتب'}.`);
  if (mode === 'join') return ok(`${m.displayName} دخل السيرفر: ${m.joinedAt?.toLocaleString('ar-SA') ?? 'غير معروف'}.`);
  if (mode === 'age') return ok(`حساب ${m.displayName} انشأ في: ${m.user.createdAt.toLocaleString('ar-SA')}.`);
  return SkillRegistry.executeToolAdapter('get_member_info', { memberId: m.id }, params);
}

async function auditChannelPermissions(params: SkillParams): Promise<SkillResult> {
  const channel = await resolveChannel(params);
  if (channel.error || !channel.channel || !('permissionOverwrites' in channel.channel)) return fail(channel.error ?? 'القناة لا تدعم صلاحيات Overwrites.');
  const overwrites = [...(channel.channel as any).permissionOverwrites.cache.values()].map((ow: any) => {
    const target = params.guild.roles.cache.get(ow.id)?.name ?? params.guild.members.cache.get(ow.id)?.displayName ?? ow.id;
    return `• ${target}: allow=[${ow.allow.toArray().join(', ') || '-'}] deny=[${ow.deny.toArray().join(', ') || '-'}]`;
  });
  return ok(overwrites.length ? `صلاحيات ${(channel.channel as any).name}:\n${overwrites.join('\n')}` : `ما فيه Overwrites خاصة على ${(channel.channel as any).name}.`);
}

async function resetChannelOverwrites(params: SkillParams): Promise<SkillResult> {
  const channel = await resolveChannel(params);
  if (channel.error || !channel.channel || !('permissionOverwrites' in channel.channel)) return fail(channel.error ?? 'القناة لا تدعم إعادة ضبط الصلاحيات.');
  await (channel.channel as any).permissionOverwrites.set([], reason(params.args));
  return ok(`تمت إعادة ضبط صلاحيات ${(channel.channel as any).name}.`);
}

async function copyChannelPerms(params: SkillParams): Promise<SkillResult> {
  const source = await resolveChannel(params, ['sourceChannelId', 'fromChannelId', 'source', 'from']);
  const target = await resolveChannel(params, ['targetChannelId', 'toChannelId', 'target', 'to', 'channelId']);
  if (source.error || !source.channel || !('permissionOverwrites' in source.channel)) return fail(source.error ?? 'حدد قناة المصدر.');
  if (target.error || !target.channel || !('permissionOverwrites' in target.channel)) return fail(target.error ?? 'حدد قناة الهدف.');
  const overwrites = [...(source.channel as any).permissionOverwrites.cache.values()].map((ow: any) => ({ id: ow.id, allow: ow.allow.bitfield, deny: ow.deny.bitfield, type: ow.type }));
  await (target.channel as any).permissionOverwrites.set(overwrites, reason(params.args));
  return ok(`تم نسخ صلاحيات ${(source.channel as any).name} إلى ${(target.channel as any).name}.`);
}

const skills: SkillDefinition[] = [
  memberActionSkill({ id: 'ban_member', name: 'Ban member', nameAr: 'بند عضو', action: 'ban', requiredPermissions: [PermissionFlagsBits.BanMembers], triggers: ['ban member'], triggersAr: ['بند', 'حظر', 'باند'] }),
  memberActionSkill({ id: 'ban_member_with_reason', name: 'Ban member with reason', nameAr: 'بند بسبب', action: 'ban', requiredPermissions: [PermissionFlagsBits.BanMembers], triggers: ['ban with reason'], triggersAr: ['بند بسبب', 'حظر بسبب'] }),
  memberActionSkill({ id: 'ban_member_delete_messages', name: 'Ban member and delete messages', nameAr: 'بند وحذف رسائل 7 أيام', action: 'ban', requiredPermissions: [PermissionFlagsBits.BanMembers], triggers: ['ban delete messages'], triggersAr: ['بند واحذف رسائله', 'حظر مع حذف الرسائل'], data: (params) => ({ reason: reason(params.args), deleteMessageSeconds: 7 * 24 * 60 * 60 }) }),
  memberActionSkill({ id: 'unban_member', name: 'Unban member', nameAr: 'فك الباند', action: 'unban', requiredPermissions: [PermissionFlagsBits.BanMembers], triggers: ['unban'], triggersAr: ['فك الحظر', 'فك الباند'] }),
  memberActionSkill({ id: 'kick_member', name: 'Kick member', nameAr: 'طرد عضو', action: 'kick', requiredPermissions: [PermissionFlagsBits.KickMembers], triggers: ['kick'], triggersAr: ['طرد', 'كيك', 'اطرد'] }),
  memberActionSkill({ id: 'kick_member_with_reason', name: 'Kick member with reason', nameAr: 'طرد بسبب', action: 'kick', requiredPermissions: [PermissionFlagsBits.KickMembers], triggers: ['kick reason'], triggersAr: ['طرد بسبب', 'كيك بسبب'] }),
  ...[
    ['timeout_member_60s', 60_000, 'تايم اوت 60 ثانية'],
    ['timeout_member_5m', 5 * 60_000, 'تايم اوت 5 دقايق'],
    ['timeout_member_10m', 10 * 60_000, 'تايم اوت 10 دقايق'],
    ['timeout_member_30m', 30 * 60_000, 'تايم اوت 30 دقيقة'],
    ['timeout_member_1h', 60 * 60_000, 'تايم اوت ساعة'],
    ['timeout_member_6h', 6 * 60 * 60_000, 'تايم اوت 6 ساعات'],
    ['timeout_member_12h', 12 * 60 * 60_000, 'تايم اوت 12 ساعة'],
    ['timeout_member_1d', 24 * 60 * 60_000, 'تايم اوت يوم'],
    ['timeout_member_3d', 3 * 24 * 60 * 60_000, 'تايم اوت 3 أيام'],
    ['timeout_member_7d', 7 * 24 * 60 * 60_000, 'تايم اوت أسبوع'],
  ].map(([id, ms, label]) => memberActionSkill({ id: String(id), name: String(label), nameAr: String(label), action: 'timeout', requiredPermissions: [PermissionFlagsBits.ModerateMembers], triggers: [String(id)], triggersAr: [String(label), `اسكته ${String(label).replace('تايم اوت ', '')}`], durationMs: Number(ms) })),
  memberActionSkill({ id: 'timeout_member_custom', name: 'Custom timeout', nameAr: 'تايم اوت مدة مخصصة', action: 'timeout', requiredPermissions: [PermissionFlagsBits.ModerateMembers], triggers: ['custom timeout'], triggersAr: ['تايم اوت مدة', 'اسكته مدة'], data: (params) => ({ reason: reason(params.args), duration: Math.min(parseDurationMs(params.args, 10 * 60_000) ?? 10 * 60_000, 28 * 24 * 60 * 60_000) }) }),
  memberActionSkill({ id: 'remove_timeout', name: 'Remove timeout', nameAr: 'رفع التايم اوت', action: 'untimeout', requiredPermissions: [PermissionFlagsBits.ModerateMembers], triggers: ['remove timeout'], triggersAr: ['فك التايم', 'شيل الميوت', 'رفع التايم اوت'] }),
  skill({ id: 'warn_member', name: 'Warn member', nameAr: 'تحذير عضو', category: 'moderation', description: 'Store a warning for a member.', triggers: ['warn member'], triggersAr: ['حذر', 'اعطه تحذير', 'انذار'], requiredPermissions: [PermissionFlagsBits.KickMembers], execute: async (params) => { const m = await resolveMember(params); if (m.error || !m.id) return fail(m.error ?? 'حدد العضو.'); const store = await warningStore(); const count = store.addWarning(m.id, reason(params.args, 'تحذير إداري')); return ok(`تم تحذير ${m.member?.displayName ?? m.id}. عدد التحذيرات الآن: ${count}.`); } }),
  skill({ id: 'get_member_warnings', name: 'Get member warnings', nameAr: 'عرض تحذيرات عضو', category: 'moderation', description: 'Show warning history.', triggers: ['member warnings'], triggersAr: ['تحذيرات العضو', 'كم تحذير'], requiredPermissions: [PermissionFlagsBits.KickMembers], execute: async (params) => { const m = await resolveMember(params); if (m.error || !m.id) return fail(m.error ?? 'حدد العضو.'); const store = await warningStore(); const history = store.getUserWarningRecord(m.id); return ok(history?.reasons?.length ? `تحذيرات ${m.member?.displayName ?? m.id}:\n${history.reasons.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}` : `ما فيه تحذيرات مسجلة على ${m.member?.displayName ?? m.id}.`, { count: store.getWarningCount(m.id), history }); } }),
  skill({ id: 'clear_member_warnings', name: 'Clear member warnings', nameAr: 'مسح تحذيرات عضو', category: 'moderation', description: 'Clear warning history.', triggers: ['clear warnings'], triggersAr: ['امسح تحذيراته', 'صفر التحذيرات'], requiredPermissions: [PermissionFlagsBits.Administrator], execute: async (params) => { const m = await resolveMember(params); if (m.error || !m.id) return fail(m.error ?? 'حدد العضو.'); const store = await warningStore(); store.clearUserWarnings(m.id); return ok(`تم مسح تحذيرات ${m.member?.displayName ?? m.id}.`); } }),

  memberActionSkill({ id: 'voice_disconnect_member', name: 'Voice disconnect member', nameAr: 'فصل عضو من الفويس', action: 'voicekick', category: 'voice_management', requiredPermissions: [PermissionFlagsBits.MoveMembers], triggers: ['voice disconnect'], triggersAr: ['دسكونكت', 'افصله من الروم', 'طلعه من الفويس'] }),
  memberActionSkill({ id: 'voice_mute_member', name: 'Server mute voice member', nameAr: 'ميوت صوتي سيرفر', action: 'mute_voice', category: 'voice_management', requiredPermissions: [PermissionFlagsBits.MuteMembers], triggers: ['server mute'], triggersAr: ['ميوت سيرفر', 'اسكت صوته'], data: (params) => ({ reason: reason(params.args), enabled: true }) }),
  memberActionSkill({ id: 'voice_unmute_member', name: 'Remove server voice mute', nameAr: 'رفع الميوت الصوتي', action: 'mute_voice', category: 'voice_management', requiredPermissions: [PermissionFlagsBits.MuteMembers], triggers: ['server unmute'], triggersAr: ['فك الميوت الصوتي', 'خله يتكلم بالصوت'], data: (params) => ({ reason: reason(params.args), enabled: false }) }),
  memberActionSkill({ id: 'voice_deafen_member', name: 'Server deafen member', nameAr: 'ديفن سيرفر', action: 'deafen', category: 'voice_management', requiredPermissions: [PermissionFlagsBits.DeafenMembers], triggers: ['server deafen'], triggersAr: ['ديفن', 'ما يسمع', 'اصمه'], data: (params) => ({ reason: reason(params.args), enabled: true }) }),
  memberActionSkill({ id: 'voice_undeafen_member', name: 'Remove server deafen', nameAr: 'رفع الديفن', action: 'deafen', category: 'voice_management', requiredPermissions: [PermissionFlagsBits.DeafenMembers], triggers: ['server undeafen'], triggersAr: ['فك الديفن', 'خله يسمع'], data: (params) => ({ reason: reason(params.args), enabled: false }) }),
  memberActionSkill({ id: 'voice_move_member', name: 'Move voice member', nameAr: 'نقل عضو فويس', action: 'move', category: 'voice_management', requiredPermissions: [PermissionFlagsBits.MoveMembers], triggers: ['voice move'], triggersAr: ['انقله روم', 'حركه فويس'], data: async (params) => { const ch = await resolveChannel(params, ['targetChannelId', 'toChannelId', 'voiceChannelId', 'channelId']); return { reason: reason(params.args), channelId: ch.id }; } }),
  skill({ id: 'voice_mute_and_deafen', name: 'Mute and deafen member', nameAr: 'ميوت وديفن', category: 'voice_management', description: 'Server mute and deafen together.', triggers: ['mute and deafen'], triggersAr: ['ميوت وديفن', 'اسكته وصمه'], requiredPermissions: [PermissionFlagsBits.MuteMembers, PermissionFlagsBits.DeafenMembers], execute: async (params) => { const m = await resolveMember(params); if (m.error || !m.id) return fail(m.error ?? 'حدد العضو.'); const r1 = await SkillRegistry.executeToolAdapter('manage_members', { action: 'mute_voice', memberId: m.id, data: { enabled: true, reason: reason(params.args) } }, params); const r2 = await SkillRegistry.executeToolAdapter('manage_members', { action: 'deafen', memberId: m.id, data: { enabled: true, reason: reason(params.args) } }, params); return r1.success && r2.success ? ok(`تم تفعيل الميوت والديفن على ${m.member?.displayName ?? m.id}.`) : fail(`${r1.message}\n${r2.message}`); } }),
  skill({ id: 'voice_unmute_and_undeafen', name: 'Unmute and undeafen member', nameAr: 'فك ميوت وديفن', category: 'voice_management', description: 'Remove server mute and deafen together.', triggers: ['unmute and undeafen'], triggersAr: ['فك الميوت والديفن', 'خله يتكلم ويسمع'], requiredPermissions: [PermissionFlagsBits.MuteMembers, PermissionFlagsBits.DeafenMembers], execute: async (params) => { const m = await resolveMember(params); if (m.error || !m.id) return fail(m.error ?? 'حدد العضو.'); await SkillRegistry.executeToolAdapter('manage_members', { action: 'mute_voice', memberId: m.id, data: { enabled: false, reason: reason(params.args) } }, params); await SkillRegistry.executeToolAdapter('manage_members', { action: 'deafen', memberId: m.id, data: { enabled: false, reason: reason(params.args) } }, params); return ok(`تم رفع الميوت والديفن عن ${m.member?.displayName ?? m.id}.`); } }),
  skill({ id: 'voice_disconnect_all', name: 'Disconnect all from voice', nameAr: 'فصل كل اللي بالروم', category: 'voice_management', description: 'Disconnect all members from one voice channel.', triggers: ['disconnect all voice'], triggersAr: ['فصل كل اللي بالروم', 'دسكونكت الجميع'], requiredPermissions: [PermissionFlagsBits.MoveMembers], execute: async (params) => { const ch = await resolveChannel(params); const vc = ch.channel as any; if (ch.error || !vc?.members) return fail(ch.error ?? 'حدد روم صوتي.'); let n = 0; for (const member of vc.members.values()) { await member.voice.disconnect(reason(params.args)).catch(() => null); n++; } return ok(`تم فصل ${n} عضو من ${vc.name}.`); } }),
  skill({ id: 'voice_move_all', name: 'Move all voice members', nameAr: 'نقل كل اللي بالروم', category: 'voice_management', description: 'Move all members from one voice channel to another.', triggers: ['move all voice'], triggersAr: ['انقل كل اللي بالروم', 'حرك الجميع'], requiredPermissions: [PermissionFlagsBits.MoveMembers], execute: async (params) => { const source = await resolveChannel(params, ['sourceChannelId', 'fromChannelId', 'source', 'from']); const target = await resolveChannel(params, ['targetChannelId', 'toChannelId', 'target', 'to']); const sv = source.channel as any; const tv = target.channel as any; if (source.error || !sv?.members) return fail(source.error ?? 'حدد روم المصدر الصوتي.'); if (target.error || !tv || tv.type !== ChannelType.GuildVoice) return fail(target.error ?? 'حدد روم الهدف الصوتي.'); let n = 0; for (const member of sv.members.values()) { await member.voice.setChannel(tv, reason(params.args)).catch(() => null); n++; } return ok(`تم نقل ${n} عضو إلى ${tv.name}.`); } }),
  toolSkill({ id: 'voice_set_user_limit', name: 'Set voice user limit', nameAr: 'تحديد حد الروم الصوتي', category: 'voice_management', description: 'Set voice user limit.', triggers: ['voice user limit'], triggersAr: ['حدد عدد الفويس', 'حد الروم الصوتي'], requiredPermissions: [PermissionFlagsBits.ManageChannels], toolName: 'channel_operations', mapArgs: async (args, params) => ({ action: 'voice_set_user_limit', channelId: (await resolveChannel(params)).id, value: Number(args.limit ?? args.value ?? args.count ?? 0), reason: reason(args) }) }),
  toolSkill({ id: 'voice_remove_user_limit', name: 'Remove voice user limit', nameAr: 'إزالة حد الروم الصوتي', category: 'voice_management', description: 'Remove voice user limit.', triggers: ['remove voice limit'], triggersAr: ['شيل حد الفويس', 'بدون حد'], requiredPermissions: [PermissionFlagsBits.ManageChannels], toolName: 'channel_operations', mapArgs: async (args, params) => ({ action: 'voice_set_user_limit', channelId: (await resolveChannel(params)).id, value: 0, reason: reason(args) }) }),
  channelPermissionSkill({ id: 'voice_lock_channel', name: 'Lock voice channel', nameAr: 'قفل الروم الصوتي', deny: ['Connect'], triggersAr: ['قفل الفويس', 'محد يدخل الروم'], category: 'voice_management' }),
  channelPermissionSkill({ id: 'voice_unlock_channel', name: 'Unlock voice channel', nameAr: 'فتح الروم الصوتي', allow: ['Connect'], triggersAr: ['افتح الفويس', 'خليهم يدخلون'], category: 'voice_management' }),
  channelPermissionSkill({ id: 'voice_hide_channel', name: 'Hide voice channel', nameAr: 'إخفاء الروم الصوتي', deny: ['ViewChannel'], triggersAr: ['اخف الفويس', 'محد يشوف الروم'], category: 'voice_management' }),
  channelPermissionSkill({ id: 'voice_show_channel', name: 'Show voice channel', nameAr: 'إظهار الروم الصوتي', allow: ['ViewChannel'], triggersAr: ['اظهر الفويس', 'خليهم يشوفون الروم'], category: 'voice_management' }),
  channelPermissionSkill({ id: 'voice_visible_but_locked', name: 'Voice visible but locked', nameAr: 'يشوفونه وما يدخلون', allow: ['ViewChannel'], deny: ['Connect'], triggersAr: ['يشوفونه بس ما يدخلون', 'ظاهر ومقفل'], category: 'voice_management' }),
  toolSkill({ id: 'voice_set_bitrate', name: 'Set voice bitrate', nameAr: 'تغيير جودة الصوت', category: 'voice_management', description: 'Set voice bitrate.', triggers: ['voice bitrate'], triggersAr: ['غير جودة الصوت', 'bitrate'], requiredPermissions: [PermissionFlagsBits.ManageChannels], toolName: 'channel_operations', mapArgs: async (args, params) => ({ action: 'voice_set_bitrate', channelId: (await resolveChannel(params)).id, value: Number(args.bitrate ?? args.value), reason: reason(args) }) }),
  toolSkill({ id: 'voice_set_region', name: 'Set voice region', nameAr: 'تغيير منطقة الفويس', category: 'voice_management', description: 'Set voice RTC region.', triggers: ['voice region'], triggersAr: ['غير منطقة الفويس', 'region'], requiredPermissions: [PermissionFlagsBits.ManageChannels], toolName: 'channel_operations', mapArgs: async (args, params) => ({ action: 'voice_set_rtc_region', channelId: (await resolveChannel(params)).id, region: args.region ?? null, reason: reason(args) }) }),

  channelPermissionSkill({ id: 'text_lock_channel', name: 'Lock text channel', nameAr: 'قفل الشات', deny: ['SendMessages'], triggersAr: ['قفل الشات', 'محد يكتب'], category: 'channel_management' }),
  channelPermissionSkill({ id: 'text_unlock_channel', name: 'Unlock text channel', nameAr: 'فتح الشات', allow: ['SendMessages'], triggersAr: ['افتح الشات', 'خلهم يكتبون'], category: 'channel_management' }),
  ...[
    ['text_slowmode_off', 0, 'إيقاف السلومود'], ['text_slowmode_5s', 5, 'سلومود 5 ثواني'], ['text_slowmode_10s', 10, 'سلومود 10 ثواني'], ['text_slowmode_30s', 30, 'سلومود 30 ثانية'], ['text_slowmode_1m', 60, 'سلومود دقيقة'], ['text_slowmode_5m', 300, 'سلومود 5 دقائق'],
  ].map(([id, seconds, label]) => toolSkill({ id: String(id), name: String(label), nameAr: String(label), category: 'channel_management', description: 'Set text channel slowmode.', triggers: [String(id)], triggersAr: [String(label), 'سلو مود'], requiredPermissions: [PermissionFlagsBits.ManageChannels], toolName: 'channel_operations', mapArgs: async (args, params) => ({ action: 'channel_set_slowmode', channelId: (await resolveChannel(params)).id, duration: Number(seconds), reason: reason(args) }) })),
  toolSkill({ id: 'text_slowmode_custom', name: 'Custom slowmode', nameAr: 'سلومود مدة مخصصة', category: 'channel_management', description: 'Set custom slowmode.', triggers: ['custom slowmode'], triggersAr: ['سلو مود مدة', 'ثانية بين كل رسالة'], requiredPermissions: [PermissionFlagsBits.ManageChannels], toolName: 'channel_operations', mapArgs: async (args, params) => ({ action: 'channel_set_slowmode', channelId: (await resolveChannel(params)).id, duration: Math.round((parseDurationMs(args, 5_000) ?? 5_000) / 1000), reason: reason(args) }) }),
  toolSkill({ id: 'text_purge_messages', name: 'Purge messages', nameAr: 'حذف رسائل', category: 'moderation', description: 'Bulk delete messages.', triggers: ['purge messages'], triggersAr: ['امسح الرسائل', 'نظف الشات', 'احذف رسائل'], requiredPermissions: [PermissionFlagsBits.ManageMessages], toolName: 'bulk_delete_messages', mapArgs: async (args, params) => ({ channelId: (await resolveChannel(params)).id, count: Number(args.count ?? args.amount ?? 10) }) }),
  toolSkill({ id: 'text_purge_user_messages', name: 'Purge user messages', nameAr: 'حذف رسائل عضو', category: 'moderation', description: 'Bulk delete messages by member.', triggers: ['purge user messages'], triggersAr: ['امسح رسائل عضو', 'نظف رسائل فلان'], requiredPermissions: [PermissionFlagsBits.ManageMessages], toolName: 'bulk_delete_messages', mapArgs: async (args, params) => ({ channelId: (await resolveChannel(params)).id, count: Number(args.count ?? args.amount ?? 25), userId: (await resolveMember(params)).id }) }),
  channelPermissionSkill({ id: 'text_hide_channel', name: 'Hide text channel', nameAr: 'إخفاء الشات', deny: ['ViewChannel'], triggersAr: ['اخف الشات', 'محد يشوف الشات'], category: 'channel_management' }),
  channelPermissionSkill({ id: 'text_show_channel', name: 'Show text channel', nameAr: 'إظهار الشات', allow: ['ViewChannel'], triggersAr: ['اظهر الشات', 'خلهم يشوفون الشات'], category: 'channel_management' }),
  channelPermissionSkill({ id: 'text_make_readonly', name: 'Make text readonly', nameAr: 'قراءة فقط', allow: ['ViewChannel', 'ReadMessageHistory'], deny: ['SendMessages'], triggersAr: ['قراءة فقط', 'يشوفون وما يكتبون'], category: 'channel_management' }),
  channelPermissionSkill({ id: 'text_make_readwrite', name: 'Make text read-write', nameAr: 'قراءة وكتابة', allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'], triggersAr: ['قراءة وكتابة', 'يشوفون ويكتبون'], category: 'channel_management' }),

  toolSkill({ id: 'role_give_member', name: 'Give role to member', nameAr: 'إعطاء رتبة', category: 'role_management', description: 'Give a role to a member.', triggers: ['give role'], triggersAr: ['اعطه رتبة', 'حطه رتبة', 'زوده رتبة'], requiredPermissions: [PermissionFlagsBits.ManageRoles], toolName: 'manage_roles', mapArgs: async (args, params) => ({ action: 'assign', roleData: { roleId: (await resolveRole(params)).id }, targetMemberId: (await resolveMember(params)).id }) }),
  toolSkill({ id: 'role_remove_member', name: 'Remove role from member', nameAr: 'سحب رتبة', category: 'role_management', description: 'Remove a role from a member.', triggers: ['remove role'], triggersAr: ['شيل منه رتبة', 'اسحب رتبته'], requiredPermissions: [PermissionFlagsBits.ManageRoles], toolName: 'manage_roles', mapArgs: async (args, params) => ({ action: 'remove', roleData: { roleId: (await resolveRole(params)).id }, targetMemberId: (await resolveMember(params)).id }) }),
  skill({ id: 'role_give_multiple', name: 'Give multiple roles', nameAr: 'إعطاء عدة رتب', category: 'role_management', description: 'Give multiple roles to one member.', triggers: ['give multiple roles'], triggersAr: ['اعطه الرتب', 'حطه رتب'], requiredPermissions: [PermissionFlagsBits.ManageRoles], execute: async (params) => { const m = await resolveMember(params); if (m.error || !m.id) return fail(m.error ?? 'حدد العضو.'); const roleIds = listValue(params.args.roleIds ?? params.args.roles); let n = 0; for (const roleId of roleIds) { await SkillRegistry.executeToolAdapter('manage_roles', { action: 'assign', roleData: { roleId }, targetMemberId: m.id }, params); n++; } return ok(`تمت محاولة إعطاء ${n} رتبة لـ ${m.member?.displayName ?? m.id}.`); } }),
  skill({ id: 'role_remove_multiple', name: 'Remove multiple roles', nameAr: 'سحب عدة رتب', category: 'role_management', description: 'Remove multiple roles from one member.', triggers: ['remove multiple roles'], triggersAr: ['اسحب الرتب', 'شيل رتب'], requiredPermissions: [PermissionFlagsBits.ManageRoles], execute: async (params) => { const m = await resolveMember(params); if (m.error || !m.id) return fail(m.error ?? 'حدد العضو.'); const roleIds = listValue(params.args.roleIds ?? params.args.roles); let n = 0; for (const roleId of roleIds) { await SkillRegistry.executeToolAdapter('manage_roles', { action: 'remove', roleData: { roleId }, targetMemberId: m.id }, params); n++; } return ok(`تمت محاولة سحب ${n} رتبة من ${m.member?.displayName ?? m.id}.`); } }),
  skill({ id: 'role_replace', name: 'Replace role', nameAr: 'استبدال رتبة', category: 'role_management', description: 'Replace one role with another.', triggers: ['replace role'], triggersAr: ['استبدل رتبته', 'بدل الرتبة'], requiredPermissions: [PermissionFlagsBits.ManageRoles], execute: async (params) => { const m = await resolveMember(params); const oldRole = await resolveRole(params, ['oldRoleId', 'fromRoleId', 'oldRole']); const newRole = await resolveRole(params, ['newRoleId', 'toRoleId', 'newRole']); if (m.error || !m.id) return fail(m.error ?? 'حدد العضو.'); if (oldRole.error || !oldRole.id) return fail(oldRole.error ?? 'حدد الرتبة القديمة.'); if (newRole.error || !newRole.id) return fail(newRole.error ?? 'حدد الرتبة الجديدة.'); await SkillRegistry.executeToolAdapter('manage_roles', { action: 'remove', roleData: { roleId: oldRole.id }, targetMemberId: m.id }, params); await SkillRegistry.executeToolAdapter('manage_roles', { action: 'assign', roleData: { roleId: newRole.id }, targetMemberId: m.id }, params); return ok(`تم استبدال الرتبة لـ ${m.member?.displayName ?? m.id}.`); } }),
  toolSkill({ id: 'role_create', name: 'Create role', nameAr: 'إنشاء رتبة', category: 'role_management', description: 'Create a role.', triggers: ['create role'], triggersAr: ['انشئ رتبة', 'سو رول'], requiredPermissions: [PermissionFlagsBits.ManageRoles], toolName: 'manage_roles', mapArgs: (args) => ({ action: 'create', roleData: { name: args.name ?? args.roleName ?? 'رتبة جديدة' } }) }),
  toolSkill({ id: 'role_create_with_color', name: 'Create role with color', nameAr: 'إنشاء رتبة بلون', category: 'role_management', description: 'Create a role with color.', triggers: ['create role color'], triggersAr: ['انشئ رتبة لونها', 'رول بلون'], requiredPermissions: [PermissionFlagsBits.ManageRoles], toolName: 'manage_roles', mapArgs: (args) => ({ action: 'create', roleData: { name: args.name ?? args.roleName ?? 'رتبة جديدة', color: args.color } }) }),
  toolSkill({ id: 'role_create_with_permissions', name: 'Create role with permissions', nameAr: 'إنشاء رتبة بصلاحيات', category: 'role_management', description: 'Create a role with permissions.', triggers: ['create role permissions'], triggersAr: ['انشئ رتبة بصلاحيات', 'رول معه صلاحيات'], requiredPermissions: [PermissionFlagsBits.ManageRoles], toolName: 'manage_roles', mapArgs: (args) => ({ action: 'create', roleData: { name: args.name ?? args.roleName ?? 'رتبة جديدة', permissions: listValue(args.permissions) } }) }),
  toolSkill({ id: 'role_delete', name: 'Delete role', nameAr: 'حذف رتبة', category: 'role_management', description: 'Delete a role.', triggers: ['delete role'], triggersAr: ['احذف رتبة', 'امسح رول'], requiredPermissions: [PermissionFlagsBits.ManageRoles], toolName: 'manage_roles', mapArgs: async (_args, params) => ({ action: 'delete', roleData: { roleId: (await resolveRole(params)).id } }) }),
  toolSkill({ id: 'role_rename', name: 'Rename role', nameAr: 'تغيير اسم رتبة', category: 'role_management', description: 'Rename a role.', triggers: ['rename role'], triggersAr: ['غير اسم الرتبة'], requiredPermissions: [PermissionFlagsBits.ManageRoles], toolName: 'manage_roles', mapArgs: async (args, params) => ({ action: 'edit', roleData: { roleId: (await resolveRole(params)).id, name: args.newName ?? args.name } }) }),
  toolSkill({ id: 'role_change_color', name: 'Change role color', nameAr: 'تغيير لون رتبة', category: 'role_management', description: 'Change role color.', triggers: ['role color'], triggersAr: ['غير لون الرتبة'], requiredPermissions: [PermissionFlagsBits.ManageRoles], toolName: 'manage_roles', mapArgs: async (args, params) => ({ action: 'edit', roleData: { roleId: (await resolveRole(params)).id, color: args.color } }) }),
  toolSkill({ id: 'role_set_hoist', name: 'Set role hoist', nameAr: 'إظهار الرتبة منفصلة', category: 'role_management', description: 'Set role hoist.', triggers: ['role hoist'], triggersAr: ['اظهر الرتبة منفصلة'], requiredPermissions: [PermissionFlagsBits.ManageRoles], toolName: 'manage_roles', mapArgs: async (args, params) => ({ action: 'edit', roleData: { roleId: (await resolveRole(params)).id, hoist: args.enabled ?? true } }) }),
  toolSkill({ id: 'role_set_mentionable', name: 'Set role mentionable', nameAr: 'منشن الرتبة', category: 'role_management', description: 'Set role mentionable.', triggers: ['role mentionable'], triggersAr: ['خل الرتبة تتمنشن'], requiredPermissions: [PermissionFlagsBits.ManageRoles], toolName: 'manage_roles', mapArgs: async (args, params) => ({ action: 'edit', roleData: { roleId: (await resolveRole(params)).id, mentionable: args.enabled ?? true } }) }),
  toolSkill({ id: 'role_move_position', name: 'Move role position', nameAr: 'تحريك رتبة', category: 'role_management', description: 'Move role position.', triggers: ['role position'], triggersAr: ['حرك الرتبة', 'رتب موضع الرتبة'], requiredPermissions: [PermissionFlagsBits.ManageRoles], toolName: 'role_operations', mapArgs: async (args, params) => ({ action: 'role_set_position', roleId: (await resolveRole(params)).id, position: Number(args.position), reason: reason(args) }) }),
  skill({ id: 'role_add_permission', name: 'Add role permission', nameAr: 'إضافة صلاحية لرتبة', category: 'role_management', description: 'Add a permission to a role.', triggers: ['add role permission'], triggersAr: ['اضف صلاحية للرتبة'], requiredPermissions: [PermissionFlagsBits.ManageRoles], execute: (params) => setRolePermission(params, 'add') }),
  skill({ id: 'role_remove_permission', name: 'Remove role permission', nameAr: 'سحب صلاحية من رتبة', category: 'role_management', description: 'Remove a permission from a role.', triggers: ['remove role permission'], triggersAr: ['اسحب صلاحية من الرتبة'], requiredPermissions: [PermissionFlagsBits.ManageRoles], execute: (params) => setRolePermission(params, 'remove') }),
  skill({ id: 'role_give_all_members', name: 'Give role to all members', nameAr: 'إعطاء رتبة للجميع', category: 'role_management', description: 'Give a role to all cached/fetched members.', triggers: ['give role all'], triggersAr: ['اعط الرتبة للجميع'], requiredPermissions: [PermissionFlagsBits.ManageRoles], execute: async (params) => { const role = await resolveRole(params); if (role.error || !role.role) return fail(role.error ?? 'حدد الرتبة.'); const members = await params.guild.members.fetch().catch(() => params.guild.members.cache); let n = 0; for (const member of members.values()) { if (!member.user.bot) { await member.roles.add(role.role, reason(params.args)).catch(() => null); n++; } } return ok(`تمت محاولة إعطاء رتبة ${role.role.name} لـ ${n} عضو.`); } }),
  skill({ id: 'role_remove_all_members', name: 'Remove role from all members', nameAr: 'سحب رتبة من الجميع', category: 'role_management', description: 'Remove a role from all members.', triggers: ['remove role all'], triggersAr: ['اسحب الرتبة من الجميع'], requiredPermissions: [PermissionFlagsBits.ManageRoles], execute: async (params) => { const role = await resolveRole(params); if (role.error || !role.role) return fail(role.error ?? 'حدد الرتبة.'); let n = 0; for (const member of role.role.members.values()) { await member.roles.remove(role.role, reason(params.args)).catch(() => null); n++; } return ok(`تمت محاولة سحب رتبة ${role.role.name} من ${n} عضو.`); } }),
  skill({ id: 'role_list_members', name: 'List role members', nameAr: 'عرض أعضاء رتبة', category: 'role_management', description: 'List members in a role.', triggers: ['role members'], triggersAr: ['مين معه الرتبة', 'اعرض اعضاء الرتبة'], requiredPermissions: [PermissionFlagsBits.ViewChannel], execute: listMembersWithRole }),
  skill({ id: 'role_info', name: 'Role info', nameAr: 'معلومات رتبة', category: 'role_management', description: 'Show role info.', triggers: ['role info'], triggersAr: ['معلومات الرتبة'], requiredPermissions: [PermissionFlagsBits.ViewChannel], execute: roleInfo }),

  ...[
    ['perm_allow_role_view', 'ViewChannel', 'allow', 'role', 'اسمح للرتبة تشوف'], ['perm_deny_role_view', 'ViewChannel', 'deny', 'role', 'امنع الرتبة تشوف'],
    ['perm_allow_role_send', 'SendMessages', 'allow', 'role', 'اسمح للرتبة تكتب'], ['perm_deny_role_send', 'SendMessages', 'deny', 'role', 'امنع الرتبة تكتب'],
    ['perm_allow_role_connect', 'Connect', 'allow', 'role', 'اسمح للرتبة تدخل'], ['perm_deny_role_connect', 'Connect', 'deny', 'role', 'امنع الرتبة تدخل'],
    ['perm_allow_role_speak', 'Speak', 'allow', 'role', 'اسمح للرتبة تتكلم'], ['perm_deny_role_speak', 'Speak', 'deny', 'role', 'امنع الرتبة تتكلم'],
    ['perm_allow_role_stream', 'Stream', 'allow', 'role', 'اسمح للرتبة سكرين'], ['perm_deny_role_stream', 'Stream', 'deny', 'role', 'امنع السكرين شير'],
    ['perm_allow_role_manage_channel', 'ManageChannels', 'allow', 'role', 'اسمح ادارة القناة'], ['perm_deny_role_manage_channel', 'ManageChannels', 'deny', 'role', 'امنع ادارة القناة'],
    ['perm_allow_role_mention_everyone', 'MentionEveryone', 'allow', 'role', 'اسمح منشن everyone'], ['perm_deny_role_mention_everyone', 'MentionEveryone', 'deny', 'role', 'امنع منشن everyone'],
    ['perm_allow_member_view', 'ViewChannel', 'allow', 'member', 'اسمح للعضو يشوف'], ['perm_deny_member_view', 'ViewChannel', 'deny', 'member', 'امنع العضو يشوف'],
  ].map(([id, perm, mode, targetType, trigger]) => permissionSkill({ id: String(id), name: String(id), nameAr: String(trigger), permission: String(perm), mode: mode as 'allow' | 'deny', targetType: targetType as 'role' | 'member', triggersAr: [String(trigger)] })),
  skill({ id: 'perm_reset_channel_overwrites', name: 'Reset channel overwrites', nameAr: 'إعادة ضبط صلاحيات قناة', category: 'permissions', description: 'Reset channel permission overwrites.', triggers: ['reset permissions'], triggersAr: ['صفر صلاحيات الروم', 'رجع صلاحيات القناة افتراضي'], requiredPermissions: [PermissionFlagsBits.ManageRoles], execute: resetChannelOverwrites }),
  skill({ id: 'perm_copy_channel_perms', name: 'Copy channel permissions', nameAr: 'نسخ صلاحيات قناة', category: 'permissions', description: 'Copy channel overwrites.', triggers: ['copy channel permissions'], triggersAr: ['انسخ صلاحيات الروم', 'طبق برمشن روم على روم'], requiredPermissions: [PermissionFlagsBits.ManageRoles], execute: copyChannelPerms }),
  skill({ id: 'perm_audit_channel', name: 'Audit channel permissions', nameAr: 'فحص صلاحيات قناة', category: 'permissions', description: 'Audit channel overwrites.', triggers: ['audit channel permissions'], triggersAr: ['افحص صلاحيات الروم', 'ورني برمشن القناة'], requiredPermissions: [PermissionFlagsBits.ViewAuditLog], execute: auditChannelPermissions }),
  toolSkill({ id: 'perm_remove_everyone_mention_all_channels', name: 'Remove everyone mention everywhere', nameAr: 'سحب منشن everyone من كل القنوات', category: 'permissions', description: 'Sweep MentionEveryone from everyone/roles/members.', triggers: ['remove everyone mention all'], triggersAr: ['اسحب منشن everyone من الجميع', 'شيل منشن هير من كل الرتب'], requiredPermissions: [PermissionFlagsBits.ManageRoles], toolName: 'sweep_permission_overwrites', mapArgs: (args) => ({ categoryId: args.categoryId, channelIds: args.channelIds, permissions: ['MentionEveryone'], includeEveryone: true, includeRoles: true, includeMembers: true }) }),

  toolSkill({ id: 'server_rename', name: 'Rename server', nameAr: 'تغيير اسم السيرفر', category: 'utility', description: 'Rename guild.', triggers: ['server rename'], triggersAr: ['غير اسم السيرفر'], requiredPermissions: [PermissionFlagsBits.ManageGuild], toolName: 'guild_operations', mapArgs: (args) => ({ action: 'guild_set_name', name: args.name ?? args.newName, reason: reason(args) }) }),
  toolSkill({ id: 'server_change_icon', name: 'Change server icon', nameAr: 'تغيير أيقونة السيرفر', category: 'utility', description: 'Change guild icon.', triggers: ['server icon'], triggersAr: ['غير ايقونة السيرفر'], requiredPermissions: [PermissionFlagsBits.ManageGuild], toolName: 'guild_operations', mapArgs: (args) => ({ action: 'guild_set_icon', url: args.url ?? args.imageUrl, reason: reason(args) }) }),
  ...[
    ['server_set_system_channel', 'guild_set_system_channel', 'حدد قناة النظام'], ['server_set_rules_channel', 'guild_set_rules_channel', 'حدد قناة القوانين'], ['server_set_afk_channel', 'guild_set_afk_channel', 'حدد روم AFK'],
  ].map(([id, action, ar]) => toolSkill({ id: String(id), name: String(ar), nameAr: String(ar), category: 'utility', description: String(ar), triggers: [String(id)], triggersAr: [String(ar)], requiredPermissions: [PermissionFlagsBits.ManageGuild], toolName: 'guild_operations', mapArgs: async (args, params) => ({ action, channelId: (await resolveChannel(params)).id, reason: reason(args) }) })),
  skill({ id: 'server_set_afk_timeout', name: 'Set AFK timeout', nameAr: 'تحديد مدة AFK', category: 'utility', description: 'Set AFK timeout seconds.', triggers: ['afk timeout'], triggersAr: ['مدة AFK', 'وقت AFK'], requiredPermissions: [PermissionFlagsBits.ManageGuild], execute: async (params) => { const seconds = Math.round((parseDurationMs(params.args, 300_000) ?? 300_000) / 1000); await params.guild.setAFKTimeout(seconds as any, reason(params.args)); return ok(`تم تحديد مدة AFK إلى ${seconds} ثانية.`); } }),
  toolSkill({ id: 'server_get_info', name: 'Server info', nameAr: 'معلومات السيرفر', category: 'analytics', description: 'Get server info.', triggers: ['server info'], triggersAr: ['معلومات السيرفر'], requiredPermissions: [PermissionFlagsBits.ViewChannel], toolName: 'get_server_info', mapArgs: () => ({}) }),
  skill({ id: 'server_get_member_count', name: 'Server member count', nameAr: 'عدد الأعضاء', category: 'analytics', description: 'Get member count.', triggers: ['member count'], triggersAr: ['كم عدد الاعضاء'], requiredPermissions: [PermissionFlagsBits.ViewChannel], execute: async (params) => ok(`عدد الأعضاء في السيرفر: ${params.guild.memberCount}.`, { memberCount: params.guild.memberCount }) }),
  toolSkill({ id: 'server_get_boost_info', name: 'Server boost info', nameAr: 'معلومات البوست', category: 'analytics', description: 'Get boost info.', triggers: ['boost info'], triggersAr: ['معلومات البوست'], requiredPermissions: [PermissionFlagsBits.ViewChannel], toolName: 'analytics_operations', mapArgs: () => ({ action: 'stats_boosts' }) }),
  skill({ id: 'server_list_roles', name: 'List server roles', nameAr: 'عرض الرتب', category: 'analytics', description: 'List roles.', triggers: ['list roles'], triggersAr: ['اعرض الرتب'], requiredPermissions: [PermissionFlagsBits.ViewChannel], execute: async (params) => ok(params.guild.roles.cache.filter((r) => r.id !== params.guild.id).map((r) => `• ${r.name} (${r.id})`).join('\n') || 'ما فيه رتب.') }),
  skill({ id: 'server_list_channels', name: 'List server channels', nameAr: 'عرض القنوات', category: 'analytics', description: 'List channels.', triggers: ['list channels'], triggersAr: ['اعرض الرومات'], requiredPermissions: [PermissionFlagsBits.ViewChannel], execute: async (params) => ok(params.guild.channels.cache.map((c: any) => `• ${c.name} (${c.id})`).join('\n') || 'ما فيه قنوات.') }),
  toolSkill({ id: 'server_list_bans', name: 'List bans', nameAr: 'عرض المحظورين', category: 'analytics', description: 'List bans.', triggers: ['list bans'], triggersAr: ['عرض المحظورين'], requiredPermissions: [PermissionFlagsBits.BanMembers], toolName: 'guild_operations', mapArgs: (args) => ({ action: 'guild_list_bans', count: args.count ?? 100 }) }),
  toolSkill({ id: 'server_list_invites', name: 'List invites', nameAr: 'عرض الدعوات', category: 'analytics', description: 'List invites.', triggers: ['list invites'], triggersAr: ['عرض الدعوات'], requiredPermissions: [PermissionFlagsBits.ManageGuild], toolName: 'guild_operations', mapArgs: () => ({ action: 'guild_list_invites' }) }),

  skill({ id: 'member_info', name: 'Member info', nameAr: 'معلومات عضو', category: 'utility', description: 'Get member info.', triggers: ['member info'], triggersAr: ['معلومات عضو'], requiredPermissions: [PermissionFlagsBits.ViewChannel], execute: (params) => memberInfoLine(params, 'info') }),
  skill({ id: 'member_find_by_name', name: 'Find member by name', nameAr: 'بحث عن عضو', category: 'utility', description: 'Find member by name.', triggers: ['find member'], triggersAr: ['ابحث عن عضو'], requiredPermissions: [PermissionFlagsBits.ViewChannel], execute: async (params) => { const m = await resolveMember(params); return m.error ? fail(m.error) : ok(`لقيت العضو: ${m.member!.displayName} (${m.id}).`, { id: m.id }); } }),
  skill({ id: 'member_list_roles', name: 'Member roles', nameAr: 'رتب عضو', category: 'utility', description: 'List member roles.', triggers: ['member roles'], triggersAr: ['رتب العضو'], requiredPermissions: [PermissionFlagsBits.ViewChannel], execute: (params) => memberInfoLine(params, 'roles') }),
  skill({ id: 'member_join_date', name: 'Member join date', nameAr: 'تاريخ دخول عضو', category: 'utility', description: 'Member join date.', triggers: ['member joined'], triggersAr: ['متى دخل العضو'], requiredPermissions: [PermissionFlagsBits.ViewChannel], execute: (params) => memberInfoLine(params, 'join') }),
  skill({ id: 'member_account_age', name: 'Member account age', nameAr: 'عمر حساب عضو', category: 'utility', description: 'Discord account age.', triggers: ['account age'], triggersAr: ['عمر حسابه'], requiredPermissions: [PermissionFlagsBits.ViewChannel], execute: (params) => memberInfoLine(params, 'age') }),
  memberActionSkill({ id: 'member_set_nickname', name: 'Set member nickname', nameAr: 'تغيير لقب عضو', action: 'nickname', category: 'utility', requiredPermissions: [PermissionFlagsBits.ManageNicknames], triggers: ['set nickname'], triggersAr: ['غير لقبه'], data: (params) => ({ nickname: params.args.nickname ?? params.args.name ?? params.args.newName, reason: reason(params.args) }) }),
  memberActionSkill({ id: 'member_remove_nickname', name: 'Remove member nickname', nameAr: 'إزالة لقب عضو', action: 'nickname', category: 'utility', requiredPermissions: [PermissionFlagsBits.ManageNicknames], triggers: ['remove nickname'], triggersAr: ['شيل لقبه'], data: (params) => ({ nickname: null, reason: reason(params.args) }) }),
  toolSkill({ id: 'member_change_own_nickname', name: 'Change bot nickname', nameAr: 'تغيير لقب البوت', category: 'bot_management', description: 'Change bot nickname.', triggers: ['bot nickname'], triggersAr: ['غير لقبك', 'غير اسمك بالسيرفر'], requiredPermissions: [PermissionFlagsBits.ManageNicknames], toolName: 'edit_bot_profile', mapArgs: (args) => ({ nickname: args.nickname ?? args.name ?? args.newName }) }),

  skill({ id: 'create_text_channel', name: 'Create text channel', nameAr: 'إنشاء شات', category: 'channel_management', description: 'Create text channel.', triggers: ['create text'], triggersAr: ['سو شات', 'انشئ قناة نصية'], requiredPermissions: [PermissionFlagsBits.ManageChannels], execute: (params) => createChannel(params, 'text') }),
  skill({ id: 'create_voice_channel', name: 'Create voice channel', nameAr: 'إنشاء روم صوتي', category: 'channel_management', description: 'Create voice channel.', triggers: ['create voice'], triggersAr: ['سو فويس', 'انشئ روم صوتي'], requiredPermissions: [PermissionFlagsBits.ManageChannels], execute: (params) => createChannel(params, 'voice') }),
  skill({ id: 'create_category', name: 'Create category', nameAr: 'إنشاء كاتقوري', category: 'channel_management', description: 'Create category.', triggers: ['create category'], triggersAr: ['سو كاتقوري', 'انشئ فئة'], requiredPermissions: [PermissionFlagsBits.ManageChannels], execute: (params) => createChannel(params, 'category') }),
  skill({ id: 'create_forum_channel', name: 'Create forum channel', nameAr: 'إنشاء فورم', category: 'channel_management', description: 'Create forum channel.', triggers: ['create forum'], triggersAr: ['سو فورم', 'انشئ منتدى'], requiredPermissions: [PermissionFlagsBits.ManageChannels], execute: async (params) => { const ch = await params.guild.channels.create({ name: params.args.name ?? 'forum', type: ChannelType.GuildForum, reason: reason(params.args) }); return ok(`تم إنشاء فورم ${ch.name}.`, { channelId: ch.id }); } }),
  skill({ id: 'create_announcement_channel', name: 'Create announcement channel', nameAr: 'إنشاء قناة إعلانات', category: 'channel_management', description: 'Create announcement channel.', triggers: ['create announcement'], triggersAr: ['سو قناة اعلانات'], requiredPermissions: [PermissionFlagsBits.ManageChannels], execute: async (params) => { const ch = await params.guild.channels.create({ name: params.args.name ?? 'announcements', type: ChannelType.GuildAnnouncement, reason: reason(params.args) }); return ok(`تم إنشاء قناة إعلانات ${ch.name}.`, { channelId: ch.id }); } }),
  skill({ id: 'create_private_text', name: 'Create private text', nameAr: 'إنشاء شات خاص', category: 'channel_management', description: 'Create private text channel.', triggers: ['private text'], triggersAr: ['سو شات خاص'], requiredPermissions: [PermissionFlagsBits.ManageChannels], execute: (params) => createChannel(params, 'text', true) }),
  skill({ id: 'create_private_voice', name: 'Create private voice', nameAr: 'إنشاء فويس خاص', category: 'channel_management', description: 'Create private voice channel.', triggers: ['private voice'], triggersAr: ['سو فويس خاص'], requiredPermissions: [PermissionFlagsBits.ManageChannels], execute: (params) => createChannel(params, 'voice', true) }),
  skill({ id: 'create_channel_in_category', name: 'Create channel in category', nameAr: 'إنشاء قناة داخل كاتقوري', category: 'channel_management', description: 'Create channel in category.', triggers: ['create in category'], triggersAr: ['سو روم داخل كاتقوري'], requiredPermissions: [PermissionFlagsBits.ManageChannels], execute: (params) => createChannel(params, params.args.type === 'voice' ? 'voice' : 'text') }),
  toolSkill({ id: 'delete_channel', name: 'Delete channel', nameAr: 'حذف قناة', category: 'channel_management', description: 'Delete channel.', triggers: ['delete channel'], triggersAr: ['احذف الروم', 'امسح القناة'], requiredPermissions: [PermissionFlagsBits.ManageChannels], toolName: 'delete_channels', mapArgs: async (_args, params) => ({ channelIds: [(await resolveChannel(params)).id] }) }),
  toolSkill({ id: 'delete_category_and_children', name: 'Delete category and children', nameAr: 'حذف كاتقوري وروماته', category: 'channel_management', description: 'Delete category and its children.', triggers: ['delete category children'], triggersAr: ['احذف الكاتقوري وروماته'], requiredPermissions: [PermissionFlagsBits.ManageChannels], toolName: 'delete_channels', mapArgs: async (_args, params) => { const cat = await resolveChannel(params, ['categoryId', 'category', 'channelId']); const ids = [...params.guild.channels.cache.values()].filter((c) => c.parentId === cat.id).map((c) => c.id); if (cat.id) ids.push(cat.id); return { channelIds: ids }; } }),
  ...[
    ['rename_channel', 'channel_rename', 'غير اسم القناة'], ['move_channel_to_category', 'channel_set_parent', 'انقل القناة لكاتقوري'], ['reorder_channels', 'channel_move', 'رتب القنوات'], ['clone_channel', 'channel_clone', 'انسخ القناة'],
  ].map(([id, action, ar]) => toolSkill({ id: String(id), name: String(ar), nameAr: String(ar), category: 'channel_management', description: String(ar), triggers: [String(id)], triggersAr: [String(ar)], requiredPermissions: [PermissionFlagsBits.ManageChannels], toolName: 'channel_operations', mapArgs: async (args, params) => ({ action, channelId: (await resolveChannel(params)).id, name: args.name ?? args.newName, categoryId: args.categoryId ?? args.parentId, position: args.position, reason: reason(args) }) })),

  ...[
    ['create_invite', 86_400, 0, 'إنشاء دعوة مؤقتة'], ['create_permanent_invite', 0, 0, 'إنشاء دعوة دائمة'], ['create_invite_max_uses', 86_400, undefined, 'دعوة بعدد استخدامات'],
  ].map(([id, maxAge, maxUses, ar]) => toolSkill({ id: String(id), name: String(ar), nameAr: String(ar), category: 'invites', description: String(ar), triggers: [String(id)], triggersAr: [String(ar)], requiredPermissions: [PermissionFlagsBits.CreateInstantInvite], toolName: 'channel_operations', mapArgs: async (args, params) => ({ action: 'channel_create_invite', channelId: (await resolveChannel(params)).id, duration: maxAge === undefined ? args.duration : maxAge, count: maxUses === undefined ? args.maxUses ?? args.count : maxUses, reason: reason(args) }) })),
  skill({ id: 'delete_invite', name: 'Delete invite', nameAr: 'حذف دعوة', category: 'invites', description: 'Delete invite code.', triggers: ['delete invite'], triggersAr: ['احذف الدعوة'], requiredPermissions: [PermissionFlagsBits.ManageGuild], execute: async (params) => { const code = String(params.args.code ?? params.args.inviteCode ?? '').replace(/^https?:\/\/discord\.gg\//, ''); if (!code) return fail('حدد كود الدعوة.'); const invite = await params.guild.invites.fetch(code).catch(() => null); if (!invite) return fail('الدعوة غير موجودة.'); await invite.delete(reason(params.args)); return ok(`تم حذف الدعوة ${code}.`); } }),
  skill({ id: 'delete_all_invites', name: 'Delete all invites', nameAr: 'حذف كل الدعوات', category: 'invites', description: 'Delete all guild invites.', triggers: ['delete all invites'], triggersAr: ['احذف كل الدعوات'], requiredPermissions: [PermissionFlagsBits.ManageGuild], execute: async (params) => { const invites = await params.guild.invites.fetch(); await Promise.all(invites.map((invite) => invite.delete(reason(params.args)).catch(() => null))); return ok(`تم حذف ${invites.size} دعوة.`); } }),

  toolSkill({ id: 'audit_log_recent', name: 'Recent audit log', nameAr: 'آخر سجل التدقيق', category: 'analytics', description: 'Fetch recent audit logs.', triggers: ['audit recent'], triggersAr: ['آخر سجل التدقيق', 'اخر اللوق'], requiredPermissions: [PermissionFlagsBits.ViewAuditLog], toolName: 'analytics_operations', mapArgs: (args) => ({ action: 'audit_recent', count: args.count ?? 10 }) }),
  skill({ id: 'audit_log_by_member', name: 'Audit log by member', nameAr: 'سجل عضو', category: 'analytics', description: 'Fetch audit entries by executor/target.', triggers: ['audit member'], triggersAr: ['سجل اجراءات عضو'], requiredPermissions: [PermissionFlagsBits.ViewAuditLog], execute: async (params) => { const m = await resolveMember(params); if (m.error || !m.id) return fail(m.error ?? 'حدد العضو.'); const logs = await params.guild.fetchAuditLogs({ limit: 100 }); const rows = [...logs.entries.values()].filter((e) => e.executorId === m.id || e.targetId === m.id).slice(0, 10).map((e) => `• ${e.action} بواسطة ${e.executorId} على ${e.targetId ?? '-'}: ${e.reason ?? 'بدون سبب'}`); return ok(rows.length ? rows.join('\n') : 'ما لقيت سجلات حديثة لهذا العضو.'); } }),
  toolSkill({ id: 'audit_log_by_type', name: 'Audit log by type', nameAr: 'سجل حسب النوع', category: 'analytics', description: 'Fetch audit logs by type group.', triggers: ['audit by type'], triggersAr: ['سجل الباند', 'سجل الرتب'], requiredPermissions: [PermissionFlagsBits.ViewAuditLog], toolName: 'analytics_operations', mapArgs: (args) => ({ action: /ban|باند|حظر/i.test(String(args.type ?? args.query ?? '')) ? 'audit_bans' : /role|رتب/i.test(String(args.type ?? args.query ?? '')) ? 'audit_roles' : /channel|روم|قناة/i.test(String(args.type ?? args.query ?? '')) ? 'audit_channels' : 'audit_recent', count: args.count ?? 20 }) }),
  skill({ id: 'audit_channel_permissions', name: 'Audit channel permissions', nameAr: 'تدقيق صلاحيات قناة', category: 'analytics', description: 'Audit channel permissions.', triggers: ['audit channel perms'], triggersAr: ['دقق صلاحيات الروم'], requiredPermissions: [PermissionFlagsBits.ViewAuditLog], execute: auditChannelPermissions }),

  toolSkill({ id: 'send_embed', name: 'Send embed', nameAr: 'إرسال إيمبد', category: 'community', description: 'Send embed.', triggers: ['send embed'], triggersAr: ['ارسل ايمبد'], requiredPermissions: [PermissionFlagsBits.ManageMessages], toolName: 'send_embed', mapArgs: async (args, params) => ({ ...args, channelId: (await resolveChannel(params)).id }) }),
  toolSkill({ id: 'send_announcement', name: 'Send announcement', nameAr: 'إرسال إعلان', category: 'community', description: 'Send announcement.', triggers: ['send announcement'], triggersAr: ['ارسل اعلان'], requiredPermissions: [PermissionFlagsBits.ManageMessages], toolName: 'message_operations', mapArgs: async (args, params) => ({ action: 'message_send', channelId: (await resolveChannel(params)).id, content: args.content ?? args.message ?? args.text }) }),
  ...[
    ['pin_message', 'message_pin', 'ثبت الرسالة'], ['unpin_message', 'message_unpin', 'فك تثبيت الرسالة'], ['list_pinned_messages', 'message_list_pins', 'عرض المثبتات'],
  ].map(([id, action, ar]) => toolSkill({ id: String(id), name: String(ar), nameAr: String(ar), category: 'community', description: String(ar), triggers: [String(id)], triggersAr: [String(ar)], requiredPermissions: [PermissionFlagsBits.ManageMessages], toolName: 'message_operations', mapArgs: async (args, params) => ({ action, channelId: (await resolveChannel(params)).id, messageId: args.messageId, reason: reason(args) }) })),

  toolSkill({ id: 'automod_detect_spam', name: 'AutoMod detect spam', nameAr: 'كشف السبام', category: 'anti_spam', description: 'Create native spam AutoMod rule.', triggers: ['automod spam'], triggersAr: ['فعل كشف السبام'], requiredPermissions: [PermissionFlagsBits.ManageGuild], toolName: 'automod_operations', mapArgs: (args) => ({ action: 'automod_create_spam', name: args.name ?? 'HumanGuard Spam Shield', alertChannelId: args.alertChannelId, enabled: true }) }),
  toolSkill({ id: 'automod_detect_links', name: 'AutoMod detect links', nameAr: 'منع الروابط', category: 'anti_spam', description: 'Create keyword AutoMod for links.', triggers: ['automod links'], triggersAr: ['امنع الروابط تلقائيا'], requiredPermissions: [PermissionFlagsBits.ManageGuild], toolName: 'automod_operations', mapArgs: (args) => ({ action: 'automod_create_keyword', name: args.name ?? 'HumanGuard Link Shield', keyword: args.keyword ?? 'http://*', alertChannelId: args.alertChannelId, enabled: true }) }),
  skill({ id: 'smart_cleanup_server', name: 'Smart cleanup server', nameAr: 'تنظيف السيرفر', category: 'automation', description: 'Find empty stale channels.', triggers: ['smart cleanup'], triggersAr: ['نظف السيرفر', 'احذف الرومات الفاضية'], requiredPermissions: [PermissionFlagsBits.ManageChannels], execute: async (params) => { const empty = params.guild.channels.cache.filter((c: any) => (c.type === ChannelType.GuildVoice && c.members?.size === 0) || (c.type === ChannelType.GuildText && !c.parentId && /^new-|^test/i.test(c.name))).map((c: any) => `${c.name}:${c.id}`); return ok(empty.length ? `الرومات المرشحة للتنظيف:\n${empty.slice(0, 40).join('\n')}` : 'ما لقيت رومات واضحة للتنظيف الآمن.'); } }),
  skill({ id: 'smart_permission_audit', name: 'Smart permission audit', nameAr: 'فحص صلاحيات خطرة', category: 'automation', description: 'Find risky role permissions.', triggers: ['permission audit'], triggersAr: ['افحص الصلاحيات الخطرة'], requiredPermissions: [PermissionFlagsBits.ViewAuditLog], execute: async (params) => { const risky = params.guild.roles.cache.filter((r) => r.permissions.has(PermissionFlagsBits.Administrator) || r.permissions.has(PermissionFlagsBits.ManageRoles) || r.permissions.has(PermissionFlagsBits.ManageGuild)).map((r) => `• ${r.name}: ${r.permissions.toArray().join(', ')}`); return ok(risky.length ? `الرتب ذات الصلاحيات العالية:\n${risky.join('\n')}` : 'ما لقيت رتب بصلاحيات عالية ظاهرة.'); } }),
  skill({ id: 'smart_role_cleanup', name: 'Smart role cleanup', nameAr: 'تنظيف الرتب الفارغة', category: 'automation', description: 'List empty unmanaged roles.', triggers: ['role cleanup'], triggersAr: ['احذف الرتب الفارغة', 'نظف الرتب'], requiredPermissions: [PermissionFlagsBits.ManageRoles], execute: async (params) => { const empty = params.guild.roles.cache.filter((r) => r.id !== params.guild.id && !r.managed && r.members.size === 0).map((r) => `• ${r.name} (${r.id})`); return ok(empty.length ? `الرتب الفارغة المرشحة للمراجعة:\n${empty.slice(0, 50).join('\n')}` : 'ما فيه رتب فارغة واضحة.'); } }),
  skill({ id: 'smart_inactive_member_list', name: 'Inactive member list', nameAr: 'الأعضاء غير النشطين', category: 'analytics', description: 'Approximate inactive member list from cache.', triggers: ['inactive members'], triggersAr: ['اعضاء غير نشطين'], requiredPermissions: [PermissionFlagsBits.ViewChannel], execute: async (params) => { const members = params.guild.members.cache.filter((m) => !m.user.bot).map((m) => `• ${m.displayName} (${m.id})`).slice(0, 50); return ok(`قائمة تقريبية من الكاش للمراجعة اليدوية:\n${members.join('\n') || 'لا توجد بيانات كافية.'}`); } }),
];

const extraSkills: SkillDefinition[] = [
  channelPermissionSkill({ id: 'voice_lock_and_hide', name: 'Lock and hide voice', nameAr: 'قفل وإخفاء فويس', deny: ['ViewChannel', 'Connect'], triggersAr: ['اقفل واخف الفويس'], category: 'voice_management' }),
  channelPermissionSkill({ id: 'voice_allow_everyone_speak', name: 'Allow everyone speak', nameAr: 'السماح بالكلام للفويس', allow: ['Speak'], triggersAr: ['خل الكل يتكلم بالفويس'], category: 'voice_management' }),
  channelPermissionSkill({ id: 'voice_deny_everyone_speak', name: 'Deny everyone speak', nameAr: 'منع الكلام بالفويس', deny: ['Speak'], triggersAr: ['امنع الكل يتكلم بالفويس'], category: 'voice_management' }),
  channelPermissionSkill({ id: 'text_allow_reactions', name: 'Allow reactions', nameAr: 'السماح بالتفاعلات', allow: ['AddReactions'], triggersAr: ['خلهم يحطون رياكشن'], category: 'channel_management' }),
  channelPermissionSkill({ id: 'text_deny_reactions', name: 'Deny reactions', nameAr: 'منع التفاعلات', deny: ['AddReactions'], triggersAr: ['امنع الرياكشن'], category: 'channel_management' }),
  channelPermissionSkill({ id: 'perm_allow_everyone_attach_files', name: 'Allow attachments', nameAr: 'السماح بالمرفقات', allow: ['AttachFiles'], triggersAr: ['اسمح بالمرفقات'], category: 'permissions' }),
  channelPermissionSkill({ id: 'perm_deny_everyone_attach_files', name: 'Deny attachments', nameAr: 'منع المرفقات', deny: ['AttachFiles'], triggersAr: ['امنع المرفقات'], category: 'permissions' }),
  channelPermissionSkill({ id: 'perm_allow_everyone_embed_links', name: 'Allow embed links', nameAr: 'السماح بتضمين الروابط', allow: ['EmbedLinks'], triggersAr: ['اسمح امبد روابط'], category: 'permissions' }),
  channelPermissionSkill({ id: 'perm_deny_everyone_embed_links', name: 'Deny embed links', nameAr: 'منع تضمين الروابط', deny: ['EmbedLinks'], triggersAr: ['امنع امبد روابط'], category: 'permissions' }),
  toolSkill({ id: 'server_list_text_channels', name: 'List text channels', nameAr: 'عرض الشاتات', category: 'analytics', description: 'List text channels only.', triggers: ['list text channels'], triggersAr: ['اعرض الشاتات'], requiredPermissions: [PermissionFlagsBits.ViewChannel], toolName: 'analytics_operations', mapArgs: () => ({ action: 'stats_channels' }) }),
  toolSkill({ id: 'server_list_voice_channels', name: 'List voice channels', nameAr: 'عرض رومات الفويس', category: 'analytics', description: 'List voice stats.', triggers: ['list voice channels'], triggersAr: ['اعرض رومات الفويس'], requiredPermissions: [PermissionFlagsBits.ViewChannel], toolName: 'analytics_operations', mapArgs: () => ({ action: 'stats_voice' }) }),
  skill({ id: 'member_warning_count', name: 'Member warning count', nameAr: 'عدد تحذيرات عضو', category: 'moderation', description: 'Get warning count.', triggers: ['warning count'], triggersAr: ['عدد تحذيراته'], requiredPermissions: [PermissionFlagsBits.ViewChannel], execute: async (params) => { const m = await resolveMember(params); if (m.error || !m.id) return fail(m.error ?? 'حدد العضو.'); const store = await warningStore(); return ok(`عدد تحذيرات ${m.member?.displayName ?? m.id}: ${store.getWarningCount(m.id)}.`); } }),
];

export default [...skills, ...extraSkills];
