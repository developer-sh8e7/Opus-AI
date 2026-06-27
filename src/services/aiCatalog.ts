import { ADVANCED_ACTION_GROUPS } from '../utils/advancedDiscordActions.js';

export interface FunctionTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
      additionalProperties: false;
    };
  };
}

const sp = (d: string) => ({ type: 'string', description: d });
const sap = (d: string) => ({ type: 'array', description: d, items: { type: 'string' } });

function defineTool(
  name: string,
  description: string,
  properties: Record<string, unknown> = {},
  required: string[] = []
): FunctionTool {
  return {
    type: 'function',
    function: {
      name,
      description,
      parameters: {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined,
        additionalProperties: false,
      },
    },
  };
}

export const SYSTEM_PROMPT = `أنت HumanGuard AI — مساعد إدارة سيرفرات Discord خبير ومتخصص. لغتك الأساسية عربية خليجية طبيعية فقط — لا تستخدم أي لغة أخرى أبداً. لا تقل كلمات أجنبية مثل "cosa" أو غيرها في ردودك.

## كيف تفكر قبل كل رد (داخلياً — لا ترسل هذا التفكير للمستخدم)

[1 - الفهم]: ماذا يريد المستخدم فعلاً؟ ليس ما قاله حرفياً — ما يريده. هل هو طلب إداري؟ اجتماعي؟ استفسار؟
[2 - التحقق]: هل الكيان المذكور موجود؟ هل أنشأناه بهذه الجلسة؟ هل عندي الصلاحيات؟ هل رتبتي أعلى من الهدف؟
[3 - التخطيط]: ما الخطوات بالترتيب؟ أيها تعتمد على ما قبلها؟ هل فيه إجراء خطير يحتاج تأكيد؟
[4 - التنفيذ والتحقق]: نفّذ خطوة بخطوة. تحقق من نجاح كل خطوة. أخبر المستخدم بالضبط ما تم — بالأسماء الحقيقية والأرقام الحقيقية.

## قواعد الفهم — لا تخالفها أبداً

### MOVE vs CREATE
- "انقل روم X لكاتقوري Y" → ابحث عن الروم الموجود وانقله. لا تنشئ جديد.
- "تشوف روم X" → الروم موجود. ابحث عنه في السيرفر أو الجلسة الحالية.
- "سو / أنشئ / اعمل X" → أنشئ جديد فقط إذا لم يكن موجوداً.
- إذا وجد كيان بنفس الاسم → قل للمستخدم إنه موجود واسأل قبل الإنشاء.

### REORDER vs CREATE
- "رتب السيرفر" → نظّم الرومات الموجودة. لا تنشئ رومات جديدة أبداً.
- "رتب الرومات" → أعد ترتيب الموجود فقط.

### المدد الزمنية — احسبها دائماً بدقة
- ثانية = 1,000ms | دقيقة = 60,000ms | ساعة = 3,600,000ms
- يوم = 86,400,000ms | أسبوع = 604,800,000ms
- الحد الأقصى للتايم اوت في Discord = 28 يوم
- "تايم اوت يوم" = 86,400,000ms بالضبط — ليس 10 دقائق

### Voice Disconnect vs Kick/Ban
- "دسكونكت / طرده من الروم / اخرجه من الروم" = member.voice.disconnect()
  يحتاج MoveMembers فقط. لا علاقة لرتبة العضو هنا.
- "طرده من السيرفر" = guild.kick() — يحتاج KickMembers + رتبة أعلى
- "بنده / باند" = guild.ban() — يحتاج BanMembers + رتبة أعلى
- لا تخلط بينهم أبداً

### الكلمات العربية الإدارية — افهمها صح
- "لوقات / لوق / logs" → إنشاء نظام سجل أحداث (logging system)
  ليس "لطافة" أو أي معنى اجتماعي
- "رتب" في سياق السيرفر → ترتيب/تنظيم، ليس إنشاء رتب جديدة
- "تشوف روم X" → اعمل عليه، لا تنشئه
- "نقله / حوله / غيّر مكانه" → MOVE، لا تحذف ولا تنشئ

### الصلاحيات — فهم Discord الصحيح
- إذا البوت عنده Administrator → يتجاوز كل فحوصات الصلاحيات الفردية
- لا تقل "ما عندي صلاحية" إذا البوت عنده Administrator
- MoveMembers تكفي للـ voice disconnect
- ModerateMembers للتايم اوت
- لا تخلط بين صلاحيات السيرفر وصلاحيات القناة

## أمثلة — تعلّم من هذه الأمثلة

### مثال 1 — انقل روم (صح vs غلط)
المستخدم: "تشوف روم شات-عام انقله لكاتقوري 1519753538543157413"
❌ خطأ: إنشاء روم جديد اسمه شات-عام
✅ صح: البحث عن الروم الموجود اسمه شات-عام في السيرفر → نقله للكاتقوري المذكور

### مثال 2 — رتب السيرفر (صح vs غلط)
المستخدم: "رتب لي السيرفر"
❌ خطأ: إنشاء رومات جديدة روم-العامة، روم-الخاصة، إلخ
✅ صح: "تبي أرتب الرومات الحالية بترتيب منطقي؟ قل لي كيف تبي التنظيم"

### مثال 3 — تايم اوت (صح vs غلط)
المستخدم: "عط تايم اوت يوم @Omar"
❌ خطأ: تايم اوت 10 دقائق
✅ صح: تأكيد → تايم اوت 86,400,000ms (24 ساعة بالضبط)

### مثال 4 — لوقات (صح vs غلط)
المستخدم: "سو نظام لوقات"
❌ خطأ: "سأحاول أكون أكثر لباقة"
✅ صح: إنشاء كاتقوري Logs + قنوات: mod-logs, message-logs, voice-logs, member-logs, audit-logs

### مثال 5 — ديسكونكت (صح vs غلط)
المستخدم: "دسكونكت فلان من الروم"
❌ خطأ: "ما أقدر، رتبته أعلى مني"
✅ صح: member.voice.disconnect() — لا علاقة للرتبة هنا

### مثال 6 — لا تكذب على المستخدم
المستخدم: "وش عدلت؟"
❌ خطأ: "ما عدلت شيء" (بعد ما قلت "تم التحديث")
✅ صح: أخبره بالضبط ما تم في آخر إجراء من سجل الجلسة

## ردودك — قواعد الشكل
- الأخطاء → embed أحمر ❌ + سبب الخطأ بالعربية + ماذا يفعل المستخدم
- النجاح → embed أخضر ✅ + اسم الكيان الحقيقي + ما تغير بالضبط
- التأكيد قبل الإجراء الخطير → embed أصفر ⚠️ + تعليمات واضحة
- المحادثة العادية → نص عادي بدون embed
- لا تُظهر أي كود برمجي أو syntax داخلي للمستخدم أبداً
- لا تقل "تم بنجاح" إلا بعد التحقق الفعلي من نجاح الإجراء
`;

const ADVANCED_TOOL_DESCRIPTIONS: Record<keyof typeof ADVANCED_ACTION_GROUPS, string> = {
  channel_operations: 'Configure channels: clone, lock, invite, inspect.',
  thread_operations: 'Manage threads: create, archive, lock, slowmode.',
  message_operations: 'Send, pin, edit, publish, react, remove messages.',
  webhook_operations: 'Create, edit, send, delete webhooks.',
  role_operations: 'Inspect, clone, configure, position, assign roles.',
  guild_operations: 'Configure server: identity, verification, bans, invites.',
  expression_operations: 'Manage emojis, stickers, soundboard sounds.',
  automod_operations: 'Create and manage AutoMod rules.',
  event_operations: 'Manage scheduled events.',
  analytics_operations: 'Read audit logs and server statistics.',
};

const advancedTools: FunctionTool[] = Object.entries(ADVANCED_ACTION_GROUPS).map(([group, actions]) =>
  defineTool(group, ADVANCED_TOOL_DESCRIPTIONS[group as keyof typeof ADVANCED_ACTION_GROUPS], {
    action: { type: 'string', enum: actions, description: 'Operation.' },
    channelId: sp('Channel/thread ID.'),
    categoryId: sp('Category ID.'),
    roleId: sp('Role ID.'),
    memberId: sp('Member ID.'),
    messageId: sp('Message ID.'),
    webhookId: sp('Webhook ID.'),
    eventId: sp('Event ID.'),
    ruleId: sp('AutoMod rule ID.'),
    emojiId: sp('Emoji ID.'),
    name: sp('Name for create/rename.'),
    content: sp('Message/webhook content.'),
    description: sp('Description text.'),
    topic: sp('Channel topic.'),
    color: sp('Hex color.'),
    reason: sp('Audit-log reason.'),
    url: sp('Image/asset URL.'),
    emoji: sp('Reaction emoji.'),
    location: sp('Event location.'),
    region: sp('RTC region (omit=auto).'),
    keyword: sp('AutoMod keyword.'),
    alertChannelId: sp('AutoMod alert channel.'),
    scheduledStartTime: sp('ISO-8601 start time.'),
    scheduledEndTime: sp('ISO-8601 end time.'),
    enabled: { type: 'boolean' },
    value: { type: 'number' },
    position: { type: 'integer' },
    count: { type: 'integer', minimum: 1 },
    duration: { type: 'integer', minimum: 0 },
    mentionTotalLimit: { type: 'integer', minimum: 1, maximum: 50 },
    permissions: sap('Permission names.'),
    memberIds: sap('Member IDs.'),
  }, ['action'])
);

export const tools: FunctionTool[] = [
  defineTool('build_custom_server', 'Build a custom Discord server layout from a detailed user description.', { description: sp('The requested server layout and purpose.') }, ['description']),
  defineTool('execute_community_build', 'Build a Discord server from a predefined community template.', {
    blueprintType: { type: 'string', enum: ['community', 'store', 'gaming', 'clan'], description: 'Template type.' },
    serverName: sp('Optional server display name.'),
  }, ['blueprintType']),
  defineTool('get_voice_status', 'Get the current voice connection and music status.'),
  defineTool('get_user_voice_channel', 'Find the voice channel currently containing a Discord user.', { userId: sp('Discord user ID.') }, ['userId']),
  defineTool('join_voice_channel', 'Join a Discord voice channel.', { channelId: sp('Voice channel ID.') }, ['channelId']),
  defineTool('leave_voice_channel', 'Leave the current Discord voice channel.'),
  defineTool('play_music', 'Play a requested track or URL in voice.', {
    query: sp('Track name, artist, search query, or direct URL.'),
    voiceChannelId: sp('Optional target voice channel ID.'),
    requestingUserId: sp('Discord ID of the requesting user.'),
    requestedBy: sp('Display name of the requesting user.'),
  }, ['query']),
  defineTool('pause_music', 'Pause the current track.'),
  defineTool('resume_music', 'Resume the paused track.'),
  defineTool('skip_music', 'Skip the current track.'),
  defineTool('stop_music', 'Stop playback and clear the queue.'),
  defineTool('set_volume', 'Set music volume from 0 to 200.', { volume: { type: 'number', minimum: 0, maximum: 200 } }, ['volume']),
  defineTool('toggle_loop', 'Toggle music loop mode.'),
  defineTool('get_queue', 'Get the current music queue.'),
  defineTool('shuffle_queue', 'Shuffle the current music queue.'),
  defineTool('remove_from_queue', 'Remove an item from the music queue by its one-based index.', { index: { type: 'integer', minimum: 1 } }, ['index']),
  defineTool('get_now_playing', 'Get the currently playing track.'),
  defineTool('get_server_info', 'Get current channels, categories, roles, members, and their IDs.'),
  defineTool('delete_channels', 'Delete one or more Discord channels by exact ID.', { channelIds: sap('Exact Discord channel IDs.') }, ['channelIds']),
  defineTool('create_channels', 'Create Discord text, voice, or category channels.', {
    type: { type: 'string', enum: ['text', 'voice', 'category'], description: 'Channel type.' },
    names: sap('Channel names to create.'),
    categoryId: sp('Optional parent category ID.'),
    permissions: { type: 'array', description: 'Optional permission overwrites applied during creation.', items: { type: 'object', properties: { id: sp('Role or member ID. Use the guild ID for @everyone.'), allow: sap('Discord permission names to allow.'), deny: sap('Discord permission names to deny.') }, required: ['id', 'allow', 'deny'], additionalProperties: false } },
  }, ['type', 'names']),
  defineTool('manage_roles', 'Create, edit, delete, assign, or remove a Discord role.', {
    action: { type: 'string', enum: ['create', 'delete', 'edit', 'assign', 'remove'] },
    roleData: { type: 'object', properties: { roleId: sp('Exact role ID for existing-role actions.'), name: sp('Role name.'), color: sp('Hex color or a supported Arabic or English color name.'), permissions: sap('Discord permission names.'), hoist: { type: 'boolean' }, mentionable: { type: 'boolean' } }, additionalProperties: false },
    targetMemberId: sp('Member ID for assign or remove actions.'),
  }, ['action', 'roleData']),
  defineTool('edit_permissions', 'Edit one channel permission overwrite for a role or member.', { channelId: sp('Exact target channel ID.'), targetId: sp('Exact role or member ID. Use the guild ID for @everyone.'), targetType: { type: 'string', enum: ['role', 'member'] }, allow: sap('Permission names to allow.'), deny: sap('Permission names to deny.') }, ['channelId', 'targetId', 'targetType', 'allow', 'deny']),
  defineTool('bulk_permission_update', 'Apply one permission overwrite across explicit channels or every channel in a category.', { channelIds: sap('Optional exact channel IDs.'), categoryId: sp('Optional category ID whose child channels will be updated.'), targetId: sp('Exact role or member ID. Use the guild ID for @everyone.'), targetType: { type: 'string', enum: ['role', 'member'] }, allow: sap('Permission names to allow.'), deny: sap('Permission names to deny.') }, ['targetId', 'targetType', 'allow', 'deny']),
  defineTool('sweep_permission_overwrites', 'Remove selected permissions from everyone who has them (@everyone, role overwrites, member overwrites, and role base permissions), then verify the permission is denied.', { channelIds: sap('Optional exact channel IDs.'), categoryId: sp('Optional category ID whose child channels will be scanned.'), permissions: sap('Permission names to deny/remove such as MentionEveryone.'), includeEveryone: { type: 'boolean' }, includeRoles: { type: 'boolean' }, includeMembers: { type: 'boolean' }, scope: { anyOf: [{ type: 'string', enum: ['@everyone', 'allRoles', 'allMembers'] }, { type: 'array', items: { type: 'string' } }], description: 'Explicit sweep scope. Use allRoles/allMembers or an array of target IDs when requested.' } }, ['permissions']),
  defineTool('manage_members', 'Move, kick, ban, unban, timeout, untimeout, rename, disconnect, deafen, or voice-mute a member.', {
    action: { type: 'string', enum: ['move', 'kick', 'ban', 'unban', 'timeout', 'untimeout', 'nickname', 'voicekick', 'deafen', 'mute_voice'] },
    memberId: sp('Exact Discord user ID.'),
    data: { type: 'object', properties: { channelId: sp('Target voice channel ID for move.'), duration: { type: 'integer', minimum: 1, description: 'Timeout duration in milliseconds.' }, reason: sp('Audit-log reason.'), nickname: sp('New nickname.'), enabled: { type: 'boolean', description: 'Whether deafen or voice mute should be enabled.' } }, additionalProperties: false },
  }, ['action', 'memberId']),
  defineTool('edit_bot_profile', 'Edit the bot username, avatar, or current-server nickname using guild.members.me.setNickname() when nickname is provided. Use this for: غير اسمك/غيّر لقبك/سميني X.', { username: sp('New global bot username.'), nickname: sp('New bot nickname in the current server (setNickname).'), avatarUrl: sp('Public image URL for the new avatar.') }),
  defineTool('bulk_delete_messages', 'Bulk-delete recent messages in a text channel.', { channelId: sp('Exact text channel ID.'), count: { type: 'integer', minimum: 1, maximum: 100 }, userId: sp('Optional author ID filter.') }, ['channelId', 'count']),
  defineTool('send_embed', 'Send a polished custom embed to a Discord text channel.', { channelId: sp('Exact destination channel ID.'), title: sp('Optional embed title.'), description: sp('Main embed text.'), color: sp('Optional six-digit hex color such as #5865F2.'), footer: sp('Optional footer text.'), imageUrl: sp('Optional public image URL.'), thumbnailUrl: sp('Optional public thumbnail URL.'), fields: { type: 'array', items: { type: 'object', properties: { name: sp('Field title.'), value: sp('Field content.'), inline: { type: 'boolean' } }, required: ['name', 'value'], additionalProperties: false } } }, ['channelId', 'description']),
  defineTool('get_member_info', 'Get a Discord member profile, roles, and effective guild permissions.', { memberId: sp('Exact Discord member ID.') }, ['memberId']),
  defineTool('execute_skill', 'Execute one exact skill from the EXECUTABLE_SKILLS manifest.', { skillId: sp('Exact skill ID from EXECUTABLE_SKILLS.'), args: { type: 'object', description: 'Arguments required by the selected skill.', additionalProperties: true } }, ['skillId', 'args']),
  ...advancedTools,
];

export const TOOL_DESCRIPTIONS = Object.fromEntries(tools.map((tool) => [tool.function.name, tool.function.description]));

export const TOOL_GROUPS = {
  server: ['get_server_info', 'build_custom_server', 'execute_community_build'],
  channels: ['get_server_info', 'create_channels', 'delete_channels', 'edit_permissions', 'bulk_permission_update', 'sweep_permission_overwrites', 'send_embed'],
  roles: ['get_server_info', 'manage_roles', 'edit_permissions', 'bulk_permission_update', 'get_member_info'],
  members: ['get_member_info', 'manage_members', 'bulk_delete_messages'],
  profile: ['edit_bot_profile'],
  voice: ['get_voice_status', 'get_user_voice_channel', 'join_voice_channel', 'leave_voice_channel', 'manage_members', 'channel_operations'],
  music: ['get_voice_status', 'get_user_voice_channel', 'join_voice_channel', 'play_music', 'pause_music', 'resume_music', 'skip_music', 'stop_music', 'set_volume', 'toggle_loop', 'get_queue', 'shuffle_queue', 'remove_from_queue', 'get_now_playing'],
} as const;
