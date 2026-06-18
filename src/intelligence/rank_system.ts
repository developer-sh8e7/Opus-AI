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

export interface RankRewards {
  /** Role color for this rank (hex) */
  roleColor?: string;
  /** Special channel access */
  specialChannelIds?: string[];
  /** Custom emoji for rank display */
  displayEmoji?: string;
  /** Badge/achievement name */
  badge?: string;
  /** One-time reward message */
  rewardMessage?: string;
}

export interface RankConfig {
  tier: RankTier;
  /** Minimum XP required */
  minXp: number;
  /** Discord role IDs to assign */
  roleIds: string[];
  /** Permissions for this rank */
  permissions: RankPermissions;
  /** Rewards for this rank */
  rewards?: RankRewards;
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

/** Load user XP data from disk */
function loadUserXp(): void {
  try {
    if (!fs.existsSync(USER_XP_PATH)) return;
    const raw = fs.readFileSync(USER_XP_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (item?.userId) userXpData.set(item.userId, { xp: item.xp || 0, lastMessage: item.lastMessage || 0 });
      }
    }
    console.log(`[RankSystem] Loaded ${userXpData.size} user XP records.`);
  } catch { /* silently ignore corrupt file */ }
}

/** Save rank configurations to disk */
function saveConfigs(): void {
  try {
    fs.mkdirSync(path.dirname(RANK_CONFIG_PATH), { recursive: true });
    fs.writeFileSync(RANK_CONFIG_PATH, JSON.stringify([...guildConfigs.values()], null, 2), 'utf8');
  } catch { /* silently ignore write errors */ }
}

/** Save user XP data to disk */
function saveUserXp(): void {
  try {
    fs.mkdirSync(path.dirname(USER_XP_PATH), { recursive: true });
    const data = Array.from(userXpData.entries()).map(([userId, data]) => ({ userId, ...data }));
    fs.writeFileSync(USER_XP_PATH, JSON.stringify(data, null, 2), 'utf8');
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

// ═══════════════════════════════════════
//  نظام النقاط والترقيات المتقدم
// ═══════════════════════════════════════

/**
 * Calculate XP gain for a message based on user's rank
 */
export function calculateXpGain(userId: string, baseXp: number): number {
  const userData = userXpData.get(userId);
  const now = Date.now();
  
  // Check cooldown (1 minute between messages)
  if (userData && now - userData.lastMessage < 60_000) {
    return 0;
  }
  
  // Get user's current rank for multiplier
  const userRank = getUserRank(userId);
  const multiplier = userRank?.permissions.xpMultiplier ?? 1.0;
  
  // Calculate final XP with multiplier
  const finalXp = Math.floor(baseXp * multiplier);
  
  // Update user data
  if (!userData) {
    userXpData.set(userId, { xp: finalXp, lastMessage: now });
  } else {
    userData.xp += finalXp;
    userData.lastMessage = now;
  }
  
  saveUserXp();
  return finalXp;
}

/**
 * Get user's current XP
 */
export function getUserXp(userId: string): number {
  return userXpData.get(userId)?.xp ?? 0;
}

/**
 * Get user's current rank tier based on XP
 */
export function getUserRankTier(userId: string): RankTier {
  const xp = getUserXp(userId);
  let currentTier: RankTier = 'newcomer';
  
  for (const config of DEFAULT_RANK_CONFIGS) {
    if (xp >= config.minXp) {
      currentTier = config.tier;
    }
  }
  
  return currentTier;
}

/**
 * Get full rank configuration for a user
 */
export function getUserRank(userId: string): RankConfig | undefined {
  const tier = getUserRankTier(userId);
  return DEFAULT_RANK_CONFIGS.find(r => r.tier === tier);
}

/**
 * Get permissions for a user
 */
export function getUserPermissions(userId: string): RankPermissions {
  const rank = getUserRank(userId);
  return rank?.permissions ?? DEFAULT_RANK_CONFIGS[0].permissions;
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(userId: string, permission: keyof RankPermissions): boolean {
  const perms = getUserPermissions(userId);
  const value = perms[permission];
  return typeof value === 'boolean' ? value : true;
}

/**
 * Get XP needed for next rank
 */
export function getXpForNextRank(userId: string): { current: number; needed: number; nextTier: RankTier | null } {
  const currentXp = getUserXp(userId);
  const currentTier = getUserRankTier(userId);
  
  // Find next rank
  const currentIndex = DEFAULT_RANK_CONFIGS.findIndex(r => r.tier === currentTier);
  if (currentIndex === DEFAULT_RANK_CONFIGS.length - 1) {
    return { current: currentXp, needed: 0, nextTier: null };
  }
  
  const nextRank = DEFAULT_RANK_CONFIGS[currentIndex + 1];
  return {
    current: currentXp,
    needed: nextRank.minXp - currentXp,
    nextTier: nextRank.tier,
  };
}

/**
 * Get rank progress bar as emoji string
 */
export function getRankProgressBar(userId: string): string {
  const { current, needed, nextTier } = getXpForNextRank(userId);
  if (!nextTier) return '█████████████ 100% (MAX)';
  
  const total = current + needed;
  const progress = Math.floor((current / total) * 10);
  const filled = '█'.repeat(progress);
  const empty = '░'.repeat(10 - progress);
  
  return `${filled}${empty} ${Math.floor((current / total) * 100)}%`;
}

/**
 * Get all available ranks with their requirements
 */
export function getAllRanks(): RankConfig[] {
  return [...DEFAULT_RANK_CONFIGS];
}

/**
 * Get rank display name in Arabic
 */
export function getRankTitleAr(userId: string): string {
  const rank = getUserRank(userId);
  return rank?.permissions.titleAr ?? 'غير معروف';
}

/**
 * Get rank display name in English
 */
export function getRankTitleEn(userId: string): string {
  const rank = getUserRank(userId);
  return rank?.permissions.titleEn ?? 'Unknown';
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
  loadUserXp();
}
