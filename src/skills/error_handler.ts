/**
 * ════════════════════════════════════════════════════════════════
 *          ⚠️ ERROR HANDLER - معالج الأخطاء الذكي
 * ════════════════════════════════════════════════════════════════
 * نظام متقدم لمعالجة الأخطاء والاستثناءات
 */

interface ErrorLog {
  timestamp: number;
  type: string;
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
  guildId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * فئة ErrorHandler: معالجة الأخطاء الذكية
 */
export class ErrorHandler {
  private errorLogs: ErrorLog[] = [];
  private readonly MAX_LOGS = 1000;

  private errorPatterns: Record<string, {
    pattern: RegExp;
    solution: string;
    severity: string;
  }> = {
    network: {
      pattern: /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|timeout/i,
      solution: 'تحقق من الاتصال بالإنترنت أو الخادم',
      severity: 'high'
    },
    permission: {
      pattern: /permission|forbidden|access denied|unauthorized/i,
      solution: 'تحقق من الصلاحيات المطلوبة',
      severity: 'medium'
    },
    validation: {
      pattern: /invalid|malformed|syntax error/i,
      solution: 'تحقق من صيغة الإدخال',
      severity: 'low'
    },
    database: {
      pattern: /database|query|collection|document/i,
      solution: 'حدث خطأ في قاعدة البيانات',
      severity: 'critical'
    },
    rate_limit: {
      pattern: /rate limit|too many requests|429/i,
      solution: 'الانتظار قبل attempt مجدداً',
      severity: 'medium'
    },
    memory: {
      pattern: /out of memory|heap|memory limit/i,
      solution: 'يجب إعادة تشغيل البوت',
      severity: 'critical'
    }
  };

  /**
   * معالجة الخطأ بذكاء
   */
  handleError(error: Error, context?: Record<string, any>): ErrorLog {
    console.error('[ErrorHandler] Error:', error.message);

    const errorType = this.identifyErrorType(error.message);
    const severity = this.determineSeverity(errorType, error);

    const errorLog: ErrorLog = {
      timestamp: Date.now(),
      type: errorType,
      message: error.message,
      stack: error.stack,
      context,
      severity
    };

    // تسجيل الخطأ
    this.logError(errorLog);

    // محاولة الحل التلقائي
    const solution = this.findSolution(errorType);
    if (solution) {
      console.log(`[ErrorHandler] Suggested fix: ${solution}`);
    }

    return errorLog;
  }

  /**
   * تحديد نوع الخطأ
   */
  private identifyErrorType(message: string): string {
    for (const [type, pattern] of Object.entries(this.errorPatterns)) {
      if (pattern.pattern.test(message)) {
        return type;
      }
    }
    return 'unknown';
  }

  /**
   * تحديد درجة خطورة الخطأ
   */
  private determineSeverity(
    type: string,
    error: Error
  ): 'low' | 'medium' | 'high' | 'critical' {
    // الأخطاء التي تؤثر على الخادم بالكامل
    if (error.message.includes('process') || error.message.includes('exit')) {
      return 'critical';
    }

    // الأخطاء في الاتصال
    if (type === 'network') {
      return 'high';
    }

    // الأخطاء في الصلاحيات
    if (type === 'permission') {
      return 'medium';
    }

    // أخطاء التحقق
    if (type === 'validation') {
      return 'low';
    }

    return 'medium';
  }

  /**
   * البحث عن حل للخطأ
   */
  private findSolution(errorType: string): string | null {
    return this.errorPatterns[errorType]?.solution || null;
  }

  /**
   * تسجيل الخطأ في السجل
   */
  private logError(errorLog: ErrorLog): void {
    this.errorLogs.push(errorLog);

    // الحفاظ على حد أقصى لعدد السجلات
    if (this.errorLogs.length > this.MAX_LOGS) {
      this.errorLogs.shift();
    }

    // طباعة السجل
    this.printErrorLog(errorLog);
  }

  /**
   * طباعة سجل الخطأ بشكل منسق
   */
  private printErrorLog(errorLog: ErrorLog): void {
    const emoji = {
      low: '🟡',
      medium: '🟠',
      high: '🔴',
      critical: '⚫'
    }[errorLog.severity] || '⚪';

    console.log(`
${emoji} ════════════════════════════════════════════
${emoji} خطأ: ${errorLog.type.toUpperCase()}
${emoji} الرسالة: ${errorLog.message}
${emoji} الخطورة: ${errorLog.severity}
${emoji} الوقت: ${new Date(errorLog.timestamp).toLocaleString('ar-EG')}
${emoji} ════════════════════════════════════════════
    `);
  }

  /**
   * الحصول على سجل الأخطاء
   */
  getErrorLogs(count?: number): ErrorLog[] {
    const logs = this.errorLogs.slice();
    if (count) {
      return logs.slice(-count);
    }
    return logs;
  }

  /**
   * الحصول على الأخطاء من نوع معين
   */
  getErrorsByType(type: string): ErrorLog[] {
    return this.errorLogs.filter(log => log.type === type);
  }

  /**
   * الحصول على الأخطاء الخطيرة
   */
  getCriticalErrors(): ErrorLog[] {
    return this.errorLogs.filter(log => log.severity === 'critical');
  }

  /**
   * إعادة تعيين السجل
   */
  clearLogs(): void {
    this.errorLogs = [];
    console.log('[ErrorHandler] Error history reset');
  }

  /**
   * تقرير شامل عن الأخطاء
   */
  generateReport(): string {
    const totalErrors = this.errorLogs.length;
    const errorTypes = this.getErrorTypeCounts();
    const critical = this.getCriticalErrors().length;

    let report = `⚠️ **تقرير الأخطاء**\n\n`;
    report += `📊 **الإحصائيات**:\n`;
    report += `• إجمالي الأخطاء: ${totalErrors}\n`;
    report += `• الأخطاء الخطيرة: ${critical}\n\n`;

    report += `📈 **توزيع الأخطاء**:\n`;
    for (const [type, count] of Object.entries(errorTypes)) {
      report += `• ${type}: ${count}\n`;
    }

    return report;
  }

  /**
   * عد الأخطاء حسب النوع
   */
  private getErrorTypeCounts(): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const log of this.errorLogs) {
      counts[log.type] = (counts[log.type] || 0) + 1;
    }

    return counts;
  }

  /**
   * معالج أخطاء عام للـ Promise
   */
  async handlePromiseError<T>(
    promise: Promise<T>,
    context?: Record<string, any>
  ): Promise<T | null> {
    try {
      return await promise;
    } catch (error) {
      this.handleError(error as Error, context);
      return null;
    }
  }

  /**
   * محاولة إعادة attempt مع التأخير
   */
  async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<T | null> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        console.warn(`[ErrorHandler] attempt ${attempt}/${maxRetries} failed: ${lastError.message}`);

        if (attempt < maxRetries) {
          const delay = initialDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    if (lastError) {
      this.handleError(lastError);
    }

    return null;
  }
}

export default ErrorHandler;
