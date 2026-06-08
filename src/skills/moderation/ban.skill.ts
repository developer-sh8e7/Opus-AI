import { PermissionFlagsBits } from 'discord.js';
import { createToolSkill } from '../skill_registry.js';

export default createToolSkill({
  id: 'ban',
  name: 'Ban member',
  nameAr: 'حظر عضو',
  category: 'moderation',
  description: 'Ban a Discord member with an optional reason.',
  triggers: ['ban'],
  triggersAr: ['بان', 'احظر'],
  requiredPermissions: [PermissionFlagsBits.BanMembers],
  toolName: 'manage_members',
  mapArgs: (args) => ({ action: 'ban', memberId: args.memberId, data: args.data ?? { reason: args.reason } }),
  schema: {
    type: 'object',
    properties: { memberId: { type: 'string' }, reason: { type: 'string' } },
    required: ['memberId'],
  },
  examples: [],
});
