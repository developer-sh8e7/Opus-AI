import type { Guild } from 'discord.js';
import { PRODUCT_NAME } from '../branding.js';

export interface PendingApprovalAction {
  id: string;
  guildId: string;
  channelId: string;
  userId: string;
  toolName: string;
  args: Record<string, any>;
  summary: string;
  requiredPhrase: string;
  createdAt: number;
  expiresAt: number;
}

export interface ApprovalRequirement {
  required: boolean;
  requiredPhrase: string;
  summary: string;
  impact: string;
}

const pendingApprovals = new Map<string, PendingApprovalAction>();
const APPROVAL_TTL_MS = 30 * 1000;

function key(guildId: string, channelId: string, userId: string): string {
  return `${guildId}:${channelId}:${userId}`;
}

function normalizeArabic(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('ar')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasDangerousPermissionChange(args: Record<string, any>): boolean {
  const targetId = String(args.targetId ?? '');
  const deny = new Set((Array.isArray(args.deny) ? args.deny : []).map(String));
  const allow = new Set((Array.isArray(args.allow) ? args.allow : []).map(String));
  const dangerousAllow = ['Administrator', 'ManageRoles', 'ManageChannels', 'ManageGuild', 'BanMembers', 'KickMembers', 'ModerateMembers'];
  if ([...allow].some((permission) => dangerousAllow.includes(permission))) return true;
  if ((targetId === '@everyone' || targetId === args.guildId) && deny.has('ViewChannel')) return true;
  return false;
}

export function getApprovalRequirement(toolName: string, args: Record<string, any>): ApprovalRequirement {
  if (args?._approved === true) {
    return { required: false, requiredPhrase: '', summary: '', impact: '' };
  }

  if (toolName === 'manage_members') {
    const action = String(args.action ?? '');
    const labels: Record<string, { requiredPhrase: string; summary: string; impact: string }> = {
      ban: { requiredPhrase: 'تأكيد الحظر', summary: 'حظر عضو من السيرفر', impact: 'العضو بينحظر وما يقدر يرجع إلا بفك الحظر.' },
      kick: { requiredPhrase: 'تأكيد الطرد', summary: 'طرد عضو من السيرفر', impact: 'العضو بينطرد من السيرفر.' },
      timeout: { requiredPhrase: 'تأكيد التايم', summary: 'إعطاء تايم أوت لعضو', impact: 'العضو ما يقدر يشارك حتى تنتهي المدة.' },
      mute_voice: { requiredPhrase: 'تأكيد الميوت', summary: 'تفعيل ميوت صوتي على عضو', impact: 'العضو ما يقدر يتكلم في الفويس حتى يتم فك الميوت.' },
      deafen: { requiredPhrase: 'تأكيد الديفن', summary: 'تفعيل ديفن على عضو', impact: 'العضو ما يسمع الفويس حتى يتم فك الديفن.' },
    };
    if (labels[action]) return { required: true, ...labels[action] };
  }

  if (toolName === 'bulk_delete_messages') {
    const count = Number(args.count ?? 0);
    if (count > 0) {
      return {
        required: true,
        requiredPhrase: 'تأكيد المسح',
        summary: `حذف ${Math.min(count, 100)} رسالة`,
        impact: 'الرسائل المحذوفة لا يمكن استرجاعها من البوت.',
      };
    }
  }

  if (toolName === 'delete_channels') {
    const count = Array.isArray(args.channelIds) ? args.channelIds.length : 0;
    return {
      required: true,
      requiredPhrase: 'تأكيد الحذف',
      summary: `حذف ${count || 'عدة'} روم/قناة`,
      impact: 'الرومات المحذوفة لا يمكن استرجاعها إلا من نسخة احتياطية إن وجدت.',
    };
  }

  if (toolName === 'manage_roles' && ['delete', 'remove'].includes(String(args.action ?? ''))) {
    return {
      required: true,
      requiredPhrase: String(args.action) === 'delete' ? 'تأكيد حذف الرتبة' : 'تأكيد سحب الرتبة',
      summary: String(args.action) === 'delete' ? 'حذف رتبة' : 'سحب رتبة من عضو',
      impact: 'تغيير الرتب قد يؤثر على وصول الأعضاء وصلاحياتهم.',
    };
  }

  if ((toolName === 'edit_permissions' || toolName === 'bulk_permission_update') && hasDangerousPermissionChange(args)) {
    return {
      required: true,
      requiredPhrase: 'تأكيد الصلاحيات',
      summary: 'تعديل صلاحيات عالي التأثير',
      impact: 'قد يخفي رومات أو يمنح صلاحيات إدارية خطيرة إذا تم تطبيقه بالخطأ.',
    };
  }

  return { required: false, requiredPhrase: '', summary: '', impact: '' };
}

async function describeTarget(guild: Guild, toolName: string, args: Record<string, any>): Promise<string> {
  if (toolName === 'manage_members' && args.memberId) {
    const member = guild.members.cache.get(String(args.memberId)) || await guild.members.fetch(String(args.memberId)).catch(() => null);
    return member ? `${member.displayName} (${member.user.tag})` : String(args.memberId);
  }
  if (toolName === 'delete_channels' && Array.isArray(args.channelIds)) {
    const names = args.channelIds.map((id: string) => guild.channels.cache.get(id)?.name ?? id);
    return names.slice(0, 12).join('، ') + (names.length > 12 ? `، و${names.length - 12} أخرى` : '');
  }
  if (toolName === 'bulk_delete_messages' && args.channelId) {
    return guild.channels.cache.get(String(args.channelId))?.name ?? String(args.channelId);
  }
  if (toolName === 'manage_roles') {
    const roleId = args.roleData?.roleId;
    return roleId ? guild.roles.cache.get(String(roleId))?.name ?? String(roleId) : args.roleData?.name ?? 'رتبة غير محددة';
  }
  if (toolName === 'edit_permissions' || toolName === 'bulk_permission_update') {
    const channel = args.channelId ? guild.channels.cache.get(String(args.channelId))?.name : undefined;
    const target = args.targetId === guild.id || args.targetId === '@everyone'
      ? '@everyone'
      : guild.roles.cache.get(String(args.targetId))?.name ?? String(args.targetId ?? 'هدف غير محدد');
    return [channel, target].filter(Boolean).join(' / ');
  }
  return 'الهدف المحدد في الطلب';
}

export async function createApprovalGate(
  toolName: string,
  args: Record<string, any>,
  guild: Guild,
  channelId: string,
  userId: string
): Promise<{ allowed: true } | { allowed: false; message: string; pending: PendingApprovalAction }> {
  cleanupApprovals();
  const argsWithGuild = { ...args, guildId: guild.id };
  const requirement = getApprovalRequirement(toolName, argsWithGuild);
  if (!requirement.required) return { allowed: true };

  const now = Date.now();
  const pending: PendingApprovalAction = {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    guildId: guild.id,
    channelId,
    userId,
    toolName,
    args: { ...args },
    summary: requirement.summary,
    requiredPhrase: requirement.requiredPhrase,
    createdAt: now,
    expiresAt: now + APPROVAL_TTL_MS,
  };
  const pendingKey = key(guild.id, channelId, userId);
  pendingApprovals.set(pendingKey, pending);
  const timeout = setTimeout(async () => {
    const current = pendingApprovals.get(pendingKey);
    if (!current || current.id !== pending.id) return;
    pendingApprovals.delete(pendingKey);
    const channelManager = (guild as any).channels;
    const channel = channelManager?.cache?.get?.(channelId) ?? await channelManager?.fetch?.(channelId).catch?.(() => null);
    if (channel?.isTextBased?.()) {
      await channel.send(`<@${userId}> تم إلغاء العملية — ما وصل تأكيد خلال 30 ثانية.`).catch(() => null);
    }
  }, APPROVAL_TTL_MS);
  timeout.unref?.();

  const target = await describeTarget(guild, toolName, args);
  const reason = args.data?.reason ?? args.reason ?? 'لم يتم تحديد سبب.';
  const message = [
    `جهزت طلب: ${requirement.summary}.`,
    `الهدف: ${target || 'غير محدد'}.`,
    `الأثر: ${requirement.impact}`,
    `السبب: ${reason}`,
    '',
    `حماية ${PRODUCT_NAME}: ما أنفذ هذا النوع تلقائيًا.`,
    `تأكيد: إذا أنت متأكد رد خلال 30 ثانية بـ: نعم أو تأكيد أو ${requirement.requiredPhrase}`, 
  ].join('\n');

  return { allowed: false, message, pending };
}

export function consumeApprovalIfMatches(params: {
  guildId: string;
  channelId: string;
  userId: string;
  content: string;
}): PendingApprovalAction | undefined {
  cleanupApprovals();
  const pendingKey = key(params.guildId, params.channelId, params.userId);
  const pending = pendingApprovals.get(pendingKey);
  if (!pending) return undefined;

  const content = normalizeArabic(params.content);
  const phrase = normalizeArabic(pending.requiredPhrase);
  const approved = content === phrase || content === 'نعم' || content === 'ايه' || content === 'اوكي' || content === 'اوك' || content === 'yes' || content === 'y' || content === 'تاكيد' || content === 'تأكيد' || content === 'اكد' || /^ا?ك+ي?د$/.test(content) || content === 'confirm';
  if (!approved) return undefined;

  pendingApprovals.delete(pendingKey);
  return pending;
}

export function getPendingApproval(params: { guildId: string; channelId: string; userId: string }): PendingApprovalAction | undefined {
  cleanupApprovals();
  return pendingApprovals.get(key(params.guildId, params.channelId, params.userId));
}

export function cancelPendingApproval(params: { guildId: string; channelId: string; userId: string }): PendingApprovalAction | undefined {
  cleanupApprovals();
  const pendingKey = key(params.guildId, params.channelId, params.userId);
  const pending = pendingApprovals.get(pendingKey);
  if (pending) pendingApprovals.delete(pendingKey);
  return pending;
}

export function cleanupApprovals(now = Date.now()): number {
  let removed = 0;
  for (const [approvalKey, pending] of pendingApprovals) {
    if (pending.expiresAt <= now) {
      pendingApprovals.delete(approvalKey);
      removed++;
    }
  }
  return removed;
}

export function clearApprovalsForTests(): void {
  pendingApprovals.clear();
}
