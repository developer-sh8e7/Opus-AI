import fs from 'node:fs';
import path from 'node:path';
import { ChannelType, Guild } from 'discord.js';

export type EntityType =
  | 'channel'
  | 'role'
  | 'user'
  | 'category'
  | 'thread'
  | 'webhook'
  | 'emoji'
  | 'sticker'
  | 'invite'
  | 'scheduled_event'
  | 'auto_mod_rule';

export interface RegisteredEntity {
  guildId: string;
  type: EntityType;
  id: string;
  name: string;
  createdAt: number;
  sourceTool?: string;
  ttl?: number;
  metadata?: Record<string, unknown>;
  conversationChannelId?: string;
  modifiedAt?: number;
  /** 'deleted' marks a tombstone — entity no longer exists on Discord */
  status?: 'active' | 'deleted';
}

const ENTITY_TTL_MS = 15 * 60 * 1000;
const MAX_ENTITIES_PER_GUILD = 100;
const ENTITY_CACHE_PATH = path.join(process.cwd(), 'data', 'entity_cache.json');

export class EntityRegistry {
  private static entities = new Map<string, RegisteredEntity[]>();
  private static lastCreated = new Map<string, Map<EntityType, RegisteredEntity>>();
  private static loaded = false;
  private static saveTimer: ReturnType<typeof setTimeout> | undefined;

  static initialize(): void {
    if (this.loaded) return;
    this.loaded = true;
    try {
      if (!fs.existsSync(ENTITY_CACHE_PATH)) {
        console.log('[EntityRegistry] Loaded 0 cached entities.');
        return;
      }
      const parsed = JSON.parse(fs.readFileSync(ENTITY_CACHE_PATH, 'utf8'));
      if (!Array.isArray(parsed)) return;
      for (const entity of parsed) {
        if (!entity?.guildId || !entity?.id || !entity?.type) continue;
        const current = this.entities.get(entity.guildId) ?? [];
        current.push(entity);
        this.entities.set(entity.guildId, current);
      }
      this.cleanup();
      console.log(`[EntityRegistry] Loaded ${[...this.entities.values()].flat().length} cached entities.`);
    } catch (error) {
      console.error('[EntityRegistry] Failed to restore cache:', error);
    }
  }

  static register(entity: Omit<RegisteredEntity, 'createdAt'> & { createdAt?: number }): RegisteredEntity {
    this.initialize();
    this.cleanup();
    const registered: RegisteredEntity = {
      ...entity,
      createdAt: entity.createdAt ?? Date.now(),
    };
    const current = this.entities.get(entity.guildId) ?? [];
    const withoutDuplicate = current.filter((item) =>
      !(item.type === entity.type && item.id === entity.id)
    );
    withoutDuplicate.push(registered);
    this.entities.set(entity.guildId, withoutDuplicate.slice(-MAX_ENTITIES_PER_GUILD));

    // Track last created per type per guild
    const guildMap = this.lastCreated.get(entity.guildId) ?? new Map();
    guildMap.set(entity.type, registered);
    this.lastCreated.set(entity.guildId, guildMap);

    this.scheduleSave();
    return registered;
  }

  static getRecent(
    guildId: string,
    type?: EntityType,
    conversationChannelId?: string
  ): RegisteredEntity[] {
    this.initialize();
    this.cleanup();
    return (this.entities.get(guildId) ?? [])
      .filter((entity) => entity.status !== 'deleted')
      .filter((entity) => !type || entity.type === type)
      .sort((left, right) => {
        if (conversationChannelId) {
          const leftSameConversation = left.conversationChannelId === conversationChannelId ? 1 : 0;
          const rightSameConversation = right.conversationChannelId === conversationChannelId ? 1 : 0;
          if (leftSameConversation !== rightSameConversation) {
            return rightSameConversation - leftSameConversation;
          }
        }
        return right.createdAt - left.createdAt;
      });
  }

  static getLatest(
    guildId: string,
    type?: EntityType,
    conversationChannelId?: string
  ): RegisteredEntity | undefined {
    return this.getRecent(guildId, type, conversationChannelId)[0];
  }

  static findByName(guildId: string, type: EntityType, name: string): RegisteredEntity | undefined {
    const stripped = this.stripPrefix(name);
    const normalized = this.normalize(stripped);

    // 1. Exact match (after normalization)
    const exact = this.getRecent(guildId, type).find((entity) => this.normalize(entity.name) === normalized);
    if (exact) return exact;

    // 2. Partial match — query contains entity name or vice versa
    const partial = this.getRecent(guildId, type).find((entity) => {
      const entityNorm = this.normalize(entity.name);
      return entityNorm.includes(normalized) || normalized.includes(entityNorm);
    });
    return partial;
  }

  /**
   * Strip common Arabic prefixes that users prepend to entity names.
   * "روم الو" -> "الو", "قناة الترحيب" -> "الترحيب"
   */
  private static stripPrefix(name: string): string {
    return name.replace(/^(روم|قناة|شانل|رتبة|رول|كاتقوري|فئة|شات|فويس|تيكست)\s+/i, '').trim() || name;
  }

  static resolveById(guildId: string, id: string): RegisteredEntity | undefined {
    return this.getRecent(guildId).find((entity) => entity.id === id);
  }

  static resolveLastCreated(
    guildId: string,
    type?: EntityType,
    conversationChannelId?: string
  ): RegisteredEntity | undefined {
    return this.getLatest(guildId, type, conversationChannelId);
  }

  static injectIntoPrompt(guildId: string, conversationChannelId?: string): string {
    const recent = this.getRecent(guildId, undefined, conversationChannelId).slice(0, 12);
    if (recent.length === 0) return '[RECENT_ENTITIES]\nnone';

    const lines: string[] = ['[RECENT_ENTITIES]'];

    // Highlight the last created entity per type
    const guildLast = this.lastCreated.get(guildId);
    if (guildLast) {
      for (const [type, entity] of guildLast) {
        lines.push(`last_created=${type}:${entity.name}:${entity.id}:source=${entity.sourceTool ?? 'unknown'}`);
      }
    }

    // All recent entities
    for (const entity of recent) {
      lines.push(
        `${entity.type}:${entity.name}:${entity.id}:source=${entity.sourceTool ?? 'unknown'}:session=${
          entity.conversationChannelId === conversationChannelId ? 'current' : 'other'
        }`
      );
    }

    // Reference guide for implicit references
    lines.push('---');
    lines.push('REFERENCE_GUIDE:');
    lines.push('- "الروم" / "القناة" / "الشانل" / ".room" → last_created channel above');
    lines.push('- "الرتبة" / "الرول" / ".role" → last_created role above');
    lines.push('- "الكاتقوري" / "الفئة" / ".category" → last_created category above');
    lines.push('- "الفويس" / "التيكست" → last_created channel of matching type above');
    lines.push('- Use the EXACT ID from the last_created entry, never guess');
    lines.push('- If user says "هذا الشانل" / "this channel" / ".this" → current_channel ID');

    return lines.join('\n');
  }

  static registerToolResult(
    guild: Guild,
    toolName: string,
    args: Record<string, any>,
    result: Record<string, any>,
    conversationChannelId?: string
  ): RegisteredEntity[] {
    if (!result?.success) return [];
    const registered: RegisteredEntity[] = [];
    const payload = result.data && typeof result.data === 'object'
      ? result.data as Record<string, any>
      : result;
    const sourceTool = args.action ? `${toolName}:${args.action}` : toolName;

    if (toolName === 'create_channels') {
      const createdEntities = Array.isArray(result.createdEntities) ? result.createdEntities : [];
      const names = Array.isArray(result.created) ? result.created : [];
      const candidates = createdEntities.length > 0
        ? createdEntities
        : names.map((name: string) => ({ name }));

      for (const candidate of candidates) {
        const channel = candidate.id
          ? guild.channels.cache.get(candidate.id)
          : guild.channels.cache.find((item) => item.name === candidate.name);
        if (!channel) continue;
        const type: EntityType = channel.type === ChannelType.GuildCategory ? 'category' : 'channel';
        const parentCategory = channel.parentId
          ? guild.channels.cache.get(channel.parentId)
          : undefined;
        registered.push(this.register({
          guildId: guild.id,
          type,
          id: channel.id,
          name: channel.name,
          sourceTool,
          conversationChannelId,
          metadata: {
            channelType: args.type,
            categoryId: channel.parentId,
            categoryName: parentCategory?.name ?? null,
            guildName: guild.name,
          },
        }));
      }
    }

    if (toolName === 'manage_roles' && result.roleId) {
      const role = guild.roles.cache.get(result.roleId);
      registered.push(this.register({
        guildId: guild.id,
        type: 'role',
        id: result.roleId,
        name: role?.name ?? args.roleData?.name ?? result.roleId,
        sourceTool,
        conversationChannelId,
        metadata: {
          color: role?.hexColor ?? args.roleData?.color ?? null,
          hoisted: role?.hoist ?? false,
          mentionable: role?.mentionable ?? false,
          guildName: guild.name,
        },
      }));
    }

    if (toolName === 'edit_permissions' && args.channelId) {
      const channel = guild.channels.cache.get(args.channelId);
      if (channel) {
        const parentCategory = channel.parentId
          ? guild.channels.cache.get(channel.parentId)
          : undefined;
        registered.push(this.register({
          guildId: guild.id,
          type: channel.type === ChannelType.GuildCategory ? 'category' : 'channel',
          id: channel.id,
          name: channel.name,
          sourceTool,
          conversationChannelId,
          metadata: {
            targetId: args.targetId,
            targetType: args.targetType,
            categoryName: parentCategory?.name ?? null,
          },
        }));
      }
    }

    if (toolName === 'bulk_permission_update' && Array.isArray(result.updated)) {
      for (const channelId of result.updated) {
        const channel = guild.channels.cache.get(channelId);
        if (!channel) continue;
        const parentCategory = channel.parentId
          ? guild.channels.cache.get(channel.parentId)
          : undefined;
        registered.push(this.register({
          guildId: guild.id,
          type: channel.type === ChannelType.GuildCategory ? 'category' : 'channel',
          id: channel.id,
          name: channel.name,
          sourceTool,
          conversationChannelId,
          metadata: {
            targetId: args.targetId,
            targetType: args.targetType,
            categoryName: parentCategory?.name ?? null,
          },
        }));
      }
    }

    if (toolName === 'delete_channels') {
      const deletedIds = Array.isArray(args.channelIds) ? args.channelIds : [];
      for (const channelId of deletedIds) {
        this.markTombstone(guild.id, 'channel', channelId);
        this.markTombstone(guild.id, 'category', channelId);
      }
    }

    if (toolName === 'manage_roles' && args.action === 'delete') {
      const deletedRoleId = result.roleId ?? args.roleData?.roleId;
      if (deletedRoleId) this.markTombstone(guild.id, 'role', String(deletedRoleId));
    }

    if (toolName === 'manage_members' && args.memberId) {
      const member = guild.members.cache.get(args.memberId);
      registered.push(this.register({
        guildId: guild.id,
        type: 'user',
        id: args.memberId,
        name: member?.displayName ?? args.memberId,
        sourceTool,
        conversationChannelId,
        metadata: { action: args.action },
      }));
    }

    if (toolName === 'channel_operations' && args.action === 'channel_clone' && payload.id) {
      const channel = guild.channels.cache.get(payload.id);
      registered.push(this.register({
        guildId: guild.id,
        type: channel?.type === ChannelType.GuildCategory ? 'category' : 'channel',
        id: payload.id,
        name: payload.name ?? channel?.name ?? payload.id,
        sourceTool,
        conversationChannelId,
        metadata: { parentId: payload.parentId ?? channel?.parentId },
      }));
    }

    if (toolName === 'thread_operations' && args.action === 'thread_create' && payload.id) {
      registered.push(this.register({
        guildId: guild.id,
        type: 'thread',
        id: payload.id,
        name: payload.name ?? args.name ?? payload.id,
        sourceTool,
        conversationChannelId,
        metadata: { parentId: args.channelId },
      }));
    }

    if (toolName === 'webhook_operations' && args.action === 'webhook_create' && payload.id) {
      registered.push(this.register({
        guildId: guild.id,
        type: 'webhook',
        id: payload.id,
        name: payload.name ?? args.name ?? payload.id,
        sourceTool,
        conversationChannelId,
        metadata: { channelId: args.channelId },
      }));
    }

    if (toolName === 'role_operations' && args.action === 'role_clone' && payload.roleId) {
      const role = guild.roles.cache.get(payload.roleId);
      registered.push(this.register({
        guildId: guild.id,
        type: 'role',
        id: payload.roleId,
        name: role?.name ?? args.name ?? payload.roleId,
        sourceTool,
        conversationChannelId,
      }));
    }

    const genericChannelId = payload.channelId ?? payload.threadId;
    const genericChannel = genericChannelId
      ? guild.channels.cache.get(String(genericChannelId))
      : undefined;
    if (
      genericChannel &&
      !registered.some((entity) => entity.id === genericChannel.id)
    ) {
      const parentCategory = genericChannel.parentId
        ? guild.channels.cache.get(genericChannel.parentId)
        : undefined;
      registered.push(this.register({
        guildId: guild.id,
        type: genericChannel.isThread()
          ? 'thread'
          : genericChannel.type === ChannelType.GuildCategory
            ? 'category'
            : 'channel',
        id: genericChannel.id,
        name: payload.name ?? genericChannel.name,
        sourceTool,
        conversationChannelId,
        metadata: {
          parentId: genericChannel.parentId,
          categoryName: parentCategory?.name ?? null,
        },
      }));
    }

    const genericRoleId = payload.roleId ? String(payload.roleId) : undefined;
    const genericRole = genericRoleId ? guild.roles.cache.get(genericRoleId) : undefined;
    if (
      genericRole &&
      !registered.some((entity) => entity.id === genericRole.id)
    ) {
      registered.push(this.register({
        guildId: guild.id,
        type: 'role',
        id: genericRole.id,
        name: payload.name ?? genericRole.name,
        sourceTool,
        conversationChannelId,
      }));
    }

    // Generic createdEntities support for composite builders (build_custom_server / execute_community_build)
    const genericCreatedEntities = Array.isArray(result.createdEntities) ? result.createdEntities : [];
    for (const candidate of genericCreatedEntities) {
      if (!candidate?.id || registered.some((entity) => entity.id === candidate.id)) continue;
      const rawType = String(candidate.type ?? 'channel');
      if (rawType === 'role') {
        const role = guild.roles.cache.get(candidate.id);
        registered.push(this.register({
          guildId: guild.id,
          type: 'role',
          id: candidate.id,
          name: role?.name ?? candidate.name ?? candidate.id,
          sourceTool,
          conversationChannelId,
          metadata: { guildName: guild.name },
        }));
        continue;
      }

      const channel = guild.channels.cache.get(candidate.id);
      if (channel) {
        const parentCategory = channel.parentId
          ? guild.channels.cache.get(channel.parentId)
          : undefined;
        registered.push(this.register({
          guildId: guild.id,
          type: channel.type === ChannelType.GuildCategory || rawType === 'category' ? 'category' : 'channel',
          id: channel.id,
          name: channel.name,
          sourceTool,
          conversationChannelId,
          metadata: {
            channelType: candidate.channelType ?? rawType,
            categoryId: channel.parentId,
            categoryName: parentCategory?.name ?? null,
            guildName: guild.name,
          },
        }));
      }
    }

    return registered;
  }

  static cleanup(now = Date.now()): number {
    let removed = 0;
    for (const [guildId, entities] of this.entities) {
      const active = entities.filter((entity) => now - entity.createdAt < (entity.ttl ?? ENTITY_TTL_MS));
      removed += entities.length - active.length;
      if (active.length === 0) this.entities.delete(guildId);
      else this.entities.set(guildId, active);
    }
    if (removed > 0) this.scheduleSave();
    return removed;
  }

  /** Mark an entity as deleted (tombstone). Returns true if found and marked. */
  static markTombstone(guildId: string, type: EntityType, id: string): boolean {
    this.initialize();
    const entities = this.entities.get(guildId);
    if (!entities) return false;
    const entity = entities.find((e) => e.type === type && e.id === id);
    if (!entity) return false;
    entity.status = 'deleted';
    entity.modifiedAt = Date.now();
    this.scheduleSave();
    return true;
  }

  /** Check if an entity is tombstoned (deleted). */
  static isTombstone(guildId: string, type: EntityType, id: string): boolean {
    this.initialize();
    const entities = this.entities.get(guildId);
    if (!entities) return false;
    return entities.some((e) => e.type === type && e.id === id && e.status === 'deleted');
  }

  static clearGuild(guildId: string): void {
    this.entities.delete(guildId);
    this.scheduleSave();
  }

  private static normalize(value: string): string {
    return value
      .normalize('NFKC')
      .toLocaleLowerCase('ar')
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[^\p{L}\p{N}\s]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private static scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveTimer = undefined;
      this.saveToDisk();
    }, 100);
    this.saveTimer.unref();
  }

  private static saveToDisk(): void {
    try {
      fs.mkdirSync(path.dirname(ENTITY_CACHE_PATH), { recursive: true });
      const entities = [...this.entities.values()].flat();
      fs.writeFileSync(ENTITY_CACHE_PATH, JSON.stringify(entities, null, 2), 'utf8');
    } catch (error) {
      console.error('[EntityRegistry] Failed to persist cache:', error);
    }
  }
}
