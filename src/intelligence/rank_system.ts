/**
 * ════════════════════════════════════════════════════════════════
 *  نظام الرتب والمستويات المتطور — Advanced Rank & Leveling System
 *  يربط نظام المستويات برتب ديسكورد فعلية، مع حفظ الإعدادات
 *  يدعم نظام الصلاحيات المتدرج والكافاءات حسب الرتبة
 * ════════════════════════════════════════════════════════════════
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Guild, GuildMember } from 'discord.js';

export type RankTier = 
  | 'newcomer'      // مستخدم جديد
  | 'member'        // عضو عادي
  | 'active'        // عضو نشط
  | 'trusted'       // عضو موثوق
  | 'veteran'       // عضو قديم
  | 'elite'         // عضو مميز
  | 'champion'      // بطل
  | 'legend'        // أسطورة
  | 'moderator'     // مشرف
  | 'admin'         // مدير
  | 'owner';        // المالك

export interface RankPermissions {
  /** Can use basic music commands */
  canPlayMusic: boolean;
  /** Can create channels */
  canCreateChannels: boolean;
  /** Can delete channels */
  canDeleteChannels: boolean;
  /** Can manage roles */
  canManageRoles: boolean;
  /** Can kick members */
  canKickMembers: boolean;
  /** Can ban members */
  canBanMembers: boolean;
  /** Can timeout members */
  canTimeoutMembers: boolean;
  /** Can build servers */
  canBuildServer: boolean;
  /** Can change bot nickname */
  canChangeBotName: boolean;
  /** Max channels per command */
  maxChannelsPerCommand: number;
  /** Max roles per command */
  maxRolesPerCommand: number;
  /** XP multiplier */
  xpMultiplier: number;
  /** Custom title display */
  titleAr: string;
  titleEn: string;
}

export interface RankConfig {
  tier: RankTier;
  /** Minimum XP required */
  minXp: number;
  /** Discord role IDs to assign */
  roleIds: string[];
  /** Permissions for this rank */
  permissions: RankPermissions;
}

export interface LevelRoleConfig {
  /** Minimum level required */
  level: number;
  /** Discord role ID to assign */
  roleId: string;
}

export interface GuildRankConfig {
  guildId: string;
  levelRoles: LevelRoleConfig[];
  /** Channel ID where level-up messages are sent (empty = same channel) */
  levelUpChannelId?: string;
  /** Whether to announce level-ups */
  announceLevelUps: boolean;
  /** XP per message */
  xpPerMessage: number;
  /** XP cooldown in ms */
  xpCooldownMs: number;
}

// ═══════════════════════════════════════
//  الإعدادات الافتراضية للرتب والصلاحيات
// ═══════════════════════════════════════

const DEFAULT_RANK_CONFIGS: RankConfig[] = [
  {
    tier: 'newcomer',
    minXp: 0,
    roleIds: [],
    permissions: {
      canPlayMusic: true,
      canCreateChannels: false,
      canDeleteChannels: false,
      canManageRoles: false,
      canKickMembers: false,
      canBanMembers: false,
      canTimeoutMembers: false,
      canBuildServer: false,
      canChangeBotName: false,
      maxChannelsPerCommand: 0,
      maxRolesPerCommand: 0,
      xpMultiplier: 1.0,
      titleAr: 'مستخدم جديد',
      titleEn: 'Newcomer',
    },
  },
  {
    tier: 'member',
    minXp: 100,
    roleIds: [],
    permissions: {
      canPlayMusic: true,
      canCreateChannels: false,
      canDeleteChannels: false,
      canManageRoles: false,
      canKickMembers: false,
      canBanMembers: false,
      canTimeoutMembers: false,
      canBuildServer: false,
      canChangeBotName: false,
      maxChannelsPerCommand: 0,
      maxRolesPerCommand: 0,
      xpMultiplier: 1.0,
      titleAr: 'عضو',
      titleEn: 'Member',
    },
  },
  {
    tier: 'active',
    minXp: 500,
    roleIds: [],
    permissions: {
      canPlayMusic: true,
      canCreateChannels: false,
      canDeleteChannels: false,
      canManageRoles: false,
      canKickMembers: false,
      canBanMembers: false,
      canTimeoutMembers: false,
      canBuildServer: false,
      canChangeBotName: true,
      maxChannelsPerCommand: 0,
      maxRolesPerCommand: 0,
      xpMultiplier: 1.2,
      titleAr: 'عضو نشط',
      titleEn: 'Active Member',
    },
  },
  {
    tier: 'trusted',
    minXp: 1500,
    roleIds: [],
    permissions: {
      canPlayMusic: true,
      canCreateChannels: true,
      canDeleteChannels: false,
      canManageRoles: false,
      canKickMembers: false,
      canBanMembers: false,
      canTimeoutMembers: false,
      canBuildServer: false,
      canChangeBotName: true,
      maxChannelsPerCommand: 2,
      maxRolesPerCommand: 0,
      xpMultiplier: 1.5,
      titleAr: 'عضو موثوق',
      titleEn: 'Trusted Member',
    },
  },
  {
    tier: 'veteran',
    minXp: 3000,
    roleIds: [],
    permissions: {
      canPlayMusic: true,
      canCreateChannels: true,
      canDeleteChannels: false,
      canManageRoles: false,
      canKickMembers: false,
      canBanMembers: false,
      canTimeoutMembers: true,
      canBuildServer: false,
      canChangeBotName: true,
      maxChannelsPerCommand: 3,
      maxRolesPerCommand: 0,
      xpMultiplier: 1.8,
      titleAr: 'عضو قديم',
      titleEn: 'Veteran',
    },
  },
  {
    tier: 'elite',
    minXp: 5000,
    roleIds: [],
    permissions: {
      canPlayMusic: true,
      canCreateChannels: true,
      canDeleteChannels: true,
      canManageRoles: false,
      canKickMembers: true,
      canBanMembers: false,
      canTimeoutMembers: true,
      canBuildServer: true,
      canChangeBotName: true,
      maxChannelsPerCommand: 5,
      maxRolesPerCommand: 1,
      xpMultiplier: 2.0,
      titleAr: 'عضو مميز',
      titleEn: 'Elite Member',
    },
  },
  {
    tier: 'champion',
    minXp: 10000,
    roleIds: [],
    permissions: {
      canPlayMusic: true,
      canCreateChannels: true,
      canDeleteChannels: true,
      canManageRoles: true,
      canKickMembers: true,
      canBanMembers: false,
      canTimeoutMembers: true,
      canBuildServer: true,
      canChangeBotName: true,
      maxChannelsPerCommand: 8,
      maxRolesPerCommand: 3,
      xpMultiplier: 2.5,
      titleAr: 'بطل',
      titleEn: 'Champion',
    },
  },
  {
    tier: 'legend',
    minXp: 25000,
    roleIds: [],
    permissions: {
      canPlayMusic: true,
      canCreateChannels: true,
      canDeleteChannels: true,
      canManageRoles: true,
      canKickMembers: true,
      canBanMembers: true,
      canTimeoutMembers: true,
      canBuildServer: true,
      canChangeBotName: true,
      maxChannelsPerCommand: 10,
      maxRolesPerCommand: 5,
      xpMultiplier: 3.0,
      titleAr: 'أسطورة',
      titleEn: 'Legend',
    },
  },
  {
    tier: 'moderator',
    minXp: 0,
    roleIds: [],
    permissions: {
      canPlayMusic: true,
      canCreateChannels: true,
      canDeleteChannels: true,
      canManageRoles: true,
      canKickMembers: true,
      canBanMembers: true,
      canTimeoutMembers: true,
      canBuildServer: true,
      canChangeBotName: true,
      maxChannelsPerCommand: 15,
      maxRolesPerCommand: 10,
      xpMultiplier: 1.0,
      titleAr: 'مشرف',
      titleEn: 'Moderator',
    },
  },
  {
    tier: 'admin',
    minXp: 0,
    roleIds: [],
    permissions: {
      canPlayMusic: true,
      canCreateChannels: true,
      canDeleteChannels: true,
      canManageRoles: true,
      canKickMembers: true,
      canBanMembers: true,
      canTimeoutMembers: true,
      canBuildServer: true,
      canChangeBotName: true,
      maxChannelsPerCommand: 50,
      maxRolesPerCommand: 20,
      xpMultiplier: 1.0,
      titleAr: 'مدير',
      titleEn: 'Admin',
    },
  },
  {
    tier: 'owner',
    minXp: 0,
    roleIds: [],
    permissions: {
      canPlayMusic: true,
      canCreateChannels: true,
      canDeleteChannels: true,
      canManageRoles: true,
      canKickMembers: true,
      canBanMembers: true,
      canTimeoutMembers: true,
      canBuildServer: true,
      canChangeBotName: true,
      maxChannelsPerCommand: 100,
      maxRolesPerCommand: 100,
      xpMultiplier: 1.0,
      titleAr: 'المالك',
      titleEn: 'Owner',
    },
  },
];

// ═══════════════════════════════════════
//  الإعدادات الثابتة
// ═══════════════════════════════════════
const RANK_CONFIG_PATH = path.join(process.cwd(), 'data', 'rank_config.json');
const USER_XP_PATH = path.join(process.cwd(), 'data', 'user_xp.json');
const guildConfigs = new Map<string, GuildRankConfig>();
const userXpData = new Map<string, { xp: number; lastMessage: number }>();

/** Load rank configurations from disk */
function loadConfigs(): void {
  try {
    if (!fs.existsSync(RANK_CONFIG_PATH)) return;
    const raw = fs.readFileSync(RANK_CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      for (const config of parsed) {
        if (config?.guildId) guildConfigs.set(config.guildId, config);
      }
    }
    console.log(`[RankSystem] Loaded ${guildConfigs.size} guild rank configs.`);
  } catch { /* silently ignore corrupt file */ }
}

/** Save rank configurations to disk */
function saveConfigs(): void {
  try {
    fs.mkdirSync(path.dirname(RANK_CONFIG_PATH), { recursive: true });
    fs.writeFileSync(RANK_CONFIG_PATH, JSON.stringify([...guildConfigs.values()], null, 2), 'utf8');
  } catch { /* silently ignore write errors */ }
}

/** Get or create rank configuration for a guild */
export function getRankConfig(guildId: string): GuildRankConfig {
  if (!guildConfigs.size) loadConfigs();
  let config = guildConfigs.get(guildId);
  if (!config) {
    config = {
      guildId,
      levelRoles: [],
      announceLevelUps: true,
      xpPerMessage: 15,
      xpCooldownMs: 60_000,
    };
    guildConfigs.set(guildId, config);
    saveConfigs();
  }
  return config;
}

/** Set the level-up channel for a guild */
export function setLevelUpChannel(guildId: string, channelId: string): void {
  const config = getRankConfig(guildId);
  config.levelUpChannelId = channelId;
  saveConfigs();
}

/** Add or update a level-to-role mapping */
export function setLevelRole(guildId: string, level: number, roleId: string): void {
  const config = getRankConfig(guildId);
  const existing = config.levelRoles.find((lr) => lr.level === level);
  if (existing) {
    existing.roleId = roleId;
  } else {
    config.levelRoles.push({ level, roleId });
    config.levelRoles.sort((a, b) => a.level - b.level);
  }
  saveConfigs();
}

/** Remove a level-to-role mapping */
export function removeLevelRole(guildId: string, level: number): boolean {
  const config = getRankConfig(guildId);
  const initial = config.levelRoles.length;
  config.levelRoles = config.levelRoles.filter((lr) => lr.level !== level);
  if (config.levelRoles.length !== initial) {
    saveConfigs();
    return true;
  }
  return false;
}

/** Get the highest role for a given level */
export function getRoleForLevel(guildId: string, level: number): string | undefined {
  const config = getRankConfig(guildId);
  let best: LevelRoleConfig | undefined;
  for (const lr of config.levelRoles) {
    if (level >= lr.level) best = lr;
  }
  return best?.roleId;
}

/**
 * Process a level-up: assign roles to the member if configured.
 * Returns the role that was assigned, if any.
 */
export async function processLevelUp(
  guild: Guild,
  memberId: string,
  newLevel: number
): Promise<string | undefined> {
  const config = getRankConfig(guild.id);
  const roleId = getRoleForLevel(guild.id, newLevel);
  if (!roleId) return undefined;

  try {
    const member = guild.members.cache.get(memberId) || await guild.members.fetch(memberId).catch(() => null);
    if (!member) return undefined;

    // Don't assign if they already have the role
    if (member.roles.cache.has(roleId)) return undefined;

    await member.roles.add(roleId, `ترقية تلقائية إلى المستوى ${newLevel}`);
    return roleId;
  } catch {
    return undefined;
  }
}

/**
 * Toggle level-up announcements on/off
 */
export function setAnnounceLevelUps(guildId: string, enabled: boolean): void {
  const config = getRankConfig(guildId);
  config.announceLevelUps = enabled;
  saveConfigs();
}

export function initializeRankSystem(): void {
  loadConfigs();
}
