/**
 * ════════════════════════════════════════════════════════════════
 *         📝 COMMAND PARSER - محلل الأوامر الذكي
 * ════════════════════════════════════════════════════════════════
 * نظام ذكي لتحليل وفهم الأوامر من الرسائل بدون الحاجة للـ @mention
 */

export interface ParsedCommand {
  command: string;
  args: string[];
  flags: Record<string, string | boolean>;
  rawContent: string;
  confidence: number;
  variations: string[];
}

export interface PlanStep {
  stepId: number;
  action: string;
  dependsOn?: number[];
  entityRef?: 'new' | string;
  params: Record<string, unknown>;
}

export interface PendingPlan {
  steps: PlanStep[];
  currentStepIndex: number;
  createdEntityIds: Record<number, string>;
}

const MAX_PLAN_STEPS = 15;

/**
 * فئة CommandParser: تحليل الأوامر الذكية
 */
export class CommandParser {
  private commands: Map<string, {
    aliases: string[];
    pattern: RegExp;
    handler?: (args: string[]) => any;
  }> = new Map();

  private commandAliases: Record<string, string[]> = {
    'play': ['شغل', 'اتشغل', 'شغّل', 'يشغل', 'حط', 'دير', 'دور', 'افتح'],
    'stop': ['وقف', 'توقف', 'بطّل', 'خليت', 'إيقاف', 'ستوب'],
    'skip': ['تخطي', 'التالي', 'next', 'تجاوز'],
    'pause': ['اوقف مؤقتاً', 'وقفة', 'pause'],
    'resume': ['استمر', 'كمّل', 'resume'],
    'community': ['كوميونتي', 'كوميونيتي', 'مجتمع', 'سو', 'اسوي'],
    'help': ['مساعدة', 'ساعد', 'ساعدني', 'كيف', 'help'],
    'status': ['حالة', 'حالتك', 'كيفك', 'status'],
    'ban': ['حظر', 'ban'],
    'kick': ['طرد', 'kick'],
    'mute': ['كتم', 'mute'],
    'warn': ['تحذير', 'تنبيه', 'warn'],
    'clean': ['نظّف', 'مسح', 'clean'],
  };

  /**
   * تهيئة محلل الأوامر وتسجيل الأوامر الأساسية
   */
  constructor() {
    this.registerDefaultCommands();
  }

  /**
   * تسجيل الأوامر الافتراضية
   */
  private registerDefaultCommands(): void {
    const commands = [
      {
        name: 'play',
        aliases: this.commandAliases['play'],
        pattern: /^(شغل|اتشغل|شغّل|يشغل|حط|دير|دور|افتح|play)\s+(.+)$/i
      },
      {
        name: 'stop',
        aliases: this.commandAliases['stop'],
        pattern: /^(وقف|توقف|بطّل|خليت|إيقاف|ستوب|stop)$/i
      },
      {
        name: 'skip',
        aliases: this.commandAliases['skip'],
        pattern: /^(تخطي|التالي|next|تجاوز|skip)$/i
      },
      {
        name: 'community',
        aliases: this.commandAliases['community'],
        pattern: /^(كوميونتي|كوميونيتي|مجتمع|سو|اسوي|community)\s*(.*)$/i
      },
      {
        name: 'help',
        aliases: this.commandAliases['help'],
        pattern: /^(مساعدة|ساعد|ساعدني|كيف|help)\s*(.*)$/i
      },
      {
        name: 'status',
        aliases: this.commandAliases['status'],
        pattern: /^(حالة|حالتك|كيفك|status)$/i
      },
      {
        name: 'ban',
        aliases: this.commandAliases['ban'],
        pattern: /^(حظر|ban)\s+<@?(\d+)>\s*(.*)$/i
      },
      {
        name: 'kick',
        aliases: this.commandAliases['kick'],
        pattern: /^(طرد|kick)\s+<@?(\d+)>\s*(.*)$/i
      },
      {
        name: 'mute',
        aliases: this.commandAliases['mute'],
        pattern: /^(كتم|mute)\s+<@?(\d+)>\s*(.*)$/i
      },
      {
        name: 'warn',
        aliases: this.commandAliases['warn'],
        pattern: /^(تحذير|تنبيه|warn)\s+<@?(\d+)>\s*(.*)$/i
      },
      {
        name: 'clean',
        aliases: this.commandAliases['clean'],
        pattern: /^(نظّف|مسح|clean)\s+(\d+)$/i
      }
    ];

    for (const cmd of commands) {
      this.commands.set(cmd.name, {
        aliases: cmd.aliases,
        pattern: cmd.pattern
      });
    }
  }

  /**
   * تحليل رسالة وتحويلها إلى أمر منسق
   * الميزة: لا يحتاج إلى @mention في البداية
   * يفهم كل الأوامر بدون prefix
   */
  parseCommand(content: string): ParsedCommand | null {
    console.log(`[CommandParser] Parsing: "${content}"`);

    const trimmed = content.trim();

    // 1. البحث عن تطابق مباشر مع الأوامر المسجلة
    for (const [cmdName, cmdData] of this.commands.entries()) {
      const match = trimmed.match(cmdData.pattern);
      
      if (match) {
        console.log(`[CommandParser] Command detected: ${cmdName}`);
        
        const args = this.extractArgs(match, trimmed);
        const flags = this.extractFlags(trimmed);

        return {
          command: cmdName,
          args,
          flags,
          rawContent: trimmed,
          confidence: 0.95,
          variations: [cmdName, ...cmdData.aliases]
        };
      }
    }

    // 2. محاولة التعرف على النية من الكلمات الرئيسية
    const fuzzyMatch = this.fuzzyMatchCommand(trimmed);
    if (fuzzyMatch) {
      console.log(`[CommandParser] Fuzzy command match: ${fuzzyMatch.command}`);
      return fuzzyMatch;
    }

    // 3. لا يوجد أمر مطابق
    console.log('[CommandParser] No command detected');
    return null;
  }

  /**
   * تفكيك الطلب المركب إلى خطة قصيرة قبل التنفيذ.
   * هذه طبقة محلية سريعة؛ وعند الغموض يكمّل الـ LLM التخطيط بدل التخمين.
   */
  decomposeIntent(content: string): PendingPlan | null {
    const text = content.normalize('NFKC').trim();
    if (!text) return null;
    const normalized = text
      .toLocaleLowerCase('ar')
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[أإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه');
    const steps: PlanStep[] = [];
    const addStep = (action: string, params: Record<string, unknown>, dependsOn?: number[], entityRef?: 'new' | string): void => {
      if (steps.length >= MAX_PLAN_STEPS) return;
      steps.push({ stepId: steps.length + 1, action, params, dependsOn, entityRef });
    };

    const nickname = text.match(/(?:غير|غيّر|عدل|عدّل|سميني|سمني).*?(?:اسمك|لقبك|نكك)?\s*(?:الى|إلى|لـ|ل)?\s+([^\n]+)$/i)?.[1]?.trim();
    if (/(?:غير|غيّر|عدل|عدّل|سميني|سمني).*(?:اسمك|لقبك|نكك)/i.test(normalized) && nickname) {
      addStep('edit_bot_profile', { nickname: nickname.replace(/^["'`]+|["'`]+$/g, '') });
    }

    const createMatch = text.match(/(?:سو|سوي|انشئ|أنشئ|اصنع)\s+(?:لي\s+)?(?:روم|قناة)\s+(تكست|نصي|فويس|صوتي)?\s*(?:اسمه|اسمها|باسم)?\s*([^،,\n]+?)(?=\s+(?:و|ثم|وحط|وخلي|خل|حط|اضبط|برمشن|صلاحيات)|$)/i);
    if (createMatch) {
      const requestedType = createMatch[1] ?? '';
      const name = createMatch[2].trim().split(/\s+/)[0];
      addStep('create_channels', {
        type: /(?:فويس|صوتي)/i.test(requestedType) ? 'voice' : 'text',
        names: [name],
      });
    }

    const wantsPermissions = /(?:صلاحيات?|برمشن|اضبط|حط|خلي|خلّي).*(?:يشوف|يدخل|يخش|يتكلم|يكتب|منشن|سكرين)|(?:يشوف|يدخل|يخش|يتكلم|يكتب|منشن|سكرين)/i.test(normalized);
    if (wantsPermissions) {
      const dependsOn = steps.find((step) => step.action === 'create_channels')?.stepId;
      addStep('edit_permissions', {
        channelId: dependsOn ? `STEP_${dependsOn}_RESULT` : undefined,
        targetId: /(?:الكل|everyone|@here)/i.test(normalized) ? '@everyone' : undefined,
        targetType: 'role',
        allow: [],
        deny: [],
      }, dependsOn ? [dependsOn] : undefined, dependsOn ? 'new' : undefined);
    }

    if (/(?:احذف|امسح|شيل|delete).*(?:روم|قناه|قناة|شانل)/i.test(normalized)) {
      addStep('delete_channels', { channelIds: [] });
    }

    if (steps.length === 0) return null;
    return { steps, currentStepIndex: 0, createdEntityIds: {} };
  }

  static decomposeIntent(content: string): PendingPlan | null {
    return new CommandParser().decomposeIntent(content);
  }

  /**
   * استخراج المعاملات (Arguments) من الرسالة
   */
  private extractArgs(match: RegExpMatchArray, content: string): string[] {
    const args: string[] = [];

    // تجاهل أول عنصر (الأمر نفسه)
    for (let i = 2; i < match.length; i++) {
      if (match[i] && match[i].trim()) {
        args.push(match[i].trim());
      }
    }

    return args;
  }

  /**
   * استخراج العلامات (Flags) من الرسالة
   * مثل: --user=123 أو -v
   */
  private extractFlags(content: string): Record<string, string | boolean> {
    const flags: Record<string, string | boolean> = {};
    
    // البحث عن --flag=value أو --flag
    const flagPattern = /-{1,2}([a-zA-Z0-9-]+)(?:=([^\s]+))?/g;
    let match;

    while ((match = flagPattern.exec(content)) !== null) {
      const flagName = match[1];
      const flagValue = match[2] || true;
      flags[flagName] = flagValue;
    }

    return flags;
  }

  /**
   * محاولة التعرف الغامض على الأمر
   * يحاول فهم الأمر حتى لو لم يكن دقيقاً تماماً
   */
  private fuzzyMatchCommand(content: string): ParsedCommand | null {
    const words = content.toLowerCase().split(/\s+/);
    const firstWord = words[0];

    // البحث عن أول كلمة هي alias لأمر ما
    for (const [cmdName, aliases] of Object.entries(this.commandAliases)) {
      for (const alias of aliases) {
        if (firstWord === alias || this.levenshteinDistance(firstWord, alias) <= 1) {
          const args = words.slice(1);
          
          return {
            command: cmdName,
            args,
            flags: this.extractFlags(content),
            rawContent: content,
            confidence: 0.7,
            variations: aliases
          };
        }
      }
    }

    return null;
  }

  /**
   * حساب مسافة Levenshtein لفهم التشابه بين الكلمات
   * يساعد على التعرف على الأخطاء الإملائية
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * تسجيل أمر مخصص جديد
   */
  registerCommand(
    name: string,
    aliases: string[],
    pattern: RegExp,
    handler?: (args: string[]) => any
  ): void {
    this.commands.set(name, { aliases, pattern, handler });
    this.commandAliases[name] = aliases;
    console.log(`[CommandParser] Registered command: ${name}`);
  }

  /**
   * الحصول على قائمة الأوامر المتاحة
   */
  getAvailableCommands(): Record<string, string[]> {
    return this.commandAliases;
  }

  /**
   * تنفيذ معالج الأمر إذا كان موجوداً
   */
  async executeCommand(command: string, args: string[]): Promise<any> {
    const cmdData = this.commands.get(command);
    
    if (cmdData?.handler) {
      return await cmdData.handler(args);
    }

    console.log(`[CommandParser] No handler for command: ${command}`);
    return null;
  }

  /**
   * التحقق من أن الرسالة تبدأ بأمر
   */
  isCommand(content: string): boolean {
    return this.parseCommand(content) !== null;
  }

  /**
   * الحصول على المساعدة حول أمر معين
   */
  getCommandHelp(command?: string): string {
    if (command) {
      const aliases = this.commandAliases[command];
      if (!aliases) return `❌ الأمر '${command}' غير موجود`;
      
      return `📋 الأمر: **${command}**\n🔤 الأسماء البديلة: \`${aliases.join(' | ')}\``;
    }

    // عرض جميع الأوامر
    let help = '📚 **الأوامر المتاحة:**\n\n';
    for (const [cmd, aliases] of Object.entries(this.commandAliases)) {
      help += `**${cmd}**: \`${aliases.join(' | ')}\`\n`;
    }

    return help;
  }
}

export default CommandParser;
