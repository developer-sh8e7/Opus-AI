/**
 * ════════════════════════════════════════════════════════════════
 *          🗣️ DIALECT DETECTOR - كاشف اللهجات العربية
 * ════════════════════════════════════════════════════════════════
 * نظام متقدم للتعرف على اللهجات العربية المختلفة
 */

interface DialectAnalysis {
  dialect: string;
  confidence: number;
  markers: string[];
  characteristics: string[];
  region: string;
  culturalNotes: string;
}

/**
 * فئة DialectDetector: الكشف عن اللهجات والتحدث بها
 */
export class DialectDetector {
  private dialectPatterns: Record<string, {
    markers: RegExp[];
    characteristics: string[];
    region: string;
    culturalNotes: string;
  }> = {
    gulf: {
      markers: [
        /يا غالي|يا حبيبي|يا معلم|تفضل|عفاك|معي|دابا|أنا بخير|واحشك|إنت/i,
        /ه(?:ـ|ِ|َ)ناك|هنيه|شنو|ويش|إيش|أمس(?:ي|ك)|الحين|الآن/i,
        /ياخذ|بياخذ|يخذ|أخذ|الـ|من|في|على/i,
      ],
      characteristics: [
        'استخدام يا غالي وتعابير الود',
        'اللام الزائدة (الـ)',
        'القاف الخليجي المميز',
        'عدم نطق الضاد بقوة'
      ],
      region: 'الخليج العربي',
      culturalNotes: 'تتسم بالود والبساطة والاحترام'
    },
    levantine: {
      markers: [
        /بدي|بتفكر|بتحكي|عندك|فيك|دابا|بس|طيب|كمان|أيضاً/i,
        /اللي|الي|كيف|شلونك|شقول|بتقول|حكيت|قلت/i,
        /في|على|عن|من|الى|ل/i,
      ],
      characteristics: [
        'استخدام بدي بكثرة',
        'الكسرات والحروف المشددة',
        'نطق الضاد الساحقة',
        'تأثر أجنبي في بعض الألفاظ'
      ],
      region: 'بلاد الشام',
      culturalNotes: 'تتسم بالرومانسية والتعبير عن المشاعر'
    },
    egyptian: {
      markers: [
        /يا معلم|يا نور|بتاع|بيقول|معاك|يا سي|دي|الحاجة|إيه|آه|ياه/i,
        /ف(?:اكر|اكرة)|قال|قلت|قول|الراجل|الست|الشرقاوي|البني/i,
        /عم|الساعة|الوقت|في|على|من|إلى/i,
      ],
      characteristics: [
        'نطق الجيم كـ G أو J',
        'استخدام يا معلم بكثرة',
        'التطويل في بعض الحروف',
        'حروف مشددة وقوية'
      ],
      region: 'مصر',
      culturalNotes: 'تتسم بالفكاهة والتعبير الحر'
    },
    maghreb: {
      markers: [
        /بغيت|شنو|دابا|أنا|فيا|عندي|واخا|كيفاش|شحالك|واش/i,
        /ا(?:ل)?د(?:ار|خل|و(?:ل|اس))|الف|الق|واخا|واكيل/i,
        /في|على|من|الى|ل|ب/i,
      ],
      characteristics: [
        'استخدام واخا بكثرة',
        'نطق الراء بشكل قوي',
        'الألف الممدودة',
        'تأثر أمازيغي وفرنسي'
      ],
      region: 'المغرب وليبيا والجزائر',
      culturalNotes: 'تتسم بالقوة والحيوية'
    },
    iraqi: {
      markers: [
        /أي|لا|ياخذ|يخذ|أخذ|كوا|كولة|يبغى|يريد|أشو|شنو/i,
        /الجاي|الراي|الحاي|الواي|التاي|الباي/i,
        /في|على|من|الى|ل|ب/i,
      ],
      characteristics: [
        'استخدام الياء بكثرة',
        'النطق القوي للحروف',
        'التطويل في الحروف المشددة',
        'استخدام الكلمات التراثية'
      ],
      region: 'العراق',
      culturalNotes: 'تتسم بالقوة والتراث والشعر'
    },
  };

  /**
   * تحليل شامل للهجة النص
   */
  analyzeDialect(text: string): DialectAnalysis {
    console.log(`[DialectDetector] تحليل: "${text.substring(0, 50)}..."`);

    let bestMatch: DialectAnalysis | null = null;
    let bestScore = 0;

    // حساب نقاط لكل لهجة
    for (const [dialectName, dialectData] of Object.entries(this.dialectPatterns)) {
      let score = 0;
      let markersFound: string[] = [];

      // فحص كل علامة
      for (const marker of dialectData.markers) {
        const matches = text.match(marker);
        if (matches) {
          score += matches.length * 10;
          markersFound = markersFound.concat(matches);
        }
      }

      // تطبيع النقاط
      const confidence = Math.min(score / (dialectData.markers.length * 10), 1.0);

      if (confidence > bestScore) {
        bestScore = confidence;
        bestMatch = {
          dialect: dialectName,
          confidence,
          markers: [...new Set(markersFound)],
          characteristics: dialectData.characteristics,
          region: dialectData.region,
          culturalNotes: dialectData.culturalNotes
        };
      }
    }

    return bestMatch || {
      dialect: 'gulf',
      confidence: 0.5,
      markers: [],
      characteristics: [],
      region: 'الخليج العربي',
      culturalNotes: 'لهجة افتراضية'
    };
  }

  /**
   * الرد باللهجة المناسبة
   * تحويل الرد إلى اللهجة التي يستخدمها المستخدم
   */
  respondInDialect(response: string, dialect: string): string {
    console.log(`[DialectDetector] تحويل الرد إلى لهجة: ${dialect}`);

    const dialectResponses: Record<string, (msg: string) => string> = {
      gulf: (msg: string) => {
        return `يا غالي، ${msg}. تفضل معي بأي شيء ثاني؟`;
      },
      levantine: (msg: string) => {
        return `أخي، ${msg}. في أي حاجة ثانية بقدر ساعدك فيها؟`;
      },
      egyptian: (msg: string) => {
        return `يا معلم، ${msg}. في حاجة تانية أقدر أساعدك فيها؟`;
      },
      maghreb: (msg: string) => {
        return `حبيبي، ${msg}. واخا في حاجة ثانية بقدر نساعدك فيها؟`;
      },
      iraqi: (msg: string) => {
        return `يا غالي، ${msg}. في شي ثاني أقدر أساعدك فيه؟`;
      },
    };

    const responder = dialectResponses[dialect];
    if (responder) {
      return responder(response);
    }

    return response;
  }

  /**
   * الحصول على معلومات عن اللهجة
   */
  getDialectInfo(dialect: string): DialectAnalysis | null {
    const dialectData = this.dialectPatterns[dialect];
    if (!dialectData) return null;

    return {
      dialect,
      confidence: 1.0,
      markers: dialectData.markers.map(r => r.source),
      characteristics: dialectData.characteristics,
      region: dialectData.region,
      culturalNotes: dialectData.culturalNotes
    };
  }

  /**
   * قائمة اللهجات المدعومة
   */
  getSupportedDialects(): string[] {
    return Object.keys(this.dialectPatterns);
  }

  /**
   * تحديد اللهجة الأساسية من نص
   */
  getPrimaryDialect(text: string): string {
    return this.analyzeDialect(text).dialect;
  }

  /**
   * قياس التشابه بين نصين من حيث اللهجة
   */
  compareDialects(text1: string, text2: string): { similarity: number; description: string } {
    const dialect1 = this.analyzeDialect(text1);
    const dialect2 = this.analyzeDialect(text2);

    const similarity = dialect1.dialect === dialect2.dialect ? 1.0 : 0.0;
    const description = `${dialect1.dialect} vs ${dialect2.dialect}`;

    return { similarity, description };
  }

  /**
   * الحصول على تقرير تفصيلي عن اللهجة
   */
  generateReport(text: string): string {
    const analysis = this.analyzeDialect(text);

    let report = `📊 **تقرير تحليل اللهجة**\n\n`;
    report += `🗣️ **اللهجة المكتشفة**: ${analysis.dialect.toUpperCase()}\n`;
    report += `📍 **المنطقة**: ${analysis.region}\n`;
    report += `📈 **درجة الثقة**: ${(analysis.confidence * 100).toFixed(1)}%\n\n`;
    
    report += `🔍 **العلامات المكتشفة**:\n`;
    analysis.markers.slice(0, 5).forEach(marker => {
      report += `• ${marker}\n`;
    });

    report += `\n✨ **الخصائص**:\n`;
    analysis.characteristics.forEach(char => {
      report += `• ${char}\n`;
    });

    report += `\n📝 **ملاحظات ثقافية**: ${analysis.culturalNotes}\n`;

    return report;
  }
}

export default DialectDetector;
