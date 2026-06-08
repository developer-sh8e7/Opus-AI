import { PermissionFlagsBits } from 'discord.js';
import { createToolSkill } from '../skill_registry.js';

export default createToolSkill({
  id: 'nickname',
  name: 'Set member nickname',
  nameAr: 'تغيير لقب عضو',
  category: 'utility',
  description: 'Set or clear a member nickname.',
  descriptionAr: 'تغيير أو مسح لقب عضو.',
  triggers: ['nickname'],
  triggersAr: ['غير لقبه', 'امسح لقبه'],
  requiredPermissions: [PermissionFlagsBits.ManageNicknames],
  toolName: 'manage_members',
  mapArgs: (args) => ({
    action: 'nickname',
    memberId: args.memberId,
    data: { nickname: args.nickname ?? null, reason: args.reason },
  }),
  schema: {
    type: 'object',
    properties: {
      memberId: { type: 'string' },
      nickname: { type: ['string', 'null'] },
      reason: { type: 'string' },
    },
    required: ['memberId'],
  },
  examples: [],
});
