import { ChannelType, Guild } from 'discord.js';
import { EntityRegistry } from '../intelligence/entity_registry.js';

export interface ExplicitToolTargets {
  channelIds: string[];
  categoryIds: string[];
  roleIds: string[];
  excludedChannelIds: string[];
  bulkDeleteChannelIds: string[];
  everyoneRoleId: string;
}

interface NamedEntity {
  id: string;
  name: string;
}

interface RecentSessionEntity extends NamedEntity {
  type: 'channel' | 'role' | 'user' | 'category' | 'thread' | 'webhook';
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

function normalizeText(value: string): string {
  return normalizeWords(value).join(' ');
}

function findExcludedChannelIds(rawText: string, entities: NamedEntity[]): string[] {
  const normalizedText = normalizeText(rawText);
  return entities
    .filter((entity) => {
      const normalizedName = normalizeText(entity.name);
      if (!normalizedName) return false;

      let matchIndex = normalizedText.indexOf(normalizedName);
      while (matchIndex >= 0) {
        const precedingText = normalizedText.slice(Math.max(0, matchIndex - 70), matchIndex);
        if (/(?:الا|ما عدا|باستثناء|سوى|و?(?:خلي|خله|اترك|ابق|ابقي|تبقي)|احتفظ ب|keep|except|excluding|preserve)(?:\s+\S+){0,3}\s*$/i.test(precedingText)) {
          return true;
        }
        matchIndex = normalizedText.indexOf(normalizedName, matchIndex + normalizedName.length);
      }
      return false;
    })
    .map((entity) => entity.id);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function resolveExplicitToolTargets(
  guild: Guild,
  rawText: string,
  sessionEntities: RecentSessionEntity[] = []
): ExplicitToolTargets {
  const mentionedIds = [...rawText.matchAll(/<#(\d+)>/g)].map((match) => match[1]);
  const rawSnowflakeIds = [...rawText.matchAll(/\b(\d{17,20})\b/g)].map((match) => match[1]);
  const mentionedChannelIds = mentionedIds.filter((id) =>
    guild.channels.cache.get(id)?.type !== ChannelType.GuildCategory
  );
  const mentionedCategoryIds = mentionedIds.filter((id) =>
    guild.channels.cache.get(id)?.type === ChannelType.GuildCategory
  );
  const mentionedRoleIds = [...rawText.matchAll(/<@&(\d+)>/g)].map((match) => match[1]);

  const namedChannels = [
    ...guild.channels.cache
    .filter((channel) => channel.type !== ChannelType.GuildCategory)
    .map((channel) => ({ id: channel.id, name: channel.name })),
    ...sessionEntities
      .filter((entity) => entity.type === 'channel' || entity.type === 'thread')
      .map(({ id, name }) => ({ id, name })),
  ];
  const namedCategories = [
    ...guild.channels.cache
    .filter((channel) => channel.type === ChannelType.GuildCategory)
    .map((channel) => ({ id: channel.id, name: channel.name })),
    ...sessionEntities
      .filter((entity) => entity.type === 'category')
      .map(({ id, name }) => ({ id, name })),
  ];
  const namedRoles = [
    ...guild.roles.cache
    .filter((role) => role.id !== guild.id)
    .map((role) => ({ id: role.id, name: role.name })),
    ...sessionEntities
      .filter((entity) => entity.type === 'role')
      .map(({ id, name }) => ({ id, name })),
  ];

  const rawChannelIds = rawSnowflakeIds.filter((id) => {
    const channel = guild.channels.cache.get(id);
    return channel && channel.type !== ChannelType.GuildCategory;
  });
  const rawCategoryIds = rawSnowflakeIds.filter((id) =>
    guild.channels.cache.get(id)?.type === ChannelType.GuildCategory
  );
  const channelIds = unique([
    ...mentionedChannelIds,
    ...rawChannelIds,
    ...findNamedMatches(rawText, namedChannels),
  ]);
  const categoryIds = unique([
    ...mentionedCategoryIds,
    ...rawCategoryIds,
    ...findNamedMatches(rawText, namedCategories),
  ]);
  const excludedChannelIds = unique(findExcludedChannelIds(rawText, namedChannels));
  const requestsBulkChannelDeletion =
    /(?:احذف|تحذف|حذف|امسح|تمسح|ازل|تزيل|شيل|تشيل|delete|remove).*(?:كل|جميع|all).*(?:الرومات|رومات|القنوات|قنوات|الرومز|رومز|channels|rooms)/i.test(
      normalizeText(rawText)
    );
  const bulkDeleteChannelIds = requestsBulkChannelDeletion && excludedChannelIds.length > 0
    ? guild.channels.cache
      .filter((channel) => !excludedChannelIds.includes(channel.id))
      .map((channel) => channel.id)
    : [];

  if (channelIds.length === 0 && /(?:الروم|القناة|الشانل|the\s+(?:room|channel))/i.test(rawText)) {
    const latestChannel = sessionEntities.find((entity) =>
      entity.type === 'channel' || entity.type === 'thread'
    ) ?? EntityRegistry.getLatest(guild.id, 'channel');
    if (latestChannel) channelIds.push(latestChannel.id);
  }
  if (categoryIds.length === 0 && /(?:فيها|الكاتقوري|الفئة|the\s+category)/i.test(rawText)) {
    const latestCategory = sessionEntities.find((entity) =>
      entity.type === 'category'
    ) ?? EntityRegistry.getLatest(guild.id, 'category');
    if (latestCategory) categoryIds.push(latestCategory.id);
  }
  const roleIds = unique([...mentionedRoleIds, ...findNamedMatches(rawText, namedRoles)]);
  if (roleIds.length === 0 && /(?:الرتبة|الرول|هالرتبة|هالرول|the\s+role)/i.test(rawText)) {
    const latestRole = sessionEntities.find((entity) =>
      entity.type === 'role'
    ) ?? EntityRegistry.getLatest(guild.id, 'role');
    if (latestRole) roleIds.push(latestRole.id);
  }

  return {
    channelIds,
    categoryIds,
    roleIds,
    excludedChannelIds,
    bulkDeleteChannelIds,
    everyoneRoleId: guild.id,
  };
}

export function applyExplicitTargets(
  toolName: string,
  args: Record<string, any>,
  targets: ExplicitToolTargets
): { args: Record<string, any>; error?: string } {
  const resolvedArgs = { ...args };

  if (toolName === 'edit_permissions' || toolName === 'bulk_delete_messages' || toolName === 'send_embed') {
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

  if (toolName === 'delete_channels') {
    const requestedIds = targets.bulkDeleteChannelIds.length > 0
      ? targets.bulkDeleteChannelIds
      : targets.channelIds.length > 0
        ? targets.channelIds
        : Array.isArray(resolvedArgs.channelIds)
          ? resolvedArgs.channelIds
          : [];
    resolvedArgs.channelIds = requestedIds.filter(
      (id: string) => !targets.excludedChannelIds.includes(id)
    );
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
  const preservedChannels = targets.excludedChannelIds
    .map((id) => guild.channels.cache.get(id))
    .filter(Boolean)
    .map((channel) => `${channel!.name}:${channel!.id}`);

  if (
    channelTargets.length === 0 &&
    categoryTargets.length === 0 &&
    roleTargets.length === 0 &&
    preservedChannels.length === 0
  ) {
    return undefined;
  }
  return `[RESOLVED_TARGETS|CHANNELS:${channelTargets.join(',') || 'none'}|CATEGORIES:${categoryTargets.join(',') || 'none'}|ROLES:${roleTargets.join(',') || 'none'}|PRESERVE_CHANNELS:${preservedChannels.join(',') || 'none'}|BULK_DELETE_EXCEPT:${targets.bulkDeleteChannelIds.length > 0 ? 'true' : 'false'}]`;
}
