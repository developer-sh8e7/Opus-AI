/**
 * ════════════════════════════════════════════════════════════════
 *  محلل السياق الذكي المتطور - Advanced Context Analyzer
 *  يحلل سياق المحادثة ورسائل المستخدم ورتب الأعضاء والنشاط الصوتي
 *  يقوم بتحليل المشاعر، وتحديد مستوى تعقيد الأوامر، وتتبع الجلسات المتعددة
 * ════════════════════════════════════════════════════════════════
 */

import { Guild, GuildMember, VoiceBasedChannel, ChannelType } from 'discord.js';
import { 
  analyzeDialect, 
  DialectAnalysis, 
  extractEntities, 
  normalizeArabic, 
  COMPREHENSIVE_ARTIST_MAP 
} from './dialect_engine.js';

// ============================================================
//  الأنواع والواجهات
// ============================================================
export type IntentCategory =
  | 'music_play' | 'music_pause' | 'music_resume' | 'music_skip'
  | 'music_stop' | 'music_volume' | 'music_loop' | 'music_queue'
  | 'music_shuffle' | 'music_remove' | 'music_now_playing'
  | 'voice_join' | 'voice_leave' | 'voice_status'
  | 'server_build' | 'server_info'
  | 'channel_create' | 'channel_delete'
  | 'role_create' | 'role_delete' | 'role_edit' | 'role_assign' | 'role_remove'
  | 'member_kick' | 'member_ban' | 'member_timeout' | 'member_nickname' | 'member_move' | 'member_info'
  | 'permission_edit'
  | 'bot_profile' | 'message_delete'
  | 'greeting' | 'thanks' | 'help' | 'conversation'
  | 'sentiment_feedback'
  | 'unknown';

export type UserSentiment = 'positive' | 'neutral' | 'negative' | 'angry' | 'grateful' | 'excited' | 'confused';

export interface UserContext {
  userId: string;
  userName: string;
  displayName: string;
  isInVoice: boolean;
  voiceChannelId?: string;
  voiceChannelName?: string;
  roles: string[];
  isAdmin: boolean;
  isOwner: boolean;
  interactionCount: number;
  personaStyle: string; // 'polite' | 'demanding' | 'chatty' | 'casual'
}

export interface ChannelContext {
  channelId: string;
  channelName: string;
  channelType: string;
  categoryName?: string;
  isSafeForWork: boolean;
  isSystemChannel: boolean;
}

export interface BotContext {
  isInVoice: boolean;
  voiceChannelId?: string;
  voiceChannelName?: string;
  isPlaying: boolean;
  currentTrack?: string;
  queueLength: number;
  systemLatencyMs?: number;
}

export interface ConversationSession {
  sessionId: string;
  state: 'idle' | 'awaiting_confirmation' | 'building_server' | 'creating_playlist';
  lastIntent: IntentCategory;
  tempData: Record<string, any>;
  expiresAt: number;
}

export interface MessageContext {
  rawText: string;
  cleanText: string;
  dialectAnalysis: DialectAnalysis;
  userContext: UserContext;
  channelContext: ChannelContext;
  botContext: BotContext;
  detectedIntent: IntentCategory;
  intentConfidence: number;
  extractedParams: Record<string, any>;
  replyContext?: string;
  mentionedUsers: string[];
  mentionedChannels: string[];
  mentionedRoles: string[];
  timestamp: number;
  sentiment: UserSentiment;
  commandComplexity: 'simple' | 'medium' | 'complex';
  isQuestion: boolean;
}

// ============================================================
//  مخزن الجلسات النشطة للتتبع المتعدد
// ============================================================
const activeSessions = new Map<string, ConversationSession>();
const userInteractionCounters = new Map<string, number>();

// ============================================================
//  محلل السياق الرئيسي
// ============================================================
export class ContextAnalyzer {
  /**
   * تحليل شامل وعميق لرسالة المستخدم في السياق الحالي
   */
  static analyze(
    rawText: string,
    guild: Guild,
    member: GuildMember,
    channelId: string,
    channelName: string,
    replyContext?: string
  ): MessageContext {
    // 1. تحليل اللهجة عبر المحرك الأساسي
    const dialectAnalysis = analyzeDialect(rawText);

    // 2. تحديث وتتبع عداد التفاعلات للمستخدم
    const currentCount = (userInteractionCounters.get(member.id) || 0) + 1;
    userInteractionCounters.set(member.id, currentCount);

    // 3. بناء سياق المستخدم التفصيلي
    const userContext = this.buildUserContext(member, guild, currentCount, rawText);

    // 4. بناء سياق القناة
    const channelContext = this.buildChannelContext(guild, channelId, channelName);

    // 5. بناء سياق البوت الصوتي الحالي
    const botContext = this.buildBotContext(guild);

    // 6. كشف النية بدقة عالية واستخراج المعاملات
    const { intent, confidence, params } = this.resolveIntent(
      rawText, dialectAnalysis, userContext, botContext
    );

    // 7. استخراج المذكورين (Mentions)
    const mentionedUsers = this.extractMentions(rawText, 'user');
    const mentionedChannels = this.extractMentions(rawText, 'channel');
    const mentionedRoles = this.extractMentions(rawText, 'role');

    // 8. تحليل المشاعر للمستخدم
    const sentiment = this.analyzeSentiment(rawText, dialectAnalysis);

    // 9. تحديد مدى تعقيد الطلب
    const commandComplexity = this.evaluateComplexity(intent, params, mentionedUsers);

    // 10. التحقق مما إذا كانت الرسالة عبارة عن سؤال
    const isQuestion = this.checkIfQuestion(rawText);

    return {
      rawText,
      cleanText: dialectAnalysis.normalizedText,
      dialectAnalysis,
      userContext,
      channelContext,
      botContext,
      detectedIntent: intent,
      intentConfidence: confidence,
      extractedParams: params,
      replyContext,
      mentionedUsers,
      mentionedChannels,
      mentionedRoles,
      timestamp: Date.now(),
      sentiment,
      commandComplexity,
      isQuestion,
    };
  }

  /**
   * بناء سياق المستخدم مع تحليل أسلوبه الشخصي وتكرار تفاعله
   */
  private static buildUserContext(
    member: GuildMember, 
    guild: Guild, 
    interactionCount: number,
    rawText: string
  ): UserContext {
    const vc = member.voice.channel;
    
    // تحليل أسلوب العضو اللغوي مؤقتاً
    let personaStyle = 'casual';
    const text = rawText.toLowerCase();
    if (text.includes('من فضلك') || text.includes('لو سمحت') || text.includes('لاهنت') || text.includes('ارجو')) {
      personaStyle = 'polite';
    } else if (text.includes('بسرعه') || text.includes('الحين') || text.includes('فورا') || text.includes('يلا')) {
      personaStyle = 'demanding';
    } else if (text.split(/\s+/).length > 15) {
      personaStyle = 'chatty';
    }

    return {
      userId: member.id,
      userName: member.user.username,
      displayName: member.displayName,
      isInVoice: !!vc,
      voiceChannelId: vc?.id,
      voiceChannelName: vc?.name,
      roles: member.roles.cache.map(r => r.name),
      isAdmin: member.permissions.has('Administrator'),
      isOwner: member.id === guild.ownerId,
      interactionCount,
      personaStyle,
    };
  }

  /**
   * بناء سياق القناة الحالية
   */
  private static buildChannelContext(guild: Guild, channelId: string, channelName: string): ChannelContext {
    const channel = guild.channels.cache.get(channelId);
    let channelType = 'text';
    let categoryName: string | undefined;
    let isSafeForWork = true;
    let isSystemChannel = false;

    if (channel) {
      if (channel.type === ChannelType.GuildVoice) channelType = 'voice';
      else if (channel.type === ChannelType.GuildCategory) channelType = 'category';
      
      if (channel.parent) categoryName = channel.parent.name;
      
      if ('nsfw' in channel) {
        isSafeForWork = !(channel as any).nsfw;
      }
      
      if (guild.systemChannelId === channelId) {
        isSystemChannel = true;
      }
    }

    return { 
      channelId, 
      channelName, 
      channelType, 
      categoryName,
      isSafeForWork,
      isSystemChannel
    };
  }

  /**
   * بناء سياق البوت الصوتي (معالجة الاستدعاءات الدائرية ديناميكياً)
   */
  private static buildBotContext(guild: Guild): BotContext {
    try {
      const { getVoiceConnection } = require('@discordjs/voice');
      const { musicPlayers } = require('../tools/voice_manager.js');

      const connection = getVoiceConnection(guild.id);
      const mp = musicPlayers?.get(guild.id);

      if (connection && mp) {
        const chId = connection.joinConfig.channelId;
        const ch = chId ? guild.channels.cache.get(chId) : null;
        return {
          isInVoice: true,
          voiceChannelId: chId || undefined,
          voiceChannelName: ch?.name,
          isPlaying: !!mp.currentTrack,
          currentTrack: mp.currentTrack?.title,
          queueLength: mp.queue?.length || 0,
          systemLatencyMs: guild.client.ws.ping,
        };
      }

      if (connection) {
        const chId = connection.joinConfig.channelId;
        const ch = chId ? guild.channels.cache.get(chId) : null;
        return {
          isInVoice: true,
          voiceChannelId: chId || undefined,
          voiceChannelName: ch?.name,
          isPlaying: false,
          queueLength: 0,
          systemLatencyMs: guild.client.ws.ping,
        };
      }
    } catch (e) {
      // تفادي الأخطاء في البيئة التي لا تدعم الصوت
    }

    return { 
      isInVoice: false, 
      isPlaying: false, 
      queueLength: 0,
      systemLatencyMs: guild.client?.ws?.ping || 0
    };
  }

  /**
   * كشف النية واستخراج كافة المعاملات
   */
  private static resolveIntent(
    rawText: string,
    dialect: DialectAnalysis,
    user: UserContext,
    bot: BotContext
  ): { intent: IntentCategory; confidence: number; params: Record<string, any> } {
    const text = normalizeArabic(rawText.toLowerCase());
    const params: Record<string, any> = {};

    // ═══════════════════════════════════════
    //  أوامر الموسيقى والأغاني
    // ═══════════════════════════════════════
    
    // تشغيل أغنية
    if (this.matchesPattern(text, [
      'شغل', 'غني', 'غنلي', 'شغللي', 'شغل لي', 'حط', 'حطلي',
      'play', 'افتح', 'سمعني', 'اطربنا', 'شغلنا', 'حط لنا',
      'ابي اسمع', 'ابغى اسمع', 'ودي اسمع', 'سمعنا شي'
    ])) {
      const queryPatterns = [
        /(?:شغل|غني|غنلي|شغللي|حط|حطلي|افتح|سمعني|اطربنا|play)\s*(?:لي|لنا|يا ولد|بالله)?\s+(.+)/i,
        /(?:ابي|ابغى|ودي|حابب)\s+(?:اسمع|اشوف|شغلة|اغنية)\s+(.+)/i,
        /شغل\s+(.+)/i
      ];

      for (const p of queryPatterns) {
        const m = rawText.match(p);
        if (m) {
          params.query = m[1].trim();
          break;
        }
      }

      if (!params.query) {
        params.query = rawText.replace(/^(شغل|غني|حط|افتح|play|سمعني|اطربنا|شغلنا)\s*(لي|لنا)?\s*/i, '').trim();
      }

      // مطابقة الفنان
      if (params.query) {
        const normQuery = normalizeArabic(params.query.toLowerCase());
        for (const [key, fullName] of Object.entries(COMPREHENSIVE_ARTIST_MAP)) {
          if (normQuery.includes(normalizeArabic(key.toLowerCase()))) {
            params.detectedArtist = fullName;
            break;
          }
        }
      }

      params.requestingUserId = user.userId;
      params.requestedBy = user.displayName;
      if (user.isInVoice) {
        params.voiceChannelId = user.voiceChannelId;
      }

      return { intent: 'music_play', confidence: 0.96, params };
    }

    // إيقاف مؤقت
    if (this.matchesPattern(text, ['وقف', 'pause', 'استوب', 'سكت', 'طفي', 'هدئ', 'ميوت']) &&
        !this.matchesPattern(text, ['كل شي', 'الكل', 'تماما', 'نهائي', 'الموسيقى كلها', 'القائمة'])) {
      return { intent: 'music_pause', confidence: 0.92, params };
    }

    // استئناف التشغيل
    if (this.matchesPattern(text, ['كمل', 'resume', 'استمر', 'رجع', 'رجعها', 'كمللي', 'واصل', 'شغلها'])) {
      return { intent: 'music_resume', confidence: 0.94, params };
    }

    // تخطي الأغنية الحالية
    if (this.matchesPattern(text, ['تالي', 'skip', 'سكيب', 'التالي', 'بعدها', 'غيرها', 'حول', 'عبرها', 'طوف'])) {
      return { intent: 'music_skip', confidence: 0.95, params };
    }

    // تكرار الأغنية (Loop)
    if (this.matchesPattern(text, ['كرر', 'loop', 'ريبيت', 'repeat', 'عيدها', 'اعاده', 'كررها', 'شغالة على طول'])) {
      return { intent: 'music_loop', confidence: 0.90, params };
    }

    // التحكم بالصوت
    if (this.matchesPattern(text, ['صوت', 'فوليوم', 'volume', 'ارفع', 'خفض', 'خفف', 'علي الصوت', 'وطي الصوت'])) {
      const numMatch = text.match(/\d+/);
      if (numMatch) {
        params.volume = parseInt(numMatch[0]);
      } else if (this.matchesPattern(text, ['ارفع', 'علي', 'ماكس', 'فل'])) {
        params.volume = 120;
      } else if (this.matchesPattern(text, ['خفض', 'خفف', 'وطي', 'نزل'])) {
        params.volume = 30;
      } else if (this.matchesPattern(text, ['ميوت', 'سكر', 'كتم'])) {
        params.volume = 0;
      }
      return { intent: 'music_volume', confidence: 0.88, params };
    }

    // استعراض القائمة
    if (this.matchesPattern(text, ['القائم', 'ليست', 'كيو', 'queue', 'الطابور', 'وش بعد', 'وش يشغل', 'الانتظار'])) {
      return { intent: 'music_queue', confidence: 0.91, params };
    }

    // خلط الأغاني
    if (this.matchesPattern(text, ['خلط', 'شفل', 'shuffle', 'رندم', 'عشوائي', 'لخبط', 'فرتكة'])) {
      return { intent: 'music_shuffle', confidence: 0.90, params };
    }

    // الأغنية الحالية
    if (this.matchesPattern(text, ['وش يشغل الحين', 'now playing', 'الاغنيه الحاليه', 'وش قاعد يشغل', 'وش شغال'])) {
      return { intent: 'music_now_playing', confidence: 0.93, params };
    }

    // إيقاف تام
    if (this.matchesPattern(text, ['وقف كل', 'stop all', 'اوقف الموسيقى', 'وقف الكل', 'ايقاف تام', 'خلاص طفي', 'انها التشغيل'])) {
      return { intent: 'music_stop', confidence: 0.95, params };
    }

    // حذف من القائمة
    if (this.matchesPattern(text, ['احذف رقم', 'شيل رقم', 'احذف من القائمة', 'remove'])) {
      const numMatch = text.match(/\d+/);
      if (numMatch) params.index = parseInt(numMatch[0]);
      return { intent: 'music_remove', confidence: 0.87, params };
    }

    // ═══════════════════════════════════════
    //  أوامر الانضمام والخروج الصوتي
    // ═══════════════════════════════════════
    if (this.matchesPattern(text, ['ادخل الروم', 'تعال فويس', 'join', 'انضم فويس', 'خش معنا'])) {
      if (user.isInVoice) params.channelId = user.voiceChannelId;
      return { intent: 'voice_join', confidence: 0.92, params };
    }

    if (this.matchesPattern(text, ['اطلع', 'طلع', 'leave', 'باي', 'خرج', 'اخرج من الروم', 'انقلع'])) {
      return { intent: 'voice_leave', confidence: 0.92, params };
    }

    if (this.matchesPattern(text, ['حاله الصوت', 'voice status', 'وين البوت', 'حالتك الصوتية'])) {
      return { intent: 'voice_status', confidence: 0.86, params };
    }

    // ═══════════════════════════════════════
    //  أوامر بناء وإدارة السيرفر
    // ═══════════════════════════════════════
    if (this.matchesPattern(text, ['سو سيرفر', 'بناء سيرفر', 'ابني سيرفر', 'build server', 'ضبط السيرفر', 'صمم سيرفر'])) {
      params.description = rawText;
      return { intent: 'server_build', confidence: 0.90, params };
    }

    if (this.matchesPattern(text, ['معلومات السيرفر', 'server info', 'وش وضع السيرفر', 'احصائيات السيرفر'])) {
      return { intent: 'server_info', confidence: 0.94, params };
    }

    // القنوات
    if (this.matchesPattern(text, ['سو روم', 'سو قناة', 'انشئ روم', 'انشئ قناة', 'اعمل شات', 'create channel'])) {
      const nameMatch = rawText.match(/(?:روم|قناة|شات)\s+(.+)/i);
      if (nameMatch) params.channelName = nameMatch[1].trim();
      return { intent: 'channel_create', confidence: 0.88, params };
    }

    if (this.matchesPattern(text, ['امسح روم', 'احذف روم', 'احذف قناة', 'امسح شات', 'delete channel'])) {
      return { intent: 'channel_delete', confidence: 0.89, params };
    }

    // الرتب
    if (this.matchesPattern(text, ['سو رتبة', 'انشئ رتبة', 'سوي رول', 'اعمل رول', 'create role'])) {
      const roleMatch = rawText.match(/(?:رتبة|رول)\s+(.+)/i);
      if (roleMatch) params.roleName = roleMatch[1].trim();
      return { intent: 'role_create', confidence: 0.87, params };
    }

    // طرد وحظر وأعضاء
    if (this.matchesPattern(text, ['اطرد', 'طرد', 'kick', 'طلعه برا'])) {
      return { intent: 'member_kick', confidence: 0.94, params };
    }

    if (this.matchesPattern(text, ['بان', 'حظر', 'ban', 'احظره'])) {
      return { intent: 'member_ban', confidence: 0.95, params };
    }

    if (this.matchesPattern(text, ['ميوت', 'كتم', 'تايم اوت', 'timeout', 'mute', 'اسكته'])) {
      return { intent: 'member_timeout', confidence: 0.93, params };
    }

    if (this.matchesPattern(text, ['معلومات عضو', 'info member', 'مين هذا العضو', 'بطاقة العضو'])) {
      return { intent: 'member_info', confidence: 0.89, params };
    }

    // ═══════════════════════════════════════
    //  المحادثات العامة والاجتماعية
    // ═══════════════════════════════════════
    if (this.matchesPattern(text, ['هلا', 'مرحبا', 'السلام عليكم', 'هاي', 'اهلين', 'يامرحبا', 'شلونك', 'كيف الحال'])) {
      return { intent: 'greeting', confidence: 0.80, params };
    }

    if (this.matchesPattern(text, ['شكرا', 'تسلم', 'مشكور', 'يعطيك العافيه', 'يسلمو ايديك'])) {
      return { intent: 'thanks', confidence: 0.82, params };
    }

    if (this.matchesPattern(text, ['مساعد', 'help', 'وش تقدر تسوي', 'شنو اوامرك', 'مساعدة البوت'])) {
      return { intent: 'help', confidence: 0.85, params };
    }

    return { intent: 'unknown', confidence: 0.35, params };
  }

  /**
   * تحليل المشاعر اللغوية للمستخدم بناء على المفردات المستخدمة
   */
  private static analyzeSentiment(rawText: string, dialect: DialectAnalysis): UserSentiment {
    const text = normalizeArabic(rawText.toLowerCase());

    const positiveWords = ['شكرا', 'تسلم', 'مشكور', 'احبك', 'كفو', 'جميل', 'رائع', 'جامد', 'مزيان', 'حالي', 'زين', 'منيح', 'عاشت'];
    const angryWords = ['كل زق', 'كلاب', 'غبي', 'حمار', 'سخيف', 'زفت', 'خرا', 'بسرعه خلص', 'انقلع', 'سري', 'فارق'];
    const excitedWords = ['واو', 'يا سلام', 'الله الله', 'كفووو', 'حماسي', 'خطير', 'طرب', 'سلطنة'];
    const confusedWords = ['ليش', 'شلون', 'ازاي', 'كيف', 'ماني فاهم', 'مين', 'وش هذا', 'ما فهمت'];

    let posCount = 0;
    let angryCount = 0;
    let excCount = 0;
    let confCount = 0;

    const words = text.split(/\s+/);
    for (const word of words) {
      if (positiveWords.some(w => word.includes(w))) posCount++;
      if (angryWords.some(w => word.includes(w))) angryCount++;
      if (excitedWords.some(w => word.includes(w))) excCount++;
      if (confusedWords.some(w => word.includes(w))) confCount++;
    }

    if (angryCount > 0) return 'angry';
    if (excCount > 0) return 'excited';
    if (posCount > 0) return 'grateful';
    if (confCount > 0) return 'confused';

    return 'neutral';
  }

  /**
   * تحديد مدى تعقيد الأمر المطلوب (لتحديد عمق المعالجة)
   */
  private static evaluateComplexity(
    intent: IntentCategory, 
    params: Record<string, any>,
    mentions: string[]
  ): 'simple' | 'medium' | 'complex' {
    if (intent === 'server_build') return 'complex';
    if (intent === 'channel_create' || intent === 'role_create' || intent === 'member_ban') {
      return 'medium';
    }
    if (intent === 'music_play' && (params.query?.length > 40 || mentions.length > 0)) {
      return 'medium';
    }
    return 'simple';
  }

  /**
   * التحقق مما إذا كانت صياغة النص تشير إلى سؤال استفهامي
   */
  private static checkIfQuestion(text: string): boolean {
    const norm = normalizeArabic(text.toLowerCase());
    const questionMarkers = ['?', '؟', 'وين', 'فين', 'كيف', 'شلون', 'كيفاش', 'شنو', 'ايش', 'لماذا', 'ليه', 'علاش', 'من هو', 'مين'];
    return questionMarkers.some(m => norm.includes(m) || text.includes(m));
  }

  /**
   * مطابقة الأنماط
   */
  private static matchesPattern(text: string, patterns: string[]): boolean {
    return patterns.some(p => text.includes(p));
  }

  /**
   * استخراج معرفات المذكورين في الرسالة
   */
  private static extractMentions(text: string, type: 'user' | 'channel' | 'role'): string[] {
    const patterns: Record<string, RegExp> = {
      user: /<@!?(\d+)>/g,
      channel: /<#(\d+)>/g,
      role: /<@&(\d+)>/g,
    };

    const regex = patterns[type];
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1]);
    }
    return matches;
  }

  /**
   * تتبع الجلسات للمستخدمين للعمليات متعددة الخطوات
   */
  static getOrCreateSession(userId: string, initialIntent: IntentCategory): ConversationSession {
    let session = activeSessions.get(userId);
    if (!session || Date.now() > session.expiresAt) {
      session = {
        sessionId: `${userId}_${Date.now()}`,
        state: 'idle',
        lastIntent: initialIntent,
        tempData: {},
        expiresAt: Date.now() + 10 * 60 * 1000, // صلاحية 10 دقائق
      };
      activeSessions.set(userId, session);
    }
    return session;
  }

  /**
   * تحديث بيانات الجلسة النشطة
   */
  static updateSession(userId: string, updates: Partial<ConversationSession>): void {
    const session = activeSessions.get(userId);
    if (session) {
      Object.assign(session, updates);
      session.expiresAt = Date.now() + 10 * 60 * 1000; // تمديد الصلاحية
    }
  }

  /**
   * إنهاء الجلسة للمستخدم
   */
  static clearSession(userId: string): void {
    activeSessions.delete(userId);
  }

  /**
   * بناء البرومبت المثرى مع السياق الكامل لإرساله للذكاء الاصطناعي
   */
  static buildEnrichedPrompt(ctx: MessageContext): string {
    const lines: string[] = [];

    // سياق القناة النشطة
    lines.push(`[CHANNEL_ID:${ctx.channelContext.channelId}|CHANNEL_NAME:${ctx.channelContext.channelName}|TYPE:${ctx.channelContext.channelType}]`);

    // سياق المستخدم التفاعلي
    let userLine = `[USER_ID:${ctx.userContext.userId}|USER_NAME:${ctx.userContext.userName}`;
    userLine += `|STYLE:${ctx.userContext.personaStyle}|TURNS:${ctx.userContext.interactionCount}`;
    if (ctx.userContext.isInVoice) {
      userLine += `|USER_VOICE_CHANNEL:${ctx.userContext.voiceChannelId}|USER_VOICE_NAME:${ctx.userContext.voiceChannelName}`;
    } else {
      userLine += `|USER_VOICE_CHANNEL:|USER_VOICE_NAME:`;
    }
    userLine += ']';
    lines.push(userLine);

    // سياق البوت الحالي في الروم الصوتي
    if (ctx.botContext.isInVoice) {
      let botLine = `[BOT_VOICE:connected|BOT_VOICE_CHANNEL:${ctx.botContext.voiceChannelId}|BOT_VOICE_NAME:${ctx.botContext.voiceChannelName}`;
      if (ctx.botContext.isPlaying && ctx.botContext.currentTrack) {
        botLine += `|NOW_PLAYING:${ctx.botContext.currentTrack}|QUEUE_SIZE:${ctx.botContext.queueLength}`;
      }
      botLine += `|PING:${ctx.botContext.systemLatencyMs}ms]`;
      lines.push(botLine);
    } else {
      lines.push(`[BOT_VOICE:disconnected|PING:${ctx.botContext.systemLatencyMs}ms]`);
    }

    // سياق اللهجة والنية والمشاعر
    if (ctx.dialectAnalysis.detectedDialect !== 'unknown') {
      lines.push(`[DIALECT:${ctx.dialectAnalysis.detectedDialect}|INTENT:${ctx.detectedIntent}|SENTIMENT:${ctx.sentiment}|COMPLEXITY:${ctx.commandComplexity}|QUESTION:${ctx.isQuestion}]`);
    } else {
      lines.push(`[DIALECT:standard|INTENT:${ctx.detectedIntent}|SENTIMENT:${ctx.sentiment}|COMPLEXITY:${ctx.commandComplexity}|QUESTION:${ctx.isQuestion}]`);
    }

    // النص الأصلي بعد معالجته أو تطبيقه
    lines.push(ctx.rawText);

    // إضافة سياق الرد إذا وجد
    if (ctx.replyContext) {
      lines.push(`[الرسالة التي يرد عليها المستخدم]: ${ctx.replyContext}`);
    }

    return lines.join('\n');
  }
}

// ============================================================
//  نظام اختبارات التشخيص الذاتي لمحلل السياق
// ============================================================
export function runContextAnalyzerDiagnostics(mockGuild: any, mockMember: any): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let passed = true;

  try {
    results.push('[Diagnostic] بدء فحص محلل السياق الذكي...');
    
    // اختبار 1: معالجة الرسالة وبناء سياق المستخدم
    const ctx = ContextAnalyzer.analyze(
      'يا الغالي لاهنت شغل شيلة شاص حماسية 2026',
      mockGuild,
      mockMember,
      '1234567890',
      'chat-room'
    );

    if (ctx.userContext.userId !== mockMember.id) {
      results.push('❌ فشل اختبار 1: معرف العضو غير متطابق');
      passed = false;
    } else {
      results.push('✅ نجاح اختبار 1: بناء سياق المستخدم بنجاح');
    }

    // اختبار 2: كشف النية واستخراج الكيانات
    if (ctx.detectedIntent !== 'music_play') {
      results.push(`❌ فشل اختبار 2: النية المكتشفة خطأ (${ctx.detectedIntent})`);
      passed = false;
    } else {
      results.push('✅ نجاح اختبار 2: كشف نية تشغيل الموسيقى بنجاح');
    }

    // اختبار 3: تحليل المشاعر والمستوى اللغوي
    if (ctx.sentiment !== 'grateful') {
      results.push(`⚠️ تحذير اختبار 3: المشاعر المكتشفة غير دقيقة (${ctx.sentiment})`);
    } else {
      results.push('✅ نجاح اختبار 3: كشف مشاعر الامتنان بنجاح');
    }

    // اختبار 4: بناء البرومبت المثرى
    const enriched = ContextAnalyzer.buildEnrichedPrompt(ctx);
    if (!enriched.includes('STYLE:polite') || !enriched.includes('INTENT:music_play')) {
      results.push('❌ فشل اختبار 4: البرومبت المثرى لا يحتوي على الوسوم الصحيحة');
      passed = false;
    } else {
      results.push('✅ نجاح اختبار 4: بناء البرومبت المثرى بنجاح وبكافة الوسوم');
    }

    results.push(`[Diagnostic] انتهى الفحص بنجاح. النتيجة العامة: ${passed ? 'ناجح' : 'فاشل'}`);
  } catch (error: any) {
    passed = false;
    results.push(`❌ حدث خطأ فادح أثناء الفحص: ${error.message}`);
  }

  return { passed, results };
}
