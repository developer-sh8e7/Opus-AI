import { ChannelType, Guild } from 'discord.js';
import { EntityRegistry } from '../intelligence/entity_registry.js';

export interface ExplicitToolTargets {
  channelIds: string[];
  categoryIds: string[];
  roleIds: string[];
  everyoneRoleId: string;
}

interface NamedEntity {
  id: string;
  name: string;
}

function normalizeWords(value: string): string[] {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('ar')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.startsWith('ال') && word.length > 4 ? word.slice(2) : word);
}

function findNamedMatches(rawText: string, entities: NamedEntity[]): string[] {
  const textWords = new Set(normalizeWords(rawText));
  return entities
    .filter((entity) => {
      const entityWords = normalizeWords(entity.name).filter((word) => word.length >= 3);
      return entityWords.length > 0 && entityWords.every((word) => textWords.has(word));
    })
    .map((entity) => entity.id);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function resolveExplicitToolTargets(guild: Guild, rawText: string): ExplicitToolTargets {
  const mentionedIds = [...rawText.matchAll(/<#(\d+)>/g)].map((match) => match[1]);
  const mentionedChannelIds = mentionedIds.filter((id) =>
    guild.channels.cache.get(id)?.type !== ChannelType.GuildCategory
  );
  const mentionedCategoryIds = mentionedIds.filter((id) =>
    guild.channels.cache.get(id)?.type === ChannelType.GuildCategory
  );
  const mentionedRoleIds = [...rawText.matchAll(/<@&(\d+)>/g)].map((match) => match[1]);

  const namedChannels = guild.channels.cache
    .filter((channel) => channel.type !== ChannelType.GuildCategory)
    .map((channel) => ({ id: channel.id, name: channel.name }));
  const namedCategories = guild.channels.cache
    .filter((channel) => channel.type === ChannelType.GuildCategory)
    .map((channel) => ({ id: channel.id, name: channel.name }));
  const namedRoles = guild.roles.cache
    .filter((role) => role.id !== guild.id)
    .map((role) => ({ id: role.id, name: role.name }));

  const channelIds = unique([...mentionedChannelIds, ...findNamedMatches(rawText, namedChannels)]);
  const categoryIds = unique([...mentionedCategoryIds, ...findNamedMatches(rawText, namedCategories)]);

  if (channelIds.length === 0 && /(?:الروم|القناة|الشانل|the\s+(?:room|channel))/i.test(rawText)) {
    const latestChannel = EntityRegistry.getLatest(guild.id, 'channel');
    if (latestChannel) channelIds.push(latestChannel.id);
  }
  if (categoryIds.length === 0 && /(?:فيها|الكاتقوري|الفئة|the\s+category)/i.test(rawText)) {
    const latestCategory = EntityRegistry.getLatest(guild.id, 'category');
    if (latestCategory) categoryIds.push(latestCategory.id);
  }

  return {
    channelIds,
    categoryIds,
    roleIds: unique([...mentionedRoleIds, ...findNamedMatches(rawText, namedRoles)]),
    everyoneRoleId: guild.id,
  };
}

export function applyExplicitTargets(
  toolName: string,
  args: Record<string, any>,
  targets: ExplicitToolTargets
): { args: Record<string, any>; error?: string } {
  const resolvedArgs = { ...args };

  if (toolName === 'edit_permissions' || toolName === 'bulk_delete_messages') {
    if (targets.channelIds.length > 1) {
      return { args: resolvedArgs, error: 'لقيت أكثر من روم مطابق. منشن الروم المطلوب بشكل مباشر.' };
    }
    if (targets.channelIds.length === 1) resolvedArgs.channelId = targets.channelIds[0];
  }

  if (toolName === 'edit_permissions') {
    if (targets.roleIds.length > 1) {
      return { args: resolvedArgs, error: 'لقيت أكثر من رتبة مطابقة. منشن الرتبة المطلوبة بشكل مباشر.' };
    }
    if (targets.roleIds.length === 1) {
      const targetsEveryone = resolvedArgs.targetId === '@everyone' ||
        resolvedArgs.targetId === targets.everyoneRoleId;
      if (!targetsEveryone) resolvedArgs.targetId = targets.roleIds[0];
      resolvedArgs.targetType = 'role';
    }
  }

  if (toolName === 'delete_channels' && targets.channelIds.length > 0) {
    resolvedArgs.channelIds = targets.channelIds;
  }
  if (toolName === 'create_channels' && !resolvedArgs.categoryId && targets.categoryIds.length === 1) {
    resolvedArgs.categoryId = targets.categoryIds[0];
  }
  if (toolName === 'bulk_permission_update') {
    if (!resolvedArgs.categoryId && targets.categoryIds.length === 1) {
      resolvedArgs.categoryId = targets.categoryIds[0];
    }
    if (!resolvedArgs.channelIds && targets.channelIds.length > 0) {
      resolvedArgs.channelIds = targets.channelIds;
    }
  }

  return { args: resolvedArgs };
}

export function buildExplicitTargetsContext(
  guild: Guild,
  targets: ExplicitToolTargets
): string | undefined {
  const channelTargets = targets.channelIds
    .map((id) => guild.channels.cache.get(id))
    .filter(Boolean)
    .map((channel) => `${channel!.name}:${channel!.id}`);
  const categoryTargets = targets.categoryIds
    .map((id) => guild.channels.cache.get(id))
    .filter(Boolean)
    .map((category) => `${category!.name}:${category!.id}`);
  const roleTargets = targets.roleIds
    .map((id) => guild.roles.cache.get(id))
    .filter(Boolean)
    .map((role) => `${role!.name}:${role!.id}`);

  if (channelTargets.length === 0 && categoryTargets.length === 0 && roleTargets.length === 0) {
    return undefined;
  }
  return `[RESOLVED_TARGETS|CHANNELS:${channelTargets.join(',') || 'none'}|CATEGORIES:${categoryTargets.join(',') || 'none'}|ROLES:${roleTargets.join(',') || 'none'}]`;
}
