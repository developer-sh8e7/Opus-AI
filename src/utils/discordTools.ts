import { 
  Guild, 
  ChannelType, 
  PermissionFlagsBits, 
  OverwriteResolvable, 
  GuildMember 
} from 'discord.js';
import { validateHierarchy, validateMemberHierarchy } from './security.js';
import { delay } from './rateLimiter.js';

/**
 * خريطة الصلاحيات لتسهيل فك وربط المسميات النصية بالقيمة العددية (BigInt) الخاصة بديسكورد.
 */
export const permissionMap: Record<string, bigint> = {
  // General Channel Permissions
  ViewChannel: PermissionFlagsBits.ViewChannel,
  ManageChannels: PermissionFlagsBits.ManageChannels,
  ManageRoles: PermissionFlagsBits.ManageRoles,
  ManageWebhooks: PermissionFlagsBits.ManageWebhooks,
  
  // Text Permissions
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
  
  // Voice Permissions
  Connect: PermissionFlagsBits.Connect,
  Speak: PermissionFlagsBits.Speak,
  Video: PermissionFlagsBits.Stream,
  UseEmbeddedActivities: PermissionFlagsBits.UseEmbeddedActivities,
  UseSoundboard: PermissionFlagsBits.UseSoundboard,
  UseExternalSounds: PermissionFlagsBits.UseExternalSounds,
  UseVAD: PermissionFlagsBits.UseVAD,
  PrioritySpeaker: PermissionFlagsBits.PrioritySpeaker,
  MuteMembers: PermissionFlagsBits.MuteMembers,
  DeafenMembers: PermissionFlagsBits.DeafenMembers,
  MoveMembers: PermissionFlagsBits.MoveMembers,
  
  // Guild Permissions
  KickMembers: PermissionFlagsBits.KickMembers,
  BanMembers: PermissionFlagsBits.BanMembers,
  Administrator: PermissionFlagsBits.Administrator,
  ManageGuild: PermissionFlagsBits.ManageGuild,
  ViewAuditLog: PermissionFlagsBits.ViewAuditLog,
  ViewGuildInsights: PermissionFlagsBits.ViewGuildInsights,
  ModerateMembers: PermissionFlagsBits.ModerateMembers,
};

/**
 * دالة مساعدة لمطابقة اسم الصلاحية نصياً (مثل "SendMessages" أو "send_messages") بالصلاحية الحقيقية في ديسكورد.
 * @param permStr اسم الصلاحية المراد مطابقتها
 * @returns قيمة الصلاحية (bigint) أو null إذا لم تكن مطابقة
 */
export function resolvePermission(permStr: string): bigint | null {
  const normalized = permStr.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  for (const [key, value] of Object.entries(permissionMap)) {
    if (key.toLowerCase() === normalized) {
      return value;
    }
  }
  return null;
}

/**
 * الأداة 1: إنشاء القنوات النصية أو الصوتية أو الفئات بالتتابع مع تأخير زمني لتفادي حظر حد الطلبات.
 * @param guild السيرفر الحالي
 * @param type نوع القناة المطلوبة ("text" أو "voice" أو "category")
 * @param names مصفوفة بأسماء القنوات المراد إنشاؤها
 * @param categoryId معرف الفئة الأب (اختياري)
 * @param permissions صلاحيات خاصة بالقناة (اختياري)
 */
export async function createChannels(
  guild: Guild,
  type: 'text' | 'voice' | 'category',
  names: string[],
  categoryId?: string,
  permissions?: Array<{ id: string; allow: string[]; deny: string[] }>
): Promise<{ success: boolean; message: string; created: string[]; failed: string[] }> {
  const created: string[] = [];
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
  }

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    if (i > 0) {
      await delay(500); // تأخير 500ms لتفادي الـ Rate Limit
    }
    try {
      const createdChannel = await guild.channels.create({
        name,
        type: channelType,
        parent: categoryId || null,
        permissionOverwrites: permissionOverwrites.length > 0 ? permissionOverwrites : undefined,
        reason: 'إنشاء قنوات جماعية بواسطة نظام الإدارة الذكي',
      });
      created.push(createdChannel.name);
    } catch (error) {
      failed.push(name);
      console.error(`[DiscordTools] فشل إنشاء القناة "${name}":`, error);
    }
  }

  const successMessage = `تم إنشاء ${created.length} قناة بنجاح${failed.length > 0 ? `، وفشل إنشاء ${failed.length} قناة (${failed.join(', ')})` : ''}.`;
  return {
    success: true,
    message: successMessage,
    created,
    failed,
  };
}

/**
 * الأداة 2: إدارة الرتب (إنشاء، تعديل، حذف، منح، إزالة) مع تفعيل نظام الأمان وفحص رتبة البوت الهرمية.
 * @param guild السيرفر الحالي
 * @param action نوع الإجراء المطلوبة ("create", "delete", "edit", "assign", "remove")
 * @param roleData بيانات الرتبة المراد إدارتها
 * @param targetMemberId معرف العضو المستهدف في حال منح أو سحب الرتبة
 */
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
    // 🎨 دالة مساعدة لتفسير الألوان ودعم الأسماء العربية/الإنجليزية أو كود الهيكس
    const resolveColor = (colorStr?: string): number | undefined => {
      if (!colorStr) return undefined;
      if (colorStr.startsWith('#')) {
        return parseInt(colorStr.replace('#', ''), 16);
      }
      
      const arabicColors: Record<string, number> = {
        'أحمر': 0xFF0000,
        'أخضر': 0x00FF00,
        'أزرق': 0x0000FF,
        'أصفر': 0xFFFF00,
        'بنفسجي': 0x800080,
        'برتقالي': 0xFFA500,
        'وردي': 0xFFC0CB,
        'ذهبي': 0xFFD700,
        'فضي': 0xC0C0C0,
        'رمادي': 0x808080,
        'أسود': 0x000000,
        'أبيض': 0xFFFFFF,
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

    // 🔑 دالة مساعدة لتحويل مصفوفة الصلاحيات النصية إلى قيمة ديسكورد التراكمية
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

    // 🔒 فحص أمان الرتبة الهرمية الإلزامي قبل التعديل أو الحذف أو المنح أو السحب
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
      await role.delete('حذف رتبة بواسطة نظام الإدارة الذكي');
      return { success: true, message: `تم حذف الرتبة "${roleName}" بنجاح.` };
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

/**
 * الأداة 3: تعديل صلاحيات قناة بدقة وتطبيق الفحص الأمني للرتبة الهرمية.
 * @param guild السيرفر الحالي
 * @param channelId معرف القناة المطلوب تعديلها
 * @param targetId معرف العضو أو الرتبة المراد تعديل صلاحياتها
 * @param targetType نوع المستهدف ("role" أو "member")
 * @param allow مصفوفة بأسماء الصلاحيات المسموح بها
 * @param deny مصفوفة بأسماء الصلاحيات الممنوعة
 */
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

    // 🔒 فحص الأمان لعدم التعديل على رتبة أو عضو أعلى من البوت
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
      await channel.permissionOverwrites.edit(resolvedTargetId, overwrites, {
        reason: 'تعديل صلاحيات القناة بواسطة نظام الإدارة الذكي'
      });
      return { success: true, message: `تم تحديث صلاحيات القناة "${channel.name}" بنجاح.` };
    } else {
      return { success: false, message: "هذه القناة لا تدعم تعديل الصلاحيات." };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { success: false, message: `حدث خطأ أثناء تعديل صلاحيات القناة: ${errorMsg}` };
  }
}

/**
 * الأداة 4: التحكم بالأعضاء (طرد، حظر، كتم مؤقت، تغيير اللقب، النقل الصوتي) مع الالتزام بفحوصات الأمان الهرمية.
 * @param guild السيرفر الحالي
 * @param action الإجراء المطلوب ("move", "kick", "ban", "timeout", "nickname")
 * @param memberId معرف العضو المستهدف
 * @param data البيانات الإضافية للإجراء
 */
export async function manageMembers(
  guild: Guild,
  action: 'move' | 'kick' | 'ban' | 'timeout' | 'nickname',
  memberId: string,
  data?: {
    channelId?: string;
    duration?: number;
    reason?: string;
    nickname?: string;
  }
): Promise<{ success: boolean; message: string }> {
  try {
    // 🔒 فحص الأمان لضمان عدم التحكم بعضو مساوٍ أو أعلى من البوت
    const memberCheck = await validateMemberHierarchy(guild, memberId);
    if (!memberCheck.allowed) {
      return { success: false, message: `حماية أمنية: ${memberCheck.reason}` };
    }

    const member = memberCheck.targetMember!;
    const reason = data?.reason || 'إجراء إداري بواسطة نظام الإدارة الذكي';

    // 1. طرد عضو
    if (action === 'kick') {
      await member.kick(reason);
      return { success: true, message: `تم طرد العضو "${member.displayName}" بنجاح. السبب: ${reason}` };
    }

    // 2. حظر عضو
    if (action === 'ban') {
      await member.ban({ reason });
      return { success: true, message: `تم حظر العضو "${member.displayName}" بنجاح. السبب: ${reason}` };
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

/**
 * الأداة 5: جلب معلومات السيرفر للذكاء الاصطناعي للاستعلام عن القنوات، الرتب، رتب البوت، وعدد الأعضاء.
 * @param guild السيرفر الحالي
 */
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
