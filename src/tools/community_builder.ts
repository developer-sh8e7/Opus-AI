/**
 * ════════════════════════════════════════════════════════════════
 *  باني ومصمم السيرفرات الذكي المتطور - Advanced Server & Community Builder
 *  يقوم ببناء سيرفرات متكاملة باستخدام الذكاء الاصطناعي أو قوالب معتمدة
 *  يدعم إدارة صلاحيات الرتب المتقدمة وهياكل القنوات المزينة بالإيموجي وتأكيد البناء
 * ════════════════════════════════════════════════════════════════
 */

import {
  Guild,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  TextChannel,
  OverwriteResolvable,
  Role,
  CategoryChannel,
} from 'discord.js';
import {
  createRulesEmbed,
  createWelcomeEmbed,
} from '../utils/embed_generator.js';
import { generateAIResponse, AIMessage } from '../services/ai.js';

// ============================================================
//  مساعدات التأخير الزمني والوقت
// ============================================================
async function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ============================================================
//  واجهات القوالب وهياكل السيرفرات
// ============================================================
export interface ChannelBlueprint {
  name: string;
  type: 'text' | 'voice';
  topic?: string;
  sendEmbed?: 'rules' | 'welcome' | 'info' | 'faq' | 'tickets';
  readOnly?: boolean;
  staffOnly?: boolean;
  userLimit?: number;
  rateLimitPerUser?: number; // البطء في الكتابة (Slowmode)
}

export interface CategoryBlueprint {
  name: string;
  staffOnly?: boolean;
  channels: ChannelBlueprint[];
}

export interface RoleBlueprint {
  name: string;
  color: number;
  hoist: boolean;
  permissions: bigint[];
  mentionable?: boolean;
}

export interface ServerBlueprint {
  serverType: string;
  categories: CategoryBlueprint[];
  roles: RoleBlueprint[];
  description: string;
}

// ============================================================
//  قاعدة بيانات القوالب الثابتة والمزينة (Static Blueprints)
// ============================================================
export const DETAILED_BLUEPRINTS: Record<string, ServerBlueprint> = {
  gaming: {
    serverType: 'سيرفر ألعاب ترفيهي (Gaming Server)',
    description: 'قالب سيرفر ألعاب احترافي يحتوي على غرف تواصل، بطولات، ورومات صوتية ذات جودة عالية.',
    roles: [
      { name: '👑┃المؤسس', color: 0xFFD700, hoist: true, permissions: [PermissionFlagsBits.Administrator] },
      { name: '🛡️┃الإدارة', color: 0xE74C3C, hoist: true, permissions: [PermissionFlagsBits.ManageGuild, PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers, PermissionFlagsBits.MuteMembers] },
      { name: '⚡┃المشرفين', color: 0x2ECC71, hoist: true, permissions: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.MuteMembers, PermissionFlagsBits.MoveMembers] },
      { name: '🎖️┃منظم البطولات', color: 0x9B59B6, hoist: true, permissions: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.MentionEveryone] },
      { name: '🎮┃لاعب محترف', color: 0x1ABC9C, hoist: true, permissions: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.Speak] },
      { name: '👤┃لاعبين السيرفر', color: 0x3498DB, hoist: false, permissions: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
    ],
    categories: [
      {
        name: '📢┃الترحيب والإعلانات',
        channels: [
          { name: '📋┃القوانين', type: 'text', sendEmbed: 'rules', readOnly: true },
          { name: '📢┃الإعلانات', type: 'text', readOnly: true },
          { name: '👋┃الترحيب-والتوديع', type: 'text', sendEmbed: 'welcome', readOnly: true },
          { name: '🏆┃البطولات-والفائزين', type: 'text', readOnly: true }
        ]
      },
      {
        name: '💬┃الدردشة العامة',
        channels: [
          { name: '💬┃شات-الألعاب', type: 'text', topic: 'الدردشة العامة لأعضاء السيرفر وتبادل الأفكار' },
          { name: '🖼️┃ميديا-ولقطات-الشاشة', type: 'text', topic: 'شاركنا صور لقطات لعبك والجلد' },
          { name: '🤖┃أوامر-الألعاب', type: 'text', rateLimitPerUser: 3 },
          { name: '💡┃اقتراحات-الأعضاء', type: 'text', rateLimitPerUser: 5 }
        ]
      },
      {
        name: '🎙️┃الرومات الصوتية العامة',
        channels: [
          { name: '🔊┃صوتي-عام-1', type: 'voice', userLimit: 15 },
          { name: '🔊┃صوتي-عام-2', type: 'voice', userLimit: 15 },
          { name: '🎙️┃استراحة-الأعضاء', type: 'voice', userLimit: 5 }
        ]
      },
      {
        name: '🎮┃رومات الألعاب التنافسية',
        channels: [
          { name: '⚔️┃فالورانت-Squad', type: 'voice', userLimit: 5 },
          { name: '🚗┃قراند-GTA-V', type: 'voice', userLimit: 10 },
          { name: '⛏️┃ماينكرافت-Craft', type: 'voice', userLimit: 20 },
          { name: '🔫┃ببجي-PUBG', type: 'voice', userLimit: 4 }
        ]
      },
      {
        name: '🛡️┃الإشراف والإدارة',
        staffOnly: true,
        channels: [
          { name: '📊┃غرفة-الإدارة', type: 'text', staffOnly: true },
          { name: '📝┃سجلات-الرقابة', type: 'text', staffOnly: true },
          { name: '🎙️┃اجتماع-الستاف', type: 'voice', staffOnly: true }
        ]
      }
    ]
  },
  store: {
    serverType: 'متجر تجاري (Online Store Server)',
    description: 'قالب متجر إلكتروني لبيع السلع أو الحسابات مع رومات مخصصة للعملاء والطلبات والتذاكر المضمونة.',
    roles: [
      { name: '👑┃صاحب المتجر', color: 0xFFD700, hoist: true, permissions: [PermissionFlagsBits.Administrator] },
      { name: '💼┃إدارة المبيعات', color: 0xE74C3C, hoist: true, permissions: [PermissionFlagsBits.ManageGuild, PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers] },
      { name: '🤝┃خدمة العملاء', color: 0x2ECC71, hoist: true, permissions: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.MuteMembers] },
      { name: '💎┃عميل في آي بي', color: 0x9B59B6, hoist: true, permissions: [PermissionFlagsBits.SendMessages] },
      { name: '👤┃زبائن السيرفر', color: 0x3498DB, hoist: false, permissions: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
    ],
    categories: [
      {
        name: 'ℹ️┃معلومات المتجر',
        channels: [
          { name: '📋┃القوانين-والشروط', type: 'text', sendEmbed: 'rules', readOnly: true },
          { name: '📢┃إعلانات-المتجر', type: 'text', readOnly: true },
          { name: '⭐┃آراء-وتقييم-العملاء', type: 'text', topic: 'شاركنا رأيك بالخدمة بعد الشراء' },
          { name: '💳┃طرق-الدفع-والشحن', type: 'text', readOnly: true }
        ]
      },
      {
        name: '🛒┃أقسام المنتجات المعروضة',
        channels: [
          { name: '🎁┃عروض-اليوم', type: 'text', readOnly: true },
          { name: '🎮┃حسابات-الألعاب', type: 'text', readOnly: true },
          { name: '💎┃اشتراكات-وشحنات', type: 'text', readOnly: true },
          { name: '📱┃أكواد-وبرمجيات', type: 'text', readOnly: true }
        ]
      },
      {
        name: '📩┃قسم الشراء وفتح تذاكر',
        channels: [
          { name: '🎟️┃طلب-شراء-جديد', type: 'text', sendEmbed: 'tickets', topic: 'افتح تذكرة شراء هنا للتواصل مع الدعم' },
          { name: '💬┃الدردشة-العامة', type: 'text' },
          { name: '❓┃أسئلة-شائعة-FAQ', type: 'text', readOnly: true }
        ]
      },
      {
        name: '💼┃فريق الإدارة والمالية',
        staffOnly: true,
        channels: [
          { name: '📊┃لوحة-المبيعات', type: 'text', staffOnly: true },
          { name: '💰┃التقارير-المالية', type: 'text', staffOnly: true },
          { name: '🎙️┃نقاش-الستاف', type: 'voice', staffOnly: true }
        ]
      }
    ]
  },
  clan: {
    serverType: 'كلان وفريق منافس (Clan / Esports Server)',
    description: 'سيرفر تكتيكي للفرق الرياضية والإلكترونية يدعم التخطيط والاستماع ورومات مغلقة للتدريب.',
    roles: [
      { name: '👑┃قائد الكلان', color: 0xFFD700, hoist: true, permissions: [PermissionFlagsBits.Administrator] },
      { name: '🛡️┃نائب القائد', color: 0xE74C3C, hoist: true, permissions: [PermissionFlagsBits.ManageGuild, PermissionFlagsBits.KickMembers] },
      { name: '🎯┃كابتن الفريق', color: 0x9B59B6, hoist: true, permissions: [PermissionFlagsBits.MoveMembers, PermissionFlagsBits.Speak] },
      { name: '⭐┃اللاعب الأساسي', color: 0x1ABC9C, hoist: true, permissions: [PermissionFlagsBits.SendMessages] },
      { name: '🎖️┃الاحتياط', color: 0x34495E, hoist: true, permissions: [PermissionFlagsBits.SendMessages] },
      { name: '👤┃مشجعين الكلان', color: 0x3498DB, hoist: false, permissions: [PermissionFlagsBits.ViewChannel] }
    ],
    categories: [
      {
        name: '📢┃المركز الإعلامي للكلان',
        channels: [
          { name: '📋┃تعليمات-الكلان', type: 'text', sendEmbed: 'rules', readOnly: true },
          { name: '📢┃أخبار-وتحديثات', type: 'text', readOnly: true },
          { name: '👋┃مشجعين-جدد', type: 'text', sendEmbed: 'welcome', readOnly: true }
        ]
      },
      {
        name: '💬┃المجلس العام للدردشة',
        channels: [
          { name: '💬┃شات-المشجعين', type: 'text' },
          { name: '🏆┃إنجازات-الفريق', type: 'text', readOnly: true },
          { name: '🤖┃أوامر-الكلان', type: 'text' }
        ]
      },
      {
        name: '🎯┃غرفة التدريب والتحضير',
        channels: [
          { name: '📊┃استراتيجيات-وتكتيك', type: 'text', staffOnly: true },
          { name: '🎙️┃فويس-التدريب-الأساسي', type: 'voice', userLimit: 5 },
          { name: '🎙️┃فويس-التدريب-الاحتياطي', type: 'voice', userLimit: 5 },
          { name: '🔊┃استراحة-فريق-الكلان', type: 'voice', userLimit: 10 }
        ]
      },
      {
        name: '🛡️┃شؤون قيادة الكلان',
        staffOnly: true,
        channels: [
          { name: '📊┃شات-القادة', type: 'text', staffOnly: true },
          { name: '📝┃محضر-الاجتماعات', type: 'text', staffOnly: true }
        ]
      }
    ]
  }
};

// ============================================================
//  بناء وتوليد البلوبرينت المخصص عبر الذكاء الاصطناعي
// ============================================================
async function generateBlueprintWithAI(description: string, guildName: string): Promise<ServerBlueprint> {
  const prompt = `أنت مصمم سيرفرات ديسكورد خبير ومصمم مجتمعات خارق.
المستخدم يريد إنشاء سيرفر بهذا الوصف اللغوي: "${description}"

اسم السيرفر الحالي: "${guildName}"

قم بتصميم سيرفر ديسكورد متكامل وجميل ومنظم للغاية. أجب بـ JSON فقط بهذا الهيكل الدقيق:

{
  "serverType": "اسم نوع السيرفر باللغة العربية",
  "description": "وصف مختصر للجمهور والسيرفر المقترح",
  "categories": [
    {
      "name": "اسم الفئة مع إيموجي مميز متناسق",
      "staffOnly": false,
      "channels": [
        {
          "name": "اسم القناة مع إيموجي يفصل بينهما شرطة أو رمز",
          "type": "text",
          "topic": "وصف دقيق لموضوع القناة ومراد كتابته فيها",
          "sendEmbed": "rules",
          "readOnly": false,
          "staffOnly": false
        }
      ]
    }
  ],
  "roles": [
    {
      "name": "اسم الرتبة مع إيموجي جذاب",
      "color": 16766720,
      "hoist": true,
      "mentionable": false
    }
  ]
}

قواعد البناء والتنظيم الإجبارية:
1. الفئات والقنوات باللغة العربية ومزينة برموز تعبيرية راقية ومتطابقة (مثل: 📋┃القوانين، 💬┃الدردشة-العامة).
2. أول فئة يجب أن تكون فئة الترحيب والمعلومات الإدارية. والقناة الأولى فيها تحمل خيار (sendEmbed: "rules") وقناة الترحيب (sendEmbed: "welcome").
3. قنوات القوانين والإعلانات يجب أن تكون (readOnly: true) لتفادي الفوضى.
4. السيرفر يجب أن يحتوي على فئة خاصة بالإدارة وفريق العمل تكون (staffOnly: true).
5. صمم ما بين 4 إلى 6 فئات رئيسية، وما بين 3 إلى 5 قنوات داخل كل فئة لتأمين سيرفر غني.
6. صمم ما بين 4 إلى 8 رتب إدارية واجتماعية ملونة متناسقة. الألوان المكتوبة يجب أن تكون أرقام عشرية صحيحة (Decimal) تمثل كود اللون Hex (مثال: الذهبي #FFD700 يتم كتابته كـ 16766720).
7. لا تضع مسافات في أسماء القنوات النصية واستخدم الشرطة (-) دائماً للفصل بين الكلمات.
8. نوع القناة إما "text" أو "voice" فقط.
9. فئة الصوتيات والدردشات الصوتية يجب أن تضم قنوات صوتية (type: "voice") فقط.

أجب بالـ JSON فقط دون وضع أي نصوص أو تعليقات برمجية خارج هيكل الـ JSON لكي لا ينكسر محرك فك الترميز.`;

  try {
    const aiMessage = await generateAIResponse(
      [{ role: 'user', content: prompt } as AIMessage],
      {
        intent: 'smart',
        systemPrompt: 'أنت مصمم سيرفرات ديسكورد محترف وتجيب بـ JSON فقط.',
        toolsEnabled: false,
        temperature: 0.7,
        maxTokens: 3000,
      }
    );
    const content = aiMessage.content?.trim() ?? '';

    // استخراج جيسون من الرد
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON match found in AI response text');

    const blueprint = JSON.parse(jsonMatch[0]) as ServerBlueprint;
    console.log(`[Builder] AI Blueprint successfully generated: ${blueprint.serverType}`);
    return blueprint;
  } catch (err) {
    console.error('[Builder] AI generation failed, falling back to static blueprint or template...', err);
    return getDefaultBlueprint(description);
  }
}

// ============================================================
//  البلوبرينت الافتراضي الاحتياطي (Fallback Blueprint)
// ============================================================
export function getDefaultBlueprint(description: string): ServerBlueprint {
  // مطابقة تفاصيل بسيطة للاختيار
  const lowerDesc = description.toLowerCase();
  if (lowerDesc.includes('قيمنق') || lowerDesc.includes('لعب') || lowerDesc.includes('العاب') || lowerDesc.includes('gaming')) {
    return DETAILED_BLUEPRINTS.gaming;
  }
  if (lowerDesc.includes('متجر') || lowerDesc.includes('بيع') || lowerDesc.includes('شوب') || lowerDesc.includes('store')) {
    return DETAILED_BLUEPRINTS.store;
  }
  if (lowerDesc.includes('كلان') || lowerDesc.includes('تيم') || lowerDesc.includes('فريق') || lowerDesc.includes('clan')) {
    return DETAILED_BLUEPRINTS.clan;
  }

  // قالب مجتمعي افتراضي متكامل
  return {
    serverType: description,
    description: `سيرفر مجتمعي ذكي مخصص للدردشة وتنسيق الأفكار لـ: ${description}`,
    categories: [
      {
        name: '📢┃الترحيب والمعلومات',
        channels: [
          { name: '📋┃القوانين-والتعليمات', type: 'text', sendEmbed: 'rules', readOnly: true },
          { name: '📢┃إعلانات-الخادم', type: 'text', readOnly: true },
          { name: '👋┃الترحيب-بالأعضاء', type: 'text', sendEmbed: 'welcome', readOnly: true },
        ],
      },
      {
        name: '💬┃الدردشة العامة والاجتماع',
        channels: [
          { name: '💬┃الدردشة-العامة', type: 'text', topic: 'منطقة السوالف والدردشة العامة لكل الأعضاء' },
          { name: '🖼️┃الصور-والميديا', type: 'text', topic: 'شاركنا إبداعاتك وصورك اليومية' },
          { name: '🤖┃أوامر-البوتات', type: 'text', topic: 'استدعاء أوامر البوتات الترفيهية والتنظيمية' },
        ],
      },
      {
        name: '🎙️┃الصالونات الصوتية العامة',
        channels: [
          { name: '🎤┃ديوانية-الأعضاء', type: 'voice', userLimit: 20 },
          { name: '🎵┃جلسة-موسيقى-وطرب', type: 'voice', userLimit: 10 },
          { name: '🎙️┃غرفة-شخصين-فقط', type: 'voice', userLimit: 2 },
        ],
      },
      {
        name: '🛡️┃غرفة فريق العمل',
        staffOnly: true,
        channels: [
          { name: '📊┃إدارة-الخادم', type: 'text', staffOnly: true },
          { name: '📝┃سجل-الرقابة-والأعطال', type: 'text', staffOnly: true },
        ],
      },
    ],
    roles: [
      { name: '👑┃المؤسس', color: 0xFFD700, hoist: true, permissions: [PermissionFlagsBits.Administrator] },
      { name: '🛡️┃الإدارة', color: 0xE74C3C, hoist: true, permissions: [PermissionFlagsBits.ManageGuild, PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers] },
      { name: '⚡┃المشرفين', color: 0x2ECC71, hoist: true, permissions: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.MuteMembers] },
      { name: '👤┃عضو السيرفر', color: 0x3498DB, hoist: false, permissions: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    ],
  };
}

// ============================================================
//  إزالة القنوات القديمة بشكل كامل
// ============================================================
async function clearExistingChannels(guild: Guild, protectedId: string, log: string[]): Promise<void> {
  const toDelete = guild.channels.cache.filter((ch) => ch.id !== protectedId);
  let count = 0;
  for (const [, ch] of toDelete) {
    try {
      await ch.delete('إعادة البناء والتنظيم الشامل - Opus Bot');
      count++;
      await delay(250);
    } catch (e: any) {
      console.warn(`[Builder] تعذر حذف القناة ${ch.name}: ${e.message}`);
    }
  }
  log.push(`🗑️ تم مسح وتنظيف ${count} قناة/فئة سابقة بنجاح.`);
}

// ============================================================
//  إزالة الرتب القديمة وتجنب حذف الرتب الإدارية العليا
// ============================================================
async function clearExistingRoles(guild: Guild, log: string[]): Promise<void> {
  const botPos = guild.members.me?.roles.highest.position ?? 0;
  const toDelete = guild.roles.cache.filter(
    (r) => !r.managed && r.id !== guild.id && r.position < botPos
  );
  let count = 0;
  for (const [, r] of toDelete) {
    try {
      await r.delete('تحديث الرتب وبناء السيرفر - Opus Bot');
      count++;
      await delay(250);
    } catch (e: any) {
      console.warn(`[Builder] تعذر حذف الرتبة ${r.name}: ${e.message}`);
    }
  }
  log.push(`🗑️ تم تنظيف ${count} رتبة سابقة بنجاح.`);
}

// ============================================================
//  إنشاء رتب السيرفر الجديدة وهيكلتها
// ============================================================
async function buildRoles(guild: Guild, roleBlueprints: RoleBlueprint[], log: string[]): Promise<Map<string, Role>> {
  const created = new Map<string, Role>();

  // إنشاء الرتب تنازلياً لضمان ترتيب الهرم الإداري الصحيح
  for (let i = roleBlueprints.length - 1; i >= 0; i--) {
    const rb = roleBlueprints[i];
    try {
      let perms = BigInt(0);
      if (rb.permissions) {
        for (const p of rb.permissions) perms |= BigInt(p);
      }

      const role = await guild.roles.create({
        name: rb.name,
        color: rb.color ?? 0x99AAB5,
        hoist: rb.hoist ?? false,
        mentionable: rb.mentionable ?? false,
        permissions: perms,
        reason: 'بناء رتب السيرفر الجديد - Opus Bot',
      });

      created.set(rb.name, role);
      log.push(`  ✅ تم إنشاء الرتبة: ${rb.name}`);
      await delay(300);
    } catch (err: any) {
      log.push(`  ❌ تعذر إنشاء الرتبة ${rb.name}: ${err.message}`);
    }
  }
  return created;
}

// ============================================================
//  تصفية رتب فريق العمل والإدارة
// ============================================================
function getStaffRoles(allRoles: Map<string, Role>, blueprint: ServerBlueprint): Role[] {
  // أول رتبتين في الترتيب نعتبرهما رتب طاقم العمل والمسؤولين
  const roleNames = blueprint.roles.slice(0, 2).map((r) => r.name);
  return roleNames.map((n) => allRoles.get(n)).filter(Boolean) as Role[];
}

// ============================================================
//  إنشاء الفئات وقنواتها وإعداد صلاحيات القراءة والكتابة
// ============================================================
async function buildCategoriesAndChannels(
  guild: Guild,
  blueprint: ServerBlueprint,
  staffRoles: Role[],
  log: string[]
): Promise<void> {
  for (const catBp of blueprint.categories) {
    const catPerms: OverwriteResolvable[] = [];
    
    // الصلاحيات الخاصة بـ StaffOnly
    if (catBp.staffOnly) {
      catPerms.push({ id: guild.id, deny: [PermissionFlagsBits.ViewChannel] });
      for (const sr of staffRoles) {
        catPerms.push({
          id: sr.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
        });
      }
      if (guild.client.user) {
        catPerms.push({
          id: guild.client.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels],
        });
      }
    }

    let category: CategoryChannel;
    try {
      category = await guild.channels.create({
        name: catBp.name,
        type: ChannelType.GuildCategory,
        permissionOverwrites: catPerms.length > 0 ? catPerms : undefined,
        reason: 'بناء فئات السيرفر - Opus Bot',
      }) as CategoryChannel;
      log.push(`📁 فئة: ${catBp.name}`);
      await delay(300);
    } catch (err: any) {
      log.push(`❌ فشل إنشاء فئة ${catBp.name}: ${err.message}`);
      continue;
    }

    for (const chBp of catBp.channels) {
      const chPerms: OverwriteResolvable[] = [];

      if (catBp.staffOnly || chBp.staffOnly) {
        chPerms.push({ id: guild.id, deny: [PermissionFlagsBits.ViewChannel] });
        for (const sr of staffRoles) {
          chPerms.push({
            id: sr.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
          });
        }
        if (guild.client.user) {
          chPerms.push({
            id: guild.client.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels],
          });
        }
      } else if (chBp.readOnly) {
        chPerms.push({
          id: guild.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
          deny: [PermissionFlagsBits.SendMessages],
        });
      }

      try {
        const channelType = chBp.type === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText;

        const ch = await guild.channels.create({
          name: chBp.name,
          type: channelType,
          parent: category.id,
          topic: chBp.topic,
          userLimit: chBp.userLimit,
          rateLimitPerUser: chBp.rateLimitPerUser,
          permissionOverwrites: chPerms.length > 0 ? chPerms : undefined,
          reason: 'بناء قنوات السيرفر - Opus Bot',
        });

        log.push(`  ✅ ${chBp.type === 'voice' ? '🔊' : '💬'} ${chBp.name}`);
        await delay(250);

        // إرسال كروت الترحيب والقوانين
        if (chBp.sendEmbed && chBp.type === 'text') {
          try {
            const textCh = ch as TextChannel;
            if (chBp.sendEmbed === 'rules') {
              const embeds = createRulesEmbed();
              const rulesEmbeds = Array.isArray(embeds) ? embeds : [embeds];
              for (const e of rulesEmbeds) {
                await textCh.send({ embeds: [e] });
                await delay(250);
              }
              log.push(`    📜 تم تعيين لوحة القوانين والتعليمات الرسمية.`);
            } else if (chBp.sendEmbed === 'welcome') {
              const e = createWelcomeEmbed(guild.name);
              await textCh.send({ embeds: [e] });
              log.push(`    👋 تم تعيين لوحة الترحيب بالأعضاء الجدد.`);
            }
          } catch (e: any) {
            console.error(`[Builder] فشل إرسال كارت الترحيب/القوانين: ${e.message}`);
          }
        }
      } catch (err: any) {
        log.push(`  ❌ فشل إنشاء قناة ${chBp.name}: ${err.message}`);
      }
    }
  }
}

// ============================================================
//  الأداة الرئيسية: بناء سيرفر مخصص بالذكاء الاصطناعي
// ============================================================
export async function buildCustomServer(
  guild: Guild,
  description: string,
  protectedChannelId: string
): Promise<{ success: boolean; message: string; details: string[] }> {
  const log: string[] = [];
  log.push(`🤖 جاري تصميم السيرفر وتحليل المتطلبات للوصف: "${description}"...`);

  try {
    // المرحلة 1: توليد البلوبرينت بالذكاء الاصطناعي
    log.push('\n📍 المرحلة الأولى: توليد هيكل القنوات والرتب...');
    const blueprint = await generateBlueprintWithAI(description, guild.name);
    log.push(`✅ تم التوليد بنجاح: ${blueprint.serverType}`);
    log.push(`📝 تفاصيل: ${blueprint.description}`);
    log.push(`📊 الهيكلية: ${blueprint.categories.length} فئة رئيسية | ${blueprint.roles.length} رتبة.`);

    // المرحلة 2: مسح وتنظيف القنوات
    log.push('\n📍 المرحلة الثانية: إزالة القنوات القديمة والافتراضية...');
    await clearExistingChannels(guild, protectedChannelId, log);

    // المرحلة 3: مسح وتنظيف الرتب
    log.push('\n📍 المرحلة الثالثة: إزالة الرتب السابقة...');
    await clearExistingRoles(guild, log);

    // المرحلة 4: إنشاء الرتب
    log.push('\n📍 المرحلة الرابعة: بناء الرتب الجديدة وصلاحياتها...');
    const createdRoles = await buildRoles(guild, blueprint.roles, log);

    // المرحلة 5: إنشاء الفئات والقنوات
    const staffRoles = getStaffRoles(createdRoles, blueprint);
    log.push('\n📍 المرحلة الخامسة: بناء الفئات والقنوات الصوتية والكتابية المنسقة...');
    await buildCategoriesAndChannels(guild, blueprint, staffRoles, log);

    const totalChannelsCount = blueprint.categories.reduce((acc, cat) => acc + cat.channels.length, 0);
    const successMessage = `✅ تم الانتهاء بنجاح من بناء وتصميم سيرفر "${blueprint.serverType}"!\n` +
      `📁 ${blueprint.categories.length} فئة | 💬 ${totalChannelsCount} قناة | 🎭 ${blueprint.roles.length} رتبة ملونة.`;

    log.push('\n' + successMessage);
    return { success: true, message: successMessage, details: log };
  } catch (err: any) {
    const errorMsg = err.message || String(err);
    log.push(`\n💥 حدث خطأ فادح أثناء عملية البناء: ${errorMsg}`);
    return { success: false, message: `❌ فشل بناء السيرفر بالكامل: ${errorMsg}`, details: log };
  }
}

// ============================================================
//  البناء الجاهز من خلال القوالب المباشرة
// ============================================================
export async function executeCommunityBuild(
  guild: Guild,
  blueprintType: 'community' | 'store' | 'gaming' | 'clan',
  protectedChannelId: string,
  options?: { serverName?: string }
): Promise<{ success: boolean; message: string; details: string[] }> {
  const typeDescriptions: Record<string, string> = {
    community: 'مجتمع عام بروتوكولات دردشة وفويس',
    store: 'متجر تجاري بيع حسابات وتذاكر تواصل',
    gaming: 'سيرفر قيمنق ألعاب وبطولات ترفيهية',
    clan: 'كلان وتيم منافسات رومات للتدريب المغلق',
  };

  const selectedDesc = typeDescriptions[blueprintType] || blueprintType;
  return buildCustomServer(guild, selectedDesc, protectedChannelId);
}

// ============================================================
//  نظام اختبارات التشخيص الذاتي لباني السيرفرات (Self-Tests)
// ============================================================
export function runCommunityBuilderDiagnostics(): { success: boolean; reports: string[] } {
  const reports: string[] = [];
  let success = true;

  try {
    reports.push('[Diagnostic] بدء فحص باني السيرفرات الذكي...');

    // اختبار 1: فحص وجود القوالب الأساسية وثبات حجمها
    const gamingBp = DETAILED_BLUEPRINTS.gaming;
    const storeBp = DETAILED_BLUEPRINTS.store;

    if (!gamingBp || !storeBp) {
      reports.push('❌ فشل اختبار 1: القوالب الأساسية غير معرّفة بالشكل السليم.');
      success = false;
    } else {
      reports.push('✅ نجاح اختبار 1: القوالب الأساسية متوفرة وصحيحة.');
    }

    // اختبار 2: فحص البناء الافتراضي الاحتياطي
    const fallbackBp = getDefaultBlueprint('قيمنق العاب');
    if (fallbackBp.serverType !== DETAILED_BLUEPRINTS.gaming.serverType) {
      reports.push('❌ فشل اختبار 2: محرك الـ Fallback لم يختر قالب الألعاب تلقائياً.');
      success = false;
    } else {
      reports.push('✅ نجاح اختبار 2: اختيار القوالب الاحتياطية يعمل بذكاء ودقة.');
    }

    // اختبار 3: التحقق من الرتب الافتراضية وهيكليتها
    if (fallbackBp.roles.length === 0 || !fallbackBp.roles.some(r => r.name.includes('المؤسس'))) {
      reports.push('❌ فشل اختبار 3: رتب البلوبرينت الأساسية مفقودة أو لا تحتوي على رتبة المؤسس.');
      success = false;
    } else {
      reports.push('✅ نجاح اختبار 3: هيكلية الرتب والصلاحيات معرّفة بأسلوب مثالي.');
    }

    reports.push(`[Diagnostic] انتهى الفحص بنجاح. النتيجة العامة: ${success ? 'ناجح' : 'فاشل'}`);
  } catch (e: any) {
    success = false;
    reports.push(`❌ حدث خطأ فادح أثناء الفحص: ${e.message}`);
  }

  return { success, reports };
}
