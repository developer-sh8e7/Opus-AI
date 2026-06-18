const ACTION_TERMS = [
  'احذف',
  'حذف',
  'سو ',
  'سوي',
  'انشئ',
  'أنشئ',
  'اضف',
  'أضف',
  'غير',
  'غيّر',
  'عدل',
  'عدّل',
  'حظر',
  'بان',
  'طرد',
  'كيك',
  'كتم',
  'تايم',
  'روم',
  'قناة',
  'رتبة',
  'رول',
  'صلاحية',
  'برمشن',
  'سيرفر',
  'متجر',
  'ايمبد',
  'embed',
  'delete',
  'create',
  'change',
  'ban',
  'kick',
  'timeout',
  'role',
  'channel',
  'server',
  'سيرفر',
  'رومات',
  'رتب',
  'رولات',
  'صلاحيات',
  'برمشنات',
  'منشن',
  'دسكونكت',
  'دسكنوكت',
  'ديسكونكت',
  'ديسكنكت',
  'voicekick',
  'فويس',
  'صوتي',
  'سكرين',
  'شير',
];

function normalize(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasActionIntent(text: string): boolean {
  // Check for mention of any Discord entities or actions
  return ACTION_TERMS.some((term) => text.includes(term));
}

export function getConversationReply(input: string): string | null {
  const text = normalize(input);
  
  // If the message has action intent or is long enough to be a request, let AI handle it
  if (!text || text.length > 100 || hasActionIntent(text)) return null;

  // Only handle very short, purely social messages here.
  // Everything else goes to the AI for natural handling.
  
  // Pure greeting (very short, just a greeting word or two)
  if (/^(السلام عليكم|سلام عليكم|وعليكم السلام)\s*$/.test(text)) {
    return 'وعليكم السلام والرحمة 😊 كيف أقدر أخدمك؟';
  }

  if (/^(هلا|هلا والله|مرحبا|اهلين|هاي)\s*$/.test(text)) {
    return 'هلا والله 👋 نورت، وش تبغى أسوي لك؟';
  }
  
  // Pure "thank you" — no other content
  if (/^(شكرا|مشكور|يعطيك العافيه|تسلم|كفو)\s*$/.test(text)) {
    return 'العفو يا بعدي 🤝 أنا موجود لو احتجت شيء.';
  }

  // Pure "who are you" — no other content  
  if (/^(من انت|وش انت|وش البوت|عرف بنفسك)\s*$/.test(text)) {
    return 'أنا Opus Ai، مساعد ديسكورد ذكي: أفهم طلبك بالعربي، أنفذ الإجراءات، وأدير السيرفر بذكاء 🧠';
  }

  // For everything else including "كيف حالك", "تمام", "الو", "الحمدلله", "طيب", "اوكي"
  // let the AI handle it naturally instead of returning canned responses.
  // This gives a warmer, more varied conversational experience.
  return null;
}
