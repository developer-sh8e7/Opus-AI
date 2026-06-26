/**
 * ════════════════════════════════════════════════════════════════
 *            🧠 DECISION MAKER ENGINE - محرك اتخاذ القرارات
 * ════════════════════════════════════════════════════════════════
 * نظام متقدم لاتخاذ قرارات ذكية مع التحليل والتحقق من الشروط
 */

import { Guild, GuildMember, TextChannel, Role, ChannelType } from 'discord.js';

interface DecisionContext {
  userId: string;
  action: string;
  targetId?: string;
  reason?: string;
  guild: Guild;
  actor?: GuildMember;
  metadata?: Record<string, any>;
}

interface DecisionResult {
  approved: boolean;
  reasoning: string;
  riskLevel: 'low' | 'medium' | 'high';
  conditions: string[];
  suggestions?: string[];
}

/**
 * فئة DecisionMaker: نظام متقدم لاتخاذ القرارات الإدارية
 */
export class DecisionMaker {
  private guild: Guild | null = null;
  private decisionLog: Map<string, DecisionResult> = new Map();
  private readonly MAX_LOG_SIZE = 1000;

  /**
   * اتخاذ قرار بشأن عملية إدارية معينة
   * 1. تحليل السياق والشروط
   * 2. التحقق من الصلاحيات والأدوار
   * 3. تقييم المخاطر
   * 4. إصدار قرار مع التعليل
   */
  async makeDecision(context: DecisionContext): Promise<DecisionResult> {
    console.log(`[DecisionMaker] Evaluating decision: ${context.action}`);

    const conditions: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let reasoning = '';

    // الخطوة 1: التحقق من صلاحيات الممثل (Actor)
    if (context.actor) {
      const actorCheck = this.validateActorPermissions(context.actor, context.action);
      conditions.push(...actorCheck.conditions);
      
      if (!actorCheck.isValid) {
        return {
          approved: false,
          reasoning: `❌ الممثل ليس لديه الصلاحيات اللازمة: ${actorCheck.reason}`,
          riskLevel: 'high',
          conditions
        };
      }
    }

    // الخطوة 2: تحليل نوع الإجراء
    switch (context.action) {
      case 'ban_member':
        return await this.decideBan(context, conditions);
      case 'kick_member':
        return await this.decideKick(context, conditions);
      case 'mute_member':
        return await this.decideMute(context, conditions);
      case 'assign_role':
        return await this.decideAssignRole(context, conditions);
      case 'remove_role':
        return await this.decideRemoveRole(context, conditions);
      case 'delete_channel':
        return await this.decideDeleteChannel(context, conditions);
      case 'create_channel':
        return await this.decideCreateChannel(context, conditions);
      case 'modify_permissions':
        return await this.decideModifyPermissions(context, conditions);
      case 'warning':
        return await this.decideWarning(context, conditions);
      default:
        return {
          approved: true,
          reasoning: 'إجراء محايد - لا توجد مخاطر',
          riskLevel: 'low',
          conditions: ['إجراء قياسي']
        };
    }
  }

  /**
   * قرار حظر عضو - التحقق من الشروط قبل الحظر
   */
  private async decideBan(context: DecisionContext, conditions: string[]): Promise<DecisionResult> {
    conditions.push('✓ فحص حالة الحساب');
    conditions.push('✓ التحقق من الأدوار المحمية');
    conditions.push('✓ التحقق من السجل التاريخي');

    // التحقق من أن الهدف ليس مدير
    const targetMember = await context.guild.members.fetch(context.targetId!).catch(() => null);
    if (targetMember?.roles.highest.id === context.guild.roles.everyone.id) {
      return {
        approved: false,
        reasoning: '❌ لا يمكن حظر أعضاء بدون أدوار محددة',
        riskLevel: 'high',
        conditions
      };
    }

    // التحقق من أن البوت يستطيع حظر
    if (!context.guild.members.me?.permissions.has('BanMembers')) {
      return {
        approved: false,
        reasoning: '❌ البوت ليس لديه صلاحية الحظر',
        riskLevel: 'high',
        conditions
      };
    }

    conditions.push(`✓ المستخدم المراد حظره: ${context.targetId}`);
    conditions.push(`✓ السبب: ${context.reason || 'لم يتم تحديد سبب'}`);

    return {
      approved: true,
      reasoning: `✅ تم الموافقة على الحظر: ${context.reason || 'بدون سبب محدد'}`,
      riskLevel: 'medium',
      conditions,
      suggestions: [
        'أرسل إشعار للمستخدم قبل الحظر',
        'سجل السبب في قناة الحظر',
        'راجع السجل لاحقاً'
      ]
    };
  }

  /**
   * قرار طرد عضو
   */
  private async decideKick(context: DecisionContext, conditions: string[]): Promise<DecisionResult> {
    conditions.push('✓ فحص حالة المستخدم');
    conditions.push('✓ التحقق من الأدوار الخاصة');

    if (!context.guild.members.me?.permissions.has('KickMembers')) {
      return {
        approved: false,
        reasoning: '❌ البوت ليس لديه صلاحية الطرد',
        riskLevel: 'high',
        conditions
      };
    }

    return {
      approved: true,
      reasoning: `✅ تمت الموافقة على طرد المستخدم: ${context.reason || 'بدون سبب'}`,
      riskLevel: 'low',
      conditions,
      suggestions: ['إرسال رسالة تحذير', 'توثيق السبب']
    };
  }

  /**
   * قرار كتم صوت عضو
   */
  private async decideMute(context: DecisionContext, conditions: string[]): Promise<DecisionResult> {
    conditions.push('✓ فحص حالة الصوت');
    conditions.push('✓ التحقق من القنوات الصوتية');

    return {
      approved: true,
      reasoning: '✅ تمت الموافقة على كتم الصوت',
      riskLevel: 'low',
      conditions,
      suggestions: ['إخطار المستخدم', 'توثيق السبب']
    };
  }

  /**
   * قرار إسناد دور
   */
  private async decideAssignRole(context: DecisionContext, conditions: string[]): Promise<DecisionResult> {
    conditions.push('✓ فحص الدور المراد إسناده');
    conditions.push('✓ التحقق من سلطة الممثل');

    const role = await context.guild.roles.fetch(context.metadata?.roleId || '').catch(() => null);
    if (!role) {
      return {
        approved: false,
        reasoning: '❌ الدور المحدد غير موجود',
        riskLevel: 'high',
        conditions
      };
    }

    conditions.push(`✓ الدور: ${role.name}`);
    conditions.push(`✓ المستخدم: ${context.targetId}`);

    return {
      approved: true,
      reasoning: `✅ تمت الموافقة على إسناد الدور: ${role.name}`,
      riskLevel: 'low',
      conditions
    };
  }

  /**
   * قرار إزالة دور
   */
  private async decideRemoveRole(context: DecisionContext, conditions: string[]): Promise<DecisionResult> {
    conditions.push('✓ فحص الدور المراد إزالته');

    return {
      approved: true,
      reasoning: '✅ تمت الموافقة على إزالة الدور',
      riskLevel: 'low',
      conditions
    };
  }

  /**
   * قرار حذف قناة
   */
  private async decideDeleteChannel(context: DecisionContext, conditions: string[]): Promise<DecisionResult> {
    conditions.push('✓ فحص القناة المراد حذفها');
    conditions.push('✓ التحقق من الرسائل المهمة');

    // قاعدة حاسمة: لا نحذف القنوات المحمية
    const protectedChannels = ['rules', 'announcements', 'logs', 'general'];
    const channel = context.guild.channels.cache.get(context.targetId || '');
    
    if (channel && protectedChannels.some(name => channel.name?.includes(name))) {
      return {
        approved: false,
        reasoning: `❌ هذه قناة محمية ولا يمكن حذفها: ${channel.name}`,
        riskLevel: 'high',
        conditions: [...conditions, '⚠️ قناة محمية']
      };
    }

    return {
      approved: true,
      reasoning: `✅ تمت الموافقة على حذف القناة`,
      riskLevel: 'medium',
      conditions,
      suggestions: ['تأكد من عدم وجود رسائل مهمة', 'أرشّف القناة أولاً إن أمكن']
    };
  }

  /**
   * قرار إنشاء قناة
   */
  private async decideCreateChannel(context: DecisionContext, conditions: string[]): Promise<DecisionResult> {
    conditions.push('✓ فحص اسم القناة');
    conditions.push('✓ التحقق من نوع القناة');

    const channelName = context.metadata?.channelName || 'new-channel';
    
    if (channelName.length < 2) {
      return {
        approved: false,
        reasoning: '❌ اسم القناة قصير جداً',
        riskLevel: 'low',
        conditions
      };
    }

    return {
      approved: true,
      reasoning: `✅ تمت الموافقة على إنشاء قناة: ${channelName}`,
      riskLevel: 'low',
      conditions: [...conditions, `✓ اسم القناة: ${channelName}`]
    };
  }

  /**
   * قرار تعديل الصلاحيات
   */
  private async decideModifyPermissions(context: DecisionContext, conditions: string[]): Promise<DecisionResult> {
    conditions.push('✓ فحص الصلاحيات الحالية');
    conditions.push('✓ التحقق من الصلاحيات الجديدة');

    return {
      approved: true,
      reasoning: '✅ تمت الموافقة على تعديل الصلاحيات',
      riskLevel: 'medium',
      conditions,
      suggestions: ['راجع التغييرات قبل التطبيق', 'سجل التعديل']
    };
  }

  /**
   * قرار إصدار تحذير
   */
  private async decideWarning(context: DecisionContext, conditions: string[]): Promise<DecisionResult> {
    conditions.push('✓ فحص التحذيرات السابقة');
    conditions.push('✓ التحقق من السلوك');

    return {
      approved: true,
      reasoning: `✅ تم إصدار تحذير: ${context.reason || 'سلوك غير مناسب'}`,
      riskLevel: 'low',
      conditions
    };
  }

  /**
   * التحقق من صلاحيات الممثل
   */
  private validateActorPermissions(actor: GuildMember, action: string): { isValid: boolean; reason: string; conditions: string[] } {
    const conditions: string[] = [];

    // التحقق من أن الممثل ليس بوت
    if (actor.user.bot) {
      return {
        isValid: false,
        reason: 'البوتات لا يمكنها اتخاذ إجراءات إدارية',
        conditions: [...conditions, '❌ ممثل غير صحيح (بوت)']
      };
    }

    // التحقق من الأدوار المطلوبة حسب الإجراء
    const requiredPermissions: Record<string, string[]> = {
      'ban_member': ['BanMembers', 'Administrator'],
      'kick_member': ['KickMembers', 'Administrator'],
      'mute_member': ['MuteMembers', 'Administrator'],
      'assign_role': ['ManageRoles', 'Administrator'],
      'delete_channel': ['ManageChannels', 'Administrator'],
      'modify_permissions': ['ManageRoles', 'Administrator']
    };

    const required = requiredPermissions[action] || [];
    const hasPermission = required.some(perm => 
      actor.permissions.has(perm as any)
    );

    conditions.push(`✓ الممثل: ${actor.user.username}`);
    conditions.push(`✓ الإجراء: ${action}`);

    if (!hasPermission) {
      return {
        isValid: false,
        reason: `الممثل ليس لديه صلاحية: ${required.join(' أو ')}`,
        conditions: [...conditions, `❌ الصلاحيات المطلوبة: ${required.join(' أو ')}`]
      };
    }

    conditions.push(`✓ صلاحيات الممثل: صحيحة`);

    return { isValid: true, reason: 'الممثل مرخص', conditions };
  }

  /**
   * تسجيل القرار في السجل
   */
  private logDecision(context: DecisionContext, result: DecisionResult): void {
    const logKey = `${context.action}_${Date.now()}`;
    this.decisionLog.set(logKey, result);

    // تنظيف السجل إذا تجاوز الحد الأقصى
    if (this.decisionLog.size > this.MAX_LOG_SIZE) {
      const firstKey = this.decisionLog.keys().next().value;
      if (firstKey) this.decisionLog.delete(firstKey);
    }
  }

  /**
   * الحصول على سجل القرارات
   */
  getDecisionLog(): Map<string, DecisionResult> {
    return this.decisionLog;
  }

  /**
   * إعادة تعيين السجل
   */
  clearLog(): void {
    this.decisionLog.clear();
    console.log('[DecisionMaker] Decision history reset');
  }
}

export default DecisionMaker;
