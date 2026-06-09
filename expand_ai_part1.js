const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'src', 'services', 'ai.ts');
const MARKER = 'export function runAIDiagnostics';

// ── helpers ──
let idCounter = 2000;
function sid(prefix) { return `${prefix}_${idCounter++}`; }

function sc(id, req, intent, tool, thinking, response, args) {
  return { scenarioId: id, userRequest: req, intendedIntent: intent, simulatedToolCall: tool, expectedBotThinking: thinking, expectedBotResponse: response, args };
}

// ══════════════════════════════════════════════════════════════
//  CATEGORY 1: MUSIC INTELLIGENCE (120 scenarios)
// ══════════════════════════════════════════════════════════════
const music = [];

// --- Play by name (various dialects) ---
const playRequests = [
  ["شغل لي اغنية تملي معاك", "تملي معاك", "gulf"],
  ["شغل اغنية حبيبي يا نور العين", "حبيبي يا نور العين", "gulf"],
  ["بغيت نسمع ديسباسيتو دابا", "ديسباسيتو", "maghreb"],
  ["شغل لي Shape of You يا حبيبي", "Shape of You", "gulf"],
  ["يلا حط لنا عمرو دياب نور العين", "نور العين عمرو دياب", "levantine"],
  ["شغل ام كلثوم الف ليله وليله", "الف ليله وليله ام كلثوم", "egyptian"],
  ["عطني اغنية فيروز نسم علينا الهوا", "نسم علينا الهوا فيروز", "levantine"],
  ["بدي اسمع كاظم الساهر قولي احبك", "قولي احبك كاظم الساهر", "iraqi"],
  ["حط لينا شاب خالد عايشة", "عايشة شاب خالد", "maghreb"],
  ["شغل لنا وائل كفوري صفحة وطويتا", "صفحة وطويتا وائل كفوري", "levantine"],
  ["يا زين شغل لي محمد عبده لو يوم احد", "لو يوم احد محمد عبده", "gulf"],
  ["شغل اغنية راشد الماجد فبالي كلام", "فبالي كلام راشد الماجد", "gulf"],
  ["حط لي عبد المجيد عبد الله عساك بخير", "عساك بخير عبد المجيد عبد الله", "gulf"],
  ["شغل ماجد المهندس احبك", "احبك ماجد المهندس", "gulf"],
  ["يا حلو شغل لي حسين الجسمي بشرة خير", "بشرة خير حسين الجسمي", "gulf"],
  ["افتح لنا اغنية شيرين آه يا ليل", "آه يا ليل شيرين", "egyptian"],
  ["شغل نانسي عجرم اخاصمك آه", "اخاصمك آه نانسي عجرم", "levantine"],
  ["بدي اسمع اليسا بتمنى من الله", "بتمنى من الله اليسا", "levantine"],
  ["حط لي تامر حسني ناسيني ليه", "ناسيني ليه تامر حسني", "egyptian"],
  ["شغل محمد حماقي واحشني", "واحشني محمد حماقي", "egyptian"],
  ["يلا شغل لنا Blinding Lights", "Blinding Lights", "gulf"],
  ["دير لينا اغنية Bohemian Rhapsody عفاك", "Bohemian Rhapsody", "maghreb"],
  ["بدي اسمع Imagine Dragons Believer", "Believer Imagine Dragons", "levantine"],
  ["شغل لي Hotel California يا غالي", "Hotel California", "gulf"],
  ["حط لنا اغنية Stairway to Heaven", "Stairway to Heaven", "levantine"],
  ["يلا شغل لنا شيلة يا وطنا الغالي", "شيلة يا وطنا الغالي", "gulf"],
  ["دور لي على اغنية قديمة طلال مداح", "طلال مداح", "gulf"],
  ["شغل لي ريمكس حماسي يشعلل الجو", "ريمكس حماسي", "gulf"],
  ["ابي اسمع لعبدالحليم حافظ اهواك", "اهواك عبدالحليم حافظ", "gulf"],
  ["شغل اغنية مغربية ديال سعد لمجرد", "سعد لمجرد", "maghreb"],
];

playRequests.forEach(([req, query, dialect]) => {
  music.push(sc(
    sid(`music_play_${dialect}`), req, "music_play", "play_music",
    `1. المستخدم طلب تشغيل أغنية باستخدام كلمة 'شغل' أو ما يعادلها. 2. لا أحتاج رابط، أبحث باسم الأغنية '${query}' مباشرة. 3. أقرأ USER_VOICE_CHANNEL من السياق لأدخل القناة الصوتية تلقائياً. 4. لا أسأل المستخدم عن الروم أبداً. 5. أشغل الأغنية وأرد بشكل ودي.`,
    `🎵 جاري تشغيل ${query}.. استمتع يا غالي!`,
    { query, requestingUserId: "context.USER_ID", voiceChannelId: "context.USER_VOICE_CHANNEL" }
  ));
});

// --- Play by YouTube URL ---
const urlRequests = [
  ["شغل لي هالرابط https://youtube.com/watch?v=abc123", "https://youtube.com/watch?v=abc123", "gulf"],
  ["حط هاللنك https://youtu.be/xyz789 يا معلم", "https://youtu.be/xyz789", "levantine"],
  ["شغل https://www.youtube.com/watch?v=test456 عفاك", "https://www.youtube.com/watch?v=test456", "maghreb"],
  ["يا حبيبي شغل لينا https://youtube.com/watch?v=qrs321", "https://youtube.com/watch?v=qrs321", "iraqi"],
  ["افتح هالفيديو https://youtu.be/mno654 يا باشا", "https://youtu.be/mno654", "egyptian"],
  ["شغل الرابط https://youtube.com/watch?v=def111 فديتك", "https://youtube.com/watch?v=def111", "gulf"],
  ["يلا حط https://www.youtube.com/watch?v=ghi222", "https://www.youtube.com/watch?v=ghi222", "levantine"],
  ["بغيت نسمع https://youtu.be/jkl333 دابا", "https://youtu.be/jkl333", "maghreb"],
  ["شغل لنا الاغنية هذي https://youtube.com/watch?v=pqr444", "https://youtube.com/watch?v=pqr444", "gulf"],
  ["حط الفيديو ده https://youtu.be/stu555 يا معلم", "https://youtu.be/stu555", "egyptian"],
];

urlRequests.forEach(([req, url, dialect]) => {
  music.push(sc(
    sid(`music_url_${dialect}`), req, "music_play_url", "play_music",
    `1. المستخدم أرسل رابط يوتيوب مباشر. 2. أكتشف أنه رابط URL وأستخدمه مباشرة بدون بحث. 3. أقرأ USER_VOICE_CHANNEL تلقائياً. 4. لا أسأل أبداً عن الروم. 5. أشغل الرابط فوراً.`,
    `🎵 جاري تشغيل الرابط.. استمتع!`,
    { url, requestingUserId: "context.USER_ID", voiceChannelId: "context.USER_VOICE_CHANNEL" }
  ));
});

// --- Auto-join (NEVER ask user to join voice) ---
const autoJoinScenarios = [
  "شغل اغنية وانا مو بروم صوتي", "شغل لي أغنية", "حط موسيقى هادية", "ابي اسمع شي حلو",
  "يلا بدنا موسيقى", "دور لي على أي شي حلو وشغله", "حط لي شي يهدي الأعصاب",
  "شغل أغاني حماسية", "ابي اسمع جديد ويجز", "شغل لي تريند اليوم",
];
autoJoinScenarios.forEach((req, i) => {
  music.push(sc(
    sid("music_autojoin"), req, "music_play", "play_music",
    `1. المستخدم طلب تشغيل موسيقى. 2. ⚠️ قاعدة حاسمة: لا أسأل المستخدم أبداً 'ادخل الروم الصوتي أول' أو 'لازم تكون بقناة صوتية'. 3. أقرأ USER_VOICE_CHANNEL من context تلقائياً. 4. إذا المستخدم مو بروم صوتي، أحاول أدخل الروم الافتراضي. 5. أشغل الموسيقى مباشرة.`,
    `🎵 تم! جاري التشغيل.. استمتع!`,
    { query: req.replace(/شغل|حط|دور|ابي اسمع/g, '').trim() || "موسيقى", requestingUserId: "context.USER_ID", voiceChannelId: "context.USER_VOICE_CHANNEL" }
  ));
});

// --- Volume control ---
const volumeScenarios = [
  ["ارفع الصوت", 130], ["وطي الصوت", 30], ["كتم الصوت", 0], ["خلي الصوت نص", 50],
  ["الصوت واطي وايد ارفعه", 150], ["الصوت عالي مرررة نزله شوي", 40],
  ["علي الصوت للماكس", 200], ["خل الصوت 80", 80], ["خلي الصوت ربع", 25],
  ["ارجع الصوت طبيعي", 70], ["يا باشا ارفع الصوت شوية", 120],
  ["وطي شوي عفاك", 35], ["الصوت مزعج وايد نزله", 20], ["زد الصوت يرحم والديك", 140],
  ["نقص الصوت شوي خويي", 45], ["الصوت ضعيف حبيبي قوه", 160],
  ["صوت البوت واطي مره", 170], ["نزل الصوت لين 10", 10], ["الصوت يكون 60 لو سمحت", 60],
  ["اجعل مستوى الصوت 90", 90],
];
volumeScenarios.forEach(([req, vol]) => {
  music.push(sc(
    sid("music_vol"), req, "music_volume", "set_volume",
    `1. المستخدم طلب تغيير مستوى الصوت. 2. أحلل الطلب: '${req}'. 3. أحدد المستوى المناسب: ${vol}%. 4. أتحقق أن القيمة بين 0-200. 5. أنفذ الأمر.`,
    `🔊 تم تعديل الصوت إلى ${vol}%`,
    { volume: vol }
  ));
});

// --- Queue management ---
const queueScenarios = [
  ["سكيب", "music_skip", "skip_music", "تخطي الأغنية الحالية"],
  ["التالي", "music_skip", "skip_music", "الانتقال للأغنية التالية"],
  ["نكست", "music_skip", "skip_music", "تخطي للتالي"],
  ["وقف الموسيقى", "music_stop", "stop_music", "إيقاف التشغيل"],
  ["أوقف", "music_stop", "stop_music", "إيقاف الموسيقى"],
  ["بوز", "music_pause", "pause_music", "إيقاف مؤقت"],
  ["وقف شوي", "music_pause", "pause_music", "إيقاف مؤقت"],
  ["كمل", "music_resume", "resume_music", "استئناف التشغيل"],
  ["رجع شغل", "music_resume", "resume_music", "استئناف التشغيل"],
  ["شوف الكيو", "music_queue", "show_queue", "عرض القائمة"],
  ["وش الاغاني اللي بالقائمة", "music_queue", "show_queue", "عرض قائمة الانتظار"],
  ["فرغ الكيو", "music_clear_queue", "clear_queue", "مسح القائمة"],
  ["امسح القائمة كلها", "music_clear_queue", "clear_queue", "مسح كل الأغاني"],
  ["خلط الاغاني", "music_shuffle", "shuffle_queue", "خلط عشوائي"],
  ["شفل", "music_shuffle", "shuffle_queue", "ترتيب عشوائي"],
  ["كرر الاغنية", "music_loop", "loop_music", "تكرار الأغنية الحالية"],
  ["لووب", "music_loop", "loop_music", "تفعيل التكرار"],
  ["شيل التكرار", "music_loop_off", "loop_music", "إيقاف التكرار"],
  ["طلعني من الروم", "music_disconnect", "disconnect_voice", "قطع الاتصال الصوتي"],
  ["اطلع من الصوتي", "music_disconnect", "disconnect_voice", "مغادرة القناة الصوتية"],
];
queueScenarios.forEach(([req, intent, tool, desc]) => {
  music.push(sc(
    sid("music_queue"), req, intent, tool,
    `1. المستخدم طلب: '${req}'. 2. أحدد نوع العملية: ${desc}. 3. أنفذ الأمر مباشرة بدون أسئلة إضافية.`,
    `✅ تم - ${desc}!`,
    {}
  ));
});

// ══════════════════════════════════════════════════════════════
//  CATEGORY 2: CHANNEL MANAGEMENT (120 scenarios)
// ══════════════════════════════════════════════════════════════
const channels = [];

// --- Create text channels ---
const textChannels = [
  ["سو لي قناة نصية اسمها اعلانات", "📢┃اعلانات", "gulf"],
  ["اعمل روم اسمه شات عام يا معلم", "💬┃شات-عام", "levantine"],
  ["سوي تكست شانل اسمه قوانين السيرفر", "📋┃قوانين-السيرفر", "gulf"],
  ["اعمل قناة اسمها ترحيب بالأعضاء الجدد يا باشا", "👋┃ترحيب", "egyptian"],
  ["دير لينا شات جديد سميه مقترحات", "💡┃مقترحات", "maghreb"],
  ["سو قناة نصية سمها تذاكر الدعم", "🎫┃تذاكر-الدعم", "gulf"],
  ["اعمل روم للميمز يا زلمة", "😂┃ميمز", "levantine"],
  ["سوي لي قناة اسمها سوق وبيع", "🛒┃سوق-وبيع", "gulf"],
  ["اعمل شات للأنمي يا صديقي", "🎌┃انمي", "iraqi"],
  ["دير لينا قناة اسمها نقاشات حرة", "🗣️┃نقاشات-حرة", "maghreb"],
  ["سوي قناة اسمها تحديثات البوت", "🤖┃تحديثات-البوت", "gulf"],
  ["اعمل لي روم سيلفي", "📸┃سيلفي", "egyptian"],
  ["سو قناة للقرآن الكريم", "🕌┃القرآن-الكريم", "gulf"],
  ["اعمل قناة مسابقات", "🏆┃مسابقات", "levantine"],
  ["سوي قناة اسمها بوتات", "🤖┃بوتات", "gulf"],
];
textChannels.forEach(([req, name, dialect]) => {
  channels.push(sc(
    sid(`chan_text_${dialect}`), req, "channel_create", "create_channels",
    `1. المستخدم طلب إنشاء قناة نصية. 2. نوع القناة: text (type=0 في Discord API). 3. أسمي القناة '${name}' مع إيموجي مناسب. 4. أنشئ القناة مباشرة.`,
    `✅ تم إنشاء القناة ${name} بنجاح!`,
    { type: "text", names: [name] }
  ));
});

// --- Create voice channels ---
const voiceChannels = [
  ["سو لي روم صوتي اسمه جلسة عامة", "🔊┃جلسة-عامة", "gulf"],
  ["اعمل فويس روم اسمه البث المباشر", "🎙️┃البث-المباشر", "levantine"],
  ["سوي روم فويس سمه قيمنق", "🎮┃قيمنق", "gulf"],
  ["اعمل غرفة صوتية للدراسة يا عمي", "📚┃غرفة-الدراسة", "iraqi"],
  ["دير روم صوتي سمه موسيقى", "🎶┃موسيقى", "maghreb"],
  ["سو فويس شانل سمه اجتماعات", "📋┃اجتماعات", "gulf"],
  ["اعمل روم صوتي VIP", "👑┃VIP", "egyptian"],
  ["سوي لي روم لودبي", "🏠┃لوبي", "gulf"],
  ["اعمل روم AFK يا معلم", "💤┃AFK", "levantine"],
  ["دير روم صوتي خاص بالبنات", "🌸┃بنات", "maghreb"],
];
voiceChannels.forEach(([req, name, dialect]) => {
  channels.push(sc(
    sid(`chan_voice_${dialect}`), req, "channel_create", "create_channels",
    `1. المستخدم طلب إنشاء قناة صوتية. 2. نوع القناة: voice (type=2 في Discord API). 3. أسمي القناة '${name}'. 4. أنشئها مباشرة.`,
    `✅ تم إنشاء الروم الصوتي ${name}!`,
    { type: "voice", names: [name] }
  ));
});

// --- Create categories ---
const categoryScenarios = [
  ["سو لي فئة اسمها إدارة", "⚙️┃إدارة", "gulf"],
  ["اعمل كاتيقوري اسمها ترفيه يا معلم", "🎉┃ترفيه", "levantine"],
  ["سوي لي فئة تصنيف اسمها عام", "📌┃عام", "gulf"],
  ["دير كاتيجوري اسمها تعليم", "📚┃تعليم", "maghreb"],
  ["اعمل فئة اسمها VIP يا صديقي", "👑┃VIP", "iraqi"],
  ["سو كاتقوري اسمها ألعاب", "🎮┃ألعاب", "gulf"],
  ["اعمل فئة اسمها موسيقى", "🎵┃موسيقى", "egyptian"],
  ["سوي لي كاتقوري سمها أرشيف", "📦┃أرشيف", "gulf"],
  ["دير فئة اسمها مسابقات عفاك", "🏅┃مسابقات", "maghreb"],
  ["سو فئة اسمها دعم فني", "🛠️┃دعم-فني", "gulf"],
];
categoryScenarios.forEach(([req, name, dialect]) => {
  channels.push(sc(
    sid(`chan_cat_${dialect}`), req, "channel_create_category", "create_channels",
    `1. المستخدم طلب إنشاء فئة (category). 2. نوع القناة: category (type=4 في Discord API). 3. الاسم: '${name}'. 4. الفئة تعمل كمجلد يحتوي على قنوات.`,
    `✅ تم إنشاء الفئة ${name}!`,
    { type: "category", names: [name] }
  ));
});

// --- Delete channels (NEVER delete current channel) ---
const deleteScenarios = [
  ["احذف قناة الاختبار", "channel_delete", "target_channel_id", "gulf"],
  ["شيل الروم القديم يا حبيبي", "channel_delete", "target_channel_id", "gulf"],
  ["امسح القناة هاي يا معلم", "channel_delete", "target_channel_id", "levantine"],
  ["حيد هاد الشات", "channel_delete", "target_channel_id", "maghreb"],
  ["امسح الروم ده يا باشا", "channel_delete", "target_channel_id", "egyptian"],
  ["شيل القناة الفاضية فديتك", "channel_delete", "target_channel_id", "gulf"],
  ["يلا احذف هالروم ما نحتاجه", "channel_delete", "target_channel_id", "levantine"],
  ["حبيبي شيل لي الشانل هذي", "channel_delete", "target_channel_id", "gulf"],
  ["خويي احذف لي هالقناة", "channel_delete", "target_channel_id", "iraqi"],
  ["صاحبي حيد لينا هاد الروم", "channel_delete", "target_channel_id", "maghreb"],
];
deleteScenarios.forEach(([req, intent, chanId, dialect]) => {
  channels.push(sc(
    sid(`chan_del_${dialect}`), req, intent, "delete_channels",
    `1. المستخدم طلب حذف قناة. 2. ⚠️ قاعدة حاسمة: أتحقق أن القناة المطلوب حذفها ليست هي CHANNEL_ID (القناة الحالية). 3. إذا كانت نفس القناة أرفض وأشرح السبب. 4. إذا مختلفة، أحذفها.`,
    `✅ تم حذف القناة بنجاح!`,
    { channelIds: [chanId] }
  ));
});

// --- NEVER delete current channel ---
const neverDeleteCurrent = [
  "احذف هالقناة اللي احنا فيها",
  "شيل هالروم اللي نتكلم فيه",
  "امسح الشات هذا",
  "حبيبي احذف القناة الحالية",
  "دير لينا حذف لهاد الروم اللي حنا فيه",
];
neverDeleteCurrent.forEach((req) => {
  channels.push(sc(
    sid("chan_nodelete"), req, "channel_delete_rejected", "none",
    `1. المستخدم طلب حذف القناة الحالية. 2. ⛔ قاعدة أمان صارمة: لا أحذف أبداً القناة التي أتواصل فيها مع المستخدم (context.CHANNEL_ID). 3. أرفض الطلب وأشرح أن حذف القناة الحالية سيقطع التواصل. 4. أقترح حذف قناة أخرى بدلاً من ذلك.`,
    `⚠️ ما أقدر أحذف القناة اللي نتكلم فيها الحين! لو حذفتها بنفقد التواصل. حدد لي قناة ثانية وأحذفها لك.`,
    {}
  ));
});

// --- Channel with permissions ---
const permChannels = [
  ["سو قناة خاصة للإدارة ما يشوفها أحد", "🔒┃إدارة-خاصة", "text", ["VIEW_CHANNEL"], "gulf"],
  ["اعمل قناة للإداريين بس يا زلمة", "🛡️┃الإداريين", "text", ["SEND_MESSAGES", "VIEW_CHANNEL"], "levantine"],
  ["سوي قناة مقفلة للمشرفين فقط", "🔐┃المشرفين-فقط", "text", ["VIEW_CHANNEL", "MANAGE_MESSAGES"], "gulf"],
  ["دير قناة خاصة بالمالك", "👑┃المالك", "text", ["ADMINISTRATOR"], "maghreb"],
  ["اعمل قناة قراءة فقط للأعضاء يا باشا", "📖┃قراءة-فقط", "text", ["VIEW_CHANNEL"], "egyptian"],
];
permChannels.forEach(([req, name, type, perms, dialect]) => {
  channels.push(sc(
    sid(`chan_perm_${dialect}`), req, "channel_create_private", "create_channels",
    `1. المستخدم طلب قناة بصلاحيات خاصة. 2. أنشئ القناة '${name}' من نوع ${type}. 3. أمنع @everyone من الوصول. 4. أسمح فقط للرتبة المحددة بالصلاحيات: ${perms.join(', ')}. 5. في Discord API: permission overwrites.`,
    `✅ تم إنشاء ${name} بصلاحيات خاصة!`,
    { type, names: [name], permissions: [{ id: "everyone_role_id", allow: [], deny: perms }, { id: "admin_role_id", allow: perms, deny: [] }] }
  ));
});

// --- Multiple channels at once ---
const multiChannels = [
  ["سو لي 3 قنوات: اعلانات وقوانين وترحيب", ["📢┃اعلانات", "📋┃قوانين", "👋┃ترحيب"], "text", "gulf"],
  ["اعمل قنوات: عام وميمز ونقاشات", ["💬┃عام", "😂┃ميمز", "🗣️┃نقاشات"], "text", "levantine"],
  ["سوي لي رومات صوتية: جلسة 1 وجلسة 2 وجلسة 3", ["🔊┃جلسة-1", "🔊┃جلسة-2", "🔊┃جلسة-3"], "voice", "gulf"],
  ["يا باشا اعمل كذا قناة: اخبار ومسابقات وتواصل", ["📰┃اخبار", "🏆┃مسابقات", "📞┃تواصل"], "text", "egyptian"],
  ["دير لينا 3 رومات صوتية: قيمنق ودردشة وموسيقى", ["🎮┃قيمنق", "💬┃دردشة", "🎶┃موسيقى"], "voice", "maghreb"],
];
multiChannels.forEach(([req, names, type, dialect]) => {
  channels.push(sc(
    sid(`chan_multi_${dialect}`), req, "channel_create_bulk", "create_channels",
    `1. المستخدم طلب إنشاء عدة قنوات دفعة واحدة. 2. أحدد الأسماء: ${names.join(', ')}. 3. النوع: ${type}. 4. أضيف إيموجي مناسب لكل قناة. 5. أنشئها كلها في طلب واحد.`,
    `✅ تم إنشاء ${names.length} قنوات بنجاح!`,
    { type, names }
  ));
});

// --- Channel type knowledge ---
const typeKnowledge = [
  ["وش أنواع القنوات الموجودة بالديسكورد", "channel_types_info", "none",
    `أنواع القنوات في Discord API:\n• 0 = Text Channel (نصية)\n• 2 = Voice Channel (صوتية)\n• 4 = Category (فئة)\n• 5 = Announcement/News (إعلانات)\n• 13 = Stage Channel (منصة)\n• 15 = Forum Channel (منتدى)\nكل نوع له استخدام مختلف وصلاحيات خاصة.`],
  ["كيف اسوي قناة ستيج", "channel_create_stage", "create_channels",
    `قناة Stage (type=13) هي قناة منصة للبث المباشر. يمكن لشخص واحد أو أكثر التحدث بينما يستمع الباقون. مثالية للمحاضرات والندوات.`],
  ["وش الفرق بين الفويس والستيج", "channel_info", "none",
    `Voice (type=2): الكل يقدر يتكلم. Stage (type=13): فقط المتحدثون المعتمدون يتكلمون، الباقي مستمعين. Stage أفضل للفعاليات الكبيرة.`],
  ["كيف اسوي قناة فورم", "channel_create_forum", "create_channels",
    `Forum (type=15): قناة منتدى. كل عضو يقدر يفتح موضوع (thread) جديد. مثالية للأسئلة والأجوبة والنقاشات المنظمة.`],
  ["ابي قناة اعلانات", "channel_create_announcement", "create_channels",
    `Announcement (type=5): قناة إعلانات. يمكن للسيرفرات الأخرى متابعتها (follow). مثالية للأخبار الرسمية والتحديثات.`],
];
typeKnowledge.forEach(([req, intent, tool, info]) => {
  channels.push(sc(
    sid("chan_knowledge"), req, intent, tool,
    `1. المستخدم يسأل عن أنواع القنوات أو كيفية إنشاء نوع معين. 2. أشرح المعلومة بوضوح مع أرقام الأنواع من Discord API. 3. أقدم نصائح عملية.`,
    info,
    {}
  ));
});


// ══════════════════════════════════════════════════════════════
//  CATEGORY 3: ROLE & PERMISSION INTELLIGENCE (120 scenarios)
// ══════════════════════════════════════════════════════════════
const roles = [];

// --- Create roles ---
const createRoles = [
  ["سو لي رتبة اسمها أدمن لونها أحمر", "أدمن", "#FF0000", true, true, "gulf"],
  ["اعمل رول اسمه مشرف لونه أزرق يا معلم", "مشرف", "#0000FF", true, true, "levantine"],
  ["سوي رتبة VIP لونها ذهبي", "VIP", "#FFD700", true, false, "gulf"],
  ["اعمل رتبة اسمها عضو مميز لونها أخضر يا باشا", "عضو مميز", "#00FF00", true, true, "egyptian"],
  ["دير رتبة جديدة سميها مؤسس لونها بنفسجي", "مؤسس", "#800080", true, false, "maghreb"],
  ["سو رتبة ديف لونها برتقالي", "مطور", "#FF8C00", true, true, "gulf"],
  ["اعمل رول اسمه بوستر لونه وردي", "بوستر", "#FF69B4", true, true, "levantine"],
  ["سوي لي رتبة يوتيوبر لونها احمر غامق", "يوتيوبر", "#DC143C", true, false, "gulf"],
  ["اعمل رتبة اسمها مصمم لونها سماوي", "مصمم", "#00CED1", true, true, "iraqi"],
  ["دير رتبة اسمها DJ لونها بنفسجي غامق", "DJ", "#9400D3", false, true, "maghreb"],
  ["سو لي رتبة اسمها Helper لونها أصفر", "Helper", "#FFFF00", true, true, "gulf"],
  ["اعمل رتبة Trial Mod لونها خضراء فاتحة", "Trial Mod", "#90EE90", true, false, "levantine"],
  ["سوي رتبة اسمها ناشط لونها برتقالية", "ناشط", "#FFA500", false, true, "gulf"],
  ["اعمل لي رتبة OG لونها رمادي", "OG", "#808080", true, false, "egyptian"],
  ["سو رتبة اسمها نايتر لونها كحلي", "نايتر", "#191970", false, true, "gulf"],
];
createRoles.forEach(([req, name, color, hoist, mentionable, dialect]) => {
  roles.push(sc(
    sid(`role_create_${dialect}`), req, "role_create", "manage_roles",
    `1. المستخدم طلب إنشاء رتبة جديدة. 2. الاسم: '${name}'. 3. اللون: ${color} (أتحقق أنه hex صالح). 4. hoist=${hoist} (إظهار منفصل). 5. mentionable=${mentionable} (قابلة للمنشن). 6. أتحقق أن البوت لديه صلاحية MANAGE_ROLES.`,
    `✅ تم إنشاء رتبة ${name} بلون ${color}!`,
    { action: "create", roleData: { name, color, hoist, mentionable } }
  ));
});

// --- Assign roles ---
const assignRoles = [
  ["عطي محمد رتبة VIP", "assign", "target_member_id", "vip_role_id", "gulf"],
  ["ادي أحمد رول أدمن يا معلم", "assign", "target_member_id", "admin_role_id", "levantine"],
  ["حط لفيصل رتبة مشرف فديتك", "assign", "target_member_id", "mod_role_id", "gulf"],
  ["اعطي سارة رول مميز يا باشا", "assign", "target_member_id", "special_role_id", "egyptian"],
  ["دير لخالد رتبة DJ صاحبي", "assign", "target_member_id", "dj_role_id", "maghreb"],
  ["عطيه رتبة يوتيوبر يا غالي", "assign", "target_member_id", "yt_role_id", "gulf"],
  ["حط لهالعضو رتبة مصمم", "assign", "target_member_id", "designer_role_id", "gulf"],
  ["ادي البنت دي رتبة بوستر", "assign", "target_member_id", "booster_role_id", "egyptian"],
  ["خله مؤسس يا حبيبي", "assign", "target_member_id", "founder_role_id", "gulf"],
  ["اعطيه رول ناشط عيني", "assign", "target_member_id", "active_role_id", "iraqi"],
];
assignRoles.forEach(([req, action, memberId, roleId, dialect]) => {
  roles.push(sc(
    sid(`role_assign_${dialect}`), req, "role_assign", "manage_roles",
    `1. المستخدم طلب إعطاء رتبة لعضو. 2. أتحقق من هرمية الرتب: الرتبة المطلوبة يجب أن تكون أقل من أعلى رتبة للبوت. 3. أتحقق أن البوت يملك MANAGE_ROLES. 4. أعين الرتبة.`,
    `✅ تم إعطاء الرتبة بنجاح!`,
    { action, roleData: { roleId }, targetMemberId: memberId }
  ));
});

// --- Remove roles ---
const removeRoles = [
  ["شيل من محمد رتبة VIP", "remove", "target_member_id", "vip_role_id", "gulf"],
  ["انزع من أحمد رول أدمن", "remove", "target_member_id", "admin_role_id", "levantine"],
  ["شيل عنه رتبة المشرف فديتك", "remove", "target_member_id", "mod_role_id", "gulf"],
  ["حيد من خالد الرتبة صاحبي", "remove", "target_member_id", "role_id", "maghreb"],
  ["شيل الرول من العضو ده يا باشا", "remove", "target_member_id", "role_id", "egyptian"],
  ["انزع منه رتبة DJ", "remove", "target_member_id", "dj_role_id", "gulf"],
  ["شيل عن العضو هذا كل الرتب", "remove", "target_member_id", "all_roles", "gulf"],
  ["حبيبي شيل رتبة يوتيوبر من سارة", "remove", "target_member_id", "yt_role_id", "gulf"],
  ["انزع الرتبة منه عيني", "remove", "target_member_id", "role_id", "iraqi"],
  ["يلا شيل الرول عنها", "remove", "target_member_id", "role_id", "levantine"],
];
removeRoles.forEach(([req, action, memberId, roleId, dialect]) => {
  roles.push(sc(
    sid(`role_remove_${dialect}`), req, "role_remove", "manage_roles",
    `1. المستخدم طلب إزالة رتبة من عضو. 2. أتحقق من هرمية الرتب. 3. الرتبة المراد إزالتها يجب أن تكون أقل من رتبة البوت. 4. أزيل الرتبة.`,
    `✅ تم إزالة الرتبة بنجاح!`,
    { action, roleData: { roleId }, targetMemberId: memberId }
  ));
});

// --- Edit roles ---
const editRoles = [
  ["غير لون رتبة VIP لأزرق", "edit", "vip_role_id", "#0000FF", null, "gulf"],
  ["عدل اسم رتبة المشرف لسوبر مشرف", "edit", "mod_role_id", null, "سوبر مشرف", "levantine"],
  ["غير لون الأدمن لأحمر غامق يا باشا", "edit", "admin_role_id", "#8B0000", null, "egyptian"],
  ["حبيبي غير اسم الرتبة لملك السيرفر", "edit", "role_id", null, "ملك السيرفر", "gulf"],
  ["عدل لون رتبة DJ لوردي", "edit", "dj_role_id", "#FF1493", null, "gulf"],
  ["غير اسم الرول لبطل الأسبوع", "edit", "role_id", null, "بطل الأسبوع", "gulf"],
  ["يلا غير لون المؤسس لذهبي", "edit", "founder_role_id", "#FFD700", null, "levantine"],
  ["بدل لون Helper لأخضر فاتح", "edit", "helper_role_id", "#7CFC00", null, "gulf"],
  ["دير تعديل اسم الرتبة لمبدع عفاك", "edit", "role_id", null, "مبدع", "maghreb"],
  ["خل اسم الرتبة يكون أسطورة", "edit", "role_id", null, "أسطورة", "gulf"],
];
editRoles.forEach(([req, action, roleId, color, name, dialect]) => {
  const roleData = { roleId };
  if (color) roleData.color = color;
  if (name) roleData.name = name;
  roles.push(sc(
    sid(`role_edit_${dialect}`), req, "role_edit", "manage_roles",
    `1. المستخدم طلب تعديل رتبة موجودة. 2. أتحقق أن الرتبة أقل من رتبة البوت في الهرمية. 3. أعدل ${color ? 'اللون إلى ' + color : 'الاسم إلى ' + name}. 4. أتحقق من صحة الهيكس كود إذا كان لون.`,
    `✅ تم تعديل الرتبة بنجاح!`,
    { action, roleData }
  ));
});

// --- Delete roles ---
const deleteRoles = [
  ["احذف رتبة الاختبار", "delete", "test_role_id", "gulf"],
  ["شيل الرول القديم يا معلم", "delete", "old_role_id", "levantine"],
  ["امسح رتبة Trial Mod يا باشا", "delete", "trial_role_id", "egyptian"],
  ["حيد هاد الرتبة صاحبي", "delete", "role_id", "maghreb"],
  ["احذف رتبة الزوار", "delete", "visitor_role_id", "gulf"],
];
deleteRoles.forEach(([req, action, roleId, dialect]) => {
  roles.push(sc(
    sid(`role_del_${dialect}`), req, "role_delete", "manage_roles",
    `1. المستخدم طلب حذف رتبة. 2. أتحقق أنها ليست رتبة @everyone (لا يمكن حذفها). 3. أتحقق أنها أقل من رتبة البوت. 4. أحذفها.`,
    `✅ تم حذف الرتبة!`,
    { action, roleData: { roleId } }
  ));
});

// --- Permission hierarchy knowledge ---
const permKnowledge = [
  ["وش صلاحية ADMINISTRATOR", "perm_info", "none",
    `صلاحية ADMINISTRATOR (0x8) هي أقوى صلاحية في Discord. تعطي صاحبها كل الصلاحيات وتتجاوز كل القيود حتى permission overwrites على القنوات. ⚠️ خطيرة جداً، لا تعطيها إلا للموثوقين.`],
  ["كيف أمنع عضو من الكتابة بقناة معينة", "perm_deny", "edit_permissions",
    `أستخدم permission overwrite على القناة: أمنع SEND_MESSAGES (0x800) للعضو المحدد. هذا يمنعه من الكتابة بهذه القناة فقط بدون التأثير على باقي القنوات.`],
  ["وش يعني هرمية الرتب", "role_hierarchy_info", "none",
    `هرمية الرتب في Discord: الرتبة الأعلى موقعاً = أقوى. البوت لا يقدر يدير رتبة أعلى من أعلى رتبة عنده. يعني إذا رتبة البوت رقم 5، ما يقدر يعدل أو يحذف رتبة رقم 6 أو أعلى. لازم رتبة البوت تكون فوق الرتب اللي يديرها.`],
  ["ليه البوت ما يقدر يعطي رتبة معينة", "role_hierarchy_error", "none",
    `السبب: هرمية الرتب. البوت لا يستطيع إدارة رتبة مساوية أو أعلى من أعلى رتبة لديه. الحل: ارفع رتبة البوت لتكون أعلى من الرتبة المطلوبة في إعدادات السيرفر > الرتب.`],
  ["وش الفرق بين allow و deny بالصلاحيات", "perm_overwrite_info", "none",
    `في Discord Permission Overwrites:\n• Allow: يسمح بالصلاحية حتى لو الرتبة الأساسية ما عندها.\n• Deny: يمنع الصلاحية حتى لو الرتبة الأساسية عندها.\n• Neutral (لا allow ولا deny): يرجع للرتبة الأساسية.\nالأولوية: deny عضو > allow عضو > deny رتبة > allow رتبة > صلاحيات @everyone.`],
  ["وش أهم الصلاحيات بالديسكورد", "perm_list", "none",
    `أهم الصلاحيات:\n• ADMINISTRATOR (0x8) - كل شي\n• MANAGE_GUILD (0x20) - إدارة السيرفر\n• MANAGE_ROLES (0x10000000) - إدارة الرتب\n• MANAGE_CHANNELS (0x10) - إدارة القنوات\n• KICK_MEMBERS (0x2) - طرد\n• BAN_MEMBERS (0x4) - حظر\n• MANAGE_MESSAGES (0x2000) - إدارة الرسائل\n• SEND_MESSAGES (0x800) - إرسال رسائل\n• VIEW_CHANNEL (0x400) - رؤية القنوات\n• CONNECT (0x100000) - الاتصال بالصوتي\n• SPEAK (0x200000) - التحدث`],
  ["كيف أسوي قناة ما يشوفها غير الأدمن", "perm_private_channel", "edit_permissions",
    `1. أنشئ القناة. 2. أمنع @everyone من VIEW_CHANNEL. 3. أسمح لرتبة الأدمن بـ VIEW_CHANNEL. هذا يخلي القناة مخفية عن الكل ماعدا الأدمن.`],
  ["البوت يقول missing permissions وش أسوي", "perm_missing_fix", "none",
    `خطأ Missing Permissions (code: 50013) يعني البوت ما عنده الصلاحية المطلوبة. الحلول:\n1. تأكد من صلاحيات رتبة البوت.\n2. تأكد من هرمية الرتب (رتبة البوت فوق).\n3. تأكد من permission overwrites على القناة.\n4. أعد دعوة البوت بصلاحيات أكثر.`],
  ["وش يعني rate limit", "rate_limit_info", "none",
    `Rate Limit في Discord API: حد أقصى لعدد الطلبات خلال فترة معينة. إذا تجاوزت الحد تحصل على خطأ 429 Too Many Requests. لازم تنتظر retry_after ثواني قبل ما ترسل طلب جديد. مهم للحذف الجماعي وإنشاء القنوات.`],
  ["كيف أخلي رتبة تظهر منفصلة بقائمة الأعضاء", "role_hoist", "manage_roles",
    `خاصية hoist=true تخلي أعضاء هالرتبة يظهرون في مجموعة منفصلة بقائمة الأعضاء الجانبية بدل ما يكونون مع Online العام. مفيدة للرتب المهمة مثل الإدارة والمشرفين.`],
];
permKnowledge.forEach(([req, intent, tool, info]) => {
  roles.push(sc(
    sid("role_knowledge"), req, intent, tool,
    `1. المستخدم يسأل عن صلاحيات أو هرمية الرتب. 2. أقدم معلومات دقيقة من Discord API. 3. أشمل أرقام الصلاحيات (bit flags) والأكواد. 4. أقدم نصائح عملية.`,
    info,
    {}
  ));
});

// --- Permission bit flags scenarios ---
const bitFlagScenarios = [
  ["عطيه صلاحية إدارة الرسائل", "MANAGE_MESSAGES", "0x2000"],
  ["عطيه صلاحية طرد الأعضاء", "KICK_MEMBERS", "0x2"],
  ["عطيه صلاحية حظر الأعضاء", "BAN_MEMBERS", "0x4"],
  ["عطيه صلاحية إدارة القنوات", "MANAGE_CHANNELS", "0x10"],
  ["عطيه صلاحية إدارة السيرفر", "MANAGE_GUILD", "0x20"],
  ["اعطيه صلاحية ادارة الرتب", "MANAGE_ROLES", "0x10000000"],
  ["خله يقدر يرسل رسائل", "SEND_MESSAGES", "0x800"],
  ["خله يقدر يتكلم بالصوتي", "SPEAK", "0x200000"],
  ["خله يقدر يدخل الصوتي", "CONNECT", "0x100000"],
  ["خله يشوف القنوات", "VIEW_CHANNEL", "0x400"],
];
bitFlagScenarios.forEach(([req, perm, flag]) => {
  roles.push(sc(
    sid("role_bitflag"), req, "perm_grant", "edit_permissions",
    `1. المستخدم يطلب منح صلاحية ${perm} (${flag}). 2. أتحقق أن البوت يملك هذه الصلاحية أولاً. 3. أضيفها كـ permission overwrite. 4. البوت لا يمنح صلاحيات أعلى مما يملك.`,
    `✅ تم منح صلاحية ${perm}!`,
    { channelId: "target_channel_id", targetId: "target_id", targetType: "role", allow: [perm], deny: [] }
  ));
});

// --- Error handling scenarios ---
const errorScenarios = [
  ["سويت رتبة وطلع خطأ 50013", "error_50013", "none",
    "خطأ 50013 = Missing Permissions. البوت ما عنده الصلاحية المطلوبة. ارفع رتبة البوت بالسيرفر."],
  ["البوت يقول 50001 وش يعني", "error_50001", "none",
    "خطأ 50001 = Missing Access. البوت ما يقدر يوصل للقناة. تأكد من صلاحية VIEW_CHANNEL للبوت."],
  ["خطأ 30005 وش المشكلة", "error_30005", "none",
    "خطأ 30005 = Maximum number of guild roles reached (250). السيرفر وصل الحد الأقصى للرتب. احذف رتب ما تحتاجها."],
  ["خطأ 10003 وش أسوي", "error_10003", "none",
    "خطأ 10003 = Unknown Channel. القناة المطلوبة مو موجودة أو محذوفة. تأكد من ID القناة."],
  ["خطأ 50035 طلع لي", "error_50035", "none",
    "خطأ 50035 = Invalid Form Body. البيانات المرسلة فيها مشكلة. تأكد من صحة الأسماء والألوان والأرقام."],
];
errorScenarios.forEach(([req, intent, tool, info]) => {
  roles.push(sc(
    sid("error_handling"), req, intent, tool,
    `1. المستخدم واجه خطأ من Discord API. 2. أحلل كود الخطأ وأشرح معناه بالعربي. 3. أقدم حلول عملية. 4. هذه معرفة مهمة لتشخيص المشاكل.`,
    info, {}
  ));
});

// ══════════════════════════════════════════════════════════════
//  Combine all and write to file
// ══════════════════════════════════════════════════════════════
const allScenarios = [...music, ...channels, ...roles];

console.log(`Total scenarios generated: ${allScenarios.length}`);
console.log(`  Music: ${music.length}`);
console.log(`  Channels: ${channels.length}`);
console.log(`  Roles: ${roles.length}`);

// Read file
let content = fs.readFileSync(FILE, 'utf-8');

// Find the closing ]; of EXTENDED_CONVERSATIONAL_SCENARIOS_DATABASE
// It's the ]; on line 13919 right before the diagnostics section
const markerIndex = content.indexOf(MARKER);
if (markerIndex === -1) {
  console.error('ERROR: Could not find export function runAIDiagnostics');
  process.exit(1);
}

// Search backwards from marker for "];"
const beforeMarker = content.substring(0, markerIndex);
const closingIndex = beforeMarker.lastIndexOf('];');
if (closingIndex === -1) {
  console.error('ERROR: Could not find closing ];');
  process.exit(1);
}

// Format scenarios as JSON strings
const scenarioStrings = allScenarios.map(s => JSON.stringify(s, null, 4));
const insertBlock = ',\n\n  // ════════════════════════════════════════════════════════════════════\n  //  EXPANDED INTELLIGENCE DATABASE - Part 1 (Auto-generated)\n  //  Music Intelligence + Channel Management + Role & Permission Knowledge\n  //  Total new scenarios: ' + allScenarios.length + '\n  // ════════════════════════════════════════════════════════════════════\n\n  ' + scenarioStrings.join(',\n\n  ');

// Insert before the ];
const newContent = content.substring(0, closingIndex) + insertBlock + '\n\n' + content.substring(closingIndex);

fs.writeFileSync(FILE, newContent, 'utf-8');

const newLineCount = newContent.split('\n').length;
console.log(`\nDone! File updated successfully.`);
console.log(`Old line count: ~13976`);
console.log(`New line count: ~${newLineCount}`);
console.log(`Lines added: ~${newLineCount - 13976}`);
