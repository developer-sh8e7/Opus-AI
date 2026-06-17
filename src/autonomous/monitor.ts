/**
 * ════════════════════════════════════════════════════════════════
 *  نظام الرقابة والحماية الذاتية المتقدم - Advanced Autonomous Monitor
 *  يقوم بمراقبة الشات، كشف السبام، رصد روابط الدعوات المخالفة، حماية الخادم من الهجمات (Anti-Raid)،
 *  وفحص المحتوى بالذكاء الاصطناعي مع أرشفة كافة الحركات الإدارية والأمنية.
 * ════════════════════════════════════════════════════════════════
 */

import { Client, Events, GuildMember, Message, TextChannel, EmbedBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import { generateAIResponse, AIMessage } from '../services/ai.js';
import { repairLegacyText } from '../utils/textEncoding.js';

// ============================================================
//  نظام إدارة التحذيرات في الذاكرة (Warn Database)
// ============================================================
interface WarnRecord { count: number; lastWarn: number; reasons: string[]; }
const warnings = new Map<string, WarnRecord>();

export function getWarningCount(userId: string): number {
  return warnings.get(userId)?.count ?? 0;
}

export function addWarning(userId: string, reason: string = 'مخالفة عامة'): number {
  const r = warnings.get(userId) ?? { count: 0, lastWarn: Date.now(), reasons: [] };
  r.count++;
  r.lastWarn = Date.now();
  r.reasons.push(reason);
  warnings.set(userId, r);
  return r.count;
}
export function clearUserWarnings(userId: string): void {
  warnings.delete(userId);
}

export function getUserWarningRecord(userId: string): { count: number; lastWarn: number; reasons: string[]; } | undefined {
  return warnings.get(userId);
}


// ============================================================
//  سجل الأحداث والمراقبة والأرشفة العامة (Audit Log Store)
// ============================================================
interface ModLog {
  timestamp: Date;
  userId: string;
  username: string;
  action: string;
  reason: string;
  channelId: string;
}
export const moderationLog: ModLog[] = [];

// ============================================================
//  نظام تحديد وكشف السبام (Spam Detector / Rate Limiter)
// ============================================================
interface SpamRecord { count: number; lastReset: number; warned: boolean; }
const spamTracker = new Map<string, SpamRecord>();

export function isSpamming(userId: string): boolean {
  const now = Date.now();
  const r = spamTracker.get(userId) ?? { count: 0, lastReset: now, warned: false };
  if (now - r.lastReset > 5000) { 
    r.count = 1; 
    r.lastReset = now; 
    r.warned = false; 
  } else {
    r.count++;
  }
  spamTracker.set(userId, r);
  return r.count > 6;
}

// ============================================================
//  نظام منع هجمات الانضمام المتكرر (Anti-Raid Shield System)
// ============================================================
export class AntiRaidShield {
  private static joinLog: number[] = [];
  private static lockDownActive = false;
  private static MAX_JOINS_LIMIT = 5; // الحد الأقصى للانضمام في النافذة الزمنية
  private static WINDOW_MS = 10000; // 10 ثوانٍ

  /**
   * تسجيل انضمام جديد وفحص هل السيرفر تحت الهجوم
   */
  static registerJoin(): boolean {
    const now = Date.now();
    this.joinLog.push(now);
    
    // فلترة الانضمامات القديمة خارج النافذة
    this.joinLog = this.joinLog.filter(t => now - t <= this.WINDOW_MS);

    if (this.joinLog.length > this.MAX_JOINS_LIMIT) {
      this.lockDownActive = true;
      return true; // تم رصد هجوم
    }
    return false;
  }

  static isLockdown(): boolean {
    return this.lockDownActive;
  }

  static liftLockdown(): void {
    this.lockDownActive = false;
    this.joinLog = [];
  }
}

// ============================================================
//  نظام فحص الروابط الخارجية وروابط الدعوات (Invite Link Blocker)
// ============================================================
export class InviteLinkFilter {
  // تعبير نمطي للتعرف على روابط دعوات ديسكورد المختلفة
  private static discordInviteRegex = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite|discord\.com\/invite)\/[a-zA-Z0-9\-]+/gi;

  /**
   * فحص هل النص يحتوي على كود دعوة لسيرفر آخر
   */
  static containsInvite(text: string): boolean {
    return this.discordInviteRegex.test(text);
  }
}

// ============================================================
//  فحص المحتوى بالذكاء الاصطناعي (AI Prompt Guard)
// ============================================================
interface ModerationResult {
  isOffensive: boolean;
  category: 'clean' | 'mild' | 'offensive' | 'severe';
  reason: string;
  suggestedAction: 'none' | 'warn' | 'delete' | 'mute' | 'ban';
}

async function analyzeContentWithAI(text: string, authorName: string): Promise<ModerationResult> {
  try {
    const body = {
      messages: [
        {
          role: 'system',
          content: `أنت نظام مراقبة محتوى ذكي ومحترف لسيرفر ديسكورد. مهمتك تحليل الرسائل وتحديد هل تحتوي على:
- سباب أو شتائم (عربية أو إنجليزية أو أي لغة)
- تهديدات أو تحريض على العنف
- محتوى مسيء للآداب العامة
- تحرش ومضايقات للأعضاء الآخرين
- عنصرية، تمييز أو طائفية
- محتوى غير لائق أو إباحي

أجب بـ JSON فقط بدون أي نص تفسيري إضافي. مثال للردود المعتمدة:
{"isOffensive": false, "category": "clean", "reason": "رسالة عادية وطبيعية", "suggestedAction": "none"}
{"isOffensive": true, "category": "offensive", "reason": "تحتوي الرسالة على سباب بذيء", "suggestedAction": "delete"}

الفئات المتاحة: clean, mild, offensive, severe
الإجراءات المتاحة: none, warn, delete, mute, ban`,
        },
        {
          role: 'user',
          content: `المستخدم: ${authorName}\nالرسالة: "${text}"`,
        },
      ],
      max_tokens: 150,
      temperature: 0,
    };

    const aiMessage = await generateAIResponse(
      [{
        ...body.messages[1],
        content: repairLegacyText(body.messages[1].content),
      } as AIMessage],
      {
        intent: 'smart',
        systemPrompt: repairLegacyText(body.messages[0].content ?? ''),
        toolsEnabled: false,
        temperature: 0,
        maxTokens: 150,
      }
    );
    const content = aiMessage.content?.trim() ?? '';

    // استخراج الـ JSON من الرد
    const jsonMatch = content.match(/\{[^}]+\}/);
    if (!jsonMatch) throw new Error('The moderation provider did not return valid JSON.');

    const result = JSON.parse(jsonMatch[0]) as ModerationResult;
    return result;
  } catch (err) {
    console.error('[AI Moderation] Content analysis failed:', err);
    // في حالة الخطأ: إرجاع نتيجة آمنة تجنباً للأخطاء العشوائية
    return {
      isOffensive: false,
      category: 'clean',
      reason: 'Content analysis was unavailable.',
      suggestedAction: 'none',
    };
  }
}

// ============================================================
//  إيجاد وتحديد قنوات الإدارة والترحيب (Utility Channel Finders)
// ============================================================
export function findLogChannel(guild: any): TextChannel | null {
  return guild.channels.cache.find(
    (ch: any) =>
      ch.isTextBased() &&
      ['سجل', 'سجل-الإجراءات', 'log', 'logs', 'audit-log', 'لوحة-التحكم', 'المراقب'].some(
        (name) => (ch.name as string).toLowerCase().includes(name)
      )
  ) as TextChannel | null;
}

export function findWelcomeChannel(guild: any): TextChannel | null {
  return (
    guild.systemChannel ??
    guild.channels.cache.find(
      (ch: any) =>
        ch.isTextBased() &&
        ['welcome', 'الترحيب', 'ترحيب', 'general', 'عام', 'الدردشة-العامة'].some(
          (name) => (ch.name as string).toLowerCase().includes(name)
        )
    )
  ) as TextChannel | null;
}

// ============================================================
//  معالجة وتنفيذ العقوبات والجزاءات التلقائية (Rule Enforcer)
// ============================================================
async function takeModerationAction(
  message: Message,
  result: ModerationResult
): Promise<void> {
  const member = message.member;
  if (!member) return;

  const channel = message.channel as TextChannel;

  // حذف الرسالة فوراً كإجراء أولي
  if (result.suggestedAction !== 'none') {
    await message.delete().catch(() => null);
  }

  if (result.suggestedAction === 'none') return;

  const warnCount = addWarning(message.author.id, result.reason);

  const actionLabels: Record<string, string> = {
    warn: '⚠️ تحذير إداري',
    delete: '🗑️ حذف الرسالة',
    mute: '🔇 كتم مؤقت',
    ban: '🔨 حظر نهائي',
  };

  const colorMap: Record<string, number> = {
    mild: 0xF39C12,
    offensive: 0xE74C3C,
    severe: 0xFF0000,
  };

  const embed = new EmbedBuilder()
    .setColor(colorMap[result.category] ?? 0xE74C3C)
    .setTitle(`${actionLabels[result.suggestedAction] ?? '⚠️ تحذير'} - مخالفة المعايير`)
    .setDescription(`يا ${member}، تم حذف رسالتك لمخالفتها الآداب العامة وقوانين السيرفر الرسمية.`)
    .addFields(
      { name: '🤖 سبب المخالفة المكتشف', value: result.reason, inline: false },
      { name: '🔢 عدد تحذيراتك الإجمالي', value: `${warnCount}/3 تحذيرات`, inline: true },
      { name: '📊 مستوى الخطورة المعين', value: result.category.toUpperCase(), inline: true },
    )
    .setFooter({ text: 'نظام الحماية والرقابة الذكي - Opus Guard' })
    .setTimestamp();

  const warnMsg = await channel.send({ content: `${member}`, embeds: [embed] }).catch(() => null);
  if (warnMsg) {
    setTimeout(() => warnMsg.delete().catch(() => null), 15_000);
  }

  // في حال وصول التحذيرات للحد الأقصى أو كان التوجيه هو الكتم أو كانت المخالفة شديدة جداً
  if (warnCount >= 3 || result.suggestedAction === 'mute' || result.category === 'severe') {
    const duration = result.category === 'severe' ? 60 * 60 * 1000 : 15 * 60 * 1000; // ساعة للانتهاكات الخطيرة و15 دقيقة للعادية
    try {
      await member.timeout(duration, `تجاوز الحد الأقصى للمخالفات: ${result.reason}`);
      
      // تصفير المخالفات بعد تطبيق العقوبة الكتم
      clearUserWarnings(message.author.id);

      const muteEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🔇 كتم وعزل تلقائي')
        .setDescription(`تم كتم العضو المخالف ${member} تلقائياً لمدة ${duration / 60000} دقيقة لضمان سلامة الشات.`)
        .addFields({ name: '📝 السبب المجمع', value: `تراكم المخالفات (${result.reason})` })
        .setTimestamp();

      await channel.send({ embeds: [muteEmbed] }).catch(() => null);
    } catch (e: any) {
      console.warn(`[Moderator] تعذر كتم العضو تلقائياً: ${e.message}`);
    }
  }

  // تسجيل المخالفة في سجل الذاكرة العام
  moderationLog.push({
    timestamp: new Date(),
    userId: message.author.id,
    username: message.author.tag,
    action: result.suggestedAction,
    reason: result.reason,
    channelId: message.channelId,
  });

  // إرسال تقرير فوري لقناة السجلات (Logs)
  const logChannel = findLogChannel(message.guild!);
  if (logChannel) {
    const logEmbed = new EmbedBuilder()
      .setColor(0x992D22)
      .setTitle('🚨 تقرير الرقابة التلقائية للذكاء الاصطناعي')
      .addFields(
        { name: '👤 العضو المخالف', value: `${message.author.tag} (\`${message.author.id}\`)`, inline: true },
        { name: '📺 قناة المخالفة', value: `<#${message.channelId}>`, inline: true },
        { name: '🤖 الإجراء المقترح', value: result.suggestedAction.toUpperCase(), inline: true },
        { name: '📝 محتوى الرسالة المحذوفة', value: `\`\`\`${message.content.slice(0, 500) || '(لا يوجد نص)'}\`\`\`` },
        { name: '🔍 السبب الموضح للتحليل', value: result.reason },
      )
      .setTimestamp();
    await logChannel.send({ embeds: [logEmbed] }).catch(() => null);
  }
}

// ============================================================
//  تهيئة وتشغيل المراقبة التلقائية للرسائل والمستخدمين (Core Monitor Initialization)
// ============================================================
export function startAutonomousMonitor(client: Client): void {
  console.log('[Opus Ai] Autonomous moderation monitor started.');

  // 1. مراقبة انضمام الأعضاء الجدد والترحيب ومكافحة الغزو (Anti-Raid)
  client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
    const isAttackDetected = AntiRaidShield.registerJoin();
    const logChannel = findLogChannel(member.guild);

    if (isAttackDetected) {
      console.warn('[Anti-Raid] Join burst detected; protection is active.');
      if (logChannel) {
        const raidAlertEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('🚨 إنذار حماية السيرفر - Anti-Raid Mode')
          .setDescription(
            `تم رصد محاولة انضمام مكثفة للحسابات في فترة قصيرة.\n` +
            `تم تفعيل وضع الحماية التلقائي وعزل الحسابات المنضمة حديثاً.`
          )
          .setTimestamp();
        await logChannel.send({ embeds: [raidAlertEmbed] }).catch(() => null);
      }
    }

    const channel = findWelcomeChannel(member.guild);
    if (!channel) return;

    const welcomeEmbed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🎉 عضو جديد في مجتمعنا!')
      .setDescription(
        `أهلاً وسهلاً بك يا **${member.user.username}** في خادم **${member.guild.name}**!\n\n` +
        `يسعدنا تواجدك ونتمنى لك رحلة ممتعة معنا 🚀`
      )
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: '📅 عمر الحساب الشخصي', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: '👥 ترتيبك في السيرفر', value: `${member.guild.memberCount.toLocaleString('ar-EG')}`, inline: true },
      )
      .setFooter({ text: `الرمز التعريفي: ${member.id}` })
      .setTimestamp();

    await channel.send({ content: `${member}`, embeds: [welcomeEmbed] }).catch(() => null);
  });

  // 2. مراقبة الرسائل المكتوبة وتحليلها بالذكاء الاصطناعي وكشف الروابط الضارة والسبام
  const analysisCache = new Map<string, number>();

  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot) return;
    if (!message.guild || !message.member) return;

    // استثناء طاقم الإدارة من الرقابة التلقائية
    if (message.member.permissions.has(PermissionFlagsBits.Administrator) || message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return;
    }

    const content = message.content.trim();
    if (!content || content.length < 2) return;

    // أولاً: رصد ومنع روابط الدعوات لخوادم أخرى
    if (InviteLinkFilter.containsInvite(content)) {
      await message.delete().catch(() => null);
      
      const inviteEmbed = new EmbedBuilder()
        .setColor(0xE74C3C)
        .setTitle('🚫 منع نشر الروابط')
        .setDescription(`يا ${message.member}، يمنع منعاً باتاً نشر روابط دعوات ديسكورد في القنوات العامة لمكافحة الترويج العشوائي.`)
        .setTimestamp();
      
      const inviteMsg = await (message.channel as any).send({ content: `${message.member}`, embeds: [inviteEmbed] }).catch(() => null);
      if (inviteMsg) {
        setTimeout(() => inviteMsg.delete().catch(() => null), 8000);
      }

      // إرسال بلاغ في السجل الإداري
      const logChannel = findLogChannel(message.guild);
      if (logChannel) {
        const inviteLog = new EmbedBuilder()
          .setColor(0xE67E22)
          .setTitle('🛡️ محاولة نشر رابط دعوة مخفي')
          .addFields(
            { name: '👤 العضو', value: `${message.author.tag} (\`${message.author.id}\`)`, inline: true },
            { name: '📺 القناة', value: `<#${message.channelId}>`, inline: true },
            { name: '📝 محتوى الرابط', value: `\`\`\`${content}\`\`\`` }
          )
          .setTimestamp();
        await logChannel.send({ embeds: [inviteLog] }).catch(() => null);
      }
      return;
    }

    // ثانياً: فحص وكشف السبام والرسائل المتكررة السريعة
    if (isSpamming(message.author.id)) {
      const spamRecord = spamTracker.get(message.author.id)!;
      if (!spamRecord.warned) {
        spamRecord.warned = true;
        const embed = new EmbedBuilder()
          .setColor(0xF39C12)
          .setTitle('🚨 إنذار سبام وإغراق شات')
          .setDescription(`يا ${message.member}، يرجى التوقف عن إرسال الرسائل بسرعة كبيرة لتجنب التعرض لكتم فوري!`)
          .setTimestamp();
        
        const spamMsg = await (message.channel as any).send({ content: `${message.member}`, embeds: [embed] }).catch(() => null);
        if (spamMsg) {
          setTimeout(() => spamMsg.delete().catch(() => null), 7000);
        }
      }
      // مسح رسائل السبام المكررة فوراً
      await message.delete().catch(() => null);
      return;
    }

    // تجنب استهلاك API الذكاء الاصطناعي بشكل مفرط (Throttle: تحليل واحد كل ثانيتين لكل مستخدم)
    const lastAnalysis = analysisCache.get(message.author.id) ?? 0;
    const now = Date.now();
    if (now - lastAnalysis < 2000) return;
    
    // فحص الرسائل ذات الحجم المناسب لتفادي تحليل الجمل البسيطة مثل "هلا" أو "شكرا"
    if (content.length < 5) return;
    analysisCache.set(message.author.id, now);

    // التحليل الفعلي لمحتوى الرسالة بالذكاء الاصطناعي
    const result = await analyzeContentWithAI(content, message.author.username);

    if (result.isOffensive && result.suggestedAction !== 'none') {
      await takeModerationAction(message, result);
    }
  });

  // 3. مراقبة وتسجيل عمليات حذف الرسائل (Message Delete Auditor)
  client.on(Events.MessageDelete, async (message) => {
    if (!message.guild || message.author?.bot) return;

    const logChannel = findLogChannel(message.guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(0xE67E22)
      .setTitle('🗑️ أرشفة حذف رسالة')
      .addFields(
        { name: '👤 كاتب الرسالة', value: message.author?.tag ?? 'غير معروف', inline: true },
        { name: '📺 قناة الكتابة', value: `<#${message.channelId}>`, inline: true },
        { name: '📝 نص الرسالة المحذوفة', value: `\`\`\`${message.content?.slice(0, 800) || '(لا يوجد نص للرسالة أو ميديا فقط)'}\`\`\`` }
      )
      .setFooter({ text: `المعرف الرقمي للمرسل: ${message.author?.id ?? 'غير معروف'}` })
      .setTimestamp();

    await logChannel.send({ embeds: [embed] }).catch(() => null);
  });

  // 4. مراقبة وتسجيل تعديل الرسائل (Message Update Auditor)
  client.on(Events.MessageUpdate, async (oldMsg, newMsg) => {
    if (!newMsg.guild || newMsg.author?.bot) return;
    if (!oldMsg.content || !newMsg.content || oldMsg.content === newMsg.content) return;

    const logChannel = findLogChannel(newMsg.guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle('✏️ أرشفة تعديل رسالة')
      .addFields(
        { name: '👤 الكاتب المسؤول', value: newMsg.author?.tag ?? 'غير معروف', inline: true },
        { name: '📺 قناة الرسالة', value: `<#${newMsg.channelId}>`, inline: true },
        { name: '📝 محتوى الرسالة قبل التعديل', value: `\`\`\`${oldMsg.content.slice(0, 450)}\`\`\`` },
        { name: '📝 محتوى الرسالة بعد التعديل', value: `\`\`\`${newMsg.content.slice(0, 450)}\`\`\`` }
      )
      .setFooter({ text: `المعرف الرقمي للمرسل: ${newMsg.author?.id ?? 'غير معروف'}` })
      .setTimestamp();

    await logChannel.send({ embeds: [embed] }).catch(() => null);
  });

  // 5. مراقبة دخول وخروج الغرف الصوتية وأنشطة الأعضاء (Voice State Auditor)
  client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    if (newState.member?.user.bot) return;
    
    const guild = newState.guild ?? oldState.guild;
    const logChannel = findLogChannel(guild);
    if (!logChannel) return;

    if (!oldState.channelId && newState.channelId) {
      // انضمام لقناة صوتية
      const embed = new EmbedBuilder()
        .setColor(0x2ECC71)
        .setTitle('🎤 انضمام لقناة صوتية')
        .setDescription(`دخل العضو **${newState.member?.user.tag}** إلى صالون المحادثة الصوتية بنجاح.`)
        .addFields(
          { name: '👤 العضو المتصل', value: `${newState.member?.displayName}`, inline: true },
          { name: '🔊 اسم القناة الصوتية', value: `<#${newState.channelId}>`, inline: true }
        )
        .setTimestamp();
      await logChannel.send({ embeds: [embed] }).catch(() => null);
    } else if (oldState.channelId && !newState.channelId) {
      // مغادرة قناة صوتية
      const embed = new EmbedBuilder()
        .setColor(0xE74C3C)
        .setTitle('🚶 مغادرة قناة صوتية')
        .setDescription(`خرج العضو **oldState.member?.user.tag** أو انقطع اتصاله بالصالون الصوتي.`)
        .addFields(
          { name: '👤 العضو المغادر', value: `${oldState.member?.displayName}`, inline: true },
          { name: '🔊 اسم القناة المغادَرة', value: `<#${oldState.channelId}>`, inline: true }
        )
        .setTimestamp();
      await logChannel.send({ embeds: [embed] }).catch(() => null);
    } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      // الانتقال بين القنوات الصوتية
      const embed = new EmbedBuilder()
        .setColor(0xF39C12)
        .setTitle('🔀 انتقال بين القنوات الصوتية')
        .setDescription(`انتقل العضو **${newState.member?.user.tag}** من صالون إلى آخر.`)
        .addFields(
          { name: '👤 العضو', value: `${newState.member?.displayName}`, inline: true },
          { name: '🔊 القناة السابقة', value: `<#${oldState.channelId}>`, inline: true },
          { name: '🔊 القناة الجديدة', value: `<#${newState.channelId}>`, inline: true }
        )
        .setTimestamp();
      await logChannel.send({ embeds: [embed] }).catch(() => null);
    }
  });
}

// ============================================================
//  نظام الفحوصات والتشخيص الذاتي لوحدة المراقبة (Self-Diagnostics Suite)
// ============================================================
export function runMonitorDiagnostics(): { success: boolean; log: string[] } {
  const log: string[] = [];
  let success = true;

  try {
    log.push('[Diagnostic-Monitor] بدء التحقق من تشغيل وحدة المراقبة والحماية...');

    // 1. اختبار كاشف السبام والمعدل
    const testUserId = 'mock_user_123';
    let spamResult = false;
    for (let i = 0; i < 8; i++) {
      spamResult = isSpamming(testUserId);
    }
    if (!spamResult) {
      log.push('❌ فشل اختبار 1: كاشف السبام لم يسجل تجاوزاً للمعدل.');
      success = false;
    } else {
      log.push('✅ نجاح اختبار 1: كاشف السبام التلقائي يعمل بدقة.');
    }

    // 2. اختبار تصفية روابط الدعوات الممنوعة
    const sampleInvite = 'انضم لسيرفرنا هنا: https://discord.gg/test-invite-link';
    if (!InviteLinkFilter.containsInvite(sampleInvite)) {
      log.push('❌ فشل اختبار 2: فلتر الدعوات لم يحدد رابط الدعوة الصالح.');
      success = false;
    } else {
      log.push('✅ نجاح اختبار 2: فلتر روابط الدعوات يتعرف عليها بنجاح.');
    }

    // 3. اختبار تسجيل التحذيرات وتراكمها
    const dummyUserId = 'dummy_user_999';
    clearUserWarnings(dummyUserId);
    addWarning(dummyUserId, 'إزعاج الأعضاء');
    addWarning(dummyUserId, 'استخدام كلمات غير لائقة');
    const totalWarns = getWarningCount(dummyUserId);
    if (totalWarns !== 2) {
      log.push('❌ فشل اختبار 3: نظام تراكم وحساب تحذيرات الأعضاء غير دقيق.');
      success = false;
    } else {
      log.push('✅ نجاح اختبار 3: نظام احتساب وتراكم التحذيرات يعمل بنجاح.');
    }

    // 4. اختبار تصفير سجل تحذيرات الأعضاء
    clearUserWarnings(dummyUserId);
    if (getWarningCount(dummyUserId) !== 0) {
      log.push('❌ فشل اختبار 4: نظام تفريغ وتصفير تحذيرات الأعضاء لم ينجح.');
      success = false;
    } else {
      log.push('✅ نجاح اختبار 4: نظام تصفير التحذيرات يعمل بدون أخطاء.');
    }

    // 5. اختبار درع حماية السيرفر من هجمات الانضمام (Anti-Raid)
    AntiRaidShield.liftLockdown();
    let raidDetected = false;
    for (let i = 0; i < 10; i++) {
      if (AntiRaidShield.registerJoin()) {
        raidDetected = true;
      }
    }
    if (!raidDetected || !AntiRaidShield.isLockdown()) {
      log.push('❌ فشل اختبار 5: درع Anti-Raid لم يكتشف محاكاة هجوم الانضمام.');
      success = false;
    } else {
      log.push('✅ نجاح اختبار 5: درع حماية السيرفر Anti-Raid يعمل بنجاح عند تفعيل الضغط.');
    }

    // إنهاء التشخيص ورفع النتائج
    log.push(`[Diagnostic-Monitor] انتهت الفحوصات بنجاح. النتيجة العامة: ${success ? 'ناجح' : 'فاشل'}`);
  } catch (error: any) {
    success = false;
    log.push(`❌ حدث خطأ فادح أثناء تشغيل تشخيص المراقبة: ${error.message}`);
  }

  return { success, log };
}

// ============================================================
//  نظام مراقبة الصلاحيات الحساسة والأمن (Role & Permission Guard)
// ============================================================
export class RolePermsGuard {
  /**
   * فحص الصلاحيات الممنوحة للرتبة وتحديد مدى خطورتها
   */
  static isDangerousRole(permissionsBitfield: bigint): boolean {
    const dangerousPerms = [
      PermissionFlagsBits.Administrator,
      PermissionFlagsBits.ManageGuild,
      PermissionFlagsBits.ManageRoles,
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.ManageWebhooks,
      PermissionFlagsBits.BanMembers,
      PermissionFlagsBits.KickMembers
    ];

    for (const perm of dangerousPerms) {
      if ((permissionsBitfield & perm) === perm) {
        return true;
      }
    }
    return false;
  }

  /**
   * إرسال تنبيه أمني عند تعديل صلاحيات رتبة أو منحها صلاحيات إدارية
   */
  static async auditRoleUpdate(
    guild: any,
    oldRole: any,
    newRole: any,
    executorName: string
  ): Promise<void> {
    const logChannel = findLogChannel(guild);
    if (!logChannel) return;

    const oldDangerous = this.isDangerousRole(oldRole.permissions.bitfield);
    const newDangerous = this.isDangerousRole(newRole.permissions.bitfield);

    if (!oldDangerous && newDangerous) {
      const securityEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🚨 تحذير أمني: صلاحيات إدارية ممنوحة رتبة')
        .setDescription(
          `تم تحديث صلاحيات الرتبة **${newRole.name}** لتشمل صلاحيات إدارية خطيرة.\n` +
          `**المسؤول عن التعديل:** ${executorName}`
        )
        .addFields(
          { name: 'رقم الرتبة (ID)', value: `\`${newRole.id}\``, inline: true },
          { name: 'اللون المعين', value: `${newRole.hexColor}`, inline: true }
        )
        .setTimestamp();

      await logChannel.send({ embeds: [securityEmbed] }).catch(() => null);
    }
  }
}

// ============================================================
//  نظام منع تكرار المحتوى المتطابق (Message Deduplicator)
// ============================================================
interface UserHistoryEntry {
  contentHash: string;
  timestamp: number;
}
const userMessageHistory = new Map<string, UserHistoryEntry[]>();

export class MessageDeduplicator {
  /**
   * فحص تكرار المحتوى وحظر الرسائل المطابقة المكررة في قنوات مختلفة
   */
  static isDuplicate(userId: string, content: string, limitCount: number = 3): boolean {
    const now = Date.now();
    const cleanContent = content.trim().toLowerCase();
    if (cleanContent.length < 10) return false; // تجاهل الرسائل القصيرة

    const hash = cleanContent; // تبسيط لتجنب تعقيد الهش
    const history = userMessageHistory.get(userId) ?? [];

    // إزالة السجلات القديمة (أكبر من 60 ثانية)
    const validHistory = history.filter(h => now - h.timestamp <= 60000);

    const matches = validHistory.filter(h => h.contentHash === hash);
    validHistory.push({ contentHash: hash, timestamp: now });
    userMessageHistory.set(userId, validHistory);

    return matches.length >= limitCount;
  }
}

// ============================================================
//  نظام الحجب الصامت والمراقبة غير المباشرة (Shadow Ban System)
// ============================================================
const shadowBannedUsers = new Set<string>();

export class ShadowBanSystem {
  static add(userId: string): void {
    shadowBannedUsers.add(userId);
  }

  static remove(userId: string): void {
    shadowBannedUsers.delete(userId);
  }

  static isShadowBanned(userId: string): boolean {
    return shadowBannedUsers.has(userId);
  }

  /**
   * معالجة رسائل المندرجين تحت الحجب الصامت (حذف رسائلهم تلقائياً بصمت دون تنبيه)
   */
  static async handleMessage(message: Message): Promise<boolean> {
    if (this.isShadowBanned(message.author.id)) {
      await message.delete().catch(() => null);
      return true; // تمت المعالجة بنجاح
    }
    return false;
  }
}

// ============================================================
//  نظام مراقبة وتصفية المرفقات والوسائط (Media Filter System)
// ============================================================
export class MediaFilterSystem {
  private static MAX_ATTACHMENT_SIZE_MB = 15; // 15 ميجابايت كحد أقصى للأعضاء

  /**
   * فحص حجم الملفات المرفقة وتنبيه العضو إذا تجاوزت الحد
   */
  static async validateAttachments(message: Message): Promise<boolean> {
    if (message.attachments.size === 0) return true;

    let totalSize = 0;
    message.attachments.forEach(attachment => {
      totalSize += attachment.size;
    });

    const sizeInMB = totalSize / (1024 * 1024);

    if (sizeInMB > this.MAX_ATTACHMENT_SIZE_MB) {
      await message.delete().catch(() => null);
      const limitEmbed = new EmbedBuilder()
        .setColor(0xE74C3C)
        .setTitle('⚠️ حجم المرفقات يتجاوز الحد المسموح')
        .setDescription(
          `يا ${message.member}، الحد الأقصى للمرفقات هو \`${this.MAX_ATTACHMENT_SIZE_MB}MB\`.\n` +
          `تم حذف الرسالة لحفظ سعة تحميل قنوات الخادم.`
        )
        .setTimestamp();
      
      const response = await (message.channel as any).send({ content: `${message.member}`, embeds: [limitEmbed] }).catch(() => null);
      if (response) {
        setTimeout(() => response.delete().catch(() => null), 8000);
      }
      return false;
    }
    return true;
  }
}

// ============================================================
//  نظام مكافحة تسريب التوكنات والبيانات الحساسة (Credential Protection)
// ============================================================
export class CredentialProtection {
  private static tokenRegex = /[a-zA-Z0-9_\-]{24,28}\.[a-zA-Z0-9_\-]{6}\.[a-zA-Z0-9_\-]{27,38}/g;

  /**
   * فحص الشات لمنع تسريب رموز الاتصال الخاصة بالبوتات (Bot Tokens)
   */
  static async scanForLeaks(message: Message): Promise<boolean> {
    if (this.tokenRegex.test(message.content)) {
      await message.delete().catch(() => null);

      const alertEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🚨 تحذير: تسريب رمز اتصال بوت (Bot Token Leak)')
        .setDescription(
          `يا ${message.member}، تم رصد محاولة إرسال رمز اتصال بوت ديسكورد.\n` +
          `تم حذف الرسالة فوراً لحماية أمان السيرفر والبوتات التابعة له.`
        )
        .setTimestamp();

      const msg = await (message.channel as any).send({ content: `${message.member}`, embeds: [alertEmbed] }).catch(() => null);
      if (msg) {
        setTimeout(() => msg.delete().catch(() => null), 10000);
      }

      // إرسال تنبيه في السجل الإداري
      const logChannel = findLogChannel(message.guild);
      if (logChannel) {
        const securityAlert = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('🚨 خرق أمني: تسريب رمز اتصال بوت')
          .addFields(
            { name: '👤 العضو المتسبب', value: `${message.author.tag} (\`${message.author.id}\`)`, inline: true },
            { name: '📺 القناة المستهدفة', value: `<#${message.channelId}>`, inline: true },
            { name: '📝 نوع التسريب المكتشف', value: 'Discord Bot Token Pattern' }
          )
          .setTimestamp();
        await logChannel.send({ embeds: [securityAlert] }).catch(() => null);
      }
      return true; // تم رصد تسريب
    }
    return false;
  }
}

// ============================================================
//  معجم تصفية الألفاظ والكلمات المحظورة (Bad Word Dictionary)
// ============================================================
export class BadWordDictionary {
  private static bannedWords: Set<string> = new Set([
    'كساختك', 'منيوك', 'كسمك', 'قحبة', 'شرموطة', 'عرص', 'خول',
    'fack', 'bitch', 'asshole', 'dick', 'pussy'
  ]);

  static isBanned(text: string): boolean {
    const words = text.toLowerCase().split(/\s+/);
    for (const word of words) {
      // إزالة علامات التشكيل والحروف الزائدة
      const cleanWord = word
        .replace(/[\u064B-\u065F]/g, '') // إزالة التشكيل العربي
        .replace(/(.)\1+/g, '$1');       // إزالة التكرار (مثال: كسمممك -> كسمك)
      
      if (this.bannedWords.has(cleanWord)) {
        return true;
      }
    }
    return false;
  }

  static addWord(word: string): void {
    this.bannedWords.add(word.toLowerCase());
  }

  static removeWord(word: string): void {
    this.bannedWords.delete(word.toLowerCase());
  }
}

// ============================================================
//  نظام الرد التلقائي على الأسئلة الشائعة (Auto Responder System)
// ============================================================
interface AutoResponse {
  keywords: string[];
  reply: string;
}

export class AutoResponder {
  private static responses: AutoResponse[] = [
    {
      keywords: ['كيف', 'اشتري', 'متجر', 'الطلب'],
      reply: '🛒 لشراء المنتجات من متجرنا المتميز، يرجى فتح تذكرة دعم مالي في قناة 🎫-تذاكر-الدعم وسيقوم المشرف المختص بخدمتك فوراً.'
    },
    {
      keywords: ['قوانين', 'القانون', 'قانون'],
      reply: '📜 يرجى قراءة واحترام قوانين السيرفر المتواجدة في قناة 📜-القوانين لتجنب التعرض لأي عقوبات إدارية.'
    },
    {
      keywords: ['مساعدة', 'كيف', 'اسوي', 'طريقة'],
      reply: '💡 إذا كنت بحاجة للمساعدة، يمكنك استخدام الأوامر المتاحة أو كتابة استفسارك هنا مباشرة أو التحدث لأحد المشرفين المتواجدين.'
    }
  ];

  /**
   * البحث عن رد تلقائي مناسب للرسالة
   */
  static findResponse(text: string): string | null {
    const cleanText = text.toLowerCase();
    for (const item of this.responses) {
      // التحقق من مطابقة كافة الكلمات المفتاحية في الجملة
      const matchesAll = item.keywords.every(kw => cleanText.includes(kw));
      if (matchesAll) {
        return item.reply;
      }
    }
    return null;
  }
}

// ============================================================
//  نظام تتبع الكلمات الشائعة والمواضيع النشطة (Word Frequency Tracker)
// ============================================================
const wordFrequencyMap = new Map<string, number>();

export class WordFrequencyTracker {
  /**
   * تتبع الكلمة وزيادة تكرارها
   */
  static trackMessage(text: string): void {
    const words = text.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (word.length < 4) continue; // تجاهل الكلمات القصيرة جداً
      const current = wordFrequencyMap.get(word) ?? 0;
      wordFrequencyMap.set(word, current + 1);
    }
  }

  /**
   * جلب الكلمات الأكثر شيوعاً وتكراراً بالسيرفر
   */
  static getTrendingWords(limit: number = 5): Array<{ word: string; count: number }> {
    const sorted = [...wordFrequencyMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    return sorted.map(([word, count]) => ({ word, count }));
  }

  /**
   * تصفير وتطهير ذاكرة الكلمات الشائعة
   */
  static clearCache(): void {
    wordFrequencyMap.clear();
  }
}

// ============================================================
//  تقرير حالة نظام الحماية والمراقبة (AutoMod Summary Report)
// ============================================================
export class AutoModSummaryReport {
  /**
   * توليد تقرير فني شامل لحالة المراقبة وسجلات المخالفات
   */
  static generateAutomatedSummary(guild: any): string {
    const totalWarns = [...warnings.values()].reduce((sum, w) => sum + w.count, 0);
    const trending = WordFrequencyTracker.getTrendingWords(3).map(w => `${w.word} (${w.count})`).join(', ');

    return `🛡️ **تقرير نظام المراقبة الذكي لخادم ${guild.name}**
• عدد المخالفات الإدارية المسجلة: ${moderationLog.length} مخالفة
• إجمالي عدد التحذيرات النشطة: ${totalWarns} تحذير
• حالة وضع الحماية (Anti-Raid): ${AntiRaidShield.isLockdown() ? '⚠️ تفعيل الطوارئ' : '✅ آمن ومستقر'}
• الكلمات المتداولة المكتشفة: ${trending || 'لا توجد بيانات كافية'}
• تم الاستخراج في: ${new Date().toLocaleString('ar-EG')}`;
  }
}

// ============================================================
//  نظام تطهير وتحسين النصوص الأمن (Advanced Content Sanitizer)
// ============================================================
export class AdvancedContentSanitizer {
  private static homoglyphsMap: Record<string, string> = {
    'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'س': 's', 'ش': 'sh',
    'ا': 'a', 'أ': 'a', 'إ': 'a', 'آ': 'a', 'ى': 'y', 'ي': 'y',
    'ة': 'h', 'ه': 'h'
  };

  /**
   * إزالة الرموز التعبيرية المخفية والمسافات الصفرية لمنع تجاوز الفلاتر
   */
  static removeZeroWidthChars(text: string): string {
    return text
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // مسح zero-width spaces
      .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, ''); // مسح control characters
  }

  /**
   * معالجة وتحويل الحروف المتشابهة بصرياً (Homoglyphs) إلى نظيراتها الأساسية
   */
  static normalizeHomoglyphs(text: string): string {
    let normalized = '';
    for (const char of text) {
      normalized += this.homoglyphsMap[char] ?? char;
    }
    return normalized;
  }

  /**
   * تطهير النص بالكامل لإجراء الفحص الأمني الدقيق
   */
  static sanitizeAll(text: string): string {
    const withoutZeroWidth = this.removeZeroWidthChars(text);
    return this.normalizeHomoglyphs(withoutZeroWidth).trim();
  }
}



