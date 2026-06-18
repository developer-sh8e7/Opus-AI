import { PermissionFlagsBits } from 'discord.js';
import { createToolSkill } from '../skill_registry.js';

export interface PermissionTemplate {
  name: string;
  nameAr: string;
  allow: string[];
  deny: string[];
}

const PERMISSION_TEMPLATES: PermissionTemplate[] = [
  {
    name: 'view_only',
    nameAr: 'مشاهدة فقط',
    allow: ['ViewChannel', 'ReadMessageHistory'],
    deny: ['SendMessages', 'AddReactions', 'CreatePublicThreads', 'CreatePrivateThreads', 'SendMessagesInThreads'],
  },
  {
    name: 'voice_listen_only',
    nameAr: 'استماع فقط (صوتي)',
    allow: ['Connect', 'ViewChannel'],
    deny: ['Speak', 'Stream', 'Video', 'UseVoiceActivity'],
  },
  {
    name: 'voice_full_access',
    nameAr: 'صلاحيات صوتية كاملة',
    allow: ['Connect', 'Speak', 'Stream', 'Video', 'UseVoiceActivity'],
    deny: ['MuteMembers', 'DeafenMembers', 'MoveMembers'],
  },
  {
    name: 'text_only_no_mention',
    nameAr: 'كتابة بدون منشن',
    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'AddReactions'],
    deny: ['MentionEveryone'],
  },
  {
    name: 'private_channel',
    nameAr: 'قناة خاصة',
    allow: [],
    deny: ['ViewChannel'],
  },
  {
    name: 'moderator_voice',
    nameAr: 'مشرف صوتي',
    allow: ['Connect', 'Speak', 'Stream', 'MuteMembers', 'DeafenMembers', 'MoveMembers', 'ViewChannel'],
    deny: [],
  },
];

/**
 * Quick permission template skill — apply predefined permission setups
 */
const skill = createToolSkill({
  id: 'permission_templates',
  name: 'Permission templates',
  nameAr: 'قوالب الصلاحيات',
  category: 'permissions',
  description: 'Apply a predefined permission template to a channel. Available: view_only, voice_listen_only, voice_full_access, text_only_no_mention, private_channel, moderator_voice.',
  triggers: ['permission template', 'template', 'quick permissions'],
  triggersAr: ['قالب صلاحيات', 'نموذج صلاحيات', 'صلاحيات جاهزة'],
  requiredPermissions: [PermissionFlagsBits.ManageChannels],
  toolName: 'edit_permissions',
  mapArgs: (args) => args,
  schema: {
    type: 'object',
    properties: {
      channelId: { type: 'string', description: 'Channel ID' },
      targetId: { type: 'string', description: 'Role or member ID' },
      targetType: { type: 'string', enum: ['role', 'member'] },
      template: { type: 'string', enum: ['view_only', 'voice_listen_only', 'voice_full_access', 'text_only_no_mention', 'private_channel', 'moderator_voice'] },
      allow: { type: 'array', items: { type: 'string' } },
      deny: { type: 'array', items: { type: 'string' } },
    },
    required: ['channelId', 'targetId', 'targetType'],
  },
  examples: [{
    input: 'حط صلاحيات مشاهدة فقط لرتبة مشتري في روم المنتجات',
    args: { channelId: '123', targetId: '456', targetType: 'role', template: 'view_only' },
  }],
});

export default skill;

/** Look up a template by Arabic or English name */
export function findTemplate(name: string): PermissionTemplate | undefined {
  const normalized = name.replace(/[^a-zA-Z\u0600-\u06FF]/g, '').toLowerCase();
  return PERMISSION_TEMPLATES.find(
    (t) => t.name.toLowerCase() === normalized || t.nameAr.includes(normalized.replace(/\s/g, ''))
  );
}
