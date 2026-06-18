import { PermissionFlagsBits } from 'discord.js';
import { createToolSkill } from '../skill_registry.js';

/**
 * Voice management skill — handles compound voice operations
 * like "اطرد X من الروم وحدد الروم لـ 3 اشخاص"
 */
export default createToolSkill({
  id: 'voice_manage',
  name: 'Voice channel manager',
  nameAr: 'إدارة الرومات الصوتية',
  category: 'voice_management',
  description: 'Manage voice channels: kick members, set user limits, configure permissions.',
  triggers: ['voice', 'voicekick', 'disconnect', 'user limit'],
  triggersAr: ['فويس', 'صوتي', 'دسكونكت', 'دسكنوكت', 'ديسكونكت', 'اطرد من الروم', 'حد الروم', 'عدد الاشخاص'],
  requiredPermissions: [PermissionFlagsBits.MoveMembers, PermissionFlagsBits.MuteMembers],
  toolName: 'manage_members',
  mapArgs: (args) => args,
  schema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['voicekick', 'move', 'deafen', 'mute_voice'] },
      memberId: { type: 'string', description: 'Discord user ID to act on' },
      channelId: { type: 'string', description: 'Voice channel ID for move actions' },
      data: { type: 'object', properties: { reason: { type: 'string' }, channelId: { type: 'string' } } },
    },
    required: ['action', 'memberId'],
  },
  examples: [],
});
