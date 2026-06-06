import { ChannelType, Guild } from 'discord.js';

export interface ExplicitToolTargets {
  channelIds: string[];
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
  const mentionedChannelIds = [...rawText.matchAll(/<#(\d+)>/g)].map((match) => match[1]);
  const mentionedRoleIds = [...rawText.matchAll(/<@&(\d+)>/g)].map((match) => match[1]);

  const namedChannels = guild.channels.cache
    .filter((channel) => channel.type !== ChannelType.GuildCategory)
    .map((channel) => ({ id: channel.id, name: channel.name }));
  const namedRoles = guild.roles.cache
    .filter((role) => role.id !== guild.id)
    .map((role) => ({ id: role.id, name: role.name }));

  return {
    channelIds: unique([...mentionedChannelIds, ...findNamedMatches(rawText, namedChannels)]),
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
      return { args: resolvedArgs, error: 'تم العثور على أكثر من روم مطابق. منشن الروم المطلوب بشكل مباشر.' };
    }
    if (targets.channelIds.length === 1) {
      resolvedArgs.channelId = targets.channelIds[0];
    }
  }

  if (toolName === 'edit_permissions') {
    if (targets.roleIds.length > 1) {
      return { args: resolvedArgs, error: 'تم العثور على أكثر من رتبة مطابقة. منشن الرتبة المطلوبة بشكل مباشر.' };
    }
    if (targets.roleIds.length === 1) {
      const targetsEveryone = resolvedArgs.targetId === '@everyone' ||
        resolvedArgs.targetId === targets.everyoneRoleId;
      if (!targetsEveryone) {
        resolvedArgs.targetId = targets.roleIds[0];
      }
      resolvedArgs.targetType = 'role';
    }
  }

  if (toolName === 'delete_channels' && targets.channelIds.length > 0) {
    resolvedArgs.channelIds = targets.channelIds;
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
  const roleTargets = targets.roleIds
    .map((id) => guild.roles.cache.get(id))
    .filter(Boolean)
    .map((role) => `${role!.name}:${role!.id}`);

  if (channelTargets.length === 0 && roleTargets.length === 0) return undefined;
  return `[EXPLICIT_TARGETS|CHANNELS:${channelTargets.join(',') || 'none'}|ROLES:${roleTargets.join(',') || 'none'}]`;
}
