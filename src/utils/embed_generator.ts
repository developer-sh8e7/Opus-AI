/**
 * ════════════════════════════════════════════════════════════════
 *  منشئ ومصمم اللوحات الفنية والتفاعلية - Advanced Discord Embed Generator
 *  يوفر تصاميم راقية وجميلة للرسائل المضمنة (Embeds) باللغة العربية
 *  يدعم كروت القوانين، الترحيب، المتجر، التذاكر، إحصائيات النظام، ومراقبة الموسيقى والـ AI
 * ════════════════════════════════════════════════════════════════
 */

import { EmbedBuilder, GuildMember } from 'discord.js';

// ============================================================
//  ألوان التصميم الافتراضية المنسقة (Palette Tokens)
// ============================================================
export const EMBED_COLORS = {
  default: 0x2B2D31,  // اللون الداكن الأنيق لديسكورد
  success: 0x2ECC71,  // الأخضر الزمردي
  warning: 0xF1C40F,  // الأصفر الذهبي
  danger: 0xE74C3C,   // الأحمر الناري
  info: 0x3498DB,     // الأزرق السماوي
  royal: 0x9B59B6,    // البنفسجي الملكي
  gold: 0xFFD700,     // الذهبي اللامع
  orange: 0xE67E22,   // البرتقالي الداكن
};

// ============================================================
//  1. لوحة القوانين والأنظمة الرسمية (Rules Embed)
// ============================================================
export function createRulesEmbed(title?: string, rules?: string[]): EmbedBuilder | EmbedBuilder[] {
  if (title && rules) {
    return new EmbedBuilder()
      .setTitle(title)
      .setDescription(rules.map((r, i) => `**${i + 1}️⃣** ${r}`).join('\n'))
      .setColor(EMBED_COLORS.default);
  }
  const mainRulesEmbed = new EmbedBuilder()
    .setTitle('📜 قوانين السيرفر الرسمية')
    .setDescription(
      '> مرحباً بكم في خادمنا! نرجو من الجميع الالتزام بالقوانين التالية لضمان بيئة آمنة وممتعة للجميع.\n' +
      '> مخالفة هذه القوانين ستؤدي إلى عقوبات صارمة تصل إلى الطرد النهائي.\n\n' +
      '╔══════════════════════════════════╗\n' +
      '║   ⚠️ **يرجى قراءة القوانين بعناية**   ║\n' +
      '╚══════════════════════════════════╝'
    )
    .setColor(EMBED_COLORS.default)
    .addFields(
      {
        name: '```1️⃣ الاحترام والتعامل الراقي```',
        value:
          '>>> 🔹 يجب احترام جميع الأعضاء وطاقم العمل بدون استثناء.\n' +
          '🔹 يمنع منعاً باتاً الإهانة، التنمر، أو السخرية من أي شخص.\n' +
          '🔹 تعامل مع الآخرين بالأدب والاحترام المتبادل.\n' +
          '🔹 احترم الآراء المختلفة وتقبل النقد البناء.',
        inline: false,
      },
      {
        name: '```2️⃣ مكافحة السبام والإزعاج```',
        value:
          '>>> 🔹 ممنوع إرسال رسائل متكررة أو نصوص طويلة عشوائية.\n' +
          '🔹 يمنع الإغراق بالإيموجيات أو الملصقات المزعجة.\n' +
          '🔹 ممنوع الإشارة (المنشن) العشوائي أو المتكرر للإداريين.\n' +
          '🔹 يمنع إرسال روابط بدون سياق أو إذن مسبق.',
        inline: false,
      },
      {
        name: '```3️⃣ حظر المحتوى المخالف للآداب```',
        value:
          '>>> 🔹 يمنع نشر أي محتوى إباحي، سياسي، أو ديني مثير للفتن.\n' +
          '🔹 يمنع نشر محتوى عنيف، صادم، أو يروج لإيذاء النفس.\n' +
          '🔹 ممنوع نشر خطابات الكراهية أو العنصرية بكافة أشكالها.\n' +
          '🔹 يشمل ذلك الصور والفيديوهات والروابط والنصوص.',
        inline: false,
      },
      {
        name: '```4️⃣ الإعلانات والترويج```',
        value:
          '>>> 🔹 ممنوع الإعلان عن خوادم أخرى أو مجموعات بدون إذن مسبق.\n' +
          '🔹 يمنع إرسال روابط دعوات ديسكورد عبر الخاص للأعضاء.\n' +
          '🔹 يمنع الترويج للمنتجات، الحسابات، أو القنوات الشخصية.\n' +
          '🔹 لطلب شراكة أو إعلان، تواصل مع الإدارة عبر التذاكر.',
        inline: false,
      }
    )
    .setFooter({ text: '📜 قوانين السيرفر • الصفحة 1/2' })
    .setTimestamp();

  const secondRulesEmbed = new EmbedBuilder()
    .setTitle('📜 قوانين السيرفر (تابع)')
    .setColor(EMBED_COLORS.default)
    .addFields(
      {
        name: '```5️⃣ استخدام القنوات المخصصة```',
        value:
          '>>> 🔹 استخدم كل قناة للغرض المخصص لها فقط (ميديا، نقاش، أوامر).\n' +
          '🔹 لا ترسل محتوى في قناة غير مخصصة له لمنع التشتيت.\n' +
          '🔹 يرجى مراجعة وصف القناة المثبت لمعرفة غايتها.\n' +
          '🔹 جميع أوامر البوتات تنفذ في القنوات المحددة للبوتات.',
        inline: false,
      },
      {
        name: '```6️⃣ منع انتحال الشخصية والتزييف```',
        value:
          '>>> 🔹 يمنع انتحال شخصية أي عضو، أو مشاهير، أو مسؤولين.\n' +
          '🔹 يمنع استخدام أسماء وصور مطابقة لفريق إدارة الخادم.\n' +
          '🔹 ممنوع ادعاء امتلاك رتب وصلاحيات ليست تابعة لك.\n' +
          '🔹 كن صريحاً ولا تسعَ لتضليل الأعضاء أو خداعهم.',
        inline: false,
      },
      {
        name: '```7️⃣ احترام الخصوصية وسرية المعلومات```',
        value:
          '>>> 🔹 يمنع نشر معلومات شخصية أو صور تخص الأعضاء دون موافقتهم.\n' +
          '🔹 يمنع تسريب المحادثات الخاصة أو لقطات الشاشة بهدف الإضرار.\n' +
          '🔹 لا تطلب معلومات حساسة أو كلمات مرور من أي شخص.\n' +
          '🔹 حافظ على أمان حسابك الشخصي وخصوصيتك.',
        inline: false,
      },
      {
        name: '```8️⃣ القرارات الإدارية والتنظيم```',
        value:
          '>>> 🔹 يجب الالتزام بقرارات وتعليمات طاقم الإشراف والإدارة.\n' +
          '🔹 قرارات الإشراف نهائية وغير قابلة للجدل العلني في الشات.\n' +
          '🔹 إذا كان لديك اعتراض أو شكوى، قدم تذكرة خاصة رسمية.\n' +
          '🔹 مخالفتك لتعليمات الإدارة ستعرضك لإجراءات تأديبية فورية.',
        inline: false,
      },
      {
        name: '```9️⃣ قوانين المحادثات الصوتية```',
        value:
          '>>> 🔹 يمنع استخدام برامج تغيير الصوت المزعجة في القنوات العامة.\n' +
          '🔹 يمنع الصراخ، النفخ، أو تشغيل موسيقى مزعجة في الرومات.\n' +
          '🔹 احترم المتحدثين ولا تقاطع أحداً، وأعطِ الجميع فرصة للتعبير.\n' +
          '🔹 استخدم خيار كتم الصوت التلقائي عند عدم التحدث لتفادي الضوضاء.',
        inline: false,
      },
      {
        name: '```🔟 شروط عامة وإضافية```',
        value:
          '>>> 🔹 يمنع استخدام الحسابات البديلة للتملص من العقوبات المفروضة.\n' +
          '🔹 يمنع استغلال الثغرات البرمجية في السيرفر أو البوتات.\n' +
          '🔹 يحق للإدارة تعديل أو إضافة أي قانون تراه مناسباً دون إشعار مسبق.\n' +
          '🔹 عدم قراءتك لهذه القوانين لا يعفيك من المسؤولية أو العقوبة.',
        inline: false,
      }
    )
    .addFields({
      name: '\u200b',
      value:
        '╔══════════════════════════════════╗\n' +
        '║ ✅ بتواجدك في السيرفر أنت توافق على   ║\n' +
        '║        جميع القوانين المذكورة أعلاه       ║\n' +
        '╚══════════════════════════════════╝',
      inline: false,
    })
    .setFooter({ text: '📜 قوانين السيرفر • الصفحة 2/2' })
    .setTimestamp();

  return [mainRulesEmbed, secondRulesEmbed];
}

// ============================================================
//  2. لوحة ترحيب الأعضاء الجدد (Welcome Embed)
// ============================================================
export function createWelcomeEmbed(serverName: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('👋 أهلاً وسهلاً بك في خادمنا')
    .setDescription(
      `> مرحباً بك في خادم **${serverName}**! 🎉\n` +
      '> نحن سعداء جداً بقرارك الانضمام إلينا.\n' +
      '> نتمنى لك قضاء وقت ممتع ومفيد بصحبتنا!\n\n' +
      '╔══════════════════════════════════╗\n' +
      '║    🌟 **مرحباً بك في عائلتنا الجديدة!**   ║\n' +
      '╚══════════════════════════════════╝'
    )
    .setColor(EMBED_COLORS.info)
    .addFields(
      {
        name: '📋 خطوتك الأولى',
        value: '>>> تفضل بزيارة قناة القوانين واقرأ الشروط لضمان سلامة حسابك وتفادي المشاكل.',
        inline: false,
      },
      {
        name: '🎭 نظام الرتب التفاعلية',
        value: '>>> توجه لقناة تخصيص الرتب واحصل على أدوارك واهتماماتك لفتح القنوات المناسبة.',
        inline: false,
      },
      {
        name: '💬 ابدأ المحادثة',
        value: '>>> القِ التحية في الدردشة العامة، وتعرف على الأعضاء المتواجدين حالياً! لا تتردد بالحديث.',
        inline: false,
      },
      {
        name: '🔊 القنوات الصوتية',
        value: '>>> ادخل أي صالون صوتي وشاركنا الحوار أو الألعاب. نتمنى لك أوقاتاً ممتعة.',
        inline: false,
      },
      {
        name: '🆘 هل تحتاج إلى دعم؟',
        value: '>>> إذا واجهتك أي مشكلة، تواصل مع فريق المساعدة عبر فتح تذكرة دعم فني.',
        inline: false,
      }
    )
    .setFooter({ text: `${serverName} • إقامة سعيدة وموفقة` })
    .setTimestamp();
}

// ============================================================
//  3. لوحة تفاصيل الرتب والأدوار (Roles Info Embed)
// ============================================================
export function createRolesInfoEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('🎭 نظام الرتب والأدوار الإدارية')
    .setDescription(
      '> تعرف على الرتب الرسمية المعرّفة في الخادم وصلاحيات كل منها.\n' +
      '> كل رتبة تمنح حاملها صلاحيات ووجاهة مميزة داخل مجتمعنا!\n\n' +
      '╔══════════════════════════════════╗\n' +
      '║      🏅 **الهيكل التنظيمي للرتب**     ║\n' +
      '╚══════════════════════════════════╝'
    )
    .setColor(EMBED_COLORS.gold)
    .addFields(
      {
        name: '👑 المؤسس (Owner)',
        value: '>>> صاحب السيرفر والمسؤول الأول عن كل شاردة وواردة. يملك كامل الصلاحيات المطلقة.',
        inline: true,
      },
      {
        name: '🛡️ المدير (Admin)',
        value: '>>> ذراع المؤسس والمسؤول عن إدارة شؤون السيرفر، حل المشكلات الكبرى، والإشراف العام.',
        inline: true,
      },
      {
        name: '\u200b',
        value: '\u200b',
        inline: false,
      },
      {
        name: '⚡ المشرف (Moderator)',
        value: '>>> يسهر على حماية النظام وتطبيق القوانين، كتم المخالفين، وحذف الرسائل غير اللائقة.',
        inline: true,
      },
      {
        name: '🌟 العضو المتميز (VIP)',
        value: '>>> عضو نشط ساهم في رقي السيرفر وحصل على تقدير الإدارة. يملك قنوات وصلاحيات خاصة.',
        inline: true,
      },
      {
        name: '\u200b',
        value: '\u200b',
        inline: false,
      },
      {
        name: '💎 الداعمون (Boosters)',
        value: '>>> الرتبة الفخرية المخصصة لداعمي الخادم بنيترو. تمنح لوناً جميلاً وحقوقاً إضافية.',
        inline: true,
      },
      {
        name: '👤 الأعضاء (Members)',
        value: '>>> الرتبة الأساسية الترحيبية لكل فرد جديد ينضم إلينا ويشارك في مجتمعنا.',
        inline: true,
      }
    )
    .setFooter({ text: '🎭 نظام الرتب • تفاعل باستمرار للحصول على الترقيات' })
    .setTimestamp();
}

// ============================================================
//  4. لوحة متجر المنتجات والعروض (Store Embed)
// ============================================================
export function createStoreEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('🛒 متجر السيرفر الرسمي')
    .setDescription(
      '> اكتشف خدماتنا، منتجاتنا الرقمية، وأقوى العروض الحصرية المتاحة!\n' +
      '> نحرص على تقديم خدمات سريعة وآمنة بأسعار منافسة للغاية.\n\n' +
      '╔══════════════════════════════════╗\n' +
      '║     🛍️ **بوابة المتجر الرقمية**     ║\n' +
      '╚══════════════════════════════════╝'
    )
    .setColor(EMBED_COLORS.orange)
    .addFields(
      {
        name: '📦 المنتجات المتوفرة',
        value: '>>> تفضل بزيارة قنوات المنتجات لمراجعة الكتالوج التفصيلي والصور والأسعار.',
        inline: true,
      },
      {
        name: '💳 وسائل الدفع المقبولة',
        value: '>>> نقبل مدى، بطاقات ائتمانية، تحويل بنكي، وبطاقات الهدايا الرقمية.',
        inline: true,
      },
      {
        name: '\u200b',
        value: '\u200b',
        inline: false,
      },
      {
        name: '🛒 خطوات الشراء وإتمام الطلب',
        value:
          '>>> 1. اختر المنتج المناسب والكمية المطلوبة.\n' +
          '2. توجه لقناة التذاكر وافتح تذكرة طلب جديدة.\n' +
          '3. سيقوم موظف المبيعات بالرد عليك وإتمام الفاتورة.\n' +
          '4. تسلّم منتجك الرقمي فوراً بعد تأكيد الدفع.',
        inline: false,
      },
      {
        name: '⭐ تقييمات العملاء',
        value: '>>> راجع قناة التقييمات لقراءة تجارب العملاء السابقين قبل اتخاذ قرارك.',
        inline: true,
      },
      {
        name: '🆘 استفسارات المتجر',
        value: '>>> لأي سؤال قبل الشراء، افتح تذكرة عامة وسيتم توجيهك للمسؤول.',
        inline: true,
      }
    )
    .setFooter({ text: '🛒 المتجر • جودة نضمنها ورضا نسعى إليه' })
    .setTimestamp();
}

// ============================================================
//  5. لوحة فتح تذاكر الدعم الفني (Ticket Embed)
// ============================================================
export function createTicketEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('🎫 مركز الاتصال وفتح التذاكر')
    .setDescription(
      '> هل واجهتك مشكلة تقنية أو تحتاج إلى مساعدة إدارية؟\n' +
      '> افتح تذكرة تواصل وسيقوم فريق الدعم بالرد عليك وحل مشكلتك فورا.\n\n' +
      '╔══════════════════════════════════╗\n' +
      '║     🎫 **بوابة الدعم الفني المباشر**    ║\n' +
      '╚══════════════════════════════════╝'
    )
    .setColor(EMBED_COLORS.success)
    .addFields(
      {
        name: '📝 آلية عمل التذاكر',
        value:
          '>>> بمجرد النقر على زر فتح تذكرة، سيتم إنشاء قناة نصية خاصة وسرية لا يراها سوى أنت وطاقم الإدارة المختص.',
        inline: false,
      },
      {
        name: '⚡ متوسط سرعة الاستجابة',
        value: '>>> نعمل جاهدين للرد على كافة التذاكر والطلبات خلال أقل من **24 ساعة**.',
        inline: true,
      },
      {
        name: '🔍 قبل فتح التذكرة',
        value: '>>> تأكد من مراجعة قناة الأسئلة الشائعة، فقد تكون إجابة سؤالك متوفرة هناك.',
        inline: true,
      },
      {
        name: '⚠️ إرشادات هامة للتواصل',
        value:
          '>>> 🔹 يرجى عدم فتح أكثر من تذكرة واحدة لنفس المشكلة لتفادي الازدحام.\n' +
          '🔹 اكتب مشكلتك بالتفصيل وأرفق لقطات شاشة واضحة إن وجدت.\n' +
          '🔹 يرجى التحلي بالصبر والهدوء لحين استلام تذكرتك ومساعدتك.',
        inline: false,
      }
    )
    .setFooter({ text: '🎫 نظام التذاكر • نحن في خدمتكم دائماً' })
    .setTimestamp();
}

// ============================================================
//  6. لوحة معلومات وإحصائيات السيرفر (Server Info Embed)
// ============================================================
export function createServerInfoEmbed(
  name: string,
  memberCount: number,
  channelCount: number,
  roleCount: number
): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('📊 إحصائيات الخادم الرسمية')
    .setDescription(
      `> نظرة عامة مفصلة على التركيبة الإحصائية لخادم **${name}**\n\n` +
      '╔══════════════════════════════════╗\n' +
      '║       📊 **البيانات الرقمية للخادم**       ║\n' +
      '╚══════════════════════════════════╝'
    )
    .setColor(EMBED_COLORS.info)
    .addFields(
      {
        name: '📛 اسم الخادم',
        value: `>>> ${name}`,
        inline: true,
      },
      {
        name: '👥 التعداد البشري',
        value: `>>> ${memberCount.toLocaleString('ar-EG')} عضو`,
        inline: true,
      },
      {
        name: '\u200b',
        value: '\u200b',
        inline: false,
      },
      {
        name: '📺 القنوات والمعابر',
        value: `>>> ${channelCount.toLocaleString('ar-EG')} قناة`,
        inline: true,
      },
      {
        name: '🎭 الرتب المسجلة',
        value: `>>> ${roleCount.toLocaleString('ar-EG')} رتبة`,
        inline: true,
      },
      {
        name: '\u200b',
        value: '\u200b',
        inline: false,
      },
      {
        name: '📅 تاريخ استخراج التقرير',
        value: `>>> <t:${Math.floor(Date.now() / 1000)}:F>`,
        inline: false,
      }
    )
    .setFooter({ text: `${name} • الإحصائيات الفورية` })
    .setTimestamp();
}

// ============================================================
//  7. لوحة تفاصيل المقطوعة الموسيقية الجارية (Music Now Playing Embed)
// ============================================================
export function createMusicTrackEmbed(
  title: string,
  url: string,
  duration: string,
  requestedBy: string,
  thumbnail: string,
  volume: number,
  loop: boolean,
  queueSize: number
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(0x1DB954) // لون سبوتيفاي الأخضر الجذاب
    .setTitle('🎵 جاري تشغيل المقطع الصوتي الآن')
    .setDescription(`**[${title}](${url})**`)
    .addFields(
      { name: '⏱️ المدة الزمنية', value: duration, inline: true },
      { name: '👤 طلب بواسطة', value: requestedBy, inline: true },
      { name: '🔊 مستوى الصوت', value: `${volume}%`, inline: true },
      { name: '🔁 وضع التكرار', value: loop ? '✅ مفعّل' : '❌ معطّل', inline: true },
      { name: '📋 في قائمة الانتظار', value: `${queueSize} مقطع`, inline: true }
    )
    .setFooter({ text: 'المشغل الموسيقي المتطور • Opus Bot' })
    .setTimestamp();

  if (thumbnail) {
    embed.setThumbnail(thumbnail);
  }
  return embed;
}

// ============================================================
//  8. لوحة تسجيل العقوبات الإدارية والرقابة (Moderation Action Embed)
// ============================================================
export function createModerationActionEmbed(
  moderatorName: string,
  targetName: string,
  action: 'WARN' | 'MUTE' | 'KICK' | 'BAN' | 'UNBAN' | 'TIMEOUT',
  reason: string,
  durationStr?: string
): EmbedBuilder {
  const actionLabels = {
    WARN: { text: '⚠️ تحذير إداري', color: EMBED_COLORS.warning },
    MUTE: { text: '🔇 كتم صوتي', color: EMBED_COLORS.orange },
    KICK: { text: '👢 طرد من السيرفر', color: EMBED_COLORS.danger },
    BAN: { text: '🔨 حظر نهائي', color: EMBED_COLORS.danger },
    UNBAN: { text: '🔓 إزالة الحظر', color: EMBED_COLORS.success },
    TIMEOUT: { text: '⏳ كتم مؤقت (Timeout)', color: EMBED_COLORS.orange },
  };

  const currentAction = actionLabels[action];

  const embed = new EmbedBuilder()
    .setTitle(currentAction.text)
    .setColor(currentAction.color)
    .setDescription(`تم اتخاذ إجراء إداري رقابي في السيرفر ضد أحد الأعضاء.`)
    .addFields(
      { name: '👤 العضو المستهدف', value: targetName, inline: true },
      { name: '🛡️ الإداري المسؤول', value: moderatorName, inline: true }
    )
    .addFields({ name: '📝 السبب المذكور', value: reason, inline: false })
    .setTimestamp();

  if (durationStr) {
    embed.addFields({ name: '⏱️ المدة المقررة', value: durationStr, inline: true });
  }

  embed.setFooter({ text: 'سجل الرقابة التلقائي • Opus Protection' });
  return embed;
}

// ============================================================
//  9. لوحة حالة الذكاء الاصطناعي والإحصائيات اللغوية (AI Stats Embed)
// ============================================================
export function createAIBrainStatusEmbed(
  dialect: string,
  sentiment: string,
  detectedLanguage: string,
  responseDelayMs: number,
  memoryRetrieved: boolean,
  arabicAILearningRate: string
): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('🧠 مركز الذكاء الاصطناعي وتحليل اللهجات')
    .setDescription('> تفاصيل عملية المعالجة اللغوية والمنطقية الجارية للرسالة المدخلة:')
    .setColor(EMBED_COLORS.royal)
    .addFields(
      { name: '🗣️ اللهجة المكتشفة', value: dialect, inline: true },
      { name: '🎭 المزاج / المشاعر المكتشفة', value: sentiment, inline: true },
      { name: '🌐 اللغة المدخلة', value: detectedLanguage, inline: true },
      { name: '⚡ سرعة الاستجابة والاستدلال', value: `${responseDelayMs}ms`, inline: true },
      { name: '💾 استرجاع الذاكرة الدائمة', value: memoryRetrieved ? '✅ ناجح' : '❌ لم تسترجع', inline: true },
      { name: '📈 دقة فهم اللهجة العربية', value: arabicAILearningRate, inline: true }
    )
    .setFooter({ text: 'دماغ بوت Opus الإدراكي الفائق' })
    .setTimestamp();
}

// ============================================================
//  10. لوحة المساعد وقائمة الأوامر (Help Embed)
// ============================================================
export function createHelpEmbed(prefix: string = '/'): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('📖 دليل أوامر خادم Opus')
    .setDescription(
      '> أهلاً بك في دليل المساعد الذكي. إليك قائمة بالأوامر المتاحة مقسمة حسب الفئات.\n' +
      `> استخدم البادئة \`${prefix}\` قبل كل أمر.`
    )
    .setColor(EMBED_COLORS.royal)
    .addFields(
      {
        name: '🧠 أوامر الذكاء الاصطناعي واللهجات',
        value:
          `• \`${prefix}ai\` : محادثة الذكاء الاصطناعي المباشرة.\n` +
          `• \`${prefix}dialect\` : تشخيص وتحليل لهجة جملة معينة.\n` +
          `• \`${prefix}brain_stats\` : جلب إحصائيات المعالجة والذاكرة الدائمة للدماغ.`,
        inline: false
      },
      {
        name: '🎵 أوامر الصوت والموسيقى',
        value:
          `• \`${prefix}play\` : تشغيل أي أغنية من يوتيوب أو رابط مباشر.\n` +
          `• \`${prefix}skip\` : تخطي المقطع الحالي وتشغيل التالي.\n` +
          `• \`${prefix}stop\` : إيقاف الموسيقى تماماً ومغادرة القناة الصوتية.\n` +
          `• \`${prefix}queue\` : عرض قائمة الانتظار للمقاطع الصوتية.\n` +
          `• \`${prefix}volume\` : تعديل مستوى صوت المشغل الموسيقي.`,
        inline: false
      },
      {
        name: '🛡️ أوامر الإدارة والرقابة',
        value:
          `• \`${prefix}build\` : إعادة بناء وتأسيس السيرفر بالكامل بالذكاء الاصطناعي.\n` +
          `• \`${prefix}mute\` : كتم عضو صوتياً أو شات مؤقتاً.\n` +
          `• \`${prefix}kick\` : طرد عضو مخالف خارج الخادم.\n` +
          `• \`${prefix}ban\` : حظر عضو نهائياً من الدخول.\n` +
          `• \`${prefix}purge\` : تنظيف وحذف الرسائل بالجملة.`,
        inline: false
      },
      {
        name: '📊 أوامر المعلومات العامة',
        value:
          `• \`${prefix}serverinfo\` : عرض إحصائيات الخادم التفصيلية.\n` +
          `• \`${prefix}userinfo\` : جلب تفاصيل وصلاحيات ورتب عضو معين.\n` +
          `• \`${prefix}ping\` : فحص سرعة استجابة البوت وسيرفرات ديسكورد.`,
        inline: false
      }
    )
    .setFooter({ text: 'Opus Intelligent Assistant • هنا لمساعدتكم' })
    .setTimestamp();
}

// ============================================================
//  11. لوحة تفاصيل الملف الشخصي للعضو (Member Profile Embed)
// ============================================================
export function createMemberProfileEmbed(
  member: GuildMember,
  warningCount: number,
  interactionCount: number
): EmbedBuilder {
  const rolesString = member.roles.cache
    .filter(r => r.id !== member.guild.id)
    .map(r => r.toString())
    .join(', ') || 'لا توجد رتب';

  return new EmbedBuilder()
    .setTitle(`👤 الملف التعريفي: ${member.user.username}`)
    .setThumbnail(member.user.displayAvatarURL())
    .setColor(member.displayColor || EMBED_COLORS.info)
    .addFields(
      { name: '📛 الاسم المستعار', value: member.nickname || 'لا يوجد لقب', inline: true },
      { name: '🆔 المعرف الرقمي', value: member.id, inline: true },
      { name: '\u200b', value: '\u200b', inline: false },
      { name: '📅 تاريخ التسجيل في ديسكورد', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
      { name: '📥 تاريخ الانضمام للخادم', value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'غير معروف', inline: true },
      { name: '\u200b', value: '\u200b', inline: false },
      { name: '⚠️ التحذيرات المسجلة', value: `${warningCount} تحذير`, inline: true },
      { name: '💬 عدد التفاعلات مع البوت', value: `${interactionCount} تفاعل`, inline: true },
      { name: '🎭 الرتب والأدوار الحالية', value: rolesString, inline: false }
    )
    .setFooter({ text: `خادم ${member.guild.name} • ملف الأعضاء` })
    .setTimestamp();
}

// ============================================================
//  12. لوحة نتائج التشخيص الفني الذاتي لبوت Opus (Diagnostics Embed)
// ============================================================
export function createDiagnosticsResultEmbed(
  suiteName: string,
  reports: string[],
  overallSuccess: boolean
): EmbedBuilder {
  const checkmarks = reports.map(r => r.startsWith('❌') ? r : `✅ ${r}`).join('\n');
  return new EmbedBuilder()
    .setTitle(`🩺 تقرير الفحص والتشخيص الذاتي لـ ${suiteName}`)
    .setDescription(
      `📊 **الحالة العامة للفحص:** ${overallSuccess ? '💚 سليم ويعمل بكفاءة عالية' : '💔 يحتوي على مشاكل تتطلب مراجعة برمجة الخادم.'}\n\n` +
      `**تفاصيل الفحوصات والعمليات:**\n${checkmarks}`
    )
    .setColor(overallSuccess ? EMBED_COLORS.success : EMBED_COLORS.danger)
    .setFooter({ text: 'نظام الفحوصات التلقائي لـ Opus Bot' })
    .setTimestamp();
}

// ============================================================
//  13. لوحة القوائم التفاعلية متعددة الصفحات (Interactive Menu Embed)
// ============================================================
export function createInteractiveMenuEmbed(
  title: string,
  items: string[],
  currentPage: number,
  totalPages: number
): EmbedBuilder {
  const itemsText = items.map((item, idx) => `**${idx + 1}.** ${item}`).join('\n');
  return new EmbedBuilder()
    .setTitle(`📖 ${title}`)
    .setDescription(
      `مرحباً بك في القائمة التفاعلية المتطورة. يمكنك التنقل بين الصفحات عبر الأزرار أدناه:\n\n${itemsText}`
    )
    .setColor(EMBED_COLORS.info)
    .setFooter({ text: `الصفحة ${currentPage} من أصل ${totalPages} • نظام القوائم` })
    .setTimestamp();
}

// ============================================================
//  14. لوحة أداء وصحة الخادم المستضيف (System Health Embed)
// ============================================================
export function createSystemHealthEmbed(
  cpuUsage: string,
  memoryUsage: string,
  freeMemory: string,
  uptime: string,
  latency: number,
  apiVersion: string
): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('⚙️ لوحة قياس كفاءة وصحة النظام المستضيف')
    .setDescription('> تقارير أداء الخادم الفورية ومعدل استهلاك الموارد المتاحة:')
    .setColor(EMBED_COLORS.royal)
    .addFields(
      { name: '💻 استهلاك المعالج CPU', value: `\`\`\`${cpuUsage}\`\`\``, inline: true },
      { name: '💾 استهلاك الذاكرة RAM', value: `\`\`\`${memoryUsage}\`\`\``, inline: true },
      { name: '🔄 الذاكرة الحرة المتبقية', value: `\`\`\`${freeMemory}\`\`\``, inline: true },
      { name: '⏱️ مدة التشغيل (Uptime)', value: `\`\`\`${uptime}\`\`\``, inline: true },
      { name: '📶 سرعة اتصال ديسكورد API', value: `\`\`\`${latency}ms\`\`\``, inline: true },
      { name: '🛠️ إصدار المكتبة Node.js', value: `\`\`\`${apiVersion}\`\`\``, inline: true }
    )
    .setFooter({ text: 'لوحة التحكم الفنية • Opus Status' })
    .setTimestamp();
}

// ============================================================
//  15. لوحة المسابقات والسحوبات (Giveaway Embed)
// ============================================================
export function createGiveawayEmbed(
  prize: string,
  durationStr: string,
  winnersCount: number,
  hostName: string
): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('🎁 سحب ومسابقة جديدة!')
    .setDescription(
      `لديك فرصة للفوز بجائزة قيمة! تفاعل مع التفاعل أدناه للمشاركة في السحب.\n\n` +
      `** الجائزة:** \` ${prize} \` \n` +
      `** عدد الفائزين:** \`${winnersCount}\` فائز\n` +
      `** المدة المتبقية:** \`${durationStr}\` \n` +
      `** الجهة المضيفة:** ${hostName}`
    )
    .setColor(EMBED_COLORS.gold)
    .setFooter({ text: 'انقر على الإيموجي للدخول في السحب التلقائي' })
    .setTimestamp();
}

// ============================================================
//  16. لوحة التصويت والاستبيان (Survey / Poll Embed)
// ============================================================
export function createPollEmbed(
  question: string,
  options: string[],
  creatorName: string,
  timeLimitMinutes?: number
): EmbedBuilder {
  const optionsText = options.map((opt, index) => {
    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    return `${emojis[index] ?? '🔹'} ${opt}`;
  }).join('\n\n');

  const embed = new EmbedBuilder()
    .setTitle('📊 استطلاع رأي واستبيان للأعضاء')
    .setDescription(`**${question}**\n\n${optionsText}`)
    .setColor(EMBED_COLORS.info)
    .addFields({ name: '👤 المنشئ', value: creatorName, inline: true });

  if (timeLimitMinutes) {
    embed.addFields({ name: '⏱️ ينتهي خلال', value: `${timeLimitMinutes} دقيقة`, inline: true });
  }

  embed.setFooter({ text: 'تفاعل بالإيموجي المقابل لخيارك المفضل' });
  embed.setTimestamp();

  return embed;
}


// ============================================================
//  18. لوحة الأذكار اليومية والأدعية (Azkar / Supplication Embed)
// ============================================================
export function createAzkarEmbed(
  category: string,
  zekrText: string,
  repeatCount: number,
  benefit?: string
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`🕌 الأذكار اليومية • ${category}`)
    .setDescription(
      `**${zekrText}**\n\n` +
      `🔄 **عدد التكرار:** \` ${repeatCount} \` مرات`
    )
    .setColor(EMBED_COLORS.success)
    .setFooter({ text: 'ألا بذكر الله تطمئن القلوب' })
    .setTimestamp();

  if (benefit) {
    embed.addFields({ name: '💡 الفضل والأجر', value: benefit });
  }

  return embed;
}

// ============================================================
//  19. لوحة قائمة المتصدرين والتفاعلات (Leaderboard Embed)
// ============================================================
export function createLeaderboardEmbed(
  title: string,
  leaderboardData: Array<{ position: number; username: string; points: number }>
): EmbedBuilder {
  const leaderboardText = leaderboardData.map(entry => {
    let medal = '🔹';
    if (entry.position === 1) medal = '🥇';
    else if (entry.position === 2) medal = '🥈';
    else if (entry.position === 3) medal = '🥉';

    return `${medal} **المركز #${entry.position}** • ${entry.username} (${entry.points.toLocaleString('ar-EG')} نقطة)`;
  }).join('\n');

  return new EmbedBuilder()
    .setTitle(`🏆 قائمة المتصدرين: ${title}`)
    .setDescription(
      `إليكم الأعضاء الأكثر تميزاً وتفاعلاً في السيرفر:\n\n${leaderboardText}`
    )
    .setColor(EMBED_COLORS.gold)
    .setFooter({ text: 'استمر في التفاعل والمشاركة للوصول إلى الصدارة!' })
    .setTimestamp();
}

// ============================================================
//  20. لوحة سجل التحذيرات والمخالفات لعضو (Warnings History Embed)
// ============================================================
export function createWarningsHistoryEmbed(
  username: string,
  warnings: Array<{ id: string; reason: string; date: string; moderator: string }>
): EmbedBuilder {
  const warningsList = warnings.length === 0
    ? '💚 العضو سجلّه نظيف وخالٍ من أي عقوبات أو مخالفات.'
    : warnings.map(w => `• **معرف:** \` ${w.id} \`\n**السبب:** ${w.reason}\n**التاريخ:** ${w.date}\n**المشرف:** ${w.moderator}`).join('\n\n');

  return new EmbedBuilder()
    .setTitle(`⚠️ سجل مخالفات العضو: ${username}`)
    .setDescription(warningsList)
    .setColor(warnings.length === 0 ? EMBED_COLORS.success : EMBED_COLORS.danger)
    .setFooter({ text: 'سجل العقوبات الرسمي لخادمنا' })
    .setTimestamp();
}

// ============================================================
//  21. لوحة تفاصيل المبيعات وسجل الفواتير (Store Invoice Embed)
// ============================================================
export function createInvoiceEmbed(
  invoiceId: string,
  buyerName: string,
  productName: string,
  price: string,
  paymentMethod: string,
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED'
): EmbedBuilder {
  const statusLabels = {
    PENDING: { text: '⏳ قيد المعالجة والدفع', color: EMBED_COLORS.warning },
    COMPLETED: { text: '✅ مكتملة وتم التسليم', color: EMBED_COLORS.success },
    CANCELLED: { text: '❌ ملغية وغير مدفوعة', color: EMBED_COLORS.danger }
  };

  const currentStatus = statusLabels[status];

  return new EmbedBuilder()
    .setTitle(`🧾 فاتورة شراء رقم: #${invoiceId}`)
    .setColor(currentStatus.color)
    .setDescription(`تفاصيل الفاتورة الرسمية للشراء من المتجر:`)
    .addFields(
      { name: '👤 المشتري / العميل', value: buyerName, inline: true },
      { name: '🎁 المنتج أو الخدمة', value: productName, inline: true },
      { name: '\u200b', value: '\u200b', inline: false },
      { name: '💰 القيمة والأسعار', value: price, inline: true },
      { name: '💳 طريقة الدفع المعينة', value: paymentMethod, inline: true },
      { name: '📊 حالة الفاتورة الحالية', value: currentStatus.text, inline: true }
    )
    .setFooter({ text: 'شكراً لتعاملكم معنا • Opus Store' })
    .setTimestamp();
}

// ============================================================
//  22. لوحة التحقق من الهوية والأعضاء (Verification Embed)
// ============================================================
export function createVerificationEmbed(serverName: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(`🛡️ بوابة التحقق البشري - ${serverName}`)
    .setDescription(
      `مرحباً بك في بوابة التحقق الرسمية للخادم.\n` +
      `لمنع الحسابات الوهمية والبوتات المزعجة، يرجى النقر على زر **التحقق (Verify)** أدناه.\n\n` +
      `> ⚠️ **تنبيه:** بمجرد التحقق، سيتم منحك رتبة العضو وتفتح لك باقي قنوات السيرفر وتوافق تلقائياً على القوانين.`
    )
    .setColor(EMBED_COLORS.royal)
    .setFooter({ text: 'حماية الخادم ضد هجمات البوتات • Security Gate' })
    .setTimestamp();
}

// ============================================================
//  23. لوحة الترقيات وارتفاع المستوى (Level Up Embed)
// ============================================================
export function createLevelUpEmbed(
  username: string,
  oldLevel: number,
  newLevel: number
): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('⚡ مبارك! لقد ارتفع مستواك تفاعلك')
    .setDescription(
      `🎉 تهانينا الحارة للعضو المتميز **${username}**!\n` +
      `لقد تفاعلت بشكل رائع مؤخراً وارتفع مستواك في الخادم.\n\n` +
      `📈 **المستوى السابق:** \` ${oldLevel} \` \n` +
      `🚀 **المستوى الجديد:** \` ${newLevel} \` `
    )
    .setColor(EMBED_COLORS.gold)
    .setFooter({ text: 'استمر في الدردشة والتفاعل للحصول على المزيد من المستويات والرتب فخرية!' })
    .setTimestamp();
}

// ============================================================
//  24. لوحة حالة ترتيب العضو ومستوى تفاعله (XP Card / Status Embed)
// ============================================================
export function createXPStatusEmbed(
  username: string,
  rank: number,
  currentXp: number,
  nextLevelXp: number,
  level: number,
  progressPercent: number
): EmbedBuilder {
  // توليد شريط تقدم نصي جميل
  const totalBlocks = 10;
  const filledBlocks = Math.round((progressPercent / 100) * totalBlocks);
  const emptyBlocks = totalBlocks - filledBlocks;
  const progressBar = '🟩'.repeat(filledBlocks) + '⬛'.repeat(emptyBlocks);

  return new EmbedBuilder()
    .setTitle(`📊 بطاقة التفاعل والترتيب: ${username}`)
    .setColor(EMBED_COLORS.info)
    .addFields(
      { name: '⭐ المستوى الحالي (Level)', value: `\` ${level} \``, inline: true },
      { name: '🏆 الترتيب على السيرفر (Rank)', value: `#${rank}`, inline: true },
      { name: '\u200b', value: '\u200b', inline: false },
      { name: '✨ الخبرة الحالية (XP)', value: `${currentXp.toLocaleString('ar-EG')} / ${nextLevelXp.toLocaleString('ar-EG')} XP`, inline: false },
      { name: `📈 التقدم نحو المستوى التالي (${progressPercent}%)`, value: `${progressBar}`, inline: false }
    )
    .setFooter({ text: 'تفاعل في قنوات الشات يمنحك نقاط خبرة مستمرة!' })
    .setTimestamp();
}

// ============================================================
//  25. لوحة طلب ترقية والحصول على رتبة VIP (VIP Application Embed)
// ============================================================
export function createVipApplicationEmbed(
  username: string,
  userId: string,
  reason: string,
  age: number,
  activeHoursPerDay: number
): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('💎 طلب الحصول على رتبة VIP جديد')
    .setDescription('تقدم أحد الأعضاء بطلب ترقية للحصول على الرتبة المتميزة:')
    .setColor(EMBED_COLORS.royal)
    .addFields(
      { name: '👤 العضو المتقدم', value: `${username} (${userId})`, inline: true },
      { name: '🎂 العمر الشخصي', value: `${age} عاماً`, inline: true },
      { name: '⏰ التواجد اليومي', value: `${activeHoursPerDay} ساعات/يوم`, inline: true },
      { name: '📝 سبب طلب الترقية للمميزين', value: reason, inline: false }
    )
    .setFooter({ text: 'قم بالرد بالقبول أو الرفض عبر الأزرار الإدارية' })
    .setTimestamp();
}

// ============================================================
//  26. لوحة تبادل الشراكات والإعلانات الرسمية (Partnership Embed)
// ============================================================
export function createPartnerEmbed(
  partnerName: string,
  description: string,
  inviteLink: string,
  bannerUrl?: string
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`🤝 شراكة جديدة ومميزة: ${partnerName}`)
    .setDescription(
      `يسعدنا أن نعلن عن عقد شراكة جديدة مع مجتمع رائع:\n\n` +
      `**📝 نبذة عن السيرفر الشريك:**\n${description}\n\n` +
      `🔗 **رابط الانضمام المباشر:** ${inviteLink}`
    )
    .setColor(EMBED_COLORS.gold)
    .setFooter({ text: 'نتمنى لشريكنا دوام التوفيق والنجاح!' })
    .setTimestamp();

  if (bannerUrl) {
    embed.setImage(bannerUrl);
  }

  return embed;
}

// ============================================================
//  27. لوحة عرض وتصميم الاقتراحات (Suggestion Embed)
// ============================================================
export function createSuggestionEmbed(
  username: string,
  suggestionText: string,
  suggestionId: number,
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' = 'PENDING'
): EmbedBuilder {
  const statusConfig = {
    PENDING: { text: '⏳ قيد المراجعة والدراسة', color: EMBED_COLORS.warning },
    ACCEPTED: { text: '✅ تم قبول الاقتراح وسيطبق قريباً', color: EMBED_COLORS.success },
    REJECTED: { text: '❌ تم رفض الاقتراح لعدم ملاءمته حالياً', color: EMBED_COLORS.danger }
  };

  return new EmbedBuilder()
    .setTitle(`💡 اقتراح جديد رقم: #${suggestionId}`)
    .setDescription(
      `**صاحب الاقتراح:** ${username}\n\n` +
      `**📝 نص الاقتراح المقدم:**\n${suggestionText}`
    )
    .setColor(statusConfig[status].color)
    .addFields({ name: '📊 حالة الاقتراح الحالية', value: statusConfig[status].text })
    .setFooter({ text: 'صوّت بأزرار التفاعل المرفقة لإبداء رأيك بالقبول أو الرفض' })
    .setTimestamp();
}

// ============================================================
//  28. لوحة مباريات وبطولات الألعاب التنافسية (Esports Match Embed)
// ============================================================
export function createEsportsMatchEmbed(
  gameName: string,
  teamAName: string,
  teamBName: string,
  matchTime: string,
  tournamentName: string,
  streamUrl?: string
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`🎮 مباراة تنافسية مرتقبة: ${tournamentName}`)
    .setDescription(
      `استعدوا لمتابعة أقوى المنافسات والتحديات في بطولة **${gameName}**!\n\n` +
      `⚔️ **المواجهة الكبرى:**\n` +
      `**${teamAName}** 🆚 **${teamBName}**`
    )
    .addFields({ name: '📅 توقيت اللعب والمباراة', value: matchTime, inline: false })
    .setColor(EMBED_COLORS.danger)
    .setFooter({ text: 'نتمنى التوفيق والروح الرياضية لجميع الفرق المشاركة!' })
    .setTimestamp();

  if (streamUrl) {
    embed.addFields({ name: '📺 رابط البث والستريم المباشر', value: `[اضغط هنا للمشاهدة](${streamUrl})` });
  }

  return embed;
}


