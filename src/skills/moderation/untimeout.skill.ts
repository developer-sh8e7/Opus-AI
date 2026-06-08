import { PermissionFlagsBits } from 'discord.js';
import { createToolSkill } from '../skill_registry.js';

export default createToolSkill({
  id: 'untimeout',
  name: 'Remove timeout',
  nameAr: 'إزالة التايم أوت',
  category: 'moderation',
  description: 'Remove the active timeout from a member.',
  descriptionAr: 'إزالة التايم أوت عن عضو.',
  triggers: ['remove timeout', 'untimeout'],
  triggersAr: ['فك التايم', 'شيل الميوت'],
  requiredPermissions: [PermissionFlagsBits.ModerateMembers],
  toolName: 'manage_members',
  mapArgs: (args) => ({ action: 'untimeout', memberId: args.memberId, data: { reason: args.reason } }),
  schema: {
    type: 'object',
    properties: { memberId: { type: 'string' }, reason: { type: 'string' } },
    required: ['memberId'],
  },
  examples: [],
});
