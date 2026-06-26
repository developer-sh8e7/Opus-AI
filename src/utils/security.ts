import { Guild, GuildMember } from 'discord.js';

/**
 * التحقق من صلاحية تعديل أو تعيين أو حذف رتبة معينة بناءً على الترتيب الهرمي للبوت في السيرفر.
 * @param guild السيرفر الحالي
 * @param targetRoleId معرف الرتبة المستهدفة للتعديل/الحذف/التعيين
 * @returns كائن يحتوي على results الفحص وسبب الرفض إن وجد
 */
export async function validateHierarchy(
  guild: Guild,
  targetRoleId: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const botMember = guild.members.me || await guild.members.fetch(guild.client.user!.id);
    if (!botMember) {
      return { allowed: false, reason: "فشل العثور على عضو البوت في السيرفر." };
    }

    const botHighestPosition = botMember.roles.highest.position;
    const targetRole = guild.roles.cache.get(targetRoleId) || await guild.roles.fetch(targetRoleId).catch(() => null);

    if (!targetRole) {
      return { allowed: false, reason: "الرتبة المطلوبة غير موجودة في السيرفر." };
    }

    // Role hierarchy check
    if (targetRole.position >= botHighestPosition) {
      return {
        allowed: false,
        reason: `لا يمكن تعديل الرتبة "${targetRole.name}" لأنها مساوية أو أعلى من رتبة البوت في ترتيب السيرفر.`
      };
    }

    // Check if the role is managed by an integration
    if (targetRole.managed) {
      return { allowed: false, reason: "هذه الرتبة يتم إدارتها تلقائياً بواسطة نظام/تكامل خارجي ولا يمكن تعديلها." };
    }

    return { allowed: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { allowed: false, reason: `حدث خطأ أثناء التحقق من الرتبة الهرمية: ${errorMsg}` };
  }
}

/**
 * التحقق من إمكانية التحكم بعضو آخر (طرد، حظر، كتم، تغيير لقب) بناءً على رتبة البوت ورتبة العضو المستهدف.
 * @param guild السيرفر الحالي
 * @param targetMemberId معرف العضو المستهدف
 * @returns كائن يحتوي على results الفحص وسبب الرفض إن وجد
 */
export async function validateMemberHierarchy(
  guild: Guild,
  targetMemberId: string
): Promise<{ allowed: boolean; targetMember?: GuildMember; reason?: string }> {
  try {
    const botMember = guild.members.me || await guild.members.fetch(guild.client.user!.id);
    if (!botMember) {
      return { allowed: false, reason: "فشل العثور على عضو البوت في السيرفر." };
    }

    const targetMember = guild.members.cache.get(targetMemberId) || await guild.members.fetch(targetMemberId).catch(() => null);
    if (!targetMember) {
      return { allowed: false, reason: "العضو المطلوب غير موجود في السيرفر." };
    }

    if (targetMember.id === botMember.id) {
      return { allowed: false, reason: "لا يمكن للبوت تطبيق هذا الإجراء على نفسه." };
    }

    // Guild owner cannot be modified by any bot
    if (targetMember.id === guild.ownerId) {
      return { allowed: false, reason: "لا يمكن التعديل أو التحكم بمالك السيرفر." };
    }

    const botHighestPosition = botMember.roles.highest.position;
    const targetHighestPosition = targetMember.roles.highest.position;

    if (targetHighestPosition >= botHighestPosition) {
      return {
        allowed: false,
        reason: `لا يمكن تعديل العضو "${targetMember.displayName}" لأن رتبته مساوية أو أعلى من رتبة البوت.`
      };
    }

    return { allowed: true, targetMember };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { allowed: false, reason: `حدث خطأ أثناء التحقق من رتبة العضو الهرمية: ${errorMsg}` };
  }
}
