/**
 * ════════════════════════════════════════════════════════════════
 *  محرك اللهجات العربية المتطور - Advanced Arabic Dialect Engine
 *  يعالج ويفهم جميع اللهجات العربية ويحللها ويحولها لأوامر مفهومة
 *  يدعم الخليجية، السعودية، المصرية، الشامية، العراقية، المغربية، اليمني، السودانية، والعربيزي
 * ════════════════════════════════════════════════════════════════
 */

// ============================================================
//  الأنواع والواجهات
// ============================================================
export type DialectRegion = 
  | 'gulf' 
  | 'saudi' 
  | 'egyptian' 
  | 'levantine' 
  | 'iraqi' 
  | 'maghreb' 
  | 'yemeni' 
  | 'sudanese' 
  | 'arabizi' 
  | 'standard' 
  | 'unknown';

export interface DialectAnalysis {
  detectedDialect: DialectRegion;
  confidence: number; // 0-1
  normalizedText: string;
  expandedText: string;
  detectedIntent: string;
  keywords: string[];
  entities: ExtractedEntity[];
}

export interface ExtractedEntity {
  type: 'artist' | 'song' | 'channel' | 'role' | 'member' | 'number' | 'duration' | 'color' | 'action' | 'server_type' | 'dialect_marker';
  value: string;
  originalText: string;
  confidence: number;
}

export const COMPREHENSIVE_ARTIST_MAP: Record<string, string> = {};

// ============================================================
//  قاموس تطبيع الحروف العربية
// ============================================================
const ARABIC_NORMALIZATION_MAP: Record<string, string> = {
  'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا',
  'ة': 'ه', 'ؤ': 'و', 'ئ': 'ي',
  'ى': 'ي', 'ٻ': 'ب', 'ڤ': 'ف',
  'گ': 'ك', 'چ': 'ج', 'پ': 'ب',
  'ژ': 'ز',
};

/**
 * تطبيع النص العربي - إزالة التشكيل وتوحيد الحروف
 */
export function normalizeArabic(text: string): string {
  let normalized = text;

  // إزالة التشكيل والتنوين والشدة
  normalized = normalized.replace(/[\u064B-\u065F\u0670]/g, '');

  // إزالة التطويل (كـــــتاب -> كتاب)
  normalized = normalized.replace(/ـ+/g, '');

  // توحيد الحروف المتشابهة
  for (const [from, to] of Object.entries(ARABIC_NORMALIZATION_MAP)) {
    normalized = normalized.replace(new RegExp(from, 'g'), to);
  }

  // إزالة المسافات الزائدة والرموز الغريبة
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

// ============================================================
//  قاموس ترجمة وتحويل العربيزي (Arabizi to Arabic)
// ============================================================
const ARABIZI_TRANSLATION_MAP: Record<string, string> = {
  '7abibi': 'حبيبي', 'habibi': 'حبيبي',
  'yallah': 'يلا', 'yalla': 'يلا',
  '3mr': 'عمرو', 'amr': 'عمرو',
  'shlonik': 'شلونك', 'shlonak': 'شلونك',
  'kefak': 'كيفك', 'kifak': 'كيفك',
  'wain': 'وين', 'wein': 'وين',
  'fin': 'فين',
  '3len': 'أهلين', 'ahlan': 'أهلاً',
  'shghel': 'شغل', 'shaghel': 'شغل',
  'chghel': 'شغل',
  'ghani': 'غني', 'ghanili': 'غني لي',
  'wqf': 'وقف', 'waqef': 'وقف',
  'kamel': 'كمل',
  'skeb': 'سكيب', 'skip': 'سكيب',
  'sot': 'صوت', 'sawt': 'صوت',
  'rwm': 'روم', 'room': 'روم',
  'fays': 'فويس', 'voice': 'فويس',
  'rpl': 'رول', 'role': 'رول',
  'ban': 'بان',
  'kik': 'كيك', 'kick': 'كيك',
  'mywt': 'ميوت', 'mute': 'ميوت',
  'shokran': 'شكرا', 'shukran': 'شكرا',
  'hala': 'هلا',
  '2la': 'هلا',
  'm4': 'مو', 'mesh': 'مش',
  'zeen': 'زين', 'zain': 'زين',
  'helw': 'حلو',
  'a5oy': 'أخوي', 'akhoi': 'أخوي',
  'yaba': 'يابا',
};

/**
 * تحويل نص عربيزي إلى عربي مبسط لتمكين المحرك من فهمه
 */
export function translateArabizi(text: string): string {
  let words = text.toLowerCase().split(/\s+/);
  let translatedWords = words.map(word => {
    // إزالة التكرار الزائد للحروف (مثال: habibiiiiii -> habibi)
    let cleanedWord = word.replace(/(.)\1{2,}/g, '$1$1');
    if (ARABIZI_TRANSLATION_MAP[cleanedWord]) {
      return ARABIZI_TRANSLATION_MAP[cleanedWord];
    }
    // محاولات بديلة
    for (const [key, value] of Object.entries(ARABIZI_TRANSLATION_MAP)) {
      if (cleanedWord.includes(key) || key.includes(cleanedWord)) {
        return value;
      }
    }
    return word;
  });
  return translatedWords.join(' ');
}

// ============================================================
//  قاموس اللهجات الخليجية/السعودية
// ============================================================
const GULF_DIALECT_MAP: Record<string, string[]> = {
  // أفعال ورغبات
  'أريد': ['ابي', 'ابغى', 'ابا', 'أبي', 'أبغى', 'أبا', 'ودي', 'ابيك', 'ابغاك', 'خاطري', 'اشتهي', 'اشتهي اشغل', 'نفسي في'],
  'أعطني': ['عطني', 'عطيني', 'اعطني', 'هاتها', 'هاتلي', 'جبلي', 'ناولني', 'فزعلي بـ'],
  'أنشئ': ['سو', 'سولي', 'اسوي', 'سوي', 'لاهنت', 'سو لي', 'خل', 'خلي', 'اسو', 'سولنا', 'فصلنا', 'رتبلنا'],
  'احذف': ['امسح', 'شيل', 'نسف', 'نسفها', 'امسحها', 'شيلها', 'طير', 'طيرها', 'امحي', 'خلص عليه', 'احذفها', 'قشع', 'قشعها'],
  'عدّل': ['عدل', 'غير', 'بدل', 'حط', 'حطلي', 'سوي', 'ظبط', 'ضبط', 'رتب', 'عدلها', 'غيرها'],
  'أخبرني': ['قلي', 'قل لي', 'عرفني', 'وش', 'ايش', 'شنو', 'خبرني', 'فهمني', 'علمني', 'علمنا', 'وشو', 'وشهو'],
  'شغّل': ['شغل', 'شغللي', 'شغل لي', 'غني', 'غنلي', 'حط', 'حطلي', 'افتح', 'سمعنا', 'سمعني', 'اطربنا', 'شغلنا'],
  'أوقف': ['وقف', 'استوب', 'سكت', 'خلاص', 'بس', 'طفي', 'طفها', 'سكته', 'سكر', 'بند', 'هدي', 'هدها'],
  'استمر': ['كمل', 'كمللي', 'رجع', 'رجعها', 'شغلها', 'واصل', 'استمر', 'شغل ثاني'],
  'تخطى': ['تالي', 'سكيب', 'التالي', 'بعدها', 'غيرها', 'حول', 'حولها', 'بعد', 'طوف', 'طوفها', 'مشها'],
  'ادخل': ['ادخل', 'تعال', 'تعالي', 'روح', 'انضم', 'خش', 'حياك', 'سير علينا', 'انقز'],
  'اخرج': ['اطلع', 'طلع', 'روح', 'باي', 'خرج', 'فك', 'انقلع', 'انقلع برا', 'فارق', 'سري', 'سرينا'],
  'اعرض': ['ورني', 'عرض', 'بين', 'وريني', 'شوف', 'شوفلي', 'طلعلي', 'علمني بـ'],

  // أسماء ديسكورد
  'قناة': ['روم', 'شنل', 'تشانل', 'قنات', 'محادثه', 'شات', 'قنوات', 'رومات'],
  'قناة صوتية': ['فويس', 'روم صوتي', 'صوتي', 'فويس شات', 'فويس روم', 'vc', 'روم صوت', 'روم الصوت'],
  'قناة نصية': ['شات', 'روم نصي', 'تكست', 'نصي', 'محادثه نصيه', 'شات الكتابة'],
  'رتبة': ['رول', 'رتبه', 'دور', 'منصب', 'لقب', 'رانك', 'رتب', 'رولات'],
  'صلاحية': ['برمشن', 'صلاحيه', 'اذن', 'سماحيه', 'بيرم', 'تصريح', 'صلاحيات'],
  'سيرفر': ['سيرفر', 'سرفر', 'خادم', 'ديسكورد', 'السيرفر', 'خوادم'],
  'فئة': ['كاتيقوري', 'فئه', 'كاتقوري', 'قسم', 'تصنيف', 'فئات', 'اقسام'],
  'عضو': ['ممبر', 'شخص', 'واحد', 'يوزر', 'عضوو', 'اليوزر', 'اعضاء', 'الاعضاء'],
  'حظر': ['بان', 'باند', 'حظره', 'بانه', 'احظره', 'طرد نهائي'],
  'طرد': ['كيك', 'اطرده', 'طرده', 'طلعه', 'شيله', 'برا'],
  'كتم': ['ميوت', 'تايم اوت', 'اسكته', 'سكته', 'كتمه', 'عطه تايم'],

  // موسيقى
  'أغنية': ['اغنيه', 'اغنية', 'ترك', 'سونق', 'مقطع', 'صوتيه', 'اغاني', 'شيلات', 'شيلة', 'شيله'],
  'قائمة': ['ليست', 'قايمه', 'كيو', 'الطابور', 'القائمه', 'قائمتنا', 'بلي ليست'],
  'صوت': ['فوليوم', 'ساوند', 'صوت', 'الصوت', 'الاصوات'],
  'تكرار': ['لوب', 'ريبيت', 'كرر', 'اعاده', 'عيدها', 'كررها', 'دوران'],
  'خلط': ['شفل', 'رندم', 'عشوائي', 'خلطها', 'لخبط', 'لخبطها'],

  // ضمائر ومساعدات
  'ليس': ['مب', 'ماب', 'مو', 'مش', 'مهب', 'ما', 'لا', 'ماهو', 'ماهي'],
  'نعم': ['اي', 'ايه', 'اوك', 'تمام', 'طيب', 'ايوا', 'هيه', 'اوكي', 'ابشر', 'تم', 'سعدك'],
  'كثير': ['واجد', 'مره', 'اوفر', 'هالكثر', 'كتير', 'حيل', 'بالحيل', 'كثير'],
  'قليل': ['شوي', 'شويه', 'حبه', 'حبتين', 'نتفه', 'قليل'],
  'جيد': ['زين', 'حلو', 'تمام', 'اوك', 'نايس', 'عاشت', 'كفو', 'قادح', 'سنايدي'],
  'سيء': ['زفت', 'خرب', 'مب زين', 'خايس', 'ماصخ', 'بايخ'],
  'ماذا': ['وش', 'ايش', 'شنو', 'شنهو', 'ها', 'وشو هو'],
  'لماذا': ['ليش', 'ليه', 'ل وش', 'شلون', 'علامك', 'وش حقه', 'ليه كذا'],
  'أين': ['وين', 'فين', 'بأي مكان', 'وينك'],
  'الآن': ['الحين', 'هسه', 'دحين', 'هلأ', 'توه', 'توها', 'ذحين', 'هالحزه'],
  'كيف': ['كيف', 'شلون', 'ازاي', 'كيفك', 'اشلون'],

  // تحيات ومناداة
  'صديقي': ['حبيبي', 'حب', 'خوي', 'ياخي', 'يالغالي', 'بروه', 'صاحبي', 'برو', 'يا بعدي', 'يا بوي', 'شيخي'],
  'شكراً': ['تسلم', 'مشكور', 'يعطيك العافيه', 'الله يعافيك', 'ثانكيو', 'ثانكس', 'لا خلا ولا عدم', 'ما قصرت'],
  'مرحباً': ['هلا', 'هلا والله', 'اهلين', 'يامرحبا', 'هاي', 'السلام', 'مرحب', 'ارحب', 'ارحبوا', 'يا هلا'],
};

// ============================================================
//  قاموس اللهجة المصرية
// ============================================================
const EGYPTIAN_DIALECT_MAP: Record<string, string[]> = {
  'أريد': ['عايز', 'عاوز', 'نفسي', 'حابب', 'طالب', 'ودّي'],
  'أعطني': ['هات', 'اديني', 'ناولني', 'جبلي'],
  'أنشئ': ['اعمل', 'اعملي', 'عملي', 'سوي', 'نظم', 'ظبط'],
  'احذف': ['امسح', 'شيل', 'اقلع', 'طير', 'احذف'],
  'شغّل': ['شغل', 'حط', 'افتح', 'سمعنا', 'اطربنا'],
  'أوقف': ['وقف', 'اقفل', 'سكر', 'بطل', 'كفاية', 'اسكت'],
  'استمر': ['كمل', 'شغل تاني', 'رجعها'],
  'تخطى': ['بعده', 'اللي بعده', 'سكيب', 'طير الاغنية'],
  'ماذا': ['ايه', 'اي حاجه', 'ايه ده'],
  'لماذا': ['ليه', 'عشان ايه', 'بسبب ايه'],
  'أين': ['فين', 'فينك'],
  'الآن': ['دلوقتي', 'حالاً', 'هسه'],
  'كيف': ['ازاي', 'ازي', 'شديد ازاي'],
  'جيد': ['حلو', 'تمام', 'كويس', 'جامد', 'ممتاز', 'فل', 'لوز'],
  'سيء': ['وحش', 'زفت', 'مش تمام'],
  'كثير': ['كتير', 'اوي', 'خالص', 'جداً'],
  'قليل': ['شوية', 'حبه'],
  'صديقي': ['يسطا', 'يصاحبي', 'ياعم', 'يابني', 'يا باشا', 'يا صاحبي', 'يا برنس'],
  'مرحباً': ['اهلا', 'ازيك', 'السلام عليكم', 'يا هلا', 'مرحب'],
  'شكراً': ['شكرا اوي', 'تسلم', 'متشكر', 'ربنا يخليك'],
};

// ============================================================
//  قاموس اللهجة الشامية
// ============================================================
const LEVANTINE_DIALECT_MAP: Record<string, string[]> = {
  'أريد': ['بدي', 'بدك', 'حابب', 'خاطري'],
  'أعطني': ['عطيني', 'هات', 'ناولني'],
  'أنشئ': ['ساوي', 'عمول', 'ساويلي', 'اعملي'],
  'احذف': ['شيل', 'فوت', 'احذفه', 'امسحه', 'طير'],
  'شغّل': ['شغل', 'حط', 'دير', 'سمعنا'],
  'أوقف': ['وقف', 'سكر', 'حاج', 'بكفي'],
  'استمر': ['رجعها', 'كمل', 'تابع'],
  'تخطى': ['اللي بعده', 'غيرها', 'سكيب'],
  'ماذا': ['شو', 'شي', 'شو هاد'],
  'لماذا': ['ليش', 'لشو', 'كرمال شو'],
  'أين': ['وين', 'وينك'],
  'الآن': ['هلأ', 'هلق', 'الحين'],
  'كيف': ['كيفك', 'شلون', 'كيف'],
  'جيد': ['منيح', 'حلو', 'كتير منيح', 'تمام', 'كويس'],
  'كثير': ['كتير', 'كتير كتير', 'بزاف'],
  'قليل': ['نتفة', 'شوي', 'شوية'],
  'صديقي': ['يزلمه', 'خيي', 'حبيبي', 'يا شريك', 'يا غالي'],
  'شكراً': ['يسلمو', 'شكرا كتير', 'ممنونك'],
};

// ============================================================
//  قاموس اللهجة العراقية
// ============================================================
const IRAQI_DIALECT_MAP: Record<string, string[]> = {
  'أريد': ['اريد', 'اكو', 'محتاج', 'ردت'],
  'أعطني': ['انطيني', 'جيبلي', 'عطيني'],
  'أنشئ': ['سوي', 'سويلي', 'اسوي', 'اعملي'],
  'احذف': ['شيل', 'اشيل', 'طير', 'احذفها', 'امسحها'],
  'شغّل': ['شغل', 'حط', 'دز', 'اطربنا', 'افتحلي'],
  'أوقف': ['وكف', 'بس', 'خلي', 'سكت', 'كافي'],
  'استمر': ['كمل', 'شغلها', 'رجعها'],
  'تخطى': ['التالي', 'عبرها', 'سكيب', 'غيرها'],
  'ماذا': ['شنو', 'شنهو', 'شكو', 'ماكو'],
  'لماذا': ['ليش', 'شنو السبب', 'ليش هيج'],
  'أين': ['وين', 'بوين', 'وينك'],
  'الآن': ['هسه', 'هسع', 'الحين'],
  'كيف': ['شلون', 'شلونك', 'شلون الصحه'],
  'جيد': ['زين', 'حلو', 'عاشت ايدك', 'خوش', 'فد شي'],
  'كثير': ['كلش', 'واييد', 'اهوايه', 'هوايه'],
  'قليل': ['شوية', 'فتفوته', 'شوي'],
  'صديقي': ['ابو', 'ياخويه', 'حجي', 'عيني', 'يا بعد عيني', 'صاحبي'],
};

// ============================================================
//  قاموس اللهجة المغربية (Maghreb)
// ============================================================
const MAGHREB_DIALECT_MAP: Record<string, string[]> = {
  'أريد': ['بغات', 'بغينا', 'باعي', 'خصني', 'بغيت', 'نحوس'],
  'أعطني': ['عطيني', 'ارا ليا', 'مدليا'],
  'أنشئ': ['صاوب', 'دير', 'عدل', 'صاوبلي'],
  'احذف': ['حيد', 'امسح', 'حيدها'],
  'شغّل': ['طلق', 'شعل', 'خدم', 'سمعنا'],
  'أوقف': ['حبس', 'وقف', 'باراكا'],
  'ماذا': ['شنو', 'واش', 'اشنو', 'اش'],
  'لماذا': ['علاش'],
  'أين': ['فين', 'فاين'],
  'الآن': ['دابا', 'درك'],
  'كيف': ['كيفاش', 'كيداير'],
  'جيد': ['مزيان', 'واعر', 'قرطاس', 'مليح'],
  'كثير': ['بزاف', 'بزايد'],
  'قليل': ['شوية', 'قليل'],
  'صديقي': ['خويا', 'صاحبي', 'عشيري'],
};

// ============================================================
//  قاموس اللهجة اليمنية (Yemeni)
// ============================================================
const YEMENI_DIALECT_MAP: Record<string, string[]> = {
  'أريد': ['شتي', 'اشتي', 'نفسي بـ'],
  'أعطني': ['اديني', 'هاتلي', 'ناولني'],
  'أنشئ': ['افعل', 'افعلي', 'سوي'],
  'احذف': ['امسح', 'شله', 'شيل'],
  'شغّل': ['شغل', 'سمعنا', 'اطربنا'],
  'أوقف': ['بطل', 'وقف', 'اسكت'],
  'ماذا': ['ما هو', 'ايش', 'شنو'],
  'لماذا': ['ليش', 'لاجل ايش'],
  'أين': ['اين', 'وين'],
  'الآن': ['الان', 'ذحين', 'الحين'],
  'كيف': ['كيف', 'كيفك'],
  'جيد': ['سابر', 'حالي', 'تمام', 'مليح'],
  'كثير': ['قوي', 'كثير'],
  'قليل': ['شوي', 'شويه'],
  'صديقي': ['يا فندم', 'يا خبير', 'يا صاحبي'],
};

// ============================================================
//  قاموس اللهجة السودانية (Sudanese)
// ============================================================
const SUDANESE_DIALECT_MAP: Record<string, string[]> = {
  'أريد': ['داير', 'عايز', 'نفسي في'],
  'أعطني': ['اديني', 'سقني', 'ناولني'],
  'أنشئ': ['سوي', 'اعمل', 'دير'],
  'احذف': ['امسح', 'شيل', 'احذف'],
  'شغّل': ['شغل', 'دير', 'سمعنا'],
  'أوقف': ['يقيف', 'اقيف', 'كفاية'],
  'ماذا': ['شنو', 'شنهو'],
  'لماذا': ['لي شنو', 'ليه'],
  'أين': ['وين'],
  'الآن': ['هسة', 'دحين'],
  'كيف': ['كيفن', 'كيفك'],
  'جيد': ['سمح', 'ضابط', 'تمام'],
  'كثير': ['شديد', 'كتير'],
  'قليل': ['حبة', 'شوية'],
  'صديقي': ['يا زول', 'يا شفت', 'حبيبنا'],
};

// ============================================================
//  قاموس المصطلحات والعبارات التعبيرية الشائعة (Idioms Map)
// ============================================================
export const DIALECT_IDIOMS_MAP: Record<string, string> = {
  'على راسي': 'بكل سرور وسأنفذ فوراً',
  'يا بعد قلبي': 'تقدير ومحبة للمستخدم',
  'وش دعوة': 'استغراب أو طمأنة',
  'من عيوني': 'تنفيذ فوري بكل ود',
  'ما يخالف': 'موافق ولا توجد مشكلة',
  'طال عمرك': 'احترام وتقدير للمستخدم',
  'يسلم تمك': 'اتفاق مع كلام العضو',
  'على عيني': 'احترام وتنفيذ فوري للطلب',
  'فداك': 'تبسيط الأمور وطمأنة',
  'ابشر بسعدك': 'تنفيذ فوري وموثوق',
  'تامر امر': 'أنا رهن إشارتك وسأنفذ حالاً',
  'من عيوني الثنتين': 'احترام وتنفيذ فوري ومثالي للطلب',
  'يا عيوني': 'نداء لطيف ومحبب',
  'عاشت ايدك': 'شكر وتقدير للجهود',
  'كفو منك': 'مدح للاستجابة أو الفعل',
  'على عيني وراسي': 'أقصى درجات الاحترام والجاهزية للتنفيذ',
  'ولا يهمك': 'طمأنة وتخفيف القلق مع التنفيذ',
  'يا غالي': 'نداء ودود ومحترم جداً',
  'يسعد قلبك': 'دعاء بالخير وتعبير عن المحبة',
  'الله يعافيك': 'شكر وتمني الصحة للمستخدم',
  'ما قصرت': 'شكر لتقديم المساعدة',
};



// ============================================================
//  قاموس أنواع السيرفرات
// ============================================================
export const SERVER_TYPE_MAP: Record<string, string> = {
  'كوميونتي': 'community', 'كيومنيتي': 'community', 'مجتمع': 'community',
  'كومنتي': 'community', 'كميونتي': 'community',
  'ستور': 'store', 'متجر': 'store', 'محل': 'store', 'شوب': 'store',
  'بيع': 'store', 'تجاره': 'store', 'تجارة': 'store',
  'قيمنق': 'gaming', 'العاب': 'gaming', 'الالعاب': 'gaming',
  'جيمنج': 'gaming', 'جيمنق': 'gaming', 'لعبه': 'gaming', 'لعب': 'gaming',
  'كلان': 'clan', 'فريق': 'clan', 'تيم': 'clan', 'عشيره': 'clan',
  'فايف ام': 'fivem', 'فايفم': 'fivem', 'fivem': 'fivem', '5m': 'fivem',
  'ماين': 'minecraft', 'ماينكرافت': 'minecraft', 'كرافت': 'minecraft',
  'فلوروا': 'valorant', 'فالورانت': 'valorant',
  'رست': 'rust',
  'جتا': 'gta', 'قراند': 'gta',
  'تعليمي': 'education', 'تعليم': 'education', 'دراسه': 'education',
  'اخباري': 'news', 'اخبار': 'news',
  'ديني': 'religious', 'اسلامي': 'religious',
  'رياضي': 'sports', 'رياضه': 'sports',
  'تقني': 'tech', 'تكنولوجيا': 'tech', 'برمجه': 'tech',
  'موسيقى': 'music', 'موسيقي': 'music', 'اغاني': 'music',
  'انمي': 'anime', 'اوتاكو': 'anime',
  'فن': 'art', 'رسم': 'art', 'تصميم': 'art',
};

// ============================================================
//  قاموس الألوان
// ============================================================
export const COLOR_MAP: Record<string, string> = {
  'أحمر': '#FF0000', 'احمر': '#FF0000', 'red': '#FF0000',
  'أخضر': '#00FF00', 'اخضر': '#00FF00', 'green': '#00FF00',
  'أزرق': '#0000FF', 'azraq': '#0000FF', 'blue': '#0000FF',
  'أصفر': '#FFFF00', 'اصفر': '#FFFF00', 'yellow': '#FFFF00',
  'بنفسجي': '#800080', 'موف': '#800080', 'purple': '#800080',
  'برتقالي': '#FFA500', 'برتقال': '#FFA500', 'orange': '#FFA500',
  'وردي': '#FFC0CB', 'بينك': '#FFC0CB', 'pink': '#FFC0CB',
  'ذهبي': '#FFD700', 'قولد': '#FFD700', 'gold': '#FFD700',
  'فضي': '#C0C0C0', 'سلفر': '#C0C0C0', 'silver': '#C0C0C0',
  'رمادي': '#808080', 'قراي': '#808080', 'gray': '#808080',
  'أسود': '#000000', 'اسود': '#000000', 'black': '#000000',
  'أبيض': '#FFFFFF', 'abiad': '#FFFFFF', 'white': '#FFFFFF',
  'تركواز': '#00CED1', 'فيروزي': '#40E0D0', 'cyan': '#00FFFF',
  'كحلي': '#000080', 'نيفي': '#000080', 'navy': '#000080',
  'خمري': '#800000', 'عنابي': '#800020', 'maroon': '#800000',
  'زيتي': '#808000', 'olive': '#808000',
  'بني': '#A52A2A', 'brown': '#A52A2A',
  'سماوي': '#87CEEB', 'skyblue': '#87CEEB',
  'ليموني': '#32CD32', 'lime': '#00FF00',
  'كورالي': '#FF7F50', 'coral': '#FF7F50',
};

// ============================================================
//  قاموس مدد الوقت
// ============================================================
export const DURATION_MAP: Record<string, number> = {
  // بالملي ثانية
  'دقيقه': 60_000, 'دقيقة': 60_000, 'دقائق': 60_000, 'minute': 60_000, 'min': 60_000,
  'ساعه': 3_600_000, 'ساعة': 3_600_000, 'ساعات': 3_600_000, 'hour': 3_600_000, 'hr': 3_600_000,
  'يوم': 86_400_000, 'يومين': 172_800_000, 'day': 86_400_000,
  'اسبوع': 604_800_000, 'أسبوع': 604_800_000, 'week': 604_800_000,
};

// ============================================================
//  كشف اللهجة
// ============================================================
const DIALECT_MARKERS: Record<DialectRegion, string[]> = {
  gulf: ['ابي', 'ابغى', 'وش', 'مب', 'حق', 'لاهنت', 'زين', 'ودي', 'يالغالي', 'خوي', 'يبيله', 'خطير', 'سولنا', 'فصلنا', 'رتبلنا'],
  saudi: ['ايش', 'وش', 'ابي', 'مب', 'عاد', 'يالطيب', 'كذا', 'يلبي', 'دحين', 'ذحين', 'هالحزه', 'طال عمرك'],
  egyptian: ['عايز', 'ازاي', 'دلوقتي', 'ليه', 'ايه', 'يسطا', 'كده', 'بقى', 'خالص', 'جامد', 'ياعم', 'اوي', 'كويس', 'اعملي'],
  levantine: ['بدي', 'هلأ', 'شو', 'كتير', 'منيح', 'يزلمه', 'خيي', 'هلق', 'بدك', 'يسلمو', 'ممنونك'],
  iraqi: ['هسه', 'شنو', 'شكو', 'ماكو', 'اكو', 'زين', 'ابو', 'عمي', 'حجي', 'انطيني', 'كلش', 'هوايه'],
  maghreb: ['بزاف', 'واش', 'كيفاش', 'لاباس', 'خويا', 'صاحبي', 'عشيري', 'بغينا', 'خصني', 'دابا'],
  yemeni: ['اشتي', 'شتي', 'سابر', 'حالي', 'اديني', 'قوي'],
  sudanese: ['داير', 'زول', 'شديد', 'سمح', 'كيفن'],
  arabizi: ['habibi', '7abibi', 'yallah', 'yalla', 'shlonik', 'kefak', 'wain', 'mesh', 'm4', 'sot', 'rwm'],
  standard: ['أريد', 'أنشئ', 'أرجو', 'من فضلك', 'هل يمكنك', 'احذف', 'تعديل', 'المعلومات'],
  unknown: [],
};

/**
 * تحديد اللهجة بناء على عدد الكلمات المطابقة للمؤشرات
 */
export function detectDialect(text: string): { dialect: DialectRegion; confidence: number } {
  // التحقق من وجود كلمات إنجليزية أو أرقام مختلطة لكشف العربيزي
  const englishWordCount = (text.match(/[a-zA-Z0-9]/g) || []).length;
  const arabicWordCount = (text.match(/[\u0600-\u06FF]/g) || []).length;

  if (englishWordCount > 5 && englishWordCount > arabicWordCount) {
    // محاولة تطابق كلمات عربيزي شهيرة
    const normalizedText = text.toLowerCase();
    const hasArabiziWords = Object.keys(ARABIZI_TRANSLATION_MAP).some(key => normalizedText.includes(key));
    if (hasArabiziWords) {
      return { dialect: 'arabizi', confidence: 0.85 };
    }
  }

  const normalized = normalizeArabic(text.toLowerCase());
  const words = normalized.split(/\s+/);

  const scores: Record<DialectRegion, number> = {
    gulf: 0, saudi: 0, egyptian: 0, levantine: 0,
    iraqi: 0, maghreb: 0, yemeni: 0, sudanese: 0,
    arabizi: 0, standard: 0, unknown: 0,
  };

  for (const word of words) {
    for (const [dialect, markers] of Object.entries(DIALECT_MARKERS)) {
      if (markers.some(m => word === m || word.startsWith(m) || word.endsWith(m))) {
        scores[dialect as DialectRegion] += 2; // تطابق دقيق
      } else if (markers.some(m => word.includes(m))) {
        scores[dialect as DialectRegion] += 0.8; // تطابق جزئي
      }
    }
  }

  let maxScore = 0;
  let maxDialect: DialectRegion = 'unknown';
  for (const [d, s] of Object.entries(scores)) {
    if (s > maxScore) {
      maxScore = s;
      maxDialect = d as DialectRegion;
    }
  }

  const confidence = maxScore > 0 ? Math.min(maxScore / (words.length * 1.5), 1) : 0;
  return { dialect: maxDialect, confidence };
}

// ============================================================
//  استخراج الكيانات من النص
// ============================================================
export function extractEntities(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  const normalized = normalizeArabic(text.toLowerCase());

  // استخراج الأرقام
  const numberMatches = text.match(/\d+/g);
  if (numberMatches) {
    for (const num of numberMatches) {
      entities.push({
        type: 'number',
        value: num,
        originalText: num,
        confidence: 1,
      });
    }
  }



  // استخراج أنواع السيرفرات
  for (const [key, value] of Object.entries(SERVER_TYPE_MAP)) {
    const normalizedKey = normalizeArabic(key.toLowerCase());
    if (normalized.includes(normalizedKey)) {
      entities.push({
        type: 'server_type',
        value: value,
        originalText: key,
        confidence: 0.9,
      });
    }
  }

  // استخراج الألوان
  for (const [key, value] of Object.entries(COLOR_MAP)) {
    const normalizedKey = normalizeArabic(key.toLowerCase());
    if (normalized.includes(normalizedKey)) {
      entities.push({
        type: 'color',
        value: value,
        originalText: key,
        confidence: 0.95,
      });
    }
  }

  // استخراج المدد الزمنية
  const durationPattern = /(\d+)\s*(دقيقه|دقيقة|دقائق|ساعه|ساعة|ساعات|يوم|يومين|اسبوع|أسبوع|minute|min|hour|hr|day|week)/gi;
  let dMatch;
  while ((dMatch = durationPattern.exec(text)) !== null) {
    const num = parseInt(dMatch[1]);
    const unit = dMatch[2].toLowerCase();
    const baseMs = DURATION_MAP[normalizeArabic(unit)] || 60_000;
    entities.push({
      type: 'duration',
      value: String(num * baseMs),
      originalText: dMatch[0],
      confidence: 0.98,
    });
  }

  // استخراج تعابير التقدير والامتنان أو اللهجة الشائعة كعلامات دلالية
  for (const [idiom, meaning] of Object.entries(DIALECT_IDIOMS_MAP)) {
    const normalizedIdiom = normalizeArabic(idiom.toLowerCase());
    if (normalized.includes(normalizedIdiom)) {
      entities.push({
        type: 'dialect_marker',
        value: meaning,
        originalText: idiom,
        confidence: 0.9,
      });
    }
  }

  return entities;
}

// ============================================================
//  تحليل شامل للنص
// ============================================================
export function analyzeDialect(text: string): DialectAnalysis {
  let processedText = text;
  
  // التحقق من اللهجة أولاً لتطبيق الترجمة إذا كانت عربيزي
  let { dialect, confidence } = detectDialect(processedText);
  if (dialect === 'arabizi') {
    processedText = translateArabizi(processedText);
  }

  const normalized = normalizeArabic(processedText);
  const entities = extractEntities(processedText);
  const keywords = extractKeywords(normalized);

  // تحديد النية بدقة
  const intent = detectIntent(normalized, keywords, entities);

  return {
    detectedDialect: dialect,
    confidence,
    normalizedText: normalized,
    expandedText: processedText,
    detectedIntent: intent,
    keywords,
    entities,
  };
}

// ============================================================
//  استخراج الكلمات المفتاحية
// ============================================================
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'في', 'من', 'على', 'الى', 'الي', 'مع', 'عن', 'هو', 'هي',
    'هذا', 'هذه', 'ذلك', 'تلك', 'الذي', 'التي', 'ان', 'أن',
    'كان', 'يكون', 'لا', 'لم', 'لن', 'قد', 'ما', 'بل',
    'و', 'أو', 'ثم', 'ف', 'ب', 'ل', 'ك', 'يا',
    'لي', 'لك', 'له', 'لها', 'لنا', 'لكم', 'لهم',
    'معي', 'عندي', 'كنت', 'كانت', 'كل', 'بعض', 'غير',
  ]);

  return text.split(/\s+/)
    .filter(w => w.length > 1 && !stopWords.has(w))
    .slice(0, 20);
}

// ============================================================
//  كشف النية الشامل
// ============================================================
function detectIntent(text: string, keywords: string[], entities: ExtractedEntity[]): string {
  const t = text.toLowerCase();

  // نظام الموسيقى
  if (/شغل|غني|حط.*(اغني|موسيق|ترك|سونق)|play|افتح.*(اغني|يوتيوب)|اطربنا|سمعنا/i.test(t)) return 'play_music';
  if (/وقف|pause|استوب|سكت|طفي|اقفل/i.test(t) && !/موسيق|كل|الكل|تماما/i.test(t)) return 'pause_music';
  if (/كمل|resume|استمر|رجع|كمللي|واصل/i.test(t)) return 'resume_music';
  if (/تالي|skip|سكيب|التالي|بعدها|غيرها|حول|عبرها/i.test(t)) return 'skip_music';
  if (/كرر|loop|ريبيت|repeat|عيدها|اعاده/i.test(t)) return 'toggle_loop';
  if (/صوت|فوليوم|volume|ارفع|خفض|خفف|علي/i.test(t) && /\d/.test(t)) return 'set_volume';
  if (/القائم|ليست|كيو|queue|الطابور|وش.*(بعد|يشغل)/i.test(t)) return 'get_queue';
  if (/خلط|شفل|shuffle|رندم|عشوائي|لخبط/i.test(t)) return 'shuffle_queue';
  if (/وش.*الحين|now.*play|الاغني.*الحالي|وش قاعد يشغل/i.test(t)) return 'get_now_playing';
  if (/ادخل.*روم|تعال|join|انضم/i.test(t)) return 'join_voice';
  if (/اطلع|طلع|disconnect|leave|باي.*روم|انقلع/i.test(t)) return 'leave_voice';
  if (/(وقف|ايقاف|stop).*(كل|الكل|تماما|الموسيق)/i.test(t)) return 'stop_music';

  // إدارة السيرفر وقنوات ورتب
  if (/سو.*سيرفر|بناء|ابني|build|ضبط.*السيرفر|نظم|صمم/i.test(t)) return 'build_server';
  if (entities.some(e => e.type === 'server_type') && /ابني|سو|انشئ/i.test(t)) return 'build_server';
  
  if (/سو|انشئ|اسوي|اعمل|create/i.test(t) && /روم|قنا|شنل|channel/i.test(t)) return 'create_channel';
  if (/امسح|احذف|شيل|نسف|delete/i.test(t) && /روم|قنا|شنل|channel/i.test(t)) return 'delete_channel';
  
  if (/سو|انشئ|اعمل|create/i.test(t) && /رول|رتب|role|rank/i.test(t)) return 'create_role';
  if (/امسح|احذف|شيل|delete/i.test(t) && /رول|رتب|role|rank/i.test(t)) return 'delete_role';
  
  if (/اطرد|طرد|kick/i.test(t)) return 'kick_member';
  if (/بان|حظر|ban/i.test(t)) return 'ban_member';
  if (/ميوت|كتم|تايم.*اوت|timeout|mute/i.test(t)) return 'timeout_member';
  if (/معلومات.*السيرفر|info|server.*info/i.test(t)) return 'get_server_info';
  if (/معلومات.*عضو|member.*info|مين.*هذا/i.test(t)) return 'get_member_info';

  // محادثة عامة
  if (/هلا|مرحبا|السلام|هاي|اهلا|اهلين/i.test(t)) return 'greeting';
  if (/شكرا|تسلم|مشكور|يعطيك|يسلمو/i.test(t)) return 'thanks';
  if (/كيف.*حال|كيفك|شلونك|عامل.*ايه/i.test(t)) return 'how_are_you';
  if (/مساعد|help|وش.*تقدر|شنو.*تسوي|اوامر/i.test(t)) return 'help';

  return 'unknown';
}

// ============================================================
//  مساعدات
// ============================================================
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================
//  تحسين استعلام البحث الموسيقي بالتزامن مع الأسماء والفنانين
// ============================================================
export function enhanceMusicQuery(rawQuery: string): string[] {
  return [rawQuery.trim()];
}

// ============================================================
//  نظام اختبارات التشخيص الذاتي لمحرك اللهجات (Self-Tests)
// ============================================================
export function runDialectEngineDiagnostics(): { success: boolean; total: number; passed: number; results: any[] } {
  const testCases = [
    { text: 'ابي اشغل اغنية عمرين الحلو لاهنت', expectedDialect: 'gulf', expectedIntent: 'play_music' },
    { text: 'عايز اسمع تامر حسني دلوقتي يسطا', expectedDialect: 'egyptian', expectedIntent: 'play_music' },
    { text: 'بدي اسمع فيروز هلق يزلمه', expectedDialect: 'levantine', expectedIntent: 'play_music' },
    { text: 'هسه شغللي اغنية كاظم الساهر فد شي', expectedDialect: 'iraqi', expectedIntent: 'play_music' },
    { text: 'yallah habibi shaghel amr diab', expectedDialect: 'arabizi', expectedIntent: 'play_music' },
    { text: 'بزاف مزيان هاد السيرفر خويا', expectedDialect: 'maghreb', expectedIntent: 'build_server' },
    { text: 'اشتي افعل روم صوتي ذحين', expectedDialect: 'yemeni', expectedIntent: 'create_channel' },
    { text: 'داير اسوي رتبة جديدة يا زول', expectedDialect: 'sudanese', expectedIntent: 'create_role' },
    { text: 'اطرد هالعضو من السيرفر', expectedDialect: 'gulf', expectedIntent: 'kick_member' },
    { text: 'لو سمحت احذف القناة النصية', expectedDialect: 'standard', expectedIntent: 'delete_channel' }
  ];

  const results = [];
  let passedCount = 0;

  for (const tc of testCases) {
    const analysis = analyzeDialect(tc.text);
    const dialectMatches = analysis.detectedDialect === tc.expectedDialect;
    const intentMatches = analysis.detectedIntent === tc.expectedIntent;
    const success = dialectMatches && intentMatches;
    
    if (success) passedCount++;

    results.push({
      text: tc.text,
      expected: { dialect: tc.expectedDialect, intent: tc.expectedIntent },
      actual: { dialect: analysis.detectedDialect, intent: analysis.detectedIntent },
      success
    });
  }

  return {
    success: passedCount === testCases.length,
    total: testCases.length,
    passed: passedCount,
    results
  };
}
