import { PermissionFlagsBits } from 'discord.js';
import { createToolSkill } from '../skill_registry.js';

export default createToolSkill({
  id: 'timeout',
  name: 'Timeout member',
  nameAr: 'تايم أوت عضو',
  category: 'moderation',
  description: 'Temporarily timeout a Discord member.',
  triggers: ['timeout', 'mute'],
  triggersAr: ['تايم اوت', 'ميوت', 'كتم'],
  requiredPermissions: [PermissionFlagsBits.ModerateMembers],
  toolName: 'manage_members',
  mapArgs: (args) => ({ action: 'timeout', memberId: args.memberId, data: args.data ?? { duration: args.duration, reason: args.reason } }),
  schema: {
    type: 'object',
    properties: {
      memberId: { type: 'string' },
      duration: { type: 'number' },
      reason: { type: 'string' },
    },
    required: ['memberId', 'duration'],
  },
  examples: [],
});
