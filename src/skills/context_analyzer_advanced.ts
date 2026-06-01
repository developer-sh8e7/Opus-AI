/**
 * ════════════════════════════════════════════════════════════════
 *          🔍 CONTEXT ANALYZER ADVANCED - محلل السياق المتقدم
 * ════════════════════════════════════════════════════════════════
 * نظام متقدم لفهم وتحليل السياق والنية من الرسائل
 */

import { Message, Guild, GuildMember, TextChannel } from 'discord.js';

interface ContextData {
  messageId: string;
  userId: string;
  guildId: string;
  channelId: string;
  content: string;
  timestamp: number;
  dialect: string;
  intent: string;
  entities: string[];
  keywords: string[];
  sentimentScore: number;
  confidence: number;
  metadata: Record<string, any>;
}

interface SemanticAnalysis {
  primaryIntent: string;
  secondaryIntents: string[];
  entities: {
    type: string;
    value: string;
    confidence: number;
  }[];
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: 'low' | 'medium' | 'high';
  confidence: number;
}

/**
 * فئة ContextAnalyzer: تحليل السياق والنية من الرسائل
 */
export class ContextAnalyzer {
  private contextHistory: Map<string, ContextData[]> = new Map();
  private readonly MAX_HISTORY_SIZE = 50;
  
  // قاموس النوايا والعلامات
  private intentPatterns: Map<string, RegExp[]> = new Map([
    ['music_play', [
      /شغل|اتشغل|شغّل|يشغل|شُغِّل|تشغيل|افتح|حط|دير|دور لي/i,
      /play|بشغل/i
    ]],
    ['music_stop', [
      /وقف|توقف|بطّل|خليت|إيقاف|ستوب|stop/i
    ]],
    ['music_skip', [
      /تخطي|التالي|skip|next|الأغنية الثانية/i
    ]],
    ['community_create', [
      /سو|اسوي|إنشاء|إفتح|اعمل|إعمل|كوميونتي|كوميونيتي/i
    ]],
    ['warning', [
      /تحذير|تنبيه|انذار|احذر/i
    ]],
    ['admin_action', [
      /حظر|طرد|كتم|ban|kick|mute|mod/i
    ]],
    ['help_request', [
      /مساعدة|ساعد|ساعدني|كيف|كيفية|شنو|شوية|إيش/i
    ]],
    ['status_check', [
      /حالة|حالتك|كيفك|كيف حالك|أنت تمام|خير|بخير/i
    ]],
  ]);

  private dialectMarkers: Map<string, RegExp> = new Map([
    ['gulf', /يا غالي|يا حبيبي|تفضل|عفاك|معي|دابا|أنا بخير|يا معلم/i],
    ['levantine', /بدي|بتفكر|بتحكي|عندك|فيك|دابا|بس|طيب/i],
    ['egyptian', /يا معلم|يا نور|بتاع|بيقول|معاك|يا سي|دي|الحاجة/i],
    ['maghreb', /بغيت|شنو|دابا|أنا|فيا|عندي|واخا|كيفاش/i],
  ]);

  private sentimentWords: Map<string, number> = new Map([
    // كلمات إيجابية
    ['احب', 0.8],
    ['رائع', 0.9],
    ['تمام', 0.7],
    ['شكرا', 0.6],
    ['ممتاز', 0.9],
    ['جميل', 0.8],
    ['حلو', 0.7],
    ['بخير', 0.6],
    ['زين', 0.7],
    ['حاضر', 0.5],
    // كلمات سلبية
    ['غبي', -0.8],
    ['سيء', -0.7],
    ['محبط', -0.6],
    ['غاضب', -0.7],
    ['حزين', -0.6],
    ['مشكلة', -0.5],
    ['خطأ', -0.4],
  ]);

  /**
   * تحليل شامل لرسالة الدسكورد
   */
  async analyzeMessage(message: Message): Promise<ContextData> {
    console.log(`[ContextAnalyzer] تحليل الرسالة: "${message.content}"`);

    const dialect = this.detectDialect(message.content);
    const semantic = this.analyzeSemantics(message.content);
    const sentiment = this.analyzeSentiment(message.content);

    const contextData: ContextData = {
      messageId: message.id,
      userId: message.author.id,
      guildId: message.guildId || '',
      channelId: message.channelId,
      content: message.content,
      timestamp: message.createdTimestamp,
      dialect,
      intent: semantic.primaryIntent,
      entities: semantic.entities.map(e => e.value),
      keywords: this.extractKeywords(message.content),
      sentimentScore: sentiment.score,
      confidence: semantic.confidence,
      metadata: {
        channel: message.channel.toString(),
        author: message.author.username,
        hasMentions: message.mentions.users.size > 0,
        hasAttachments: message.attachments.size > 0,
        hasEmbeds: message.embeds.length > 0,
        replyTo: message.reference?.messageId
      }
    };

    // تخزين السياق في السجل
    this.storeContext(message.guildId || '', contextData);

    console.log(`[ContextAnalyzer] ✅ تم التحليل: النية=${semantic.primaryIntent}, اللهجة=${dialect}`);
    return contextData;
  }

  /**
   * كشف لهجة المستخدم
   * يحلل الكلمات والعبارات للتعرف على اللهجة
   */
  private detectDialect(content: string): string {
    let dialectScores: Record<string, number> = {
      gulf: 0,
      levantine: 0,
      egyptian: 0,
      maghreb: 0
    };

    for (const [dialect, pattern] of this.dialectMarkers.entries()) {
      const matches = content.match(pattern);
      dialectScores[dialect] = matches ? matches.length : 0;
    }

    // إرجاع اللهجة الأكثر مطابقة
    const topDialect = Object.entries(dialectScores)
      .sort(([, a], [, b]) => b - a)[0];

    return topDialect[0] || 'gulf'; // اللهجة الخليجية كافتراضي
  }

  /**
   * تحليل دلالي للرسالة
   */
  private analyzeSemantics(content: string): SemanticAnalysis {
    const lowerContent = content.toLowerCase();
    let primaryIntent = 'unknown';
    let confidence = 0;

    // البحث عن أفضل مطابقة للنية
    for (const [intent, patterns] of this.intentPatterns.entries()) {
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          primaryIntent = intent;
          confidence = 0.8 + Math.random() * 0.2;
          break;
        }
      }
    }

    // استخراج الكيانات والعناصر
    const entities = this.extractEntities(content);

    // تحديد الاستعجالية
    const urgency = this.determineUrgency(content);

    // تحديد المشاعر
    const sentimentAnalysis = this.analyzeSentiment(content);

    return {
      primaryIntent,
      secondaryIntents: [],
      entities,
      sentiment: sentimentAnalysis.sentiment,
      urgency,
      confidence
    };
  }

  /**
   * تحليل المشاعر والمزاج من الرسالة
   */
  private analyzeSentiment(content: string): { score: number; sentiment: 'positive' | 'negative' | 'neutral' } {
    let sentimentScore = 0;
    let wordCount = 0;

    const words = content.toLowerCase().split(/\s+/);
    
    for (const word of words) {
      if (this.sentimentWords.has(word)) {
        sentimentScore += this.sentimentWords.get(word) || 0;
        wordCount++;
      }
    }

    const averageScore = wordCount > 0 ? sentimentScore / wordCount : 0;

    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (averageScore > 0.3) sentiment = 'positive';
    if (averageScore < -0.3) sentiment = 'negative';

    return { score: averageScore, sentiment };
  }

  /**
   * استخراج الكلمات المفتاحية والعناصر من الرسالة
   */
  private extractKeywords(content: string): string[] {
    // إزالة الكلمات الشائعة
    const stopwords = ['و', 'في', 'من', 'إلى', 'أن', 'هل', 'هو', 'ها', 'ك', 'ب', 'ل', 'the', 'a', 'an', 'in', 'on', 'at'];
    
    const words = content
      .toLowerCase()
      .split(/\s+/)
      .filter(word => 
        word.length > 2 && 
        !stopwords.includes(word) &&
        !/[0-9]/.test(word)
      );

    return [...new Set(words)].slice(0, 5); // إرجاع أفضل 5 كلمات مفتاحية
  }

  /**
   * استخراج الكيانات المسماة من الرسالة
   */
  private extractEntities(content: string): Array<{ type: string; value: string; confidence: number }> {
    const entities: Array<{ type: string; value: string; confidence: number }> = [];

    // البحث عن أسماء الأغاني
    const songPattern = /(?:شغل|اتشغل|حط|دير)\s+(.+?)(?:\s+يا|\s+عفاك|$)/i;
    const songMatch = content.match(songPattern);
    if (songMatch) {
      entities.push({
        type: 'song_name',
        value: songMatch[1].trim(),
        confidence: 0.85
      });
    }

    // البحث عن الروابط
    const urlPattern = /(https?:\/\/[^\s]+)/gi;
    const urlMatches = content.matchAll(urlPattern);
    for (const match of urlMatches) {
      entities.push({
        type: 'url',
        value: match[1],
        confidence: 0.99
      });
    }

    // البحث عن المدة الزمنية
    const durationPattern = /(\d+)\s*(?:دقيقة|ساعة|ثانية|ساعات|دقائق|ثوان)/i;
    const durationMatch = content.match(durationPattern);
    if (durationMatch) {
      entities.push({
        type: 'duration',
        value: durationMatch[0],
        confidence: 0.9
      });
    }

    return entities;
  }

  /**
   * تحديد درجة الاستعجالية
   */
  private determineUrgency(content: string): 'low' | 'medium' | 'high' {
    const urgentKeywords = [
      /فوري|أسرع|الآن|دابا|يلا|بسرعة|emergency|urgent|now/i,
      /مشكلة|مهم جداً|حرج|critical/i
    ];

    for (const pattern of urgentKeywords) {
      if (pattern.test(content)) {
        return 'high';
      }
    }

    const mediumKeywords = [/ممكن|لو سمحت|من فضلك|please/i];
    for (const pattern of mediumKeywords) {
      if (pattern.test(content)) {
        return 'medium';
      }
    }

    return 'low';
  }

  /**
   * تخزين السياق في السجل
   */
  private storeContext(guildId: string, contextData: ContextData): void {
    if (!this.contextHistory.has(guildId)) {
      this.contextHistory.set(guildId, []);
    }

    const history = this.contextHistory.get(guildId)!;
    history.push(contextData);

    // الحفاظ على حد أقصى لحجم السجل
    if (history.length > this.MAX_HISTORY_SIZE) {
      history.shift();
    }
  }

  /**
   * الحصول على السياق السابق
   */
  getPreviousContext(guildId: string, count: number = 5): ContextData[] {
    const history = this.contextHistory.get(guildId) || [];
    return history.slice(-count);
  }

  /**
   * تحليل السياق التاريخي لفهم أفضل
   */
  analyzeContextHistory(guildId: string): Record<string, any> {
    const history = this.contextHistory.get(guildId) || [];
    
    const analysis = {
      totalMessages: history.length,
      primaryDialect: this.getMostCommonDialect(history),
      commonIntents: this.getMostCommonIntents(history),
      sentimentTrend: this.calculateSentimentTrend(history),
      averageConfidence: history.length > 0 
        ? history.reduce((sum, c) => sum + c.confidence, 0) / history.length 
        : 0
    };

    return analysis;
  }

  /**
   * الحصول على اللهجة الأكثر شيوعاً
   */
  private getMostCommonDialect(history: ContextData[]): string {
    const dialectCount: Record<string, number> = {};
    
    for (const context of history) {
      dialectCount[context.dialect] = (dialectCount[context.dialect] || 0) + 1;
    }

    return Object.entries(dialectCount)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'gulf';
  }

  /**
   * الحصول على النوايا الأكثر شيوعاً
   */
  private getMostCommonIntents(history: ContextData[]): string[] {
    const intentCount: Record<string, number> = {};
    
    for (const context of history) {
      intentCount[context.intent] = (intentCount[context.intent] || 0) + 1;
    }

    return Object.entries(intentCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([intent]) => intent);
  }

  /**
   * حساب اتجاه المشاعر
   */
  private calculateSentimentTrend(history: ContextData[]): 'improving' | 'declining' | 'stable' {
    if (history.length < 3) return 'stable';

    const recentScores = history.slice(-5).map(c => c.sentimentScore);
    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    
    const olderScores = history.slice(0, 5).map(c => c.sentimentScore);
    const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;

    if (recentAvg > olderAvg + 0.2) return 'improving';
    if (recentAvg < olderAvg - 0.2) return 'declining';
    return 'stable';
  }

  /**
   * مسح السجل
   */
  clearHistory(guildId?: string): void {
    if (guildId) {
      this.contextHistory.delete(guildId);
    } else {
      this.contextHistory.clear();
    }
    console.log('[ContextAnalyzer] تم مسح السجل');
  }
}

export default ContextAnalyzer;
