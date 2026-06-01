/**
 * ════════════════════════════════════════════════════════════════
 *          🔐 PERMISSION CHECKER - نظام التحقق من الصلاحيات
 * ════════════════════════════════════════════════════════════════
 * نظام متقدم للتحقق من صلاحيات المستخدمين والبوت
 */

import { GuildMember, Guild, Role, PermissionResolvable, PermissionFlags } from 'discord.js';

interface PermissionCheck {
  isAllowed: boolean;
  reason: string;
  requiredPermissions: string[];
  userPermissions: string[];
  missingPermissions: string[];
  riskLevel: 'safe' | 'warning' | 'critical';
}

/**
 * فئة PermissionChecker: التحقق من الصلاحيات
 */
export class PermissionChecker {
  private botMember: GuildMember | null = null;
  private permissionCache: Map<string, PermissionCheck> = new Map();

  /**
   * التحقق من صلاحيات المستخدم لتنفيذ إجراء محدد
   */
  async checkUserPermissions(
    member: GuildMember,
    action: string,
    targetMember?: GuildMember
  ): Promise<PermissionCheck> {
    const cacheKey = `${member.id}_${action}_${targetMember?.id || 'none'}`;

    // التحقق من الذاكرة المؤقتة
    if (this.permissionCache.has(cacheKey)) {
      const cached = this.permissionCache.get(cacheKey)!;
      if (Date.now() - (cached as any).timestamp < 60000) {
        return cached;
      }
    }

    console.log(`[PermissionChecker] التحقق من صلاحيات: ${member.user.username} للقيام بـ ${action}`);

    const requiredPermissions = this.getRequiredPermissions(action);
    const userPermissions = member.permissions.toArray();
    const missingPermissions = requiredPermissions.filter(p => !userPermissions.includes(p as any));

    let isAllowed = missingPermissions.length === 0;
    let reason = '';
    let riskLevel: 'safe' | 'warning' | 'critical' = 'safe';

    // فحوصات إضافية
    if (targetMember) {
      const hierarchyCheck = this.checkRoleHierarchy(member, targetMember);
      if (!hierarchyCheck.isAllowed) {
        isAllowed = false;
        reason = hierarchyCheck.reason;
        riskLevel = 'critical';
      }
    }

    if (!isAllowed && !reason) {
      reason = `صلاحيات مفقودة: ${missingPermissions.join(', ')}`;
      riskLevel = 'warning';
    } else if (isAllowed) {
      reason = '✅ الصلاحيات كافية';
    }

    const result: PermissionCheck = {
      isAllowed,
      reason,
      requiredPermissions,
      userPermissions,
      missingPermissions,
      riskLevel
    };

    // حفظ في الذاكرة المؤقتة
    this.permissionCache.set(cacheKey, { ...result, timestamp: Date.now() } as any);

    return result;
  }

  /**
   * التحقق من صلاحيات البوت لتنفيذ إجراء
   */
  async checkBotPermissions(
    guild: Guild,
    action: string
  ): Promise<PermissionCheck> {
    console.log(`[PermissionChecker] التحقق من صلاحيات البوت للقيام بـ ${action}`);

    const botMember = guild.members.me;
    if (!botMember) {
      return {
        isAllowed: false,
        reason: '❌ البوت غير موجود في الخادم',
        requiredPermissions: [],
        userPermissions: [],
        missingPermissions: [],
        riskLevel: 'critical'
      };
    }

    const requiredPermissions = this.getRequiredPermissions(action);
    const botPermissions = botMember.permissions.toArray();
    const missingPermissions = requiredPermissions.filter(p => !botPermissions.includes(p as any));

    return {
      isAllowed: missingPermissions.length === 0,
      reason: missingPermissions.length === 0 
        ? '✅ البوت لديه الصلاحيات اللازمة'
        : `❌ صلاحيات مفقودة: ${missingPermissions.join(', ')}`,
      requiredPermissions,
      userPermissions: botPermissions,
      missingPermissions,
      riskLevel: missingPermissions.length === 0 ? 'safe' : 'critical'
    };
  }

  /**
   * الحصول على الصلاحيات المطلوبة لأمر معين
   */
  private getRequiredPermissions(action: string): string[] {
    const permissions: Record<string, string[]> = {
      'ban_member': ['BanMembers'],
      'kick_member': ['KickMembers'],
      'mute_member': ['MuteMembers', 'ModerateMembers'],
      'assign_role': ['ManageRoles'],
      'remove_role': ['ManageRoles'],
      'create_channel': ['ManageChannels'],
      'delete_channel': ['ManageChannels'],
      'modify_permissions': ['ManageChannels', 'ManageRoles'],
      'manage_guild': ['ManageGuild', 'Administrator'],
      'send_messages': ['SendMessages'],
      'manage_messages': ['ManageMessages'],
      'mention_everyone': ['MentionEveryone'],
      'use_voice': ['Connect', 'Speak'],
      'warning': ['Administrator', 'ModerateMembers'],
    };

    return permissions[action] || ['Administrator'];
  }

  /**
   * التحقق من تسلسل الأدوار
   * المدير يجب أن يكون دوره أعلى من الهدف
   */
  private checkRoleHierarchy(member: GuildMember, targetMember: GuildMember): { isAllowed: boolean; reason: string } {
    // الإداريون يمكنهم فعل أي شيء
    if (member.permissions.has('Administrator')) {
      return { isAllowed: true, reason: 'المدير لديه صلاحيات كاملة' };
    }

    // مقارنة الأدوار
    if (!member.roles.highest || !targetMember.roles.highest) {
      return { isAllowed: false, reason: 'لا يمكن مقارنة الأدوار' };
    }

    const memberRolePosition = member.roles.highest.position;
    const targetRolePosition = targetMember.roles.highest.position;

    if (memberRolePosition <= targetRolePosition) {
      return {
        isAllowed: false,
        reason: `❌ دور المدير (${member.roles.highest.name}) يجب أن يكون أعلى من دور الهدف (${targetMember.roles.highest.name})`
      };
    }

    return { isAllowed: true, reason: '✅ تسلسل الأدوار صحيح' };
  }

  /**
   * التحقق السريع من صلاحية واحدة
   */
  hasPermission(member: GuildMember, permission: PermissionResolvable): boolean {
    return member.permissions.has(permission);
  }

  /**
   * التحقق من عدة صلاحيات
   */
  hasAllPermissions(member: GuildMember, permissions: PermissionResolvable[]): boolean {
    return permissions.every(p => member.permissions.has(p));
  }

  /**
   * التحقق من وجود أي صلاحية من قائمة
   */
  hasAnyPermission(member: GuildMember, permissions: PermissionResolvable[]): boolean {
    return permissions.some(p => member.permissions.has(p));
  }

  /**
   * الحصول على قائمة صلاحيات المستخدم
   */
  getUserPermissions(member: GuildMember): string[] {
    return member.permissions.toArray();
  }

  /**
   * الحصول على الأدوار عالية الخطورة
   * (التي يجب الحذر عند التعديل عليها)
   */
  getHighRiskRoles(guild: Guild): Role[] {
    const highRiskRoles: Role[] = [];

    for (const role of guild.roles.cache.values()) {
      // الأدوار مع صلاحيات إدارية
      if (role.permissions.has(['Administrator', 'ManageGuild', 'ManageRoles'])) {
        highRiskRoles.push(role);
      }

      // الأدوار المرتبطة بالبوت
      if (role.managed) {
        highRiskRoles.push(role);
      }
    }

    return highRiskRoles;
  }

  /**
   * التحقق من أن الدور يمكن تعديله
   */
  canModifyRole(member: GuildMember, role: Role): boolean {
    // لا يمكن تعديل دور @everyone
    if (role.id === role.guild.id) {
      return false;
    }

    // لا يمكن تعديل دور البوت نفسه
    if (role.managed) {
      return false;
    }

    // يجب أن يكون دور المديرين أعلى
    if (member.roles.highest.position <= role.position) {
      return false;
    }

    return member.permissions.has('ManageRoles');
  }

  /**
   * تنظيف الذاكرة المؤقتة
   */
  clearCache(): void {
    this.permissionCache.clear();
    console.log('[PermissionChecker] تم تنظيف الذاكرة المؤقتة');
  }

  /**
   * الحصول على تقرير شامل عن صلاحيات المستخدم
   */
  generatePermissionReport(member: GuildMember): string {
    const permissions = member.permissions.toArray();
    const roles = member.roles.cache.map(r => r.name).join(', ');
    const isAdmin = member.permissions.has('Administrator');

    let report = `📋 **تقرير الصلاحيات**\n`;
    report += `👤 **المستخدم**: ${member.user.username}\n`;
    report += `🏷️ **الأدوار**: ${roles || 'لا توجد'}\n`;
    report += `⚡ **صلاحيات إدارية**: ${isAdmin ? '✅ نعم' : '❌ لا'}\n`;
    report += `\n📊 **الصلاحيات الممنوحة**:\n`;
    report += permissions.slice(0, 10).map(p => `• ${p}`).join('\n');
    
    if (permissions.length > 10) {
      report += `\n... و ${permissions.length - 10} صلاحيات أخرى`;
    }

    return report;
  }
}

export default PermissionChecker;
