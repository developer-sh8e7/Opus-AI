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
  return ACTION_TERMS.some((term) => text.includes(term));
}

export function getConversationReply(input: string): string | null {
  const text = normalize(input);
  if (!text || text.length > 120 || hasActionIntent(text)) return null;

  if (/(كيف حالك|كيفك|شلونك|وش اخبارك|علومك|عساك بخير)/.test(text)) {
    return 'بخير دامك بخير يا شيخ 😄 وش أخبارك أنت؟';
  }

  if (/^(السلام عليكم|سلام عليكم|هلا|هلا والله|مرحبا|اهلين|هاي|hello|hi)\b/.test(text)) {
    return 'ياهلا والله 👋 نورت، كيف أقدر أخدمك؟';
  }

  if (/(شكرا|مشكور|يعطيك العافيه|تسلم|كفو)/.test(text)) {
    return 'العفو يا بعدي، بالخدمة دائمًا 🤝';
  }

  if (/(من انت|وش انت|وش البوت|عرف بنفسك)/.test(text)) {
    return 'أنا Opus Ai، مساعد لإدارة ديسكورد: أفهم طلبك، أحدد الإجراء، ثم أنفذه بعد التحقق من صلاحياتك وصلاحيات البوت.';
  }

  if (/^(تمام|طيب|اوكي|ok|okay)$/.test(text)) {
    return 'تمام، آمرني وش تبغى أسوي؟';
  }

  return null;
}
