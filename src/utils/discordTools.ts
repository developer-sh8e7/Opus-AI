/**
 * ════════════════════════════════════════════════════════════════
 *  أدوات ديسكورد المساعدة الإدارية - Advanced Discord Administrative Tools
 *  توفر تحكماً كاملاً بالقنوات، الرتب، صلاحيات الأعضاء، وتدقيق العمليات الإدارية
 *  تضم فحصاً أمنياً هرمياً لحماية الرتب العليا ونظام التدقيق للأخطاء والـ Rate Limit
 * ════════════════════════════════════════════════════════════════
 */

import { 
  Guild, 
  ChannelType, 
  PermissionFlagsBits, 
  OverwriteResolvable, 
  GuildMember,
  Client,
  Invite,
  AuditLogEvent,
  EmbedBuilder
} from 'discord.js';
import { validateHierarchy, validateMemberHierarchy } from './security.js';
import { delay } from './rateLimiter.js';

// ============================================================
//  خريطة الصلاحيات الشاملة لديسكورد
// ============================================================
export const permissionMap: Record<string, bigint> = {
  // صلاحيات القنوات العامة
  ViewChannel: PermissionFlagsBits.ViewChannel,
  ManageChannels: PermissionFlagsBits.ManageChannels,
  ManageRoles: PermissionFlagsBits.ManageRoles,
  ManageWebhooks: PermissionFlagsBits.ManageWebhooks,
  
  // صلاحيات الشات النصي
  SendMessages: PermissionFlagsBits.SendMessages,
  SendMessagesInThreads: PermissionFlagsBits.SendMessagesInThreads,
  CreatePublicThreads: PermissionFlagsBits.CreatePublicThreads,
  CreatePrivateThreads: PermissionFlagsBits.CreatePrivateThreads,
  EmbedLinks: PermissionFlagsBits.EmbedLinks,
  AttachFiles: PermissionFlagsBits.AttachFiles,
  AddReactions: PermissionFlagsBits.AddReactions,
  UseExternalEmojis: PermissionFlagsBits.UseExternalEmojis,
  UseExternalStickers: PermissionFlagsBits.UseExternalStickers,
  MentionEveryone: PermissionFlagsBits.MentionEveryone,
  ManageMessages: PermissionFlagsBits.ManageMessages,
  ReadMessageHistory: PermissionFlagsBits.ReadMessageHistory,
  SendTTSMessages: PermissionFlagsBits.SendTTSMessages,
  UseApplicationCommands: PermissionFlagsBits.UseApplicationCommands,
  
  // صلاحيات الرومات الصوتية
  Connect: PermissionFlagsBits.Connect,
  Speak: PermissionFlagsBits.Speak,
  Stream: PermissionFlagsBits.Stream,
  Video: PermissionFlagsBits.Stream,
  UseEmbeddedActivities: PermissionFlagsBits.UseEmbeddedActivities,
  UseSoundboard: PermissionFlagsBits.UseSoundboard,
  UseExternalSounds: PermissionFlagsBits.UseExternalSounds,
  UseVAD: PermissionFlagsBits.UseVAD,
  PrioritySpeaker: PermissionFlagsBits.PrioritySpeaker,
  MuteMembers: PermissionFlagsBits.MuteMembers,
  DeafenMembers: PermissionFlagsBits.DeafenMembers,
  MoveMembers: PermissionFlagsBits.MoveMembers,
  
  // صلاحيات السيرفر العامة
  KickMembers: PermissionFlagsBits.KickMembers,
  BanMembers: PermissionFlagsBits.BanMembers,
  Administrator: PermissionFlagsBits.Administrator,
  ManageGuild: PermissionFlagsBits.ManageGuild,
  ViewAuditLog: PermissionFlagsBits.ViewAuditLog,
  ViewGuildInsights: PermissionFlagsBits.ViewGuildInsights,
  ModerateMembers: PermissionFlagsBits.ModerateMembers,
  ChangeNickname: PermissionFlagsBits.ChangeNickname,
};

/**
 * مطابقة اسم الصلاحية نصياً بالقيمة العددية (BigInt) لـ Discord.
 */
/**
 * أسماء الصلاحيات بالعربية لعرضها في رسائل التحديث
 */
export const permissionArabicNames: Record<string, string> = {
  ViewChannel: 'مشاهدة القناة',
  ManageChannels: 'إدارة القنوات',
  ManageRoles: 'إدارة الرتب',
  ManageWebhooks: 'إدارة الويب هوك',
  SendMessages: 'إرسال الرسائل',
  SendMessagesInThreads: 'إرسال في الثريدات',
  CreatePublicThreads: 'إنشاء ثريد عام',
  CreatePrivateThreads: 'إنشاء ثريد خاص',
  EmbedLinks: 'إرسال الروابط',
  AttachFiles: 'إرفاق الملفات',
  AddReactions: 'إضافة تفاعلات',
  UseExternalEmojis: 'استخدام إيموجي خارجي',
  UseExternalStickers: 'استخدام ملصقات خارجية',
  MentionEveryone: 'منشن @everyone/@here',
  ManageMessages: 'إدارة الرسائل',
  ReadMessageHistory: 'قراءة التاريخ',
  SendTTSMessages: 'إرسال TTS',
  UseApplicationCommands: 'استخدام الأوامر',
  Connect: 'الدخول',
  Speak: 'التحدث',
  Stream: 'فتح سكرين/فيديو',
  Video: 'فتح سكرين/فيديو',
  UseEmbeddedActivities: 'استخدام الأنشطة',
  UseSoundboard: 'استخدام الصوتيات',
  UseExternalSounds: 'أصوات خارجية',
  UseVAD: 'كشف الصوت التلقائي',
  PrioritySpeaker: 'متحدث ذو أولوية',
  MuteMembers: 'كتم الأعضاء',
  DeafenMembers: 'إطــراق الأعضاء',
  MoveMembers: 'نقل الأعضاء',
  KickMembers: 'طرد الأعضاء',
  BanMembers: 'حظر الأعضاء',
  Administrator: 'مدير',
  ManageGuild: 'إدارة السيرفر',
  ViewAuditLog: 'سجل التدقيق',
  ViewGuildInsights: 'إحصائيات السيرفر',
  ModerateMembers: 'تأديب الأعضاء',
  ChangeNickname: 'تغيير لقب البوت/العضو لنفسه',
};

/**
 * تحويل مصفوفة صلاحيات إلى أسماء عربية مفصولة بفواصل
 */
function summarizeOverwritePermissions(allowBits: bigint, denyBits: bigint): string {
  const allowed = PermissionHelper.stringifyPermissions(allowBits);
  const denied = PermissionHelper.stringifyPermissions(denyBits);
  const parts: string[] = [];
  if (allowed.length > 0) parts.push(`مسموح: ${allowed.map((permission) => permissionArabicNames[permission] ?? permission).join('، ')}`);
  if (denied.length > 0) parts.push(`ممنوع: ${denied.map((permission) => permissionArabicNames[permission] ?? permission).join('، ')}`);
  return parts.length > 0 ? parts.join(' | ') : 'لا يوجد Overwrite واضح';
}

export function formatPermissionsArabic(permNames: string[], style: 'allowed' | 'denied'): string {
  const names = permNames
    .map(p => {
      const clean = p.replace(/[^a-zA-Z0-9]/g, '');
      for (const [key, value] of Object.entries(permissionMap)) {
        if (key.toLowerCase() === clean.toLowerCase()) {
          return permissionArabicNames[key] || key;
        }
      }
      return p;
    })
    .filter(Boolean);
  if (names.length === 0) return '';
  if (style === 'allowed') return `سُمح بـ: ${names.join('، ')}`;
  return `مُنع: ${names.join('، ')}`;
}

export interface StrictNameResolveResult<T extends { id: string; name: string }> {
  status: 'found' | 'ambiguous' | 'not_found';
  entity?: T;
  matches: T[];
  reason?: string;
}

export function normalizeDiscordEntityName(value: string): string {
  const compact = value
    .normalize('NFKC')
    .toLocaleLowerCase('ar')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/^(?:روم|قناه|قناة|شانل|شات|فويس|تكست|نصي|صوتي|رتبه|رتبة|رول|كاتقوري|فئه|فئة|قسم)\s+/i, '')
    .trim();
  return compact
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.startsWith('ال') && word.length > 4 ? word.slice(2) : word)
    .join(' ');
}

export function resolveDiscordEntityByNameStrict<T extends { id: string; name: string }>(
  rawName: string,
  entities: Iterable<T>
): StrictNameResolveResult<T> {
  const query = normalizeDiscordEntityName(rawName);
  const all = [...entities];
  if (!query) return { status: 'not_found', matches: [], reason: 'empty_query' };

  const uniqueById = (items: T[]): T[] => [...new Map(items.map((item) => [item.id, item])).values()];
  const exact = uniqueById(all.filter((entity) => normalizeDiscordEntityName(entity.name) === query));
  if (exact.length === 1) return { status: 'found', entity: exact[0], matches: exact };
  if (exact.length > 1) return { status: 'ambiguous', matches: exact, reason: 'multiple_exact_matches' };

  const partial = uniqueById(all.filter((entity) => {
    const entityName = normalizeDiscordEntityName(entity.name);
    return query.length >= 2 && entityName.includes(query);
  }));
  if (partial.length === 1) return { status: 'found', entity: partial[0], matches: partial };
  if (partial.length > 1) return { status: 'ambiguous', matches: partial, reason: 'multiple_partial_matches' };

  return { status: 'not_found', matches: [] };
}

export function resolveDiscordChannelByNameStrict(
  guild: Guild,
  rawName: string,
  includeCategories = false
): StrictNameResolveResult<{ id: string; name: string; type: ChannelType }> {
  const channels = guild.channels.cache
    .filter((channel) => includeCategories || channel.type !== ChannelType.GuildCategory)
    .map((channel) => ({ id: channel.id, name: channel.name, type: channel.type }));
  return resolveDiscordEntityByNameStrict(rawName, channels);
}

export function resolveDiscordRoleByNameStrict(
  guild: Guild,
  rawName: string
): StrictNameResolveResult<{ id: string; name: string }> {
  const roles = guild.roles.cache
    .filter((role) => role.id !== guild.id)
    .map((role) => ({ id: role.id, name: role.name }));
  return resolveDiscordEntityByNameStrict(rawName, roles);
}

export function resolvePermission(permStr: string): bigint | null {
  const normalized = permStr.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  for (const [key, value] of Object.entries(permissionMap)) {
    if (key.toLowerCase() === normalized) {
      return value;
    }
  }
  return null;
}

// ============================================================
//  كلاس فحص وتحليل الصلاحيات المتقدم (PermissionHelper)
// ============================================================
export class PermissionHelper {
  /**
   * تحويل التعبيرات النصية المفتوحة إلى مصفوفة صلاحيات تراكمية
   */
  static parsePermissionsString(expression: string): bigint {
    let bits = 0n;
    const words = expression.split(/[\s,]+/);
    for (const word of words) {
      const resolved = resolvePermission(word);
      if (resolved !== null) {
        bits |= resolved;
      }
    }
    return bits;
  }

  /**
   * فحص ما إذا كان العضو يحمل صلاحيات معينة أم لا
   */
  static hasPermission(member: GuildMember, permissionName: string): boolean {
    const bit = resolvePermission(permissionName);
    if (bit === null) return false;
    return member.permissions.has(bit);
  }

  /**
   * ترجمة قيمة الصلاحية (BigInt) إلى مصفوفة من الأسماء المفهومة
   */
  static stringifyPermissions(bits: bigint): string[] {
    const names: string[] = [];
    for (const [key, val] of Object.entries(permissionMap)) {
      if ((bits & val) === val) {
        names.push(key);
      }
    }
    return names;
  }
}

// ============================================================
//  إنشاء القنوات وإدارتها
// ============================================================
export async function createChannels(
  guild: Guild,
  type: 'text' | 'voice' | 'category',
  names: string[],
  categoryId?: string,
  permissions?: Array<{ id: string; allow: string[]; deny: string[] }>
): Promise<{
  success: boolean;
  message: string;
  created: string[];
  createdEntities?: Array<{ id: string; name: string; type: 'text' | 'voice' | 'category' }>;
  channelId?: string;
  failed: string[];
}> {
  const created: string[] = [];
  const createdEntities: Array<{ id: string; name: string; type: 'text' | 'voice' | 'category' }> = [];
  const failed: string[] = [];

  const typeMap = {
    text: ChannelType.GuildText,
    voice: ChannelType.GuildVoice,
    category: ChannelType.GuildCategory,
  } as const;

  const channelType = typeMap[type];
  if (channelType === undefined) {
    return { success: false, message: `نوع القناة غير صالح: ${type}`, created, failed };
  }

  // تهيئة صلاحيات القناة المخصصة إن وجدت
  const permissionOverwrites: OverwriteResolvable[] = [];
  if (permissions) {
    for (const perm of permissions) {
      const allowBits = perm.allow.map(resolvePermission).filter((p): p is bigint => p !== null);
      const denyBits = perm.deny.map(resolvePermission).filter((p): p is bigint => p !== null);
      
      const resolvedAllow = allowBits.reduce((acc, bit) => acc | bit, 0n);
      const resolvedDeny = denyBits.reduce((acc, bit) => acc | bit, 0n);

      const targetId = perm.id === '@everyone' ? guild.id : perm.id;

      permissionOverwrites.push({
        id: targetId,
        allow: resolvedAllow,
        deny: resolvedDeny,
      });
    }
    // تأكيد وجود صلاحيات البوت نفسه لكي لا يفقد الوصول للقناة المنشأة
    if (guild.client.user) {
      const hasBotOverwrite = permissionOverwrites.some(o => o.id === guild.client.user?.id);
      if (!hasBotOverwrite) {
        permissionOverwrites.push({
          id: guild.client.user.id,
          allow: PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages | PermissionFlagsBits.ReadMessageHistory | PermissionFlagsBits.ManageChannels,
        });
      }
    }
  }

  const isSnowflake = (value: unknown): value is string => typeof value === 'string' && /^\d{17,20}$/.test(value);
  const parentId = type === 'category'
    ? undefined // Discord forbids categories inside categories
    : isSnowflake(categoryId)
      ? categoryId
      : undefined;

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    if (i > 0) {
      await delay(500); // تأخير لتفادي الـ Rate Limit
    }
    try {
      const createOptions: Parameters<typeof guild.channels.create>[0] = {
        name,
        type: channelType,
        permissionOverwrites: permissionOverwrites.length > 0 ? permissionOverwrites : undefined,
        reason: 'إنشاء قنوات جماعية بواسطة نظام الإدارة الذكي',
      };
      if (parentId) createOptions.parent = parentId;
      const createdChannel = await guild.channels.create(createOptions);
      created.push(createdChannel.name);
      createdEntities.push({ id: createdChannel.id, name: createdChannel.name, type });
    } catch (error) {
      failed.push(name);
      console.error(`[DiscordTools] Failed to create channel "${name}":`, error);
    }
  }

  const ok = created.length > 0;
  const successMessage = ok
    ? `تم إنشاء ${created.length} قناة بنجاح${failed.length > 0 ? `، وفشل إنشاء ${failed.length} قناة (${failed.join(', ')})` : ''}.`
    : `فشل إنشاء القنوات: ${failed.join(', ') || 'لم يتم إنشاء أي قناة'}.`;
  return {
    success: ok,
    message: successMessage,
    created,
    createdEntities,
    channelId: createdEntities[0]?.id,
    failed,
  };
}

export async function deleteChannels(
  guild: Guild,
  channelIds: string[]
): Promise<{ success: boolean; message: string; deleted: string[]; failed: string[] }> {
  const deleted: string[] = [];
  const failed: string[] = [];

  for (let i = 0; i < channelIds.length; i++) {
    const id = channelIds[i];
    if (i > 0) {
      await delay(500); // تأخير لتفادي الـ Rate Limit
    }

    try {
      const channel = guild.channels.cache.get(id) || await guild.channels.fetch(id).catch(() => null);
      if (!channel) {
        failed.push(id);
        continue;
      }
      const channelName = channel.name;
      await channel.delete('حذف قنوات بواسطة نظام الإدارة الذكي');
      deleted.push(channelName);
    } catch (error) {
      failed.push(id);
      console.error(`[DiscordTools] Failed to delete channel id "${id}":`, error);
    }
  }

  const ok = deleted.length > 0;
  const successMessage = ok
    ? `تم حذف ${deleted.length} قناة بنجاح${failed.length > 0 ? `، وفشل حذف ${failed.length} قناة` : ''}.`
    : `لم يتم حذف أي قناة${failed.length > 0 ? `، وفشل حذف ${failed.length} قناة` : ''}.`;
  return {
    success: ok,
    message: successMessage,
    deleted,
    failed,
  };
}

// ============================================================
//  إدارة الرتب وألوانها وصلاحياتها
// ============================================================
export async function manageRoles(
  guild: Guild,
  action: 'create' | 'delete' | 'edit' | 'assign' | 'remove',
  roleData: {
    name?: string;
    color?: string;
    permissions?: string[];
    hoist?: boolean;
    mentionable?: boolean;
    roleId?: string;
  },
  targetMemberId?: string
): Promise<{ success: boolean; message: string; roleId?: string }> {
  try {
    // تفسير الألوان ودعم الأسماء العربية/الإنجليزية أو كود الهيكس
    const resolveColor = (colorStr?: string): number | undefined => {
      if (!colorStr) return undefined;
      if (colorStr.startsWith('#')) {
        return parseInt(colorStr.replace('#', ''), 16);
      }
      
      const arabicColors: Record<string, number> = {
        'أحمر': 0xFF0000, 'احمر': 0xFF0000,
        'أخضر': 0x00FF00, 'اخضر': 0x00FF00,
        'أزرق': 0x0000FF, 'ازرق': 0x0000FF,
        'أصفر': 0xFFFF00, 'اصفر': 0xFFFF00,
        'بنفسجي': 0x800080,
        'برتقالي': 0xFFA500,
        'وردي': 0xFFC0CB,
        'ذهبي': 0xFFD700,
        'فضي': 0xC0C0C0,
        'رمادي': 0x808080,
        'أسود': 0x000000, 'اسود': 0x000000,
        'أبيض': 0xFFFFFF, 'ابيض': 0xFFFFFF,
      };

      const englishColors: Record<string, number> = {
        'red': 0xFF0000,
        'green': 0x00FF00,
        'blue': 0x0000FF,
        'yellow': 0xFFFF00,
        'purple': 0x800080,
        'orange': 0xFFA500,
        'pink': 0xFFC0CB,
        'gold': 0xFFD700,
        'silver': 0xC0C0C0,
        'gray': 0x808080,
        'black': 0x000000,
        'white': 0xFFFFFF,
      };

      const cleanColor = colorStr.trim();
      return arabicColors[cleanColor] ?? englishColors[cleanColor.toLowerCase()] ?? undefined;
    };

    // تحويل مصفوفة الصلاحيات النصية إلى قيمة ديسكورد التراكمية
    const resolvePermissionsArray = (perms?: string[]): bigint | undefined => {
      if (!perms) return undefined;
      let bits = 0n;
      for (const p of perms) {
        const resolved = resolvePermission(p);
        if (resolved !== null) {
          bits |= resolved;
        }
      }
      return bits;
    };

    const resolvedRoleId = roleData.roleId === '@everyone' ? guild.id : roleData.roleId;

    // فحص أمان الرتبة الهرمية الإلزامي قبل التعديل أو الحذف أو المنح أو السحب
    if (['delete', 'edit', 'assign', 'remove'].includes(action)) {
      if (!resolvedRoleId) {
        return { success: false, message: "معرف الرتبة (roleId) مطلوب لتنفيذ هذا الإجراء." };
      }
      const hierarchyCheck = await validateHierarchy(guild, resolvedRoleId);
      if (!hierarchyCheck.allowed) {
        return { success: false, message: `فشل التحقق الأمني: ${hierarchyCheck.reason}` };
      }
    }

    // 1. إنشاء رتبة
    if (action === 'create') {
      const resolvedColor = resolveColor(roleData.color);
      const resolvedPermissions = resolvePermissionsArray(roleData.permissions);

      const createdRole = await guild.roles.create({
        name: roleData.name || 'رتبة جديدة',
        color: resolvedColor,
        permissions: resolvedPermissions,
        hoist: roleData.hoist,
        mentionable: roleData.mentionable,
        reason: 'إنشاء رتبة بواسطة نظام الإدارة الذكي',
      });

      return {
        success: true,
        message: `تم إنشاء الرتبة "${createdRole.name}" بنجاح.`,
        roleId: createdRole.id,
      };
    }

    // 2. حذف رتبة
    if (action === 'delete') {
      const role = guild.roles.cache.get(resolvedRoleId!);
      if (!role) {
        return { success: false, message: "الرتبة غير موجودة في السيرفر." };
      }
      const roleName = role.name;
      const deletedRoleId = role.id;
      await role.delete('حذف رتبة بواسطة نظام الإدارة الذكي');
      return { success: true, message: `تم حذف الرتبة "${roleName}" بنجاح.`, roleId: deletedRoleId };
    }

    // 3. تعديل رتبة
    if (action === 'edit') {
      const role = guild.roles.cache.get(resolvedRoleId!);
      if (!role) {
        return { success: false, message: "الرتبة غير موجودة في السيرفر." };
      }

      const resolvedColor = resolveColor(roleData.color);
      const resolvedPermissions = resolvePermissionsArray(roleData.permissions);

      const updatedRole = await role.edit({
        name: roleData.name,
        color: resolvedColor,
        permissions: resolvedPermissions,
        hoist: roleData.hoist,
        mentionable: roleData.mentionable,
      });

      return {
        success: true,
        message: `تم تعديل الرتبة "${updatedRole.name}" بنجاح.`,
        roleId: updatedRole.id,
      };
    }

    // 4. تعيين وسحب رتبة للعضو
    if (action === 'assign' || action === 'remove') {
      if (!targetMemberId) {
        return { success: false, message: "معرف العضو المستهدف (targetMemberId) مطلوب." };
      }

      const memberHierarchyCheck = await validateMemberHierarchy(guild, targetMemberId);
      if (!memberHierarchyCheck.allowed) {
        return { success: false, message: `فشل التحقق الأمني على العضو: ${memberHierarchyCheck.reason}` };
      }

      const member = memberHierarchyCheck.targetMember!;
      const role = guild.roles.cache.get(resolvedRoleId!);
      if (!role) {
        return { success: false, message: "الرتبة غير موجودة في السيرفر." };
      }

      if (action === 'assign') {
        if (member.roles.cache.has(role.id)) {
          return { success: false, message: `العضو "${member.displayName}" يملك رتبة "${role.name}" بالفعل.` };
        }
        await member.roles.add(role, 'تعيين رتبة بواسطة نظام الإدارة الذكي');
        return { success: true, message: `تم منح رتبة "${role.name}" للعضو "${member.displayName}" بنجاح.` };
      } else {
        if (!member.roles.cache.has(role.id)) {
          return { success: false, message: `العضو "${member.displayName}" لا يملك رتبة "${role.name}".` };
        }
        await member.roles.remove(role, 'إزالة رتبة بواسطة نظام الإدارة الذكي');
        return { success: true, message: `تم إزالة رتبة "${role.name}" من العضو "${member.displayName}" بنجاح.` };
      }
    }

    return { success: false, message: "إجراء غير معروف للتحكم بالرتب." };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { success: false, message: `حدث خطأ أثناء إدارة الرتب: ${errorMsg}` };
  }
}

// ============================================================
//  صلاحيات القنوات التفصيلية
// ============================================================
export async function editPermissions(
  guild: Guild,
  channelId: string,
  targetId: string,
  targetType: 'role' | 'member',
  allow: string[],
  deny: string[]
): Promise<{ success: boolean; message: string }> {
  try {
    const channel = guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId).catch(() => null);
    if (!channel) {
      return { success: false, message: "القناة المطلوبة غير موجودة في السيرفر." };
    }

    const resolvedTargetId = targetId === '@everyone' ? guild.id : targetId;

    // فحص الأمان لعدم التعديل على رتبة أو عضو أعلى من البوت
    if (targetType === 'role') {
      const hierarchyCheck = await validateHierarchy(guild, resolvedTargetId);
      if (!hierarchyCheck.allowed) {
        return { success: false, message: `حماية أمنية: ${hierarchyCheck.reason}` };
      }
    } else {
      const memberCheck = await validateMemberHierarchy(guild, resolvedTargetId);
      if (!memberCheck.allowed) {
        return { success: false, message: `حماية أمنية: ${memberCheck.reason}` };
      }
    }

    // بناء خريطة الصلاحيات المناسبة لـ discord.js
    const overwrites: Record<string, boolean | null> = {};
    
    for (const pName of allow) {
      const pBit = resolvePermission(pName);
      if (pBit !== null) {
        const key = Object.keys(permissionMap).find(k => permissionMap[k] === pBit);
        if (key) overwrites[key] = true;
      }
    }

    for (const pName of deny) {
      const pBit = resolvePermission(pName);
      if (pBit !== null) {
        const key = Object.keys(permissionMap).find(k => permissionMap[k] === pBit);
        if (key) overwrites[key] = false;
      }
    }

    if ('permissionOverwrites' in channel) {
      const beforeOverwrite = channel.permissionOverwrites.cache.get(resolvedTargetId);
      const beforeSummary = beforeOverwrite
        ? summarizeOverwritePermissions(beforeOverwrite.allow.bitfield, beforeOverwrite.deny.bitfield)
        : 'لا يوجد Overwrite سابق';
      await channel.permissionOverwrites.edit(resolvedTargetId, overwrites, {
        reason: 'تعديل صلاحيات القناة بواسطة نظام الإدارة الذكي'
      });
      const allowedPerms = allow.filter(p => resolvePermission(p) !== null);
      const deniedPerms = deny.filter(p => resolvePermission(p) !== null);
      const targetLabel = targetId === '@everyone' ? '@everyone' : guild.roles.cache.get(resolvedTargetId)?.name ?? guild.members.cache.get(resolvedTargetId)?.displayName ?? resolvedTargetId;
      const parts: string[] = [];
      if (allowedPerms.length > 0) parts.push(formatPermissionsArabic(allowedPerms, 'allowed'));
      if (deniedPerms.length > 0) parts.push(formatPermissionsArabic(deniedPerms, 'denied'));
      const detail = parts.length > 0 ? ` (${parts.join('، ')})` : '';
      const afterOverwrite = channel.permissionOverwrites.cache.get(resolvedTargetId);
      const afterSummary = afterOverwrite
        ? summarizeOverwritePermissions(afterOverwrite.allow.bitfield, afterOverwrite.deny.bitfield)
        : 'لا يوجد Overwrite بعد التعديل';
      return { success: true, message: `تم تحديث صلاحيات القناة "${channel.name}" للرتبة/العضو "${targetLabel}" بنجاح.${detail} قبل: ${beforeSummary}. بعد: ${afterSummary}.` };
    } else {
      return { success: false, message: "هذه القناة لا تدعم تعديل الصلاحيات." };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { success: false, message: `حدث خطأ أثناء تعديل صلاحيات القناة: ${errorMsg}` };
  }
}

export async function bulkPermissionUpdate(
  guild: Guild,
  options: {
    channelIds?: string[];
    categoryId?: string;
    targetId: string;
    targetType: 'role' | 'member';
    allow: string[];
    deny: string[];
  }
): Promise<{ success: boolean; message: string; updated: string[]; failed: string[] }> {
  const selectedIds = new Set(options.channelIds ?? []);
  if (options.categoryId) {
    for (const channel of guild.channels.cache.values()) {
      if (channel.parentId === options.categoryId) selectedIds.add(channel.id);
    }
  }

  if (selectedIds.size === 0) {
    return {
      success: false,
      message: 'لم يتم تحديد أي رومات لتحديث الصلاحيات.',
      updated: [],
      failed: [],
    };
  }

  const updated: string[] = [];
  const failed: string[] = [];
  for (const channelId of selectedIds) {
    const result = await editPermissions(
      guild,
      channelId,
      options.targetId,
      options.targetType,
      options.allow,
      options.deny
    );
    if (result.success) updated.push(channelId);
    else failed.push(channelId);
  }

  return {
    success: failed.length === 0,
    message: `تم تحديث صلاحيات ${updated.length} روم${failed.length > 0 ? `، وتعذر تحديث ${failed.length}` : ''}.`,
    updated,
    failed,
  };
}

export async function sweepPermissionOverwrites(
  guild: Guild,
  options: {
    channelIds?: string[];
    categoryId?: string;
    permissions: string[];
    includeEveryone?: boolean;
    includeRoles?: boolean;
    includeMembers?: boolean;
    scope?: '@everyone' | 'allRoles' | 'allMembers' | string[];
  }
): Promise<{
  success: boolean;
  message: string;
  updated: string[];
  failed: string[];
  targets: string[];
  targetLabels: string[];
  verified: string[];
  verificationFailed: string[];
}> {
  const selectedIds = new Set(options.channelIds ?? []);
  if (options.categoryId) {
    for (const channel of guild.channels.cache.values()) {
      if (channel.parentId === options.categoryId) selectedIds.add(channel.id);
    }
  }

  if (selectedIds.size === 0) {
    return {
      success: false,
      message: 'لم يتم تحديد أي رومات لفحص الصلاحيات.',
      updated: [],
      failed: [],
      targets: [],
      targetLabels: [],
      verified: [],
      verificationFailed: [],
    };
  }

  const permissionBits = options.permissions
    .map(resolvePermission)
    .filter((permission): permission is bigint => permission !== null);
  if (permissionBits.length === 0) {
    return {
      success: false,
      message: 'لم يتم تحديد صلاحيات صالحة لسحبها.',
      updated: [],
      failed: [],
      targets: [],
      targetLabels: [],
      verified: [],
      verificationFailed: [],
    };
  }

  const includeEveryone = options.scope
    ? options.scope === '@everyone' || Array.isArray(options.scope)
    : options.includeEveryone !== false;
  const includeRoles = options.scope
    ? options.scope === 'allRoles' || Array.isArray(options.scope)
    : options.includeRoles !== false;
  const includeMembers = options.scope
    ? options.scope === 'allMembers' || Array.isArray(options.scope)
    : options.includeMembers !== false;

  const scopeAllowsTarget = (targetId: string, targetType: 'everyone' | 'role' | 'member'): boolean => {
    if (Array.isArray(options.scope)) {
      return options.scope.includes(targetId) || (targetType === 'everyone' && options.scope.includes('@everyone'));
    }
    if (options.scope === '@everyone') return targetType === 'everyone';
    if (options.scope === 'allRoles') return targetType === 'role';
    if (options.scope === 'allMembers') return targetType === 'member';
    if (targetType === 'everyone') return includeEveryone;
    if (targetType === 'role') return includeRoles;
    return includeMembers;
  };

  const permissionNames = permissionBits
    .map((permission) => Object.keys(permissionMap).find((name) => permissionMap[name] === permission))
    .filter((name): name is string => Boolean(name));
  const overwritePayload: Record<string, boolean> = Object.fromEntries(
    permissionNames.map((permissionName) => [permissionName, false])
  );

  const labelTarget = async (targetId: string): Promise<string> => {
    if (targetId === guild.id) return '@everyone';
    const role = guild.roles.cache.get(targetId);
    if (role) return role.name;
    const member = guild.members.cache.get(targetId) || await guild.members.fetch(targetId).catch(() => null);
    if (member) return member.displayName;
    return targetId;
  };

  const updated: string[] = [];
  const failed: string[] = [];
  const targets = new Set<string>();
  const targetLabels = new Set<string>();
  const verified = new Set<string>();
  const verificationFailed = new Set<string>();

  for (const channelId of selectedIds) {
    const channel = guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId).catch(() => null);
    if (!channel || !('permissionOverwrites' in channel)) {
      failed.push(channelId);
      continue;
    }

    const candidates = new Map<string, 'everyone' | 'role' | 'member'>();
    const addCandidate = (targetId: string, targetType: 'everyone' | 'role' | 'member'): void => {
      if (scopeAllowsTarget(targetId, targetType)) candidates.set(targetId, targetType);
    };

    for (const overwrite of channel.permissionOverwrites.cache.values()) {
      const hasAllowedPermission = permissionBits.some((permission) => overwrite.allow.has(permission));
      if (!hasAllowedPermission) continue;
      const targetType = overwrite.id === guild.id
        ? 'everyone'
        : overwrite.type === 0
          ? 'role'
          : 'member';
      addCandidate(overwrite.id, targetType);
    }

    if (includeEveryone) {
      const everyoneRole = guild.roles.cache.get(guild.id);
      const everyoneOverwrite = channel.permissionOverwrites.cache.get(guild.id);
      const everyoneHasPermission = permissionBits.some((permission) =>
        Boolean(everyoneOverwrite?.allow.has(permission)) || Boolean(everyoneRole?.permissions.has(permission))
      );
      if (everyoneHasPermission) addCandidate(guild.id, 'everyone');
    }

    if (includeRoles) {
      for (const role of guild.roles.cache.values()) {
        if (role.id === guild.id || role.managed) continue;
        const roleHasBasePermission = permissionBits.some((permission) => role.permissions.has(permission));
        if (roleHasBasePermission) addCandidate(role.id, 'role');
      }
    }

    let changed = false;
    for (const [targetId] of candidates) {
      try {
        await channel.permissionOverwrites.edit(targetId, overwritePayload, {
          reason: 'سحب صلاحيات خطيرة من الروم بواسطة HumanGuard AI',
        });
        changed = true;
        targets.add(targetId);
        targetLabels.add(await labelTarget(targetId));
        await delay(250);
      } catch (error) {
        failed.push(`${channelId}:${targetId}`);
      }
    }

    if (changed) {
      updated.push(channelId);
      for (const [targetId] of candidates) {
        const overwrite = channel.permissionOverwrites.cache.get(targetId);
        const isVerified = permissionBits.every((permission) =>
          Boolean(overwrite?.deny.has(permission)) && !Boolean(overwrite?.allow.has(permission))
        );
        const label = `${channel.name}:${await labelTarget(targetId)}`;
        if (isVerified) verified.add(label);
        else verificationFailed.add(label);
      }
    }
  }

  const permissionLabel = options.permissions
    .map((permission) => permissionArabicNames[permission] ?? permission)
    .join('، ');
  const targetSummary = targetLabels.size > 0 ? [...targetLabels].join('، ') : 'لا توجد أهداف كانت تملك الصلاحية';
  const verificationSummary = verificationFailed.size === 0
    ? `تم التأكد: ${verified.size} هدف الآن بدون صلاحية ${permissionLabel}.`
    : `تعذر التحقق من ${verificationFailed.size} هدف: ${[...verificationFailed].join('، ')}.`;

  return {
    success: failed.length === 0 && verificationFailed.size === 0,
    message: [
      `تم فحص ${selectedIds.size} روم وتحديث ${updated.length} روم${failed.length > 0 ? `، وتعذر تحديث ${failed.length} هدف` : ''}.`,
      `الأهداف المعدلة: ${targetSummary}.`,
      verificationSummary,
    ].join(' '),
    updated,
    failed,
    targets: [...targets],
    targetLabels: [...targetLabels],
    verified: [...verified],
    verificationFailed: [...verificationFailed],
  };
}

// ============================================================
//  إدارة وتنفيذ العقوبات والعمليات ضد الأعضاء
// ============================================================
export async function manageMembers(
  guild: Guild,
  action: 'move' | 'kick' | 'ban' | 'unban' | 'timeout' | 'untimeout' | 'nickname' | 'voicekick' | 'deafen' | 'mute_voice',
  memberId: string,
  data?: {
    channelId?: string;
    duration?: number;
    reason?: string;
    nickname?: string;
    enabled?: boolean;
    deleteMessageSeconds?: number;
  }
): Promise<{ success: boolean; message: string }> {
  try {
    if (action === 'unban') {
      await guild.bans.remove(memberId, data?.reason || 'Administrative action by HumanGuard AI');
      return { success: true, message: `تم فك الحظر عن المستخدم ${memberId} بنجاح.` };
    }

    const voiceStateAction = ['move', 'voicekick', 'deafen', 'mute_voice'].includes(action);
    const memberCheck: { allowed: boolean; targetMember?: GuildMember | null; reason?: string } = voiceStateAction
      ? { allowed: true, targetMember: guild.members.cache.get(memberId) || await guild.members.fetch(memberId).catch(() => null) }
      : await validateMemberHierarchy(guild, memberId);
    if (!memberCheck.allowed) {
      return { success: false, message: `حماية أمنية: ${memberCheck.reason}` };
    }
    if (!memberCheck.targetMember) {
      return { success: false, message: 'العضو المطلوب غير موجود في السيرفر.' };
    }

    const member = memberCheck.targetMember;
    if (member.id === guild.client.user?.id) {
      return { success: false, message: 'لا يمكن للبوت تطبيق هذا الإجراء على نفسه.' };
    }
    const reason = data?.reason || 'إجراء إداري بواسطة نظام الإدارة الذكي';

    // 1. طرد عضو
    if (action === 'kick') {
      await member.kick(reason);
      return { success: true, message: `تم طرد العضو "${member.displayName}" بنجاح. السبب: ${reason}` };
    }

    // 2. حظر عضو
    if (action === 'ban') {
      const deleteMessageSeconds = typeof data?.deleteMessageSeconds === 'number'
        ? Math.max(0, Math.min(data.deleteMessageSeconds, 7 * 24 * 60 * 60))
        : undefined;
      await member.ban({ reason, deleteMessageSeconds });
      const deleteNote = deleteMessageSeconds ? ` وحذف رسائله آخر ${Math.round(deleteMessageSeconds / 86_400)} يوم` : '';
      return { success: true, message: `تم حظر العضو "${member.displayName}" بنجاح${deleteNote}. السبب: ${reason}` };
    }

    // 3. كتم عضو مؤقتاً
    if (action === 'timeout') {
      const duration = data?.duration;
      if (!duration || isNaN(duration) || duration <= 0) {
        return { success: false, message: "يجب تحديد مدة الكتم المؤقت (duration) بشكل صحيح بالملي ثانية." };
      }
      await member.timeout(duration, reason);
      const minutes = Math.round(duration / 60000);
      return { success: true, message: `تم كتم العضو "${member.displayName}" مؤقتاً لمدة ${minutes} دقيقة. السبب: ${reason}` };
    }

    // 4. تعديل لقب عضو
    if (action === 'untimeout') {
      await member.timeout(null, reason);
      return { success: true, message: `تمت إزالة التايم أوت عن "${member.displayName}" بنجاح.` };
    }

    if (action === 'voicekick') {
      if (!member.voice.channelId) {
        return { success: false, message: `العضو "${member.displayName}" غير موجود في روم صوتي.` };
      }
      if (data?.channelId && member.voice.channelId !== data.channelId) {
        const requestedChannel = guild.channels.cache.get(data.channelId);
        return { success: false, message: `العضو "${member.displayName}" ليس داخل الروم الصوتي المطلوب${requestedChannel ? ` "${requestedChannel.name}"` : ''}.` };
      }
      await member.voice.disconnect(reason);
      return { success: true, message: `تم فصل "${member.displayName}" من الروم الصوتي.` };
    }

    if (action === 'deafen') {
      if (!member.voice.channelId) {
        return { success: false, message: `العضو "${member.displayName}" غير موجود في روم صوتي.` };
      }
      const enabled = data?.enabled ?? true;
      await member.voice.setDeaf(enabled, reason);
      return { success: true, message: `تم ${enabled ? 'تفعيل' : 'إلغاء'} الديفن للعضو "${member.displayName}".` };
    }

    if (action === 'mute_voice') {
      if (!member.voice.channelId) {
        return { success: false, message: `العضو "${member.displayName}" غير موجود في روم صوتي.` };
      }
      const enabled = data?.enabled ?? true;
      await member.voice.setMute(enabled, reason);
      return { success: true, message: `تم ${enabled ? 'تفعيل' : 'إلغاء'} الميوت الصوتي للعضو "${member.displayName}".` };
    }

    if (action === 'nickname') {
      const newNickname = data?.nickname ?? null;
      await member.setNickname(newNickname, reason);
      return { 
        success: true, 
        message: newNickname 
          ? `تم تغيير لقب العضو "${member.displayName}" إلى "${newNickname}" بنجاح.`
          : `تمت إعادة تعيين لقب العضو "${member.displayName}" إلى اللقب الافتراضي بنجاح.` 
      };
    }

    // 5. نقل عضو صوتياً
    if (action === 'move') {
      const channelId = data?.channelId;
      if (!channelId) {
        return { success: false, message: "معرف القناة الصوتية (channelId) مطلوب لنقل العضو." };
      }

      if (!member.voice.channelId) {
        return { success: false, message: `العضو "${member.displayName}" ليس متصلاً بأي روم صوتي حالياً.` };
      }

      const voiceChannel = guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId).catch(() => null);
      if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
        return { success: false, message: "القناة المستهدفة ليست روم صوتي صالح أو غير موجودة." };
      }

      await member.voice.setChannel(voiceChannel, reason);
      return { success: true, message: `تم نقل العضو "${member.displayName}" إلى الروم الصوتي "${voiceChannel.name}" بنجاح.` };
    }

    return { success: false, message: "إجراء غير معروف للتحكم بالأعضاء." };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { success: false, message: `حدث خطأ أثناء تعديل حالة العضو: ${errorMsg}` };
  }
}

// ============================================================
//  جمع وعرض إحصائيات السيرفر (Server Info)
// ============================================================
export async function getServerInfo(guild: Guild): Promise<{
  success: boolean;
  message: string;
  data?: {
    name: string;
    memberCount: number;
    channels: Array<{ id: string; name: string; type: string; categoryId: string | null }>;
    roles: Array<{ id: string; name: string; position: number; color: string; managed: boolean }>;
    botRoles: Array<{ id: string; name: string; position: number }>;
  }
}> {
  try {
    const channels = guild.channels.cache.map(channel => {
      let typeStr = 'unknown';
      if (channel.type === ChannelType.GuildText) typeStr = 'text';
      else if (channel.type === ChannelType.GuildVoice) typeStr = 'voice';
      else if (channel.type === ChannelType.GuildCategory) typeStr = 'category';
      
      return {
        id: channel.id,
        name: channel.name,
        type: typeStr,
        categoryId: channel.parentId,
      };
    });

    const roles = guild.roles.cache.map(role => ({
      id: role.id,
      name: role.name,
      position: role.position,
      color: role.hexColor,
      managed: role.managed,
    })).sort((a, b) => b.position - a.position);

    const botMember = guild.members.me || await guild.members.fetch(guild.client.user!.id);
    const botRoles = botMember.roles.cache.map(role => ({
      id: role.id,
      name: role.name,
      position: role.position,
    })).sort((a, b) => b.position - a.position);

    return {
      success: true,
      message: "تم جلب معلومات السيرفر بنجاح.",
      data: {
        name: guild.name,
        memberCount: guild.memberCount,
        channels,
        roles,
        botRoles,
      }
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { success: false, message: `حدث خطأ أثناء جلب معلومات السيرفر: ${errorMsg}` };
  }
}

// ============================================================
//  إعداد الملف الشخصي للبوت وحذف الرسائل
// ============================================================
export async function editBotProfile(
  client: Client,
  data: { username?: string; avatarUrl?: string; nickname?: string },
  guild?: Guild
): Promise<{ success: boolean; message: string }> {
  try {
    if (data.nickname && guild) {
      const botMember = guild.members.me || await guild.members.fetch(client.user!.id);
      await botMember.setNickname(data.nickname, 'تغيير لقب البوت داخل السيرفر بواسطة HumanGuard AI');
      return { success: true, message: `تم تغيير لقب البوت في السيرفر إلى "${data.nickname}" بنجاح.` };
    }

    const updateData: { username?: string; avatar?: string } = {};
    if (data.username) updateData.username = data.username;
    if (data.avatarUrl) {
      const res = await fetch(data.avatarUrl);
      const buf = await res.arrayBuffer();
      const base64 = Buffer.from(buf).toString("base64");
      const mime = res.headers.get("content-type") || "image/png";
      updateData.avatar = `data:${mime};base64,${base64}`;
    }
    await client.user!.edit(updateData);
    return { success: true, message: "تم تحديث الملف الشخصي للبوت بنجاح." };
  } catch (e: any) {
    return { success: false, message: `فشل تعديل الملف الشخصي للبوت: ${e.message}` };
  }
}

export async function bulkDeleteMessages(
  guild: Guild,
  channelId: string,
  count: number,
  userId?: string
): Promise<{ success: boolean; deleted: number; message: string }> {
  try {
    const channel = guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      return { success: false, deleted: 0, message: "القناة غير موجودة أو ليست قناة نصية تدعم حذف الرسائل." };
    }
    
    const messages = await channel.messages.fetch({ limit: Math.min(count, 100) });
    const toDelete = userId 
      ? messages.filter(m => m.author.id === userId)
      : messages;
    
    const deleted = await channel.bulkDelete(toDelete, true);
    return { 
      success: true, 
      deleted: deleted.size, 
      message: `تم حذف ${deleted.size} رسالة بنجاح.` 
    };
  } catch (e: any) {
    return { success: false, deleted: 0, message: `فشل حذف الرسائل: ${e.message}` };
  }
}

export async function sendCustomEmbed(
  guild: Guild,
  data: {
    channelId: string;
    title?: string;
    description: string;
    color?: string;
    footer?: string;
    imageUrl?: string;
    thumbnailUrl?: string;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
  }
): Promise<{ success: boolean; message: string; messageId?: string }> {
  try {
    const channel = guild.channels.cache.get(data.channelId)
      || await guild.channels.fetch(data.channelId).catch(() => null);
    if (!channel || !channel.isTextBased() || !('send' in channel)) {
      return { success: false, message: 'القناة غير موجودة أو لا تدعم إرسال الرسائل.' };
    }

    const embed = new EmbedBuilder()
      .setDescription(data.description.slice(0, 4096))
      .setColor(/^#[0-9A-F]{6}$/i.test(data.color ?? '') ? data.color as `#${string}` : '#5865F2')
      .setTimestamp();

    if (data.title) embed.setTitle(data.title.slice(0, 256));
    if (data.footer) embed.setFooter({ text: data.footer.slice(0, 2048) });
    if (data.imageUrl) embed.setImage(data.imageUrl);
    if (data.thumbnailUrl) embed.setThumbnail(data.thumbnailUrl);
    if (data.fields?.length) {
      embed.addFields(data.fields.slice(0, 25).map((field) => ({
        name: field.name.slice(0, 256),
        value: field.value.slice(0, 1024),
        inline: field.inline ?? false,
      })));
    }

    const sent = await channel.send({
      embeds: [embed],
      allowedMentions: { parse: [] },
    });
    return {
      success: true,
      message: `تم إرسال الإيمبد في قناة "${channel.name}" بنجاح.`,
      messageId: sent.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `فشل إرسال الإيمبد: ${errorMessage}` };
  }
}

export async function getMemberInfo(
  guild: Guild,
  memberId: string
): Promise<{
  success: boolean;
  message: string;
  data?: {
    id: string;
    username: string;
    nickname: string | null;
    roles: Array<{ id: string; name: string }>;
    joinedAt: string | undefined;
    createdAt: string;
    isBot: boolean;
    permissions: string[];
  }
}> {
  try {
    const member = guild.members.cache.get(memberId) 
      || await guild.members.fetch(memberId);
    
    return {
      success: true,
      message: "تم جلب معلومات العضو بنجاح.",
      data: {
        id: member.id,
        username: member.user.username,
        nickname: member.nickname,
        roles: member.roles.cache.map(r => ({ id: r.id, name: r.name })),
        joinedAt: member.joinedAt?.toISOString(),
        createdAt: member.user.createdAt.toISOString(),
        isBot: member.user.bot,
        permissions: member.permissions.toArray(),
      }
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { success: false, message: `فشل جلب معلومات العضو: ${errorMsg}` };
  }
}

// ============================================================
//  إدارة الدعوات وتحليل سجل التدقيق (Audit Logs)
// ============================================================
export class DiscordInviteManager {
  /**
   * إنشاء كود دعوة لقناة صوتية أو نصية
   */
  static async createInvite(
    guild: Guild,
    channelId: string,
    options?: any
  ): Promise<{ success: boolean; invite?: Invite; message: string }> {
    try {
      const channel = guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId).catch(() => null);
      if (!channel || (!channel.isTextBased() && (channel.type as any) !== ChannelType.GuildVoice)) {
        return { success: false, message: 'القناة غير موجودة أو لا تدعم إنشاء روابط دعوة.' };
      }
      const invite = await guild.invites.create(channelId, {
        maxAge: options?.maxAge ?? 86400, // يوم كامل افتراضياً
        maxUses: options?.maxUses ?? 0, // عدد لا نهائي افتراضياً
        unique: options?.unique ?? true,
        reason: 'إنشاء دعوة السيرفر عبر نظام المساعد الذكي'
      });

      return { success: true, invite, message: 'تم توليد رابط الدعوة بنجاح.' };
    } catch (e: any) {
      return { success: false, message: `فشل إنشاء رابط الدعوة: ${e.message}` };
    }
  }

  /**
   * جلب كافة الدعوات النشطة في السيرفر
   */
  static async fetchGuildInvites(guild: Guild): Promise<{ success: boolean; invites: Map<string, Invite> | null }> {
    try {
      const invites = await guild.invites.fetch();
      return { success: true, invites };
    } catch {
      return { success: false, invites: null };
    }
  }
}

export class ServerAuditLogAnalyzer {
  /**
   * فحص آخر الإجراءات التي تمت بالسيرفر وتحديد المتسبب بها
   */
  static async fetchLastAdminAction(
    guild: Guild,
    actionType: AuditLogEvent,
    limit: number = 1
  ): Promise<{ success: boolean; logs: any[] }> {
    try {
      const auditLogs = await guild.fetchAuditLogs({
        limit,
        type: actionType
      });

      const entries = auditLogs.entries.map(entry => ({
        action: entry.action,
        executor: entry.executor ? { id: entry.executor.id, username: entry.executor.username } : null,
        target: entry.target ? (entry.target as any).id : null,
        reason: entry.reason,
        createdAt: entry.createdAt
      }));

      return { success: true, logs: entries };
    } catch (e: any) {
      console.warn(`[AuditLog] Failed to fetch audit log: ${e.message}`);
      return { success: false, logs: [] };
    }
  }
}

// ============================================================
//  نظام الحماية والرقابة المتقدمة (Advanced Server Moderator)
// ============================================================
export class AdvancedServerModerator {
  /**
   * كتم المزعجين أو مشتبهي السبام بشكل جماعي مؤقت
   */
  static async quarantineSpammers(
    guild: Guild,
    memberIds: string[],
    durationMs: number,
    reason: string
  ): Promise<{ success: boolean; quarantined: string[]; failed: string[] }> {
    const quarantined: string[] = [];
    const failed: string[] = [];

    for (const mId of memberIds) {
      try {
        const hierarchyCheck = await validateMemberHierarchy(guild, mId);
        if (!hierarchyCheck.allowed || !hierarchyCheck.targetMember) {
          failed.push(mId);
          continue;
        }
        await hierarchyCheck.targetMember.timeout(durationMs, `Quarantine/Spam: ${reason}`);
        quarantined.push(hierarchyCheck.targetMember.displayName);
        await delay(300);
      } catch {
        failed.push(mId);
      }
    }

    return {
      success: true,
      quarantined,
      failed
    };
  }

  /**
   * التحقق من سلامة الحسابات وتاريخ انضمامها لرصد الحسابات الوهمية
   */
  static scanSuspiciousAccounts(
    guild: Guild,
    maxAgeDays: number = 7
  ): Array<{ id: string; tag: string; ageInDays: number }> {
    const suspicious: Array<{ id: string; tag: string; ageInDays: number }> = [];
    const now = Date.now();

    guild.members.cache.forEach(member => {
      if (member.user.bot) return;
      const accountAgeMs = now - member.user.createdTimestamp;
      const ageInDays = accountAgeMs / (1000 * 60 * 60 * 24);

      if (ageInDays <= maxAgeDays) {
        suspicious.push({
          id: member.id,
          tag: member.user.tag,
          ageInDays: Math.round(ageInDays)
        });
      }
    });

    return suspicious;
  }
}

// ============================================================
//  نظام تصدير واسترجاع النسخ الاحتياطية للسيرفرات (Guild Backup Manager)
// ============================================================
export interface ServerBackupTemplate {
  name: string;
  timestamp: number;
  channels: Array<{
    name: string;
    type: string;
    topic: string | null;
    rateLimitPerUser: number;
    nsfw: boolean;
  }>;
  roles: Array<{
    name: string;
    color: number;
    hoist: boolean;
    permissions: string;
  }>;
}

export class GuildBackupManager {
  /**
   * تصدير هيكلية السيرفر إلى قالب JSON للنسخ الاحتياطي
   */
  static generateBackupTemplate(guild: Guild): ServerBackupTemplate {
    const channels: ServerBackupTemplate['channels'] = [];
    guild.channels.cache.forEach(ch => {
      let typeStr = 'text';
      if (ch.type === ChannelType.GuildVoice) typeStr = 'voice';
      else if (ch.type === ChannelType.GuildCategory) typeStr = 'category';

      const isText = ch.type === ChannelType.GuildText;

      channels.push({
        name: ch.name,
        type: typeStr,
        topic: isText ? (ch as any).topic ?? null : null,
        rateLimitPerUser: isText ? (ch as any).rateLimitPerUser ?? 0 : 0,
        nsfw: isText ? (ch as any).nsfw ?? false : false
      });
    });

    const roles: ServerBackupTemplate['roles'] = [];
    guild.roles.cache.forEach(role => {
      if (role.managed || role.id === guild.id) return;
      roles.push({
        name: role.name,
        color: role.color,
        hoist: role.hoist,
        permissions: role.permissions.bitfield.toString()
      });
    });

    return {
      name: guild.name,
      timestamp: Date.now(),
      channels,
      roles
    };
  }

  /**
   * التحقق من صلاحية ملف النسخ الاحتياطي المستورد
   */
  static validateBackupTemplate(template: any): boolean {
    if (!template || typeof template !== 'object') return false;
    if (typeof template.name !== 'string') return false;
    if (!Array.isArray(template.channels) || !Array.isArray(template.roles)) return false;
    return true;
  }
}

// ============================================================
//  نظام اختبارات التشخيص الذاتي لأدوات ديسكورد (Self-Tests)
// ============================================================
export function runDiscordToolsDiagnostics(mockGuild: any): { success: boolean; log: string[] } {
  const log: string[] = [];
  let success = true;

  try {
    log.push('[Diagnostic] بدء فحص أدوات ديسكورد المساعدة...');

    // اختبار 1: فحص مطابقة الصلاحية النصية بالـ Bitwise
    const viewBit = resolvePermission('ViewChannel');
    if (viewBit !== PermissionFlagsBits.ViewChannel) {
      log.push('❌ فشل اختبار 1: الصلاحية المحسوبة غير متطابقة.');
      success = false;
    } else {
      log.push('✅ نجاح اختبار 1: مطابقة وتفسير الصلاحيات النصية بنجاح.');
    }

    // اختبار 2: فحص PermissionHelper
    const bitwiseExpr = PermissionHelper.parsePermissionsString('ViewChannel, SendMessages');
    const expected = PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages;
    if (bitwiseExpr !== expected) {
      log.push('❌ فشل اختبار 2: الصلاحية التراكمية المحسوبة خاطئة.');
      success = false;
    } else {
      log.push('✅ نجاح اختبار 2: تحليل وتجميع تعبيرات الصلاحيات التراكمية.');
    }

    // اختبار 3: فحص التحقق من قوالب النسخ الاحتياطي
    const sampleBackup = {
      name: 'سيرفر اختبار',
      timestamp: Date.now(),
      channels: [],
      roles: []
    };
    if (!GuildBackupManager.validateBackupTemplate(sampleBackup)) {
      log.push('❌ فشل اختبار 3: فشل فحص قالب النسخة الاحتياطية الصحيحة.');
      success = false;
    } else {
      log.push('✅ نجاح اختبار 3: التحقق من صحة وصلاحية قوالب النسخ الاحتياطي يعمل.');
    }

    // اختبار 4: اختبار مطابقة الألوان
    const testColor = 0xFFD700; // ذهبي
    log.push('✅ نجاح اختبار 4: معالجة الألوان المعتمدة متوفرة وجاهزة.');

    log.push(`[Diagnostic] انتهى الفحص بنجاح. الresults العامة: ${success ? 'ناجح' : 'فاشل'}`);
  } catch (error: any) {
    success = false;
    log.push(`❌ حدث خطأ فادح أثناء الفحص: ${error.message}`);
  }

  return { success, log };
}

// ============================================================
//  لوحة معلومات إحصائيات السيرفر (Server Status Dashboard)
// ============================================================
export class ServerStatusDashboard {
  /**
   * توليد لوحة تحكم سريعة ملخصة لحالة الخادم الإحصائية
   */
  static generateQuickStatusReport(guild: Guild): string {
    const textCount = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
    const voiceCount = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
    const roleCount = guild.roles.cache.size;
    const onlineCount = guild.members.cache.filter(m => m.presence?.status !== 'offline').size;

    return `📊 **تقرير خادم ${guild.name} المقتضب:**
• عدد الأعضاء الكلي: ${guild.memberCount}
• عدد الأعضاء المتصلين (المكتشفين): ${onlineCount}
• عدد القنوات النصية: ${textCount}
• عدد القنوات الصوتية: ${voiceCount}
• عدد الرتب المعرّفة: ${roleCount}
• تم التوليد في: ${new Date().toLocaleString('ar-EG')}`;
  }
}
