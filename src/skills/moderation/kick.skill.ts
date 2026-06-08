import { PermissionFlagsBits } from 'discord.js';
import { createToolSkill } from '../skill_registry.js';

export default createToolSkill({
  id: 'kick',
  name: 'Kick member',
  nameAr: 'طرد عضو',
  category: 'moderation',
  description: 'Kick a Discord member with an optional reason.',
  triggers: ['kick'],
  triggersAr: ['كيك', 'اطرد'],
  requiredPermissions: [PermissionFlagsBits.KickMembers],
  toolName: 'manage_members',
  mapArgs: (args) => ({ action: 'kick', memberId: args.memberId, data: args.data ?? { reason: args.reason } }),
  schema: {
    type: 'object',
    properties: { memberId: { type: 'string' }, reason: { type: 'string' } },
    required: ['memberId'],
  },
  examples: [],
});
