import {
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import type {
  SkillDefinition,
  SkillParams,
  SkillResult,
} from '../skill_registry.js';

const balances = new Map<string, number>();
const dailyClaims = new Map<string, number>();
const experience = new Map<string, number>();
const recurringJobs = new Map<string, { stop: () => void }>();
const startedAt = Date.now();
const backup = require('discord-backup') as {
  create: (guild: SkillParams['guild'], options: Record<string, unknown>) => Promise<{ id: string }>;
  list: () => Promise<string[]>;
};
const cron = require('node-cron') as {
  validate: (expression: string) => boolean;
  schedule: (expression: string, callback: () => void) => { stop: () => void };
};
const { DiscordTogether } = require('discord-together') as {
  DiscordTogether: new (client: SkillParams['guild']['client']) => {
    createTogetherCode: (channelId: string, activity: string) => Promise<{ invite: string }>;
  };
};

function key(guildId: string, userId: string): string {
  return `${guildId}:${userId}`;
}

function amount(value: unknown, fallback = 0): number {
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function directSkill(
  definition: Omit<SkillDefinition, 'execute' | 'schema' | 'examples'> & {
    execute: (params: SkillParams) => Promise<SkillResult>;
  }
): SkillDefinition {
  return {
    ...definition,
    schema: { type: 'object', additionalProperties: true },
    examples: [],
  };
}

const skills: SkillDefinition[] = [
  directSkill({
    id: 'ticket_open',
    name: 'Open support ticket',
    nameAr: 'فتح تذكرة دعم',
    category: 'tickets',
    description: 'Create a private support ticket channel.',
    descriptionAr: 'ينشئ روم تذكرة دعم خاص.',
    triggers: ['open ticket', 'ticket', 'support ticket', '1'],
    triggersAr: ['افتح تذكرة', 'تذكرة دعم', 'تيكت', '1'],
    requiredPermissions: [PermissionFlagsBits.ManageChannels],
    execute: async ({ guild, user, args }) => {
      const name = String(args.name ?? `ticket-${user.user.username}`)
        .toLowerCase()
        .replace(/[^\p{L}\p{N}-]+/gu, '-')
        .slice(0, 90);
      const channel = await guild.channels.create({
        name,
        type: ChannelType.GuildText,
        parent: args.categoryId,
        topic: `Opus ticket owner: ${user.id}`,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          {
            id: user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
        ],
        reason: String(args.reason ?? 'Support ticket opened through Opus Ai'),
      });
      return {
        success: true,
        message: `تم فتح التذكرة "${channel.name}".`,
        data: { channelId: channel.id, name: channel.name },
      };
    },
  }),
  directSkill({
    id: 'ticket_close',
    name: 'Close support ticket',
    nameAr: 'إغلاق تذكرة الدعم',
    category: 'tickets',
    description: 'Delete a support ticket channel.',
    descriptionAr: 'يغلق ويحذف روم التذكرة.',
    triggers: ['close ticket', 'delete ticket', '2'],
    triggersAr: ['اغلق التذكرة', 'قفل التذكرة', 'احذف التذكرة', '2'],
    requiredPermissions: [PermissionFlagsBits.ManageChannels],
    execute: async ({ guild, channel, args }) => {
      const target = args.channelId
        ? await guild.channels.fetch(String(args.channelId)).catch(() => null)
        : channel;
      if (!target) return { success: false, message: 'التذكرة غير موجودة.' };
      const name = String(target.name);
      await target.delete(String(args.reason ?? 'Support ticket closed through Opus Ai'));
      return { success: true, message: `تم إغلاق التذكرة "${name}".` };
    },
  }),
  directSkill({
    id: 'ticket_add_user',
    name: 'Add user to ticket',
    nameAr: 'إضافة عضو للتذكرة',
    category: 'tickets',
    description: 'Allow a member to view and reply in a ticket.',
    descriptionAr: 'يسمح لعضو بدخول التذكرة والرد فيها.',
    triggers: ['add user to ticket', 'ticket add user', '3'],
    triggersAr: ['ضيف عضو للتذكرة', 'اضف عضو للتيكت', '3'],
    requiredPermissions: [PermissionFlagsBits.ManageChannels],
    execute: async ({ guild, channel, args }) => {
      const memberId = String(args.memberId ?? '');
      if (!memberId) return { success: false, message: 'معرف العضو مطلوب.' };
      const target = args.channelId
        ? await guild.channels.fetch(String(args.channelId)).catch(() => null)
        : channel;
      if (!target || !('permissionOverwrites' in target)) {
        return { success: false, message: 'روم التذكرة غير صالح.' };
      }
      await target.permissionOverwrites.edit(memberId, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
      });
      return { success: true, message: 'تمت إضافة العضو إلى التذكرة.' };
    },
  }),
  directSkill({
    id: 'ticket_remove_user',
    name: 'Remove user from ticket',
    nameAr: 'إزالة عضو من التذكرة',
    category: 'tickets',
    description: 'Remove a member ticket overwrite.',
    descriptionAr: 'يزيل صلاحيات عضو من التذكرة.',
    triggers: ['remove user from ticket', 'ticket remove user', '4'],
    triggersAr: ['شيل عضو من التذكرة', 'احذف عضو من التيكت', '4'],
    requiredPermissions: [PermissionFlagsBits.ManageChannels],
    execute: async ({ guild, channel, args }) => {
      const memberId = String(args.memberId ?? '');
      const target = args.channelId
        ? await guild.channels.fetch(String(args.channelId)).catch(() => null)
        : channel;
      if (!memberId || !target || !('permissionOverwrites' in target)) {
        return { success: false, message: 'العضو أو التذكرة غير صالح.' };
      }
      await target.permissionOverwrites.delete(memberId);
      return { success: true, message: 'تمت إزالة العضو من التذكرة.' };
    },
  }),
  directSkill({
    id: 'poll',
    name: 'Create poll',
    nameAr: 'إنشاء استطلاع',
    category: 'community',
    description: 'Send a reaction poll.',
    descriptionAr: 'يرسل استطلاع تفاعلي.',
    triggers: ['create poll', 'poll', '5'],
    triggersAr: ['سو تصويت', 'استطلاع', 'تصويت', '5'],
    requiredPermissions: [PermissionFlagsBits.ManageMessages],
    execute: async ({ channel, args }) => {
      const question = String(args.question ?? args.description ?? '').trim();
      const options = Array.isArray(args.options) ? args.options.slice(0, 10) : [];
      if (!question || options.length < 2) {
        return { success: false, message: 'اكتب سؤال التصويت وخيارين على الأقل.' };
      }
      const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
      const sent = await channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle(question.slice(0, 256))
            .setDescription(options.map((option, index) =>
              `${emojis[index]} ${String(option).slice(0, 200)}`
            ).join('\n'))
            .setColor('#5865F2')
            .setTimestamp(),
        ],
      });
      for (let index = 0; index < options.length; index++) await sent.react(emojis[index]);
      return { success: true, message: 'تم إنشاء التصويت.', data: { messageId: sent.id } };
    },
  }),
  directSkill({
    id: 'giveaway_start',
    name: 'Start giveaway',
    nameAr: 'بدء سحب',
    category: 'community',
    description: 'Post a giveaway entry message.',
    descriptionAr: 'ينشر رسالة سحب قابلة للاشتراك.',
    triggers: ['start giveaway', 'giveaway', '6'],
    triggersAr: ['ابدأ سحب', 'سوي قيف اواي', 'مسابقة', '6'],
    requiredPermissions: [PermissionFlagsBits.ManageMessages],
    execute: async ({ channel, args }) => {
      const prize = String(args.prize ?? args.description ?? '').trim();
      if (!prize) return { success: false, message: 'اسم الجائزة مطلوب.' };
      const sent = await channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('🎉 Giveaway')
            .setDescription(`الجائزة: **${prize.slice(0, 1000)}**\nاضغط 🎉 للاشتراك.`)
            .setColor('#FEE75C')
            .setTimestamp(),
        ],
      });
      await sent.react('🎉');
      return { success: true, message: 'تم بدء السحب.', data: { messageId: sent.id } };
    },
  }),
  directSkill({
    id: 'balance',
    name: 'Economy balance',
    nameAr: 'عرض الرصيد',
    category: 'economy',
    description: 'Show a member balance.',
    descriptionAr: 'يعرض رصيد العضو.',
    triggers: ['balance', 'coins', '7'],
    triggersAr: ['رصيدي', 'الرصيد', 'فلوسي', '7'],
    requiredPermissions: [PermissionFlagsBits.ViewChannel],
    execute: async ({ guild, user, args }) => {
      const userId = String(args.memberId ?? user.id);
      const value = balances.get(key(guild.id, userId)) ?? 0;
      return { success: true, message: `الرصيد الحالي: ${value} عملة.` };
    },
  }),
  directSkill({
    id: 'daily',
    name: 'Daily economy reward',
    nameAr: 'المكافأة اليومية',
    category: 'economy',
    description: 'Claim a daily reward.',
    descriptionAr: 'يمنح المكافأة اليومية مرة كل 24 ساعة.',
    triggers: ['daily reward', 'daily', '8'],
    triggersAr: ['يومي', 'المكافأة اليومية', 'راتب يومي', '8'],
    requiredPermissions: [PermissionFlagsBits.ViewChannel],
    execute: async ({ guild, user }) => {
      const userKey = key(guild.id, user.id);
      const lastClaim = dailyClaims.get(userKey) ?? 0;
      const remaining = 86_400_000 - (Date.now() - lastClaim);
      if (remaining > 0) {
        return {
          success: false,
          message: `استلمت مكافأتك مسبقًا. باقي ${Math.ceil(remaining / 3_600_000)} ساعة.`,
        };
      }
      dailyClaims.set(userKey, Date.now());
      balances.set(userKey, (balances.get(userKey) ?? 0) + 500);
      return { success: true, message: 'استلمت 500 عملة كمكافأة يومية.' };
    },
  }),
  directSkill({
    id: 'pay',
    name: 'Pay member',
    nameAr: 'تحويل رصيد',
    category: 'economy',
    description: 'Transfer coins to another member.',
    descriptionAr: 'يحوّل رصيدًا من عضو إلى آخر.',
    triggers: ['pay member', 'transfer coins', '9'],
    triggersAr: ['حول رصيد', 'ادفع لعضو', 'تحويل عملات', '9'],
    requiredPermissions: [PermissionFlagsBits.ViewChannel],
    execute: async ({ guild, user, args }) => {
      const targetId = String(args.memberId ?? '');
      const value = amount(args.amount);
      if (!targetId || value <= 0 || targetId === user.id) {
        return { success: false, message: 'حدد عضوًا آخر ومبلغًا صحيحًا.' };
      }
      const senderKey = key(guild.id, user.id);
      const targetKey = key(guild.id, targetId);
      const senderBalance = balances.get(senderKey) ?? 0;
      if (senderBalance < value) return { success: false, message: 'رصيدك غير كافٍ.' };
      balances.set(senderKey, senderBalance - value);
      balances.set(targetKey, (balances.get(targetKey) ?? 0) + value);
      return { success: true, message: `تم تحويل ${value} عملة.` };
    },
  }),
  directSkill({
    id: 'rank_card',
    name: 'Level rank',
    nameAr: 'عرض الرتبة والمستوى',
    category: 'leveling',
    description: 'Show XP and calculated level.',
    descriptionAr: 'يعرض XP والمستوى المحسوب.',
    triggers: ['rank', 'level', '10'],
    triggersAr: ['رانكي', 'مستواي', 'رتبتي', '10'],
    requiredPermissions: [PermissionFlagsBits.ViewChannel],
    execute: async ({ guild, user, args }) => {
      const userId = String(args.memberId ?? user.id);
      const xp = experience.get(key(guild.id, userId)) ?? 0;
      const level = Math.floor(Math.sqrt(xp / 100));
      return { success: true, message: `المستوى ${level} — XP: ${xp}.` };
    },
  }),
  directSkill({
    id: 'give_xp',
    name: 'Give XP',
    nameAr: 'إضافة XP',
    category: 'leveling',
    description: 'Add XP to a member.',
    descriptionAr: 'يضيف نقاط خبرة لعضو.',
    triggers: ['give xp', 'add xp', '11'],
    triggersAr: ['اعط xp', 'ضيف خبرة', 'زد نقاط', '11'],
    requiredPermissions: [PermissionFlagsBits.ManageGuild],
    execute: async ({ guild, args }) => {
      const memberId = String(args.memberId ?? '');
      const value = amount(args.amount);
      if (!memberId || value <= 0) return { success: false, message: 'العضو وكمية XP مطلوبان.' };
      const memberKey = key(guild.id, memberId);
      experience.set(memberKey, (experience.get(memberKey) ?? 0) + value);
      return { success: true, message: `تمت إضافة ${value} XP.` };
    },
  }),
  directSkill({
    id: 'remove_xp',
    name: 'Remove XP',
    nameAr: 'سحب XP',
    category: 'leveling',
    description: 'Remove XP from a member.',
    descriptionAr: 'يسحب نقاط خبرة من عضو.',
    triggers: ['remove xp', 'take xp', '12'],
    triggersAr: ['اسحب xp', 'نقص خبرة', '12'],
    requiredPermissions: [PermissionFlagsBits.ManageGuild],
    execute: async ({ guild, args }) => {
      const memberId = String(args.memberId ?? '');
      const value = amount(args.amount);
      if (!memberId || value <= 0) return { success: false, message: 'العضو وكمية XP مطلوبان.' };
      const memberKey = key(guild.id, memberId);
      experience.set(memberKey, Math.max(0, (experience.get(memberKey) ?? 0) - value));
      return { success: true, message: `تم سحب ${value} XP.` };
    },
  }),
  directSkill({
    id: 'reminder',
    name: 'Create reminder',
    nameAr: 'إنشاء تذكير',
    category: 'automation',
    description: 'Send a reminder after a bounded delay.',
    descriptionAr: 'يرسل تذكيرًا بعد مدة محددة.',
    triggers: ['remind me', 'reminder', '13'],
    triggersAr: ['ذكرني', 'تذكير', '13'],
    requiredPermissions: [PermissionFlagsBits.SendMessages],
    execute: async ({ channel, user, args }) => {
      const delayMs = Math.min(Math.max(amount(args.delayMs), 1_000), 86_400_000);
      const text = String(args.text ?? args.description ?? '').trim();
      if (!text) return { success: false, message: 'نص التذكير مطلوب.' };
      const timer = setTimeout(() => {
        channel.send({
          content: `<@${user.id}> تذكيرك: ${text.slice(0, 1800)}`,
          allowedMentions: { users: [user.id] },
        }).catch(() => null);
      }, delayMs);
      timer.unref();
      return { success: true, message: 'تم حفظ التذكير.' };
    },
  }),
  directSkill({
    id: 'invite_create',
    name: 'Create invite',
    nameAr: 'إنشاء دعوة',
    category: 'invites',
    description: 'Create an invite for the current or selected channel.',
    descriptionAr: 'ينشئ رابط دعوة للروم.',
    triggers: ['create invite', 'invite link', '14'],
    triggersAr: ['سو رابط دعوة', 'انشئ انفايت', '14'],
    requiredPermissions: [PermissionFlagsBits.CreateInstantInvite],
    execute: async ({ guild, channel, args }) => {
      const target = args.channelId
        ? await guild.channels.fetch(String(args.channelId)).catch(() => null)
        : channel;
      if (!target || !('createInvite' in target)) {
        return { success: false, message: 'هذا الروم لا يدعم روابط الدعوة.' };
      }
      const invite = await target.createInvite({
        maxAge: Math.max(0, amount(args.maxAge, 86_400)),
        maxUses: Math.max(0, amount(args.maxUses)),
        unique: true,
      });
      return { success: true, message: `تم إنشاء الدعوة: ${invite.url}` };
    },
  }),
  directSkill({
    id: 'dm_user',
    name: 'Direct message user',
    nameAr: 'إرسال خاص لعضو',
    category: 'utility',
    description: 'Send a safe direct message to a guild member.',
    descriptionAr: 'يرسل رسالة خاصة لعضو.',
    triggers: ['dm user', 'direct message', '15'],
    triggersAr: ['ارسل خاص', 'كلم العضو خاص', '15'],
    requiredPermissions: [PermissionFlagsBits.ManageMessages],
    execute: async ({ guild, args }) => {
      const memberId = String(args.memberId ?? '');
      const content = String(args.content ?? '').trim();
      const member = memberId ? await guild.members.fetch(memberId).catch(() => null) : null;
      if (!member || !content) return { success: false, message: 'العضو ونص الرسالة مطلوبان.' };
      await member.send({ content: content.slice(0, 2000), allowedMentions: { parse: [] } });
      return { success: true, message: 'تم إرسال الرسالة الخاصة.' };
    },
  }),
  directSkill({
    id: 'random_pick',
    name: 'Random pick',
    nameAr: 'اختيار عشوائي',
    category: 'utility',
    description: 'Pick one item randomly.',
    descriptionAr: 'يختار عنصرًا عشوائيًا من القائمة.',
    triggers: ['random pick', 'choose random', '16'],
    triggersAr: ['اختر عشوائي', 'اختيار عشوائي', 'قرعة', '16'],
    requiredPermissions: [PermissionFlagsBits.ViewChannel],
    execute: async ({ args }) => {
      const items = Array.isArray(args.items) ? args.items.map(String).filter(Boolean) : [];
      if (items.length === 0) return { success: false, message: 'أرسل قائمة عناصر للاختيار.' };
      const selected = items[Math.floor(Math.random() * items.length)];
      return { success: true, message: `الاختيار: ${selected}` };
    },
  }),
  directSkill({
    id: 'ping',
    name: 'Bot ping',
    nameAr: 'بنق البوت',
    category: 'utility',
    description: 'Show Discord gateway latency.',
    descriptionAr: 'يعرض سرعة اتصال البوت.',
    triggers: ['ping', 'latency', '17'],
    triggersAr: ['بنق', 'سرعة البوت', '17'],
    requiredPermissions: [PermissionFlagsBits.ViewChannel],
    execute: async ({ guild }) => ({
      success: true,
      message: `البنق: ${guild.client.ws.ping}ms.`,
    }),
  }),
  directSkill({
    id: 'uptime',
    name: 'Bot uptime',
    nameAr: 'مدة تشغيل البوت',
    category: 'utility',
    description: 'Show process uptime.',
    descriptionAr: 'يعرض مدة تشغيل البوت.',
    triggers: ['uptime', 'running time', '18'],
    triggersAr: ['مدة التشغيل', 'من متى شغال', '18'],
    requiredPermissions: [PermissionFlagsBits.ViewChannel],
    execute: async () => ({
      success: true,
      message: `مدة التشغيل: ${Math.floor((Date.now() - startedAt) / 1000)} ثانية.`,
    }),
  }),
  directSkill({
    id: 'backup_create',
    name: 'Create server backup',
    nameAr: 'إنشاء نسخة احتياطية',
    category: 'utility',
    description: 'Create a Discord server structure backup.',
    descriptionAr: 'ينشئ نسخة احتياطية لهيكل السيرفر.',
    triggers: ['create backup', 'server backup', '19'],
    triggersAr: ['سو نسخة احتياطية', 'باك اب السيرفر', '19'],
    requiredPermissions: [PermissionFlagsBits.Administrator],
    execute: async ({ guild }) => {
      const result = await backup.create(guild, {
        maxMessagesPerChannel: 0,
        jsonSave: true,
        jsonBeautify: true,
        saveImages: 'url',
      });
      return {
        success: true,
        message: `تم إنشاء النسخة الاحتياطية بالمعرف ${result.id}.`,
        data: { backupId: result.id },
      };
    },
  }),
  directSkill({
    id: 'backup_list',
    name: 'List server backups',
    nameAr: 'عرض النسخ الاحتياطية',
    category: 'utility',
    description: 'List locally stored Discord backup IDs.',
    descriptionAr: 'يعرض معرفات النسخ الاحتياطية المحلية.',
    triggers: ['list backups', 'backups', '20'],
    triggersAr: ['عرض الباك اب', 'النسخ الاحتياطية', '20'],
    requiredPermissions: [PermissionFlagsBits.Administrator],
    execute: async () => {
      const backups = await backup.list();
      return {
        success: true,
        message: backups.length > 0 ? `النسخ: ${backups.join(', ')}` : 'لا توجد نسخ احتياطية.',
        data: { backups },
      };
    },
  }),
  directSkill({
    id: 'recurring_msg',
    name: 'Recurring scheduled message',
    nameAr: 'رسالة مجدولة متكررة',
    category: 'automation',
    description: 'Schedule a recurring channel message with cron syntax.',
    descriptionAr: 'يجدول رسالة متكررة باستخدام صيغة cron.',
    triggers: ['recurring message', 'cron message', '21'],
    triggersAr: ['رسالة متكررة', 'جدول رسالة', '21'],
    requiredPermissions: [PermissionFlagsBits.ManageMessages],
    execute: async ({ channel, args }) => {
      const expression = String(args.cron ?? '');
      const content = String(args.content ?? '').trim();
      if (!cron.validate(expression) || !content) {
        return { success: false, message: 'صيغة cron صحيحة ونص الرسالة مطلوبان.' };
      }
      const jobId = `${channel.id}:${Date.now()}`;
      const job = cron.schedule(expression, () => {
        channel.send({ content: content.slice(0, 2000), allowedMentions: { parse: [] } })
          .catch(() => null);
      });
      recurringJobs.set(jobId, job);
      return { success: true, message: `تمت جدولة الرسالة بالمعرف ${jobId}.` };
    },
  }),
  directSkill({
    id: 'together_activity',
    name: 'Start Discord activity',
    nameAr: 'تشغيل نشاط ديسكورد',
    category: 'voice_management',
    description: 'Create a Discord Together activity invite.',
    descriptionAr: 'ينشئ رابط نشاط داخل الروم الصوتي.',
    triggers: ['start activity', 'discord together', '22'],
    triggersAr: ['شغل نشاط', 'لعبة في الفويس', '22'],
    requiredPermissions: [PermissionFlagsBits.CreateInstantInvite],
    execute: async ({ guild, user, args }) => {
      const channelId = String(args.channelId ?? user.voice.channelId ?? '');
      const activity = String(args.activity ?? 'youtube');
      if (!channelId) return { success: false, message: 'ادخل رومًا صوتيًا أو حدد معرفه.' };
      const together = new DiscordTogether(guild.client);
      const result = await together.createTogetherCode(channelId, activity);
      return { success: true, message: `رابط النشاط: ${result.invite}` };
    },
  }),
];

export default skills;
