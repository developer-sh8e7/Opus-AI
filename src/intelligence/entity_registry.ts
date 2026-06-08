import fs from 'node:fs';
import path from 'node:path';
import { ChannelType, Guild } from 'discord.js';

export type EntityType = 'channel' | 'role' | 'user' | 'category' | 'thread' | 'webhook';

export interface RegisteredEntity {
  guildId: string;
  type: EntityType;
  id: string;
  name: string;
  createdAt: number;
  sourceTool?: string;
  ttl?: number;
  metadata?: Record<string, unknown>;
}

const ENTITY_TTL_MS = 15 * 60 * 1000;
const MAX_ENTITIES_PER_GUILD = 100;
const ENTITY_CACHE_PATH = path.join(process.cwd(), 'data', 'entity_cache.json');

export class EntityRegistry {
  private static entities = new Map<string, RegisteredEntity[]>();
  private static loaded = false;
  private static saveTimer: ReturnType<typeof setTimeout> | undefined;

  static initialize(): void {
    if (this.loaded) return;
    this.loaded = true;
    try {
      if (!fs.existsSync(ENTITY_CACHE_PATH)) return;
      const parsed = JSON.parse(fs.readFileSync(ENTITY_CACHE_PATH, 'utf8'));
      if (!Array.isArray(parsed)) return;
      for (const entity of parsed) {
        if (!entity?.guildId || !entity?.id || !entity?.type) continue;
        const current = this.entities.get(entity.guildId) ?? [];
        current.push(entity);
        this.entities.set(entity.guildId, current);
      }
      this.cleanup();
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
    this.scheduleSave();
    return registered;
  }

  static getRecent(guildId: string, type?: EntityType): RegisteredEntity[] {
    this.initialize();
    this.cleanup();
    return (this.entities.get(guildId) ?? [])
      .filter((entity) => !type || entity.type === type)
      .sort((left, right) => right.createdAt - left.createdAt);
  }

  static getLatest(guildId: string, type?: EntityType): RegisteredEntity | undefined {
    return this.getRecent(guildId, type)[0];
  }

  static findByName(guildId: string, type: EntityType, name: string): RegisteredEntity | undefined {
    const normalized = this.normalize(name);
    return this.getRecent(guildId, type).find((entity) => this.normalize(entity.name) === normalized);
  }

  static resolveById(guildId: string, id: string): RegisteredEntity | undefined {
    return this.getRecent(guildId).find((entity) => entity.id === id);
  }

  static resolveLastCreated(guildId: string, type?: EntityType): RegisteredEntity | undefined {
    return this.getLatest(guildId, type);
  }

  static injectIntoPrompt(guildId: string): string {
    const recent = this.getRecent(guildId).slice(0, 12);
    if (recent.length === 0) return '[RECENT_ENTITIES]\nnone';

    return [
      '[RECENT_ENTITIES]',
      ...recent.map((entity) =>
        `${entity.type}:${entity.name}:${entity.id}:source=${entity.sourceTool ?? 'unknown'}`
      ),
    ].join('\n');
  }

  static registerToolResult(
    guild: Guild,
    toolName: string,
    args: Record<string, any>,
    result: Record<string, any>
  ): RegisteredEntity[] {
    if (!result?.success) return [];
    const registered: RegisteredEntity[] = [];

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
        registered.push(this.register({
          guildId: guild.id,
          type,
          id: channel.id,
          name: channel.name,
          sourceTool: toolName,
          metadata: { channelType: args.type, categoryId: channel.parentId },
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
        sourceTool: toolName,
      }));
    }

    if (toolName === 'edit_permissions' && args.channelId) {
      const channel = guild.channels.cache.get(args.channelId);
      if (channel) {
        registered.push(this.register({
          guildId: guild.id,
          type: channel.type === ChannelType.GuildCategory ? 'category' : 'channel',
          id: channel.id,
          name: channel.name,
          sourceTool: toolName,
          metadata: { targetId: args.targetId, targetType: args.targetType },
        }));
      }
    }

    if (toolName === 'bulk_permission_update' && Array.isArray(result.updated)) {
      for (const channelId of result.updated) {
        const channel = guild.channels.cache.get(channelId);
        if (!channel) continue;
        registered.push(this.register({
          guildId: guild.id,
          type: channel.type === ChannelType.GuildCategory ? 'category' : 'channel',
          id: channel.id,
          name: channel.name,
          sourceTool: toolName,
          metadata: { targetId: args.targetId, targetType: args.targetType },
        }));
      }
    }

    if (toolName === 'manage_members' && args.memberId) {
      const member = guild.members.cache.get(args.memberId);
      registered.push(this.register({
        guildId: guild.id,
        type: 'user',
        id: args.memberId,
        name: member?.displayName ?? args.memberId,
        sourceTool: toolName,
        metadata: { action: args.action },
      }));
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

  static clearGuild(guildId: string): void {
    this.entities.delete(guildId);
    this.scheduleSave();
  }

  private static normalize(value: string): string {
    return value.normalize('NFKC').toLocaleLowerCase('ar').replace(/[\u064B-\u065F\u0670\u0640]/g, '').trim();
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
