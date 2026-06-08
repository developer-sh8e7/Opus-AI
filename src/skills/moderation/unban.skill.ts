import { PermissionFlagsBits } from 'discord.js';
import { createToolSkill } from '../skill_registry.js';

export default createToolSkill({
  id: 'unban',
  name: 'Unban user',
  nameAr: 'فك حظر مستخدم',
  category: 'moderation',
  description: 'Remove a guild ban by user ID.',
  descriptionAr: 'فك حظر مستخدم بواسطة الآيدي.',
  triggers: ['unban'],
  triggersAr: ['فك البان', 'فك الحظر'],
  requiredPermissions: [PermissionFlagsBits.BanMembers],
  toolName: 'manage_members',
  mapArgs: (args) => ({ action: 'unban', memberId: args.memberId, data: { reason: args.reason } }),
  schema: {
    type: 'object',
    properties: { memberId: { type: 'string' }, reason: { type: 'string' } },
    required: ['memberId'],
  },
  examples: [],
});
