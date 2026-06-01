/**
 * ════════════════════════════════════════════════════════════════
 *          🔄 RATE LIMITER ADVANCED - نظام تحديد السرعة الذكي
 * ════════════════════════════════════════════════════════════════
 * نظام ذكي لتحديد معدل الطلبات ومنع الإساءة
 */

interface RateLimitBucket {
  userId: string;
  tokens: number;
  lastRefill: number;
  requestCount: number;
  penalties: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  penaltyMultiplier: number;
}

/**
 * فئة RateLimiter: تحديد السرعة الذكي
 */
export class RateLimiter {
  private buckets: Map<string, RateLimitBucket> = new Map();
  private readonly DEFAULT_CONFIG: RateLimitConfig = {
    maxRequests: 10,
    windowMs: 60000, // دقيقة واحدة
    penaltyMultiplier: 1.5
  };

  private commandLimits: Map<string, RateLimitConfig> = new Map();
  private stats = {
    totalRequests: 0,
    blockedRequests: 0,
    warningsSent: 0
  };

  constructor() {
    this.initializeCommandLimits();
  }

  /**
   * تهيئة حدود الأوامر المختلفة
   */
  private initializeCommandLimits(): void {
    // أوامر موسيقية - حد أقل
    this.commandLimits.set('play', {
      maxRequests: 5,
      windowMs: 60000,
      penaltyMultiplier: 2.0
    });

    // أوامر إدارية - حد متشدد جداً
    this.commandLimits.set('ban', {
      maxRequests: 1,
      windowMs: 10000,
      penaltyMultiplier: 5.0
    });

    // أوامر عامة - حد طبيعي
    this.commandLimits.set('help', {
      maxRequests: 10,
      windowMs: 60000,
      penaltyMultiplier: 1.0
    });

    // أوامر المجتمع
    this.commandLimits.set('community', {
      maxRequests: 2,
      windowMs: 120000,
      penaltyMultiplier: 3.0
    });
  }

  /**
   * التحقق من حد المعدل
   */
  checkLimit(userId: string, command: string = 'default'): { allowed: boolean; reason?: string; retryAfter?: number } {
    this.stats.totalRequests++;

    const config = this.commandLimits.get(command) || this.DEFAULT_CONFIG;
    let bucket = this.buckets.get(userId);

    // إنشاء bucket جديد إذا لم يكن موجوداً
    if (!bucket) {
      bucket = {
        userId,
        tokens: config.maxRequests,
        lastRefill: Date.now(),
        requestCount: 0,
        penalties: 0
      };
      this.buckets.set(userId, bucket);
    }

    // إعادة ملء الـ tokens
    this.refillTokens(bucket, config);

    // التحقق من التجاوز
    if (bucket.tokens <= 0) {
      this.stats.blockedRequests++;
      const retryAfter = Math.ceil((config.windowMs - (Date.now() - bucket.lastRefill)) / 1000);

      return {
        allowed: false,
        reason: `تم تجاوز حد المعدل. حاول مجدداً بعد ${retryAfter} ثانية`,
        retryAfter
      };
    }

    // خفض عدد الـ tokens
    bucket.tokens--;
    bucket.requestCount++;

    // تطبيق العقوبات للمتكررين
    if (bucket.penalties > 0) {
      const penaltyTokens = Math.ceil(bucket.tokens * 0.1);
      bucket.tokens -= penaltyTokens;
      
      if (bucket.tokens <= 0) {
        return {
          allowed: false,
          reason: `تم حظر الطلبات مؤقتاً بسبب الإساءة المتكررة`,
          retryAfter: 60
        };
      }
    }

    return { allowed: true };
  }

  /**
   * إعادة ملء الـ tokens
   */
  private refillTokens(bucket: RateLimitBucket, config: RateLimitConfig): void {
    const now = Date.now();
    const timePassed = now - bucket.lastRefill;

    if (timePassed >= config.windowMs) {
      // إعادة ملء كامل بعد انتهاء النافذة
      bucket.tokens = config.maxRequests;
      bucket.lastRefill = now;
      bucket.requestCount = 0;
      
      // تقليل العقوبات
      bucket.penalties = Math.max(0, bucket.penalties - 1);
    } else {
      // إعادة ملء تدريجية
      const refillRate = config.maxRequests / (config.windowMs / 1000);
      const tokensToAdd = Math.floor((timePassed / 1000) * refillRate);
      bucket.tokens = Math.min(config.maxRequests, bucket.tokens + tokensToAdd);
    }
  }

  /**
   * إضافة عقوبة للمستخدم
   */
  penalizeUser(userId: string): void {
    const bucket = this.buckets.get(userId);
    if (bucket) {
      bucket.penalties++;
      console.log(`[RateLimiter] تم فرض عقوبة على المستخدم ${userId}: ${bucket.penalties}`);
    }
  }

  /**
   * الحصول على حالة حد المعدل
   */
  getStatus(userId: string): Record<string, any> {
    const bucket = this.buckets.get(userId);
    if (!bucket) {
      return { status: 'لا يوجد محدود' };
    }

    return {
      userId,
      tokensRemaining: bucket.tokens,
      totalRequests: bucket.requestCount,
      penalties: bucket.penalties,
      lastRefill: new Date(bucket.lastRefill).toLocaleString('ar-EG')
    };
  }

  /**
   * إعادة تعيين حد المعدل للمستخدم
   */
  resetUser(userId: string): void {
    this.buckets.delete(userId);
    console.log(`[RateLimiter] تم إعادة تعيين المستخدم: ${userId}`);
  }

  /**
   * الحصول على الإحصائيات
   */
  getStats(): typeof this.stats {
    const blockedRate = this.stats.totalRequests > 0
      ? (this.stats.blockedRequests / this.stats.totalRequests * 100).toFixed(2)
      : '0';

    return {
      ...this.stats,
      blockedRate: Number(blockedRate)
    } as any;
  }

  /**
   * تنظيف الـ buckets القديمة
   */
  cleanup(maxAge: number = 3600000): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [userId, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > maxAge) {
        this.buckets.delete(userId);
        cleaned++;
      }
    }

    console.log(`[RateLimiter] تم تنظيف ${cleaned} محدود قديم`);
    return cleaned;
  }

  /**
   * تقرير شامل عن حدود المعدل
   */
  generateReport(): string {
    const stats = this.getStats();
    const activeUsers = this.buckets.size;

    let report = `⏱️ **تقرير حدود المعدل**\n\n`;
    report += `📊 **الإحصائيات**:\n`;
    report += `• إجمالي الطلبات: ${stats.totalRequests}\n`;
    report += `• الطلبات المحظورة: ${stats.blockedRequests}\n`;
    report += `• معدل الحظر: ${(stats.blockedRequests / Math.max(stats.totalRequests, 1) * 100).toFixed(2)}%\n`;
    report += `• المستخدمون النشطون: ${activeUsers}\n`;

    return report;
  }

  /**
   * تسجيل الدخول للتعديل على حد معين
   */
  setCommandLimit(command: string, config: RateLimitConfig): void {
    this.commandLimits.set(command, config);
    console.log(`[RateLimiter] تم تعديل حد الأمر '${command}'`);
  }

  /**
   * الحصول على حد أمر معين
   */
  getCommandLimit(command: string): RateLimitConfig {
    return this.commandLimits.get(command) || this.DEFAULT_CONFIG;
  }
}

export default RateLimiter;
