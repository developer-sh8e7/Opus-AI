import { PermissionFlagsBits } from 'discord.js';
import { createToolSkill } from '../skill_registry.js';

export default createToolSkill({
  id: 'move_voice',
  name: 'Move voice member',
  nameAr: 'نقل عضو صوتيًا',
  category: 'moderation',
  description: 'Move a connected member to another voice channel.',
  descriptionAr: 'نقل عضو متصل إلى روم صوتي آخر.',
  triggers: ['move member'],
  triggersAr: ['انقل العضو', 'ودّه الروم'],
  requiredPermissions: [PermissionFlagsBits.MoveMembers],
  toolName: 'manage_members',
  mapArgs: (args) => ({
    action: 'move',
    memberId: args.memberId,
    data: { channelId: args.channelId, reason: args.reason },
  }),
  schema: {
    type: 'object',
    properties: {
      memberId: { type: 'string' },
      channelId: { type: 'string' },
      reason: { type: 'string' },
    },
    required: ['memberId', 'channelId'],
  },
  examples: [],
});
