/**
 * ════════════════════════════════════════════════════════════════
 *          💾 MEMORY CACHE - نظام إدارة الذاكرة المتقدم
 * ════════════════════════════════════════════════════════════════
 * نظام متقدم لتخزين واسترجاع البيانات مع التنظيف التلقائي
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl?: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  totalEntries: number;
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number;
}

/**
 * فئة MemoryCache: إدارة الذاكرة المؤقتة الذكية
 */
export class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private stats: CacheStats = {
    totalEntries: 0,
    hits: 0,
    misses: 0,
    evictions: 0,
    hitRate: 0
  };

  private readonly MAX_CACHE_SIZE = 5000;
  private readonly DEFAULT_TTL = 3600000; // ساعة واحدة
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startAutoCleanup();
  }

  /**
   * تخزين قيمة في الذاكرة المؤقتة
   */
  set<T>(key: string, value: T, ttl?: number): void {
    // التحقق من الحد الأقصى
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldest();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
      accessCount: 0,
      lastAccessed: Date.now()
    });

    this.stats.totalEntries = this.cache.size;
    console.log(`[MemoryCache] تم حفظ: ${key}`);
  }

  /**
   * استرجاع قيمة من الذاكرة المؤقتة
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // التحقق من انتهاء صلاحية الإدخال
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // تحديث معلومات الوصول
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    this.updateHitRate();

    console.log(`[MemoryCache] تم استرجاع: ${key}`);
    return entry.value as T;
  }

  /**
   * التحقق من وجود مفتاح
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * حذف مفتاح من الذاكرة المؤقتة
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    this.stats.totalEntries = this.cache.size;
    return deleted;
  }

  /**
   * حذف جميع المدخلات التي تتطابق مع نمط
   */
  deletePattern(pattern: RegExp): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    this.stats.totalEntries = this.cache.size;
    return count;
  }

  /**
   * إحضار أو إنشاء قيمة
   * إذا كانت موجودة، استرجعها، وإلا أنشئها
   */
  async getOrCreate<T>(
    key: string,
    creator: () => Promise<T> | T,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await creator();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * إفراغ جميع محتويات الذاكرة المؤقتة
   */
  clear(): void {
    this.cache.clear();
    this.stats.totalEntries = 0;
    console.log('[MemoryCache] تم إفراغ الذاكرة المؤقتة');
  }

  /**
   * طرد أقدم إدخال (FIFO)
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      console.log(`[MemoryCache] تم حذف: ${oldestKey}`);
    }
  }

  /**
   * تنظيف المدخلات منتهية الصلاحية
   */
  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.ttl && now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    this.stats.totalEntries = this.cache.size;

    if (cleanedCount > 0) {
      console.log(`[MemoryCache] تم تنظيف ${cleanedCount} إدخالات منتهية الصلاحية`);
    }

    return cleanedCount;
  }

  /**
   * بدء التنظيف التلقائي
   */
  private startAutoCleanup(): void {
    // تنظيف كل 5 دقائق
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * إيقاف التنظيف التلقائي
   */
  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * تحديث معدل الإصابة
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * الحصول على إحصائيات الذاكرة المؤقتة
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * إعادة تعيين الإحصائيات
   */
  resetStats(): void {
    this.stats = {
      totalEntries: this.cache.size,
      hits: 0,
      misses: 0,
      evictions: 0,
      hitRate: 0
    };
  }

  /**
   * الحصول على حجم الذاكرة المؤقتة بالبايتات
   */
  getSize(): number {
    let size = 0;
    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2; // حساب حجم المفتاح
      size += JSON.stringify(entry.value).length; // حساب حجم القيمة
    }
    return size;
  }

  /**
   * تقرير شامل عن الذاكرة المؤقتة
   */
  generateReport(): string {
    const stats = this.getStats();
    const size = (this.getSize() / 1024).toFixed(2);

    let report = `💾 **تقرير الذاكرة المؤقتة**\n\n`;
    report += `📊 **الإحصائيات**:\n`;
    report += `• إجمالي الإدخالات: ${stats.totalEntries}\n`;
    report += `• الضربات (Hits): ${stats.hits}\n`;
    report += `• الفشل (Misses): ${stats.misses}\n`;
    report += `• معدل الإصابة: ${(stats.hitRate * 100).toFixed(1)}%\n`;
    report += `• الطرد: ${stats.evictions}\n`;
    report += `• حجم الذاكرة: ${size} KB\n`;

    return report;
  }

  /**
   * الحصول على قائمة جميع المفاتيح
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * الحصول على عدد الإدخالات
   */
  size(): number {
    return this.cache.size;
  }
}

export default MemoryCache;
