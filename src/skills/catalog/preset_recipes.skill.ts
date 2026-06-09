import { PermissionFlagsBits } from 'discord.js';
import type {
  SkillCategory,
  SkillDefinition,
  SkillParams,
  SkillResult,
} from '../skill_registry.js';
import { SkillRegistry } from '../skill_registry.js';

interface RecipeConfig {
  id: string;
  name: string;
  nameAr: string;
  category: SkillCategory;
  toolName: string;
  preset: Record<string, any>;
  requiredPermission: bigint;
  triggers: string[];
  triggersAr: string[];
}

function mergeArgs(
  preset: Record<string, any>,
  args: Record<string, any>
): Record<string, any> {
  const merged = { ...preset, ...args };
  if (preset.data || args.data) merged.data = { ...preset.data, ...args.data };
  if (preset.roleData || args.roleData) {
    merged.roleData = { ...preset.roleData, ...args.roleData };
  }
  return merged;
}

function createRecipe(config: RecipeConfig): SkillDefinition {
  return {
    id: config.id,
    name: config.name,
    nameAr: config.nameAr,
    category: config.category,
    description: `Executable preset: ${config.name}.`,
    descriptionAr: `وصفة تنفيذية جاهزة: ${config.nameAr}.`,
    triggers: config.triggers,
    triggersAr: config.triggersAr,
    requiredPermissions: [config.requiredPermission],
    schema: {
      type: 'object',
      properties: {
        channelId: { type: 'string' },
        memberId: { type: 'string' },
        roleId: { type: 'string' },
        description: { type: 'string' },
        title: { type: 'string' },
        reason: { type: 'string' },
      },
      additionalProperties: true,
    },
    examples: [],
    execute: (params: SkillParams): Promise<SkillResult> =>
      SkillRegistry.executeToolAdapter(
        config.toolName,
        mergeArgs(config.preset, params.args),
        params
      ),
  };
}

const recipes: SkillDefinition[] = [];

for (let count = 1; count <= 100; count++) {
  recipes.push(createRecipe({
    id: `preset_purge_${count}`,
    name: `Purge ${count} messages`,
    nameAr: `حذف ${count} رسالة`,
    category: 'moderation',
    toolName: 'bulk_delete_messages',
    preset: { count },
    requiredPermission: PermissionFlagsBits.ManageMessages,
    triggers: [`purge ${count}`, `delete ${count} messages`, String(count)],
    triggersAr: [`احذف ${count} رسالة`, `امسح ${count}`, String(count)],
  }));
}

for (let minutes = 5; minutes <= 300; minutes += 5) {
  recipes.push(createRecipe({
    id: `preset_timeout_${minutes}m`,
    name: `Timeout ${minutes} minutes`,
    nameAr: `تايم أوت ${minutes} دقيقة`,
    category: 'moderation',
    toolName: 'manage_members',
    preset: { action: 'timeout', data: { duration: minutes * 60_000 } },
    requiredPermission: PermissionFlagsBits.ModerateMembers,
    triggers: [`timeout ${minutes} minutes`, `${minutes}m timeout`, String(minutes)],
    triggersAr: [`تايم اوت ${minutes} دقيقة`, `كتم ${minutes} دقيقة`, String(minutes)],
  }));
}

const slowmodeSeconds = [
  0, 5, 10, 15, 30, 45, 60, 90, 120, 180, 300, 420, 600,
  900, 1200, 1800, 2700, 3600, 5400, 7200, 10800, 14400,
  18000, 21600, 21600,
];
slowmodeSeconds.forEach((duration, index) => {
  recipes.push(createRecipe({
    id: `preset_slowmode_${duration}_${index}`,
    name: `Slowmode ${duration} seconds`,
    nameAr: `سلومود ${duration} ثانية`,
    category: 'channel_management',
    toolName: 'channel_operations',
    preset: { action: 'channel_set_slowmode', duration },
    requiredPermission: PermissionFlagsBits.ManageChannels,
    triggers: [`slowmode ${duration}`, `${duration} seconds slowmode`, String(duration)],
    triggersAr: [`سلومود ${duration}`, `تأخير ${duration} ثانية`, String(duration)],
  }));
});

for (let volume = 0; volume <= 200; volume += 5) {
  recipes.push(createRecipe({
    id: `preset_volume_${volume}`,
    name: `Set volume ${volume}`,
    nameAr: `صوت ${volume}`,
    category: 'music',
    toolName: 'set_volume',
    preset: { volume },
    requiredPermission: PermissionFlagsBits.Connect,
    triggers: [`volume ${volume}`, `set volume ${volume}`, String(volume)],
    triggersAr: [`الصوت ${volume}`, `ارفع الصوت ${volume}`, String(volume)],
  }));
}

const roleColors = [
  '#ED4245', '#FEE75C', '#57F287', '#5865F2', '#EB459E',
  '#FFFFFF', '#000000', '#95A5A6', '#607D8B', '#1ABC9C',
  '#11806A', '#2ECC71', '#1F8B4C', '#3498DB', '#206694',
  '#9B59B6', '#71368A', '#E91E63', '#AD1457', '#F1C40F',
  '#C27C0E', '#E67E22', '#A84300', '#E74C3C', '#992D22',
  '#979C9F', '#7F8C8D', '#BCC0C0', '#34495E', '#2C3E50',
  '#D4AF37', '#C0C0C0', '#CD7F32', '#00FFFF', '#FF00FF',
  '#7FFF00', '#FF7F50', '#4B0082', '#40E0D0', '#DC143C',
];
roleColors.forEach((color, index) => {
  recipes.push(createRecipe({
    id: `preset_role_color_${index + 1}`,
    name: `Role color ${color}`,
    nameAr: `لون رتبة ${color}`,
    category: 'role_management',
    toolName: 'role_operations',
    preset: { action: 'role_set_color', color },
    requiredPermission: PermissionFlagsBits.ManageRoles,
    triggers: [`role color ${color}`, `color ${index + 1}`, color],
    triggersAr: [`لون الرتبة ${color}`, `لون ${index + 1}`, color],
  }));
});

for (let value = 0; value <= 50; value++) {
  recipes.push(createRecipe({
    id: `preset_voice_limit_${value}`,
    name: `Voice user limit ${value}`,
    nameAr: `حد الفويس ${value}`,
    category: 'voice_management',
    toolName: 'channel_operations',
    preset: { action: 'voice_set_user_limit', value },
    requiredPermission: PermissionFlagsBits.ManageChannels,
    triggers: [`voice limit ${value}`, `user limit ${value}`, String(value)],
    triggersAr: [`حد الفويس ${value}`, `عدد الفويس ${value}`, String(value)],
  }));
}

for (let value = 8_000; value <= 96_000; value += 4_000) {
  recipes.push(createRecipe({
    id: `preset_voice_bitrate_${value}`,
    name: `Voice bitrate ${value}`,
    nameAr: `جودة فويس ${value}`,
    category: 'voice_management',
    toolName: 'channel_operations',
    preset: { action: 'voice_set_bitrate', value },
    requiredPermission: PermissionFlagsBits.ManageChannels,
    triggers: [`voice bitrate ${value}`, `bitrate ${value}`, String(value)],
    triggersAr: [`جودة الفويس ${value}`, `بت ريت ${value}`, String(value)],
  }));
}

for (let mentionTotalLimit = 1; mentionTotalLimit <= 50; mentionTotalLimit++) {
  recipes.push(createRecipe({
    id: `preset_automod_mentions_${mentionTotalLimit}`,
    name: `AutoMod mention limit ${mentionTotalLimit}`,
    nameAr: `حد منشنات AutoMod ${mentionTotalLimit}`,
    category: 'anti_spam',
    toolName: 'automod_operations',
    preset: {
      action: 'automod_create_mention_spam',
      mentionTotalLimit,
      name: `Opus Mention Limit ${mentionTotalLimit}`,
    },
    requiredPermission: PermissionFlagsBits.ManageGuild,
    triggers: [`automod mention limit ${mentionTotalLimit}`, String(mentionTotalLimit)],
    triggersAr: [`اوتو مود منشن ${mentionTotalLimit}`, `حد المنشن ${mentionTotalLimit}`, String(mentionTotalLimit)],
  }));
}

[60, 1440, 4320, 10080].forEach((duration) => {
  recipes.push(createRecipe({
    id: `preset_thread_archive_${duration}`,
    name: `Thread archive ${duration} minutes`,
    nameAr: `أرشفة الثريد ${duration} دقيقة`,
    category: 'channel_management',
    toolName: 'channel_operations',
    preset: { action: 'channel_set_default_archive', duration },
    requiredPermission: PermissionFlagsBits.ManageChannels,
    triggers: [`thread archive ${duration}`, String(duration)],
    triggersAr: [`ارشفة الثريد ${duration}`, String(duration)],
  }));
});

const embedColors = roleColors.slice(0, 30);
embedColors.forEach((color, index) => {
  recipes.push(createRecipe({
    id: `preset_embed_theme_${index + 1}`,
    name: `Embed theme ${index + 1}`,
    nameAr: `ثيم إيمبد ${index + 1}`,
    category: 'community',
    toolName: 'send_embed',
    preset: { color },
    requiredPermission: PermissionFlagsBits.ManageMessages,
    triggers: [`embed theme ${index + 1}`, color, String(index + 1)],
    triggersAr: [`ثيم ايمبد ${index + 1}`, `لون ايمبد ${color}`, String(index + 1)],
  }));
});

export default recipes;
