import type { AIMessage } from './ai.js';

const TOOL_GROUPS = {
  server: ['get_server_info', 'build_custom_server', 'execute_community_build'],
  logging: ['create_channels', 'edit_permissions', 'analytics_operations', 'channel_operations'],
  channels: [
    'get_server_info',
    'create_channels',
    'delete_channels',
    'edit_permissions',
    'bulk_permission_update',
    'sweep_permission_overwrites',
    'send_embed',
  ],
  roles: [
    'get_server_info',
    'manage_roles',
    'edit_permissions',
    'bulk_permission_update',
    'get_member_info',
  ],
  members: ['get_member_info', 'manage_members', 'bulk_delete_messages'],
  profile: ['edit_bot_profile'],
  voice: ['get_voice_status', 'get_user_voice_channel', 'join_voice_channel', 'leave_voice_channel'],
  music: [
    'get_voice_status',
    'get_user_voice_channel',
    'join_voice_channel',
    'play_music',
    'pause_music',
    'resume_music',
    'skip_music',
    'stop_music',
    'set_volume',
    'toggle_loop',
    'get_queue',
    'shuffle_queue',
    'remove_from_queue',
    'get_now_playing',
  ],
} as const;

const EXPLICIT_ACTION_PATTERN =
  /(?:^|\s)(?:خل|خلي|خله|سو|سوي|سووا|انشئ|أنشئ|اصنع|أصنع|اضف|أضف|احذف|تحذف|امسح|شيل|ازل|أزل|غير|غيّر|عدل|عدّل|حط|حطوا|انقل|اقفل|افتح|امنح|اسحب|اعط|أعط|ارسل|أرسل|ثبت|ثبّت|فك|شغل|وقف|اطرد|احظر|اكتم|افصل|دسكونكت|دسكنوكت|ديسكونكت|رتب|نظم|صمم|ابن|ابني|لوق|لوقات|سجل|logs?|audit|create|delete|remove|add|edit|change|rename|send|set|make|build|move|lock|unlock|ban|kick|timeout|mute|disconnect|voicekick|play|stop|assign|give)(?=\s|$|[^\p{L}\p{N}])/iu;

const EXPLICIT_DESIRE_PATTERN =
  /(?:^|\s)(?:ابي|أبي|ابغى|أبغى|اريد|أريد)(?:\s+(?:منك|انك|إنك))?\s+(?:(?:تسوي|تسوى|تنشئ|تصنع|تضيف|تحذف|تمسح|تشيل|تزيل|تغير|تعدّل|تعدل|تحط|تنقل|تقفل|تفتح|ترسل|تعطي|تسحب|تشغل|توقف|تطرد|تحظر|تكتم|ترتب|تنظم|تصمم)(?=\s|$|[^\p{L}\p{N}])|(?:روم|قناة|كاتقوري|فئة|رتبة|رول|ايمبد|إيمبد|سيرفر|متجر|بان|حظر|تايم\s*اوت|موسيقى)(?=\s|$))/iu;

const EXPLICIT_INFORMATION_PATTERN =
  /(?:عطني|اعطني|أعطني|ورني|أرني|ارني|هات|جيب|اعرض|أعرض|افحص|تحقق|وش عندنا|كم عدد|what|show|list|get|check|inspect).*(?:السيرفر|الخادم|الروم|القناة|القنوات|الرومات|الرتبة|الرتب|الرولات|العضو|الأعضاء|member|server|channel|role|audit|stats|queue)/iu;

const EXPLICIT_PERMISSION_PATTERN =
  /(?:\d{17,20}|<#\d{17,20}>|روم|قناة|كاتقوري|فئة).*(?:الكل|everyone|رتبة|رول).*(?:يشوف|يدخل|يكتب|يتكلم|سكرين|منشن|صلاحية|برمشن|ميوت|ديفن|موف|منج)/iu;

export function getCurrentUserText(messages: AIMessage[]): string {
  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === 'user' && typeof message.content === 'string');
  return latestUserMessage?.content?.toLowerCase() ?? '';
}

export function currentMessageAllowsTools(messages: AIMessage[]): boolean {
  const current = getCurrentUserText(messages);
  if (!current) return false;
  return EXPLICIT_ACTION_PATTERN.test(current) ||
    EXPLICIT_DESIRE_PATTERN.test(current) ||
    EXPLICIT_INFORMATION_PATTERN.test(current) ||
    EXPLICIT_PERMISSION_PATTERN.test(current);
}

export function selectToolNames(messages: AIMessage[]): Set<string> {
  const selected = new Set<string>();
  if (!currentMessageAllowsTools(messages)) return selected;

  const content = getCurrentUserText(messages);
  let latestUserIndex = -1;
  for (let index = messages.length - 1; index >= 0; index--) {
    if (messages[index].role === 'user') {
      latestUserIndex = index;
      break;
    }
  }

  for (const message of messages.slice(latestUserIndex + 1)) {
    if (message.role === 'tool' && message.name) selected.add(message.name);
    for (const toolCall of message.tool_calls ?? []) {
      selected.add(toolCall.function.name);
    }
  }

  const addGroup = (group: readonly string[]) => group.forEach((name) => selected.add(name));

  if (/(server|سيرفر|خادم|متجر|build|بناء|صمم|نظم.*السيرفر|ضبط.*السيرفر)/i.test(content)) {
    addGroup(TOOL_GROUPS.server);
  }
  if (/(channel|room|روم|قناة|قنوات|برمشن|permission|visibility|يشوف|يدخل|يخش|يتكلم|سكرين|يشارك|صلاحية|صلاحيات|منشن|اخف|إخف)/i.test(content)) {
    addGroup(TOOL_GROUPS.channels);
  }
  if (/(role|roles|رول|رولات|رتبة|رتب|مشرف|permission|برمشن)/i.test(content)) {
    addGroup(TOOL_GROUPS.roles);
  }
  if (/(ban|unban|kick|timeout|mute|member|disconnect|voicekick|حظر|فك الحظر|طرد|دسكونكت|دسكنوكت|ديسكونكت|افصل|فصل|كتم|عضو|رسائل|messages)/i.test(content)) {
    addGroup(TOOL_GROUPS.members);
  }
  if (/(profile|avatar|username|rename|change.*name|غير اسمك|غيّر اسمك|صورتك)/i.test(content)) {
    addGroup(TOOL_GROUPS.profile);
  }
  if (/(voice|فويس|صوتي|روم صوت|join|leave|ادخل|اطلع|حد الروم|عدد الاشخاص|عدد الأشخاص|user limit|دسكونكت|دسكنوكت|voicekick)/i.test(content)) addGroup(TOOL_GROUPS.voice);
  if (/(music|song|play|pause|resume|skip|queue|volume|اغنية|أغنية|موسيقى|شغل|وقف|الصوت)/i.test(content)) {
    addGroup(TOOL_GROUPS.music);
  }
  if (/(thread|ثريد|موضوع منتدى|archive|ارشفة|أرشفة)/i.test(content)) selected.add('thread_operations');
  if (/(webhook|ويب هوك)/i.test(content)) selected.add('webhook_operations');
  if (/(automod|اوتو مود|أوتو مود|منع الروابط|منع السبام|mention spam)/i.test(content)) {
    selected.add('automod_operations');
  }
  if (/(scheduled event|فعالية|ايفنت|إيفنت|حدث مجدول)/i.test(content)) selected.add('event_operations');
  if (/(emoji|ايموجي|إيموجي|sticker|ملصق|soundboard|ساوند بورد)/i.test(content)) {
    selected.add('expression_operations');
  }
  if (/(لوقات|لوق|logs?|log channel|سجل الاحداث|سجل الأحداث|سجلات|audit|سجل التدقيق|احصائيات|إحصائيات|stats|بوستات)/i.test(content)) {
    addGroup(TOOL_GROUPS.logging);
    selected.add('analytics_operations');
  }
  if (/(clone|نسخ الروم|غير اسم الروم|غيّر اسم الروم|topic|وصف الروم|nsfw|سلومود|slowmode|bitrate|حد المستخدمين|حد الروم|عدد الاشخاص|عدد الأشخاص|user limit|قفل الروم|فك قفل الروم|دعوة|invite|مزامنة الصلاحيات)/i.test(content)) {
    selected.add('channel_operations');
  }
  if (/(pin|ثبت الرسالة|ثبّت الرسالة|crosspost|نشر الإعلان|react|تفاعل على الرسالة|عدل رسالة البوت)/i.test(content)) {
    selected.add('message_operations');
  }
  if (/(clone role|نسخ الرتبة|لون الرتبة|hoist|mentionable|اعط.*رتبة.*للجميع|اسحب.*رتبة.*من الجميع)/i.test(content)) {
    selected.add('role_operations');
  }
  if (/(اسم السيرفر|وصف السيرفر|ايقونة السيرفر|أيقونة السيرفر|بنر السيرفر|مستوى التحقق|روم النظام|روم القوانين)/i.test(content)) {
    selected.add('guild_operations');
  }

  return selected;
}
