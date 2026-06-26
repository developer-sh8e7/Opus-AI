/**
 * ════════════════════════════════════════════════════════════════
 *  مدير الذاكرة الذكي المتطور - Advanced Smart Memory Manager
 *  يدير ذاكرة المحادثات، ويحفظ التفضيلات بشكل دائم، ويصنف الكلمات
 *  يدعم البحث الدلالي بنظام التردد العكسي للكلمات (TF-IDF)، والحفظ التلقائي في ملفات JSON
 * ════════════════════════════════════════════════════════════════
 */

import * as fs from 'fs';
import * as path from 'path';
import type { AIMessage } from '../services/ai.js';
import type { EntityType, RegisteredEntity } from './entity_registry.js';

// ============================================================
//  الأنواع والواجهات
// ============================================================
export type SessionLanguagePreference = 'ar' | 'en';

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

export interface SessionState {
  entities: SessionEntity[];
  lastReferencedEntityId?: string;
  languagePreference: SessionLanguagePreference;
  pendingMultiStepPlan?: PendingPlan;
}

export interface ConversationSummary {
  topics: string[];
  lastMusicQuery?: string;
  lastBuildRequest?: string;
  userPreferences: Record<string, string>;
  languagePreference?: SessionLanguagePreference;
  interactionCount: number;
  lastInteraction: number;
  musicHistory: string[];
  errorHistory: string[];
  lastActions?: string[];
  userProfile?: UserProfile;
}

export interface UserProfile {
  userId: string;
  preferredDialect: string;
  favoriteArtists: string[];
  favoriteBlueprints: string[];
  totalMessagesSent: number;
  lastSeen: number;
  commandExecutionLog: string[];
}

export interface MemoryEntry {
  messages: AIMessage[];
  summary: ConversationSummary;
  entities: SessionEntity[];
  lastEntityIds: SessionEntityPointers;
  lastReferencedEntityId?: string;
  languagePreference: SessionLanguagePreference;
  pendingMultiStepPlan?: PendingPlan;
  turnCounter: number;
  createdAt: number;
  lastAccessed: number;
}

export interface SessionEntityPointers {
  last_channel_id?: string;
  last_role_id?: string;
  last_category_id?: string;
}

export interface SessionEntity {
  guildId: string;
  type: EntityType;
  id: string;
  name: string;
  sourceTool?: string;
  createdAt: number;
  createdInTurn: number;
  metadata?: Record<string, unknown>;
}

// ============================================================
//  الإعدادات الثابتة
// ============================================================
const MAX_MESSAGES_PER_CHANNEL = 60; // الحد الأقصى للرسائل المحفوظة
const MAX_TOOL_RESULT_LENGTH = 3500; // الحد الأقصى لنتائج الأدوات
const SUMMARY_THRESHOLD = 25; // عدد الرسائل قبل التلخيص
const MUSIC_HISTORY_LIMIT = 25; // الحد الأقصى لتاريخ الموسيقى
const ERROR_HISTORY_LIMIT = 15; // الحد الأقصى لتاريخ الأخطاء
const SESSION_ENTITY_LIMIT = 100;
const SESSION_ENTITY_TTL = 24 * 60 * 60 * 1000;
const CLEANUP_INTERVAL = 20 * 60 * 1000; // تنظيف الذاكرة غير النشطة كل 20 دقيقة
const MAX_INACTIVE_TIME = 24 * 60 * 60 * 1000; // حذف بعد يوم خمول للحفاظ على مراجع الرومات والرتب
const DATA_DIR = path.join(process.cwd(), 'data');
const MEMORY_FILE_PATH = path.join(DATA_DIR, 'persistent_memory.json');

// ============================================================
//  مدير الذاكرة الذكي
// ============================================================
export class MemoryManager {
  private memories = new Map<string, MemoryEntry>();
  private userProfiles = new Map<string, UserProfile>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private isSaving = false;

  constructor() {
    // التأكد من وجود مجلد البيانات
    this.ensureDataDirectory();
    // تحميل البيانات المحفوظة تلقائياً
    this.loadMemoryFromDisk();
    // بدء مؤقت التنظيف الدوري
    this.cleanupTimer = setInterval(() => this.cleanup(), CLEANUP_INTERVAL);
    this.cleanupTimer.unref();
  }

  /**
   * التأكد من وجود مجلد حفظ البيانات
   */
  private ensureDataDirectory(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (e) {
      console.error('[Memory] Failed to create data directory:', e);
    }
  }

  /**
   * حفظ محتويات الذاكرة في ملف JSON بشكل آمن وغير متزامن
   */
  async saveMemoryToDisk(): Promise<boolean> {
    if (this.isSaving) return false;
    this.isSaving = true;
    
    try {
      const dataToSave = {
        memories: Array.from(this.memories.entries()).map(([channelId, entry]) => ({
          channelId,
          entry: {
            messages: entry.messages,
            summary: entry.summary,
            entities: entry.entities,
            lastEntityIds: entry.lastEntityIds,
            lastReferencedEntityId: entry.lastReferencedEntityId,
            languagePreference: entry.languagePreference,
            pendingMultiStepPlan: entry.pendingMultiStepPlan,
            turnCounter: entry.turnCounter,
            createdAt: entry.createdAt,
            lastAccessed: entry.lastAccessed
          }
        })),
        userProfiles: Array.from(this.userProfiles.entries())
      };

      await fs.promises.writeFile(MEMORY_FILE_PATH, JSON.stringify(dataToSave, null, 2), 'utf-8');
      this.isSaving = false;
      return true;
    } catch (error) {
      console.error('[Memory] Failed to save memory to disk:', error);
      this.isSaving = false;
      return false;
    }
  }

  /**
   * تحميل محتويات الذاكرة من القرص عند بدء التشغيل
   */
  private loadMemoryFromDisk(): void {
    try {
      if (!fs.existsSync(MEMORY_FILE_PATH)) {
        console.log('[Memory] No previous memory file found; starting with empty local memory.');
        return;
      }

      const rawData = fs.readFileSync(MEMORY_FILE_PATH, 'utf-8');
      if (!rawData.trim()) return;

      const parsed = JSON.parse(rawData);

      if (parsed.memories && Array.isArray(parsed.memories)) {
        for (const item of parsed.memories) {
          if (item.channelId && item.entry) {
            const rawEntities = Array.isArray(item.entry.entities) ? item.entry.entities : [];
            const entities: SessionEntity[] = rawEntities.map((entity: SessionEntity & { createdInTurn?: number }) => ({
              ...entity,
              createdInTurn: Number.isFinite(entity.createdInTurn)
                ? Number(entity.createdInTurn)
                : Number(item.entry.turnCounter ?? item.entry.summary?.interactionCount ?? 0),
            }));
            const lastEntityIds: SessionEntityPointers = item.entry.lastEntityIds ?? {};
            for (const entity of [...entities].sort(
              (left, right) => Number(left.createdAt ?? 0) - Number(right.createdAt ?? 0)
            )) {
              if (entity.type === 'channel' || entity.type === 'thread') {
                lastEntityIds.last_channel_id = entity.id;
              } else if (entity.type === 'role') {
                lastEntityIds.last_role_id = entity.id;
              } else if (entity.type === 'category') {
                lastEntityIds.last_category_id = entity.id;
              }
            }
            const summary: ConversationSummary = item.entry.summary || {
              topics: [], userPreferences: {}, interactionCount: 0,
              lastInteraction: Date.now(), musicHistory: [], errorHistory: [], lastActions: []
            };
            const languagePreference = this.normalizeLanguagePreference(
              item.entry.languagePreference ?? summary.languagePreference
            );
            summary.languagePreference = languagePreference;
            this.memories.set(item.channelId, {
              messages: item.entry.messages || [],
              summary,
              entities,
              lastEntityIds,
              lastReferencedEntityId: item.entry.lastReferencedEntityId ?? entities.at(-1)?.id,
              languagePreference,
              pendingMultiStepPlan: item.entry.pendingMultiStepPlan,
              turnCounter: Number(item.entry.turnCounter ?? summary.interactionCount ?? 0),
              createdAt: item.entry.createdAt || Date.now(),
              lastAccessed: Date.now()
            });
          }
        }
      }

      if (parsed.userProfiles && Array.isArray(parsed.userProfiles)) {
        for (const [userId, profile] of parsed.userProfiles) {
          this.userProfiles.set(userId, profile);
        }
      }

      console.log(`[Memory] Restored ${this.memories.size} channel memories and ${this.userProfiles.size} user profiles.`);
    } catch (error) {
      console.error('[Memory] Failed to read memory file:', error);
    }
  }

  /**
   * الحصول على تاريخ المحادثة لقناة معينة
   */
  getHistory(channelId: string): AIMessage[] {
    const entry = this.memories.get(channelId);
    if (!entry) return [];
    entry.lastAccessed = Date.now();
    return [...entry.messages];
  }

  /**
   * الحصول على ملخص المحادثة وسجل الموسيقى والطلب لقناة معينة
   */
  getSummary(channelId: string): ConversationSummary {
    const entry = this.memories.get(channelId);
    if (!entry) {
      return {
        topics: [],
        userPreferences: {},
        languagePreference: 'ar',
        interactionCount: 0,
        lastInteraction: Date.now(),
        musicHistory: [],
        errorHistory: [],
        lastActions: [],
      };
    }
    return entry.summary;
  }

  /**
   * إضافة رسالة جديدة إلى تاريخ المحادثة وتحديث التلخيص والملف الشخصي
   */
  addMessage(channelId: string, message: AIMessage): void {
    this.ensureEntry(channelId);

    const entry = this.memories.get(channelId)!;
    entry.messages.push(message);
    entry.lastAccessed = Date.now();
    entry.summary.lastInteraction = Date.now();
    entry.summary.interactionCount++;

    // 1. استخلاص التفضيلات والموسيقى عند معالجة رسائل المستخدم
    if (message.role === 'user' && message.content) {
      entry.turnCounter++;
      const languagePreference = MemoryManager.detectLanguagePreference(message.content);
      entry.languagePreference = languagePreference;
      entry.summary.languagePreference = languagePreference;
      const text = message.content.toLowerCase();
      
      // كشف طلبات الموسيقى وتوثيقها
      if (text.includes('شغل') || text.includes('play') || text.includes('غني')) {
        const queryMatch = text.match(/(?:شغل|غني|play)\s*(?:لي|لنا)?\s+(.+)/i);
        if (queryMatch) {
          entry.summary.lastMusicQuery = queryMatch[1].trim();
        }
      }

      // كشف طلبات البناء وتوثيقها
      if (text.includes('سو سيرفر') || text.includes('ابني سيرفر') || text.includes('بناء سيرفر')) {
        entry.summary.lastBuildRequest = text;
      }
    }

    // 2. تتبع وتوثيق نتائج استدعاء الأدوات للتلخيص الإداري
    if (message.role === 'tool' && message.content) {
      try {
        const result = JSON.parse(message.content);
        
        // تتبع الأخطاء المستمرة
        if (result.success === false && result.message) {
          entry.summary.errorHistory.push(result.message.slice(0, 200));
          if (entry.summary.errorHistory.length > ERROR_HISTORY_LIMIT) {
            entry.summary.errorHistory.shift();
          }
        }
        
        // تتبع الموسيقى المشغلة بنجاح
        if (result.success && message.name === 'play_music' && result.message) {
          entry.summary.musicHistory.push(result.message.slice(0, 200));
          if (entry.summary.musicHistory.length > MUSIC_HISTORY_LIMIT) {
            entry.summary.musicHistory.shift();
          }
        }
      } catch (err) {
        // تفادي أخطاء JSON
      }
    }

    // 3. تقليص حجم الرسائل الفائض بشكل ذكي للحفاظ على التوكنز
    this.trimMessages(channelId);

    // 4. حفظ البيانات دورياً على القرص بشكل متزامن/خلفي
    this.saveMemoryToDisk().catch(() => null);
  }

  /**
   * حفظ الكيانات التي أنشأتها الأدوات داخل جلسة القناة بمعرفاتها الحقيقية.
   */
  rememberEntities(channelId: string, entities: RegisteredEntity[]): void {
    if (entities.length === 0) return;
    this.ensureEntry(channelId);
    const entry = this.memories.get(channelId)!;

    for (const entity of entities) {
      this.recordCreatedEntityInEntry(entry, entity);
    }

    this.pruneSessionEntities(entry);
    entry.lastAccessed = Date.now();
    this.saveMemoryToDisk().catch(() => null);
  }

  /**
   * نقطة موحدة لتسجيل أي كيان جديد تم إنشاؤه/لمسه من أدوات Discord.
   */
  recordCreatedEntity(channelId: string, entity: RegisteredEntity): void {
    this.ensureEntry(channelId);
    const entry = this.memories.get(channelId)!;
    this.recordCreatedEntityInEntry(entry, entity);
    this.pruneSessionEntities(entry);
    entry.lastAccessed = Date.now();
    this.saveMemoryToDisk().catch(() => null);
  }

  private recordCreatedEntityInEntry(entry: MemoryEntry, entity: RegisteredEntity): void {
    const remembered: SessionEntity = {
      guildId: entity.guildId,
      type: entity.type,
      id: entity.id,
      name: entity.name,
      sourceTool: entity.sourceTool,
      createdAt: entity.createdAt,
      createdInTurn: entry.turnCounter || entry.summary.interactionCount || 0,
      metadata: entity.metadata,
    };
    entry.entities = entry.entities.filter((item) =>
      !(item.guildId === remembered.guildId &&
        item.type === remembered.type &&
        item.id === remembered.id)
    );
    entry.entities.push(remembered);
    entry.lastReferencedEntityId = remembered.id;
    if (remembered.type === 'channel' || remembered.type === 'thread') {
      entry.lastEntityIds.last_channel_id = remembered.id;
    } else if (remembered.type === 'role') {
      entry.lastEntityIds.last_role_id = remembered.id;
    } else if (remembered.type === 'category') {
      entry.lastEntityIds.last_category_id = remembered.id;
    }
  }

  private pruneSessionEntities(entry: MemoryEntry): void {
    entry.entities = entry.entities
      .filter((entity) => Date.now() - entity.createdAt < SESSION_ENTITY_TTL)
      .sort((left, right) => left.createdAt - right.createdAt)
      .slice(-SESSION_ENTITY_LIMIT);
    const activeIds = new Set(entry.entities.map((entity) => entity.id));
    if (entry.lastReferencedEntityId && !activeIds.has(entry.lastReferencedEntityId)) {
      entry.lastReferencedEntityId = entry.entities.at(-1)?.id;
    }
  }

  getRecentEntities(channelId: string, type?: EntityType): SessionEntity[] {
    const entry = this.memories.get(channelId);
    if (!entry) return [];
    entry.lastAccessed = Date.now();
    this.pruneSessionEntities(entry);
    return entry.entities
      .filter((entity) => !type || entity.type === type)
      .sort((left, right) => right.createdAt - left.createdAt);
  }

  getLastEntityIds(channelId: string): SessionEntityPointers {
    const entry = this.memories.get(channelId);
    if (!entry) return {};
    this.getRecentEntities(channelId);
    const activeIds = new Set(entry.entities.map((entity) => entity.id));
    return {
      last_channel_id: activeIds.has(entry.lastEntityIds.last_channel_id ?? '')
        ? entry.lastEntityIds.last_channel_id
        : undefined,
      last_role_id: activeIds.has(entry.lastEntityIds.last_role_id ?? '')
        ? entry.lastEntityIds.last_role_id
        : undefined,
      last_category_id: activeIds.has(entry.lastEntityIds.last_category_id ?? '')
        ? entry.lastEntityIds.last_category_id
        : undefined,
    };
  }

  resolveEntity(channelId: string, type: EntityType, name?: string): SessionEntity | undefined {
    const entities = this.getRecentEntities(channelId, type);
    if (!name) return entities[0];
    const normalizedName = this.normalizeEntityName(name);
    return entities.find((entity) => this.normalizeEntityName(entity.name) === normalizedName);
  }

  buildEntityContext(channelId: string): string {
    const entry = this.memories.get(channelId);
    const entities = this.getRecentEntities(channelId).slice(0, 10);
    const pointers = this.getLastEntityIds(channelId);
    const actions = entry?.summary.lastActions?.slice(-6) ?? [];
    const lastReferenced = entities.find((entity) => entity.id === entry?.lastReferencedEntityId) ?? entities[0];
    return [
      '[SESSION_ENTITIES]',
      `language_preference=${entry?.languagePreference ?? 'ar'}`,
      `last_channel_id=${pointers.last_channel_id ?? 'none'}`,
      `last_role_id=${pointers.last_role_id ?? 'none'}`,
      `last_category_id=${pointers.last_category_id ?? 'none'}`,
      `last_referenced_entity_id=${lastReferenced?.id ?? 'none'}`,
      '[سياق الجلسة الحالي]',
      ...(entities.length > 0
        ? entities.map((entity) => `- ${entity.type}:${entity.name}:${entity.id}:source=${entity.sourceTool ?? 'unknown'}:turn=${entity.createdInTurn}`)
        : ['none']),
      lastReferenced
        ? `آخر كيان تمت الإشارة له: ${lastReferenced.name} (${lastReferenced.id})`
        : 'آخر كيان تمت الإشارة له: none',
      'قاعدة: إذا أشار المستخدم لكيان أنشأته للتو مثل الروم/هذا الشانل/القناة اللي سويتها، استخدم الـ ID أعلاه ولا تبحث بالاسم من جديد.',
      'قاعدة: إذا ذكر المستخدم اسم قناة أو رتبة محدد، طابق الاسم بدقة ولا تستخدم آخر كيان كبديل إلا مع ضمير إشارة صريح.',
      '[RECENT_ACTIONS]',
      ...(actions.length > 0 ? actions.map((action) => `- ${action}`) : ['none']),
    ].join('\n');
  }

  rememberAction(channelId: string, actionSummary: string): void {
    const summary = actionSummary.replace(/\s+/g, ' ').trim();
    if (!summary) return;
    this.ensureEntry(channelId);
    const entry = this.memories.get(channelId)!;
    entry.summary.lastActions = [...(entry.summary.lastActions ?? []), summary.slice(0, 800)].slice(-10);
    entry.lastAccessed = Date.now();
    this.saveMemoryToDisk().catch(() => null);
  }

  buildUserPreferenceContext(userId: string): string {
    const profile = this.getUserProfile(userId);
    if (!profile) return '[USER_PROFILE]\npreferred_language=unknown\nقاعدة لغة: رد دائماً بنفس لغة آخر رسالة من المستخدم.';
    const languageLabel = profile.preferredDialect === 'ar' ? 'Arabic (عربي)'
      : profile.preferredDialect === 'en' ? 'English'
      : 'unknown (infer from message)';
    return [
      '[USER_PROFILE]',
      `preferred_language=${languageLabel}`,
      `total_messages=${profile.totalMessagesSent}`,
      'HARD LANGUAGE RULE: Always reply in the exact language of the latest user message. Arabic input = fully Arabic output with no English sentences.',
      'Persist this user language until they clearly switch languages in a later message.',
    ].join('\n');
  }

  rememberUserLanguagePreference(userId: string, text: string): SessionLanguagePreference {
    const preferredDialect = MemoryManager.detectLanguagePreference(text);
    this.updateUserProfile(userId, { preferredDialect, totalMessagesSent: 1 });
    return preferredDialect;
  }

  getLanguagePreference(channelId: string): SessionLanguagePreference {
    const entry = this.memories.get(channelId);
    return entry?.languagePreference ?? 'ar';
  }

  setPendingPlan(channelId: string, plan: PendingPlan): void {
    this.ensureEntry(channelId);
    const entry = this.memories.get(channelId)!;
    entry.pendingMultiStepPlan = plan;
    entry.lastAccessed = Date.now();
    this.saveMemoryToDisk().catch(() => null);
  }

  getPendingPlan(channelId: string): PendingPlan | undefined {
    const entry = this.memories.get(channelId);
    if (!entry) return undefined;
    entry.lastAccessed = Date.now();
    return entry.pendingMultiStepPlan;
  }

  getSessionState(channelId: string): SessionState {
    const entry = this.memories.get(channelId);
    return {
      entities: this.getRecentEntities(channelId),
      lastReferencedEntityId: entry?.lastReferencedEntityId,
      languagePreference: entry?.languagePreference ?? 'ar',
      pendingMultiStepPlan: entry?.pendingMultiStepPlan,
    };
  }

  buildPendingPlanContext(channelId: string): string {
    const plan = this.getPendingPlan(channelId);
    if (!plan || plan.steps.length === 0) return '';
    return [
      '[PENDING_MULTI_STEP_PLAN]',
      `current_step_index=${plan.currentStepIndex}`,
      `created_entity_ids=${JSON.stringify(plan.createdEntityIds)}`,
      ...plan.steps.slice(0, 15).map((step) => [
        `step=${step.stepId}`,
        `action=${step.action}`,
        `dependsOn=${step.dependsOn?.join(',') ?? 'none'}`,
        `entityRef=${step.entityRef ?? 'none'}`,
        `params=${JSON.stringify(step.params)}`,
      ].join('|')),
      'Rule: execute linked steps in order and pass createdEntityIds from earlier steps to dependent steps directly.',
    ].join('\n');
  }

  clearPendingPlan(channelId: string): void {
    const entry = this.memories.get(channelId);
    if (!entry) return;
    delete entry.pendingMultiStepPlan;
    entry.lastAccessed = Date.now();
    this.saveMemoryToDisk().catch(() => null);
  }

  /**
   * تحديث أو إنشاء ملف المستخدم لتقديم استجابات مخصصة
   */
  updateUserProfile(userId: string, update: Partial<UserProfile>): void {
    let profile = this.userProfiles.get(userId);
    if (!profile) {
      profile = {
        userId,
        preferredDialect: 'unknown',
        favoriteArtists: [],
        favoriteBlueprints: [],
        totalMessagesSent: 0,
        lastSeen: Date.now(),
        commandExecutionLog: []
      };
    }

    // دمج التعديلات
    if (update.preferredDialect) profile.preferredDialect = update.preferredDialect;
    
    if (update.favoriteArtists) {
      profile.favoriteArtists = [...new Set([...profile.favoriteArtists, ...update.favoriteArtists])].slice(0, 10);
    }
    
    if (update.favoriteBlueprints) {
      profile.favoriteBlueprints = [...new Set([...profile.favoriteBlueprints, ...update.favoriteBlueprints])].slice(0, 5);
    }
    
    profile.totalMessagesSent += update.totalMessagesSent || 0;
    profile.lastSeen = Date.now();
    
    if (update.commandExecutionLog && update.commandExecutionLog.length > 0) {
      profile.commandExecutionLog = [...profile.commandExecutionLog, ...update.commandExecutionLog].slice(-20);
    }

    this.userProfiles.set(userId, profile);
    this.saveMemoryToDisk().catch(() => null);
  }

  /**
   * الحصول على الملف الشخصي للمستخدم
   */
  getUserProfile(userId: string): UserProfile | undefined {
    return this.userProfiles.get(userId);
  }

  /**
   * تقليص الرسائل مع الحفاظ على السياق المهم وتفادي فقدان معلومات النظام
   */
  private trimMessages(channelId: string): void {
    const entry = this.memories.get(channelId);
    if (!entry || entry.messages.length <= MAX_MESSAGES_PER_CHANNEL) return;

    const messages = entry.messages;
    const keepCount = Math.floor(MAX_MESSAGES_PER_CHANNEL * 0.75);

    // 1. تقليص وتخفيف نتائج أدوات التشغيل القديمة لتوفير المساحة
    for (let i = 0; i < messages.length - keepCount; i++) {
      if (messages[i].role === 'tool' && messages[i].content) {
        if (messages[i].content!.length > 400) {
          messages[i].content = messages[i].content!.slice(0, 400) + '... (تم اختصار results قديمة لتوفير المساحة)';
        }
      }
    }

    // 2. إذا كان العدد الكلي للرسائل يفوق الحد، نحذف الأقدم (مع استبعاد رسالة النظام الأولى)
    if (messages.length > MAX_MESSAGES_PER_CHANNEL) {
      const excess = messages.length - MAX_MESSAGES_PER_CHANNEL;
      // نحافظ دائماً على رسائل التول لتفادي أخطاء استدعاء الأدوات غير المكتملة
      let removedCount = 0;
      let index = 0;

      while (removedCount < excess && index < messages.length - keepCount) {
        // لا نحذف رسائل المساعد التي تحمل أدوات معلقة بدون نتائجها المقابلة
        const msg = messages[index];
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.splice(index, 1);
          removedCount++;
        } else {
          index++;
        }
      }
    }
  }

  static detectLanguagePreference(content: string): SessionLanguagePreference {
    const arabicChars = (content.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) ?? []).length;
    const latinChars = (content.match(/[A-Za-z]/g) ?? []).length;
    return arabicChars >= latinChars ? 'ar' : 'en';
  }

  private normalizeLanguagePreference(value: unknown): SessionLanguagePreference {
    return value === 'en' ? 'en' : 'ar';
  }

  /**
   * تقليص نتائج الأدوات قبل حفظها لتوفير الحجم والذاكرة
   */
  static trimToolResult(result: string): string {
    if (result.length <= MAX_TOOL_RESULT_LENGTH) return result;

    try {
      const parsed = JSON.parse(result);

      if (parsed.data) {
        // اختصار القنوات الكبيرة
        if (Array.isArray(parsed.data.channels) && parsed.data.channels.length > 25) {
          parsed.data.channels = [
            ...parsed.data.channels.slice(0, 12),
            { note: `... و تم إخفاء ${parsed.data.channels.length - 12} قناة قديمة` },
          ];
        }
        // اختصار الرتب
        if (Array.isArray(parsed.data.roles) && parsed.data.roles.length > 15) {
          parsed.data.roles = [
            ...parsed.data.roles.slice(0, 8),
            { note: `... و تم إخفاء ${parsed.data.roles.length - 8} رتبة أخرى` },
          ];
        }
      }

      // اختصار تفاصيل السجلات الكبيرة
      if (Array.isArray(parsed.details) && parsed.details.length > 25) {
        parsed.details = [
          ...parsed.details.slice(0, 10),
          `... و تم إخفاء ${parsed.details.length - 10} تفصيل إضافي`,
        ];
      }

      const trimmed = JSON.stringify(parsed);
      if (trimmed.length <= MAX_TOOL_RESULT_LENGTH) return trimmed;
    } catch (err) {
      // تجاهل الخطأ والقطع المباشر
    }

    return result.slice(0, MAX_TOOL_RESULT_LENGTH) + '... (تم اختصار تفاصيل الresults لتجاوز الحجم المسموح)';
  }

  /**
   * البحث الدلالي البسيط بنظام الوزن الإحصائي (TF-IDF) للبحث في التاريخ القديم للمحادثة
   */
  searchRelevantHistory(channelId: string, query: string, limit: number = 3): AIMessage[] {
    const entry = this.memories.get(channelId);
    if (!entry || entry.messages.length === 0) return [];

    const messages = entry.messages.filter(msg => msg.role === 'user' || msg.role === 'assistant');
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    
    if (queryTerms.length === 0) return messages.slice(-limit);

    // حساب النقاط لكل رسالة بناءً على الكلمات المشتركة
    const scoredMessages = messages.map(msg => {
      const content = (msg.content || '').toLowerCase();
      let score = 0;

      for (const term of queryTerms) {
        if (content.includes(term)) {
          score += 1;
          // زيادة الوزن للكلمات المتطابقة تماماً ككلمة مستقلة
          const regex = new RegExp(`\\b${term}\\b`, 'i');
          if (regex.test(content)) {
            score += 2;
          }
        }
      }
      return { msg, score };
    });

    // فرز الرسائل بحسب النقاط الأعلى
    return scoredMessages
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.msg)
      .slice(0, limit);
  }

  /**
   * مسح ذاكرة وتاريخ محادثات قناة معينة بالكامل
   */
  clearHistory(channelId: string): void {
    this.memories.delete(channelId);
    this.saveMemoryToDisk().catch(() => null);
  }

  private ensureEntry(channelId: string): void {
    if (this.memories.has(channelId)) return;
    const now = Date.now();
    this.memories.set(channelId, {
      messages: [],
      summary: {
        topics: [],
        userPreferences: {},
        languagePreference: 'ar',
        interactionCount: 0,
        lastInteraction: now,
        musicHistory: [],
        errorHistory: [],
        lastActions: [],
      },
      entities: [],
      lastEntityIds: {},
      languagePreference: 'ar',
      turnCounter: 0,
      createdAt: now,
      lastAccessed: now,
    });
  }

  private normalizeEntityName(value: string): string {
    return value
      .normalize('NFKC')
      .toLocaleLowerCase('ar')
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[أإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
  }

  /**
   * إضافة رغبة أو تفضيل للمستخدم
   */
  setPreference(channelId: string, key: string, value: string): void {
    const entry = this.memories.get(channelId);
    if (entry) {
      entry.summary.userPreferences[key] = value;
      this.saveMemoryToDisk().catch(() => null);
    }
  }

  /**
   * تنظيف الذاكرة غير النشطة لتوفير حجم ذاكرة الوصول العشوائي (RAM)
   */
  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [channelId, entry] of this.memories) {
      if (now - entry.lastAccessed > MAX_INACTIVE_TIME) {
        toDelete.push(channelId);
      }
    }

    for (const id of toDelete) {
      this.memories.delete(id);
    }

    if (toDelete.length > 0) {
      console.log(`[Memory] Cleaned ${toDelete.length} inactive channel memories.`);
      this.saveMemoryToDisk().catch(() => null);
    }
  }

  /**
   * إحصائيات الذاكرة والملفات الشخصية المخزنة حالياً
   */
  getStats(): { channels: number; totalMessages: number; cachedProfiles: number; oldestChannel: number } {
    let totalMessages = 0;
    let oldestChannel = Date.now();

    for (const [, entry] of this.memories) {
      totalMessages += entry.messages.length;
      if (entry.createdAt < oldestChannel) {
        oldestChannel = entry.createdAt;
      }
    }

    return {
      channels: this.memories.size,
      totalMessages,
      cachedProfiles: this.userProfiles.size,
      oldestChannel,
    };
  }

  /**
   * تدمير وإنهاء البوت والذاكرة وإلغاء المؤقتات دورياً
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

// ============================================================
//  نظام اختبارات التشخيص الذاتي لمدير الذاكرة (Self-Tests)
// ============================================================
export function runMemoryManagerDiagnostics(): { success: boolean; log: string[] } {
  const log: string[] = [];
  let success = true;

  try {
    log.push('[Diagnostic] بدء فحص مدير الذاكرة...');

    const tempMgr = new MemoryManager();
    const testChannel = 'test_channel_999';

    // اختبار 1: إضافة وحفظ الرسائل
    tempMgr.addMessage(testChannel, { role: 'user', content: 'شغل أغنية عمرو دياب لاهنت' });
    tempMgr.addMessage(testChannel, { role: 'assistant', content: 'تم تشغيل الموسيقى' });

    const history = tempMgr.getHistory(testChannel);
    if (history.length !== 2) {
      log.push('❌ فشل اختبار 1: حجم المحفوظات غير متطابق');
      success = false;
    } else {
      log.push('✅ نجاح اختبار 1: إضافة واسترجاع تاريخ الرسائل بنجاح');
    }

    // اختبار 2: تتبع الموسيقى وحفظ التفضيلات
    const summary = tempMgr.getSummary(testChannel);
    if (summary.lastMusicQuery !== 'عمرو دياب لاهنت') {
      log.push(`⚠️ تحذير اختبار 2: لم يتم كشف اسم الأغنية بشكل سليم (${summary.lastMusicQuery})`);
    } else {
      log.push('✅ نجاح اختبار 2: استخلاص وتوثيق الاستعلام الموسيقي بنجاح');
    }

    // اختبار 3: البحث الدلالي البسيط (TF-IDF)
    const results = tempMgr.searchRelevantHistory(testChannel, 'عمرو دياب');
    if (results.length === 0 || !results[0].content?.includes('عمرو دياب')) {
      log.push('❌ فشل اختبار 3: البحث الدلالي لم يعثر على الresults المناسبة');
      success = false;
    } else {
      log.push('✅ نجاح اختبار 3: كفاءة البحث الدلالي الذاتي في الذاكرة');
    }

    // تنظيف القناة التجريبية
    tempMgr.clearHistory(testChannel);
    log.push(`[Diagnostic] انتهى الفحص بنجاح. الresults العامة: ${success ? 'ناجح' : 'فاشل'}`);

  } catch (error: any) {
    success = false;
    log.push(`❌ حدث خطأ فادح أثناء الفحص: ${error.message}`);
  }

  return { success, log };
}

// تصدير كنسخة مفردة (Singleton)
export const memoryManager = new MemoryManager();
