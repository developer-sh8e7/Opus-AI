import { PermissionFlagsBits } from 'discord.js';
import { createToolSkill } from '../skill_registry.js';

export default createToolSkill({
  id: 'voicekick',
  name: 'Disconnect voice member',
  nameAr: 'فصل عضو من الفويس',
  category: 'moderation',
  description: 'Disconnect a member from their current voice channel.',
  descriptionAr: 'فصل عضو من الروم الصوتي الحالي.',
  triggers: ['voice kick', 'disconnect member'],
  triggersAr: ['طلعه من الفويس', 'افصله من الروم'],
  requiredPermissions: [PermissionFlagsBits.MoveMembers],
  toolName: 'manage_members',
  mapArgs: (args) => ({ action: 'voicekick', memberId: args.memberId, data: { reason: args.reason } }),
  schema: {
    type: 'object',
    properties: { memberId: { type: 'string' }, reason: { type: 'string' } },
    required: ['memberId'],
  },
  examples: [],
});
