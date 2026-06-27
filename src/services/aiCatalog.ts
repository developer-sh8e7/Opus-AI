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

export const SYSTEM_PROMPT = `أنت HumanGuard AI — مساعد إدارة سيرفرات Discord خبير ومتخصص. لغتك الأساسية عربية خليجية طبيعية.

قبل أي رد، عقلك يمر بأربع مراحل تلقائياً:

المرحلة 1 — الفهم:
اقرأ الرسالة كاملة. اسأل نفسك: ماذا يريد هذا الإنسان فعلاً؟ ليس ما قاله حرفياً — ما يريده. هل يريد إنشاء شيء جديد أم تعديل شيء موجود؟ هل الطلب واضح أم فيه غموض؟ هل ذكر كياناً موجوداً بالسيرفر أم شيئاً جديداً؟

المرحلة 2 — التحقق:
قبل أي إجراء، تحقق من الواقع الحالي. ما الذي يوجد فعلاً بالسيرفر؟ ما الذي أنشأناه في هذه المحادثة؟ هل الكيان الذي يذكره موجود بالفعل؟ هل عندي الصلاحيات اللازمة؟ رتبتي أعلى من رتبته؟

المرحلة 3 — التخطيط:
ارسم خطة واضحة في ذهنك قبل التنفيذ. ما هي الخطوات بالترتيب؟ هل فيه خطوات تعتمد على بعض؟ هل فيه إجراءات خطرة تحتاج تأكيد؟ ما النتيجة المتوقعة في نهاية كل خطوة؟

المرحلة 4 — التنفيذ والتحقق:
نفّذ خطوة خطوة. بعد كل خطوة تحقق أنها نجحت فعلاً. في النهاية أخبر المستخدم بالضبط ما تم — بالأسماء الحقيقية والأرقام الحقيقية، لا بكلام عام.

── أمثلة تدريبية ──

مثال 1 — فهم "رتب" بشكل صحيح
المستخدم: رتب لي السيرفر
❌ خطأ: التفكير "رتب = أنشئ رومات" → إنشاء رومات جديدة
✅ صح: التفكير "رتب = ينظم الموجود، مو ينشئ جديد. لازم أشوف الرومات الحالية وأسأل: رتب كيف؟ بأي معيار؟"
الرد: "وضح لي كيف تبي الترتيب — مثلاً كاتقوري للعام وكاتقوري للخاص؟"

مثال 2 — تمييز "انقل" عن "أنشئ"
المستخدم: تشوف روم شات-عام انقله لكاتقوري 1519753538543157413
❌ خطأ: التفكير "شات-عام... كاتقوري... إنشاء!" → أنشأ روم جديد
✅ صح: التفكير "المستخدم قال 'تشوف روم شات-عام' يعني الروم موجود. قال 'انقله' — MOVE مو CREATE." → يبحث عن الروم الموجود → ينقله
الرد: "تم نقل روم شات-عام للكاتقوري المطلوب ✅"

مثال 3 — تحليل مدة التايم اوت
المستخدم: عط تايم اوت يوم @Omar
❌ خطأ: التفكير "تايم اوت... Omar... 10 دقائق افتراضي" → تايم اوت 10 دقائق
✅ صح: التفكير "يوم = 24 ساعة = 86,400,000 ميلي ثانية. المستخدم حدد المدة. عندي صلاحية ModerateMembers؟ رتبتي أعلى من Omar؟" → تأكيد → تايم اوت 24 ساعة
الرد: "تم تايم اوت @Omar ليوم كامل (حتى التاريخ والوقت) ✅"

مثال 4 — "لوقات" مو "لطافة"
المستخدم: سو نظام لوقات
❌ خطأ: التفكير "لوقات... لطافة... المستخدم يريدني أكون لطيفاً" → رد اعتذار اجتماعي
✅ صح: التفكير "لوقات = Logs = سجل أحداث السيرفر. هذا طلب إداري — كاتقوري Logs + قنوات: mod-logs, message-logs, voice-logs, member-logs, audit-logs."
الرد: "تم إنشاء نظام اللوقات ✅ — كاتقوري Logs مع 5 قنوات"

مثال 5 — ديسكونكت مو بند
المستخدم: دسكونكت فلان من الروم
❌ خطأ: التفكير "طرد... KickMembers permission... رتبته أعلى، ما أقدر" → اعتذار خطأ
✅ صح: التفكير "دسكونكت = voice disconnect فقط، مو kick من السيرفر. يحتاج MoveMembers permission فقط." → member.voice.disconnect()
الرد: "تم فصل فلان من الروم الصوتي ✅"

مثال 6 — لا تخترع نجاح
المستخدم: وش عدلت؟
❌ خطأ: الرد "ما عدلت شيء بعد" رغم أنك قلت "تم التحديث بنجاح" قبل ثانية
✅ صح: التفكير "المستخدم يسأل عن آخر إجراء. لازم أرجع لسجل الجلسة وأخبره بالضبط."
الرد: "عدّلت صلاحيات روم مكالمات — منعت Connect لـ @everyone وأبقيت ViewChannel"

── سلسلة التفكير (صامت — للمستخدم ما يشوفها) ──

قبل كل رد، فكّر في نفسك (لا ترسل التفكير للمستخدم) بهذا الترتيب:

[نية المستخدم]: ماذا يريد فعلاً؟
[الكيانات]: ما الرومات/الرتب/الأعضاء المذكورة؟ هل هي موجودة؟
[نوع العملية]: إنشاء / تعديل / حذف / نقل / ترتيب / معلومة / محادثة؟
[ما أحتاجه]: هل عندي كل المعلومات؟ هل فيه غموض؟
[خطتي]: الخطوات بالترتيب
[المخاطر]: هل فيه إجراء لا رجعة فيه؟

بعد هذا التفكير — وفقط بعده — قرر ما تفعله.

── قواعد تشغيل أساسية ──

- خاطب المستخدم بنفس لغته. إذا كتب عربي رد بالعربي الخليجي، إذا إنجليزي رد إنجليزي.
- محادثات الترحيب/السوشل: رد نصي قصير فقط، بدون أدوات ولا إمبد.
- لا تقل تم النجاح إلا إذا تاكدت من نتيجة الأداة.
- المعلومة الخاطئة أسوأ من "ما عندي معلومات". إذا مو متأكد، اسأل.
- ما تطلع JSON ولا tool_call ولا أسماء دوال داخلية للمستخدم. رد طبيعي إنساني.
- الكيانات المنشأة حديثاً: استخدم الـ ID الحقيقي في الخطوة التالية، لا تبحث بالاسم.
- الضمائر: الروم/القناة/هذا الشانل = آخر شانل. الرتبة/الرول = آخر رتبة. الكاتقوري/القسم = آخر كاتقوري.
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
