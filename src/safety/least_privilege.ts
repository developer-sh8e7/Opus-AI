import { Guild, PermissionFlagsBits } from 'discord.js';
import { PRODUCT_NAME } from '../branding.js';
import { permissionArabicNames, permissionMap } from '../utils/discordTools.js';

export interface FeatureRequirement {
  feature: string;
  featureAr: string;
  permissions: bigint[];
  scopes: string[];
  intents: string[];
  notes: string[];
}

export const FEATURE_REQUIREMENTS: Record<string, FeatureRequirement> = {
  create_channels: {
    feature: 'Create channels',
    featureAr: 'إنشاء رومات',
    permissions: [PermissionFlagsBits.ManageChannels],
    scopes: ['bot'],
    intents: ['Guilds'],
    notes: ['إذا بتنشئ داخل كاتقوري، لازم البوت يقدر يشوف الكاتقوري.'],
  },
  edit_permissions: {
    feature: 'Edit channel permissions',
    featureAr: 'تعديل صلاحيات الرومات',
    permissions: [PermissionFlagsBits.ManageRoles, PermissionFlagsBits.ViewChannel],
    scopes: ['bot'],
    intents: ['Guilds'],
    notes: ['رتبة البوت لازم تكون أعلى من الرتبة التي تريد تعديل Overwrite لها.'],
  },
  manage_roles: {
    feature: 'Manage roles',
    featureAr: 'إدارة الرتب',
    permissions: [PermissionFlagsBits.ManageRoles],
    scopes: ['bot'],
    intents: ['Guilds', 'GuildMembers عند منح/سحب رتبة من عضو'],
    notes: ['لا تستخدم Administrator افتراضيًا؛ ارفع رتبة البوت فوق الرتب المستهدفة.'],
  },
  moderation: {
    feature: 'Moderation',
    featureAr: 'الإشراف والعقوبات',
    permissions: [PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers, PermissionFlagsBits.ModerateMembers],
    scopes: ['bot'],
    intents: ['Guilds', 'GuildMembers', 'GuildModeration'],
    notes: ['الحظر/الطرد/التايم أوت يحتاج موافقة بشرية داخل HumanGuard AI.'],
  },
  messages: {
    feature: 'Message management',
    featureAr: 'حذف/إدارة الرسائل',
    permissions: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
    scopes: ['bot'],
    intents: ['Guilds', 'GuildMessages', 'MessageContent فقط إذا تبي أوامر نصية بدون Slash Commands'],
    notes: ['Slash commands تحتاج scope applications.commands عند تفعيلها لاحقًا.'],
  },
  bot_nickname: {
    feature: 'Bot nickname',
    featureAr: 'تغيير لقب البوت',
    permissions: [PermissionFlagsBits.ChangeNickname],
    scopes: ['bot'],
    intents: ['Guilds'],
    notes: ['إذا فشل تغيير اللقب، تأكد أن الروم/السيرفر يسمح للبوت بتغيير لقبه.'],
  },
};

function permissionName(bit: bigint): string {
  return Object.entries(permissionMap).find(([, value]) => value === bit)?.[0] ?? String(bit);
}

function formatPermission(bit: bigint): string {
  const name = permissionName(bit);
  return permissionArabicNames[name] ? `${name} (${permissionArabicNames[name]})` : name;
}

export async function buildLeastPrivilegeReport(guild: Guild, featureKey = 'create_channels', categoryId?: string): Promise<string> {
  const requirement = FEATURE_REQUIREMENTS[featureKey] ?? FEATURE_REQUIREMENTS.create_channels;
  const botMember = guild.members.me || (guild.client.user ? await guild.members.fetch(guild.client.user.id).catch(() => null) : null);
  const category = categoryId ? guild.channels.cache.get(categoryId) : undefined;
  const lines = [
    `ميزة: ${requirement.featureAr}`,
    '',
    'المطلوب بدون Administrator:',
    ...requirement.permissions.map((permission) => `- ${formatPermission(permission)}`),
    `- OAuth scope: ${requirement.scopes.join(' + ')}`,
    `- Gateway intents: ${requirement.intents.join('، ')}`,
    '',
    'الحالة الحالية:',
  ];

  if (!botMember) {
    lines.push(`- عضوية ${PRODUCT_NAME}: غير موجودة/غير محملة`);
  } else {
    for (const permission of requirement.permissions) {
      const ok = botMember.permissions.has(PermissionFlagsBits.Administrator) || botMember.permissions.has(permission);
      lines.push(`- ${formatPermission(permission)}: ${ok ? 'نعم' : 'لا'}`);
    }
  }

  if (categoryId) {
    if (!category) {
      lines.push(`- وصول الكاتقوري ${categoryId}: لا، غير موجود أو غير محمل`);
    } else if (botMember && 'permissionsFor' in category) {
      const canView = Boolean(category.permissionsFor(botMember)?.has(PermissionFlagsBits.ViewChannel));
      lines.push(`- وصول الكاتقوري "${category.name}": ${canView ? 'نعم' : 'لا'}`);
    }
  }

  lines.push('', 'الحل المقترح:', `1. افتح Server Settings > Roles > ${PRODUCT_NAME}.`);
  requirement.permissions.forEach((permission, index) => {
    lines.push(`${index + 2}. فعّل ${formatPermission(permission)} إذا كانت مفقودة.`);
  });
  lines.push(`${requirement.permissions.length + 2}. لا تعطِ Administrator إلا إذا طلبت ذلك صراحة لاحقًا.`);
  for (const note of requirement.notes) lines.push(`- ملاحظة: ${note}`);

  return lines.join('\n');
}
